"use client";

import { LoginForm } from "@/components/auth/login-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "next-intl";

function LoginContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const locale = useLocale();

  return (
    <div className="flex min-h-screen flex-col">
      <div className="absolute top-4 left-4 z-10">
        <Button variant="ghost" asChild>
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          {message === "teacher_pending" && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertDescription className="text-amber-800">
                <strong>حسابك قيد المراجعة</strong>
                <br />
                تم إنشاء حسابك بنجاح كمدرس. يرجى انتظار موافقة الإدارة للوصول
                للوحة التحكم.
                <br />
                <br />
                <strong>Your account is under review</strong>
                <br />
                Your teacher account has been created successfully. Please wait
                for admin approval to access the dashboard.
              </AlertDescription>
            </Alert>
          )}

          {message === "registered" && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                <strong>تم التسجيل بنجاح!</strong> يمكنك الآن تسجيل الدخول.
                <br />
                <strong>Registration successful!</strong> You can now log in.
              </AlertDescription>
            </Alert>
          )}

          {message === "reset_success" && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                <strong>تمت إعادة تعيين كلمة المرور بنجاح!</strong> يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
                <br />
                <strong>Password reset successful!</strong> You can now log in with your new password.
              </AlertDescription>
            </Alert>
          )}

          <LoginForm />
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
