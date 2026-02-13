import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/request";
import { BookDetailClient } from "@/components/books/BookDetailClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const getLocalizedText = (
  text: { ar?: string; en?: string } | string | undefined,
  locale: string
): string => {
  if (!text) return "";
  if (typeof text === "string") return text;
  return text[locale as "ar" | "en"] || text.en || text.ar || "";
};

async function getBook(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/books/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch book");
    }
    const data = await res.json();
    return data.book || data.data?.book || data.data || null;
  } catch {
    return null;
  }
}

interface PageParams {
  locale: string;
  slug: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const book = await getBook(slug);
  const t = await getTranslations({ locale, namespace: "products" });

  if (!book) {
    return { title: t("notFound") || "Book not found" };
  }

  const title = getLocalizedText(book.name, locale);
  const description = getLocalizedText(book.shortDescription || book.description, locale);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://genoun.com";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: book.bookCoverPath || book.coverImage ? [book.bookCoverPath || book.coverImage] : [],
      type: "website",
      locale,
    },
    alternates: {
      canonical: `${baseUrl}/${locale}/books/${slug}`,
      languages: Object.fromEntries(
        locales.map((loc) => [loc, `${baseUrl}/${loc}/books/${slug}`])
      ),
    },
  };
}

export default async function BookPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug, locale } = await params;
  const book = await getBook(slug);

  if (!book) {
    notFound();
  }

  return <BookDetailClient book={book} locale={locale} />;
}

