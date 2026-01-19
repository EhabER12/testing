"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  TrendingUp,
  Briefcase,
  Award,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

function AnimatedCounter({
  value,
  suffix,
  prefix,
}: {
  value: number;
  suffix: string;
  prefix?: string;
}) {
  const [count, setCount] = useState(0);
  const counterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            let start = 0;
            const duration = 2000;
            const increment = value / (duration / 16);

            const timer = setInterval(() => {
              start += increment;
              if (start >= value) {
                setCount(value);
                clearInterval(timer);
              } else {
                setCount(Math.floor(start));
              }
            }, 16);

            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => observer.disconnect();
  }, [value]);

  return (
    <div
      ref={counterRef}
      className="text-4xl sm:text-5xl md:text-6xl font-bold text-genoun-gold"
    >
      {prefix && <span className="text-2xl sm:text-3xl mr-2">{prefix}</span>}
      {count}
      {suffix}
    </div>
  );
}

export function ResultsSection({ locale }: { locale: string }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const t = useTranslations("landing.results");
  const isRtl = locale === "ar";

  const stats = [
    { value: 150, suffix: "%+", label: t("stat1Label"), icon: TrendingUp },
    { value: 300, suffix: "+", label: t("stat2Label"), icon: Briefcase },
    {
      value: 1,
      suffix: "",
      label: t("stat3Label"),
      prefix: "Page",
      icon: Award,
    },
  ];

  // Case studies remain in-content for now (could be CMS-driven)
  const caseStudies = [
    {
      category: isRtl ? "متجر عطور" : "Perfume Store",
      title: isRtl
        ? "فيديو ترويجي وصل لمليون مشاهدة"
        : "Promotional Video Reached 1M Views",
      result: isRtl ? "+300% زيادة استفسارات" : "+300% Inquiry Increase",
      gradient: "from-purple-600 to-pink-600",
    },
    {
      category: isRtl ? "قطاع التجميل والعيادات" : "Beauty & Clinics Sector",
      title: isRtl
        ? "تحويل المحتوى إلى حجوزات فعلية"
        : "Converting Content to Actual Bookings",
      result: isRtl ? "استراتيجية SEO ذكية" : "Smart SEO Strategy",
      gradient: "from-blue-600 to-cyan-600",
    },
    {
      category: isRtl ? "المطاعم" : "Restaurants",
      title: isRtl ? "حملة إطلاق ناجحة" : "Successful Launch Campaign",
      result: isRtl
        ? "9,800 زيارة في الأسبوع الأول"
        : "9,800 Visits in First Week",
      gradient: "from-orange-600 to-red-600",
    },
  ];

  useGSAP(() => {
    if (!sectionRef.current) return;

    gsap.from(".stat-item", {
      y: 40,
      opacity: 0,
      duration: 0.6,
      stagger: 0.2,
      ease: "power3.out",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 70%",
        toggleActions: "play none none reverse",
      },
    });

    // Refresh ScrollTrigger after a short delay to ensure proper triggering
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  }, []);

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % caseStudies.length);
  };

  const prevSlide = () => {
    setActiveSlide(
      (prev) => (prev - 1 + caseStudies.length) % caseStudies.length
    );
  };

  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <section
      ref={sectionRef}
      id="results"
      className="py-20 sm:py-28 bg-white relative overflow-hidden"
    >
      <div className="container px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16" dir={isRtl ? "rtl" : "ltr"}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t("title")}{" "}
            <span className="text-genoun-green">{t("titleHighlight")}</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Stats Grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto mb-20"
          dir={isRtl ? "rtl" : "ltr"}
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              className="stat-item text-center p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200"
            >
              <div className="w-12 h-12 rounded-2xl bg-genoun-green/10 flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-6 h-6 text-genoun-green" />
              </div>
              <AnimatedCounter
                value={stat.value}
                suffix={stat.suffix}
                prefix={stat.prefix}
              />
              <p className="text-gray-600 mt-2 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Case Studies Slider */}
        <div className="max-w-4xl mx-auto" dir={isRtl ? "rtl" : "ltr"}>
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            {t("caseStudiesTitle")}
          </h3>

          <div className="relative">
            {/* Slide */}
            <div className="overflow-hidden rounded-3xl">
              <div
                className={`p-8 sm:p-12 bg-gradient-to-br ${caseStudies[activeSlide].gradient} text-white transition-all duration-500`}
              >
                <span className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm font-medium mb-4">
                  {caseStudies[activeSlide].category}
                </span>
                <h4
                  className={`text-2xl sm:text-3xl font-bold mb-4 ${
                    isRtl ? "text-right" : "text-left"
                  }`}
                >
                  {caseStudies[activeSlide].title}
                </h4>
                <p
                  className={`text-xl text-white/90 ${
                    isRtl ? "text-right" : "text-left"
                  }`}
                >
                  {caseStudies[activeSlide].result}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div
              className={`flex items-center justify-center gap-4 mt-6 ${
                isRtl ? "flex-row-reverse" : ""
              }`}
            >
              <button
                onClick={prevSlide}
                className="p-3 rounded-full bg-gray-100 hover:bg-genoun-green hover:text-white transition-colors"
              >
                <PrevIcon className="w-5 h-5" />
              </button>

              {/* Dots */}
              <div className="flex gap-2">
                {caseStudies.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === activeSlide
                        ? "bg-genoun-gold w-8"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                className="p-3 rounded-full bg-gray-100 hover:bg-genoun-green hover:text-white transition-colors"
              >
                <NextIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
