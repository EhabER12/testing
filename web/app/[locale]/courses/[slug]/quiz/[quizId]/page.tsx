"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getCourseBySlug } from "@/store/services/courseService";
import { getQuizzesByCourse } from "@/store/services/quizService";
import { getUserProgress } from "@/store/services/progressService";
import QuizPlayer from "@/components/courses/QuizPlayer";
import CourseSidebar from "@/components/courses/CourseSidebar";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, ArrowRight, ArrowLeft, BookOpen } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const locale = params.locale as string;
  const slug = params.slug as string;
  const quizId = params.quizId as string;
  const isRtl = locale === "ar";

  const { currentCourse, isLoading: courseLoading } = useAppSelector((state) => state.courses);
  const { user } = useAppSelector((state) => state.auth);
  const [accessChecked, setAccessChecked] = useState(false);

  // Fetch data
  useEffect(() => {
    if (slug) dispatch(getCourseBySlug(slug));
  }, [dispatch, slug]);

  useEffect(() => {
    const courseId = currentCourse?.id || currentCourse?._id;
    if (courseId) {
      dispatch(getQuizzesByCourse(courseId));
      if (user) dispatch(getUserProgress(courseId));
    }
  }, [dispatch, currentCourse?.id, currentCourse?._id, user]);

  // Access guard: redirect non-enrolled users on paid/package courses
  useEffect(() => {
    if (!currentCourse || courseLoading) return;

    const accessType = (currentCourse as any)?.accessType;
    const isEnrolled = !!(currentCourse as any)?.userProgress;

    if (accessType === "free") {
      setAccessChecked(true);
      return;
    }

    if (!user) {
      router.replace(`/${locale}/login`);
      return;
    }

    if ((accessType === "paid" || accessType === "byPackage") && !isEnrolled) {
      toast({
        title: isRtl ? "غير مسجل" : "Not Enrolled",
        description: isRtl
          ? "يجب التسجيل في الدورة أولاً للوصول إلى الاختبارات"
          : "You must enroll in this course first to access quizzes",
        variant: "destructive",
      });
      router.replace(`/${locale}/courses/${slug}`);
      return;
    }

    setAccessChecked(true);
  }, [currentCourse, courseLoading, user, locale, slug, router, toast, isRtl]);

  if (courseLoading || !accessChecked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-genoun-green border-t-transparent"></div>
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
            onClick={() => router.push(`/${locale}/courses/${slug}`)}
            className="text-gray-600"
          >
            {isRtl ? <><ArrowRight className="h-4 w-4 ml-2" /> العودة للدورة</> : <><ArrowLeft className="h-4 w-4 mr-2" /> Back to Course</>}
          </Button>
          <div className="flex items-center gap-2 font-bold text-lg">
            <BookOpen className="h-5 w-5 text-orange-500" />
            <span>{isRtl ? "اختبار" : "Quiz"}</span>
          </div>
          <div className="w-24"></div> {/* Spacer */}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2">
            <QuizPlayer quizId={quizId} locale={locale} />
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            <CourseSidebar 
              locale={locale} 
              slug={slug} 
              currentQuizId={quizId} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
