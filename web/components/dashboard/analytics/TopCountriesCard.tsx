"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe } from "lucide-react";

interface Country {
  country: string;
  users: number;
}

interface TopCountriesCardProps {
  countries: Country[];
  totalUsers: number;
  isRtl: boolean;
}

// Country flag mapping
const COUNTRY_FLAGS: Record<string, string> = {
  "United States": "🇺🇸",
  "Saudi Arabia": "🇸🇦",
  Egypt: "🇪🇬",
  "United Arab Emirates": "🇦🇪",
  Kuwait: "🇰🇼",
  Qatar: "🇶🇦",
  Bahrain: "🇧🇭",
  Oman: "🇴🇲",
  Jordan: "🇯🇴",
  Lebanon: "🇱🇧",
  Iraq: "🇮🇶",
  Morocco: "🇲🇦",
  Tunisia: "🇹🇳",
  Algeria: "🇩🇿",
  Germany: "🇩🇪",
  France: "🇫🇷",
  "United Kingdom": "🇬🇧",
  Canada: "🇨🇦",
  India: "🇮🇳",
  Pakistan: "🇵🇰",
  Turkey: "🇹🇷",
  Russia: "🇷🇺",
  China: "🇨🇳",
  Japan: "🇯🇵",
  Brazil: "🇧🇷",
  "(not set)": "🌍",
};

export function getCountryFlag(countryName: string): string {
  return COUNTRY_FLAGS[countryName] || "🌍";
}

function formatPercentage(value: number, total: number) {
  if (!total) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

export function TopCountriesCard({
  countries,
  totalUsers,
  isRtl,
}: TopCountriesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          {isRtl ? "أعلى الدول" : "Top Countries"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {countries.map((country, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-lg">{getCountryFlag(country.country)}</span>
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span>{country.country}</span>
                  <span className="text-muted-foreground">{country.users}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: formatPercentage(country.users, totalUsers),
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          {countries.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              {isRtl ? "لا توجد بيانات" : "No data"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
