"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

export function NavigationProgress() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        NProgress.configure({
            showSpinner: false,
            minimum: 0.3,
            easing: 'ease',
            speed: 500,
        });

        const handleStart = () => NProgress.start();
        const handleComplete = () => NProgress.done();

        // Start progress on route change
        handleStart();

        // Cleanup
        return () => {
            handleComplete();
        };
    }, [pathname, searchParams]);

    return null;
}
