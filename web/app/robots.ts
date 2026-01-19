import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://genoun.com";

/**
 * Robots.txt configuration
 * Simple and effective - Googlebot discovers content naturally
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/api", "/login", "/complete-registration"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
