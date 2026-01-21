"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HomepageSections, SectionConfig } from "@/store/services/settingsService";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HomepageSectionsSettingsProps {
  sections: HomepageSections;
  setSections: (sections: HomepageSections) => void;
  formLang: "en" | "ar";
  heroBackgroundPreview?: string | null;
  setHeroBackgroundPreview?: (preview: string | null) => void;
  onHeroBackgroundFileChange?: (file: File | null) => void;
}

export const HomepageSectionsSettings: React.FC<HomepageSectionsSettingsProps> = ({
  sections,
  setSections,
  formLang,
  heroBackgroundPreview,
  setHeroBackgroundPreview,
  onHeroBackgroundFileChange,
}) => {
  const updateSection = (sectionKey: keyof HomepageSections, field: string, value: any) => {
    const updatedSections = { ...sections };
    const section = { ...updatedSections[sectionKey] } as SectionConfig;

    if (field.startsWith("title_")) {
      section.title = { ...section.title, [field.split("_")[1]]: value };
    } else if (field.startsWith("subtitle_")) {
      section.subtitle = { ...section.subtitle, [field.split("_")[1]]: value };
    } else if (field.startsWith("content_")) {
      section.content = { ...section.content, [field.split("_")[1]]: value };
    } else if (field.startsWith("buttonText_")) {
      section.buttonText = { ...section.buttonText, [field.split("_")[1]]: value };
    } else {
      (section as any)[field] = value;
    }

    updatedSections[sectionKey] = section;
    setSections(updatedSections);
  };

  const renderSectionForm = (key: keyof HomepageSections, label: string) => {
    const section = sections[key];
    if (!section) return null;

    return (
      <Card key={key} className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{label}</CardTitle>
            <CardDescription>
              {formLang === "ar" ? `إعدادات قسم ${label}` : `Settings for ${label} section`}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={section.isEnabled}
              onCheckedChange={(checked) => updateSection(key, "isEnabled", checked)}
            />
            <Label>{formLang === "ar" ? "مفعل" : "Enabled"}</Label>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{formLang === "ar" ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
              <Input
                value={section.title.ar}
                onChange={(e) => updateSection(key, "title_ar", e.target.value)}
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label>{formLang === "ar" ? "العنوان (إنجليزي)" : "Title (English)"}</Label>
              <Input
                value={section.title.en}
                onChange={(e) => updateSection(key, "title_en", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{formLang === "ar" ? "العنوان الفرعي (عربي)" : "Subtitle (Arabic)"}</Label>
              <Input
                value={section.subtitle.ar}
                onChange={(e) => updateSection(key, "subtitle_ar", e.target.value)}
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label>{formLang === "ar" ? "العنوان الفرعي (إنجليزي)" : "Subtitle (English)"}</Label>
              <Input
                value={section.subtitle.en}
                onChange={(e) => updateSection(key, "subtitle_en", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{formLang === "ar" ? "المحتوى" : "Content"}</Label>
            <Textarea
              value={formLang === "ar" ? section.content.ar : section.content.en}
              onChange={(e) => updateSection(key, `content_${formLang}`, e.target.value)}
              dir={formLang === "ar" ? "rtl" : "ltr"}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{formLang === "ar" ? "نص الزر (عربي)" : "Button Text (Arabic)"}</Label>
              <Input
                value={section.buttonText.ar}
                onChange={(e) => updateSection(key, "buttonText_ar", e.target.value)}
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label>{formLang === "ar" ? "نص الزر (إنجليزي)" : "Button Text (English)"}</Label>
              <Input
                value={section.buttonText.en}
                onChange={(e) => updateSection(key, "buttonText_en", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{formLang === "ar" ? "رابط الزر" : "Button Link"}</Label>
              <Input
                value={section.buttonLink}
                onChange={(e) => updateSection(key, "buttonLink", e.target.value)}
                placeholder="/courses"
              />
            </div>
          </div>
          {/* Background Image Field - Only for Hero Section */}
          {key === "hero" && (
            <div className="space-y-2">
              <Label>{formLang === "ar" ? "صورة الخلفية" : "Background Image"}</Label>

              {/* Image Preview */}
              {(heroBackgroundPreview || section.backgroundImage) && (
                <div className="relative inline-block">
                  <Image
                    src={heroBackgroundPreview || section.backgroundImage || ""}
                    alt="Hero Background Preview"
                    width={300}
                    height={150}
                    className="h-32 w-auto object-cover border rounded"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border"
                    onClick={() => {
                      if (setHeroBackgroundPreview) setHeroBackgroundPreview(null);
                      if (onHeroBackgroundFileChange) onHeroBackgroundFileChange(null);
                      updateSection(key, "backgroundImage", "");
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* File Input */}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && onHeroBackgroundFileChange) {
                    onHeroBackgroundFileChange(file);
                    // Create preview
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      if (setHeroBackgroundPreview) {
                        setHeroBackgroundPreview(reader.result as string);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <p className="text-sm text-muted-foreground">
                {formLang === "ar"
                  ? "قم برفع صورة للخلفية (يفضل 1920x1080 بكسل)"
                  : "Upload background image (recommended 1920x1080px)"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="hero">
        <TabsList className="mb-4">
          <TabsTrigger value="hero">{formLang === "ar" ? "الرئيسي" : "Hero"}</TabsTrigger>
          <TabsTrigger value="features">{formLang === "ar" ? "المميزات" : "Features"}</TabsTrigger>
          <TabsTrigger value="services">{formLang === "ar" ? "الخدمات" : "Services"}</TabsTrigger>
          <TabsTrigger value="about">{formLang === "ar" ? "من نحن" : "About"}</TabsTrigger>
          <TabsTrigger value="cta">{formLang === "ar" ? "دعوة للعمل" : "CTA"}</TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          {renderSectionForm("hero", formLang === "ar" ? "القسم الرئيسي" : "Hero Section")}
        </TabsContent>
        <TabsContent value="features">
          {renderSectionForm("features", formLang === "ar" ? "المميزات" : "Features Section")}
        </TabsContent>
        <TabsContent value="services">
          {renderSectionForm("services", formLang === "ar" ? "الخدمات" : "Services Section")}
        </TabsContent>
        <TabsContent value="about">
          {renderSectionForm("about", formLang === "ar" ? "من نحن" : "About Section")}
        </TabsContent>
        <TabsContent value="cta">
          {renderSectionForm("cta", formLang === "ar" ? "دعوة للعمل" : "CTA Section")}
        </TabsContent>
      </Tabs>
    </div>
  );
};
