"use client";

import { SarIcon } from "./sar-icon";
import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  amount: number;
  locale?: string;
  className?: string;
  iconClassName?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * Displays currency with proper formatting:
 * - Arabic: Uses SAR icon
 * - English: Shows USD text
 */
export function CurrencyDisplay({
  amount,
  locale = "ar",
  className,
  iconClassName,
  showIcon = true,
  size = "md",
}: CurrencyDisplayProps) {
  const isArabic = locale === "ar";

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 18,
    xl: 22,
  };

  // For Arabic, show SAR icon
  if (isArabic) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1",
          sizeClasses[size],
          className
        )}
      >
        <span>{amount.toLocaleString("ar-SA")}</span>
        {showIcon && (
          <SarIcon
            size={iconSizes[size]}
            className={cn("text-primary", iconClassName)}
          />
        )}
      </span>
    );
  }

  // For English, show USD
  return (
    <span className={cn(sizeClasses[size], className)}>
      ${amount.toLocaleString("en-US")} USD
    </span>
  );
}

/**
 * Simple SAR amount display (always shows SAR icon)
 */
export function SarAmount({
  amount,
  className,
  iconClassName,
  size = "md",
}: Omit<CurrencyDisplayProps, "locale" | "showIcon">) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 18,
    xl: 22,
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1",
        sizeClasses[size],
        className
      )}
    >
      <span>{amount.toLocaleString("ar-SA")}</span>
      <SarIcon
        size={iconSizes[size]}
        className={cn("text-primary", iconClassName)}
      />
    </span>
  );
}
