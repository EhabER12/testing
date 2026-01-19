"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getStaticPageBySlug,
  updateStaticPage,
  resetCurrentStaticPage,
  StaticPage,
} from "@/store/slices/staticPageSlice";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import { LanguageSwitcher } from "@/components/dashboard/common/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

// Page title mappings for display
const pageTitles: Record<string, { ar: string; en: string }> = {
  "privacy-policy": { ar: "سياسة الخصوصية", en: "Privacy Policy" },
  "terms-and-conditions": { ar: "الشروط والأحكام", en: "Terms and Conditions" },
  "about-us": { ar: "من نحن", en: "About Us" },
  faqs: { ar: "الأسئلة الشائعة", en: "FAQs" },
  "pricing-policy": { ar: "سياسة التسعير", en: "Pricing Policy" },
  "refund-policy": { ar: "سياسة الاسترداد", en: "Refund Policy" },
};

interface PageParams {
  slug: string;
}

export default function EditStaticPagePage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentPage, loading } = useAppSelector((state) => state.staticPages);
  const { t, isRtl, locale } = useAdminLocale();

  // Form language state (for content editing)
  const [formLang, setFormLang] = useState<"ar" | "en">("ar");

  // Form data
  const [formData, setFormData] = useState({
    title: { ar: "", en: "" },
    content: { ar: "", en: "" },
    isPublished: false,
    showInFooter: true,
    showInHeader: false,
    seoMeta: {
      title: { ar: "", en: "" },
      description: { ar: "", en: "" },
    },
  });

  const [isSaving, setIsSaving] = useState(false);

  // Load page data
  useEffect(() => {
    if (slug) {
      dispatch(getStaticPageBySlug(slug));
    }
    return () => {
      dispatch(resetCurrentStaticPage());
    };
  }, [dispatch, slug]);

  // Populate form when page loads
  useEffect(() => {
    if (currentPage) {
      setFormData({
        title: currentPage.title || { ar: "", en: "" },
        content: currentPage.content || { ar: "", en: "" },
        isPublished: currentPage.isPublished || false,
        showInFooter: currentPage.showInFooter ?? true,
        showInHeader: currentPage.showInHeader || false,
        seoMeta: currentPage.seoMeta || {
          title: { ar: "", en: "" },
          description: { ar: "", en: "" },
        },
      });
    }
  }, [currentPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await dispatch(
        updateStaticPage({
          slug,
          data: formData,
        })
      ).unwrap();

      toast.success(isRtl ? "تم حفظ الصفحة بنجاح" : "Page saved successfully");
      router.push("/dashboard/static-pages");
    } catch (error: any) {
      toast.error(error || (isRtl ? "فشل حفظ الصفحة" : "Failed to save page"));
    } finally {
      setIsSaving(false);
    }
  };

  const pageTitle = pageTitles[slug]?.[locale as "ar" | "en"] || slug;

  if (loading && !currentPage) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/static-pages">
            <Button variant="ghost" size="icon">
              <ArrowLeft className={`w-5 h-5 ${isRtl ? "rotate-180" : ""}`} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isRtl ? "تعديل الصفحة" : "Edit Page"}: {pageTitle}
            </h1>
            <p className="text-gray-500">
              {isRtl ? "تعديل محتوى الصفحة" : "Edit page content"}
            </p>
          </div>
        </div>
        <LanguageSwitcher language={formLang} setLanguage={setFormLang} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Content Section */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isRtl ? "المحتوى" : "Content"} (
              {formLang === "ar" ? "العربية" : "English"})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div>
              <Label>
                {isRtl ? "العنوان" : "Title"}
                <span className="text-red-500 mx-1">*</span>
              </Label>
              <Input
                value={formData.title[formLang]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    title: { ...formData.title, [formLang]: e.target.value },
                  })
                }
                placeholder={formLang === "ar" ? "عنوان الصفحة" : "Page title"}
                dir={formLang === "ar" ? "rtl" : "ltr"}
                className="mt-1"
              />
            </div>

            {/* Content */}
            <div>
              <Label>
                {isRtl ? "المحتوى" : "Content"}
                <span className="text-red-500 mx-1">*</span>
              </Label>
              <Textarea
                value={formData.content[formLang]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    content: {
                      ...formData.content,
                      [formLang]: e.target.value,
                    },
                  })
                }
                placeholder={
                  formLang === "ar"
                    ? "محتوى الصفحة... (يدعم HTML للتنسيق)"
                    : "Page content... (supports HTML for formatting)"
                }
                dir={formLang === "ar" ? "rtl" : "ltr"}
                rows={15}
                className="mt-1 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                {isRtl
                  ? "يمكنك استخدام HTML للتنسيق المتقدم"
                  : "You can use HTML for advanced formatting"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle>{isRtl ? "الإعدادات" : "Settings"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Publishing Status */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">
                  {isRtl ? "نشر الصفحة" : "Publish Page"}
                </Label>
                <p className="text-sm text-gray-500">
                  {isRtl
                    ? "اجعل هذه الصفحة متاحة للزوار"
                    : "Make this page visible to visitors"}
                </p>
              </div>
              <Switch
                checked={formData.isPublished}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPublished: checked })
                }
              />
            </div>

            {/* Show in Footer */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">
                  {isRtl ? "عرض في التذييل" : "Show in Footer"}
                </Label>
                <p className="text-sm text-gray-500">
                  {isRtl
                    ? "إظهار رابط الصفحة في أسفل الموقع"
                    : "Display page link in website footer"}
                </p>
              </div>
              <Switch
                checked={formData.showInFooter}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, showInFooter: checked })
                }
              />
            </div>

            {/* Show in Header */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">
                  {isRtl ? "عرض في الرأس" : "Show in Header"}
                </Label>
                <p className="text-sm text-gray-500">
                  {isRtl
                    ? "إظهار رابط الصفحة في القائمة الرئيسية"
                    : "Display page link in main navigation"}
                </p>
              </div>
              <Switch
                checked={formData.showInHeader}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, showInHeader: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* SEO Section */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isRtl ? "تحسين محركات البحث" : "SEO"} (
              {formLang === "ar" ? "العربية" : "English"})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{isRtl ? "عنوان SEO" : "SEO Title"}</Label>
              <Input
                value={formData.seoMeta.title[formLang]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    seoMeta: {
                      ...formData.seoMeta,
                      title: {
                        ...formData.seoMeta.title,
                        [formLang]: e.target.value,
                      },
                    },
                  })
                }
                placeholder={
                  formLang === "ar"
                    ? "عنوان للظهور في محركات البحث"
                    : "Title for search engines"
                }
                dir={formLang === "ar" ? "rtl" : "ltr"}
                className="mt-1"
              />
            </div>

            <div>
              <Label>{isRtl ? "وصف SEO" : "SEO Description"}</Label>
              <Textarea
                value={formData.seoMeta.description[formLang]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    seoMeta: {
                      ...formData.seoMeta,
                      description: {
                        ...formData.seoMeta.description,
                        [formLang]: e.target.value,
                      },
                    },
                  })
                }
                placeholder={
                  formLang === "ar"
                    ? "وصف مختصر للظهور في نتائج البحث"
                    : "Brief description for search results"
                }
                dir={formLang === "ar" ? "rtl" : "ltr"}
                rows={3}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/dashboard/static-pages">
            <Button variant="outline" type="button">
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
          </Link>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2
                  className={`h-4 w-4 animate-spin ${isRtl ? "ml-2" : "mr-2"}`}
                />
                {isRtl ? "جاري الحفظ..." : "Saving..."}
              </>
            ) : (
              <>
                <Save className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                {isRtl ? "حفظ التغييرات" : "Save Changes"}
              </>
            )}
          </Button>
        </div>

        {/* Cache hint */}
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          {isRtl
            ? "💡 بعد الحفظ، اذهب إلى الإعدادات واضغط على 'مسح الكاش' لتحديث الصفحة فوراً على الموقع"
            : "💡 After saving, go to Settings and click 'Clear Cache' to update the page immediately on the website"}
        </p>
      </form>
    </div>
  );
}
