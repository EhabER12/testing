"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, BookOpen, Users } from "lucide-react";
import { PublicWebsiteSettingsData } from "@/store/services/settingsService";
import axiosInstance from "@/lib/axios";

interface Course {
    _id: string;
    title: { ar: string; en: string };
    slug: string;
    description?: { ar: string; en: string };
    thumbnail?: string;
    instructorId?: {
        name?: { ar?: string; en?: string };
    };
    lessonsCount?: number;
    enrolledCount?: number;
    duration?: number;
    price?: number;
    isPublished: boolean;
}

interface HomepageCoursesProps {
    settings?: PublicWebsiteSettingsData | null;
    locale: string;
}

export function HomepageCourses({ settings, locale }: HomepageCoursesProps) {
    const isRtl = locale === "ar";
    const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    const coursesSettings = settings?.homepageCourses;

    console.log('📚 Step 1 - Settings:', {
        hasSettings: !!settings,
        coursesSettings,
        isEnabled: coursesSettings?.isEnabled
    });

    useEffect(() => {
        console.log('📚 Step 2 - useEffect triggered');

        if (!coursesSettings?.isEnabled) {
            console.warn('⚠️ Step 3 - Courses DISABLED');
            setLoading(false);
            return;
        }

        console.log('✅ Step 3 - Enabled, will fetch');

        const fetchCourses = async () => {
            try {
                const limit = coursesSettings.displayCount || 6;
                const url = `/courses?isPublished=true&limit=${limit}`;

                console.log('🔄 Step 4 - API Call:', url);

                const response = await axiosInstance.get(url);

                console.log('📥 Step 5 - Full Response:', response);
                console.log('📥 Step 5a - response.data:', response.data);

                // Try different paths
                let coursesArray = [];
                if (response.data?.data?.courses) {
                    coursesArray = response.data.data.courses;
                    console.log('✅ Path: response.data.data.courses');
                } else if (response.data?.courses) {
                    coursesArray = response.data.courses;
                    console.log('✅ Path: response.data.courses');
                } else if (response.data?.data) {
                    coursesArray = response.data.data;
                    console.log('✅ Path: response.data.data');
                } else if (Array.isArray(response.data)) {
                    coursesArray = response.data;
                    console.log('✅ Path: response.data');
                }

                console.log('✅ Step 7 - Courses found:', coursesArray.length);
                console.log('✅ Step 7a - Courses data:', coursesArray);

                setCourses(coursesArray);
            } catch (error) {
                console.error('❌ Fetch Error:', error);
            } finally {
                console.log('🏁 Step 8 - Done, loading=false');
                setLoading(false);
            }
        };

        fetchCourses();
    }, [coursesSettings?.isEnabled, coursesSettings?.displayCount]);

    // Don't render if disabled
    if (!coursesSettings?.isEnabled) {
        console.log('⚠️ Not rendering - disabled');
        return null;
    }

    console.log('🎨 Rendering:', { loading, count: courses.length });

    const title = isRtl ? coursesSettings.title.ar : coursesSettings.title.en;
    const subtitle = isRtl ? coursesSettings.subtitle.ar : coursesSettings.subtitle.en;
    const buttonText = isRtl ? coursesSettings.buttonText.ar : coursesSettings.buttonText.en;

    return (
        <section className="py-16 md:py-20 bg-white" dir={isRtl ? "rtl" : "ltr"}>
            <div className="container px-4 sm:px-6 md:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    {title && (
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-genoun-green mb-4">
                            {title}
                        </h2>
                    )}
                    {subtitle && (
                        <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Courses Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(coursesSettings.displayCount || 6)].map((_, i) => (
                            <div
                                key={`loading-skeleton-${i}`}
                                className="bg-gray-100 rounded-xl h-96 animate-pulse"
                            />
                        ))}
                    </div>
                ) : courses.length > 0 ? (
                    <div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {courses.map((course) => (
                                <Link
                                    key={course._id}
                                    href={`/${locale}/courses/${course.slug}`}
                                    className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-genoun-gold"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative aspect-video bg-gradient-to-br from-genoun-green to-genoun-green-dark">
                                        {course.thumbnail ? (
                                            <Image
                                                src={course.thumbnail}
                                                alt={isRtl ? course.title.ar : course.title.en}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <BookOpen className="w-16 h-16 text-white/30" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-5">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-genoun-green transition-colors">
                                            {isRtl ? course.title.ar : course.title.en}
                                        </h3>

                                        {course.description && (
                                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                                {isRtl ? course.description.ar : course.description.en}
                                            </p>
                                        )}

                                        {/* Stats */}
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            {course.lessonsCount && (
                                                <div className="flex items-center gap-1">
                                                    <BookOpen className="w-4 h-4" />
                                                    <span>
                                                        {course.lessonsCount}{" "}
                                                        {isRtl ? "درس" : "lessons"}
                                                    </span>
                                                </div>
                                            )}
                                            {course.enrolledCount !== undefined && (
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-4 h-4" />
                                                    <span>{course.enrolledCount}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* View All Button */}
                        {buttonText && (
                            <div className="text-center">
                                <Link
                                    href={`/${locale}/courses`}
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-genoun-green hover:bg-genoun-green-dark text-white font-bold text-lg rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl"
                                >
                                    <span>{buttonText}</span>
                                    <ArrowIcon className="w-5 h-5" />
                                </Link>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">
                            {isRtl
                                ? "لا توجد دورات متاحة حالياً"
                                : "No courses available at the moment"}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
