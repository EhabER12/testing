"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Sparkles } from "lucide-react";

const WhatsAppIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#fff">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const translations = {
  ar: {
    chatWithUs: "تحدث معنا",
    needHelp: "هل تحتاج مساعدة؟",
    greeting: "مرحباً! كيف يمكننا مساعدتك اليوم؟",
    startChat: "ابدأ المحادثة",
    close: "إغلاق",
  },
  en: {
    chatWithUs: "Chat with us",
    needHelp: "Need help?",
    greeting: "Hello! How can we help you today?",
    startChat: "Start Chat",
    close: "Close",
  },
};

interface FloatingWhatsAppProps {
  phoneNumber?: string;
}

export function FloatingWhatsApp({
  phoneNumber = "201022944477",
}: FloatingWhatsAppProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);
  const pathname = usePathname();

  const locale = pathname.startsWith("/en") ? "en" : "ar";
  const isRtl = locale === "ar";
  const t = translations[locale];

  // Show button after a delay
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Stop pulsing after user interaction
  useEffect(() => {
    if (isOpen) setIsPulsing(false);
  }, [isOpen]);

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    locale === "ar"
      ? "مرحباً، أريد الاستفسار عن خدماتكم"
      : "Hello, I would like to inquire about your services"
  )}`;

  // Hide on dashboard and auth pages
  const isDashboard = pathname.includes("/dashboard");
  const isAuthPage =
    pathname.includes("/login") || pathname.includes("/register");

  // Check if we are on a product page
  const isProductPage = pathname.includes("/products/");

  if (!isVisible || isDashboard || isAuthPage) return null;

  return (
    <>
      {/* Floating Button */}
      <div
        className={`fixed z-50 transition-all duration-500 ${
          isRtl ? "left-4 md:left-6" : "right-4 md:right-6"
        } ${isProductPage ? "bottom-24 md:bottom-6" : "bottom-4 md:bottom-6"}`}
      >
        {/* Expanded Chat Card */}
        <div
          className={`absolute bottom-full mb-4 transition-all duration-300 ${
            isRtl ? "left-0" : "right-0"
          } ${
            isOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          <div
            className="w-72 bg-white rounded-2xl shadow-2xl overflow-hidden"
            dir={isRtl ? "rtl" : "ltr"}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-[#25D366] to-[#128C7E] p-4">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%222%22%20cy%3D%222%22%20r%3D%221%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
              <div className="relative flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white backdrop-blur-sm flex items-center justify-center">
                  <WhatsAppIcon />
                </div>
                <div>
                  <h4 className="font-bold text-white">{t.chatWithUs}</h4>
                  <p className="text-white/80 text-xs flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                    {locale === "ar" ? "متصل الآن" : "Online now"}
                  </p>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="p-4 bg-gray-50">
              <div
                className={`relative bg-white rounded-2xl p-3 shadow-sm ${
                  isRtl ? "rounded-tr-none" : "rounded-tl-none"
                }`}
              >
                <p className="text-gray-700 text-sm">{t.greeting}</p>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  {new Date().toLocaleTimeString(
                    locale === "ar" ? "ar-SA" : "en-US",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="p-4 pt-0">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300 group"
              >
                <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>{t.startChat}</span>
                <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>
        </div>

        {/* Main Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`group relative flex items-center gap-2 transition-all duration-300 ${
            isOpen
              ? "bg-gray-800 hover:bg-gray-900 rounded-full p-4"
              : "bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:shadow-xl hover:shadow-green-500/40 rounded-full md:rounded-2xl p-4 md:px-6"
          }`}
          aria-label={isOpen ? t.close : t.chatWithUs}
        >
          {/* Pulse Animation */}
          {isPulsing && !isOpen && (
            <>
              <span className="absolute inset-0 rounded-full md:rounded-2xl bg-[#25D366] animate-ping opacity-30" />
              <span className="absolute inset-0 rounded-full md:rounded-2xl bg-[#25D366] animate-pulse opacity-20" />
            </>
          )}

          {/* Button Content */}
          <div className="relative flex items-center gap-2">
            {isOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <>
                <WhatsAppIcon />
                <span className="hidden md:block text-white font-bold text-sm">
                  {t.needHelp}
                </span>
              </>
            )}
          </div>

          {/* Notification Badge */}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">1</span>
            </span>
          )}
        </button>
      </div>
    </>
  );
}

export default FloatingWhatsApp;
