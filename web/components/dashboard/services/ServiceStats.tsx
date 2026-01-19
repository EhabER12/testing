"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";

interface StatItem {
  value: string;
  label: { ar: string; en: string };
  icon: string;
}

interface ServiceStatsProps {
  stats: StatItem[];
  setStats: (stats: StatItem[]) => void;
  formLang: "ar" | "en";
}

export function ServiceStats({ stats, setStats, formLang }: ServiceStatsProps) {
  const { t } = useAdminLocale();

  const addStat = () => {
    setStats([
      ...stats,
      {
        value: "",
        label: { ar: "", en: "" },
        icon: "trending-up",
      },
    ]);
  };

  const removeStat = (index: number) => {
    setStats(stats.filter((_, i) => i !== index));
  };

  const updateStat = (index: number, field: string, value: any) => {
    const updated = [...stats];
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      (updated[index] as any)[parent][child] = value;
    } else {
      (updated[index] as any)[field] = value;
    }
    setStats(updated);
  };

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="text-lg font-semibold text-gray-900">
          {t("admin.services.stats")}
        </h2>
        <Button type="button" variant="outline" size="sm" onClick={addStat}>
          <Plus className="w-4 h-4 mr-1" />
          {t("admin.services.addStat")}
        </Button>
      </div>

      {stats.map((stat, index) => (
        <div
          key={index}
          className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
        >
          <GripVertical className="w-5 h-5 text-gray-400 mt-2" />
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              placeholder={
                formLang === "ar"
                  ? "القيمة (مثل: 14→60)"
                  : "Value (e.g., 14→60)"
              }
              value={stat.value}
              onChange={(e) => updateStat(index, "value", e.target.value)}
            />
            <Input
              placeholder={formLang === "ar" ? "التسمية" : "Label"}
              value={stat.label[formLang]}
              onChange={(e) =>
                updateStat(index, `label.${formLang}`, e.target.value)
              }
              dir={formLang === "ar" ? "rtl" : "ltr"}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeStat(index)}
            className="text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
