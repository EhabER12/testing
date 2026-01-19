"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getCourse } from "@/store/services/courseService";
import { getCourseSections } from "@/store/services/sectionService";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  GraduationCap,
  PlayCircle,
  FileText,
  Users,
  Award,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CourseViewPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t, isRtl, locale } = useAdminLocale();
  const courseId = params.id as string;

  const { currentCourse, isLoading: courseLoading } = useAppSelector(
    (state) => state.courses
  );
  const { sections, isLoading: sectionsLoading } = useAppSelector(
    (state) => state.sections
  );

  useEffect(() => {
    if (courseId) {
      dispatch(getCourse(courseId));
      dispatch(getCourseSections(courseId));
    }
  }, [dispatch, courseId]);

  // Get localized text helper
  const getLocalizedText = (
    text: { ar: string; en: string } | string | undefined,
    locale: string
  ): string => {
    if (!text) return "";
    if (typeof text === "string") return text;
    return text[locale as "ar" | "en"] || text.en || text.ar || "";
  };

  if (courseLoading || sectionsLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-genoun-green border-t-transparent"></div>
      </div>
    );
  }

  if (!currentCourse) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p>{isRtl ? "الدورة غير موجودة" : "Course not found"}</p>
      </div>
    );
  }

  const totalLessons = sections.reduce(
    (acc, s) => acc + (s.lessons?.length || 0),
    0
  );

  return (
    <div
      className={`flex-1 space-y-6 p-8 pt-6 ${isRtl ? "text-right" : ""}`}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/courses">
          <Button variant="outline">
            <ArrowLeft className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
            {isRtl ? "رجوع للدورات" : "Back to Courses"}
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/dashboard/courses/builder?courseId=${courseId}`}>
            <Button variant="outline">
              {isRtl ? "تعديل المحتوى" : "Edit Content"}
            </Button>
          </Link>
        </div>
      </div>

      {/* Course Hero */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Thumbnail */}
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
              {currentCourse.thumbnail ? (
                <Image
                  src={currentCourse.thumbnail}
                  alt={getLocalizedText(currentCourse.title, locale)}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <GraduationCap className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant={
                      currentCourse.isPublished ? "default" : "secondary"
                    }
                  >
                    {currentCourse.isPublished
                      ? isRtl
                        ? "منشور"
                        : "Published"
                      : isRtl
                        ? "مسودة"
                        : "Draft"}
                  </Badge>
                  {currentCourse.level && (
                    <Badge variant="outline">
                      {currentCourse.level === "beginner"
                        ? isRtl
                          ? "مبتدئ"
                          : "Beginner"
                        : currentCourse.level === "intermediate"
                          ? isRtl
                            ? "متوسط"
                            : "Intermediate"
                          : isRtl
                            ? "متقدم"
                            : "Advanced"}
                    </Badge>
                  )}
                  {currentCourse.accessType && (
                    <Badge
                      variant={
                        currentCourse.accessType === "free"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {currentCourse.accessType === "free"
                        ? isRtl
                          ? "مجاني"
                          : "Free"
                        : currentCourse.accessType === "paid"
                          ? isRtl
                            ? "مدفوع"
                            : "Paid"
                          : isRtl
                            ? "بالباقة"
                            : "By Package"}
                    </Badge>
                  )}
                  {currentCourse.categoryId && (
                    <Badge variant="outline">
                      {typeof currentCourse.categoryId === "object"
                        ? getLocalizedText(currentCourse.categoryId.name, locale)
                        : isRtl
                          ? "تصنيف"
                          : "Category"}
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold mb-2">
                  {getLocalizedText(currentCourse.title, locale)}
                </h1>
                <p className="text-muted-foreground">
                  {getLocalizedText(currentCourse.shortDescription, locale)}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{sections.length}</p>
                    <p className="text-xs text-muted-foreground">
                      {isRtl ? "قسم" : "Sections"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{totalLessons}</p>
                    <p className="text-xs text-muted-foreground">
                      {isRtl ? "درس" : "Lessons"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {currentCourse.stats?.enrolledCount || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isRtl ? "طالب" : "Students"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {currentCourse.duration || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isRtl ? "ساعة" : "Hours"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {currentCourse.description && (
        <Card>
          <CardHeader>
            <CardTitle>{isRtl ? "عن الدورة" : "About Course"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{
                __html: getLocalizedText(currentCourse.description, locale),
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Course Content */}
      <Card>
        <CardHeader>
          <CardTitle>{isRtl ? "محتوى الدورة" : "Course Content"}</CardTitle>
          <CardDescription>
            {isRtl
              ? `${sections.length} قسم • ${totalLessons} درس`
              : `${sections.length} sections • ${totalLessons} lessons`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sections.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                {isRtl ? "لا يوجد محتوى" : "No content yet"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {isRtl
                  ? "استخدم بناء المحتوى لإضافة أقسام ودروس"
                  : "Use the content builder to add sections and lessons"}
              </p>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {sections.map((section, index) => (
                <AccordionItem key={section.id || section._id} value={(section.id || section._id)!}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 flex-1">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-semibold text-left">
                        {getLocalizedText(section.title, locale)}
                      </span>
                      <Badge variant="secondary" className="ml-auto">
                        {section.lessons?.length || 0}{" "}
                        {isRtl ? "درس" : "lessons"}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-4">
                      {section.description && (
                        <p className="text-sm text-gray-600 mb-4">
                          {getLocalizedText(section.description, locale)}
                        </p>
                      )}
                      {section.lessons && section.lessons.length > 0 ? (
                        section.lessons.map((lesson, lessonIndex) => {
                          console.log("Lesson data:", lesson, "ID:", lesson._id);
                          return (
                            <button
                              key={lesson.id || lesson._id || `lesson-${lessonIndex}`}
                              onClick={() => {
                                console.log("Navigating to lesson:", lesson.id || lesson._id);
                                router.push(
                                  `/ar/courses/${currentCourse.id || currentCourse._id}/lesson/${lesson.id || lesson._id}`
                                );
                              }}
                              className="w-full flex items-center justify-between border rounded p-3 hover:bg-gray-50 text-left"
                            >
                              <div className="flex items-center gap-3">
                                <PlayCircle className="h-4 w-4 text-blue-600" />
                                <Badge variant="outline">{lessonIndex + 1}</Badge>
                                <div>
                                  <p className="font-medium">
                                    {getLocalizedText(lesson.title, locale)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {lesson.videoSource} •{" "}
                                    {lesson.duration
                                      ? `${lesson.duration} ${isRtl ? "دقيقة" : "min"
                                      }`
                                      : isRtl
                                        ? "مدة غير محددة"
                                        : "No duration"}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <p className="text-center text-sm text-gray-500 py-4">
                          {isRtl ? "لا توجد دروس" : "No lessons yet"}
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Certificate Settings */}
      {currentCourse.certificateSettings?.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {isRtl ? "إعدادات الشهادة" : "Certificate Settings"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {isRtl ? "شهادة متاحة" : "Certificate Available"}
                </span>
                <Badge variant="default">{isRtl ? "نعم" : "Yes"}</Badge>
              </div>
              {currentCourse.certificateSettings.requiresExam && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {isRtl ? "يتطلب اختبار" : "Requires Exam"}
                  </span>
                  <Badge variant="secondary">{isRtl ? "نعم" : "Yes"}</Badge>
                </div>
              )}
              {currentCourse.certificateSettings.passingScore && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {isRtl ? "النسبة المطلوبة للنجاح" : "Passing Score"}
                  </span>
                  <span className="text-sm">
                    {currentCourse.certificateSettings.passingScore}%
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructor */}
      {currentCourse.instructorId && (
        <Card>
          <CardHeader>
            <CardTitle>{isRtl ? "المدرب" : "Instructor"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-genoun-green/10 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-genoun-green" />
              </div>
              <div>
                <p className="font-medium">
                  {getLocalizedText(currentCourse.instructorId.fullName, locale)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentCourse.instructorId.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
