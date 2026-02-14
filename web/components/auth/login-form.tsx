"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useTransition, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login } from "@/store/services/authService";
import { reset } from "@/store/slices/authSlice";
import { useTranslations } from "next-intl";

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { AlertCircle } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string(),
});

export function LoginForm() {
  const t = useTranslations("auth.login");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { isLoading, isError, message } = useAppSelector((state) => state.auth);
  const redirect = searchParams.get("redirect");
  const localePrefix = pathname?.split("/")[1] || "ar";
  const isArabic = localePrefix === "ar";
  const safeRedirect =
    redirect && redirect.startsWith("/") && !redirect.startsWith("//")
      ? redirect
      : null;
  const registerHref = safeRedirect
    ? `/${localePrefix}/register?redirect=${encodeURIComponent(safeRedirect)}`
    : `/${localePrefix}/register`;
  const localizedErrorMessage =
    isArabic &&
    message?.includes("Please verify your email before logging in")
      ? "يرجى تفعيل بريدك الإلكتروني أولاً، ثم تسجيل الدخول."
      : message;

  // Reset error state on mount to prevent hydration mismatch
  useEffect(() => {
    dispatch(reset());
  }, [dispatch]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        const result = await dispatch(login(values)).unwrap();

        // Check user role and redirect accordingly
        const userRole = result.data?.role;
        const teacherApproved = result.data?.teacherInfo?.isApproved;

        setTimeout(() => {
          if (userRole === "teacher") {
            if (teacherApproved) {
              // Approved teacher - go to dashboard
              router.push("/dashboard");
            } else {
              // Pending teacher - show pending message
              router.push(`/${localePrefix}/login?message=teacher_pending`);
            }
          } else if (userRole === "admin" || userRole === "moderator") {
            // Admin/Moderator - go to dashboard
            router.push("/dashboard");
          } else {
            // Regular user - redirect back if requested
            router.push(safeRedirect || `/${localePrefix}/account`);
          }
        }, 100);
      } catch (error) {
        console.error(error);
      }
    });
  }

  return (
    <div className="grid gap-6 rounded-lg border p-6 shadow-sm w-full max-w-md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {isError && message && (
            <Alert variant="destructive">
              <AlertDescription>{localizedErrorMessage}</AlertDescription>
            </Alert>
          )}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("email")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder="your.email@example.com"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      if (isError) dispatch(reset());
                    }}
                  />
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
                <FormLabel>{t("password")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      if (isError) dispatch(reset());
                    }}
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
                {t("submit")}...
              </>
            ) : (
              t("submit")
            )}
          </Button>
        </form>
      </Form>
      <div className="text-center text-sm">
        <Link
          href="/forgot-password"
          className="text-secondary-blue hover:text-secondary-blue/90"
        >
          {t("forgotPassword")}
        </Link>
      </div>
      <div className="text-center text-sm">
        {t("noAccount")}{" "}
        <Link
          href={registerHref}
          className="text-genoun-green hover:text-genoun-green/90 font-semibold"
        >
          {t("signUp")}
        </Link>
      </div>
    </div>
  );
}
