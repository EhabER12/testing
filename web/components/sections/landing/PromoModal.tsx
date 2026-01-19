"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PromoModalSettings } from "@/store/services/settingsService";

interface PromoModalProps {
  settings: PromoModalSettings;
  locale: string;
}

export const PromoModal: React.FC<PromoModalProps> = ({ settings, locale }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isRtl = locale === "ar";

  useEffect(() => {
    if (!settings?.isEnabled) return;

    const hasShown = localStorage.getItem("promo_modal_shown");
    if (settings.showOnce && hasShown) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
      if (settings.showOnce) {
        localStorage.setItem("promo_modal_shown", "true");
      }
    }, settings.displayDelay || 3000);

    return () => clearTimeout(timer);
  }, [settings]);

  if (!settings?.isEnabled) return null;

  const title = isRtl ? settings.title.ar : settings.title.en;
  const content = isRtl ? settings.content.ar : settings.content.en;
  const buttonText = isRtl ? settings.buttonText.ar : settings.buttonText.en;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none bg-transparent shadow-none">
        <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl" dir={isRtl ? "rtl" : "ltr"}>
          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Image Header if available */}
          {settings.imageUrl && (
            <div className="relative h-48 w-full">
              <Image
                src={settings.imageUrl}
                alt={title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
            </div>
          )}

          <div className="p-8 text-center space-y-6">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-genoun-gold/10 text-genoun-gold mb-2">
              <Sparkles className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {content}
              </p>
            </div>

            <div className="pt-2">
              <Link href={settings.buttonLink || "#"}>
                <Button className="w-full h-12 text-lg font-bold bg-genoun-gold hover:bg-genoun-gold-light text-genoun-green rounded-full shadow-lg shadow-genoun-gold/20 transition-all hover:scale-105">
                  {buttonText}
                </Button>
              </Link>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isRtl ? "ربما لاحقاً" : "Maybe later"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
