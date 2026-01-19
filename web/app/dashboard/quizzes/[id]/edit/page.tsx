"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getQuiz } from "@/store/services/quizService";
import QuizForm from "@/components/dashboard/quizzes/QuizForm";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";

export default function EditQuizPage() {
  const params = useParams();
  const dispatch = useAppDispatch();
  const { isRtl } = useAdminLocale();
  const id = params.id as string;

  const { currentQuiz, isLoading } = useAppSelector((state) => state.quizzes);

  useEffect(() => {
    if (id) {
      dispatch(getQuiz(id));
    }
  }, [dispatch, id]);

  if (isLoading && !currentQuiz) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-genoun-green border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`flex-1 p-8 pt-6 ${isRtl ? "text-right" : ""}`} dir={isRtl ? "rtl" : "ltr"}>
      <QuizForm initialData={currentQuiz} isEdit={true} />
    </div>
  );
}
