"use client";

import Link from "next/link";
import { Sparkles, Phone, Mail, MapPin, ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { PublicWebsiteSettingsData } from "@/store/services/settingsService";

interface CTASectionProps {
  locale: string;
  settings?: PublicWebsiteSettingsData | null;
}

export function CTASection({ locale, settings }: CTASectionProps) {
  const t = useTranslations("landing.cta");
  const isRtl = locale === "ar";

  const ctaSettings = settings?.homepageSections?.cta;
  const showDynamic = ctaSettings?.isEnabled;

  const title = showDynamic
    ? isRtl
      ? ctaSettings.title.ar
      : ctaSettings.title.en
    : t("title");
  
  const titleHighlight = showDynamic
    ? isRtl
      ? ctaSettings.subtitle.ar
      : ctaSettings.subtitle.en
    : t("titleHighlight");
  
  const subtitle = showDynamic
    ? isRtl
      ? ctaSettings.content.ar
      : ctaSettings.content.en
    : t("subtitle");

  const buttonText = showDynamic
    ? isRtl
      ? ctaSettings.buttonText.ar
      : ctaSettings.buttonText.en
    : t("button");

  const buttonLink = showDynamic ? ctaSettings.buttonLink : "/forms/consultation-request";

  // Use settings values or fallback defaults
  const phone = settings?.contactPhone || "+966 XX XXX XXXX";
  const email = settings?.contactEmail || "info@genoun.com";
  const address = isRtl
    ? settings?.address_ar || settings?.address || "المملكة العربية السعودية"
    : settings?.address || "Saudi Arabia";

  return (
    <section
      className="relative py-16 sm:py-20 overflow-hidden"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Wave Shape Top - Like Hero */}
      <div className="absolute top-0 left-0 right-0 -translate-y-full">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          preserveAspectRatio="none"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="#04524B"
          />
        </svg>
      </div>

      {/* Main Background with Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #04524B 0%, #033D38 100%)",
        }}
      />

      {/* Background Pattern - Same as Footer/Hero */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FB9903' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating Decorative Orbs - Subtle */}
      <div
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 animate-pulse-slow"
        style={{
          background: "radial-gradient(circle, #FB9903 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-15 animate-pulse-slow-reverse"
        style={{
          background: "radial-gradient(circle, #FB9903 0%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      <div className="container px-4 sm:px-6 relative z-10">
        {/* Main Content */}
        <div className="max-w-4xl mx-auto text-center">
          {/* Gold Accent Line */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-1 bg-genoun-gold rounded-full" />
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            {title}{" "}
            <span className="text-genoun-gold">{titleHighlight}</span>
            <span className="text-genoun-gold">؟</span>
          </h2>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>

          {/* CTA Button */}
          <div className="mb-12">
            <Link href={buttonLink}>
              <button className="group relative px-8 py-4 bg-genoun-gold hover:bg-genoun-gold-light text-genoun-green font-bold text-lg rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-genoun-gold/30 flex items-center gap-3 mx-auto">
                <Sparkles className="w-5 h-5 transition-transform group-hover:rotate-12" />
                <span>{buttonText}</span>
                <ArrowUpRight
                  className={`w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 ${
                    isRtl ? "rotate-90" : ""
                  }`}
                />
              </button>
            </Link>
          </div>

          {/* Contact Info - Compact Chips */}
          <div
            className={`flex flex-wrap items-center justify-center gap-3 ${
              isRtl ? "flex-row-reverse" : ""
            }`}
          >
            {/* Phone */}
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="group flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 border border-white/10 hover:border-genoun-gold/40 hover:bg-white/15 transition-all duration-300 backdrop-blur-sm"
            >
              <div className="w-7 h-7 rounded-full bg-genoun-green/30 flex items-center justify-center group-hover:bg-genoun-gold transition-colors">
                <Phone className="w-3.5 h-3.5 text-white group-hover:text-genoun-green transition-colors" />
              </div>
              <span className="text-white/90 text-sm font-medium" dir="ltr">
                {phone}
              </span>
            </a>

            {/* Email */}
            <a
              href={`mailto:${email}`}
              className="group flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 border border-white/10 hover:border-genoun-gold/40 hover:bg-white/15 transition-all duration-300 backdrop-blur-sm"
            >
              <div className="w-7 h-7 rounded-full bg-genoun-gold/30 flex items-center justify-center group-hover:bg-genoun-gold transition-colors">
                <Mail className="w-3.5 h-3.5 text-white group-hover:text-genoun-green transition-colors" />
              </div>
              <span className="text-white/90 text-sm font-medium">{email}</span>
            </a>

            {/* Location */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm">
              <div className="w-7 h-7 rounded-full bg-genoun-green/30 flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-white/90 text-sm font-medium">
                {address}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
