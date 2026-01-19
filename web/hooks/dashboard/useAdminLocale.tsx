"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { Locale } from "@/i18n/request";

// Import translations
import enMessages from "@/messages/en.json";
import arMessages from "@/messages/ar.json";

type Messages = typeof enMessages;

interface AdminLocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRtl: boolean;
  messages: Messages;
}

const AdminLocaleContext = createContext<AdminLocaleContextType | undefined>(
  undefined
);

const LOCALE_STORAGE_KEY = "admin-locale";

const messagesMap: Record<Locale, Messages> = {
  en: enMessages,
  ar: arMessages,
};

function getNestedValue(obj: any, path: string): string {
  const keys = path.split(".");
  let result = obj;

  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = result[key];
    } else {
      return path; // Return the key if translation not found
    }
  }

  return typeof result === "string" ? result : path;
}

export function AdminLocaleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load saved locale from localStorage
    const savedLocale = localStorage.getItem(
      LOCALE_STORAGE_KEY
    ) as Locale | null;
    if (
      savedLocale &&
      (savedLocale === "en" || savedLocale === "ar" || savedLocale === "fr")
    ) {
      setLocaleState(savedLocale);
    }
    setMounted(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    // Update document direction
    document.documentElement.dir = newLocale === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLocale;
  }, []);

  const messages = messagesMap[locale];
  const isRtl = locale === "ar";

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let text = getNestedValue(messages, key);

      if (params && text) {
        Object.entries(params).forEach(([key, value]) => {
          text = text.replace(new RegExp(`{${key}}`, "g"), String(value));
        });
      }

      return text;
    },
    [messages]
  );

  // Set initial direction
  useEffect(() => {
    if (mounted) {
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
      document.documentElement.lang = locale;
    }
  }, [mounted, isRtl, locale]);

  // Always provide context, use default values before mount
  return (
    <AdminLocaleContext.Provider
      value={{ locale, setLocale, t, isRtl, messages }}
    >
      {children}
    </AdminLocaleContext.Provider>
  );
}

export function useAdminLocale() {
  const context = useContext(AdminLocaleContext);
  if (context === undefined) {
    throw new Error(
      "useAdminLocale must be used within an AdminLocaleProvider"
    );
  }
  return context;
}
