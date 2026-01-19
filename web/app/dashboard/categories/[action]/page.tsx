"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft, Upload, X, Save } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getCategoryById,
  createCategory,
  updateCategory,
  resetCurrentCategory,
} from "@/store/slices/categorySlice";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import { LanguageSwitcher } from "@/components/dashboard/common/LanguageSwitcher";
import toast from "react-hot-toast";

interface BilingualText {
  ar: string;
  en: string;
}

interface CategoryFormData {
  name: BilingualText;
  description: BilingualText;
  image: string;
  isActive: boolean;
  order: number;
}

const createEmptyBilingual = (): BilingualText => ({ ar: "", en: "" });

const initialFormData: CategoryFormData = {
  name: createEmptyBilingual(),
  description: createEmptyBilingual(),
  image: "",
  isActive: true,
  order: 0,
};

export default function CategoryFormPage({
  params,
}: {
  params: Promise<{ action: string }>;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t, locale } = useAdminLocale();
  const resolvedParams = use(params);

  const { currentCategory, loading } = useAppSelector(
    (state) => state.categories
  );

  const isEdit = resolvedParams.action !== "create";
  const categoryId = isEdit ? resolvedParams.action : null;

  const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
  const [formLang, setFormLang] = useState<"ar" | "en">("ar");
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Sync formLang with admin locale
  useEffect(() => {
    if (locale === "ar" || locale === "en") {
      setFormLang(locale);
    }
  }, [locale]);

  // Load category for edit
  useEffect(() => {
    if (isEdit && categoryId) {
      dispatch(getCategoryById(categoryId));
    }
    return () => {
      dispatch(resetCurrentCategory());
    };
  }, [dispatch, isEdit, categoryId]);

  // Populate form when category loads
  useEffect(() => {
    if (currentCategory && isEdit) {
      setFormData({
        name:
          typeof currentCategory.name === "string"
            ? { ar: "", en: currentCategory.name }
            : currentCategory.name || createEmptyBilingual(),
        description:
          typeof currentCategory.description === "string"
            ? { ar: "", en: currentCategory.description }
            : currentCategory.description || createEmptyBilingual(),
        image: currentCategory.image || "",
        isActive: currentCategory.isActive ?? true,
        order: currentCategory.order || 0,
      });
      if (currentCategory.image) {
        setImagePreview(currentCategory.image);
      }
    }
  }, [currentCategory, isEdit]);

  // Handle text input
  const handleTextChange = (field: "name" | "description", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: { ...prev[field], [formLang]: value },
    }));
  };

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setFormData((prev) => ({ ...prev, image: "" }));
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.name.ar && !formData.name.en) {
      toast.error(t("admin.forms.fillAtLeastOneLanguage"));
      return false;
    }
    return true;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);

    try {
      const data = new FormData();
      data.append("name", JSON.stringify(formData.name));
      data.append("description", JSON.stringify(formData.description));
      data.append("isActive", String(formData.isActive));
      data.append("order", String(formData.order));

      if (imageFile) {
        data.append("image", imageFile);
      }

      if (isEdit && categoryId) {
        await dispatch(updateCategory({ id: categoryId, data })).unwrap();
        toast.success(t("admin.categories.categoryUpdated"));
      } else {
        await dispatch(createCategory(data)).unwrap();
        toast.success(t("admin.categories.categoryCreated"));
      }
      router.push("/dashboard/categories");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isRtl = formLang === "ar";

  return (
    <div className="p-6 max-w-4xl mx-auto" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/categories">
            <Button variant="ghost" size="icon">
              <ArrowLeft className={`w-5 h-5 ${isRtl ? "rotate-180" : ""}`} />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit
              ? t("admin.categories.editCategory")
              : t("admin.categories.createCategory")}
          </h1>
        </div>

        {/* Language Switcher - Same component used in services */}
        <LanguageSwitcher />
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.categories.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Category Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t("admin.categories.categoryName")}</Label>
            <Input
              id="name"
              value={formData.name[formLang]}
              onChange={(e) => handleTextChange("name", e.target.value)}
              placeholder={t("admin.categories.categoryNamePlaceholder")}
              dir={formLang === "ar" ? "rtl" : "ltr"}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {t("admin.categories.description")}
            </Label>
            <Textarea
              id="description"
              value={formData.description[formLang]}
              onChange={(e) => handleTextChange("description", e.target.value)}
              placeholder={t("admin.categories.descriptionPlaceholder")}
              dir={formLang === "ar" ? "rtl" : "ltr"}
              rows={4}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>{t("admin.categories.image")}</Label>
            {imagePreview ? (
              <div className="relative w-40 h-40">
                <img
                  src={imagePreview}
                  alt="Category"
                  className="w-full h-full object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={handleRemoveImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  {t("admin.payments.uploadImage")}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isActive: checked }))
              }
            />
            <Label htmlFor="isActive">{t("admin.categories.isActive")}</Label>
          </div>

          {/* Order */}
          <div className="space-y-2">
            <Label htmlFor="order">{t("admin.categories.order")}</Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  order: parseInt(e.target.value) || 0,
                }))
              }
              className="w-32"
            />
          </div>
        </CardContent>

        {/* Submit */}
        <div className="sticky bottom-0 z-10 flex justify-end gap-4 bg-background p-4 border-t mt-6 shadow-sm">
          <Link href="/dashboard/categories">
            <Button type="button" variant="outline">
              {t("common.cancel")}
            </Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="gap-2 min-w-[150px]"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {t("common.save")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
