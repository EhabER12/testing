"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, BookOpen } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BooksPageHeroSettings as BooksPageHeroSettingsType } from "@/store/services/settingsService";

interface BooksPageHeroSettingsProps {
  settings: BooksPageHeroSettingsType;
  onUpdate: (settings: BooksPageHeroSettingsType) => void;
  locale: "ar" | "en";
}

export function BooksPageHeroSettings({
  settings,
  onUpdate,
  locale,
}: BooksPageHeroSettingsProps) {
  const isRtl = locale === "ar";

  const handleTextChange = (
    field: "title" | "subtitle",
    lang: "ar" | "en",
    value: string
  ) => {
    onUpdate({
      ...settings,
      [field]: {
        ...settings[field],
        [lang]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {isRtl
            ? "عدل عنوان ووصف صفحة الكتب التي تظهر في الموقع."
            : "Edit the books page heading and description shown on the website."}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {isRtl ? "إعدادات صفحة الكتب" : "Books Page Settings"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-medium">
              {isRtl ? "العنوان" : "Title"}
            </Label>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="books-title-ar" className="text-sm text-gray-600">
                  {isRtl ? "العربية" : "Arabic"}
                </Label>
                <Input
                  id="books-title-ar"
                  value={settings.title?.ar || ""}
                  onChange={(e) => handleTextChange("title", "ar", e.target.value)}
                  placeholder="الكتب"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="books-title-en" className="text-sm text-gray-600">
                  {isRtl ? "الإنجليزية" : "English"}
                </Label>
                <Input
                  id="books-title-en"
                  value={settings.title?.en || ""}
                  onChange={(e) => handleTextChange("title", "en", e.target.value)}
                  placeholder="Books"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">
              {isRtl ? "الوصف" : "Description"}
            </Label>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="books-subtitle-ar" className="text-sm text-gray-600">
                  {isRtl ? "العربية" : "Arabic"}
                </Label>
                <Input
                  id="books-subtitle-ar"
                  value={settings.subtitle?.ar || ""}
                  onChange={(e) => handleTextChange("subtitle", "ar", e.target.value)}
                  placeholder="مجموعة منتقاة من الكتب الرقمية الجاهزة للشراء"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="books-subtitle-en" className="text-sm text-gray-600">
                  {isRtl ? "الإنجليزية" : "English"}
                </Label>
                <Input
                  id="books-subtitle-en"
                  value={settings.subtitle?.en || ""}
                  onChange={(e) => handleTextChange("subtitle", "en", e.target.value)}
                  placeholder="A curated collection of digital books ready for purchase"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

