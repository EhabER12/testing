"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";

interface FeatureItem {
  icon: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
}

interface ServiceFeaturesProps {
  features: FeatureItem[];
  setFeatures: (features: FeatureItem[]) => void;
  formLang: "ar" | "en";
}

export function ServiceFeatures({
  features,
  setFeatures,
  formLang,
}: ServiceFeaturesProps) {
  const { t } = useAdminLocale();

  const addFeature = () => {
    setFeatures([
      ...features,
      {
        icon: "check",
        title: { ar: "", en: "" },
        description: { ar: "", en: "" },
      },
    ]);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, field: string, value: any) => {
    const updated = [...features];
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      (updated[index] as any)[parent][child] = value;
    } else {
      (updated[index] as any)[field] = value;
    }
    setFeatures(updated);
  };

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="text-lg font-semibold text-gray-900">
          {t("admin.services.features")}
        </h2>
        <Button type="button" variant="outline" size="sm" onClick={addFeature}>
          <Plus className="w-4 h-4 mr-1" />
          {t("admin.services.addFeature")}
        </Button>
      </div>

      {features.map((feature, index) => (
        <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">
              {t("admin.services.feature")} {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeFeature(index)}
              className="text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-3">
            <Input
              placeholder={formLang === "ar" ? "عنوان الميزة" : "Feature Title"}
              value={feature.title[formLang]}
              onChange={(e) =>
                updateFeature(index, `title.${formLang}`, e.target.value)
              }
              dir={formLang === "ar" ? "rtl" : "ltr"}
            />
            <Textarea
              placeholder={
                formLang === "ar" ? "وصف الميزة" : "Feature Description"
              }
              value={feature.description[formLang]}
              onChange={(e) =>
                updateFeature(index, `description.${formLang}`, e.target.value)
              }
              dir={formLang === "ar" ? "rtl" : "ltr"}
              rows={2}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
