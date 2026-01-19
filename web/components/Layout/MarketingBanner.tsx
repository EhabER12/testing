"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Sparkles,
  Tag,
  Gift,
  Megaphone,
  Star,
  Zap,
  Bell,
  Info,
  X,
} from "lucide-react";
import { PublicWebsiteSettingsData } from "@/store/services/settingsService";
import { cn } from "@/lib/utils";

interface MarketingBannerProps {
  settings: PublicWebsiteSettingsData;
}

export default function MarketingBanner({ settings }: MarketingBannerProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const bannerSettings = settings?.marketingBanners;

  const activeBanners = (bannerSettings?.banners || []).filter(
    (b) => b.isEnabled && (isRtl ? b.text.ar : b.text.en)
  );

  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, bannerSettings?.autoSlideInterval || 5000);

    return () => clearInterval(interval);
  }, [activeBanners.length, bannerSettings?.autoSlideInterval, isPaused]);

  if (
    !bannerSettings?.enabled ||
    !bannerSettings.banners ||
    bannerSettings.banners.length === 0
  ) {
    return null;
  }

  if (activeBanners.length === 0 || !isVisible) {
    return null;
  }

  const currentBanner = activeBanners[currentIndex];
  const text = isRtl ? currentBanner.text.ar : currentBanner.text.en;
  const linkText = isRtl
    ? currentBanner.linkText?.ar
    : currentBanner.linkText?.en;

  const renderIcon = (iconName: string) => {
    const iconProps = { className: "h-4 w-4 shrink-0" };
    switch (iconName) {
      case "Sparkles":
        return <Sparkles {...iconProps} />;
      case "Tag":
        return <Tag {...iconProps} />;
      case "Gift":
        return <Gift {...iconProps} />;
      case "Megaphone":
        return <Megaphone {...iconProps} />;
      case "Star":
        return <Star {...iconProps} />;
      case "Zap":
        return <Zap {...iconProps} />;
      case "Bell":
        return <Bell {...iconProps} />;
      case "Info":
        return <Info {...iconProps} />;
      default:
        return null;
    }
  };

  return (
    <div
      data-marketing-banner
      className="relative z-50 w-full transition-all duration-300 ease-in-out"
      style={{
        backgroundColor: currentBanner.backgroundColor,
        color: currentBanner.textColor,
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      suppressHydrationWarning
    >
      <div className="container relative flex items-center justify-center h-10 px-4 text-sm font-medium">
        <div
          key={currentIndex}
          className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
          {currentBanner.icon && (
            <span className="flex-shrink-0">
              {renderIcon(currentBanner.icon)}
            </span>
          )}
          <span className="text-center line-clamp-1">{text}</span>

          {currentBanner.linkUrl && (
            <Link
              href={currentBanner.linkUrl}
              className={cn(
                "inline-flex items-center justify-center rounded-full px-3 py-0.5 text-xs font-bold transition-colors flex-shrink-0",
                "bg-white/20 hover:bg-white/30 active:bg-white/40 backdrop-blur-sm"
              )}
            >
              {linkText || (isRtl ? "عرض المزيد" : "Learn More")}
            </Link>
          )}
        </div>

        <button
          onClick={() => setIsVisible(false)}
          className="absolute end-4 p-1 hover:bg-black/10 rounded-full transition-colors"
          aria-label={isRtl ? "إغلاق" : "Close"}
        >
          <X className="h-4 w-4 opacity-70" key="close-icon" />
        </button>
      </div>
    </div>
  );
}
