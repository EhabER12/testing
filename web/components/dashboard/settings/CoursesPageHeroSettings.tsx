"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, BookOpen, Image as ImageIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CoursesPageHeroSettings as CoursesPageHeroSettingsType } from "@/store/services/settingsService";

interface CoursesPageHeroSettingsProps {
  settings: CoursesPageHeroSettingsType;
  onUpdate: (settings: CoursesPageHeroSettingsType) => void;
  locale: "ar" | "en";
}

export function CoursesPageHeroSettings({
  settings,
  onUpdate,
  locale,
}: CoursesPageHeroSettingsProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleInputChange = (
    field: keyof CoursesPageHeroSettingsType,
    value: any
  ) => {
    onUpdate({
      ...settings,
      [field]: value,
    });
  };

  const handleTextChange = (
    field: "badge" | "title" | "subtitle",
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target?.result as string);
        handleInputChange("backgroundImage", event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const isRtl = locale === "ar";

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {isRtl
            ? "قم بتخصيص قسم الهيدر في صفحة الدورات. يمكنك إخفاءه أو تعديل النصوص والصورة الخلفية."
            : "Customize the hero section on the courses page. You can hide it or modify the texts and background image."}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {isRtl ? "إعدادات الهيدر" : "Hero Section Settings"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-base font-medium">
                {isRtl ? "تفعيل الهيدر" : "Enable Hero Section"}
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                {isRtl
                  ? "قم بإيقافه لإخفاء قسم الهيدر من صفحة الدورات"
                  : "Turn off to hide the hero section from courses page"}
              </p>
            </div>
            <Switch
              checked={settings.isEnabled !== false}
              onCheckedChange={(checked) =>
                handleInputChange("isEnabled", checked)
              }
            />
          </div>

          {settings.isEnabled !== false && (
            <>
              {/* Badge Text */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-genoun-green rounded-full"></span>
                  {isRtl ? "نص الشارة (Badge)" : "Badge Text"}
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="badge-ar" className="text-sm text-gray-600">
                      {isRtl ? "العربية" : "Arabic"}
                    </Label>
                    <Input
                      id="badge-ar"
                      value={settings.badge?.ar || ""}
                      onChange={(e) =>
                        handleTextChange("badge", "ar", e.target.value)
                      }
                      placeholder={isRtl ? "دوراتنا التعليمية" : "Our Courses"}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="badge-en" className="text-sm text-gray-600">
                      {isRtl ? "الإنجليزية" : "English"}
                    </Label>
                    <Input
                      id="badge-en"
                      value={settings.badge?.en || ""}
                      onChange={(e) =>
                        handleTextChange("badge", "en", e.target.value)
                      }
                      placeholder={isRtl ? "دوراتنا التعليمية" : "Our Courses"}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-genoun-green rounded-full"></span>
                  {isRtl ? "العنوان الرئيسي" : "Main Title"}
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title-ar" className="text-sm text-gray-600">
                      {isRtl ? "العربية" : "Arabic"}
                    </Label>
                    <Input
                      id="title-ar"
                      value={settings.title?.ar || ""}
                      onChange={(e) =>
                        handleTextChange("title", "ar", e.target.value)
                      }
                      placeholder={
                        isRtl
                          ? "ابدأ رحلتك في تحفيظ القرآن الكريم"
                          : "Start Your Quran Memorization Journey"
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="title-en" className="text-sm text-gray-600">
                      {isRtl ? "الإنجليزية" : "English"}
                    </Label>
                    <Input
                      id="title-en"
                      value={settings.title?.en || ""}
                      onChange={(e) =>
                        handleTextChange("title", "en", e.target.value)
                      }
                      placeholder={
                        isRtl
                          ? "ابدأ رحلتك في تحفيظ القرآن الكريم"
                          : "Start Your Quran Memorization Journey"
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Subtitle */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-genoun-green rounded-full"></span>
                  {isRtl ? "العنوان الفرعي" : "Subtitle"}
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="subtitle-ar"
                      className="text-sm text-gray-600"
                    >
                      {isRtl ? "العربية" : "Arabic"}
                    </Label>
                    <Input
                      id="subtitle-ar"
                      value={settings.subtitle?.ar || ""}
                      onChange={(e) =>
                        handleTextChange("subtitle", "ar", e.target.value)
                      }
                      placeholder={
                        isRtl
                          ? "مع دوراتنا المتخصصة"
                          : "With Our Specialized Courses"
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="subtitle-en"
                      className="text-sm text-gray-600"
                    >
                      {isRtl ? "الإنجليزية" : "English"}
                    </Label>
                    <Input
                      id="subtitle-en"
                      value={settings.subtitle?.en || ""}
                      onChange={(e) =>
                        handleTextChange("subtitle", "en", e.target.value)
                      }
                      placeholder={
                        isRtl
                          ? "مع دوراتنا المتخصصة"
                          : "With Our Specialized Courses"
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Background Image */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  {isRtl ? "صورة الخلفية (اختياري)" : "Background Image (Optional)"}
                </Label>
                <div className="space-y-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  {previewImage && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-2">
                        {isRtl ? "معاينة الصورة:" : "Image Preview:"}
                      </p>
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <span className="text-white text-sm">
                            {isRtl ? "معاينة الخلفية" : "Background Preview"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  {settings.backgroundImage && !previewImage && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-2">
                        {isRtl ? "الصورة الحالية:" : "Current Image:"}
                      </p>
                      <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                        <img
                          src={settings.backgroundImage}
                          alt="Current"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
