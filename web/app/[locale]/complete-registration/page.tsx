"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

interface CompleteRegistrationPageProps {
    params: Promise<{
        locale: string;
    }>;
}

export default async function CompleteRegistrationPage({ params }: CompleteRegistrationPageProps) {
    const { locale } = await params;
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const router = useRouter();
    const isRtl = locale === "ar";

    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            password: "",
            confirmPassword: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!token) {
            setError(isRtl ? "رمز الدعوة مفقود" : "Invitation token is missing");
            return;
        }

        try {
            setError("");
            await axios.post("/auth/complete-registration", {
                token,
                name: values.name,
                password: values.password,
            });
            setIsSuccess(true);
            setTimeout(() => {
                router.push(`/${locale}/login`);
            }, 3000);
        } catch (err: any) {
            setError(err?.response?.data?.message || (isRtl ? "فشل إكمال التسجيل" : "Failed to complete registration"));
        }
    }

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir={isRtl ? "rtl" : "ltr"}>
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{isRtl ? "خطأ" : "Error"}</AlertTitle>
                    <AlertDescription>
                        {isRtl ? "رابط غير صالح. رمز الدعوة مفقود." : "Invalid link. Invitation token missing."}
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-genoun-green/5 to-green-50 p-4" dir={isRtl ? "rtl" : "ltr"}>
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-gray-100">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-genoun-green">
                        {isRtl ? "إكمال التسجيل" : "Complete Registration"}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {isRtl
                            ? "قم بتعيين كلمة المرور الخاصة بك لتفعيل حسابك"
                            : "Set your password to activate your account"}
                    </p>
                </div>

                {isSuccess ? (
                    <div className="text-center space-y-4 py-8">
                        <div className="flex justify-center">
                            <div className="rounded-full bg-green-100 p-3">
                                <CheckCircle className="h-10 w-10 text-green-600" />
                            </div>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            {isRtl ? "تم التسجيل بنجاح!" : "Registration Completed!"}
                        </h2>
                        <p className="text-gray-500">
                            {isRtl ? "جاري توجيهك لصفحة الدخول..." : "Redirecting to login..."}
                        </p>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{isRtl ? "الاسم" : "Name"}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={isRtl ? "اسمك الكامل" : "Full Name"} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{isRtl ? "كلمة المرور" : "Password"}</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{isRtl ? "تأكيد كلمة المرور" : "Confirm Password"}</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full bg-genoun-green hover:bg-genoun-green/90 text-white font-semibold py-2 rounded-lg transition-all"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {isRtl ? "جاري الحفظ..." : "Saving..."}
                                    </>
                                ) : (
                                    isRtl ? "تفعيل الحساب" : "Activate Account"
                                )}
                            </Button>
                        </form>
                    </Form>
                )}
            </div>
        </div>
    );
}
