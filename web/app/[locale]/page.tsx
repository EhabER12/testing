import { getLocale } from "next-intl/server";
import HomeClient from "./HomeClient";

// API base URL for server-side fetch
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Fetch featured products with categories
async function getProductsData() {
  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetch(`${API_BASE}/products?active=true&limit=20`, {
        next: { revalidate: 300 }, // Cache for 5 minutes (ISR)
      }),
      fetch(`${API_BASE}/categories?active=true`, {
        next: { revalidate: 300 }, // Cache for 5 minutes (ISR)
      }),
    ]);

    const productsData = await productsRes.json();
    const categoriesData = await categoriesRes.json();

    return {
      products: productsData.products || productsData.data || [],
      categories: categoriesData.categories || categoriesData.data || [],
    };
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return { products: [], categories: [] };
  }
}

// Fetch approved reviews
async function getReviewsData() {
  try {
    const res = await fetch(`${API_BASE}/reviews?status=approved`, {
      next: { revalidate: 300 }, // Cache for 5 minutes (ISR)
    });
    const data = await res.json();
    const reviews = data.data.results;

    if (!Array.isArray(reviews)) {
      console.warn("Reviews data is not an array:", typeof reviews);
      return [];
    }

    return reviews.map((r: any) => ({
      ...r,
      id: r.id || r._id,
      comment: r.comment || r.review || "",
    }));
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return [];
  }
}

// Fetch public settings
async function getSettingsData() {
  try {
    const res = await fetch(`${API_BASE}/settings/public`, {
      next: { 
        revalidate: 60, // Cache for 1 minute (reduced from 10 minutes)
        tags: ['settings'] // Add cache tag for targeted revalidation
      },
      cache: 'no-store', // Disable Next.js caching, rely on API cache headers
    });
    const data = await res.json();
    return data.settings || data.data || null;
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return null;
  }
}

// Fetch published articles for current locale
async function getArticlesData(locale: string) {
  try {
    const res = await fetch(
      `${API_BASE}/articles?status=published&language=${locale}&limit=6`,
      { next: { revalidate: 300 } } // Cache for 5 minutes (ISR)
    );
    const data = await res.json();
    const articles = data.data?.results || data.results || [];

    return articles.map((a: any) => ({
      ...a,
      id: a.id || a._id,
    }));
  } catch (error) {
    console.error("Failed to fetch articles:", error);
    return [];
  }
}

export default async function Home() {
  const locale = await getLocale();

  // Fetch all data server-side in parallel
  const [{ products, categories }, reviews, settings, articles] =
    await Promise.all([
      getProductsData(),
      getReviewsData(),
      getSettingsData(),
      getArticlesData(locale),
    ]);

  return (
    <HomeClient
      locale={locale}
      products={products}
      categories={categories}
      reviews={reviews}
      settings={settings}
      articles={articles}
    />
  );
}
