"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getCourse } from "@/store/services/courseService";
import {
  getCourseSections,
  createSection,
  updateSection,
  deleteSection,
  createLesson,
  updateLesson,
  deleteLesson,
} from "@/store/services/sectionService";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import { isAdmin, isTeacher } from "@/store/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Video,
  FileText,
  ArrowLeft,
  GripVertical,
  HelpCircle,
  FileQuestion,
} from "lucide-react";
import Link from "next/link";
import { VideoUploader } from "@/components/dashboard/VideoUploader";

function CourseBuilderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t, isRtl } = useAdminLocale();
  const courseId = searchParams.get("courseId");

  console.log("courseId from searchParams:", courseId);

  const { currentCourse, isLoading: courseLoading } = useAppSelector(
    (state) => state.courses
  );
  const { sections, isLoading: sectionsLoading } = useAppSelector(
    (state) => state.sections
  );
  const { user } = useAppSelector((state) => state.auth);

  const [sectionDialog, setSectionDialog] = useState<{
    open: boolean;
    mode: "create" | "edit";
    data: any;
  }>({ open: false, mode: "create", data: null });

  const [lessonDialog, setLessonDialog] = useState<{
    open: boolean;
    mode: "create" | "edit";
    sectionId: string | null;
    data: any;
  }>({ open: false, mode: "create", sectionId: null, data: null });

  useEffect(() => {
    if (courseId) {
      dispatch(getCourse(courseId));
      dispatch(getCourseSections(courseId));
    }
  }, [dispatch, courseId]);

  // Authorization check: Teachers can only access their own courses
  useEffect(() => {
    if (currentCourse && user && courseId) {
      if (isTeacher() && !isAdmin()) {
        const courseInstructorId = typeof currentCourse.instructorId === "object"
          ? (currentCourse.instructorId as any)._id || (currentCourse.instructorId as any).id
          : currentCourse.instructorId;

        if (courseInstructorId !== user._id) {
          router.push("/dashboard/courses");
        }
      }
    }
  }, [currentCourse, user, courseId, router]);

  const getTextValue = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return (isRtl ? value.ar : value.en) || value.en || value.ar || "";
  };

  const handleSectionSubmit = async () => {
    if (!courseId) return;
    if (sectionDialog.mode === "create") {
      await dispatch(
        createSection({
          courseId,
          title: sectionDialog.data.title,
          description: sectionDialog.data.description,
        })
      ).unwrap();
    } else {
      await dispatch(
        updateSection({
          id: sectionDialog.data.id || sectionDialog.data._id,
          data: {
            title: sectionDialog.data.title,
            description: sectionDialog.data.description,
          },
        })
      ).unwrap();
    }
    setSectionDialog({ open: false, mode: "create", data: null });
  };

  const handleLessonSubmit = async () => {
    if (!courseId) return;
    if (lessonDialog.mode === "create") {
      await dispatch(
        createLesson({
          sectionId: lessonDialog.sectionId!,
          courseId: courseId,
          title: lessonDialog.data.title,
          description: lessonDialog.data.description,
          videoSource: lessonDialog.data.videoSource,
          videoUrl: lessonDialog.data.videoUrl,
          duration: lessonDialog.data.duration
            ? parseInt(lessonDialog.data.duration)
            : undefined,
          materials: lessonDialog.data.materials,
        })
      ).unwrap();
    } else {
      await dispatch(
        updateLesson({
          id: lessonDialog.data.id || lessonDialog.data._id,
          data: {
            title: lessonDialog.data.title,
            description: lessonDialog.data.description,
            videoSource: lessonDialog.data.videoSource,
            videoUrl: lessonDialog.data.videoUrl,
            duration: lessonDialog.data.duration
              ? parseInt(lessonDialog.data.duration)
              : undefined,
            materials: lessonDialog.data.materials,
          },
        })
      ).unwrap();
    }
    setLessonDialog({
      open: false,
      mode: "create",
      sectionId: null,
      data: null,
    });
  };

  const handleDeleteSection = async (id: string) => {
    if (
      confirm(
        isRtl
          ? "هل أنت متأكد من حذف هذا القسم وجميع دروسه؟"
          : "Are you sure you want to delete this section and all its lessons?"
      )
    ) {
      await dispatch(deleteSection(id));
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (confirm(isRtl ? "هل أنت متأكد من حذف هذا الدرس؟" : "Are you sure?")) {
      await dispatch(deleteLesson(id));
    }
  };

  if (!courseId) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p>Course ID not found</p>
      </div>
    );
  }

  if (courseLoading || sectionsLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-genoun-green border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 space-y-4 p-8 pt-6 ${isRtl ? "text-right" : ""}`}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isRtl ? "بناء الدورة" : "Course Builder"}
          </h2>
          <p className="text-muted-foreground">
            {currentCourse ? getTextValue(currentCourse.title) : ""}
          </p>
        </div>
        <Link href="/dashboard/courses">
          <Button variant="outline">
            <ArrowLeft className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
            {isRtl ? "رجوع" : "Back"}
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{isRtl ? "محتوى الدورة" : "Course Content"}</CardTitle>
              <CardDescription>
                {isRtl
                  ? `${sections.length} قسم، ${sections.reduce(
                    (acc, s) => acc + (s.lessons?.length || 0),
                    0
                  )} درس`
                  : `${sections.length} sections, ${sections.reduce(
                    (acc, s) => acc + (s.lessons?.length || 0),
                    0
                  )} lessons, ${sections.reduce(
                    (acc, s) => acc + (s.quizzes?.length || 0),
                    0
                  )} quizzes`}
              </CardDescription>
            </div>
            <Button
              onClick={() =>
                setSectionDialog({
                  open: true,
                  mode: "create",
                  data: {
                    title: { ar: "", en: "" },
                    description: { ar: "", en: "" },
                  },
                })
              }
              className="bg-genoun-green hover:bg-genoun-green/90"
            >
              <Plus className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
              {isRtl ? "إضافة قسم" : "Add Section"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sections.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                {isRtl ? "لا توجد أقسام" : "No sections"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {isRtl ? "ابدأ بإضافة قسم جديد" : "Start by adding a new section"}
              </p>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {sections.map((section, index) => (
                <AccordionItem
                  key={section.id || section._id || `section-${index}`}
                  value={(section.id || section._id || `section-${index}`)!}
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 flex-1">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-semibold">
                        {getTextValue(section.title)}
                      </span>
                      <Badge variant="secondary" className="ml-auto">
                        {section.lessons?.length || 0}{" "}
                        {isRtl ? "درس" : "lessons"}
                        {" • "}
                        {section.quizzes?.length || 0}{" "}
                        {isRtl ? "اختبار" : "quizzes"}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-600">
                          {getTextValue(section.description) ||
                            (isRtl ? "لا يوجد وصف" : "No description")}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setSectionDialog({
                                open: true,
                                mode: "edit",
                                data: section,
                              })
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteSection((section.id || section._id)!)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {section.lessons && section.lessons.length > 0 ? (
                          section.lessons.map((lesson, lessonIndex) => (
                            <div
                              key={lesson.id || lesson._id || `lesson-${lessonIndex}`}
                              className="flex items-center justify-between border rounded p-3 hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-3">
                                <Video className="h-4 w-4 text-blue-600" />
                                <Badge variant="outline">{lessonIndex + 1}</Badge>
                                <div>
                                  <p className="font-medium">
                                    {getTextValue(lesson.title)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {lesson.videoSource} •{" "}
                                    {lesson.duration
                                      ? `${lesson.duration} ${isRtl ? "د" : "min"}`
                                      : isRtl
                                        ? "مدة غير محددة"
                                        : "No duration"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    setLessonDialog({
                                      open: true,
                                      mode: "edit",
                                      sectionId: (section.id || section._id)!,
                                      data: lesson,
                                    })
                                  }
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteLesson((lesson.id || lesson._id)!)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : null}

                        {section.quizzes && section.quizzes.length > 0 ? (
                          section.quizzes.map((quiz, quizIndex) => (
                            <div
                              key={quiz.id || quiz._id || `quiz-${quizIndex}`}
                              className="flex items-center justify-between border rounded p-3 border-orange-200 bg-orange-50/30 hover:bg-orange-50/50"
                            >
                              <div className="flex items-center gap-3">
                                <FileQuestion className="h-4 w-4 text-orange-600" />
                                <Badge variant="outline" className="border-orange-300">Q</Badge>
                                <div>
                                  <p className="font-medium text-orange-900">
                                    {getTextValue(quiz.title)}
                                  </p>
                                  <p className="text-xs text-orange-700/70">
                                    {quiz.questionsCount || 0} {isRtl ? "سؤال" : "questions"} •{" "}
                                    {quiz.passingScore}% {isRtl ? "درجة النجاح" : "Passing"}
                                    {quiz.isRequiredForCertificate && (
                                      <span className="text-red-600 ml-2">
                                        * {isRtl ? "مطلوب للشهادة" : "Required for Certificate"}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Link href={`/dashboard/quizzes/${quiz.id || quiz._id}/edit`}>
                                  <Button size="sm" variant="ghost">
                                    <Edit className="h-4 w-4 text-orange-600" />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          ))
                        ) : null}

                        {(!section.lessons || section.lessons.length === 0) && (!section.quizzes || section.quizzes.length === 0) && (
                          <p className="text-center text-sm text-gray-500 py-4">
                            {isRtl ? "لا توجد دروس أو اختبارات" : "No lessons or quizzes yet"}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() =>
                            setLessonDialog({
                              open: true,
                              mode: "create",
                              sectionId: (section.id || section._id)!,
                              data: {
                                title: { ar: "", en: "" },
                                description: { ar: "", en: "" },
                                videoSource: "youtube",
                                videoUrl: "",
                                duration: "",
                                materials: [],
                              },
                            })
                          }
                        >
                          <Plus className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                          {isRtl ? "إضافة درس" : "Add Lesson"}
                        </Button>
                        <Link
                          href={`/dashboard/quizzes/create?courseId=${courseId}&sectionId=${section.id || section._id}&linkedTo=section`}
                          className="flex-1"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                          >
                            <Plus className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                            {isRtl ? "إضافة اختبار" : "Add Quiz"}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Section Dialog */}
      <Dialog
        open={sectionDialog.open}
        onOpenChange={(open) => setSectionDialog({ ...sectionDialog, open })}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {sectionDialog.mode === "create"
                ? isRtl
                  ? "إضافة قسم جديد"
                  : "Add New Section"
                : isRtl
                  ? "تعديل القسم"
                  : "Edit Section"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRtl ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
                <Input
                  value={sectionDialog.data?.title?.ar || ""}
                  onChange={(e) =>
                    setSectionDialog({
                      ...sectionDialog,
                      data: {
                        ...sectionDialog.data,
                        title: {
                          ...sectionDialog.data?.title,
                          ar: e.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{isRtl ? "العنوان (إنجليزي)" : "Title (English)"}</Label>
                <Input
                  value={sectionDialog.data?.title?.en || ""}
                  onChange={(e) =>
                    setSectionDialog({
                      ...sectionDialog,
                      data: {
                        ...sectionDialog.data,
                        title: {
                          ...sectionDialog.data?.title,
                          en: e.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRtl ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
                <Textarea
                  rows={3}
                  value={sectionDialog.data?.description?.ar || ""}
                  onChange={(e) =>
                    setSectionDialog({
                      ...sectionDialog,
                      data: {
                        ...sectionDialog.data,
                        description: {
                          ...sectionDialog.data?.description,
                          ar: e.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{isRtl ? "الوصف (إنجليزي)" : "Description (English)"}</Label>
                <Textarea
                  rows={3}
                  value={sectionDialog.data?.description?.en || ""}
                  onChange={(e) =>
                    setSectionDialog({
                      ...sectionDialog,
                      data: {
                        ...sectionDialog.data,
                        description: {
                          ...sectionDialog.data?.description,
                          en: e.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setSectionDialog({ open: false, mode: "create", data: null })
              }
            >
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              className="bg-genoun-green hover:bg-genoun-green/90"
              onClick={handleSectionSubmit}
            >
              {isRtl ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog
        open={lessonDialog.open}
        onOpenChange={(open) => setLessonDialog({ ...lessonDialog, open })}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {lessonDialog.mode === "create"
                ? isRtl
                  ? "إضافة درس جديد"
                  : "Add New Lesson"
                : isRtl
                  ? "تعديل الدرس"
                  : "Edit Lesson"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRtl ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
                <Input
                  value={lessonDialog.data?.title?.ar || ""}
                  onChange={(e) =>
                    setLessonDialog({
                      ...lessonDialog,
                      data: {
                        ...lessonDialog.data,
                        title: {
                          ...lessonDialog.data?.title,
                          ar: e.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{isRtl ? "العنوان (إنجليزي)" : "Title (English)"}</Label>
                <Input
                  value={lessonDialog.data?.title?.en || ""}
                  onChange={(e) =>
                    setLessonDialog({
                      ...lessonDialog,
                      data: {
                        ...lessonDialog.data,
                        title: {
                          ...lessonDialog.data?.title,
                          en: e.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRtl ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
                <Textarea
                  rows={2}
                  value={lessonDialog.data?.description?.ar || ""}
                  onChange={(e) =>
                    setLessonDialog({
                      ...lessonDialog,
                      data: {
                        ...lessonDialog.data,
                        description: {
                          ...lessonDialog.data?.description,
                          ar: e.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{isRtl ? "الوصف (إنجليزي)" : "Description (English)"}</Label>
                <Textarea
                  rows={2}
                  value={lessonDialog.data?.description?.en || ""}
                  onChange={(e) =>
                    setLessonDialog({
                      ...lessonDialog,
                      data: {
                        ...lessonDialog.data,
                        description: {
                          ...lessonDialog.data?.description,
                          en: e.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRtl ? "مصدر الفيديو" : "Video Source"}</Label>
                <Select
                  value={lessonDialog.data?.videoSource || "youtube"}
                  onValueChange={(value) =>
                    setLessonDialog({
                      ...lessonDialog,
                      data: { ...lessonDialog.data, videoSource: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="vimeo">Vimeo</SelectItem>
                    <SelectItem value="upload">
                      {isRtl ? "رفع فيديو" : "Upload Video"}
                    </SelectItem>
                    <SelectItem value="direct">
                      {isRtl ? "رابط مباشر" : "Direct Link"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isRtl ? "المدة (دقائق)" : "Duration (minutes)"}</Label>
                <Input
                  type="number"
                  value={lessonDialog.data?.duration || ""}
                  onChange={(e) =>
                    setLessonDialog({
                      ...lessonDialog,
                      data: { ...lessonDialog.data, duration: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            {/* Video Upload Section */}
            {lessonDialog.data?.videoSource === "upload" && lessonDialog.data?.id && (
              <div className="space-y-2">
                <Label>{isRtl ? "الفيديو" : "Video File"}</Label>
                <VideoUploader
                  lessonId={lessonDialog.data.id || lessonDialog.data._id}
                  currentVideoUrl={lessonDialog.data?.videoUrl}
                  onUploadSuccess={(videoUrl) => {
                    setLessonDialog({
                      ...lessonDialog,
                      data: { ...lessonDialog.data, videoUrl },
                    });
                  }}
                  onDeleteSuccess={() => {
                    setLessonDialog({
                      ...lessonDialog,
                      data: { ...lessonDialog.data, videoUrl: null },
                    });
                  }}
                />
              </div>
            )}

            {/* Video URL for other sources */}
            {lessonDialog.data?.videoSource !== "upload" && (
              <div className="space-y-2">
                <Label>{isRtl ? "رابط الفيديو" : "Video URL"}</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={lessonDialog.data?.videoUrl || ""}
                  onChange={(e) =>
                    setLessonDialog({
                      ...lessonDialog,
                      data: { ...lessonDialog.data, videoUrl: e.target.value },
                    })
                  }
                />
              </div>
            )}

            {lessonDialog.data?.videoSource === "upload" && !lessonDialog.data?.id && (
              <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  {isRtl
                    ? "يرجى حفظ الدرس أولاً لتتمكن من رفع الفيديو"
                    : "Please save the lesson first to enable video upload"}
                </p>
              </div>
            )}

            {/* Materials Section */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  {isRtl ? "المواد التعليمية" : "Educational Materials"}
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentMaterials = lessonDialog.data?.materials || [];
                    setLessonDialog({
                      ...lessonDialog,
                      data: {
                        ...lessonDialog.data,
                        materials: [
                          ...currentMaterials,
                          {
                            title: { ar: "", en: "" },
                            url: "",
                            type: "pdf"
                          },
                        ],
                      },
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isRtl ? "إضافة ملف" : "Add Material"}
                </Button>
              </div>

              <div className="space-y-3">
                {(lessonDialog.data?.materials || []).map((material: any, mIndex: number) => (
                  <div key={mIndex} className="p-3 border rounded-lg bg-gray-50 space-y-3 relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-red-500 h-6 w-6 p-0"
                      onClick={() => {
                        const newMaterials = [...lessonDialog.data.materials];
                        newMaterials.splice(mIndex, 1);
                        setLessonDialog({
                          ...lessonDialog,
                          data: { ...lessonDialog.data, materials: newMaterials },
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">{isRtl ? "العنوان (عربي)" : "Title (AR)"}</Label>
                        <Input
                          className="h-8 text-xs"
                          value={material.title?.ar || ""}
                          onChange={(e) => {
                            const newMaterials = [...lessonDialog.data.materials];
                            newMaterials[mIndex] = {
                              ...material,
                              title: { ...material.title, ar: e.target.value }
                            };
                            setLessonDialog({
                              ...lessonDialog,
                              data: { ...lessonDialog.data, materials: newMaterials },
                            });
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{isRtl ? "العنوان (إنجليزي)" : "Title (EN)"}</Label>
                        <Input
                          className="h-8 text-xs"
                          value={material.title?.en || ""}
                          onChange={(e) => {
                            const newMaterials = [...lessonDialog.data.materials];
                            newMaterials[mIndex] = {
                              ...material,
                              title: { ...material.title, en: e.target.value }
                            };
                            setLessonDialog({
                              ...lessonDialog,
                              data: { ...lessonDialog.data, materials: newMaterials },
                            });
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">{isRtl ? "النوع" : "Type"}</Label>
                        <Select
                          value={material.type}
                          onValueChange={(val) => {
                            const newMaterials = [...lessonDialog.data.materials];
                            newMaterials[mIndex] = { ...material, type: val };
                            setLessonDialog({
                              ...lessonDialog,
                              data: { ...lessonDialog.data, materials: newMaterials },
                            });
                          }}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="file">{isRtl ? "ملف" : "File"}</SelectItem>
                            <SelectItem value="link">{isRtl ? "رابط" : "Link"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{isRtl ? "الرابط" : "URL"}</Label>
                        <Input
                          className="h-8 text-xs"
                          type="url"
                          placeholder="https://..."
                          value={material.url || ""}
                          onChange={(e) => {
                            const newMaterials = [...lessonDialog.data.materials];
                            newMaterials[mIndex] = { ...material, url: e.target.value };
                            setLessonDialog({
                              ...lessonDialog,
                              data: { ...lessonDialog.data, materials: newMaterials },
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {(lessonDialog.data?.materials || []).length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-2 italic">
                    {isRtl ? "لا توجد مواد إضافية" : "No additional materials"}
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setLessonDialog({
                  open: false,
                  mode: "create",
                  sectionId: null,
                  data: null,
                })
              }
            >
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              className="bg-genoun-green hover:bg-genoun-green/90"
              onClick={handleLessonSubmit}
            >
              {isRtl ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CourseBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center p-8">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-genoun-green border-t-transparent"></div>
        </div>
      }
    >
      <CourseBuilderContent />
    </Suspense>
  );
}
