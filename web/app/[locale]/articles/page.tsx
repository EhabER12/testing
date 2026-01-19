"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Loader2,
  Calendar,
  ArrowRight,
  ArrowLeft,
  X,
  User,
  Eye,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getArticles } from "@/store/slices/articleSlice";
import { useTranslations, useLocale } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

// Localized strings for the page
const strings = {
  badge: { ar: "مدونة جنون", en: "Genoun Blog" },
  title: { ar: "رؤى رقمية ومعرفة", en: "Digital Insights & Knowledge" },
  subtitle: {
    ar: "أحدث المقالات والأفكار في عالم التسويق الرقمي والتجارة الإلكترونية",
    en: "Latest articles and insights in digital marketing and e-commerce",
  },
  searchPlaceholder: {
    ar: "ابحث في المقالات...",
    en: "Search articles...",
  },
  latestArticles: { ar: "أحدث المقالات", en: "Latest Articles" },
  foundArticles: {
    ar: "تم العثور على {count} مقال مطابق",
    en: "Found {count} matching articles",
  },
  noArticles: {
    ar: "لا توجد مقالات بعد",
    en: "No articles yet",
  },
  noArticlesDesc: {
    ar: "تابعنا لاحقاً للمقالات الجديدة",
    en: "Check back later for new articles",
  },
  readMore: { ar: "اقرأ المزيد", en: "Read More" },
  loading: { ar: "جارٍ التحميل...", en: "Loading..." },
  views: { ar: "مشاهدة", en: "views" },
  by: { ar: "بواسطة", en: "By" },
  failedToLoad: {
    ar: "فشل في تحميل المقالات",
    en: "Failed to load articles",
  },
  retry: { ar: "حاول مرة أخرى", en: "Try Again" },
  author: { ar: "فريق جنون", en: "Genoun Team" },
};

export default function ArticlesPage() {
  const dispatch = useAppDispatch();
  const sectionRef = useRef<HTMLDivElement>(null);
  const { articles, isLoading, isError, message } = useAppSelector(
    (state) => state.articles
  );
  const t = useTranslations("articles");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [searchQuery, setSearchQuery] = useState("");

  // Fetch articles filtered by current language
  useEffect(() => {
    dispatch(
      getArticles({
        status: "published",
        language: locale as "en" | "ar",
      })
    );
  }, [dispatch, locale]);

  // GSAP animations
  useGSAP(() => {
    if (!sectionRef.current || isLoading) return;

    // Set initial visible state
    gsap.set(".article-card", { opacity: 1, y: 0 });

    gsap.fromTo(
      ".article-card",
      { y: 60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      }
    );

    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  }, [articles, isLoading]);

  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) {
      return articles;
    }
    const query = searchQuery.toLowerCase();
    return articles.filter(
      (article) =>
        article.title.toLowerCase().includes(query) ||
        article.excerpt?.toLowerCase().includes(query) ||
        article.author?.name.toLowerCase().includes(query)
    );
  }, [articles, searchQuery]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString(
        locale === "ar" ? "ar-EG" : "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );
    } catch (e) {
      return "";
    }
  };

  const retryFetch = () => {
    dispatch(
      getArticles({
        status: "published",
        language: locale as "en" | "ar",
      })
    );
  };

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const str = (key: keyof typeof strings) =>
    isRtl ? strings[key].ar : strings[key].en;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 sm:py-28 overflow-hidden bg-gradient-to-br from-[#04524B] to-[#033D38]">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FB9903]/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />

          <div
            className="container px-4 sm:px-6 relative z-10"
            dir={isRtl ? "rtl" : "ltr"}
          >
            <div className="text-center max-w-4xl mx-auto">
              {/* Badge */}
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium rounded-full mb-6">
                <BookOpen className="w-4 h-4" />
                {str("badge")}
              </span>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
                {isRtl ? (
                  <>
                    <span className="text-[#FB9903]">رؤى</span> رقمية ومعرفة
                  </>
                ) : (
                  <>
                    Digital <span className="text-[#FB9903]">Insights</span> &
                    Knowledge
                  </>
                )}
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                {str("subtitle")}
              </p>

              {/* Search Bar */}
              <div className="max-w-xl mx-auto">
                <div className="relative">
                  <Search
                    className={`absolute ${
                      isRtl ? "right-4" : "left-4"
                    } top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400`}
                  />
                  <Input
                    className={`h-14 ${
                      isRtl ? "pr-12 pl-12" : "pl-12 pr-12"
                    } text-base bg-white/95 backdrop-blur-sm border-0 shadow-2xl focus-visible:ring-2 focus-visible:ring-[#FB9903] rounded-full`}
                    placeholder={str("searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    dir={isRtl ? "rtl" : "ltr"}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className={`absolute ${
                        isRtl ? "left-4" : "right-4"
                      } top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors`}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Articles Grid */}
        <section ref={sectionRef} className="py-16 sm:py-20">
          <div className="container px-4 sm:px-6" dir={isRtl ? "rtl" : "ltr"}>
            {/* Section Header */}
            {!isLoading && !isError && (
              <div className="mb-10">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {searchQuery ? (
                    <>
                      {str("foundArticles").replace(
                        "{count}",
                        String(filteredArticles.length)
                      )}
                    </>
                  ) : (
                    str("latestArticles")
                  )}
                </h2>
                <div className="w-20 h-1 bg-[#FB9903] rounded-full" />
              </div>
            )}

            {/* Loading State */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-[#04524B] mb-4" />
                <p className="text-gray-500">{str("loading")}</p>
              </div>
            ) : isError ? (
              // Error State
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                  <X className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-red-600 mb-2">
                  {str("failedToLoad")}
                </h3>
                <p className="text-gray-500 mb-6">{message}</p>
                <Button
                  onClick={retryFetch}
                  className="bg-[#04524B] hover:bg-[#033D38]"
                >
                  {str("retry")}
                </Button>
              </div>
            ) : filteredArticles.length === 0 ? (
              // Empty State
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#04524B]/10 mb-6">
                  <BookOpen className="h-10 w-10 text-[#04524B]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {str("noArticles")}
                </h3>
                <p className="text-gray-500">{str("noArticlesDesc")}</p>
              </div>
            ) : (
              // Articles Grid
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {filteredArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/${locale}/articles/${article.slug}`}
                    className="article-card group"
                  >
                    <article className="h-full overflow-hidden rounded-3xl bg-white border border-gray-200 hover:border-[#04524B]/30 hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
                      {/* Image */}
                      <div className="relative h-52 sm:h-56 w-full overflow-hidden bg-gradient-to-br from-[#04524B] to-[#033D38]">
                        {article.coverImage ? (
                          <Image
                            src={article.coverImage}
                            alt={article.title}
                            fill
                            className="object-cover object-center transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-3">
                              <BookOpen className="w-10 h-10 text-white/60" />
                            </div>
                            <span className="text-white/40 text-sm font-medium">
                              {isRtl ? "بدون صورة" : "No Image"}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Views Badge */}
                        <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 bg-black/50 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                          <Eye className="w-3 h-3" />
                          <span>{article.views || 0}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 sm:p-6">
                        {/* Date */}
                        <div
                          className={`flex items-center gap-2 text-xs text-gray-500 mb-3 ${
                            isRtl ? "flex-row-reverse" : ""
                          }`}
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {formatDate(
                              article.publishedAt || article.createdAt
                            )}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-[#04524B] transition-colors">
                          {article.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">
                          {article.excerpt}
                        </p>

                        {/* Footer */}
                        <div
                          className={`flex items-center justify-between pt-4 border-t border-gray-100 ${
                            isRtl ? "flex-row-reverse" : ""
                          }`}
                        >
                          {/* Author */}
                          <div
                            className={`flex items-center gap-2 ${
                              isRtl ? "flex-row-reverse" : ""
                            }`}
                          >
                            <div className="h-8 w-8 rounded-full bg-[#04524B]/10 flex items-center justify-center overflow-hidden">
                              <User className="h-4 w-4 text-[#04524B]" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {article.author?.name || str("author")}
                            </span>
                          </div>

                          {/* Read More */}
                          <span
                            className={`flex items-center gap-1 text-sm font-medium text-[#04524B] group-hover:text-[#FB9903] transition-colors ${
                              isRtl ? "flex-row-reverse" : ""
                            }`}
                          >
                            {str("readMore")}
                            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
