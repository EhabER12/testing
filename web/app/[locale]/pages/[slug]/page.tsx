import { Metadata } from "next";
import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface PageParams {
  locale: string;
  slug: string;
}

// Sanitization config for static pages
const sanitizeConfig = {
  allowedTags: [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "br",
    "hr",
    "ul",
    "ol",
    "li",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "a",
    "blockquote",
    "pre",
    "code",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "div",
    "span",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    div: ["class"],
    span: ["class"],
    "*": ["style"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
};

// Fetch static page from API
async function getStaticPage(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/static-pages/${slug}`, {
      next: { revalidate: 31536000 }, // Cache for 1 year (admin can clear cache on update)
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch page");
    }

    const data = await res.json();
    return data.page;
  } catch (error) {
    console.error("Error fetching static page:", error);
    return null;
  }
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const page = await getStaticPage(slug);

  if (!page) {
    return {
      title: "Page Not Found",
    };
  }

  const lang = locale as "ar" | "en";
  const title =
    page.seoMeta?.title?.[lang] || page.title?.[lang] || page.title?.en;
  const description = page.seoMeta?.description?.[lang] || "";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      locale: locale === "ar" ? "ar_SA" : "en_US",
    },
  };
}

export default async function StaticPageView({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug, locale } = await params;
  const page = await getStaticPage(slug);

  if (!page || !page.isPublished) {
    notFound();
  }

  const lang = locale as "ar" | "en";
  const isRtl = locale === "ar";
  const title = page.title?.[lang] || page.title?.en || slug;
  const rawContent = page.content?.[lang] || page.content?.en || "";

  // SECURITY: Sanitize HTML content before rendering (defense in depth)
  const sanitizedContent = sanitizeHtml(rawContent, sanitizeConfig);

  return (
    <div className="min-h-screen bg-gray-50" dir={isRtl ? "rtl" : "ltr"}>
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#04524B] to-[#033D38] py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold text-white text-center">
            {title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-8 md:p-12">
          {/* Render HTML content safely */}
          <div
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-[#04524B] prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </div>
      </div>
    </div>
  );
}
