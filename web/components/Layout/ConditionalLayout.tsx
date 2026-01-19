"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import SocialSidebar from "./SocialSidebar";
import { CartDrawer } from "@/components/cart";
import { useLocale } from "next-intl";

interface ConditionalLayoutProps {
  settings: any;
  children: React.ReactNode;
}

export default function ConditionalLayout({
  settings,
  children,
}: ConditionalLayoutProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const isDashboard = pathname?.startsWith("/dashboard");
  const isRtl = locale === "ar";
  const [bannerHeight, setBannerHeight] = useState(0);

  const shouldHideLayout = isDashboard;

  // Check if banners are enabled and exist for current locale
  const hasBanners =
    settings?.marketingBanners?.enabled &&
    settings.marketingBanners.banners?.some(
      (b: any) => b.isEnabled && (isRtl ? b.text?.ar : b.text?.en)
    );

  // Listen for banner visibility changes
  useEffect(() => {
    const updateBannerHeight = () => {
      const banner = document.querySelector("[data-marketing-banner]");
      setBannerHeight(banner ? banner.clientHeight : 0);
    };

    // Initial check
    updateBannerHeight();

    // Watch for changes using MutationObserver
    const observer = new MutationObserver(updateBannerHeight);
    const header = document.querySelector("header");
    if (header) {
      observer.observe(header, { childList: true, subtree: true });
    }

    // Also listen for resize
    window.addEventListener("resize", updateBannerHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateBannerHeight);
    };
  }, [hasBanners]);

  // Base header height (h-20 = 5rem = 80px on desktop, h-16 = 4rem = 64px on mobile)
  // Banner adds 40px (h-10) when visible
  const paddingTop = !shouldHideLayout ? `calc(5rem + ${bannerHeight}px)` : "0";

  return (
    <>
      {!shouldHideLayout && <Header settings={settings} />}
      {!shouldHideLayout && <CartDrawer />}
      {!shouldHideLayout && <SocialSidebar settings={settings} />}
      <div style={{ paddingTop }} className="-mt-4 transition-all duration-300">
        {children}
      </div>
      {!shouldHideLayout && <Footer settings={settings} />}
    </>
  );
}
