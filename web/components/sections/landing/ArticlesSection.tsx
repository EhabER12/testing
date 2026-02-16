"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  Calendar,
  ArrowUpRight,
  BookOpen,
  Eye,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { PublicWebsiteSettingsData } from "@/store/services/settingsService";

gsap.registerPlugin(ScrollTrigger);

// Article interface
interface Article {
  id: string;
  _id?: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  views?: number;
  publishedAt?: string;
  createdAt?: string;
  author?: {
    name: string;
  };
}

// Localized strings
const strings = {
  badge: { ar: "المدونة", en: "Blog" },
  title: { ar: "أحدث", en: "Latest" },
  titleHighlight: { ar: "المقالات", en: "Articles" },
  subtitle: {
    ar: "رؤى وأفكار في عالم التسويق الرقمي والتجارة الإلكترونية",
    en: "Insights and ideas in digital marketing and e-commerce",
  },
  viewAll: { ar: "عرض جميع المقالات", en: "View All Articles" },
  readMore: { ar: "اقرأ المزيد", en: "Read More" },
  noArticles: { ar: "لا توجد مقالات بعد", en: "No articles yet" },
  author: { ar: "فريق جنون", en: "Genoun Team" },
};

interface ArticlesSectionProps {
  locale: string;
  articles: Article[];
  settings?: PublicWebsiteSettingsData;
}

export function ArticlesSection({ locale, articles, settings }: ArticlesSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const lang = isRtl ? "ar" : "en";

  const str = (key: keyof typeof strings) =>
    isRtl ? strings[key].ar : strings[key].en;

  const homepageArticles = settings?.homepageArticlesSection;
  const badgeText = homepageArticles?.badge?.[lang]?.trim() || str("badge");
  const titleText = homepageArticles?.title?.[lang]?.trim() || str("title");
  const titleHighlightText =
    homepageArticles?.titleHighlight?.[lang]?.trim() || str("titleHighlight");
  const subtitleText =
    homepageArticles?.subtitle?.[lang]?.trim() || str("subtitle");
  const viewAllText =
    homepageArticles?.viewAllText?.[lang]?.trim() || str("viewAll");

  // GSAP animations
  useGSAP(() => {
    if (!sectionRef.current || articles.length === 0) return;

    gsap.set(".article-home-card", { opacity: 1, y: 0 });

    gsap.fromTo(
      ".article-home-card",
      { y: 60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.15,
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
  }, [articles]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString(
        locale === "ar" ? "ar-EG" : "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        }
      );
    } catch {
      return "";
    }
  };

  // Show only first 3 articles
  const displayArticles = articles.slice(0, 3);

  if (articles.length === 0) {
    return null; // Don't show section if no articles
  }

  return (
    <section
      ref={sectionRef}
      className="py-20 sm:py-28 relative overflow-hidden bg-white"
    >
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#04524B]/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FB9903]/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

      <div className="container px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-14" dir={isRtl ? "rtl" : "ltr"}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#04524B]/10 text-[#04524B] text-sm font-medium rounded-full mb-4">
            <BookOpen className="w-4 h-4" />
            {badgeText}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {titleText}{" "}
            <span className="text-[#04524B]">{titleHighlightText}</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {subtitleText}
          </p>
        </div>

        {/* Articles Grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12"
          dir={isRtl ? "rtl" : "ltr"}
        >
          {displayArticles.map((article) => (
            <Link
              key={article.id || article._id}
              href={`/${locale}/articles/${article.slug}`}
              className="article-home-card group"
            >
              <article className="h-full overflow-hidden rounded-3xl bg-white border border-gray-200 hover:border-[#04524B]/30 hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
                {/* Image */}
                <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-gradient-to-br from-[#04524B] to-[#033D38]">
                  {article.coverImage ? (
                    <Image
                      src={article.coverImage}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-2">
                        <BookOpen className="w-8 h-8 text-white/60" />
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Views Badge */}
                  {article.views !== undefined && article.views > 0 && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                      <Eye className="w-3 h-3" />
                      <span>{article.views}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Date */}
                  <div
                    className={`flex items-center gap-2 text-xs text-gray-500 mb-3 ${
                      isRtl ? "flex-row-reverse" : ""
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {formatDate(article.publishedAt || article.createdAt)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#04524B] transition-colors">
                    {article.title}
                  </h3>

                  {/* Excerpt */}
                  {article.excerpt && (
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-4">
                      {article.excerpt}
                    </p>
                  )}

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
              </article>
            </Link>
          ))}
        </div>

        {/* View All CTA */}
        <div className="text-center">
          <Link
            href={`/${locale}/articles`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#04524B] text-white font-bold rounded-full hover:bg-[#033D38] transition-colors shadow-lg hover:shadow-xl"
          >
            <span>{viewAllText}</span>
            <ArrowUpRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
