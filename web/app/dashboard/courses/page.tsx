"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getCourses,
  getMyTeachingCourses,
  deleteCourse,
  publishCourse,
  unpublishCourse,
  rejectCoursePublish,
  requestPublishCourse,
} from "@/store/services/courseService";
import { getCategories } from "@/store/slices/categorySlice";
import { isAuthenticated, isAdmin, isModerator, isTeacher } from "@/store/services/authService";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Layers,
} from "lucide-react";
import Link from "next/link";

export default function CoursesPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { t, isRtl, locale } = useAdminLocale();
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const { courses, isLoading, error } = useAppSelector((state) => state.courses);
  const { categories } = useAppSelector((state) => state.categories);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated() || !user) {
      router.push("/login");
      return;
    }

    if (!isAdmin() && !isModerator() && !isTeacher()) {
      router.push("/");
      return;
    }

    if (isTeacher()) {
      dispatch(getMyTeachingCourses());
    } else {
      dispatch(getCourses());
    }
    dispatch(getCategories({ active: true }));
  }, [dispatch, user, router]);

  // Debug: log courses to check _id
  useEffect(() => {
    if (courses.length > 0) {
      console.log("Courses data:", courses);
      console.log("First course _id:", courses[0]._id);
    }
  }, [courses]);

  const handleDelete = async (id: string) => {
    if (confirm(isRtl ? "هل أنت متأكد من حذف هذه الدورة؟" : "Are you sure you want to delete this course?")) {
      setDeleteLoading(id);
      try {
        await dispatch(deleteCourse(id)).unwrap();
      } catch (err) {
        console.error("Failed to delete course:", err);
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  const handlePublishToggle = async (id: string, isPublished: boolean) => {
    console.log("Toggle publish - ID:", id, "isPublished:", isPublished);
    if (!id) {
      console.error("No course ID provided");
      return;
    }
    try {
      if (isPublished) {
        await dispatch(unpublishCourse(id)).unwrap();
      } else {
        if (isAdmin()) {
          await dispatch(publishCourse(id)).unwrap();
        } else if (isTeacher()) {
          await dispatch(requestPublishCourse(id)).unwrap();
          alert(isRtl ? "تم إرسال طلب النشر للمراجعة" : "Publish request submitted for review");
        }
      }
    } catch (err) {
      console.error("Failed to toggle publish status:", err);
    }
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    try {
      await dispatch(rejectCoursePublish({ id: rejectingId, reason: rejectionReason })).unwrap();
      setIsRejectDialogOpen(false);
      setRejectingId(null);
      setRejectionReason("");
    } catch (err) {
      console.error("Failed to reject course:", err);
    }
  };

  // Get localized text helper
  const getLocalizedText = (
    text: { ar: string; en: string } | string | undefined,
    locale: string
  ): string => {
    if (!text) return "";
    if (typeof text === "string") return text;
    return text[locale as "ar" | "en"] || text.en || text.ar || "";
  };

  if (isLoading) {
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
            {isTeacher() ? (isRtl ? "دوراتي التعليمية" : "My Courses") : (isRtl ? "إدارة الدورات" : "Courses Management")}
          </h2>
          <p className="text-muted-foreground">
            {isTeacher() ? (isRtl ? "إدارة الدورات التي تقوم بتدريسها" : "Manage the courses you teach") : (isRtl ? "إدارة جميع دورات المنصة" : "Manage all platform courses")}
          </p>
        </div>
        <Link href="/dashboard/courses/create">
          <Button className="bg-genoun-green hover:bg-genoun-green/90">
            <Plus className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
            {isRtl ? "إنشاء دورة جديدة" : "Create Course"}
          </Button>
        </Link>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{isTeacher() ? (isRtl ? "قائمة الدورات" : "My Courses List") : (isRtl ? "جميع الدورات" : "All Courses")}</CardTitle>
          <CardDescription>
            {isRtl
              ? `${courses.length} دورة متاحة`
              : `${courses.length} courses available`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                {isRtl ? "لا توجد دورات" : "No courses"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {isRtl ? "ابدأ بإنشاء دورة جديدة" : "Get started by creating a new course"}
              </p>
              <div className="mt-6">
                <Link href="/dashboard/courses/create">
                  <Button className="bg-genoun-green hover:bg-genoun-green/90">
                    <Plus className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                    {isRtl ? "إنشاء دورة" : "Create Course"}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRtl ? "العنوان" : "Title"}</TableHead>
                  <TableHead>{isRtl ? "التصنيف" : "Category"}</TableHead>
                  <TableHead>{isRtl ? "المدرس" : "Instructor"}</TableHead>
                  <TableHead>{isRtl ? "المستوى" : "Level"}</TableHead>
                  <TableHead>{isRtl ? "النوع" : "Access"}</TableHead>
                  <TableHead>{isRtl ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{isRtl ? "المسجلين" : "Enrolled"}</TableHead>
                  <TableHead className="text-right">{isRtl ? "الإجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course, index) => (
                  <TableRow key={course.id || course._id || index}>
                    <TableCell className="font-medium">
                      {getLocalizedText(course.title, locale)}
                    </TableCell>
                    <TableCell>
                      {course.categoryId ? (
                        <Badge variant="outline" className="text-xs">
                          {typeof course.categoryId === "object"
                            ? getLocalizedText((course.categoryId as any).name, locale)
                            : isRtl ? "تصنيف" : "Category"}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {course.instructorId
                        ? getLocalizedText(course.instructorId.fullName, locale)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {course.level ? (
                        <Badge variant="outline">
                          {course.level === "beginner"
                            ? isRtl
                              ? "مبتدئ"
                              : "Beginner"
                            : course.level === "intermediate"
                              ? isRtl
                                ? "متوسط"
                                : "Intermediate"
                              : isRtl
                                ? "متقدم"
                                : "Advanced"}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          course.accessType === "free"
                            ? "default"
                            : course.accessType === "paid"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {course.accessType === "free"
                          ? isRtl
                            ? "مجاني"
                            : "Free"
                          : course.accessType === "paid"
                            ? isRtl
                              ? "مدفوع"
                              : "Paid"
                            : isRtl
                              ? "بالباقة"
                              : "Package"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {course.isPublished ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {isRtl ? "منشور" : "Published"}
                        </Badge>
                      ) : course.publishRequestedAt || (course as any).approvalStatus?.status === 'pending' ? (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          <MoreHorizontal className="h-3 w-3 mr-1 animate-pulse" />
                          {isRtl ? "في انتظار الموافقة" : "Pending Approval"}
                        </Badge>
                      ) : (course as any).approvalStatus?.status === 'rejected' ? (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          {isRtl ? "مرفوض" : "Rejected"}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <FileText className="h-3 w-3 mr-1" />
                          {isRtl ? "مسودة" : "Draft"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {course.stats?.enrolledCount || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>
                            {isRtl ? "الإجراءات" : "Actions"}
                          </DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/courses/builder?courseId=${course.id || course._id}`}>
                              <Layers className="h-4 w-4 mr-2" />
                              {isRtl ? "بناء المحتوى" : "Builder"}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/courses/${course.id || course._id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              {isRtl ? "عرض" : "View"}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/courses/${course.id || course._id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              {isRtl ? "تعديل" : "Edit"}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handlePublishToggle((course.id || course._id)!, course.isPublished)
                            }
                          >
                            {course.isPublished ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                {isRtl ? "إلغاء النشر" : "Unpublish"}
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {isRtl ? "نشر" : "Publish"}
                              </>
                            )}
                          </DropdownMenuItem>
                          {isAdmin() && !course.isPublished && (course.publishRequestedAt || (course as any).approvalStatus?.status === 'pending') && (
                            <DropdownMenuItem
                              className="text-orange-600"
                              onClick={() => {
                                setRejectingId((course.id || course._id)!);
                                setIsRejectDialogOpen(true);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              {isRtl ? "رفض النشر" : "Reject Publish"}
                            </DropdownMenuItem>
                          )}
                          {isAdmin() && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDelete((course.id || course._id)!)}
                                disabled={deleteLoading === (course.id || course._id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {deleteLoading === (course.id || course._id)
                                  ? isRtl
                                    ? "جاري الحذف..."
                                    : "Deleting..."
                                  : isRtl
                                    ? "حذف"
                                    : "Delete"}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent dir={isRtl ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{isRtl ? "رفض نشر الدورة" : "Reject Course Publication"}</DialogTitle>
            <DialogDescription>
              {isRtl ? "يرجى ذكر سبب الرفض لمساعدة المعلم على إجراء التعديلات اللازمة." : "Please provide a reason for rejection to help the teacher make the necessary adjustments."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason">{isRtl ? "السبب" : "Reason"}</Label>
            <textarea
              id="rejection-reason"
              className="mt-2 min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={isRtl ? "مثلاً: المحتوى يحتاج إلى تحسين، نقص في الفيديوهات..." : "e.g., Content needs improvement, missing videos..."}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason}>
              {isRtl ? "رفض النشر" : "Reject Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
