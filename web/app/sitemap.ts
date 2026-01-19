import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://genoun.com";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Supported locales
const locales = ["ar", "en"] as const;

// Helper to generate alternate language links
function generateAlternates(path: string) {
  return {
    languages: locales.reduce(
      (acc, locale) => ({
        ...acc,
        [locale]: `${BASE_URL}/${locale}${path}`,
      }),
      {} as Record<string, string>
    ),
  };
}

// Fetch functions for dynamic content
async function fetchArticles(): Promise<
  { slug: string; updatedAt: string; language: string }[]
> {
  try {
    const res = await fetch(`${API_URL}/articles?status=published&limit=100`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    if (!res.ok) return [];
    const data = await res.json();
    const articles = data.data?.results || data.articles || data.data || [];
    return articles.map((a: any) => ({
      slug: a.slug,
      updatedAt: a.updatedAt || a.createdAt || new Date().toISOString(),
      language: a.language || "ar",
    }));
  } catch (error) {
    console.error("Error fetching articles for sitemap:", error);
    return [];
  }
}

async function fetchProducts(): Promise<{ slug: string; updatedAt: string }[]> {
  try {
    const res = await fetch(`${API_URL}/products?isActive=true&limit=100`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const products = data.data?.results || data.products || data.data || [];
    return products.map((p: any) => ({
      slug: p.slug,
      updatedAt: p.updatedAt || p.createdAt || new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching products for sitemap:", error);
    return [];
  }
}

async function fetchServices(): Promise<{ slug: string; updatedAt: string }[]> {
  try {
    const res = await fetch(`${API_URL}/services?isActive=true&limit=100`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const services = data.data?.results || data.services || data.data || [];
    return services.map((s: any) => ({
      slug: s.slug,
      updatedAt: s.updatedAt || s.createdAt || new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching services for sitemap:", error);
    return [];
  }
}

/**
 * Dynamic sitemap generation
 * Includes all locales, static pages, articles, products, and services
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  // Fetch all dynamic content in parallel
  const [articles, products, services] = await Promise.all([
    fetchArticles(),
    fetchProducts(),
    fetchServices(),
  ]);

  // Static pages for each locale
  const staticPages = [
    "", // Home
    "/products",
    "/services",
    "/articles",
    "/about",
    "/contact",
    "/pricing",
  ];

  // Generate static pages for all locales
  const staticUrls: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    staticPages.map((page) => ({
      url: `${BASE_URL}/${locale}${page}`,
      lastModified: now,
      changeFrequency: page === "" ? "daily" : ("weekly" as const),
      priority: page === "" ? 1 : 0.8,
      alternates: generateAlternates(page),
    }))
  );

  // Generate article URLs with language-specific routing
  const articleUrls: MetadataRoute.Sitemap = articles.flatMap((article) => {
    // Article is available in its designated language locale
    const locale = article.language === "en" ? "en" : "ar";
    return {
      url: `${BASE_URL}/${locale}/articles/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    };
  });

  // Generate product URLs for all locales (products are bilingual)
  const productUrls: MetadataRoute.Sitemap = products.flatMap((product) =>
    locales.map((locale) => ({
      url: `${BASE_URL}/${locale}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: generateAlternates(`/products/${product.slug}`),
    }))
  );

  // Generate service URLs for all locales (services are bilingual)
  const serviceUrls: MetadataRoute.Sitemap = services.flatMap((service) =>
    locales.map((locale) => ({
      url: `${BASE_URL}/${locale}/services/${service.slug}`,
      lastModified: service.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      alternates: generateAlternates(`/services/${service.slug}`),
    }))
  );

  // Combine all URLs
  return [...staticUrls, ...articleUrls, ...productUrls, ...serviceUrls];
}
