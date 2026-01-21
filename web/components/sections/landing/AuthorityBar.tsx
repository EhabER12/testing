"use client";

import { BookOpen, GraduationCap, Users, Award } from "lucide-react";
import { useTranslations } from "next-intl";
import { PublicWebsiteSettingsData } from "@/store/services/settingsService";

interface AuthorityBarProps {
  locale: string;
  settings?: PublicWebsiteSettingsData;
}

export function AuthorityBar({ locale, settings }: AuthorityBarProps) {
  const isRtl = locale === "ar";
  const t = useTranslations("landing.authority");

  const authorityBar = settings?.authorityBar;

  // Hide section if disabled in settings
  if (authorityBar && !authorityBar.isEnabled) {
    return null;
  }

  // Use title from settings or fallback to translation
  const sectionTitle = authorityBar?.title
    ? (locale === "ar" ? authorityBar.title.ar : authorityBar.title.en)
    : t("tagline");

  // Use items from settings or fallback to hardcoded platforms
  const displayItems = authorityBar?.items && authorityBar.items.length > 0
    ? authorityBar.items
    : [
      { text: { ar: "جامعة الأزهر", en: "Al-Azhar University" } },
      { text: { ar: "الجامعة الإسلامية", en: "Islamic University" } },
      { text: { ar: "دار القرآن الكريم", en: "Dar Al-Quran" } },
      { text: { ar: "جامعة الإمام محمد", en: "Imam Muhammad University" } },
      { text: { ar: "الجمعيات القرآنية", en: "Quranic Associations" } },
      { text: { ar: "المؤسسات التعليمية", en: "Educational Institutions" } },
    ];

  return (
    <section className="py-12 sm:py-16 bg-white relative overflow-hidden">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #0B4536 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="container px-4 sm:px-6 relative z-10">
        {/* Title - From Settings or Fallback */}
        <h2
          className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-genoun-green mb-10"
          dir={isRtl ? "rtl" : "ltr"}
        >
          {sectionTitle}
        </h2>

        {/* Platform Logos - From Settings */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-14 mb-10">
          {displayItems.map((item, index) => (
            <div
              key={index}
              className="text-gray-400 hover:text-genoun-green transition-colors duration-300 cursor-default"
            >
              <span className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">
                {locale === "ar" ? item.text.ar : item.text.en}
              </span>
            </div>
          ))}
        </div>

        {/* Divider with icons */}
        <div className="flex items-center justify-center gap-6 sm:gap-8">
          <div className="flex items-center gap-4 text-genoun-green/60">
            <div className="p-2 rounded-lg bg-genoun-green/5">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="p-2 rounded-lg bg-genoun-green/5">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="p-2 rounded-lg bg-genoun-green/5">
              <Users className="w-5 h-5" />
            </div>
            <div className="p-2 rounded-lg bg-genoun-green/5">
              <Award className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
