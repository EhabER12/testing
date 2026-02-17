"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, BookOpen, Image as ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CoursesPageHeroSettings as CoursesPageHeroSettingsType } from "@/store/services/settingsService";
import { uploadImage } from "@/store/services/uploadService";
import toast from "react-hot-toast";

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
  const [isUploading, setIsUploading] = useState(false);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(isRtl ? "حجم الصورة يجب أن يكون أقل من 5 ميجابايت" : "Image must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await uploadImage(file);
      handleInputChange("backgroundImage", imageUrl);
      toast.success(isRtl ? "تم رفع الصورة بنجاح" : "Image uploaded successfully");
    } catch (error) {
      toast.error(isRtl ? "فشل رفع الصورة" : "Failed to upload image");
    } finally {
      setIsUploading(false);
      // Reset the file input
      e.target.value = "";
    }
  };

  const handleRemoveImage = () => {
    handleInputChange("backgroundImage", "");
    toast.success(isRtl ? "تم حذف الصورة" : "Image removed");
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

              {/* Background / Banner Image */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  {isRtl ? "صورة البنر / الخلفية" : "Banner / Background Image"}
                </Label>
                <p className="text-sm text-gray-500">
                  {isRtl
                    ? "أضف صورة بنر تظهر في خلفية قسم الهيرو في صفحة الدورات. الحجم المُوصى به: 1920×600 بكسل."
                    : "Add a banner image that appears as the hero section background on the courses page. Recommended size: 1920×600px."}
                </p>

                {/* Current image preview */}
                {settings.backgroundImage && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 group">
                    <img
                      src={settings.backgroundImage}
                      alt="Banner"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="text-white text-sm font-medium">
                        {isRtl ? "صورة البنر الحالية" : "Current Banner Image"}
                      </span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {isRtl ? "حذف" : "Remove"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Upload button */}
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="hero-banner-upload"
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed 
                      ${isUploading
                        ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                        : "border-genoun-green/30 bg-genoun-green/5 hover:bg-genoun-green/10 cursor-pointer"
                      } transition-colors`}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-genoun-green" />
                        <span className="text-sm font-medium text-genoun-green">
                          {isRtl ? "جاري الرفع..." : "Uploading..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-genoun-green" />
                        <span className="text-sm font-medium text-genoun-green">
                          {settings.backgroundImage
                            ? (isRtl ? "تغيير الصورة" : "Change Image")
                            : (isRtl ? "رفع صورة بنر" : "Upload Banner Image")}
                        </span>
                      </>
                    )}
                  </label>
                  <Input
                    id="hero-banner-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                  <span className="text-xs text-gray-400">
                    {isRtl ? "PNG, JPG, WEBP (حد أقصى 5 ميجابايت)" : "PNG, JPG, WEBP (max 5MB)"}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

