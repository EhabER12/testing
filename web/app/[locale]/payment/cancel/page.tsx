"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, Home, ArrowLeft, ArrowRight, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function PaymentCancelContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || "ar";
  const isRtl = locale === "ar";

  // Get original checkout URL if available
  const returnTo = searchParams.get("returnTo") || `/${locale}/checkout`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8" dir={isRtl ? "rtl" : "ltr"}>
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-12 pb-8">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-10 w-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isRtl ? "تم إلغاء الدفع" : "Payment Cancelled"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {isRtl
              ? "تم إلغاء عملية الدفع. لم يتم خصم أي مبلغ من حسابك."
              : "Your payment has been cancelled. No amount has been charged to your account."}
          </p>

          <div className="flex flex-col gap-3">
            <Link href={returnTo}>
              <Button className="w-full" size="lg">
                <RefreshCw className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                {isRtl ? "المحاولة مرة أخرى" : "Try Again"}
              </Button>
            </Link>
            <Link href={`/${locale}`}>
              <Button variant="outline" className="w-full" size="lg">
                <Home className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                {isRtl ? "العودة للرئيسية" : "Back to Home"}
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            {isRtl
              ? "إذا كنت تواجه مشاكل في الدفع، يرجى التواصل مع الدعم"
              : "If you're having trouble with payment, please contact support"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <PaymentCancelContent />
    </Suspense>
  );
}
