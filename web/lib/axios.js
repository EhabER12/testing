import axios from "axios";
import NProgress from "nprogress";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const apiUrl = baseURL;

const axiosInstance = axios.create({
  baseURL: apiUrl,
  timeout: 120000, // 120 seconds timeout for AI operations
});

axiosInstance.interceptors.request.use(
  (config) => {
    // Start loading bar for non-background requests
    if (!config.headers?.["X-No-Loading"]) {
      NProgress.start();
    }

    // Initialize retry count
    config._retryCount = config._retryCount || 0;

    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }

    if (typeof window !== "undefined") {
      try {
        const userString = localStorage.getItem("user");
        if (userString) {
          const user = JSON.parse(userString);
          if (user && user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
          }
        }
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
      }
    }
    return config;
  },
  (error) => {
    NProgress.done();
    return Promise.reject(error);
  }
);

// Combined response interceptor: retry logic + 401 handling
axiosInstance.interceptors.response.use(
  (response) => {
    NProgress.done();
    return response;
  },
  async (error) => {
    NProgress.done();
    const config = error.config;

    // Handle 401 - unauthorized
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        const isCheckoutRelated =
          window.location.pathname.startsWith("/checkout") ||
          window.location.pathname.startsWith("/trips");

        if (
          !window.location.pathname.startsWith("/login") &&
          !isCheckoutRelated
        ) {
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    }

    // Retry logic for network errors or 5xx errors - but NOT for POST requests to prevent duplicates
    const shouldRetry =
      config &&
      !config._retry &&
      config._retryCount < 2 &&
      config.method !== "post" && // Don't retry POST requests to prevent duplicate submissions
      (error.code === "ECONNABORTED" ||
        error.code === "ERR_NETWORK" ||
        error.message === "Network Error" ||
        (error.response && error.response.status >= 500));

    if (shouldRetry) {
      config._retry = true;
      config._retryCount = (config._retryCount || 0) + 1;

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * config._retryCount)
      );

      console.log(
        `Retrying request (attempt ${config._retryCount}):`,
        config.url
      );
      return axiosInstance(config);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
