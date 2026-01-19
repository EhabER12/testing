import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProductDetailClient } from "@/components/products/ProductDetailClient";
import { locales } from "@/i18n/request";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Get localized text helper for metadata
const getLocalizedText = (
  text: { ar: string; en: string } | string | undefined,
  locale: string
): string => {
  if (!text) return "";
  if (typeof text === "string") return text;
  return text[locale as "ar" | "en"] || text.en || text.ar || "";
};

// Server-side data fetching with ISR revalidation
async function getProduct(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/products/slug/${slug}`, {
      next: { revalidate: 300 }, // Cache for 5 minutes (ISR)
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch product");
    }

    const data = await res.json();
    return data.product || data.data || data;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

interface PageParams {
  locale: string;
  slug: string;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const product = await getProduct(slug);
  const t = await getTranslations({ locale, namespace: "products" });

  if (!product) {
    return {
      title: t("notFound") || "Product Not Found",
    };
  }

  const productName = getLocalizedText(product.name, locale);
  const productDescription = getLocalizedText(
    product.shortDescription || product.description,
    locale
  );
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://genoun.com";

  return {
    title: productName,
    description: productDescription,
    openGraph: {
      title: productName,
      description: productDescription,
      images: product.coverImage ? [product.coverImage] : [],
      type: "website",
      locale: locale,
    },
    twitter: {
      card: "summary_large_image",
      title: productName,
      description: productDescription,
      images: product.coverImage ? [product.coverImage] : [],
    },
    alternates: {
      canonical: `${baseUrl}/${locale}/products/${slug}`,
      languages: Object.fromEntries(
        locales.map((loc) => [loc, `${baseUrl}/${loc}/products/${slug}`])
      ),
    },
  };
}

// Server Component - fetches data on the server
export default async function ProductPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug, locale } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  // Pass data to client component for interactivity
  return <ProductDetailClient product={product} locale={locale} />;
}
