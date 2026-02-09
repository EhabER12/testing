"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "@/lib/axios";
import Link from "next/link";

interface VerifyEmailPageProps {
    params: Promise<{
        locale: string;
    }>;
}

export default async function VerifyEmailPage({ params }: VerifyEmailPageProps) {
    const { locale } = await params;
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const router = useRouter();
    const isRtl = locale === "ar";

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage(isRtl ? "رمز التفعيل مفقود" : "Verification token missing");
            return;
        }

        const verify = async () => {
            try {
                await axios.post("/auth/verify-email", { token });
                setStatus("success");
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    // router.push(`/${locale}/login`); // Assuming login page or modal? 
                    // If uses modal, maybe redirect to home?
                    // I'll just provide a button.
                }, 3000);
            } catch (error: any) {
                setStatus("error");
                setMessage(error.response?.data?.message || (isRtl ? "فشل التفعيل" : "Verification failed"));
            }
        };

        verify();
    }, [token, isRtl]);

    return (
        <div
            className="flex min-h-screen items-center justify-center bg-gray-50 p-4"
            dir={isRtl ? "rtl" : "ltr"}
        >
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
                <div className="flex flex-col items-center text-center space-y-4">
                    {status === "loading" && (
                        <>
                            <div className="rounded-full bg-blue-50 p-4">
                                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {isRtl ? "جاري تفعيل الحساب..." : "Verifying your account..."}
                            </h1>
                            <p className="text-gray-500">
                                {isRtl
                                    ? "يرجى الانتظار لحظة بينما نتحقق من بريدك الإلكتروني."
                                    : "Please wait a moment while we verify your email."}
                            </p>
                        </>
                    )}

                    {status === "success" && (
                        <>
                            <div className="rounded-full bg-green-50 p-4">
                                <CheckCircle className="h-10 w-10 text-green-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {isRtl ? "تم تفعيل الحساب بنجاح!" : "Account Verified!"}
                            </h1>
                            <p className="text-gray-500">
                                {isRtl
                                    ? "تم تأكيد بريدك الإلكتروني. يمكنك الآن تسجيل الدخول."
                                    : "Your email has been verified. You can now login."}
                            </p>
                            <div className="pt-4 w-full">
                                <Button
                                    className="w-full bg-genoun-green hover:bg-genoun-green/90"
                                    onClick={() => router.push(`/${locale}`)} // Redirect to home, assuming login modal is there
                                >
                                    {isRtl ? "الذهاب للصفحة الرئيسية" : "Go to Homepage"}
                                </Button>
                            </div>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <div className="rounded-full bg-red-50 p-4">
                                <XCircle className="h-10 w-10 text-red-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {isRtl ? "فشل التفعيل" : "Verification Failed"}
                            </h1>
                            <p className="text-red-500 font-medium">
                                {message}
                            </p>
                            <div className="pt-4 w-full">
                                <Link href={`/${locale}`} className="w-full">
                                    <Button variant="outline" className="w-full">
                                        {isRtl ? "العودة للصفحة الرئيسية" : "Back to Homepage"}
                                    </Button>
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
