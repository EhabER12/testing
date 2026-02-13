"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getCourseBySlug, enrollCourse } from "@/store/services/courseService";
import { addCourseToCart, openCart } from "@/store/slices/cartSlice";
import { getMySubscriptions } from "@/store/services/studentMemberService";
import { getCourseSections } from "@/store/services/sectionService";
import { getCourseCertificate, downloadCertificate } from "@/store/services/certificateService";
import { getUserProgress } from "@/store/services/progressService";
import { useToast } from "@/components/ui/use-toast";
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
  Clock,
  GraduationCap,
  PlayCircle,
  FileText,
  Users,
  Award,
  Lock,
  CheckCircle,
  Star,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { PriceDisplay } from "@/components/currency/PriceDisplay";
import { CourseReviewForm } from "@/components/courses/CourseReviewForm";
import { CourseReviewsList } from "@/components/courses/CourseReviewsList";

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const t = useTranslations();
  const locale = params.locale as string;
  const slug = params.slug as string;
  const isRtl = locale === "ar";

  const { currentCourse, isLoading: courseLoading } = useAppSelector(
    (state) => state.courses
  );
  const { mySubscriptions } = useAppSelector((state) => state.studentMembers);
  const { user } = useAppSelector((state) => state.auth);

  // Use sections from course data directly instead of separate sections state
  const sections = currentCourse?.sections || [];
  const sectionsLoading = false;

  const [enrolling, setEnrolling] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  const [downloadingCert, setDownloadingCert] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (slug) {
      dispatch(getCourseBySlug(slug));
    }
  }, [dispatch, slug]);

  // Fetch progress and certificate if user is logged in
  useEffect(() => {
    const courseId = (currentCourse?.id || currentCourse?._id);
    if (user && courseId) {
      // Get user progress
      dispatch(getUserProgress(courseId));

      // Get subscriptions if not already loaded
      if (mySubscriptions.length === 0) {
        dispatch(getMySubscriptions());
      }

      // Check if user has certificate for this course
      dispatch(getCourseCertificate(courseId))
        .unwrap()
        .then((cert) => {
          if (cert) {
            setCertificate(cert);
          }
        })
        .catch(() => {
          // No certificate yet
        });
    }
  }, [dispatch, user, currentCourse?.id, currentCourse?._id]);

  const getTextValue = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return (isRtl ? value.ar : value.en) || value.en || value.ar || "";
  };

  const handleEnroll = async () => {
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }

    if (!currentCourse) return;

    // Check if course is paid
    if (currentCourse.accessType === "paid") {
      const courseId = (currentCourse.id || currentCourse._id) as string;
      dispatch(
        addCourseToCart({
          course: {
            id: courseId,
            _id: currentCourse._id,
            title: currentCourse.title,
            slug: currentCourse.slug,
            shortDescription: currentCourse.shortDescription,
            thumbnail: currentCourse.thumbnail,
            accessType: currentCourse.accessType,
            price: currentCourse.price,
            currency: currentCourse.currency,
          },
          quantity: 1,
        })
      );
      toast({
        title: isRtl ? "تمت إضافة الدورة للسلة" : "Course added to cart",
        description: isRtl
          ? "يمكنك الآن إتمام الدفع من صفحة السلة"
          : "You can now complete checkout from cart",
        variant: "default",
      });
      dispatch(openCart());
      return;
    }

    // Check if course is by package
    if (currentCourse.accessType === "byPackage") {
      const hasActiveSubscription = mySubscriptions.some(
        (sub: any) => sub.status === "active"
      );

      if (!hasActiveSubscription) {
        toast({
          title: isRtl ? "يشترط وجود اشتراك" : "Subscription Required",
          description: isRtl
            ? "هذه الدورة تتطلب اشتراكاً نشطاً في أحد البرامج"
            : "This course requires an active program subscription",
          variant: "destructive",
        });
        router.push(`/${locale}/packages`);
        return;
      }
      // If they have an active subscription, proceed to enroll directly below
    }

    // For free or package-authorized courses, enroll directly
    setEnrolling(true);
    try {
      const courseId = (currentCourse.id || currentCourse._id) as string;
      await dispatch(enrollCourse(courseId)).unwrap();
      // Refresh course data to update enrollment status
      await dispatch(getCourseBySlug(slug));
      // Show success message
      toast({
        title: isRtl ? "تم التسجيل بنجاح" : "Enrollment Successful",
        description: isRtl
          ? "تم تسجيلك في الدورة بنجاح"
          : "You have been successfully enrolled in this course",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Enrollment failed:", error);
      toast({
        title: isRtl ? "فشل التسجيل" : "Enrollment Failed",
        description: error || (isRtl ? "فشل التسجيل" : "Failed to enroll in course"),
        variant: "destructive",
      });
    } finally {
      setEnrolling(false);
    }
  };

  const handleStartLesson = (lessonId: string) => {
    if (lessonId) {
      router.push(`/${locale}/courses/${slug}/lesson/${lessonId}`);
    }
  };

  if (courseLoading || sectionsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-genoun-green border-t-transparent"></div>
      </div>
    );
  }

  if (!currentCourse) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>{isRtl ? "الدورة غير موجودة" : "Course not found"}</p>
      </div>
    );
  }

  const totalLessons = sections.reduce(
    (acc: number, s: any) => acc + (s.lessons?.length || 0),
    0
  );
  const totalQuizzes = sections.reduce(
    (acc: number, s: any) => acc + (s.quizzes?.length || 0),
    0
  );
  const totalItems = totalLessons + totalQuizzes;

  // Check if user is enrolled by checking userProgress
  const isEnrolled = !!currentCourse?.userProgress;
  const userProgress = currentCourse?.userProgress;

  const handleStartCourse = () => {
    // Get first lesson
    const firstSection = sections[0];
    const firstLesson = firstSection?.lessons?.[0];
    const lessonId = firstLesson?.id || firstLesson?._id;
    console.log('First lesson:', firstLesson);
    if (lessonId) {
      router.push(`/${locale}/courses/${slug}/lesson/${lessonId}`);
    } else {
      console.warn('No lessons available to start');
    }
  };

  const handleDownloadCertificate = async () => {
    if (!certificate) return;

    setDownloadingCert(true);
    try {
      const blob = await dispatch(downloadCertificate((certificate.id || certificate._id)!)).unwrap();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificate-${certificate.certificateNumber}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: isRtl ? "تم التنزيل بنجاح" : "Download Successful",
        description: isRtl ? "تم تنزيل الشهادة بنجاح" : "Certificate downloaded successfully",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Certificate download failed:", error);
      toast({
        title: isRtl ? "فشل التنزيل" : "Download Failed",
        description: error || (isRtl ? "فشل تنزيل الشهادة" : "Failed to download certificate"),
        variant: "destructive",
      });
    } finally {
      setDownloadingCert(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={isRtl ? "rtl" : "ltr"}>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-genoun-green to-green-600 text-white">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Course Info */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30"
                >
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
                {currentCourse.accessType === "free" && (
                  <Badge
                    variant="secondary"
                    className="bg-white/20 text-white border-white/30"
                  >
                    {isRtl ? "مجاني" : "Free"}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl font-bold">
                {getTextValue(currentCourse.title)}
              </h1>
              <p className="text-lg text-white/90">
                {getTextValue(currentCourse.description)}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span>
                    {sections.length} {isRtl ? "قسم" : "sections"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5" />
                  <span>
                    {totalItems} {isRtl ? "مادة" : "items"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>
                    {currentCourse.stats?.enrolledCount || 0}{" "}
                    {isRtl ? "طالب" : "students"}
                  </span>
                </div>
                {currentCourse.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span>
                      {currentCourse.duration} {isRtl ? "ساعة" : "hours"}
                    </span>
                  </div>
                )}
                {currentCourse.stats?.averageRating && currentCourse.stats.averageRating > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">
                      {currentCourse.stats.averageRating.toFixed(1)}
                    </span>
                    <span className="text-white/80">
                      ({currentCourse.stats.totalReviews || 0} {isRtl ? "تقييم" : "reviews"})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Course Card */}
            <div className="md:col-span-1">
              <Card className="shadow-xl">
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-gray-100">
                    {currentCourse.thumbnail ? (
                      <Image
                        src={currentCourse.thumbnail}
                        alt={getTextValue(currentCourse.title)}
                        fill
                        className="object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <GraduationCap className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-6 space-y-4">
                    {currentCourse.accessType === "paid" && currentCourse.price && (
                      <div className="text-3xl font-bold text-genoun-green">
                        <PriceDisplay
                          amount={currentCourse.price}
                          currency={currentCourse.currency as "SAR" | "EGP" | "USD"}
                          locale={isRtl ? "ar" : "en"}
                        />
                      </div>
                    )}
                    {currentCourse.accessType === "byPackage" && !isEnrolled && (
                      <div className="text-sm font-semibold text-genoun-green bg-genoun-green/5 p-3 rounded-lg flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        <span>
                          {isRtl
                            ? "متاحة لمشتركي البرامج"
                            : "Available for program subscribers"}
                        </span>
                      </div>
                    )}
                    {isEnrolled ? (
                      <Button
                        className="w-full bg-genoun-green hover:bg-genoun-green/90"
                        size="lg"
                        onClick={handleStartCourse}
                        disabled={totalLessons === 0}
                      >
                        <PlayCircle className={`h-5 w-5 ${isRtl ? "ml-2" : "mr-2"}`} />
                        {totalLessons === 0
                          ? (isRtl ? "لا توجد دروس بعد" : "No lessons yet")
                          : (isRtl ? "ابدأ الدورة" : "Start Course")}
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-genoun-green hover:bg-genoun-green/90"
                        size="lg"
                        onClick={handleEnroll}
                        disabled={enrolling}
                      >
                        {isRtl ? "سجل الآن" : "Enroll Now"}
                      </Button>
                    )}
                    {currentCourse.certificateSettings?.enabled && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Award className="h-4 w-4" />
                        <span>
                          {isRtl
                            ? "شهادة إتمام متاحة"
                            : "Certificate available"}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Course Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Description */}
            {currentCourse.description && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {isRtl ? "عن الدورة" : "About this course"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: getTextValue(currentCourse.description),
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Course Content */}
            <Card>
              <CardHeader>
                <CardTitle>{isRtl ? "محتوى الدورة" : "Course content"}</CardTitle>
                <CardDescription>
                  {isRtl
                    ? `${sections.length} قسم • ${totalItems} مادة تعليمية`
                    : `${sections.length} sections • ${totalItems} items`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {sections.map((section: any, index: number) => {
                    const sectionId = section.id || section._id;
                    return (
                      <AccordionItem key={sectionId} value={sectionId}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-3 flex-1">
                            <Badge variant="outline">{index + 1}</Badge>
                            <span className="font-semibold text-left">
                              {getTextValue(section.title)}
                            </span>
                            <Badge variant="secondary" className={isRtl ? "mr-auto" : "ml-auto"}>
                              {(section.lessons?.length || 0) + (section.quizzes?.length || 0)}{" "}
                              {isRtl ? "مادة" : "items"}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-4">
                            {/* Lessons */}
                            {section.lessons?.map((lesson: any, lessonIndex: number) => {
                              const lessonId = lesson.id || lesson._id;
                              const isCompleted = userProgress?.completedLessons?.includes(lessonId);

                              return (
                                <button
                                  key={lessonId || lessonIndex}
                                  onClick={() => {
                                    if (isEnrolled && lessonId) {
                                      handleStartLesson(lessonId);
                                    }
                                  }}
                                  disabled={!isEnrolled || !lessonId}
                                  className={`w-full flex items-center justify-between border rounded p-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-left ${isCompleted ? "bg-green-50/30 border-green-100" : ""
                                    }`}
                                >
                                  <div className="flex items-center gap-3">
                                    {isCompleted ? (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <PlayCircle className="h-4 w-4 text-blue-600" />
                                    )}
                                    <Badge variant="outline">{lessonIndex + 1}</Badge>
                                    <div>
                                      <p className="font-medium">
                                        {getTextValue(lesson.title)}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {lesson.duration
                                          ? `${lesson.duration} ${isRtl ? "دقيقة" : "min"
                                          }`
                                          : ""}
                                      </p>
                                    </div>
                                  </div>
                                  {!isEnrolled ? (
                                    <Lock className="h-4 w-4 text-gray-400" />
                                  ) : isCompleted ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : null}
                                </button>
                              );
                            })}

                            {/* Quizzes */}
                            {section.quizzes?.map((quiz: any, quizIndex: number) => {
                              const quizId = quiz.id || quiz._id;
                              const isCompleted = userProgress?.completedQuizzes?.includes(quizId);

                              return (
                                <button
                                  key={quizId || quizIndex}
                                  onClick={() => {
                                    if (isEnrolled && quizId) {
                                      router.push(`/${locale}/courses/${slug}/quiz/${quizId}`);
                                    }
                                  }}
                                  disabled={!isEnrolled || !quizId}
                                  className={`w-full flex items-center justify-between border rounded p-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-left ${isCompleted ? "bg-green-50/30 border-green-100" : ""
                                    }`}
                                >
                                  <div className="flex items-center gap-3">
                                    {isCompleted ? (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <FileText className="h-4 w-4 text-orange-600" />
                                    )}
                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                      {isRtl ? "اختبار" : "Quiz"}
                                    </Badge>
                                    <div>
                                      <p className="font-medium">
                                        {getTextValue(quiz.title)}
                                      </p>
                                      {quiz.isRequiredForCertificate && (
                                        <p className="text-[10px] text-red-500 font-semibold">
                                          {isRtl ? "مطلوب للشهادة" : "Required for Certificate"}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  {!isEnrolled ? (
                                    <Lock className="h-4 w-4 text-gray-400" />
                                  ) : isCompleted ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : null}
                                </button>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  {isRtl ? "التقييمات" : "Reviews"}
                </CardTitle>
                <CardDescription>
                  {isRtl
                    ? "شارك تجربتك مع هذه الدورة"
                    : "Share your experience with this course"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Review Form */}
                <CourseReviewForm
                  courseId={(currentCourse.id || currentCourse._id) as string}
                  isEnrolled={isEnrolled}
                  locale={locale as "ar" | "en"}
                  onReviewSubmitted={() => {
                    // Refresh the page to show updated reviews
                    window.location.reload();
                  }}
                />

                {/* Divider */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {isRtl ? "جميع التقييمات" : "All Reviews"}
                  </h3>
                  {/* Reviews List */}
                  <CourseReviewsList
                    courseId={(currentCourse.id || currentCourse._id) as string}
                    locale={locale as "ar" | "en"}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1 space-y-6">
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
                        {getTextValue(currentCourse.instructorId.fullName)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certificate Card */}
            {isEnrolled && certificate && (
              <Card className="border-2 border-genoun-green/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-genoun-green">
                    <Award className="h-5 w-5" />
                    {isRtl ? "شهادة الإتمام" : "Certificate of Completion"}
                  </CardTitle>
                  <CardDescription>
                    {isRtl ? "مبارك! لقد أتممت هذه الدورة" : "Congratulations! You completed this course"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {isRtl ? "رقم الشهادة:" : "Certificate #:"}
                      </span>
                      <span className="font-mono font-semibold">
                        {certificate.certificateNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {isRtl ? "تاريخ الإصدار:" : "Issue Date:"}
                      </span>
                      <span>
                        {new Date(certificate.issuedAt || certificate.createdAt).toLocaleDateString(
                          isRtl ? 'ar-EG' : 'en-US',
                          { year: 'numeric', month: 'long', day: 'numeric' }
                        )}
                      </span>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-genoun-green hover:bg-genoun-green/90"
                    onClick={handleDownloadCertificate}
                    disabled={downloadingCert}
                  >
                    {downloadingCert ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    ) : (
                      <Award className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                    )}
                    {downloadingCert
                      ? isRtl
                        ? "جاري التنزيل..."
                        : "Downloading..."
                      : isRtl
                        ? "تنزيل الشهادة"
                        : "Download Certificate"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
