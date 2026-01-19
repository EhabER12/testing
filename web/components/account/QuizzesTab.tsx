"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, PlayCircle, Trophy, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface QuizzesTabProps {
  initialData?: any[];
  isArabic: boolean;
  locale: string;
}

export function QuizzesTab({
  initialData = [],
  isArabic,
  locale,
}: QuizzesTabProps) {
  const router = useRouter();

  const getTextValue = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return (isArabic ? value.ar : value.en) || value.en || value.ar || "";
  };

  if (!initialData || initialData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          {isArabic
            ? "لا توجد اختبارات متاحة حالياً"
            : "No quizzes available at the moment"}
        </p>
        <Button
          onClick={() => router.push(`/${locale}/courses`)}
          className="bg-genoun-green hover:bg-genoun-green/90"
        >
          {isArabic ? "تصفح الدورات" : "Browse Courses"}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {initialData.map((quiz, index) => {
        const hasAttempted = quiz.userAttemptsCount > 0;
        const bestAttempt = quiz.userBestAttempt;
        const isPassed = bestAttempt?.passed;
        const attemptsLeft = quiz.attemptsAllowed 
          ? Math.max(0, quiz.attemptsAllowed - quiz.userAttemptsCount) 
          : null;
        const isMaxAttemptsReached = quiz.attemptsAllowed && quiz.userAttemptsCount >= quiz.attemptsAllowed;

        return (
          <Card
            key={quiz._id || `quiz-${index}`}
            className={`overflow-hidden hover:shadow-md transition-shadow border-t-4 ${
              !hasAttempted 
                ? 'border-t-gray-200' 
                : isPassed 
                  ? 'border-t-green-500' 
                  : 'border-t-orange-500'
            }`}
          >
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg leading-tight line-clamp-1">
                      {getTextValue(quiz.title)}
                    </h3>
                    {hasAttempted && (
                      isPassed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-orange-500 shrink-0" />
                      )
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <PlayCircle className="h-3 w-3" />
                    {getTextValue(quiz.courseId?.title)}
                  </p>
                </div>
                <ClipboardList className="h-6 w-6 text-genoun-green opacity-20 shrink-0" />
              </div>

              {hasAttempted && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">{isArabic ? "أفضل درجة:" : "Best Score:"}</span>
                    <span className={`font-bold ${isPassed ? 'text-green-600' : 'text-orange-600'}`}>
                      {bestAttempt.score}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">{isArabic ? "المحاولات:" : "Attempts:"}</span>
                    <span className="font-medium">
                      {quiz.userAttemptsCount}
                      {quiz.attemptsAllowed ? ` / ${quiz.attemptsAllowed}` : ""}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[10px] md:text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground bg-gray-50/50 p-2 rounded">
                  <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                  <span>
                    {isArabic ? "النجاح: " : "Passing: "}
                    {quiz.passingScore}%
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground bg-gray-50/50 p-2 rounded">
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                  <span>
                    {quiz.timeLimit 
                      ? `${quiz.timeLimit} ${isArabic ? "د" : "min"}`
                      : (isArabic ? "مفتوح" : "Unlimited")}
                  </span>
                </div>
              </div>

              {isMaxAttemptsReached && !isPassed ? (
                <div className="flex items-center gap-2 text-[10px] text-red-600 bg-red-50 p-2 rounded border border-red-100">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {isArabic 
                      ? "لقد تخطيت الحد المسموح للمحاولات" 
                      : "Maximum attempts reached"}
                  </span>
                </div>
              ) : (
                <Button
                  className={`w-full ${isPassed ? 'bg-green-600 hover:bg-green-700' : 'bg-genoun-green hover:bg-genoun-green/90'}`}
                  size="sm"
                  onClick={() => router.push(`/${locale}/courses/${quiz.courseId?.slug}/quiz/${quiz._id || quiz.id}`)}
                >
                  {hasAttempted 
                    ? (isPassed 
                        ? (isArabic ? "عرض النتائج" : "View Results")
                        : (isArabic ? "إعادة المحاولة" : "Try Again"))
                    : (isArabic ? "بدء الاختبار" : "Start Quiz")}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
