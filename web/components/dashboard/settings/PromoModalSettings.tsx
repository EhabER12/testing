"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PromoModalSettings as PromoModalSettingsType } from "@/store/services/settingsService";

interface PromoModalSettingsProps {
  promoModal: PromoModalSettingsType;
  setPromoModal: (settings: PromoModalSettingsType) => void;
  formLang: "en" | "ar";
}

export const PromoModalSettings: React.FC<PromoModalSettingsProps> = ({
  promoModal,
  setPromoModal,
  formLang,
}) => {
  const updateSettings = (field: string, value: any) => {
    const updated = { ...promoModal };
    
    if (field.startsWith("title_")) {
      updated.title = { ...updated.title, [field.split("_")[1]]: value };
    } else if (field.startsWith("content_")) {
      updated.content = { ...updated.content, [field.split("_")[1]]: value };
    } else if (field.startsWith("buttonText_")) {
      updated.buttonText = { ...updated.buttonText, [field.split("_")[1]]: value };
    } else {
      (updated as any)[field] = value;
    }

    setPromoModal(updated);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{formLang === "ar" ? "النافذة المنبثقة الترويجية" : "Promotional Modal"}</CardTitle>
          <CardDescription>
            {formLang === "ar"
              ? "قم بتهيئة النافذة التي تظهر للزوار عند دخول الموقع"
              : "Configure the modal that appears to visitors when they enter the site"}
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={promoModal.isEnabled}
            onCheckedChange={(checked) => updateSettings("isEnabled", checked)}
          />
          <Label>{formLang === "ar" ? "مفعل" : "Enabled"}</Label>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{formLang === "ar" ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
            <Input
              value={promoModal.title.ar}
              onChange={(e) => updateSettings("title_ar", e.target.value)}
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label>{formLang === "ar" ? "العنوان (إنجليزي)" : "Title (English)"}</Label>
            <Input
              value={promoModal.title.en}
              onChange={(e) => updateSettings("title_en", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{formLang === "ar" ? "المحتوى" : "Content"}</Label>
          <Textarea
            value={formLang === "ar" ? promoModal.content.ar : promoModal.content.en}
            onChange={(e) => updateSettings(`content_${formLang}`, e.target.value)}
            dir={formLang === "ar" ? "rtl" : "ltr"}
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>{formLang === "ar" ? "نص الزر (عربي)" : "Button Text (Arabic)"}</Label>
            <Input
              value={promoModal.buttonText.ar}
              onChange={(e) => updateSettings("buttonText_ar", e.target.value)}
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label>{formLang === "ar" ? "نص الزر (إنجليزي)" : "Button Text (English)"}</Label>
            <Input
              value={promoModal.buttonText.en}
              onChange={(e) => updateSettings("buttonText_en", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{formLang === "ar" ? "رابط الزر" : "Button Link"}</Label>
            <Input
              value={promoModal.buttonLink}
              onChange={(e) => updateSettings("buttonLink", e.target.value)}
              placeholder="/special-offer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{formLang === "ar" ? "تأخير الظهور (ملي ثانية)" : "Display Delay (ms)"}</Label>
            <Input
              type="number"
              value={promoModal.displayDelay}
              onChange={(e) => updateSettings("displayDelay", parseInt(e.target.value))}
            />
          </div>
          <div className="flex items-center space-x-2 pt-8">
            <Switch
              checked={promoModal.showOnce}
              onCheckedChange={(checked) => updateSettings("showOnce", checked)}
            />
            <Label>{formLang === "ar" ? "إظهار مرة واحدة فقط" : "Show once only"}</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
