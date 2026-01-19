"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getCourses } from "@/store/services/courseService";
import { getCategories } from "@/store/slices/categorySlice";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  BookOpen,
  Users,
  TrendingUp,
  CheckCircle,
  Star,
} from "lucide-react";
import Image from "next/image";

export default function CoursesPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const t = useTranslations();
  const locale = params.locale as string;
  const isRtl = locale === "ar";

  const { courses, isLoading } = useAppSelector((state) => state.courses);
  const { categories } = useAppSelector((state) => state.categories);
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    dispatch(getCourses());
    dispatch(getCategories({ active: true }));
  }, [dispatch]);

  const getTextValue = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return (isRtl ? value.ar : value.en) || value.en || value.ar || "";
  };

  const getLevelText = (level: string): string => {
    const levels: Record<string, { ar: string; en: string }> = {
      beginner: { ar: "مبتدئ", en: "Beginner" },
      intermediate: { ar: "متوسط", en: "Intermediate" },
      advanced: { ar: "متقدم", en: "Advanced" },
    };
    return isRtl ? levels[level]?.ar || level : levels[level]?.en || level;
  };

  const getAccessTypeText = (accessType: string): string => {
    const types: Record<string, { ar: string; en: string }> = {
      free: { ar: "مجاني", en: "Free" },
      paid: { ar: "مدفوع", en: "Paid" },
      byPackage: { ar: "بالباقة", en: "By Package" },
    };
    return isRtl ? types[accessType]?.ar || accessType : types[accessType]?.en || accessType;
  };

  const filteredCourses = courses.filter((course) => {
    if (!course.isPublished) return false;
    if (selectedLevel !== "all" && course.level !== selectedLevel) return false;
    
    // Handle category filtering - categoryId can be a string or an object
    if (selectedCategory !== "all") {
      const courseCategoryId = typeof course.categoryId === "string" 
        ? course.categoryId 
        : (course.categoryId as any)?.id || (course.categoryId as any)?._id;
      if (courseCategoryId !== selectedCategory) return false;
    }
    
    return true;
  });

  const handleCourseClick = (slug: string | undefined) => {
    if (slug) {
      router.push(`/${locale}/courses/${slug}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-genoun-green border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={isRtl ? "rtl" : "ltr"}>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-genoun-green to-green-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {isRtl ? "دوراتنا التعليمية" : "Our Courses"}
            </h1>
            <p className="text-xl text-white/90">
              {isRtl
                ? "ابدأ رحلتك في تحفيظ القرآن الكريم مع دوراتنا المتخصصة"
                : "Start your Quran memorization journey with our specialized courses"}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-4 mb-8">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {isRtl ? "التصنيف" : "Category"}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-genoun-green min-w-[200px]"
            >
              <option value="all">{isRtl ? "جميع التصنيفات" : "All Categories"}</option>
              {categories
                .filter((cat) => cat.isActive)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {getTextValue(category.name)}
                  </option>
                ))}
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {isRtl ? "المستوى" : "Level"}
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-genoun-green min-w-[200px]"
            >
              <option value="all">{isRtl ? "جميع المستويات" : "All Levels"}</option>
              <option value="beginner">{isRtl ? "مبتدئ" : "Beginner"}</option>
              <option value="intermediate">{isRtl ? "متوسط" : "Intermediate"}</option>
              <option value="advanced">{isRtl ? "متقدم" : "Advanced"}</option>
            </select>
          </div>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">
              {isRtl ? "لا توجد دورات متاحة" : "No courses available"}
            </h3>
            <p className="text-gray-600">
              {isRtl
                ? "لا توجد دورات تطابق معايير البحث الخاصة بك"
                : "No courses match your search criteria"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card
                key={course.id || course._id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleCourseClick((course as any).slug)}
              >
                {/* Course Thumbnail */}
                <div className="relative h-48 bg-gray-200">
                  {course.thumbnail ? (
                    <Image
                      src={course.thumbnail}
                      alt={getTextValue(course.title)}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-genoun-green/20 to-green-600/20">
                      <BookOpen className="h-16 w-16 text-genoun-green" />
                    </div>
                  )}
                  {/* Access Type Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge
                      className={
                        course.accessType === "free"
                          ? "bg-green-500"
                          : "bg-blue-500"
                      }
                    >
                      {getAccessTypeText(course.accessType)}
                    </Badge>
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="line-clamp-2">
                    {getTextValue(course.title)}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {getTextValue(course.description)}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {/* Instructor */}
                    {course.instructorId && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        {getTextValue(course.instructorId.fullName)}
                      </div>
                    )}

                    {/* Duration & Level */}
                    <div className="flex items-center justify-between text-sm">
                      {course.duration && (
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          {course.duration} {isRtl ? "ساعة" : "hours"}
                        </div>
                      )}
                      {course.level && (
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-2 text-genoun-green" />
                          <span className="text-gray-700">
                            {getLevelText(course.level)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center text-sm text-gray-600">
                        <BookOpen className="h-4 w-4 mr-2" />
                        {course.contentStats?.lessonsCount || 0}{" "}
                        {isRtl ? "درس" : "lessons"}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        {course.stats?.enrolledCount || 0}{" "}
                        {isRtl ? "طالب" : "students"}
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full bg-genoun-green hover:bg-genoun-green/90"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCourseClick((course as any).slug);
                    }}
                  >
                    {course.accessType === "free"
                      ? isRtl
                        ? "سجل مجاناً"
                        : "Enroll Free"
                      : course.price
                      ? `${course.price} ${isRtl ? (course.currency === 'EGP' ? 'ج.م' : course.currency) : course.currency}`
                      : isRtl
                      ? "عرض التفاصيل"
                      : "View Details"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
