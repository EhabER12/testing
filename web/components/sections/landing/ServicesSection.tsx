"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  ShoppingCart,
  Zap,
  Globe,
  Palette,
  Search,
  Code,
  ArrowUpRight,
  Gauge,
} from "lucide-react";
import { PublicWebsiteSettingsData } from "@/store/services/settingsService";

gsap.registerPlugin(ScrollTrigger);

// Service data with bilingual support
const servicesData = [
  {
    id: "salla-development",
    icon: ShoppingCart,
    title: { ar: "تطوير منصة سلة", en: "Salla Development" },
    subtitle: { ar: "Salla Development", en: "E-Commerce Platform" },
    description: {
      ar: "تصميم قوالب مخصصة احترافية تعكس هوية علامتك التجارية وتزيد معدلات التحويل.",
      en: "Custom professional themes that reflect your brand identity and increase conversion rates.",
    },
    slug: "salla-development",
    stats: { value: "50+", label: { ar: "قالب مخصص", en: "Custom Themes" } },
  },
  {
    id: "speed-optimization",
    icon: Zap,
    title: { ar: "تحسين السرعة", en: "Speed Optimization" },
    subtitle: { ar: "Speed Optimization", en: "Performance Boost" },
    description: {
      ar: "تحسين أداء متجرك على سلة وزد من سرعة 14 إلى 60+ في PageSpeed.",
      en: "Optimize your Salla & Zid store performance from 14 to 60+ PageSpeed score.",
    },
    slug: "speed-optimization",
    stats: { value: "14→60", label: { ar: "PageSpeed", en: "PageSpeed" } },
    featured: true,
  },
  {
    id: "custom-websites",
    icon: Globe,
    title: { ar: "مواقع مخصصة", en: "Custom Websites" },
    subtitle: { ar: "Custom Websites", en: "From Scratch" },
    description: {
      ar: "تطوير مواقع متكاملة من الصفر - سياحة، حجوزات، متاجر، وأنظمة إدارة.",
      en: "Building complete websites from scratch - travel, booking, stores, and management systems.",
    },
    slug: "custom-websites",
    stats: {
      value: "100+",
      label: { ar: "مشروع ناجح", en: "Successful Projects" },
    },
  },
  {
    id: "shopify-stores",
    icon: Code,
    title: { ar: "متاجر شوبيفاي", en: "Shopify Stores" },
    subtitle: { ar: "Shopify Stores", en: "Global Reach" },
    description: {
      ar: "بناء متاجر شوبيفاي احترافية مع تخصيص كامل وتكامل مع أنظمة الدفع السعودية.",
      en: "Professional Shopify stores with full customization and Saudi payment integration.",
    },
    slug: "shopify-stores",
    stats: { value: "99.9%", label: { ar: "Uptime", en: "Uptime" } },
  },
  {
    id: "seo-marketing",
    icon: Search,
    title: { ar: "تصدر نتائج البحث", en: "SEO & Marketing" },
    subtitle: { ar: "SEO & Marketing", en: "Visibility" },
    description: {
      ar: "استراتيجيات SEO متقدمة لظهور متجرك في الصفحة الأولى من Google.",
      en: "Advanced SEO strategies to rank your store on the first page of Google.",
    },
    slug: "seo-marketing",
    stats: { value: "Page 1", label: { ar: "Google", en: "Google" } },
  },
  {
    id: "branding",
    icon: Palette,
    title: { ar: "الهوية البصرية", en: "Brand Identity" },
    subtitle: { ar: "Brand Identity", en: "Visual Design" },
    description: {
      ar: "تصميم هويات بصرية متكاملة تميز علامتك التجارية في السوق السعودي.",
      en: "Complete visual identity design that sets your brand apart in the Saudi market.",
    },
    slug: "branding",
    stats: { value: "360°", label: { ar: "تصميم شامل", en: "Full Design" } },
  },
];

// Localized strings
const strings = {
  badge: { ar: "خدماتنا التقنية", en: "Our Tech Services" },
  title: { ar: "منظومة تقنية", en: "Complete Tech" },
  titleHighlight: { ar: "متكاملة", en: "House" },
  subtitle: {
    ar: "من تطوير المتاجر إلى تحسين الأداء - حلول برمجية شاملة للسوق السعودي",
    en: "From store development to performance optimization - complete software solutions for the Saudi market",
  },
  learnMore: { ar: "اكتشف المزيد", en: "Learn More" },
  viewAll: { ar: "عرض جميع الخدمات", en: "View All Services" },
  speedShowcase: {
    label: { ar: "تحسين الأداء", en: "Performance Boost" },
    before: { ar: "قبل", en: "Before" },
    after: { ar: "بعد", en: "After" },
    description: {
      ar: "تحسين سرعة PageSpeed لمتاجر سلة وزد",
      en: "PageSpeed optimization for Salla & Zid stores",
    },
  },
};

// Speed Optimization Showcase Component
function SpeedShowcase({ locale }: { locale: string }) {
  const isRtl = locale === "ar";
  const t = strings.speedShowcase;

  return (
    <div className="relative bg-gradient-to-br from-[#FB9903]/10 to-[#FB9903]/5 rounded-3xl p-6 sm:p-8 border border-[#FB9903]/20 overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#FB9903]/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[#FB9903]/20 rounded-xl">
            <Gauge className="w-6 h-6 text-[#FB9903]" />
          </div>
          <span className="text-sm font-medium text-[#FB9903]">
            {isRtl ? t.label.ar : t.label.en}
          </span>
        </div>

        <div className="flex items-center justify-center gap-4 my-6">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full border-4 border-red-400 flex items-center justify-center bg-red-50">
              <span className="text-2xl font-bold text-red-500">14</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {isRtl ? t.before.ar : t.before.en}
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-16 h-0.5 bg-gradient-to-r from-red-400 to-green-500" />
            <ArrowUpRight className="w-5 h-5 text-green-500 mt-1" />
          </div>

          <div className="text-center">
            <div className="w-20 h-20 rounded-full border-4 border-green-500 flex items-center justify-center bg-green-50 animate-pulse">
              <span className="text-2xl font-bold text-green-600">60+</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {isRtl ? t.after.ar : t.after.en}
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-600 text-center">
          {isRtl ? t.description.ar : t.description.en}
        </p>
      </div>
    </div>
  );
}

export function ServicesSection({
  locale,
  settings,
}: {
  locale: string;
  settings?: PublicWebsiteSettingsData | null;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isRtl = locale === "ar";

  const serviceSettings = settings?.homepageSections?.services;
  const showDynamic = serviceSettings?.isEnabled;

  const title = showDynamic
    ? isRtl
      ? serviceSettings.title.ar
      : serviceSettings.title.en
    : strings.title[isRtl ? "ar" : "en"];
  
  const titleHighlight = showDynamic
    ? isRtl
      ? serviceSettings.subtitle.ar
      : serviceSettings.subtitle.en
    : strings.titleHighlight[isRtl ? "ar" : "en"];
  
  const subtitle = showDynamic
    ? isRtl
      ? serviceSettings.content.ar
      : serviceSettings.content.en
    : strings.subtitle[isRtl ? "ar" : "en"];

  useGSAP(() => {
    if (!sectionRef.current) return;

    // Set initial visible state to prevent flash
    gsap.set(".service-card", { opacity: 1, y: 0 });

    gsap.fromTo(
      ".service-card",
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

    // Refresh ScrollTrigger after a short delay
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="services"
      className="py-20 sm:py-28 relative overflow-hidden bg-gray-50"
    >
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#04524B]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FB9903]/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="container px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16" dir={isRtl ? "rtl" : "ltr"}>
          <span className="inline-block px-4 py-1.5 bg-[#04524B]/10 text-[#04524B] text-sm font-medium rounded-full mb-4">
            {isRtl ? strings.badge.ar : strings.badge.en}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {title}{" "}
            <span className="text-[#04524B]">
              {titleHighlight}
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Services Grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          dir={isRtl ? "rtl" : "ltr"}
        >
          {servicesData.map((service) => (
            <Link
              key={service.id}
              href={`/services/${service.slug}`}
              className={`service-card group relative overflow-hidden rounded-3xl p-6 sm:p-8 transition-all duration-500 hover:-translate-y-2 ${
                service.featured
                  ? "bg-gradient-to-br from-[#FB9903] to-[#D98102] text-white md:col-span-2 lg:col-span-1"
                  : "bg-white border border-gray-200 hover:border-[#04524B]/30 hover:shadow-xl"
              }`}
            >
              <div className="flex items-start justify-between mb-6">
                <div
                  className={`p-3 rounded-2xl ${
                    service.featured
                      ? "bg-white/20"
                      : "bg-[#04524B]/10 group-hover:bg-[#04524B] transition-colors"
                  }`}
                >
                  <service.icon
                    className={`w-7 h-7 ${
                      service.featured
                        ? "text-white"
                        : "text-[#04524B] group-hover:text-white transition-colors"
                    }`}
                  />
                </div>

                <div
                  className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                    service.featured
                      ? "bg-white/20 text-white"
                      : "bg-[#FB9903]/10 text-[#FB9903]"
                  }`}
                >
                  {service.stats.value}
                </div>
              </div>

              <p
                className={`text-xs uppercase tracking-wider mb-2 font-medium ${
                  service.featured ? "text-white/70" : "text-[#04524B]/60"
                }`}
              >
                {isRtl ? service.subtitle.ar : service.subtitle.en}
              </p>

              <h3
                className={`text-xl sm:text-2xl font-bold mb-3 ${
                  service.featured ? "text-white" : "text-gray-900"
                }`}
              >
                {isRtl ? service.title.ar : service.title.en}
              </h3>

              <p
                className={`text-sm leading-relaxed mb-4 ${
                  service.featured ? "text-white/80" : "text-gray-600"
                }`}
              >
                {isRtl ? service.description.ar : service.description.en}
              </p>

              <div
                className={`flex items-center gap-2 text-sm font-medium ${
                  service.featured ? "text-white" : "text-[#04524B]"
                }`}
              >
                <span>
                  {isRtl ? strings.learnMore.ar : strings.learnMore.en}
                </span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </div>

              {!service.featured && (
                <div className="absolute inset-0 bg-gradient-to-br from-[#04524B]/0 to-[#04524B]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />
              )}
            </Link>
          ))}
        </div>

        {/* Speed Optimization Showcase */}
        {/* <div className="max-w-md mx-auto">
          <SpeedShowcase locale={locale} />
        </div> */}

        {/* View All CTA */}
        <div className="text-center mt-12">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#04524B] text-white font-bold rounded-full hover:bg-[#033D38] transition-colors shadow-lg hover:shadow-xl"
          >
            <span>{isRtl ? strings.viewAll.ar : strings.viewAll.en}</span>
            <ArrowUpRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
