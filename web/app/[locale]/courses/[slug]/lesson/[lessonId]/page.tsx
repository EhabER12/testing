"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getCourseBySlug } from "@/store/services/courseService";
import { getQuizzesByCourse } from "@/store/services/quizService";
import {
  getUserProgress,
  markLessonCompleted,
  updateCurrentLesson,
} from "@/store/services/progressService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  CheckCircle,
  Download,
  FileText,
  Lock,
  BookOpen,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/use-toast";
import CourseSidebar from "@/components/courses/CourseSidebar";
import { SecureVideoPlayer } from "@/components/course/SecureVideoPlayer";

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const locale = params.locale as string;
  const slug = params.slug as string;
  const lessonId = params.lessonId as string;
  const isRtl = locale === "ar";

  const { currentCourse, isLoading: courseLoading } = useAppSelector(
    (state) => state.courses
  );
  const { quizzes } = useAppSelector((state) => state.quizzes);
  const { currentProgress, markingComplete } = useAppSelector(
    (state) => state.progress
  );
  const { user } = useAppSelector((state) => state.auth);

  const courseSections = (currentCourse as any)?.sections || [];
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [currentSection, setCurrentSection] = useState<any>(null);
  const [accessChecked, setAccessChecked] = useState(false);

  // Fetch course data
  useEffect(() => {
    if (slug) {
      dispatch(getCourseBySlug(slug));
    }
  }, [dispatch, slug]);

  // Fetch quizzes when course is loaded
  useEffect(() => {
    const courseId = currentCourse?.id || currentCourse?._id;
    if (courseId) {
      dispatch(getQuizzesByCourse(courseId));
    }
  }, [dispatch, currentCourse?.id, currentCourse?._id]);

  // Fetch progress when course is loaded
  useEffect(() => {
    const courseId = currentCourse?.id || currentCourse?._id;
    if (courseId && user) {
      dispatch(getUserProgress(courseId));
    }
  }, [dispatch, currentCourse?.id, currentCourse?._id, user]);

  // Access guard: redirect non-enrolled users on paid/package courses
  useEffect(() => {
    if (!currentCourse || courseLoading) return;

    const accessType = (currentCourse as any)?.accessType;
    const isEnrolled = !!(currentCourse as any)?.userProgress;

    // Free courses: always allow
    if (accessType === "free") {
      setAccessChecked(true);
      return;
    }

    // Not logged in on a paid/package course: redirect to login
    if (!user) {
      router.replace(`/${locale}/login`);
      return;
    }

    // Paid or package course: check enrollment
    if ((accessType === "paid" || accessType === "byPackage") && !isEnrolled) {
      toast({
        title: isRtl ? "غير مسجل" : "Not Enrolled",
        description: isRtl
          ? "يجب التسجيل في الدورة أولاً للوصول إلى الدروس"
          : "You must enroll in this course first to access lessons",
        variant: "destructive",
      });
      router.replace(`/${locale}/courses/${slug}`);
      return;
    }

    setAccessChecked(true);
  }, [currentCourse, courseLoading, user, locale, slug, router, toast, isRtl]);

  // Find current lesson
  useEffect(() => {
    if (courseSections.length > 0 && lessonId) {
      for (const section of courseSections) {
        const lesson = section.lessons?.find(
          (l: any) => (l.id || l._id) === lessonId
        );
        if (lesson) {
          setCurrentLesson(lesson);
          setCurrentSection(section);
          break;
        }
      }
    }
  }, [courseSections, lessonId]);

  // Update current lesson in backend (only when lesson changes)
  useEffect(() => {
    const courseId = currentCourse?.id || currentCourse?._id;
    const lid = currentLesson?.id || currentLesson?._id;
    if (currentLesson && courseId && user) {
      if (lid) {
        dispatch(
          updateCurrentLesson({
            courseId: courseId,
            lessonId: lid,
          })
        ).catch(() => { }); // Silently handle errors
      }
    }
  }, [currentLesson?.id, currentLesson?._id, currentCourse?.id, currentCourse?._id, user]);

  const getTextValue = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return (isRtl ? value.ar : value.en) || value.en || value.ar || "";
  };

  const getYouTubeEmbedUrl = (url: string): string => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&fs=0&disablekb=1&playsinline=1`;
      }
    }
    return url;
  };

  const getVimeoEmbedUrl = (url: string): string => {
    const patterns = [
      /vimeo\.com\/(?:video\/)?(\d+)/,
      /player\.vimeo\.com\/video\/(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://player.vimeo.com/video/${match[1]}?autoplay=1&title=0&byline=0&portrait=0&badge=0&vimeo_logo=0&dnt=1`;
      }
    }
    return url;
  };

  // Get all lessons flattened
  const getAllLessons = () => {
    const allLessons: any[] = [];
    courseSections.forEach((section: any) => {
      section.lessons?.forEach((lesson: any) => {
        allLessons.push({
          ...lesson,
          sectionId: section.id || section._id,
          sectionTitle: section.title,
        });
      });
    });
    return allLessons;
  };

  const allLessons = getAllLessons();
  const currentIndex = allLessons.findIndex(
    (l) => (l.id || l._id) === lessonId
  );

  // Check if lesson is completed
  const isLessonCompleted = (lessonIdToCheck: string) => {
    if (!currentProgress?.completedLessons) return false;
    return currentProgress.completedLessons.some(
      (id: any) => id === lessonIdToCheck || id?.toString() === lessonIdToCheck
    );
  };

  // Check if quiz is completed
  const isQuizCompleted = (quizIdToCheck: string) => {
    if (!currentProgress?.completedQuizzes) return false;
    return currentProgress.completedQuizzes.some(
      (id: any) => id === quizIdToCheck || id?.toString() === quizIdToCheck
    );
  };

  const handleNavigation = (direction: "prev" | "next") => {
    if (direction === "prev" && currentIndex > 0) {
      const prevLesson = allLessons[currentIndex - 1];
      router.push(
        `/${locale}/courses/${slug}/lesson/${prevLesson.id || prevLesson._id}`
      );
    } else if (direction === "next" && currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1];
      router.push(
        `/${locale}/courses/${slug}/lesson/${nextLesson.id || nextLesson._id}`
      );
    }
  };

  const handleMarkComplete = async () => {
    const courseId = currentCourse?.id || currentCourse?._id;
    if (!courseId || !lessonId) return;

    try {
      const result = await dispatch(
        markLessonCompleted({
          courseId: courseId,
          lessonId: currentLesson?.id || currentLesson?._id || lessonId,
        })
      ).unwrap();

      toast({
        title: isRtl ? "تم بنجاح" : "Success",
        description: result.isCompleted
          ? isRtl
            ? "مبروك! لقد أتممت الدورة بنجاح"
            : "Congratulations! You completed the course!"
          : isRtl
            ? "تم تسجيل إتمام الدرس"
            : "Lesson marked as complete",
        variant: "default",
      });

      // Auto navigate to next lesson if not last
      if (!result.isCompleted && currentIndex < allLessons.length - 1) {
        setTimeout(() => {
          handleNavigation("next");
        }, 1000);
      }
    } catch (error: any) {
      toast({
        title: isRtl ? "خطأ" : "Error",
        description: error || (isRtl ? "حدث خطأ" : "Something went wrong"),
        variant: "destructive",
      });
    }
  };

  const handleLessonClick = (lesson: any) => {
    const id = lesson.id || lesson._id;
    if (id) {
      router.push(`/${locale}/courses/${slug}/lesson/${id}`);
    }
  };

  const handleQuizClick = (quizId: string) => {
    router.push(`/${locale}/courses/${slug}/quiz/${quizId}`);
  };

  if (courseLoading || !accessChecked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-genoun-green border-t-transparent"></div>
      </div>
    );
  }

  if (!currentLesson) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-xl text-gray-600">
            {isRtl ? "الدرس غير موجود" : "Lesson not found"}
          </p>
          <Button
            className="mt-4"
            onClick={() => router.push(`/${locale}/courses/${slug}`)}
          >
            {isRtl ? "العودة للدورة" : "Back to Course"}
          </Button>
        </div>
      </div>
    );
  }

  const currentLessonId = currentLesson.id || currentLesson._id;
  const isCurrentLessonCompleted = isLessonCompleted(currentLessonId);

  return (
    <div className="min-h-screen bg-gray-50" dir={isRtl ? "rtl" : "ltr"}>
      {/* Video Player */}
      <div className="bg-black">
        <div className="container mx-auto">
          <div className="relative aspect-video bg-gray-900">
            {currentLesson?.videoUrl ? (
              currentLesson?.videoSource === "upload" ? (
                // Use SecureVideoPlayer for uploaded videos
                <SecureVideoPlayer
                  videoUrl={currentLesson.videoUrl}
                  lessonId={currentLessonId}
                  userEmail={user?.email}
                  className="w-full"
                />
              ) : (
                // Use iframe for YouTube/Vimeo
                <iframe
                  src={
                    currentLesson?.videoSource === "vimeo"
                      ? getVimeoEmbedUrl(currentLesson.videoUrl)
                      : getYouTubeEmbedUrl(currentLesson.videoUrl)
                  }
                  className="absolute top-0 left-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-900 text-white">
                <div className="text-center">
                  <PlayCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p>{isRtl ? "لا يوجد فيديو" : "No video available"}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Lesson Info */}
            <Card>
              <CardHeader>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">
                      {getTextValue(currentSection?.title)}
                    </Badge>
                    {isCurrentLessonCompleted && (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {isRtl ? "مكتمل" : "Completed"}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl">
                    {getTextValue(currentLesson.title)}
                  </CardTitle>
                  {currentLesson.duration && (
                    <CardDescription>
                      {currentLesson.duration} {isRtl ? "دقيقة" : "minutes"}
                    </CardDescription>
                  )}
                </div>
              </CardHeader>
              {currentLesson.description && (
                <CardContent>
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: getTextValue(currentLesson.description),
                    }}
                  />
                </CardContent>
              )}
            </Card>

            {/* Materials */}
            {currentLesson.materials && currentLesson.materials.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {isRtl ? "المواد التعليمية" : "Course Materials"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {currentLesson.materials.map(
                      (material: any, index: number) => (
                        <a
                          key={index}
                          href={material.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50"
                        >
                          <FileText className="h-5 w-5 text-blue-600" />
                          <span className="flex-1">{getTextValue(material.title)}</span>
                          <Download className="h-4 w-4 text-gray-400" />
                        </a>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <Button
                variant="outline"
                onClick={() => handleNavigation("prev")}
                disabled={currentIndex === 0}
              >
                {isRtl ? (
                  <>
                    <ChevronRight className="h-4 w-4 ml-2" />
                    الدرس السابق
                  </>
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous Lesson
                  </>
                )}
              </Button>

              <Button
                className={
                  isCurrentLessonCompleted
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-genoun-green hover:bg-genoun-green/90"
                }
                onClick={handleMarkComplete}
                disabled={markingComplete || isCurrentLessonCompleted}
              >
                {markingComplete ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                ) : (
                  <CheckCircle
                    className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`}
                  />
                )}
                {isCurrentLessonCompleted
                  ? isRtl
                    ? "تمت المشاهدة"
                    : "Completed"
                  : isRtl
                    ? "إتمام الدرس"
                    : "Mark Complete"}
              </Button>

              <Button
                variant="outline"
                onClick={() => handleNavigation("next")}
                disabled={currentIndex === allLessons.length - 1}
              >
                {isRtl ? (
                  <>
                    الدرس التالي
                    <ChevronLeft className="h-4 w-4 mr-2" />
                  </>
                ) : (
                  <>
                    Next Lesson
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {/* Progress Bar */}
            {currentProgress && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{isRtl ? "تقدمك في الدورة" : "Your Progress"}</span>
                      <span className="font-semibold">
                        {currentProgress.percentage || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-genoun-green h-2.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${currentProgress.percentage || 0}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {(currentProgress.completedLessonsCount || 0) + (currentProgress.completedQuizzesCount || 0)} /{" "}
                      {currentProgress.totalItemsCount || currentProgress.totalLessonsCount || 0}{" "}
                      {isRtl ? "عنصر مكتمل" : "items completed"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Course Content */}
          <div className="md:col-span-1">
            <CourseSidebar
              locale={locale}
              slug={slug}
              currentLessonId={currentLessonId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
