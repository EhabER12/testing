"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getCourses } from "@/store/services/courseService";
import { getCategories } from "@/store/slices/categorySlice";
import { getPublicWebsiteSettingsThunk } from "@/store/services/settingsService";
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
  Search,
} from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { PriceDisplay } from "@/components/currency/PriceDisplay";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CoursesPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const t = useTranslations();
  const locale = params.locale as string;
  const isRtl = locale === "ar";

  const { courses, isLoading } = useAppSelector((state) => state.courses);
  const { categories } = useAppSelector((state) => state.categories);
  const { publicSettings } = useAppSelector((state) => state.settings);
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAccess, setSelectedAccess] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Get courses page hero settings
  const heroSettings = publicSettings?.coursesPageHero;
  const isHeroEnabled = heroSettings?.isEnabled !== false;
  const heroBadge = heroSettings?.badge?.[isRtl ? "ar" : "en"] || (isRtl ? "دوراتنا التعليمية" : "Our Educational Courses");
  const heroTitle = heroSettings?.title?.[isRtl ? "ar" : "en"] || (isRtl ? "ابدأ رحلتك في تحفيظ القرآن الكريم" : "Start Your Quran Memorization Journey");
  const heroSubtitle = heroSettings?.subtitle?.[isRtl ? "ar" : "en"] || (isRtl ? "مع دوراتنا المتخصصة" : "With Our Specialized Courses");


  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const filters: any = { isPublished: true };
    if (debouncedSearch) filters.search = debouncedSearch;
    if (selectedCategory !== "all") filters.categoryId = selectedCategory;
    if (selectedLevel !== "all") filters.level = selectedLevel;
    if (selectedAccess !== "all") filters.accessType = selectedAccess;

    dispatch(getCourses(filters));
    dispatch(getCategories({ active: true }));
    dispatch(getPublicWebsiteSettingsThunk());
  }, [dispatch, debouncedSearch, selectedCategory, selectedLevel, selectedAccess]);

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

  // Courses are now filtered server-side
  const filteredCourses = courses;

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
      {/* Hero Section - Conditional */}
      {isHeroEnabled && (
        <div
          className="bg-gradient-to-r from-genoun-green to-green-600 text-white py-16"
          style={
            heroSettings?.backgroundImage
              ? {
                backgroundImage: `linear-gradient(rgba(26, 71, 42, 0.9), rgba(26, 71, 42, 0.9)), url(${heroSettings.backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
              : undefined
          }
        >
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              {/* Badge */}
              {heroBadge && (
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                  <BookOpen className="w-5 h-5" />
                  <span className="text-sm font-medium">{heroBadge}</span>
                </div>
              )}

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {heroTitle}
              </h1>

              {/* Subtitle */}
              <p className="text-xl text-white/90">
                {heroSubtitle}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isRtl ? "بحث بعنواين الدورات..." : "Search courses..."}
              className={isRtl ? "pr-9" : "pl-9"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder={isRtl ? "التصنيف" : "Category"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRtl ? "جميع التصنيفات" : "All Categories"}</SelectItem>
              {categories
                .filter((cat) => cat.isActive)
                .map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {getTextValue(category.name)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {/* Level Filter */}
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger>
              <SelectValue placeholder={isRtl ? "المستوى" : "Level"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRtl ? "جميع المستويات" : "All Levels"}</SelectItem>
              <SelectItem value="beginner">{isRtl ? "مبتدئ" : "Beginner"}</SelectItem>
              <SelectItem value="intermediate">{isRtl ? "متوسط" : "Intermediate"}</SelectItem>
              <SelectItem value="advanced">{isRtl ? "متقدم" : "Advanced"}</SelectItem>
            </SelectContent>
          </Select>

          {/* Access Filter */}
          <Select value={selectedAccess} onValueChange={setSelectedAccess}>
            <SelectTrigger>
              <SelectValue placeholder={isRtl ? "نوع الوصول" : "Access Type"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRtl ? "الكل" : "All Access"}</SelectItem>
              <SelectItem value="free">{isRtl ? "مجاني" : "Free"}</SelectItem>
              <SelectItem value="paid">{isRtl ? "مدفوع" : "Paid"}</SelectItem>
              <SelectItem value="byPackage">{isRtl ? "بالباقة" : "Package"}</SelectItem>
            </SelectContent>
          </Select>
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
                className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-md"
                onClick={() => handleCourseClick((course as any).slug)}
              >
                {/* Course Thumbnail */}
                <div className="relative h-56 bg-gray-200">
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
                  <div className={`absolute top-3 ${isRtl ? 'left-3' : 'right-3'}`}>
                    <Badge
                      className={
                        course.accessType === "free"
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-blue-500 hover:bg-blue-600"
                      }
                    >
                      {getAccessTypeText(course.accessType)}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  {/* Title */}
                  <CardTitle className="line-clamp-2 text-lg font-bold mb-1">
                    {getTextValue(course.title)}
                  </CardTitle>

                  {/* Description */}
                  <CardDescription className="line-clamp-2 text-sm">
                    {getTextValue(course.description)}
                  </CardDescription>

                  {/* Instructor */}
                  {course.instructorId && (
                    <p className="text-sm text-gray-700 mt-2">
                      {getTextValue(course.instructorId.fullName)}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Rating */}
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-semibold">
                        {course.stats?.averageRating?.toFixed(1) || "4.5"}
                      </span>
                    </div>
                    <span className="text-gray-500">
                      ({course.stats?.totalReviews || 0})
                    </span>
                  </div>

                  {/* Stats in one line */}
                  <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
                    {course.duration && (
                      <>
                        <span className="font-medium">{course.duration} {isRtl ? "ساعة" : "total hours"}</span>
                        <span>•</span>
                      </>
                    )}
                    <span className="font-medium">
                      {course.contentStats?.lessonsCount || 0} {isRtl ? "محاضرة" : "lectures"}
                    </span>
                    {course.level && (
                      <>
                        <span>•</span>
                        <span className="font-medium">{getLevelText(course.level)}</span>
                      </>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="pt-4 pb-4 flex items-center justify-between gap-3 sm:gap-4">
                  {/* Price */}
                  <div className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 whitespace-nowrap shrink-0 leading-none">
                    {course.accessType === "free" ? (
                      <span className="text-green-600">{isRtl ? "مجاني" : "Free"}</span>
                    ) : course.price ? (
                      <PriceDisplay
                        amount={course.price}
                        currency={course.currency as "SAR" | "EGP" | "USD"}
                        locale={isRtl ? "ar" : "en"}
                        className="whitespace-nowrap leading-none"
                      />
                    ) : (
                      <span className="text-gray-600 text-base">{isRtl ? "السعر غير محدد" : "Price not set"}</span>
                    )}
                  </div>

                  {/* Add to cart button */}
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 shadow-md hover:shadow-lg transition-all border border-purple-600 whitespace-nowrap"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCourseClick((course as any).slug);
                    }}
                  >
                    {course.accessType === "free"
                      ? isRtl
                        ? "سجل مجاناً"
                        : "Enroll Free"
                      : isRtl
                        ? "أضف للسلة"
                        : "Add to cart"}
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
