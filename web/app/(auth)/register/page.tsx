"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { register } from "@/store/services/authService";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, GraduationCap, User } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
    accountType: z.enum(["user", "teacher"], {
        required_error: "Please select account type",
    }),
    fullNameAr: z.string().min(2, {
        message: "Arabic name must be at least 2 characters.",
    }),
    fullNameEn: z.string().min(2, {
        message: "English name must be at least 2 characters.",
    }),
    email: z.string().min(1, "Email is required").email({
        message: "Please enter a valid email address.",
    }),
    phone: z.string().min(10, {
        message: "Please enter a valid phone number.",
    }),
    password: z.string().min(6, {
        message: "Password must be at least 6 characters.",
    }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export default function RegisterPage() {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { isLoading, isError, message, isSuccess } = useAppSelector(
        (state) => state.auth
    );

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            accountType: "user",
            fullNameAr: "",
            fullNameEn: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
        },
    });

    const accountType = form.watch("accountType");

    function onSubmit(values: z.infer<typeof formSchema>) {
        startTransition(async () => {
            try {
                await dispatch(
                    register({
                        fullName: {
                            ar: values.fullNameAr,
                            en: values.fullNameEn,
                        },
                        email: values.email,
                        phone: values.phone,
                        password: values.password,
                        confirmPassword: values.confirmPassword,
                        role: values.accountType,
                    })
                ).unwrap();

                // After successful registration
                setTimeout(() => {
                    if (values.accountType === "teacher") {
                        // Redirect to pending approval message
                        router.push("/login?message=teacher_pending");
                    } else {
                        // Redirect to home
                        router.push("/ar");
                    }
                }, 100);
            } catch (error) {
                console.error(error);
            }
        });
    }

    return (
        <div className="container flex flex-col items-center justify-center min-h-screen py-8">
            <div className="grid gap-6 rounded-lg border p-8 shadow-lg w-full max-w-2xl bg-white">
                <div className="text-center mb-4">
                    <h1 className="text-3xl font-bold text-genoun-green mb-2">
                        إنشاء حساب جديد
                    </h1>
                    <p className="text-gray-600">Create New Account</p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
                        {/* Account Type Selection */}
                        <FormField
                            control={form.control}
                            name="accountType"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel className="text-base font-semibold">
                                        نوع الحساب - Account Type *
                                    </FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="grid grid-cols-2 gap-4"
                                        >
                                            <div>
                                                <RadioGroupItem
                                                    value="user"
                                                    id="user"
                                                    className="peer sr-only"
                                                />
                                                <Label
                                                    htmlFor="user"
                                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-genoun-green [&:has([data-state=checked])]:border-genoun-green cursor-pointer"
                                                >
                                                    <User className="mb-3 h-8 w-8" />
                                                    <div className="text-center">
                                                        <div className="font-semibold">طالب - Student</div>
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            للتسجيل في الدورات
                                                        </div>
                                                    </div>
                                                </Label>
                                            </div>
                                            <div>
                                                <RadioGroupItem
                                                    value="teacher"
                                                    id="teacher"
                                                    className="peer sr-only"
                                                />
                                                <Label
                                                    htmlFor="teacher"
                                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-genoun-gold [&:has([data-state=checked])]:border-genoun-gold cursor-pointer"
                                                >
                                                    <GraduationCap className="mb-3 h-8 w-8" />
                                                    <div className="text-center">
                                                        <div className="font-semibold">مدرس - Teacher</div>
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            لإنشاء وإدارة الدورات
                                                        </div>
                                                    </div>
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {accountType === "teacher" && (
                            <Alert className="bg-amber-50 border-amber-200">
                                <AlertDescription className="text-sm text-amber-800">
                                    <strong>ملاحظة:</strong> حسابات المدرسين تحتاج موافقة الإدارة
                                    قبل الوصول للوحة التحكم.
                                    <br />
                                    <strong>Note:</strong> Teacher accounts require admin approval
                                    before accessing the dashboard.
                                </AlertDescription>
                            </Alert>
                        )}

                        {isError && message && (
                            <Alert variant="destructive">
                                <AlertDescription>{message}</AlertDescription>
                            </Alert>
                        )}

                        {isSuccess && message && (
                            <Alert className="bg-green-50 border-green-200">
                                <AlertDescription className="text-green-800">
                                    {message}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Name Fields */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="fullNameAr"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>الاسم بالعربية *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="محمد أحمد"
                                                {...field}
                                                dir="rtl"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="fullNameEn"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name in English *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Mohamed Ahmed" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Email and Phone */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>البريد الإلكتروني - Email *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="your.email@example.com"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>رقم الهاتف - Phone *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="tel"
                                                placeholder="+20 123 456 7890"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Password Fields */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>كلمة المرور - Password *</FormLabel>
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
                                        <FormLabel>تأكيد كلمة المرور - Confirm *</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-genoun-green hover:bg-genoun-green/90"
                            disabled={isLoading || isPending}
                        >
                            {isLoading || isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    جاري التسجيل...
                                </>
                            ) : (
                                <>تسجيل - Register</>
                            )}
                        </Button>
                    </form>
                </Form>

                <div className="text-center text-sm">
                    لديك حساب بالفعل؟ - Already have an account?{" "}
                    <Link
                        href="/login"
                        className="text-genoun-green hover:text-genoun-green/90 font-semibold"
                    >
                        تسجيل الدخول - Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
