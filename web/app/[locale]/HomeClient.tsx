"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// Landing Page Sections
import {
  HeroSection,
  AuthorityBar,
  WhyGenoun,
  ServicesSection,
  ProductsSection,
  ResultsSection,
  MethodologySection,
  CTASection,
  ReviewsSection,
  ArticlesSection,
  PromoModal,
} from "@/components/sections/landing";
import { HomepageBanner } from "@/components/sections/landing/HomepageBanner";
import { HomepageCourses } from "@/components/sections/landing/HomepageCourses";
import { PublicWebsiteSettingsData } from "@/store/services/settingsService";

gsap.registerPlugin(ScrollTrigger);

// Define types for server-side data
interface BilingualText {
  ar: string;
  en: string;
}

interface Category {
  id: string;
  _id?: string;
  name: BilingualText;
  slug?: string;
}

interface Product {
  id: string;
  _id?: string;
  name: BilingualText;
  shortDescription?: BilingualText;
  description?: BilingualText;
  slug: string;
  categoryId: string | { _id: string; name: BilingualText };
  category?: Category;
  coverImage: string;
  basePrice: number;
  compareAtPrice?: number;
  currency: string;
  variants?: any[];
  addons?: any[];
  isFeatured?: boolean;
  isActive?: boolean;
}

interface Review {
  id: string;
  _id?: string;
  name: string;
  rating: number;
  comment: string;
  review?: string;
  status?: string;
}

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

interface HomeClientProps {
  locale: string;
  products?: Product[];
  categories?: Category[];
  reviews?: Review[];
  settings?: PublicWebsiteSettingsData | null;
  articles?: Article[];
}

export default function HomeClient({
  locale,
  products = [],
  categories = [],
  reviews = [],
  settings,
  articles = [],
}: HomeClientProps) {
  const reviewsRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Refresh ScrollTrigger after a delay to ensure proper detection
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 500);

    let fallbackTimer: NodeJS.Timeout;
    let header: Element | null = null;

    if (reviewsRef.current) {
      header = reviewsRef.current.querySelector(".mb-12, .mb-14, .mb-16");
      if (header) {
        // Use fromTo() to ensure elements are visible even if animation fails
        gsap.fromTo(
          header,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: reviewsRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );

        // Fallback: ensure visibility after 3 seconds if animation hasn't triggered
        fallbackTimer = setTimeout(() => {
          if (header) {
            gsap.set(header, { opacity: 1, y: 0 });
          }
        }, 3000);
      }
    }

    return () => {
      clearTimeout(refreshTimer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [reviews]);

  return (
    <main className="flex-1">
      {settings?.promoModal && (
        <PromoModal settings={settings.promoModal} locale={locale} />
      )}

      {/* Hero Section - Quran Memorization */}
      <HeroSection locale={locale} settings={settings || undefined} />

      {/* Authority Bar - Platform Recognition */}
      <AuthorityBar locale={locale} settings={settings || undefined} />

      {/* Why Choose Our Platform - Value Proposition */}
      <WhyGenoun locale={locale} settings={settings || undefined} />

      {/* Homepage Banner - Configurable */}
      <HomepageBanner settings={settings || undefined} locale={locale} />

      {/* Homepage Courses - Configurable */}
      <HomepageCourses settings={settings || undefined} locale={locale} />

      {/* Reviews Section - Student Testimonials */}
      <ReviewsSection
        ref={reviewsRef}
        locale={locale}
        reviews={reviews}
        settings={settings || undefined}
      />

      {/* Final CTA Section */}
      <CTASection locale={locale} settings={settings || undefined} />
    </main>
  );
}
