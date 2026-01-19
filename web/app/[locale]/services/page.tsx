"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  ShoppingCart,
  Zap,
  Globe,
  Palette,
  Search,
  Code,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import { getServices } from "@/store/slices/serviceSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

// Category icons map
const categoryIcons: Record<string, any> = {
  salla: ShoppingCart,
  shopify: Code,
  websites: Globe,
  seo: Search,
  branding: Palette,
  other: Zap,
};

// Category labels
const categoryLabels: Record<string, { ar: string; en: string }> = {
  salla: { ar: "تطوير سلة", en: "Salla Development" },
  shopify: { ar: "متاجر شوبيفاي", en: "Shopify Stores" },
  websites: { ar: "مواقع مخصصة", en: "Custom Websites" },
  seo: { ar: "تحسين محركات البحث", en: "SEO & Performance" },
  branding: { ar: "الهوية البصرية", en: "Branding" },
  other: { ar: "خدمات أخرى", en: "Other Services" },
};

export default function ServicesPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const dispatch = useAppDispatch();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { services, loading } = useAppSelector(
    (state) => state.services || { services: [], loading: false }
  );

  useEffect(() => {
    dispatch(getServices({ active: true }));
  }, [dispatch]);

  const filteredServices = activeCategory
    ? services.filter((s: any) => s.category === activeCategory)
    : services;

  const categories = Object.keys(categoryLabels);

  return (
    <main className="min-h-screen bg-gray-50" dir={isRtl ? "rtl" : "ltr"}>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-b from-[#04524B] to-[#033D38] overflow-hidden">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FB9903' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="container px-4 sm:px-6 relative z-10 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
            {isRtl ? "خدماتنا التقنية" : "Our Tech Services"}
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
            {isRtl
              ? "حلول برمجية متكاملة من تطوير المتاجر إلى تحسين الأداء"
              : "Complete software solutions from store development to performance optimization"}
          </p>
        </div>
      </section>

      {/* Category Filters */}
      <section className="py-8 bg-white border-b border-gray-200 sticky top-20 z-30">
        <div className="container px-4 sm:px-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === null
                  ? "bg-[#04524B] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>{isRtl ? "الكل" : "All"}</span>
            </button>

            {categories.map((cat) => {
              const Icon = categoryIcons[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    activeCategory === cat
                      ? "bg-[#04524B] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>
                    {isRtl ? categoryLabels[cat].ar : categoryLabels[cat].en}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="container px-4 sm:px-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl p-8 animate-pulse">
                  <div className="w-14 h-14 bg-gray-200 rounded-2xl mb-6" />
                  <div className="h-4 bg-gray-200 rounded w-20 mb-4" />
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">
                {isRtl ? "لا توجد خدمات متاحة حالياً" : "No services available"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service: any) => {
                const Icon = categoryIcons[service.category] || Zap;
                const title = isRtl ? service.title?.ar : service.title?.en;
                const description = isRtl
                  ? service.shortDescription?.ar
                  : service.shortDescription?.en;

                return (
                  <Link
                    key={service.id || service._id}
                    href={`/${locale}/services/${service.slug}`}
                    className="group bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 hover:border-[#04524B]/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Icon */}
                    <div className="p-3 bg-[#04524B]/10 rounded-2xl w-fit mb-6 group-hover:bg-[#04524B] transition-colors">
                      <Icon className="w-7 h-7 text-[#04524B] group-hover:text-white transition-colors" />
                    </div>

                    {/* Category */}
                    <p className="text-xs uppercase tracking-wider text-[#04524B]/60 mb-2 font-medium">
                      {isRtl
                        ? categoryLabels[service.category]?.ar
                        : categoryLabels[service.category]?.en}
                    </p>

                    {/* Title */}
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#04524B] transition-colors">
                      {title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                      {description}
                    </p>

                    {/* Stats */}
                    {service.stats && service.stats.length > 0 && (
                      <div className="flex gap-3 mb-4">
                        {service.stats
                          .slice(0, 2)
                          .map((stat: any, i: number) => (
                            <div
                              key={i}
                              className="px-3 py-1.5 bg-[#FB9903]/10 rounded-full"
                            >
                              <span className="text-sm font-bold text-[#FB9903]">
                                {stat.value}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* CTA */}
                    <div className="flex items-center gap-2 text-[#04524B] text-sm font-medium">
                      <span>{isRtl ? "اكتشف المزيد" : "Learn More"}</span>
                      <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#04524B] to-[#033D38]">
        <div className="container px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {isRtl ? "هل لديك مشروع؟" : "Have a Project?"}
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            {isRtl
              ? "تواصل معنا لمناقشة احتياجاتك والحصول على عرض سعر مخصص"
              : "Contact us to discuss your needs and get a custom quote"}
          </p>
          <Link
            href={`/${locale}/forms/consultation-request`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#FB9903] text-white font-bold rounded-full hover:bg-[#D98102] transition-colors shadow-lg"
          >
            <span>
              {isRtl ? "احجز استشارة مجانية" : "Book Free Consultation"}
            </span>
            <ArrowUpRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
