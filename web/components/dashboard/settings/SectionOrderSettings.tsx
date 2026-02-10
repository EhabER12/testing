"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { HomepageSections, AuthorityBarSettings, ReviewsSectionSettings, WhyGenounSettings } from "@/store/services/settingsService";
import { GripVertical, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SectionOrderItem {
  key: string;
  label: { ar: string; en: string };
  order: number;
  isEnabled: boolean;
  type: 'homepage' | 'authority' | 'reviews' | 'whyGenoun';
}

interface SectionOrderSettingsProps {
  sections: HomepageSections;
  setSections: (sections: HomepageSections) => void;
  authorityBar: AuthorityBarSettings;
  setAuthorityBar: (settings: AuthorityBarSettings) => void;
  reviewsSettings: ReviewsSectionSettings;
  setReviewsSettings: (settings: ReviewsSectionSettings) => void;
  whyGenounSettings: WhyGenounSettings;
  setWhyGenounSettings: (settings: WhyGenounSettings) => void;
  formLang: "en" | "ar";
}

export const SectionOrderSettings: React.FC<SectionOrderSettingsProps> = ({
  sections,
  setSections,
  authorityBar,
  setAuthorityBar,
  reviewsSettings,
  setReviewsSettings,
  whyGenounSettings,
  setWhyGenounSettings,
  formLang,
}) => {
  const [orderedSections, setOrderedSections] = useState<SectionOrderItem[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Section labels
  const allSectionLabels: Record<string, { ar: string; en: string }> = {
    hero: { ar: "القسم الرئيسي", en: "Hero Section" },
    authorityBar: { ar: "شريط الثقة", en: "Authority Bar" },
    features: { ar: "المميزات", en: "Features" },
    whyGenoun: { ar: "لماذا جنون", en: "Why Genoun" },
    services: { ar: "الخدمات", en: "Services" },
    stats: { ar: "الإحصائيات", en: "Statistics" },
    about: { ar: "من نحن", en: "About Us" },
    testimonials: { ar: "آراء الطلاب", en: "Reviews" },
    cta: { ar: "دعوة للعمل", en: "Call to Action" },
  };

  // Initialize ordered sections from props
  useEffect(() => {
    const items: SectionOrderItem[] = [];

    // Add homepage sections
    (Object.keys(sections) as Array<keyof HomepageSections>).forEach((key) => {
      const section = sections[key];
      items.push({
        key: key,
        label: allSectionLabels[key] || { ar: key, en: key },
        order: section.order ?? 0,
        isEnabled: section.isEnabled,
        type: 'homepage',
      });
    });

    // Add authority bar
    items.push({
      key: 'authorityBar',
      label: allSectionLabels.authorityBar,
      order: authorityBar.order ?? 1,
      isEnabled: authorityBar.isEnabled ?? true,
      type: 'authority',
    });

    // Add reviews section
    items.push({
      key: 'testimonials',
      label: allSectionLabels.testimonials,
      order: reviewsSettings.order ?? 6,
      isEnabled: reviewsSettings.isEnabled ?? true,
      type: 'reviews',
    });

    // Add why genoun section
    items.push({
      key: 'whyGenoun',
      label: allSectionLabels.whyGenoun,
      order: whyGenounSettings.order ?? 2,
      isEnabled: whyGenounSettings.isEnabled ?? true,
      type: 'whyGenoun',
    });

    // Remove duplicates and sort by order
    const uniqueItems = Array.from(new Map(items.map(item => [item.key, item])).values());
    uniqueItems.sort((a, b) => a.order - b.order);
    setOrderedSections(uniqueItems);
  }, [sections, authorityBar, reviewsSettings, whyGenounSettings]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === index) return;

    const newOrdered = [...orderedSections];
    const draggedItem = newOrdered[draggedIndex];

    newOrdered.splice(draggedIndex, 1);
    newOrdered.splice(index, 0, draggedItem);

    setOrderedSections(newOrdered);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    applyOrderChanges();
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrdered = [...orderedSections];
    [newOrdered[index - 1], newOrdered[index]] = [newOrdered[index], newOrdered[index - 1]];
    setOrderedSections(newOrdered);
    applyOrderChanges(newOrdered);
  };

  const moveDown = (index: number) => {
    if (index === orderedSections.length - 1) return;
    const newOrdered = [...orderedSections];
    [newOrdered[index], newOrdered[index + 1]] = [newOrdered[index + 1], newOrdered[index]];
    setOrderedSections(newOrdered);
    applyOrderChanges(newOrdered);
  };

  const toggleEnabled = (index: number) => {
    const newOrdered = [...orderedSections];
    newOrdered[index].isEnabled = !newOrdered[index].isEnabled;
    setOrderedSections(newOrdered);
    applyOrderChanges(newOrdered);
  };

  const applyOrderChanges = (ordered?: SectionOrderItem[]) => {
    const items = ordered || orderedSections;
    const updatedSections = { ...sections };
    let updatedAuthorityBar = { ...authorityBar };
    let updatedReviewsSettings = { ...reviewsSettings };
    let updatedWhyGenounSettings = { ...whyGenounSettings };

    items.forEach((item, index) => {
      if (item.type === 'homepage' && item.key in sections) {
        const sectionKey = item.key as keyof HomepageSections;
        updatedSections[sectionKey] = {
          ...sections[sectionKey],
          order: index,
          isEnabled: item.isEnabled,
        };
      } else if (item.type === 'authority') {
        updatedAuthorityBar = {
          ...authorityBar,
          order: index,
          isEnabled: item.isEnabled,
        };
      } else if (item.type === 'reviews') {
        updatedReviewsSettings = {
          ...reviewsSettings,
          order: index,
          isEnabled: item.isEnabled,
        };
      } else if (item.type === 'whyGenoun') {
        updatedWhyGenounSettings = {
          ...whyGenounSettings,
          order: index,
          isEnabled: item.isEnabled,
        };
      }
    });

    setSections(updatedSections);
    setAuthorityBar(updatedAuthorityBar);
    setReviewsSettings(updatedReviewsSettings);
    setWhyGenounSettings(updatedWhyGenounSettings);
  };

  const handleOrderInputChange = (index: number, value: string) => {
    const newOrder = parseInt(value, 10);
    if (isNaN(newOrder) || newOrder < 0) return;

    const newOrdered = [...orderedSections];
    newOrdered[index].order = newOrder;

    newOrdered.sort((a, b) => a.order - b.order);
    setOrderedSections(newOrdered);
    applyOrderChanges(newOrdered);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {formLang === "ar" ? "ترتيب أقسام الصفحة الرئيسية" : "Homepage Sections Order"}
        </CardTitle>
        <CardDescription>
          {formLang === "ar"
            ? "قم بترتيب الأقسام عن طريق السحب والإفلات أو استخدام الأزرار"
            : "Arrange sections using drag-and-drop or buttons"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            {formLang === "ar"
              ? "ملاحظة: يمكنك تعطيل الأقسام غير المطلوبة بدلاً من حذفها. الأقسام المعطلة لن تظهر في الصفحة الرئيسية."
              : "Note: You can disable sections instead of removing them. Disabled sections won't appear on the homepage."}
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          {orderedSections.map((item, index) => (
            <div
              key={item.key}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                flex items-center gap-3 p-4 border rounded-lg bg-card cursor-move
                transition-all hover:shadow-md
                ${draggedIndex === index ? "opacity-50 scale-95" : ""}
                ${!item.isEnabled ? "opacity-60 bg-muted" : ""}
              `}
            >
              {/* Drag Handle */}
              <div className="cursor-grab active:cursor-grabbing">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* Order Number */}
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground min-w-[40px]">
                  {formLang === "ar" ? "الترتيب:" : "Order:"}
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={index}
                  onChange={(e) => handleOrderInputChange(index, e.target.value)}
                  className="w-16 h-8 text-center"
                />
              </div>

              {/* Section Label */}
              <div className="flex-1">
                <p className="font-medium">
                  {formLang === "ar" ? item.label.ar : item.label.en}
                </p>
                <p className="text-xs text-muted-foreground">{item.key}</p>
              </div>

              {/* Enable/Disable Toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.isEnabled}
                  onCheckedChange={() => toggleEnabled(index)}
                />
                <Label className="text-sm cursor-pointer">
                  {item.isEnabled ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </Label>
              </div>

              {/* Move Buttons */}
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => moveDown(index)}
                  disabled={index === orderedSections.length - 1}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Alert>
          <AlertDescription className="text-xs">
            {formLang === "ar"
              ? "💡 نصيحة: اسحب الأقسام لإعادة ترتيبها، أو استخدم الأزرار لنقلها لأعلى أو لأسفل."
              : "💡 Tip: Drag sections to reorder them, or use the buttons to move them up or down."}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
