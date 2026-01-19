"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, Home, Sparkles } from "lucide-react";

export default function NotFound() {
  const pathname = usePathname();
  const isRtl = pathname?.startsWith("/ar");
  const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;

  const content = {
    title: isRtl ? "الصفحة غير موجودة" : "Page Not Found",
    description: isRtl
      ? "عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها."
      : "Sorry, the page you're looking for doesn't exist or has been moved.",
    homeButton: isRtl ? "العودة للرئيسية" : "Return Home",
    contactText: isRtl ? "هل تحتاج مساعدة؟" : "Need help?",
    contactLink: isRtl ? "تواصل معنا" : "Contact us",
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex items-center justify-center px-4"
      style={{
        background:
          "linear-gradient(135deg, #04524B 0%, #033D38 50%, #1A1A1A 100%)",
      }}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FB9903' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FB9903]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#04524B]/30 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg mx-auto text-center">
        <div className="p-8 sm:p-12 backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-3xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="h-24 w-24 rounded-full bg-[#FB9903]/20 flex items-center justify-center">
              <Sparkles className="h-12 w-12 text-[#FB9903] animate-pulse" />
            </div>
          </div>

          {/* 404 */}
          <h1 className="text-8xl font-bold text-[#FB9903] mb-2">404</h1>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            {content.title}
          </h2>

          {/* Description */}
          <p className="text-white/70 mb-8 text-lg leading-relaxed">
            {content.description}
          </p>

          {/* Home Button */}
          <Link href="/">
            <button
              className={`inline-flex items-center gap-3 px-8 py-4 bg-[#FB9903] text-white font-bold rounded-full hover:bg-[#FB9903]/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 ${isRtl ? "flex-row-reverse" : ""
                }`}
            >
              <Home className="w-5 h-5" />
              <span>{content.homeButton}</span>
            </button>
          </Link>

          {/* Contact Link */}
          <div className="mt-6">
            <span className="text-white/50 text-sm">
              {content.contactText}{" "}
            </span>
            <Link
              href="/forms/contact"
              className="text-[#FB9903] hover:underline text-sm font-medium"
            >
              {content.contactLink}
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-white/30 text-sm" suppressHydrationWarning>
          Genoun &copy; 2026
        </div>
      </div>
    </div>
  );
}
