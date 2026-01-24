"use client";

import { RegisterForm } from "@/components/auth/register-form";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function RegisterPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'ar';
  const isRtl = locale === 'ar';
  const t = useTranslations("auth.register");

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-genoun-green/10 to-green-50 p-4"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("title")}
          </h1>
          <p className="mt-2 text-gray-600">
            {t("subtitle")}
          </p>
        </div>
        <RegisterForm locale={locale} />
      </div>
    </div>
  );
}
