"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useTransition, useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { forgotPassword } from "@/store/services/authService";
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
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgotPassword");
  const locale = useLocale();
  const validationT = useTranslations("auth.register.validation");
  const fieldsT = useTranslations("auth.register.fields");
  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const dispatch = useAppDispatch();
  const { isLoading, isError, message } = useAppSelector((state) => state.auth);

  const formInstance = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(
      z.object({
        email: z.string().email({
          message: validationT("emailInvalid"),
        }),
      })
    ),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    dispatch(reset());
  }, [dispatch]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        await dispatch(forgotPassword({ email: values.email, lang: locale })).unwrap();
        setIsSubmitted(true);
      } catch (error) {
        console.error(error);
      }
    });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="absolute top-4 left-4 z-10">
        <Button variant="ghost" asChild>
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t("backToHome") || "Back to Home"}
          </Link>
        </Button>
      </div>
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>

          <div className="grid gap-6 rounded-lg border p-6 shadow-sm bg-card">
            {isSubmitted ? (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">
                    {t("success")}
                  </AlertDescription>
                </Alert>
                <Button variant="outline" asChild className="w-full">
                  <Link href={`/${locale}/login`}>{t("backToLogin")}</Link>
                </Button>
              </div>
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{fieldsT("email.label")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={fieldsT("email.placeholder")}
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

          <div className="text-center text-sm">
            <Link
              href={`/${locale}/login`}
              className="text-genoun-green hover:text-genoun-green/90 font-semibold"
            >
              {t("backToLogin")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
