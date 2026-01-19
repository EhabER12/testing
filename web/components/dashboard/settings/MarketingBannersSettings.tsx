"use client";

import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Trash2,
  GripVertical,
  Check,
  X,
  Sparkles,
  Tag,
  Gift,
  Megaphone,
  Star,
  Zap,
  Bell,
  Info,
} from "lucide-react";
import { MarketingBannerItem } from "@/store/services/settingsService";
import { updateWebsiteSettingsThunk } from "@/store/services/settingsService";
import toast from "react-hot-toast";

// Helper component for sortable item
function SortableBannerItem({
  banner,
  index,
  isRtl,
  t,
  expanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  isLoading,
}: {
  banner: MarketingBannerItem;
  index: number;
  isRtl: boolean;
  t: (key: string) => string;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (field: string, value: any) => void;
  onDelete: () => void;
  isLoading: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: banner._id || `banner-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const availableIcons = [
    { value: "", label: t("admin.settings.marketingBanners.noIcon") },
    { value: "Sparkles", label: "Sparkles" },
    { value: "Tag", label: "Tag" },
    { value: "Gift", label: "Gift" },
    { value: "Megaphone", label: "Megaphone" },
    { value: "Star", label: "Star" },
    { value: "Zap", label: "Zap" },
    { value: "Bell", label: "Bell" },
    { value: "Info", label: "Info" },
  ];

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "Sparkles":
        return <Sparkles className="h-4 w-4" />;
      case "Tag":
        return <Tag className="h-4 w-4" />;
      case "Gift":
        return <Gift className="h-4 w-4" />;
      case "Megaphone":
        return <Megaphone className="h-4 w-4" />;
      case "Star":
        return <Star className="h-4 w-4" />;
      case "Zap":
        return <Zap className="h-4 w-4" />;
      case "Bell":
        return <Bell className="h-4 w-4" />;
      case "Info":
        return <Info className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="mb-4 border rounded-lg bg-card text-card-foreground shadow-sm"
    >
      <div className="flex items-center p-4 gap-4">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none p-1 hover:bg-accent rounded"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>

        <div
          className="flex-1 grid gap-1 cursor-pointer"
          onClick={onToggleExpand}
        >
          <div className="flex items-center gap-2 font-medium">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: banner.backgroundColor }}
            />
            {renderIcon(banner.icon || "")}
            {isRtl
              ? banner.text.ar
              : banner.text.en ||
                t("admin.settings.marketingBanners.addBanner")}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {isRtl ? banner.text.en : banner.text.ar}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={banner.isEnabled}
            onCheckedChange={(checked) => onUpdate("isEnabled", checked)}
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={isLoading}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Arabic Content */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {t("admin.settings.arabicContent")}
              </Label>
              <div className="space-y-2">
                <Label>{t("admin.settings.marketingBanners.bannerText")}</Label>
                <Input
                  value={banner.text.ar}
                  onChange={(e) =>
                    onUpdate("text", { ...banner.text, ar: e.target.value })
                  }
                  dir="rtl"
                  placeholder="النص العربي..."
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.settings.marketingBanners.linkText")}</Label>
                <Input
                  value={banner.linkText?.ar || ""}
                  onChange={(e) =>
                    onUpdate("linkText", {
                      ...banner.linkText,
                      ar: e.target.value,
                    })
                  }
                  dir="rtl"
                  placeholder="نص الزر..."
                />
              </div>
            </div>

            {/* English Content */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {t("admin.settings.englishContent")}
              </Label>
              <div className="space-y-2">
                <Label>{t("admin.settings.marketingBanners.bannerText")}</Label>
                <Input
                  value={banner.text.en}
                  onChange={(e) =>
                    onUpdate("text", { ...banner.text, en: e.target.value })
                  }
                  dir="ltr"
                  placeholder="English text..."
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.settings.marketingBanners.linkText")}</Label>
                <Input
                  value={banner.linkText?.en || ""}
                  onChange={(e) =>
                    onUpdate("linkText", {
                      ...banner.linkText,
                      en: e.target.value,
                    })
                  }
                  dir="ltr"
                  placeholder="Button text..."
                />
              </div>
            </div>
          </div>

          {/* Common Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>{t("admin.settings.marketingBanners.linkUrl")}</Label>
              <Input
                value={banner.linkUrl}
                onChange={(e) => onUpdate("linkUrl", e.target.value)}
                dir="ltr"
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>{t("admin.settings.marketingBanners.icon")}</Label>
              <Select
                value={banner.icon || ""}
                onValueChange={(value) => onUpdate("icon", value)}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      "admin.settings.marketingBanners.selectIcon"
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableIcons.map((icon) => (
                    <SelectItem key={icon.value} value={icon.value || "none"}>
                      <div className="flex items-center gap-2">
                        {renderIcon(icon.value)}
                        <span>{icon.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                {t("admin.settings.marketingBanners.backgroundColor")}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={banner.backgroundColor}
                  onChange={(e) => onUpdate("backgroundColor", e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={banner.backgroundColor}
                  onChange={(e) => onUpdate("backgroundColor", e.target.value)}
                  className="font-mono uppercase"
                  maxLength={7}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("admin.settings.marketingBanners.textColor")}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={banner.textColor}
                  onChange={(e) => onUpdate("textColor", e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={banner.textColor}
                  onChange={(e) => onUpdate("textColor", e.target.value)}
                  className="font-mono uppercase"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function MarketingBannersSettings() {
  const dispatch = useAppDispatch();
  const { t, isRtl } = useAdminLocale();
  const { settings, isLoading } = useAppSelector((state) => state.settings);

  const [isEnabled, setIsEnabled] = useState(false);
  const [autoSlideInterval, setAutoSlideInterval] = useState(5000);
  const [banners, setBanners] = useState<MarketingBannerItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (settings?.marketingBanners) {
      setIsEnabled(settings.marketingBanners.enabled);
      setAutoSlideInterval(settings.marketingBanners.autoSlideInterval || 5000);
      setBanners(settings.marketingBanners.banners || []);
    }
  }, [settings]);

  // Update handlers
  const handleSaveSettings = () => {
    // Basic validation
    const validBanners = banners.filter(
      (b) => b.text.ar.trim() || b.text.en.trim()
    );

    const updatedSettings = {
      marketingBanners: {
        enabled: isEnabled,
        autoSlideInterval,
        banners: validBanners.map((b, index) => ({
          ...b,
          order: index, // Ensure order matches array index
          icon: b.icon === "none" ? "" : b.icon,
        })),
      },
    };

    dispatch(updateWebsiteSettingsThunk(updatedSettings as any));
  };

  const handleAddBanner = () => {
    const newBanner: MarketingBannerItem = {
      _id: `temp-${Date.now()}`,
      text: { ar: "", en: "" },
      linkText: { ar: "", en: "" },
      linkUrl: "",
      icon: "",
      isEnabled: true,
      order: banners.length,
      backgroundColor: "#1a472a",
      textColor: "#ffffff",
    };
    setBanners([...banners, newBanner]);
    setExpandedId(newBanner._id!);
  };

  const handleUpdateBanner = (index: number, field: string, value: any) => {
    const newBanners = [...banners];
    newBanners[index] = { ...newBanners[index], [field]: value };
    setBanners(newBanners);
  };

  const handleDeleteBanner = (index: number) => {
    if (confirm(t("admin.settings.marketingBanners.deleteBannerConfirm"))) {
      const newBanners = [...banners];
      newBanners.splice(index, 1);
      setBanners(newBanners);
    }
  };

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setBanners((items) => {
        const oldIndex = items.findIndex(
          (item) => (item._id || `banner-${items.indexOf(item)}`) === active.id
        );
        const newIndex = items.findIndex(
          (item) => (item._id || `banner-${items.indexOf(item)}`) === over.id
        );

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.settings.marketingBanners.title")}</CardTitle>
          <CardDescription>
            {t("admin.settings.marketingBanners.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>
                {t("admin.settings.marketingBanners.enableBanners")}
              </Label>
              <div className="text-sm text-muted-foreground">
                {isEnabled
                  ? t("admin.users.active")
                  : t("admin.users.inactive")}
              </div>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>
                {t("admin.settings.marketingBanners.autoSlideInterval")}:{" "}
                {autoSlideInterval / 1000}s
              </Label>
            </div>
            <Slider
              value={[autoSlideInterval]}
              min={2000}
              max={15000}
              step={1000}
              onValueChange={(val) => setAutoSlideInterval(val[0])}
              disabled={!isEnabled || isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              {t("admin.settings.marketingBanners.bannersList")}
            </CardTitle>
            <CardDescription>
              {t("admin.settings.marketingBanners.dragToReorder")}
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={handleAddBanner}
            disabled={isLoading}
            size="sm"
          >
            <Plus className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
            {t("admin.settings.marketingBanners.addBanner")}
          </Button>
        </CardHeader>
        <CardContent>
          {banners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-dashed border-2 rounded-lg">
              <Megaphone className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>{t("admin.settings.marketingBanners.noBanners")}</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={banners.map((b, i) => b._id || `banner-${i}`)}
                strategy={verticalListSortingStrategy}
              >
                {banners.map((banner, index) => (
                  <SortableBannerItem
                    key={banner._id || `banner-${index}`}
                    banner={banner}
                    index={index}
                    isRtl={isRtl}
                    t={t}
                    expanded={expandedId === (banner._id || `banner-${index}`)}
                    onToggleExpand={() =>
                      setExpandedId(
                        expandedId === (banner._id || `banner-${index}`)
                          ? null
                          : banner._id || `banner-${index}`
                      )
                    }
                    onUpdate={(field, value) =>
                      handleUpdateBanner(index, field, value)
                    }
                    onDelete={() => handleDeleteBanner(index)}
                    isLoading={isLoading}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end sticky bottom-6 bg-background p-4 border rounded-lg shadow-sm z-10">
        <Button
          onClick={handleSaveSettings}
          disabled={isLoading}
          className="min-w-[150px]"
        >
          {t("admin.settings.saveChanges")}
        </Button>
      </div>
    </div>
  );
}
