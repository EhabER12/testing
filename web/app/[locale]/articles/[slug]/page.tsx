import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  User,
  ArrowLeft,
  ArrowRight,
  Clock,
  Eye,
  BookOpen,
  Share2,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ShareButton } from "@/components/ui/share-button";
import { getTranslations } from "next-intl/server";
import { locales, isRtlLocale, type Locale } from "@/i18n/request";

async function getArticle(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/articles/${slug}`,
      {
        next: { revalidate: 300 }, // Cache for 5 minutes (ISR)
      }
    );

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch article");
    }

    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching article:", error);
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
  const article = await getArticle(slug);
  const t = await getTranslations({ locale, namespace: "articles" });

  if (!article) {
    return {
      title: t("failedToLoad"),
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://genoun.com";

  return {
    title: article.seo?.title || article.title,
    description: article.seo?.description || article.excerpt,
    keywords: article.seo?.keywords,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images:
        article.heroImage || article.coverImage
          ? [article.heroImage || article.coverImage]
          : [],
      type: "article",
      publishedTime: article.publishedAt || article.createdAt,
      authors: [article.author?.name],
      locale: locale,
    },
    alternates: {
      canonical: `${baseUrl}/${locale}/articles/${slug}`,
      languages: Object.fromEntries(
        locales.map((loc) => [loc, `${baseUrl}/${loc}/articles/${slug}`])
      ),
    },
  };
}

// Localized strings
const strings = {
  backToArticles: { ar: "العودة للمقالات", en: "Back to Articles" },
  author: { ar: "فريق جنون", en: "Genoun Team" },
  minRead: { ar: "دقيقة قراءة", en: "min read" },
  views: { ar: "مشاهدة", en: "views" },
  shareArticle: { ar: "شارك المقال", en: "Share Article" },
  relatedTags: { ar: "الوسوم", en: "Tags" },
};

export default async function ArticlePage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug, locale } = await params;
  const article = await getArticle(slug);
  const t = await getTranslations({ locale, namespace: "articles" });
  const tNav = await getTranslations({ locale, namespace: "navigation" });

  if (!article) {
    notFound();
  }

  const isRtl = isRtlLocale(locale as Locale);
  const ArrowBackIcon = isRtl ? ArrowRight : ArrowLeft;
  const str = (key: keyof typeof strings) =>
    isRtl ? strings[key].ar : strings[key].en;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(
      locale === "ar" ? "ar-EG" : "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };

  // Calculate read time
  const wordsPerMinute = 200;
  const wordCount = article.content?.split(/\s+/).length || 0;
  const readTime = Math.ceil(wordCount / wordsPerMinute) || 1;

  return (
    <div className="min-h-screen bg-gray-50" dir={isRtl ? "rtl" : "ltr"}>
      {/* Hero Header */}
      <header className="relative min-h-[70vh] w-full overflow-hidden">
        {/* Background */}
        {article.heroImage || article.coverImage ? (
          <>
            <Image
              src={article.heroImage || article.coverImage}
              alt={article.title}
              fill
              className="object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#04524B] to-[#022B27]">
            {/* Decorative Pattern */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: "40px 40px",
              }}
            />
            {/* Decorative Elements */}
            <div className="absolute top-20 right-20 w-64 h-64 bg-[#FB9903]/20 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <BookOpen className="w-64 h-64 text-white" />
            </div>
          </div>
        )}

        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-end">
          <div className="container px-4 sm:px-6 md:px-8 mx-auto pb-12 sm:pb-16 md:pb-20">
            <div className="max-w-4xl">
              {/* Back Button */}
              <Link
                href={`/${locale}/articles`}
                className={`inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full ${
                  isRtl ? "flex-row-reverse" : ""
                }`}
              >
                <ArrowBackIcon className="h-4 w-4" />
                <span>{str("backToArticles")}</span>
              </Link>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div
                  className={`flex flex-wrap gap-2 mb-5 ${
                    isRtl ? "justify-end" : "justify-start"
                  }`}
                >
                  {article.tags.map((tag: string) => (
                    <Badge
                      key={tag}
                      className="bg-[#FB9903] hover:bg-[#FB9903]/90 text-white border-none px-3 py-1"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                {article.title}
              </h1>

              {/* Excerpt */}
              {article.excerpt && (
                <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-3xl leading-relaxed">
                  {article.excerpt}
                </p>
              )}

              {/* Meta Info */}
              <div
                className={`flex flex-wrap items-center gap-4 sm:gap-6 ${
                  isRtl ? "flex-row-reverse" : ""
                }`}
              >
                {/* Author */}
                <div
                  className={`flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full ${
                    isRtl ? "flex-row-reverse" : ""
                  }`}
                >
                  <div className="h-10 w-10 rounded-full bg-[#04524B] flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium text-white">
                    {article.author?.name || str("author")}
                  </span>
                </div>

                {/* Date */}
                <div
                  className={`flex items-center gap-2 text-white/90 ${
                    isRtl ? "flex-row-reverse" : ""
                  }`}
                >
                  <Calendar className="h-5 w-5" />
                  <span>
                    {formatDate(article.publishedAt || article.createdAt)}
                  </span>
                </div>

                {/* Read Time */}
                <div
                  className={`flex items-center gap-2 text-white/90 ${
                    isRtl ? "flex-row-reverse" : ""
                  }`}
                >
                  <Clock className="h-5 w-5" />
                  <span>
                    {readTime} {str("minRead")}
                  </span>
                </div>

                {/* Views */}
                {article.views > 0 && (
                  <div
                    className={`flex items-center gap-2 text-white/90 ${
                      isRtl ? "flex-row-reverse" : ""
                    }`}
                  >
                    <Eye className="h-5 w-5" />
                    <span>
                      {article.views} {str("views")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content Section */}
      <article className="relative">
        {/* Decorative top curve */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gray-50 -translate-y-full rounded-t-[2rem]" />

        <div className="container px-4 sm:px-6 md:px-8 mx-auto py-12 md:py-16">
          <div className="max-w-3xl mx-auto">
            {/* Main Content Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 md:p-12">
              {/* Article Content */}
              <div
                className={`prose prose-lg max-w-none 
                  prose-headings:font-bold 
                  prose-headings:text-gray-900 
                  prose-h1:text-3xl 
                  prose-h2:text-2xl 
                  prose-h2:border-b 
                  prose-h2:border-gray-100 
                  prose-h2:pb-3 
                  prose-h2:mb-6
                  prose-h3:text-xl
                  prose-p:text-gray-700 
                  prose-p:leading-relaxed
                  prose-a:text-[#04524B] 
                  prose-a:font-medium
                  prose-a:no-underline
                  hover:prose-a:underline
                  prose-strong:text-gray-900
                  prose-blockquote:border-l-[#FB9903]
                  prose-blockquote:bg-gray-50
                  prose-blockquote:py-4
                  prose-blockquote:px-6
                  prose-blockquote:rounded-r-xl
                  prose-blockquote:not-italic
                  prose-img:rounded-2xl 
                  prose-img:shadow-lg
                  prose-ul:list-disc
                  prose-ol:list-decimal
                  prose-li:text-gray-700
                  ${
                    isRtl
                      ? "text-right prose-blockquote:border-l-0 prose-blockquote:border-r-[#FB9903] prose-blockquote:rounded-l-xl prose-blockquote:rounded-r-none"
                      : ""
                  }
                `}
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </div>

            {/* Footer Section */}
            <div className="mt-8 space-y-6">
              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <div className={`flex items-center gap-2 mb-4`}>
                    <Tag className="w-5 h-5 text-[#04524B]" />
                    <span className="font-semibold text-gray-900">
                      {str("relatedTags")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag: string) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-[#04524B] border-[#04524B]/30 hover:bg-[#04524B]/5 px-4 py-1.5"
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Section */}
              <div className="bg-gradient-to-r from-[#04524B] to-[#033D38] rounded-2xl p-6 text-white">
                <div
                  className={`flex flex-col sm:flex-row items-center justify-between gap-4`}
                >
                  <div className={`flex items-center gap-3`}>
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Share2 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">
                        {str("shareArticle")}
                      </p>
                      <p className="text-white/70 text-sm">
                        {isRtl
                          ? "شارك هذا المقال مع أصدقائك"
                          : "Share this article with your friends"}
                      </p>
                    </div>
                  </div>
                  <ShareButton title={article.title} text={article.excerpt} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
