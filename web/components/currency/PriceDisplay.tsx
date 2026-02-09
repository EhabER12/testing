"use client";

import { useCurrencyContext } from "@/contexts/CurrencyContext";
import { Skeleton } from "@/components/ui/skeleton";

interface PriceDisplayProps {
  amount: number;
  currency: "SAR" | "EGP" | "USD";
  locale?: "ar" | "en";
  className?: string;
  showOriginal?: boolean;
}

export function PriceDisplay({
  amount,
  currency,
  locale = "en",
  className = "",
  showOriginal = false,
}: PriceDisplayProps) {
  const { selectedCurrency, convert, format, isLoading } = useCurrencyContext();

  if (isLoading) {
    return <Skeleton className={`h-6 w-24 ${className}`} />;
  }

  const convertedAmount = convert(amount, currency, selectedCurrency);
  const displayPrice = format(convertedAmount, selectedCurrency, locale);

  // Show original price if currency was converted
  const showConversion = selectedCurrency !== currency && showOriginal;

  return (
    <div className={`flex flex-col ${className}`}>
      <span className="font-bold text-primary">{displayPrice}</span>
      {showConversion && (
        <span className="text-xs text-muted-foreground line-through">
          {format(amount, currency, locale)}
        </span>
      )}
    </div>
  );
}
