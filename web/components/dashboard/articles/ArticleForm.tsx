"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { TagsInput } from "@/components/ui/tags-input";
import { Article } from "@/store/slices/articleSlice";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";

const articleSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  slug: z.string().optional(),
  language: z.enum(["ar", "en"]),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().max(500, "Excerpt is too long").optional(),
  status: z.enum(["draft", "published", "archived"]),
  tags: z.array(z.string()).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).optional(),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

interface ArticleFormProps {
  initialData?: Article | null;
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
}

export function ArticleForm({
  initialData,
  onSubmit,
  isLoading,
}: ArticleFormProps) {
  const { t, isRtl } = useAdminLocale();
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    initialData?.coverImage || null
  );
  const [heroImage, setHeroImage] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(
    initialData?.heroImage || null
  );

  const isEditMode = !!initialData;

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: initialData?.title || "",
      slug: initialData?.slug || "",
      language: (initialData?.language as "ar" | "en") || "ar",
      content: initialData?.content || "",
      excerpt: initialData?.excerpt || "",
      status: initialData?.status || "draft",
      tags: initialData?.tags || [],
      seoTitle: initialData?.seo?.title || "",
      seoDescription: initialData?.seo?.description || "",
      seoKeywords: initialData?.seo?.keywords || [],
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title,
        slug: initialData.slug,
        language: (initialData.language as "ar" | "en") || "ar",
        content: initialData.content,
        excerpt: initialData.excerpt,
        status: initialData.status,
        tags: initialData.tags || [],
        seoTitle: initialData.seo?.title,
        seoDescription: initialData.seo?.description,
        seoKeywords: initialData.seo?.keywords || [],
      });
      setCoverImagePreview(initialData.coverImage || null);
      setHeroImagePreview(initialData.heroImage || null);
    }
  }, [initialData, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeroImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeroImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Auto-generate slug from title for new articles
  const title = form.watch("title");
  useEffect(() => {
    if (!initialData && title) {
      const slug = form.getValues("slug");
      const isSlugDirty = form.getFieldState("slug").isDirty;

      if (!isSlugDirty && !slug) {
        const generatedSlug = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
        form.setValue("slug", generatedSlug);
      }
    }
  }, [title, initialData, form]);

  const handleSubmit = (values: ArticleFormValues) => {
    const formData = new FormData();
    formData.append("title", values.title);
    if (values.slug) formData.append("slug", values.slug);
    formData.append("language", values.language);
    formData.append("content", values.content);
    if (values.excerpt) formData.append("excerpt", values.excerpt);
    formData.append("status", values.status);

    // Handle tags
    if (values.tags) {
      values.tags.forEach((tag) => formData.append("tags[]", tag));
    }

    // Handle SEO
    if (values.seoTitle) formData.append("seo[title]", values.seoTitle);
    if (values.seoDescription)
      formData.append("seo[description]", values.seoDescription);
    if (values.seoKeywords) {
      values.seoKeywords.forEach((k) => formData.append("seo[keywords][]", k));
    }

    if (coverImage) {
      formData.append("coverImage", coverImage);
    }

    if (heroImage) {
      formData.append("heroImage", heroImage);
    }

    onSubmit(formData);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-8"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("admin.articles.articleTitle")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={isRtl ? "عنوان المقال" : "Article title"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("admin.articles.slug")} (URL)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="article-url-slug"
                      {...field}
                      dir="ltr"
                    />
                  </FormControl>
                  <FormDescription>
                    {isRtl
                      ? "النسخة الصديقة للرابط من العنوان. اتركه فارغًا للإنشاء التلقائي."
                      : "The URL-friendly version of the title. Leave empty to auto-generate."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("admin.articles.content")}</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      key={initialData?.id || "new"}
                      content={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="excerpt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("admin.articles.excerpt")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        isRtl
                          ? "ملخص موجز للمقال"
                          : "Brief summary of the article"
                      }
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {isRtl
                      ? "ملخص قصير يُستخدم في قوائم المقالات و SEO."
                      : "A short summary used in article lists and SEO."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg border shadow-sm space-y-6">
              <h3 className="font-semibold text-lg">
                {isRtl ? "النشر" : "Publishing"}
              </h3>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.articles.status")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      dir={isRtl ? "rtl" : "ltr"}
                    >
                      <FormControl>
                        <SelectTrigger dir={isRtl ? "rtl" : "ltr"}>
                          <SelectValue
                            placeholder={
                              isRtl ? "اختر الحالة" : "Select status"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent dir={isRtl ? "rtl" : "ltr"}>
                        <SelectItem value="draft">
                          {t("admin.articles.draft")}
                        </SelectItem>
                        <SelectItem value="published">
                          {t("admin.articles.published")}
                        </SelectItem>
                        <SelectItem value="archived">
                          {t("admin.articles.archived")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.articles.language")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isEditMode}
                      dir={isRtl ? "rtl" : "ltr"}
                    >
                      <FormControl>
                        <SelectTrigger
                          dir={isRtl ? "rtl" : "ltr"}
                          className={isEditMode ? "opacity-60" : ""}
                        >
                          <SelectValue
                            placeholder={
                              isRtl ? "اختر اللغة" : "Select language"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent dir={isRtl ? "rtl" : "ltr"}>
                        <SelectItem value="ar">العربية (Arabic)</SelectItem>
                        <SelectItem value="en">English (الإنجليزية)</SelectItem>
                      </SelectContent>
                    </Select>
                    {isEditMode && (
                      <FormDescription>
                        {isRtl
                          ? "لا يمكن تغيير اللغة بعد إنشاء المقال"
                          : "Language cannot be changed after article creation"}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>{t("admin.articles.coverImage")}</FormLabel>
                <div className="flex flex-col gap-4">
                  {coverImagePreview && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-md border border-secondary-blue/20">
                      <Image
                        src={coverImagePreview}
                        alt="Cover preview"
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className={`absolute top-2 ${
                          isRtl ? "left-2" : "right-2"
                        } h-6 w-6`}
                        onClick={() => {
                          setCoverImage(null);
                          setCoverImagePreview(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="cover-image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        document.getElementById("cover-image-upload")?.click()
                      }
                    >
                      <Upload
                        className={`${isRtl ? "ml-2" : "mr-2"} h-4 w-4`}
                      />
                      {isRtl ? "رفع صورة" : "Upload Image"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Hero Image - Optional */}
              <div className="space-y-2">
                <FormLabel>
                  {isRtl ? "صورة الهيرو (اختياري)" : "Hero Image (Optional)"}
                </FormLabel>
                <FormDescription className="text-xs">
                  {isRtl
                    ? "صورة منفصلة لصفحة تفاصيل المقال. إذا لم تُحدد، سيتم استخدام صورة الغلاف."
                    : "Separate image for article detail page. If not set, cover image will be used."}
                </FormDescription>
                <div className="flex flex-col gap-4">
                  {heroImagePreview && (
                    <div className="relative aspect-[21/9] w-full overflow-hidden rounded-md border border-secondary-blue/20">
                      <Image
                        src={heroImagePreview}
                        alt="Hero preview"
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className={`absolute top-2 ${
                          isRtl ? "left-2" : "right-2"
                        } h-6 w-6`}
                        onClick={() => {
                          setHeroImage(null);
                          setHeroImagePreview(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleHeroImageChange}
                      className="hidden"
                      id="hero-image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        document.getElementById("hero-image-upload")?.click()
                      }
                    >
                      <Upload
                        className={`${isRtl ? "ml-2" : "mr-2"} h-4 w-4`}
                      />
                      {isRtl ? "رفع صورة الهيرو" : "Upload Hero Image"}
                    </Button>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.articles.tags")}</FormLabel>
                    <FormControl>
                      <TagsInput
                        value={field.value || []}
                        onChange={field.onChange}
                        placeholder={
                          isRtl
                            ? "اكتب واضغط Enter لإضافة وسوم"
                            : "Type and press Enter to add tags"
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      {isRtl
                        ? "أضف وسوم لتصنيف مقالك."
                        : "Add tags to categorize your article."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-card p-6 rounded-lg border shadow-sm space-y-6">
              <h3 className="font-semibold text-lg">
                {isRtl ? "إعدادات SEO" : "SEO Settings"}
              </h3>

              <FormField
                control={form.control}
                name="seoTitle"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>{t("admin.articles.seoTitle")}</FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-secondary-blue hover:text-secondary-blue/80 p-0"
                        onClick={() => {
                          const title = form.getValues("title");
                          if (title) {
                            form.setValue("seoTitle", title, {
                              shouldDirty: true,
                            });
                          }
                        }}
                      >
                        {isRtl ? "استخدم عنوان المقال" : "Use Article Title"}
                      </Button>
                    </div>
                    <FormControl>
                      <Input
                        placeholder={isRtl ? "عنوان الميتا" : "Meta title"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seoDescription"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>
                        {t("admin.articles.seoDescription")}
                      </FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-secondary-blue hover:text-secondary-blue/80 p-0"
                        onClick={() => {
                          const content = form.getValues("content");
                          if (content) {
                            // Strip HTML tags
                            const plainText = content.replace(/<[^>]+>/g, "");
                            // Truncate to ~160 chars (standard SEO length)
                            const description =
                              plainText.length > 160
                                ? plainText.substring(0, 157) + "..."
                                : plainText;
                            form.setValue("seoDescription", description, {
                              shouldDirty: true,
                            });
                          }
                        }}
                      >
                        {isRtl ? "إنشاء من المحتوى" : "Generate from Content"}
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder={isRtl ? "وصف الميتا" : "Meta description"}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seoKeywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.articles.seoKeywords")}</FormLabel>
                    <FormControl>
                      <TagsInput
                        value={field.value || []}
                        onChange={field.onChange}
                        placeholder={
                          isRtl
                            ? "اكتب واضغط Enter لإضافة كلمات مفتاحية"
                            : "Type and press Enter to add keywords"
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 flex justify-end gap-4 bg-background p-4 border-t mt-4 -mx-6 px-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-secondary-blue hover:bg-secondary-blue/90 text-white"
          >
            {isLoading && (
              <Loader2
                className={`${isRtl ? "ml-2" : "mr-2"} h-4 w-4 animate-spin`}
              />
            )}
            {initialData
              ? t("admin.articles.editArticle")
              : t("admin.articles.createNew")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
