"use client";

import { LoginForm } from "@/components/auth/login-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  return (
    <div className="flex min-h-screen flex-col">
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
