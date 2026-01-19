"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import type { Locale } from "@/i18n/request";

const languageNames: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
};

interface AdminLanguageSwitcherProps {
  variant?: "default" | "ghost" | "outline";
  showLabel?: boolean;
}

export function AdminLanguageSwitcher({
  variant = "ghost",
  showLabel = true,
}: AdminLanguageSwitcherProps) {
  const { locale, setLocale, t } = useAdminLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={showLabel ? "default" : "icon"}
          className="gap-2"
        >
          <Globe className="h-4 w-4" />
          {showLabel && <span>{languageNames[locale]}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setLocale("en")}
          className={locale === "en" ? "bg-accent" : ""}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocale("ar")}
          className={locale === "ar" ? "bg-accent" : ""}
        >
          العربية
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
