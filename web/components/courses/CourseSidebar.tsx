"use client";

import { useAppSelector } from "@/store/hooks";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle,
  PlayCircle,
  BookOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface CourseSidebarProps {
  locale: string;
  slug: string;
  currentLessonId?: string;
  currentQuizId?: string;
}

export default function CourseSidebar({ locale, slug, currentLessonId, currentQuizId }: CourseSidebarProps) {
  const router = useRouter();
  const isRtl = locale === "ar";

  const { currentCourse } = useAppSelector((state) => state.courses);
  const { quizzes } = useAppSelector((state) => state.quizzes);
  const { currentProgress } = useAppSelector((state) => state.progress);

  const courseSections = currentCourse?.sections || [];

  const getTextValue = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return (isRtl ? value.ar : value.en) || value.en || value.ar || "";
  };

  const isLessonCompleted = (lessonIdToCheck: string) => {
    if (!currentProgress?.completedLessons) return false;
    return currentProgress.completedLessons.some(
      (id: any) => id === lessonIdToCheck || id?.toString() === lessonIdToCheck
    );
  };

  const isQuizCompleted = (quizIdToCheck: string) => {
    if (!currentProgress?.completedQuizzes) return false;
    return currentProgress.completedQuizzes.some(
      (id: any) => id === quizIdToCheck || id?.toString() === quizIdToCheck
    );
  };

  const handleLessonClick = (lessonId: string) => {
    router.push(`/${locale}/courses/${slug}/lesson/${lessonId}`);
  };

  const handleQuizClick = (quizId: string) => {
    router.push(`/${locale}/courses/${slug}/quiz/${quizId}`);
  };

  return (
    <Card className="sticky top-24">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          {isRtl ? "محتوى الدورة" : "Course Content"}
        </CardTitle>
        {currentProgress && (
          <CardDescription>
            {(currentProgress.completedLessonsCount || 0) + (currentProgress.completedQuizzesCount || 0)}/
            {currentProgress.totalItemsCount || currentProgress.totalLessonsCount || 0}{" "}
            {isRtl ? "عنصر" : "items"}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-y-auto">
          {courseSections.map((section: any) => {
            const sectionId = section.id || section._id;
            return (
              <div key={sectionId} className="border-b last:border-0">
                <div className="p-3 bg-gray-50 font-semibold text-sm flex items-center justify-between">
                  <span>{getTextValue(section.title)}</span>
                  <span className="text-xs text-gray-500">
                    {
                      (section.lessons?.filter((l: any) =>
                        isLessonCompleted(l.id || l._id)
                      ).length || 0) + 
                      (section.quizzes?.filter((q: any) => 
                        isQuizCompleted(q.id || q._id)
                      ).length || 0)
                    }
                    /{(section.lessons?.length || 0) + (section.quizzes?.length || 0)}
                  </span>
                </div>
                <div className="divide-y">
                  {section.lessons?.map((lesson: any, index: number) => {
                    const id = lesson.id || lesson._id;
                    const isActive = id === currentLessonId;
                    const completed = isLessonCompleted(id);

                    return (
                      <button
                        key={id || index}
                        onClick={() => handleLessonClick(id)}
                        className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left transition-colors ${
                          isActive ? "bg-genoun-green/10 border-l-4 border-genoun-green" : ""
                        }`}
                      >
                        {completed ? (
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : isActive ? (
                          <PlayCircle className="h-4 w-4 text-genoun-green flex-shrink-0" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                        )}
                        <span className={`flex-1 text-sm ${completed ? "text-gray-500" : ""}`}>
                          {getTextValue(lesson.title)}
                        </span>
                        {lesson.duration && (
                          <span className="text-xs text-gray-400">{lesson.duration}{isRtl ? "د" : "m"}</span>
                        )}
                      </button>
                    );
                  })}

                  {section.quizzes?.map((quiz: any, quizIndex: number) => {
                      const id = (quiz.id || quiz._id)!;
                      const isActive = id === currentQuizId;
                      const completed = isQuizCompleted(id);
                      if (!quiz.isPublished && !isActive) return null;

                      return (
                        <button
                          key={id || quizIndex}
                          onClick={() => handleQuizClick(id)}
                          className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left transition-colors border-l-4 ${
                            isActive 
                              ? "bg-orange-500/10 border-orange-500" 
                              : (completed ? "border-green-400 bg-green-50/20" : "border-orange-400 bg-orange-50/30")
                          }`}
                        >
                          {completed ? (
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <BookOpen className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-orange-600" : "text-orange-500"}`} />
                          )}
                          <span className={`flex-1 text-sm ${completed ? "text-gray-500 line-through" : "font-medium"}`}>
                            {getTextValue(quiz.title)}
                          </span>
                          <Badge variant="outline" className={`text-[10px] h-4 ${completed ? "bg-green-100" : "bg-white"}`}>
                            {completed ? (isRtl ? "ناجح" : "Passed") : (isRtl ? "اختبار" : "Quiz")}
                          </Badge>
                        </button>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
