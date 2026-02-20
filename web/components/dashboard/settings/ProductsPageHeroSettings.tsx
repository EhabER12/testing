"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  Image as ImageIcon,
  Loader2,
  ShoppingBag,
  Trash2,
  Upload,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProductsPageHeroSettings as ProductsPageHeroSettingsType } from "@/store/services/settingsService";
import { uploadImage } from "@/store/services/uploadService";
import toast from "react-hot-toast";

interface ProductsPageHeroSettingsProps {
  settings: ProductsPageHeroSettingsType;
  onUpdate: (settings: ProductsPageHeroSettingsType) => void;
  locale: "ar" | "en";
}

export function ProductsPageHeroSettings({
  settings,
  onUpdate,
  locale,
}: ProductsPageHeroSettingsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const isRtl = locale === "ar";

  const handleInputChange = (
    field: keyof ProductsPageHeroSettingsType,
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

    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        isRtl
          ? "\u062d\u062c\u0645 \u0627\u0644\u0635\u0648\u0631\u0629 \u064a\u062c\u0628 \u0623\u0646 \u064a\u0643\u0648\u0646 \u0623\u0642\u0644 \u0645\u0646 5 \u0645\u064a\u062c\u0627\u0628\u0627\u064a\u062a"
          : "Image must be less than 5MB"
      );
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await uploadImage(file);
      handleInputChange("backgroundImage", imageUrl);
      toast.success(
        isRtl
          ? "\u062a\u0645 \u0631\u0641\u0639 \u0627\u0644\u0635\u0648\u0631\u0629 \u0628\u0646\u062c\u0627\u062d"
          : "Image uploaded successfully"
      );
    } catch (error) {
      toast.error(
        isRtl
          ? "\u0641\u0634\u0644 \u0631\u0641\u0639 \u0627\u0644\u0635\u0648\u0631\u0629"
          : "Failed to upload image"
      );
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = () => {
    handleInputChange("backgroundImage", "");
    toast.success(
      isRtl
        ? "\u062a\u0645 \u062d\u0630\u0641 \u0627\u0644\u0635\u0648\u0631\u0629"
        : "Image removed"
    );
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {isRtl
            ? "\u062a\u062e\u0635\u064a\u0635 \u0628\u0646\u0631 \u0635\u0641\u062d\u0629 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a (\u0627\u0644\u0634\u0627\u0631\u0629\u060c \u0627\u0644\u0639\u0646\u0648\u0627\u0646\u060c \u0627\u0644\u0648\u0635\u0641 \u0648\u0627\u0644\u062e\u0644\u0641\u064a\u0629)."
            : "Customize the products page hero section (badge, title, subtitle, and background image)."}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            {isRtl
              ? "\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0628\u0646\u0631 \u0635\u0641\u062d\u0629 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a"
              : "Products Hero Settings"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-base font-medium">
                {isRtl
                  ? "\u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0628\u0646\u0631"
                  : "Enable Hero Section"}
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                {isRtl
                  ? "\u0625\u064a\u0642\u0627\u0641\u0647 \u064a\u062e\u0641\u064a \u0627\u0644\u0628\u0646\u0631 \u0645\u0646 \u0635\u0641\u062d\u0629 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a"
                  : "Turn off to hide the hero section from products page"}
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
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  {isRtl ? "\u0627\u0644\u0634\u0627\u0631\u0629" : "Badge"}
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="products-badge-ar" className="text-sm text-gray-600">
                      {isRtl ? "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" : "Arabic"}
                    </Label>
                    <Input
                      id="products-badge-ar"
                      value={settings.badge?.ar || ""}
                      onChange={(e) => handleTextChange("badge", "ar", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="products-badge-en" className="text-sm text-gray-600">
                      {isRtl ? "\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629" : "English"}
                    </Label>
                    <Input
                      id="products-badge-en"
                      value={settings.badge?.en || ""}
                      onChange={(e) => handleTextChange("badge", "en", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">
                  {isRtl ? "\u0627\u0644\u0639\u0646\u0648\u0627\u0646" : "Title"}
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="products-title-ar" className="text-sm text-gray-600">
                      {isRtl ? "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" : "Arabic"}
                    </Label>
                    <Input
                      id="products-title-ar"
                      value={settings.title?.ar || ""}
                      onChange={(e) => handleTextChange("title", "ar", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="products-title-en" className="text-sm text-gray-600">
                      {isRtl ? "\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629" : "English"}
                    </Label>
                    <Input
                      id="products-title-en"
                      value={settings.title?.en || ""}
                      onChange={(e) => handleTextChange("title", "en", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">
                  {isRtl ? "\u0627\u0644\u0648\u0635\u0641" : "Subtitle"}
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="products-subtitle-ar" className="text-sm text-gray-600">
                      {isRtl ? "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" : "Arabic"}
                    </Label>
                    <Input
                      id="products-subtitle-ar"
                      value={settings.subtitle?.ar || ""}
                      onChange={(e) => handleTextChange("subtitle", "ar", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="products-subtitle-en" className="text-sm text-gray-600">
                      {isRtl ? "\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629" : "English"}
                    </Label>
                    <Input
                      id="products-subtitle-en"
                      value={settings.subtitle?.en || ""}
                      onChange={(e) => handleTextChange("subtitle", "en", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  {isRtl
                    ? "\u0635\u0648\u0631\u0629 \u062e\u0644\u0641\u064a\u0629 \u0627\u0644\u0628\u0646\u0631"
                    : "Hero Background Image"}
                </Label>

                {settings.backgroundImage && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={settings.backgroundImage}
                      alt="Products Hero"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="text-white text-sm font-medium drop-shadow">
                        {isRtl
                          ? "\u0627\u0644\u0635\u0648\u0631\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629"
                          : "Current image"}
                      </span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {isRtl ? "\u062d\u0630\u0641" : "Remove"}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <label
                    htmlFor="products-hero-upload"
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed ${
                      isUploading
                        ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                        : "border-genoun-green/30 bg-genoun-green/5 hover:bg-genoun-green/10 cursor-pointer"
                    } transition-colors`}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-genoun-green" />
                        <span className="text-sm font-medium text-genoun-green">
                          {isRtl
                            ? "\u062c\u0627\u0631\u064a \u0627\u0644\u0631\u0641\u0639..."
                            : "Uploading..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-genoun-green" />
                        <span className="text-sm font-medium text-genoun-green">
                          {settings.backgroundImage
                            ? isRtl
                              ? "\u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u0635\u0648\u0631\u0629"
                              : "Change image"
                            : isRtl
                              ? "\u0631\u0641\u0639 \u0635\u0648\u0631\u0629"
                              : "Upload image"}
                        </span>
                      </>
                    )}
                  </label>
                  <Input
                    id="products-hero-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
