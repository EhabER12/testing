export const getFullUploadUrl = (path: string) => {
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path; // Already a full URL
  }
  if (path.startsWith("/uploads/")) {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const baseUrl = apiUrl.replace("/api", ""); // Remove /api from the end
    return `${baseUrl}${path}`;
  }
  return path;
};

export const getAuthHeaders = () => {
  const userString = localStorage.getItem("user");
  if (!userString) return {};

  const user = JSON.parse(userString);
  const token = user?.token;

  if (!token) return {};

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const convertToFullUrl = (value: any): string => {
  const stringValue = String(value);
  if (
    stringValue.startsWith("/uploads") ||
    stringValue.startsWith("uploads/")
  ) {
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const baseUrl = apiBaseUrl.replace("/api", ""); // Remove /api from the end
    const cleanPath = stringValue.startsWith("/")
      ? stringValue
      : `/${stringValue}`;
    return `${baseUrl}${cleanPath}`;
  }
  return stringValue;
};

export const normalizeOrigin = (origin = "") => origin.replace(/\/$/, "");
