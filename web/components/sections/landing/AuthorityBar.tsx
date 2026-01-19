"use client";

import { ShoppingCart, Search, BarChart3, Megaphone } from "lucide-react";
import { useTranslations } from "next-intl";

export function AuthorityBar({ locale }: { locale: string }) {
  const isRtl = locale === "ar";
  const t = useTranslations("landing.authority");

  const platforms = [
    { name: "Salla", nameAr: "سلة" },
    { name: "Shopify", nameAr: "شوبيفاي" },
    { name: "Zid", nameAr: "زد" },
    { name: "WordPress", nameAr: "ووردبريس" },
    { name: "Magento", nameAr: "ماغنتو" },
    { name: "Framer", nameAr: "فريمر" },
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
        {/* Title - Matching other section styles */}
        <h2
          className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-genoun-green mb-10"
          dir={isRtl ? "rtl" : "ltr"}
        >
          {t("tagline")}
        </h2>

        {/* Platform Logos - Text based */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-14 mb-10">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className="text-gray-400 hover:text-genoun-green transition-colors duration-300 cursor-default"
            >
              <span className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">
                {isRtl ? platform.nameAr : platform.name}
              </span>
            </div>
          ))}
        </div>

        {/* Divider with icons */}
        <div className="flex items-center justify-center gap-6 sm:gap-8">
          <div className="flex items-center gap-4 text-genoun-green/60">
            <div className="p-2 rounded-lg bg-genoun-green/5">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="p-2 rounded-lg bg-genoun-green/5">
              <Search className="w-5 h-5" />
            </div>
            <div className="p-2 rounded-lg bg-genoun-green/5">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="p-2 rounded-lg bg-genoun-green/5">
              <Megaphone className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
