"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NavbarLink } from "@/store/services/settingsService";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";

interface NavbarSettingsProps {
  navbarLinks: NavbarLink[];
  setNavbarLinks: (links: NavbarLink[]) => void;
  formLang: "en" | "ar";
}

export const NavbarSettings: React.FC<NavbarSettingsProps> = ({
  navbarLinks,
  setNavbarLinks,
  formLang,
}) => {
  const { t } = useAdminLocale();

  const addLink = () => {
    const newLink: NavbarLink = {
      title: { ar: "", en: "" },
      url: "",
      order: navbarLinks.length,
      isEnabled: true,
      isExternal: false,
    };
    setNavbarLinks([...navbarLinks, newLink]);
  };

  const removeLink = (index: number) => {
    const newLinks = [...navbarLinks];
    newLinks.splice(index, 1);
    setNavbarLinks(newLinks);
  };

  const updateLink = (index: number, field: string, value: any) => {
    const newLinks = [...navbarLinks];
    const link = { ...newLinks[index] };

    if (field === "title_ar") {
      link.title = { ...link.title, ar: value };
    } else if (field === "title_en") {
      link.title = { ...link.title, en: value };
    } else {
      (link as any)[field] = value;
    }

    newLinks[index] = link;
    setNavbarLinks(newLinks);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{formLang === "ar" ? "روابط القائمة العلوية" : "Navbar Links"}</CardTitle>
            <CardDescription>
              {formLang === "ar"
                ? "قم بإدارة الروابط التي تظهر في القائمة العلوية للموقع"
                : "Manage the links that appear in the website's top navigation bar"}
            </CardDescription>
          </div>
          <Button type="button" onClick={addLink} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {formLang === "ar" ? "إضافة رابط" : "Add Link"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {navbarLinks.map((link, index) => (
          <div
            key={index}
            className="flex flex-col space-y-4 rounded-lg border p-4 sm:flex-row sm:items-end sm:space-x-4 sm:space-y-0"
          >
            <div className="flex-1 space-y-2">
              <Label>
                {formLang === "ar" ? "العنوان (عربي)" : "Title (Arabic)"}
              </Label>
              <Input
                value={link.title.ar}
                onChange={(e) => updateLink(index, "title_ar", e.target.value)}
                placeholder="مثلاً: الرئيسية"
                dir="rtl"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>
                {formLang === "ar" ? "العنوان (إنجليزي)" : "Title (English)"}
              </Label>
              <Input
                value={link.title.en}
                onChange={(e) => updateLink(index, "title_en", e.target.value)}
                placeholder="e.g. Home"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>{formLang === "ar" ? "الرابط" : "URL"}</Label>
              <Input
                value={link.url}
                onChange={(e) => updateLink(index, "url", e.target.value)}
                placeholder="/"
              />
            </div>
            <div className="flex items-center space-x-4 space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id={`enabled-${index}`}
                  checked={link.isEnabled}
                  onCheckedChange={(checked) => updateLink(index, "isEnabled", checked)}
                />
                <Label htmlFor={`enabled-${index}`}>
                  {formLang === "ar" ? "مفعل" : "Enabled"}
                </Label>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => removeLink(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {navbarLinks.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            {formLang === "ar" ? "لا توجد روابط مضافة بعد" : "No links added yet"}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
