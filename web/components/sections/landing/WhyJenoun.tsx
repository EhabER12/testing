"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Check, Globe, BarChart3, Headphones } from "lucide-react";
import { PublicWebsiteSettingsData } from "@/store/services/settingsService";

gsap.registerPlugin(ScrollTrigger);

const translations = {
  ar: {
    title: "لماذا",
    titleHighlight: "جنون",
    subtitle: "لأننا نفهم لغة السوق السعودي ونتحدث بلغة النتائج",
    value1Title: "فهم عميق للسوق السعودي",
    value1Desc:
      "نحن لا نترجم الحلول، نحن نبتكرها لتناسب ذائقة وسلوك العميل المحلي.",
    value2Title: "لغة الأرقام",
    value2Desc:
      "لا نؤمن بالتوقعات. نؤمن بالنتائج القابلة للقياس وتقارير الأداء الدقيقة.",
    value3Title: "شراكة لا تنتهي بالتسليم",
    value3Desc: "دعم فني مستمر، استشارات، وتطوير دائم لضمان استدامة النمو.",
  },
  en: {
    title: "Why",
    titleHighlight: "Genoun LLC",
    subtitle:
      "Because we understand the Saudi market language and speak the language of results",
    value1Title: "Deep Saudi Market Understanding",
    value1Desc:
      "We don't translate solutions, we innovate them to fit local customer taste and behavior.",
    value2Title: "Language of Numbers",
    value2Desc:
      "We don't believe in expectations. We believe in measurable results and precise performance reports.",
    value3Title: "Partnership Beyond Delivery",
    value3Desc:
      "Continuous technical support, consulting, and ongoing development to ensure sustainable growth.",
  },
};

const icons = [Globe, BarChart3, Headphones];

export function WhyGenoun({
  locale,
  settings,
}: {
  locale: string;
  settings?: PublicWebsiteSettingsData | null;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isRtl = locale === "ar";
  const safeLocale = locale === "ar" || locale === "en" ? locale : "ar";
  const t = translations[safeLocale];
  
  const featureSettings = settings?.homepageSections?.features;
  const showDynamic = featureSettings?.isEnabled;

  const title = showDynamic
    ? isRtl
      ? featureSettings.title.ar
      : featureSettings.title.en
    : translations[safeLocale].title;
  
  const titleHighlight = showDynamic
    ? isRtl
      ? featureSettings.subtitle.ar
      : featureSettings.subtitle.en
    : translations[safeLocale].titleHighlight;
  
  const subtitle = showDynamic
    ? isRtl
      ? featureSettings.content.ar
      : featureSettings.content.en
    : translations[safeLocale].subtitle;

  const valuePropositions = [
    { icon: Globe, title: t.value1Title, description: t.value1Desc },
    { icon: BarChart3, title: t.value2Title, description: t.value2Desc },
    { icon: Headphones, title: t.value3Title, description: t.value3Desc },
  ];

  useGSAP(() => {
    if (!sectionRef.current) return;

    // Set initial state to visible first
    gsap.set(".value-card", { opacity: 1, y: 0 });

    gsap.fromTo(
      ".value-card",
      { y: 60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      }
    );
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-20 sm:py-28 bg-gray-50 relative overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-genoun-green/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-genoun-gold/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="container px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16" dir={isRtl ? "rtl" : "ltr"}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {title}{" "}
            <span className="text-genoun-green">{titleHighlight}</span>؟
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Value Propositions Grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto"
          dir={isRtl ? "rtl" : "ltr"}
        >
          {valuePropositions.map((item, index) => (
            <div
              key={index}
              className="value-card group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-genoun-gold/30"
            >
              {/* Icon with checkmark */}
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-genoun-green/10 flex items-center justify-center group-hover:bg-genoun-green transition-colors duration-300">
                  <item.icon className="w-8 h-8 text-genoun-green group-hover:text-white transition-colors duration-300" />
                </div>
                <div
                  className={`absolute -top-2 ${
                    isRtl ? "-right-2" : "-left-2"
                  } w-6 h-6 rounded-full bg-genoun-gold flex items-center justify-center`}
                >
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-genoun-green transition-colors">
                {item.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
