"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getQuizBySlug } from "@/store/services/quizService";
import QuizPlayer from "@/components/courses/QuizPlayer";
import { BookOpen, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicQuizPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const locale = params.locale as string;
  const slug = params.slug as string;
  const isRtl = locale === "ar";

  const { currentQuiz, isLoading } = useAppSelector((state) => state.quizzes);

  const getTextValue = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return (isRtl ? value.ar : value.en) || value.en || value.ar || "";
  };

  useEffect(() => {
    if (slug) {
      dispatch(getQuizBySlug(slug));
    }
  }, [dispatch, slug]);

  if (isLoading && !currentQuiz) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-genoun-green border-t-transparent"></div>
      </div>
    );
  }

  if (!currentQuiz) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <h1 className="text-2xl font-bold">{isRtl ? "الاختبار غير موجود" : "Quiz Not Found"}</h1>
        <Button onClick={() => router.push(`/${locale}`)}>
          {isRtl ? "العودة للرئيسية" : "Back to Home"}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/${locale}`)}
            className="text-gray-600"
          >
            {isRtl ? <><ArrowRight className="h-4 w-4 ml-2" /> الرئيسية</> : <><ArrowLeft className="h-4 w-4 mr-2" /> Home</>}
          </Button>
          <div className="flex items-center gap-2 font-bold text-lg">
            <BookOpen className="h-5 w-5 text-orange-500" />
            <span>{getTextValue(currentQuiz.title) || (isRtl ? "اختبار عام" : "General Quiz")}</span>
          </div>
          <div className="w-24"></div> {/* Spacer */}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <QuizPlayer 
            quizId={(currentQuiz.id || currentQuiz._id) as string} 
            locale={locale} 
          />
        </div>
      </div>
    </div>
  );
}
