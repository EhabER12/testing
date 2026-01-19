"use client";

import { Languages } from "lucide-react";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";

interface LanguageSwitcherProps {
  className?: string;
  language?: "en" | "ar";
  setLanguage?: (lang: "en" | "ar") => void;
}

export function LanguageSwitcher({
  className = "",
  language,
  setLanguage,
}: LanguageSwitcherProps) {
  const { locale: globalLocale, setLocale: setGlobalLocale } = useAdminLocale();

  // Use controlled state if provided, otherwise fallback to global locale
  const currentLocale = language || globalLocale;

  const handleSwitch = (newLang: "en" | "ar") => {
    if (setLanguage) {
      setLanguage(newLang);
    } else {
      setGlobalLocale(newLang);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Languages className="w-4 h-4 text-gray-500" />
      <div className="flex items-center gap-1 bg-gray-200 rounded-lg p-1">
        <button
          type="button"
          onClick={() => handleSwitch("ar")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            currentLocale === "ar"
              ? "bg-[#04524B] text-white"
              : "text-gray-600 hover:bg-gray-300"
          }`}
        >
          العربية
        </button>
        <button
          type="button"
          onClick={() => handleSwitch("en")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            currentLocale === "en"
              ? "bg-[#04524B] text-white"
              : "text-gray-600 hover:bg-gray-300"
          }`}
        >
          English
        </button>
      </div>
    </div>
  );
}
