"use client";

import QuizForm from "@/components/dashboard/quizzes/QuizForm";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";

export default function CreateQuizPage() {
  const { isRtl } = useAdminLocale();

  return (
    <div className={`flex-1 p-8 pt-6 ${isRtl ? "text-right" : ""}`} dir={isRtl ? "rtl" : "ltr"}>
      <QuizForm />
    </div>
  );
}
