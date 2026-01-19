"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlayCircle, Clock, CheckCircle2, Calendar, User, Package as PackageIcon } from "lucide-react";
import Image from "next/image";

interface SubscriptionsTabProps {
  initialData?: any[];
  isArabic: boolean;
  locale: string;
  type?: "courses" | "packages";
}

export function SubscriptionsTab({
  initialData = [],
  isArabic,
  locale,
  type = "courses",
}: SubscriptionsTabProps) {
  const router = useRouter();

  const getTextValue = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return (isArabic ? value.ar : value.en) || value.en || value.ar || "";
  };

  const handleCourseClick = (slug: string) => {
    router.push(`/${locale}/courses/${slug}`);
  };

  if (!initialData || initialData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          {type === "courses"
            ? isArabic
              ? "لم تسجل في أي دورات بعد"
              : "You haven't enrolled in any courses yet"
            : isArabic
            ? "ليس لديك اشتراكات نشطة في البرامج"
            : "You don't have any active program subscriptions"}
        </p>
        <Button
          onClick={() =>
            router.push(
              `/${locale}/${type === "courses" ? "courses" : "packages"}`
            )
          }
          className="bg-genoun-green hover:bg-genoun-green/90"
        >
          {type === "courses"
            ? isArabic
              ? "تصفح الدورات"
              : "Browse Courses"
            : isArabic
            ? "تصفح الباقات"
            : "Browse Packages"}
        </Button>
      </div>
    );
  }

  if (type === "packages") {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {initialData.map((sub, index) => (
          <Card key={sub._id || `sub-${index}`} className="overflow-hidden border-t-4 border-t-genoun-green">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg leading-tight">
                    {getTextValue(sub.packageId?.name)}
                  </h3>
                  <Badge
                    variant={sub.status === "active" ? "default" : "secondary"}
                    className={
                      sub.status === "active"
                        ? "bg-green-100 text-green-700 hover:bg-green-100"
                        : ""
                    }
                  >
                    {isArabic ? sub.status : sub.status}
                  </Badge>
                </div>
                <PackageIcon className="h-6 w-6 text-genoun-green opacity-20" />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>
                    {isArabic ? "الطالب: " : "Student: "}
                    {getTextValue(sub.studentName)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {isArabic ? "تاريخ التجديد: " : "Next Renewal: "}
                    {new Date(sub.nextDueDate).toLocaleDateString(
                      isArabic ? "ar-EG" : "en-US"
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  className="w-full border-genoun-green text-genoun-green hover:bg-genoun-green hover:text-white"
                  onClick={() => router.push(`/${locale}/packages`)}
                >
                  {isArabic ? "تجديد أو تغيير الباقة" : "Renew or Change Package"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {initialData.map((course, index) => (
        <Card
          key={course._id || `course-${index}`}
          className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => handleCourseClick(course.slug)}
        >
          <div className="relative aspect-video bg-gray-100">
            {course.thumbnail ? (
              <Image
                src={course.thumbnail}
                alt={getTextValue(course.title)}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <PlayCircle className="h-12 w-12 text-gray-400" />
              </div>
            )}
            {course.progress && (
              <div className="absolute top-2 right-2">
                <Badge
                  variant="secondary"
                  className="bg-white/90 text-gray-900"
                >
                  {Math.round(course.progress.percentage)}%
                </Badge>
              </div>
            )}
          </div>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold line-clamp-2">
              {getTextValue(course.title)}
            </h3>

            {/* Progress Bar */}
            {course.progress && (
              <div className="space-y-2">
                <Progress value={course.progress.percentage} className="h-2" />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {course.progress.completedLessons || 0}/
                    {course.progress.totalLessons || 0}{" "}
                    {isArabic ? "درس" : "lessons"}
                  </span>
                  {course.progress.percentage >= 100 && (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      {isArabic ? "مكتمل" : "Completed"}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Last Accessed */}
            {course.progress?.lastAccessedAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {isArabic ? "آخر دخول: " : "Last accessed: "}
                  {new Date(course.progress.lastAccessedAt).toLocaleDateString(
                    isArabic ? "ar-EG" : "en-US"
                  )}
                </span>
              </div>
            )}

            <Button
              className="w-full bg-genoun-green hover:bg-genoun-green/90"
              size="sm"
            >
              <PlayCircle
                className={`h-4 w-4 ${isArabic ? "ml-2" : "mr-2"}`}
              />
              {isArabic ? "متابعة التعلم" : "Continue Learning"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
