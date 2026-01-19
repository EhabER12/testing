"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

interface LazyAnalyticsProps {
  gaId: string;
}

/**
 * Lazy-loaded Google Analytics that loads AFTER user interaction
 * This prevents GA from blocking initial page render
 * Also excludes /dashboard/* pages from being tracked
 */
export function LazyAnalytics({ gaId }: LazyAnalyticsProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const pathname = usePathname();

  // Don't track admin dashboard pages
  const isDashboardPage = pathname?.startsWith("/dashboard");

  useEffect(() => {
    // Skip analytics loading for dashboard pages
    if (isDashboardPage) return;

    // Load analytics after page is fully loaded and idle
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(
        () => setShouldLoad(true),
        { timeout: 5000 } // Increased to 5 seconds
      );
      return () => window.cancelIdleCallback(id);
    } else {
      const timeout = setTimeout(() => setShouldLoad(true), 3000);
      return () => clearTimeout(timeout);
    }
  }, [isDashboardPage]);

  // Don't render GA on dashboard pages or if not ready to load
  if (isDashboardPage || !shouldLoad || !gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="lazyOnload"
      />
      <Script id="google-analytics" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            page_path: window.location.pathname,
            send_page_view: false
          });
        `}
      </Script>
    </>
  );
}
