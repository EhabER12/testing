// middleware.ts
import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@/i18n/request";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
  localeDetection: false, // Don't auto-detect browser locale, always default to Arabic
});

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|dashboard|login|forgot-password|reset-password|complete-registration|.*\\..*).*)",
    "/",
    "/(en|ar)/:path*",
  ],
};
