import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ServiceDetailClient } from "@/components/services/ServiceDetailClient";
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
async function getService(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/services/slug/${slug}`, {
      next: { revalidate: 300 }, // Cache for 5 minutes (ISR)
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch service");
    }

    const data = await res.json();
    return data.service || data.data || data;
  } catch (error) {
    console.error("Error fetching service:", error);
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
  const service = await getService(slug);
  const t = await getTranslations({ locale, namespace: "services" });

  if (!service) {
    return {
      title: t("notFound") || "Service Not Found",
    };
  }

  const serviceName = getLocalizedText(service.title, locale);
  const serviceDescription = getLocalizedText(
    service.shortDescription || service.description,
    locale
  );
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://genoun.com";

  return {
    title: serviceName,
    description: serviceDescription,
    openGraph: {
      title: serviceName,
      description: serviceDescription,
      images: service.coverImage ? [service.coverImage] : [],
      type: "website",
      locale: locale,
    },
    twitter: {
      card: "summary_large_image",
      title: serviceName,
      description: serviceDescription,
      images: service.coverImage ? [service.coverImage] : [],
    },
    alternates: {
      canonical: `${baseUrl}/${locale}/services/${slug}`,
      languages: Object.fromEntries(
        locales.map((loc) => [loc, `${baseUrl}/${loc}/services/${slug}`])
      ),
    },
  };
}

// Server Component - fetches data on the server
export default async function ServicePage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug, locale } = await params;
  const service = await getService(slug);

  if (!service) {
    notFound();
  }

  // Pass data to client component for interactivity
  return <ServiceDetailClient service={service} locale={locale} />;
}
