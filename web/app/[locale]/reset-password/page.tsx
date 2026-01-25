"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useTransition, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resetPassword } from "@/store/services/authService";
import { reset } from "@/store/slices/authSlice";
import { useTranslations, useLocale } from "next-intl";

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
import { Loader2, ArrowLeft } from "lucide-react";

const formSchema = z.object({
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

function ResetPasswordContent() {
  const t = useTranslations("auth.resetPassword");
  const locale = useLocale();
  const validationT = useTranslations("auth.register.validation");
  const fieldsT = useTranslations("auth.register.fields");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const dispatch = useAppDispatch();
  const { isLoading, isError, isSuccess, message } = useAppSelector((state) => state.auth);

  const formInstance = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(
      z.object({
        password: z.string().min(6, {
          message: validationT("passwordMin"),
        }),
        confirmPassword: z.string(),
      }).refine((data) => data.password === data.confirmPassword, {
        message: validationT("passwordMismatch"),
        path: ["confirmPassword"],
      })
    ),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    dispatch(reset());
  }, [dispatch]);

  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        router.push(`/${locale}/login?message=reset_success`);
      }, 3000);
    }
  }, [isSuccess, router, locale]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!token) return;

    startTransition(async () => {
      try {
        await dispatch(resetPassword({
          token,
          password: values.password,
          confirmPassword: values.confirmPassword,
          lang: locale
        })).unwrap();
      } catch (error) {
        console.error(error);
      }
    });
  }

  if (!token) {
    return (
      <div className="w-full max-w-md space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            {t("invalidToken") || "Invalid or missing reset token. Please request a new password reset link."}
          </AlertDescription>
        </Alert>
        <Button asChild className="w-full">
          <Link href={`/${locale}/forgot-password`}>{t("requestNewLink") || "Request New Link"}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 rounded-lg border p-6 shadow-sm bg-card">
        {isSuccess ? (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              {t("success")}
            </AlertDescription>
          </Alert>
        ) : (
          <Form {...formInstance}>
            <form onSubmit={formInstance.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {isError && message && (
                <Alert variant="destructive">
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
              <FormField
                control={formInstance.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{fieldsT("password.label")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={fieldsT("password.placeholder")}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formInstance.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{fieldsT("confirmPassword.label")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={fieldsT("confirmPassword.placeholder")}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("submitting")}
                  </>
                ) : (
                  t("submit")
                )}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
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
        <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
          <ResetPasswordContent />
        </Suspense>
      </main>
    </div>
  );
}
