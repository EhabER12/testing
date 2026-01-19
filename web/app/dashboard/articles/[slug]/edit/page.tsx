"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getArticleBySlug,
  updateArticle,
  resetArticle,
} from "@/store/slices/articleSlice";
import { ArticleForm } from "@/components/dashboard/articles/ArticleForm";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";

export default function EditArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { article, isLoading } = useAppSelector((state) => state.articles);
  const { t, isRtl } = useAdminLocale();

  useEffect(() => {
    if (slug) {
      dispatch(resetArticle());
      dispatch(getArticleBySlug({ slug, incrementView: false }));
    }
    return () => {
      dispatch(resetArticle());
    };
  }, [dispatch, slug]);

  const handleSubmit = async (formData: FormData) => {
    if (!article) return;

    try {
      await dispatch(
        updateArticle({ id: article.id, data: formData })
      ).unwrap();
      toast.success(t("admin.articles.articleUpdated"));
      router.push("/dashboard/articles");
    } catch (error: any) {
      toast.error(error || t("common.error"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-gray-500">{t("admin.articles.articleNotFound")}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("admin.articles.editArticle")}
        </h1>
        <p className="text-gray-500 mt-1">
          {t("admin.articles.updateArticle")}
        </p>
      </div>

      <ArticleForm
        initialData={article}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
