"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Loader2,
    CreditCard as CreditCardIcon,
    Banknote,
    Upload,
    Image as ImageIcon,
    User,
    GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    getManualPaymentMethodsThunk,
} from "@/store/services/settingsService";
import {
    getPaymentMethodsThunk,
} from "@/store/services/paymentMethodService";
import {
    createCustomerManualPaymentThunk,
    createPaypalPaymentThunk,
    createCashierPaymentThunk
} from "@/store/services/paymentService";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { countries } from "@/constants/countries";
import { useAuth } from "@/components/auth/auth-provider";
import { getCourseBySlug } from "@/store/services/courseService";
import axiosInstance from "@/lib/axios";

// Get localized text helper
const getLocalizedText = (
    text: { ar: string; en: string } | string | undefined,
    locale: string
): string => {
    if (!text) return "";
    if (typeof text === "string") return text;
    return text[locale as "ar" | "en"] || text.en || text.ar || "";
};

export default function CourseCheckoutPage() {
    const params = useParams();
    const router = useRouter();
    const locale = (params?.locale as string) || "ar";
    const slug = params?.slug as string;
    const isRtl = locale === "ar";
    const t = useTranslations();

    const dispatch = useAppDispatch();
    const { manualPaymentMethods } = useAppSelector((state) => state.settings);
    const { user } = useAppSelector((state) => state.auth);
    const { currentCourse, isLoading: courseLoading } = useAppSelector(
        (state) => state.courses
    );
    const { userData } = useAuth();

    // Determine if user is logged in
    const isLoggedIn = !!user?.token;

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        notes: "",
        address: "",
        city: "",
        country: "",
    });
    const [selectedMethodId, setSelectedMethodId] = useState<string>("");
    const [paymentProof, setPaymentProof] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

    // Fetch course data
    useEffect(() => {
        if (slug) {
            dispatch(getCourseBySlug(slug));
        }
    }, [dispatch, slug]);

    // Initialize payment methods
    useEffect(() => {
        dispatch(getManualPaymentMethodsThunk());
        // Fetch both active payment methods (PayPal, Cashier)
        dispatch(getPaymentMethodsThunk({ includeInactive: false }))
            .unwrap()
            .then(setPaymentMethods)
            .catch((err) => {
                console.error("Failed to load payment methods:", err);
                setPaymentMethods([]);
            });
        // Fetch exchange rates from public settings
        axiosInstance.get("/settings/public").then((res) => {
            const rates = res.data?.data?.financeSettings?.exchangeRates;
            if (rates) setExchangeRates(rates);
        }).catch(() => {});
    }, [dispatch]);

    // Pre-fill form with user data when logged in
    useEffect(() => {
        if (userData && isLoggedIn) {
            setFormData((prev) => ({
                ...prev,
                name: userData.name || prev.name,
                email: userData.email || prev.email,
            }));
        }
    }, [userData, isLoggedIn]);

    // Redirect if not logged in
    useEffect(() => {
        if (!isLoggedIn && !courseLoading) {
            router.push(`/${locale}/login?redirect=/checkout/${slug}`);
        }
    }, [isLoggedIn, courseLoading, locale, slug, router]);

    // Redirect if course is free
    useEffect(() => {
        if (currentCourse && currentCourse.accessType === "free") {
            toast.error(
                isRtl
                    ? "هذه الدورة مجانية، لا تحتاج للدفع"
                    : "This course is free, no payment required"
            );
            router.push(`/${locale}/courses/${slug}`);
        }
    }, [currentCourse, isRtl, locale, slug, router]);

    // Handle form change
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPaymentProof(e.target.files[0]);
        }
    };

    // Helper function to compress images for mobile
    const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();

            img.onload = () => {
                const maxWidth = 1200;
                const maxHeight = 1200;

                let { width, height } = img;

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                canvas.width = width;
                canvas.height = height;
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(new File([blob], file.name, { type: "image/jpeg" }));
                        } else {
                            reject(new Error("Compression failed"));
                        }
                    },
                    "image/jpeg",
                    0.8
                );
            };

            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    };

    // Handle checkout submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            toast.error(t("checkout.name") + " is required");
            return;
        }
        if (!formData.email.trim()) {
            toast.error(t("checkout.email") + " is required");
            return;
        }
        if (!formData.phone.trim()) {
            toast.error(t("checkout.phone") + " is required");
            return;
        }
        if (!selectedMethodId) {
            toast.error(t("checkout.paymentMethod") + " is required");
            return;
        }

        const selectedMethod = manualPaymentMethods.find(
            (m) => m._id === selectedMethodId
        );
        // Only check for manual methods
        if (selectedMethodId !== "paypal" && selectedMethodId !== "cashier" && selectedMethod?.requiresAttachment && !paymentProof) {
            toast.error(t("admin.payments.paymentProof") + " is required");
            return;
        }

        setSubmitting(true);

        try {
            // Get courseId - use id or _id
            const courseId = (currentCourse?.id || currentCourse?._id) as string;

            // Validate courseId exists
            if (!courseId) {
                toast.error(isRtl ? "خطأ: معرف الدورة غير موجود" : "Error: Course ID not found");
                return;
            }

            // 1. PayPal
            if (selectedMethodId === "paypal") {
                const response = await dispatch(createPaypalPaymentThunk({
                    amount: currentCourse?.price || 0,
                    currency: currentCourse?.currency || "EGP", // Use course currency instead of hardcoded USD
                    courseId,
                    locale,
                    billingInfo: {
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                    },
                })).unwrap();

                if (response.approvalUrl) {
                    window.location.href = response.approvalUrl;
                    return;
                } else if ((response as any).links) { // Fallback if structure differs
                    const link = (response as any).links.find((l: any) => l.rel === 'approve');
                    if (link) {
                        window.location.href = link.href;
                        return;
                    }
                }
            }
            // 2. Kashier (Payment Sessions API v3)
            else if (selectedMethodId === "cashier") {
                const response = await dispatch(createCashierPaymentThunk({
                    amount: currentCourse?.price || 0,
                    currency: currentCourse?.currency || "EGP",
                    courseId,
                    customer: {
                        name: formData.name,
                        email: formData.email
                    }
                })).unwrap();

                // Redirect to Kashier payment session URL
                if (response.checkoutUrl) {
                    window.location.href = response.checkoutUrl;
                    return;
                } else {
                    throw new Error(isRtl ? "فشل في إنشاء جلسة الدفع" : "Failed to create payment session");
                }
            }
            // 3. Manual
            else {
                // Compress image if it's too large (> 2MB)
                let processedProof = paymentProof;
                if (paymentProof && paymentProof.size > 2 * 1024 * 1024) {
                    toast.loading(isRtl ? "جاري ضغط الصورة..." : "Compressing image...", {
                        id: "compress",
                    });
                    try {
                        processedProof = await compressImage(paymentProof);
                        toast.dismiss("compress");
                    } catch (compressError) {
                        toast.dismiss("compress");
                        console.warn("Image compression failed, using original", compressError);
                    }
                }

                const paymentData = {
                    // Pass courseId explicitly
                    courseId: courseId,
                    // Don't send productId and serviceId at all if they're undefined
                    pricingTierId: "course_enrollment",
                    manualPaymentMethodId: selectedMethodId,
                    paymentProof: processedProof || undefined,
                    billingInfo: {
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        address: formData.address || "",
                        city: formData.city || "",
                        country: formData.country,
                        amount: currentCourse?.price || 0,
                        items: [
                            {
                                productId: courseId,
                                name: getLocalizedText(currentCourse?.title, "en"),
                                price: currentCourse?.price || 0,
                                quantity: 1,
                            },
                        ],
                    },
                    amount: currentCourse?.price || 0,
                    currency: "EGP",
                    // Add course-specific metadata
                    metadata: {
                        type: "course",
                        courseId: courseId,
                        courseSlug: slug,
                        courseName: getLocalizedText(currentCourse?.title, locale),
                    },
                } as any;

                await dispatch(createCustomerManualPaymentThunk(paymentData)).unwrap();

                setOrderSuccess(true);
                toast.success(
                    isRtl
                        ? "تم إرسال طلب الدفع بنجاح! ستتم مراجعته قريباً."
                        : "Payment request submitted successfully! It will be reviewed soon."
                );
            }
        } catch (err: any) {
            let errorMessage = isRtl
                ? "فشل في إرسال طلب الدفع"
                : "Failed to submit payment request";

            if (typeof err === "string") {
                errorMessage = err;
            } else if (err.message) {
                if (
                    err.message.includes("Network Error") ||
                    err.message.includes("ECONNABORTED")
                ) {
                    errorMessage = isRtl
                        ? "خطأ في الاتصال. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى."
                        : "Connection error. Please check your internet and try again.";
                } else if (err.message.includes("timeout")) {
                    errorMessage = isRtl
                        ? "انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى."
                        : "Request timed out. Please try again.";
                } else {
                    errorMessage = err.message;
                }
            }

            toast.error(errorMessage);
            console.error("Checkout error:", err);
            if (selectedMethodId === "paypal" || selectedMethodId === "cashier") {
                setSubmitting(false);
            } else {
                setSubmitting(false);
            }
        } finally {
            if (selectedMethodId !== "paypal" && selectedMethodId !== "cashier") {
                setSubmitting(false);
            }
        }
    };

    // Loading state
    if (courseLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-genoun-green border-t-transparent"></div>
            </div>
        );
    }

    // Course not found
    if (!currentCourse) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
                <Card className="max-w-md w-full text-center">
                    <CardContent className="pt-12 pb-8">
                        <GraduationCap className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {isRtl ? "الدورة غير موجودة" : "Course not found"}
                        </h2>
                        <p className="text-muted-foreground mb-6">
                            {isRtl
                                ? "عذراً، لم نتمكن من العثور على هذه الدورة"
                                : "Sorry, we couldn't find this course"}
                        </p>
                        <Link href={`/${locale}/courses`}>
                            <Button size="lg">{isRtl ? "تصفح الدورات" : "Browse Courses"}</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Success state
    if (orderSuccess) {
        return (
            <div
                className="min-h-screen bg-gray-50 flex items-center justify-center p-8"
                dir={isRtl ? "rtl" : "ltr"}
            >
                <Card className="max-w-md w-full text-center">
                    <CardContent className="pt-12 pb-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {isRtl ? "تم إرسال الطلب بنجاح" : "Request Submitted Successfully"}
                        </h2>
                        <p className="text-muted-foreground mb-2">
                            {isRtl
                                ? "تم إرسال طلب الدفع للمراجعة"
                                : "Your payment request has been submitted for review"}
                        </p>
                        <p className="text-sm text-muted-foreground/80 mb-6">
                            {isRtl
                                ? "سيتم إشعارك بمجرد الموافقة على الدفع وستتمكن من الوصول إلى الدورة"
                                : "You will be notified once payment is approved and you'll get access to the course"}
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Link href={`/${locale}/courses/${slug}`}>
                                <Button variant="outline">{isRtl ? "العودة للدورة" : "Back to Course"}</Button>
                            </Link>
                            <Link href={`/${locale}`}>
                                <Button size="lg">{isRtl ? "العودة للرئيسية" : "Back to Home"}</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50" dir={isRtl ? "rtl" : "ltr"}>
            {/* Header */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href={`/${locale}/courses/${slug}`}>
                            <Button variant="ghost" size="icon">
                                {isRtl ? (
                                    <ArrowRight className="h-5 w-5" />
                                ) : (
                                    <ArrowLeft className="h-5 w-5" />
                                )}
                            </Button>
                        </Link>
                        <h1 className="text-2xl font-bold">
                            {isRtl ? "إتمام عملية الدفع" : "Complete Payment"}
                        </h1>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left: Form */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Contact Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t("checkout.contactInfo")}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">{t("checkout.name")}</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">{t("checkout.email")}</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            readOnly={isLoggedIn}
                                            className={
                                                isLoggedIn ? "bg-muted cursor-not-allowed" : ""
                                            }
                                        />
                                        {isLoggedIn && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {t("checkout.loggedInAs")} {userData?.email}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">{t("checkout.phone")}</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="city">{t("checkout.city")}</Label>
                                            <Input
                                                id="city"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="country">{t("checkout.country")}</Label>
                                            <select
                                                id="country"
                                                name="country"
                                                value={formData.country}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        country: e.target.value,
                                                    }))
                                                }
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                required
                                            >
                                                <option value="" disabled>
                                                    {t("checkout.country")}
                                                </option>
                                                {countries.map((c) => (
                                                    <option key={c.code} value={c.name}>
                                                        {c.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="notes">{t("checkout.notes")}</Label>
                                        <Textarea
                                            id="notes"
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleChange}
                                            placeholder={t("checkout.notesPlaceholder")}
                                            rows={3}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Payment Method */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t("checkout.paymentMethod")}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <RadioGroup
                                        value={selectedMethodId}
                                        onValueChange={setSelectedMethodId}
                                        className="space-y-3"
                                    >
                                        {/* PayPal Option */}
                                        {paymentMethods.find((m) => m.provider === "paypal" && m.isActive) && (
                                            <div
                                                className={`rounded-xl border-2 transition-all overflow-hidden ${selectedMethodId === "paypal"
                                                    ? "border-primary bg-primary/5"
                                                    : "border-gray-200 hover:border-primary/50"
                                                    }`}
                                                dir={isRtl ? "rtl" : "ltr"}
                                            >
                                                <label className="flex items-center gap-4 p-4 cursor-pointer">
                                                    <RadioGroupItem value="paypal" id="paypal" />
                                                    <Banknote className="h-6 w-6 text-blue-600" />
                                                    <div>
                                                        <p className="font-medium">PayPal</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {isRtl ? "الدفع الآمن عبر باي بال" : "Secure payment via PayPal"}
                                                        </p>
                                                    </div>
                                                </label>
                                                {selectedMethodId === "paypal" && currentCourse?.currency && currentCourse.currency !== "USD" && (
                                                    <div className="px-4 pb-3">
                                                        <div className="text-sm bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-lg p-3 flex items-center gap-2">
                                                            <span className="text-base">💱</span>
                                                            <span>
                                                                {(() => {
                                                                    const price = currentCourse?.price || 0;
                                                                    const curr = currentCourse?.currency || "EGP";
                                                                    const rate = exchangeRates[curr] || 0;
                                                                    const usdAmount = rate > 0 ? (price / rate).toFixed(2) : "...";
                                                                    return isRtl
                                                                        ? `سيتم تحويل ${price} ${curr} إلى $${usdAmount} USD عبر PayPal`
                                                                        : `${price} ${curr} will be converted to $${usdAmount} USD via PayPal`;
                                                                })()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Cashier Option */}
                                        {paymentMethods.find((m) => m.provider === "cashier" && m.isActive) && (
                                            <div
                                                className={`rounded-xl border-2 transition-all overflow-hidden ${selectedMethodId === "cashier"
                                                    ? "border-primary bg-primary/5"
                                                    : "border-gray-200 hover:border-primary/50"
                                                    }`}
                                                dir={isRtl ? "rtl" : "ltr"}
                                            >
                                                <label className="flex items-center gap-4 p-4 cursor-pointer">
                                                    <RadioGroupItem value="cashier" id="cashier" />
                                                    <CreditCardIcon className="h-6 w-6 text-purple-600" />
                                                    <div>
                                                        <p className="font-medium">{isRtl ? "بطاقة ائتمان / ميزة" : "Credit Card / Meeza"}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {isRtl ? "الدفع السريع بالبطاقات" : "Fast payment via Cards/Wallets"}
                                                        </p>
                                                    </div>
                                                </label>
                                            </div>
                                        )}

                                        {manualPaymentMethods && manualPaymentMethods.length > 0 ? (
                                            manualPaymentMethods
                                                .filter((m) => m.isEnabled)
                                                .map((method) => (
                                                    <div
                                                        key={method._id}
                                                        className={`rounded-xl border-2 transition-all overflow-hidden ${selectedMethodId === method._id
                                                            ? "border-primary bg-primary/5"
                                                            : "border-gray-200 hover:border-primary/50"
                                                            }`}
                                                        dir={isRtl ? "rtl" : "ltr"}
                                                    >
                                                        <label className="flex items-center gap-4 p-4 cursor-pointer">
                                                            <RadioGroupItem
                                                                value={method._id}
                                                                id={method._id}
                                                            />
                                                            {method.imageUrl ? (
                                                                <img
                                                                    src={method.imageUrl}
                                                                    alt={getLocalizedText(method.title, locale)}
                                                                    className="w-10 h-10 object-contain"
                                                                />
                                                            ) : (
                                                                <CreditCardIcon className="h-6 w-6 text-muted-foreground" />
                                                            )}
                                                            <div>
                                                                <p className="font-medium">
                                                                    {getLocalizedText(method.title, locale)}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {getLocalizedText(method.description, locale)}
                                                                </p>
                                                            </div>
                                                        </label>

                                                        {selectedMethodId === method._id && (
                                                            <div
                                                                className={`px-4 pb-4 space-y-4 ${isRtl ? "pr-12" : "pl-12"
                                                                    }`}
                                                            >
                                                                {method.instructions && (
                                                                    <div className="bg-white p-3 rounded border text-sm text-gray-600 whitespace-pre-wrap">
                                                                        {getLocalizedText(
                                                                            method.instructions,
                                                                            locale
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {method.requiresAttachment && (
                                                                    <div className="space-y-2">
                                                                        <Label
                                                                            htmlFor="proof"
                                                                            className="text-sm font-medium"
                                                                        >
                                                                            {t("admin.payments.uploadProof")}{" "}
                                                                            <span className="text-red-500">*</span>
                                                                        </Label>
                                                                        <div className="flex gap-2">
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() =>
                                                                                    document
                                                                                        .getElementById("proof")
                                                                                        ?.click()
                                                                                }
                                                                            >
                                                                                <Upload
                                                                                    className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"
                                                                                        }`}
                                                                                />
                                                                                {t("admin.payments.chooseFile")}
                                                                            </Button>
                                                                            <Input
                                                                                id="proof"
                                                                                type="file"
                                                                                accept="image/*"
                                                                                className="hidden"
                                                                                onChange={handleFileChange}
                                                                            />
                                                                            {paymentProof && (
                                                                                <div className="flex items-center gap-2 text-sm text-green-600">
                                                                                    <ImageIcon className="h-4 w-4" />
                                                                                    {paymentProof.name}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                        ) : (
                                            <p className="text-muted-foreground text-center py-4">
                                                {t("checkout.noPaymentMethods")}
                                            </p>
                                        )}
                                    </RadioGroup>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right: Course Summary */}
                        <div>
                            <Card className="sticky top-24">
                                <CardHeader>
                                    <CardTitle>
                                        {isRtl ? "ملخص الدورة" : "Course Summary"}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Course Info */}
                                    <div className="space-y-3">
                                        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                                            {currentCourse.thumbnail ? (
                                                <img
                                                    src={currentCourse.thumbnail}
                                                    alt={getLocalizedText(currentCourse.title, locale)}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <GraduationCap className="h-12 w-12 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">
                                                {getLocalizedText(currentCourse.title, locale)}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {getLocalizedText(
                                                    currentCourse.shortDescription,
                                                    locale
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Price */}
                                    <div className="flex items-center justify-between text-lg font-semibold">
                                        <span>{isRtl ? "السعر" : "Price"}</span>
                                        <span className="text-primary">
                                            {currentCourse.price} {isRtl ? "ج.م" : "EGP"}
                                        </span>
                                    </div>

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        className="w-full bg-genoun-green hover:bg-genoun-green/90"
                                        size="lg"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                {isRtl ? "جاري المعالجة..." : "Processing..."}
                                            </>
                                        ) : (
                                            <>
                                                {isRtl ? "إرسال طلب الدفع" : "Submit Payment Request"}
                                            </>
                                        )}
                                    </Button>

                                    <p className="text-xs text-muted-foreground text-center">
                                        {isRtl
                                            ? "سيتم مراجعة طلب الدفع وستتمكن من الوصول للدورة بعد الموافقة"
                                            : "Your payment will be reviewed and you'll get access after approval"}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
