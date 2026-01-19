"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getCourse, updateCourse } from "@/store/services/courseService";
import { getCategories } from "@/store/slices/categorySlice";
import { getQuizzesByCourse } from "@/store/services/quizService";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import { isAdmin, isTeacher } from "@/store/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Get localized text helper
const getLocalizedText = (
    text: { ar: string; en: string } | string | undefined,
    locale: string
): string => {
    if (!text) return "";
    if (typeof text === "string") return text;
    return text[locale as "ar" | "en"] || text.en || text.ar || "";
};

export default function EditCoursePage() {
    const params = useParams();
    const id = params.id as string;
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { t, isRtl, locale } = useAdminLocale();
    const { categories } = useAppSelector((state) => state.categories);
    const { currentCourse, isLoading: courseLoading } = useAppSelector((state) => state.courses);
    const { quizzes } = useAppSelector((state) => state.quizzes);
    const { user } = useAppSelector((state) => state.auth);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: { ar: "", en: "" },
        description: { ar: "", en: "" },
        shortDescription: { ar: "", en: "" },
        thumbnail: "",
        categoryId: "",
        accessType: "free" as "free" | "paid" | "byPackage",
        price: "",
        duration: "",
        level: "beginner" as "beginner" | "intermediate" | "advanced",
        language: "ar",
        certificateEnabled: false,
        requiresExam: false,
        passingScore: "",
        examQuizId: "",
    });

    useEffect(() => {
        dispatch(getCategories({ active: true }));
        if (id) {
            dispatch(getCourse(id));
            dispatch(getQuizzesByCourse(id));
        }
    }, [dispatch, id]);

    useEffect(() => {
        if (currentCourse && (currentCourse.id || currentCourse._id) === id) {
            setFormData({
                title: {
                    ar: currentCourse.title?.ar || "",
                    en: currentCourse.title?.en || "",
                },
                description: {
                    ar: currentCourse.description?.ar || "",
                    en: currentCourse.description?.en || "",
                },
                shortDescription: {
                    ar: currentCourse.shortDescription?.ar || "",
                    en: currentCourse.shortDescription?.en || "",
                },
                thumbnail: currentCourse.thumbnail || "",
                categoryId: typeof currentCourse.categoryId === "object"
                    ? (currentCourse.categoryId as any).id || (currentCourse.categoryId as any)._id || ""
                    : currentCourse.categoryId || "",
                accessType: currentCourse.accessType || "free",
                price: currentCourse.price?.toString() || "",
                duration: currentCourse.duration?.toString() || "",
                level: currentCourse.level || "beginner",
                language: currentCourse.language || "ar",
                certificateEnabled: currentCourse.certificateSettings?.enabled || false,
                requiresExam: currentCourse.certificateSettings?.requiresExam || false,
                passingScore: currentCourse.certificateSettings?.passingScore?.toString() || "",
                examQuizId: currentCourse.certificateSettings?.examQuizId || "",
            });
        }
    }, [currentCourse, id]);

    // Authorization check: Teachers can only edit their own courses
    useEffect(() => {
        if (currentCourse && user) {
            // Check if teacher is trying to access someone else's course
            if (isTeacher() && !isAdmin()) {
                const courseInstructorId = typeof currentCourse.instructorId === "object"
                    ? (currentCourse.instructorId as any)._id || (currentCourse.instructorId as any).id
                    : currentCourse.instructorId;

                if (courseInstructorId !== user._id) {
                    // Not authorized - redirect to courses list
                    router.push("/dashboard/courses");
                }
            }
        }
    }, [currentCourse, user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const courseData: any = {
                title: formData.title,
                description: formData.description,
                shortDescription: formData.shortDescription,
                thumbnail: formData.thumbnail || undefined,
                accessType: formData.accessType,
                duration: formData.duration ? parseInt(formData.duration) : undefined,
                level: formData.level,
                language: formData.language,
                certificateSettings: {
                    enabled: formData.certificateEnabled,
                    requiresExam: formData.requiresExam,
                    passingScore: formData.passingScore
                        ? parseFloat(formData.passingScore)
                        : undefined,
                    examQuizId: formData.examQuizId || undefined,
                },
            };

            // Only add categoryId if it's a valid ObjectId format (24 hex chars)
            if (formData.categoryId && /^[0-9a-fA-F]{24}$/.test(formData.categoryId)) {
                courseData.categoryId = formData.categoryId;
            } else {
                courseData.categoryId = null; // Clear category if not selected
            }

            if (formData.accessType === "paid") {
                courseData.price = formData.price ? parseFloat(formData.price) : 0;
            } else {
                courseData.price = 0;
            }

            await dispatch(updateCourse({ id, data: courseData })).unwrap();
            router.push("/dashboard/courses");
        } catch (err: any) {
            setError(err || "Failed to update course");
        } finally {
            setLoading(false);
        }
    };

    if (courseLoading && !currentCourse) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <Loader2 className="h-16 w-16 animate-spin text-genoun-green" />
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
                        {isRtl ? "تعديل الدورة" : "Edit Course"}
                    </h2>
                    <p className="text-muted-foreground">
                        {isRtl ? "تعديل بيانات الدورة التعليمية" : "Modify course details"}
                    </p>
                </div>
                <Link href="/dashboard/courses">
                    <Button variant="outline">
                        <ArrowLeft className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                        {isRtl ? "رجوع" : "Back"}
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

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>{isRtl ? "المعلومات الأساسية" : "Basic Information"}</CardTitle>
                        <CardDescription>
                            {isRtl ? "تفاصيل الدورة الرئيسية" : "Main course details"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="titleAr">{isRtl ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
                                <Input
                                    id="titleAr"
                                    required
                                    value={formData.title.ar}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            title: { ...formData.title, ar: e.target.value },
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="titleEn">{isRtl ? "العنوان (إنجليزي)" : "Title (English)"}</Label>
                                <Input
                                    id="titleEn"
                                    required
                                    value={formData.title.en}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            title: { ...formData.title, en: e.target.value },
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="descAr">{isRtl ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
                                <Textarea
                                    id="descAr"
                                    required
                                    rows={4}
                                    value={formData.description.ar}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            description: { ...formData.description, ar: e.target.value },
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="descEn">{isRtl ? "الوصف (إنجليزي)" : "Description (English)"}</Label>
                                <Textarea
                                    id="descEn"
                                    required
                                    rows={4}
                                    value={formData.description.en}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            description: { ...formData.description, en: e.target.value },
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="shortDescAr">{isRtl ? "وصف مختصر (عربي)" : "Short Description (Arabic)"}</Label>
                                <Textarea
                                    id="shortDescAr"
                                    rows={2}
                                    value={formData.shortDescription.ar}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            shortDescription: { ...formData.shortDescription, ar: e.target.value },
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="shortDescEn">{isRtl ? "وصف مختصر (إنجليزي)" : "Short Description (English)"}</Label>
                                <Textarea
                                    id="shortDescEn"
                                    rows={2}
                                    value={formData.shortDescription.en}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            shortDescription: { ...formData.shortDescription, en: e.target.value },
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="thumbnail">{isRtl ? "رابط الصورة" : "Thumbnail URL"}</Label>
                                <Input
                                    id="thumbnail"
                                    type="url"
                                    placeholder="https://..."
                                    value={formData.thumbnail}
                                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="categoryId">{isRtl ? "التصنيف (اختياري)" : "Category (Optional)"}</Label>
                                <Select
                                    value={formData.categoryId}
                                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={isRtl ? "اختر التصنيف" : "Select category"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">{isRtl ? "بدون تصنيف" : "No category"}</SelectItem>
                                        {categories.map((cat: any) => (
                                            <SelectItem key={cat.id || cat._id} value={cat.id || cat._id}>
                                                {getLocalizedText(cat.name, locale)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Course Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>{isRtl ? "إعدادات الدورة" : "Course Settings"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="accessType">{isRtl ? "نوع الوصول" : "Access Type"}</Label>
                                <Select
                                    value={formData.accessType}
                                    onValueChange={(value: any) => setFormData({ ...formData, accessType: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="free">{isRtl ? "مجاني" : "Free"}</SelectItem>
                                        <SelectItem value="paid">{isRtl ? "مدفوع" : "Paid"}</SelectItem>
                                        <SelectItem value="byPackage">{isRtl ? "بالباقة" : "By Package"}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {formData.accessType === "paid" && (
                                <div className="space-y-2">
                                    <Label htmlFor="price">{isRtl ? "السعر" : "Price"}</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="level">{isRtl ? "المستوى" : "Level"}</Label>
                                <Select
                                    value={formData.level}
                                    onValueChange={(value: any) => setFormData({ ...formData, level: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="beginner">{isRtl ? "مبتدئ" : "Beginner"}</SelectItem>
                                        <SelectItem value="intermediate">{isRtl ? "متوسط" : "Intermediate"}</SelectItem>
                                        <SelectItem value="advanced">{isRtl ? "متقدم" : "Advanced"}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="duration">{isRtl ? "المدة (ساعات)" : "Duration (hours)"}</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="language">{isRtl ? "اللغة" : "Language"}</Label>
                                <Select
                                    value={formData.language}
                                    onValueChange={(value) => setFormData({ ...formData, language: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ar">{isRtl ? "عربي" : "Arabic"}</SelectItem>
                                        <SelectItem value="en">{isRtl ? "إنجليزي" : "English"}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Certificate Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>{isRtl ? "إعدادات الشهادة" : "Certificate Settings"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="certificateEnabled">
                                {isRtl ? "تفعيل الشهادة" : "Enable Certificate"}
                            </Label>
                            <Switch
                                id="certificateEnabled"
                                checked={formData.certificateEnabled}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, certificateEnabled: checked })
                                }
                            />
                        </div>

                        {formData.certificateEnabled && (
                            <>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="requiresExam">
                                        {isRtl ? "يتطلب اختبار" : "Requires Exam"}
                                    </Label>
                                    <Switch
                                        id="requiresExam"
                                        checked={formData.requiresExam}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, requiresExam: checked })
                                        }
                                    />
                                </div>

                                {formData.requiresExam && (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="passingScore">
                                                {isRtl ? "درجة النجاح (%)" : "Passing Score (%)"}
                                            </Label>
                                            <Input
                                                id="passingScore"
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={formData.passingScore}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, passingScore: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="examQuizId">
                                                {isRtl ? "اختبار الشهادة" : "Certificate Quiz"}
                                            </Label>
                                            <Select
                                                value={formData.examQuizId}
                                                onValueChange={(value) => setFormData({ ...formData, examQuizId: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={isRtl ? "اختر الاختبار" : "Select quiz"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {quizzes.map((quiz) => (
                                                        <SelectItem key={(quiz.id || quiz._id)!} value={(quiz.id || quiz._id)!}>
                                                            {getLocalizedText(quiz.title, locale)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Link href="/dashboard/courses">
                        <Button type="button" variant="outline">
                            {isRtl ? "إلغاء" : "Cancel"}
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        className="bg-genoun-green hover:bg-genoun-green/90"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isRtl ? "جاري الحفظ..." : "Saving..."}
                            </>
                        ) : (
                            <>
                                <Save className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                                {isRtl ? "حفظ التغييرات" : "Save Changes"}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
