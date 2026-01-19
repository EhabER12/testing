"use client";

import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createArticle } from "@/store/slices/articleSlice";
import { ArticleForm } from "@/components/dashboard/articles/ArticleForm";
import toast from "react-hot-toast";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";

export default function CreateArticlePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.articles);
  const { t, isRtl } = useAdminLocale();

  const handleSubmit = async (formData: FormData) => {
    try {
      await dispatch(createArticle(formData)).unwrap();
      toast.success(t("admin.articles.articleCreated"));
      router.push("/dashboard/articles");
    } catch (error: any) {
      toast.error(error || t("common.error"));
    }
  };

  return (
    <div className="p-6 space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("admin.articles.createNew")}
        </h1>
        <p className="text-gray-500 mt-1">{t("admin.articles.writeArticle")}</p>
      </div>

      <ArticleForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
