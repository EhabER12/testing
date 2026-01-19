"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PublicWebsiteSettingsData } from "@/store/services/settingsService";

interface HomepageBannerProps {
    settings?: PublicWebsiteSettingsData | null;
    locale: string;
}

export function HomepageBanner({ settings, locale }: HomepageBannerProps) {
    const isRtl = locale === "ar";
    const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

    const bannerSettings = settings?.homepageBanner;

    // Don't render if disabled or not configured
    if (!bannerSettings?.isEnabled || !bannerSettings.imageUrl) {
        return null;
    }

    const title = isRtl ? bannerSettings.title.ar : bannerSettings.title.en;
    const subtitle = isRtl ? bannerSettings.subtitle.ar : bannerSettings.subtitle.en;
    const buttonText = isRtl ? bannerSettings.buttonText.ar : bannerSettings.buttonText.en;
    const buttonLink = bannerSettings.buttonLink;

    return (
        <section className="relative w-full py-16 md:py-20 bg-gradient-to-br from-genoun-green/5 to-genoun-gold/5">
            <div className="container px-4 sm:px-6 md:px-8">
                <div
                    className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12"
                    dir={isRtl ? "rtl" : "ltr"}
                >
                    {/* Text Content */}
                    <div className="flex-1 text-center lg:text-start">
                        {title && (
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-genoun-green mb-4">
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            <p className="text-lg sm:text-xl text-gray-600 mb-6 max-w-2xl mx-auto lg:mx-0">
                                {subtitle}
                            </p>
                        )}
                        {buttonText && buttonLink && (
                            <Link
                                href={buttonLink}
                                className="inline-flex items-center gap-2 px-8 py-4 bg-genoun-gold hover:bg-genoun-gold-light text-genoun-green font-bold text-lg rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-genoun-gold/30"
                            >
                                <span>{buttonText}</span>
                                <ArrowIcon className="w-5 h-5" />
                            </Link>
                        )}
                    </div>

                    {/* Image */}
                    <div className="flex-1 w-full max-w-lg lg:max-w-xl">
                        <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-2xl">
                            <Image
                                src={bannerSettings.imageUrl}
                                alt={title || "Banner"}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                                priority
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
