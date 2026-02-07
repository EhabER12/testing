"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Facebook,
  Instagram,
  Compass,
  Mail,
  MapPin,
  Phone,
  ArrowUp,
} from "lucide-react";
import { Separator } from "../ui/separator";

interface WebsiteSettings {
  siteName: string;
  siteName_ar?: string;
  siteDescription: string;
  siteDescription_ar?: string;
  logo: string;
  logo_ar?: string;
  favicon: string;
  socialLinks: {
    platform: string;
    url: string;
    _id: string;
  }[];
  contactEmail: string;
  contactPhone: string;
  whatsappNumber?: string;
  address: string;
  address_ar?: string;
}

interface FooterProps {
  settings?: WebsiteSettings | null;
}

const translations = {
  ar: {
    quickLinks: "روابط سريعة",
    contactUs: "تواصل معنا",
    followUs: "تابعنا",
    description:
      "شريكك التقني الاستراتيجي في المملكة. ندمج الإبداع بالبيانات لنبني لك حضوراً رقمياً لا يُنافس.",
    copyright: "جنون. جميع الحقوق محفوظة.",
    home: "الرئيسية",
    services: "خدماتنا",
    products: "المنتجات",
    portfolio: "أعمالنا",
    articles: "المقالات",
    reviews: "آراء العملاء",
    backToTop: "العودة للأعلى",
  },
  en: {
    quickLinks: "Quick Links",
    contactUs: "Contact Us",
    followUs: "Follow Us",
    description:
      "Your strategic tech partner in the Kingdom. We merge creativity with data to build you an unrivaled digital presence.",
    copyright: "Genoun. All rights reserved.",
    home: "Home",
    services: "Services",
    products: "Products",
    portfolio: "Portfolio",
    articles: "Articles",
    reviews: "Reviews",
    backToTop: "Back to Top",
  },
};

const XIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

export default function Footer({ settings }: FooterProps) {
  const pathname = usePathname();
  const [locale, setLocale] = useState<"ar" | "en">("ar");

  useEffect(() => {
    if (pathname.startsWith("/en")) {
      setLocale("en");
    } else {
      setLocale("ar");
    }
  }, [pathname]);

  const isRtl = locale === "ar";
  const t = translations[locale];

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "facebook":
        return <Facebook className="h-5 w-5" />;
      case "twitter":
      case "x":
        return <XIcon />;
      case "instagram":
        return <Instagram className="h-5 w-5" />;
      case "whatsapp":
        return <WhatsAppIcon />;
      case "email":
        return <Mail className="h-5 w-5" />;
      default:
        return <Compass className="h-5 w-5" />;
    }
  };

  const currentYear = new Date().getFullYear();

  const getLocalizedHref = (href: string) => {
    if (href.startsWith("#")) return href;
    if (href === "/") return `/${locale}`;
    return `/${locale}${href}`;
  };

  const navItems = [
    { label: t.home, href: "/" },
    { label: t.services, href: "#services" },
    { label: t.products, href: "/products" },
    { label: t.portfolio, href: "#results" },
    { label: t.articles, href: "/articles" },
    { label: t.reviews, href: "#reviews" },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative md:mt-24" dir={isRtl ? "rtl" : "ltr"}>
      {/* Wave Shape - Same as Hero */}
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

      {/* Main Footer Content */}
      <div
        className="relative pt-16 pb-8"
        style={{
          background: "linear-gradient(180deg, #04524B 0%, #033D38 100%)",
        }}
      >
        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FB9903' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          {/* Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div className="lg:col-span-1">
              <Link
                href={getLocalizedHref("/")}
                className="flex items-center gap-3 mb-6"
              >
                {settings?.logo ? (
                  <Image
                    src={
                      isRtl && settings.logo_ar
                        ? settings.logo_ar
                        : settings.logo
                    }
                    alt={
                      (isRtl ? settings.siteName_ar : settings.siteName) ||
                      "Genoun"
                    }
                    width={48}
                    height={48}
                    className="h-12 w-12 object-contain"
                  />
                ) : null}
                <span className="text-2xl font-bold text-white">
                  {(isRtl ? settings?.siteName_ar : settings?.siteName) ||
                    settings?.siteName ||
                    (isRtl ? "جنون" : "Genoun")}
                </span>
              </Link>
              <p className="text-white/70 leading-relaxed text-sm">
                {(isRtl
                  ? settings?.siteDescription_ar
                  : settings?.siteDescription) ||
                  settings?.siteDescription ||
                  t.description}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-0.5 bg-genoun-gold rounded-full"></span>
                {t.quickLinks}
              </h3>
              <ul className="space-y-3">
                {navItems.map((item, index) => (
                  <li key={index}>
                    <Link
                      href={
                        item.href.startsWith("#")
                          ? item.href
                          : getLocalizedHref(item.href)
                      }
                      className="text-white/70 hover:text-genoun-gold transition-colors text-sm"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-0.5 bg-genoun-gold rounded-full"></span>
                {t.contactUs}
              </h3>
              <ul className="space-y-4">
                {settings?.contactEmail && (
                  <li className="flex items-center gap-3 text-white/70 text-sm">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-genoun-gold" />
                    </div>
                    <a
                      href={`mailto:${settings.contactEmail}`}
                      className="hover:text-genoun-gold transition-colors"
                    >
                      {settings.contactEmail}
                    </a>
                  </li>
                )}
                {settings?.contactPhone && (
                  <li className="flex items-center gap-3 text-white/70 text-sm">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-genoun-gold" />
                    </div>
                    <a
                      href={`tel:${settings.contactPhone}`}
                      className="hover:text-genoun-gold transition-colors"
                    >
                      {settings.contactPhone}
                    </a>
                  </li>
                )}
                {settings?.whatsappNumber && (
                  <li className="flex items-center gap-3 text-white/70 text-sm">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-genoun-gold">
                      <WhatsAppIcon />
                    </div>
                    <a
                      href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-genoun-gold transition-colors"
                    >
                      {settings.whatsappNumber}
                    </a>
                  </li>
                )}
                {settings?.address && (
                  <li className="flex items-center gap-3 text-white/70 text-sm">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-4 w-4 text-genoun-gold" />
                    </div>
                    <span>
                      {(isRtl ? settings.address_ar : settings.address) ||
                        settings.address}
                    </span>
                  </li>
                )}
              </ul>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-0.5 bg-genoun-gold rounded-full"></span>
                {t.followUs}
              </h3>
              <div className="flex flex-wrap gap-3">
                {settings?.socialLinks && settings.socialLinks.length > 0
                  ? settings.socialLinks.map((social) => (
                      <a
                        key={social._id}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-white/80 hover:bg-genoun-gold hover:text-genoun-green transition-all duration-300"
                      >
                        {getSocialIcon(social.platform)}
                      </a>
                    ))
                  : null}
              </div>

              {/* Back to Top Button */}
              <button
                onClick={scrollToTop}
                className="mt-8 flex items-center gap-2 text-white/60 hover:text-genoun-gold transition-colors text-sm group"
              >
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-genoun-gold/20 transition-colors">
                  <ArrowUp className="h-4 w-4" />
                </div>
                <span>{t.backToTop}</span>
              </button>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
            {/* Static Pages Links Row */}
            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 ">
              <Link
                href={getLocalizedHref("/pages/about-us")}
                className="text-white/60 hover:text-genoun-gold transition-colors text-sm"
              >
                {isRtl ? "من نحن" : "About Us"}
              </Link>
              <Link
                href={getLocalizedHref("/pages/privacy-policy")}
                className="text-white/60 hover:text-genoun-gold transition-colors text-sm"
              >
                {isRtl ? "سياسة الخصوصية" : "Privacy Policy"}
              </Link>
              <Link
                href={getLocalizedHref("/pages/terms-and-conditions")}
                className="text-white/60 hover:text-genoun-gold transition-colors text-sm"
              >
                {isRtl ? "الشروط والأحكام" : "Terms & Conditions"}
              </Link>
              <Link
                href={getLocalizedHref("/pages/faqs")}
                className="text-white/60 hover:text-genoun-gold transition-colors text-sm"
              >
                {isRtl ? "الأسئلة الشائعة" : "FAQs"}
              </Link>
              <Link
                href={getLocalizedHref("/pages/refund-policy")}
                className="text-white/60 hover:text-genoun-gold transition-colors text-sm"
              >
                {isRtl ? "سياسة الاسترداد" : "Refund Policy"}
              </Link>
            </div>

            {/* Centered cops */}
            <div className="flex flex-col gap-2 md:flex-row justify-between items-center text-center space-y-2">
              <p className="text-white/50 text-sm">
                © {currentYear}{" "}
                {(isRtl ? settings?.siteName_ar : settings?.siteName) ||
                  settings?.siteName ||
                  t.copyright}
              </p>
              {/* Gold Separator */}
              <p className="text-white/40 text-sm !mt-0  ">
                {locale === "ar" ? "تطوير" : "Developed by"}{" "}
                <a
                  href="https://www.linkedin.com/in/hazemaamer/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-genoun-gold hover:text-genoun-gold-light transition-colors"
                >
                  hazemaamer
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
