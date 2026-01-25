"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, ArrowRight, ArrowLeft, Home, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axiosInstance from "@/lib/axios";
import { useTranslations } from "next-intl";

function PaymentSuccessContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || "ar";
  const isRtl = locale === "ar";
  const t = useTranslations();

  // PayPal returns token and PayerID in the URL
  const token = searchParams.get("token"); // PayPal Order ID
  const payerId = searchParams.get("PayerID");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    const capturePayment = async () => {
      if (!token) {
        setStatus("error");
        setErrorMessage(isRtl ? "رمز الدفع غير موجود" : "Payment token not found");
        return;
      }

      try {
        // Call backend to capture the PayPal order
        const response = await axiosInstance.post(`/payments/paypal/capture/${token}`);

        if (response.data?.success) {
          setStatus("success");
          setPaymentDetails(response.data?.data);
        } else {
          setStatus("error");
          setErrorMessage(response.data?.message || (isRtl ? "فشل في تأكيد الدفع" : "Failed to confirm payment"));
        }
      } catch (error: any) {
        console.error("Payment capture error:", error);
        setStatus("error");
        
        // Handle specific error cases
        if (error.response?.status === 404) {
          setErrorMessage(isRtl ? "لم يتم العثور على الدفع" : "Payment not found");
        } else if (error.response?.data?.message) {
          setErrorMessage(error.response.data.message);
        } else {
          setErrorMessage(isRtl ? "حدث خطأ أثناء تأكيد الدفع" : "An error occurred while confirming payment");
        }
      }
    };

    capturePayment();
  }, [token, isRtl]);

  // Loading State
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8" dir={isRtl ? "rtl" : "ltr"}>
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-12 pb-8">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isRtl ? "جاري تأكيد الدفع..." : "Confirming Payment..."}
            </h2>
            <p className="text-muted-foreground">
              {isRtl
                ? "يرجى الانتظار بينما نقوم بتأكيد عملية الدفع الخاصة بك"
                : "Please wait while we confirm your payment"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success State
  if (status === "success") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8" dir={isRtl ? "rtl" : "ltr"}>
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-12 pb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isRtl ? "تم الدفع بنجاح!" : "Payment Successful!"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isRtl
                ? "تم تأكيد عملية الدفع الخاصة بك بنجاح. شكراً لك!"
                : "Your payment has been confirmed successfully. Thank you!"}
            </p>

            {paymentDetails?.merchantOrderId && (
              <Alert className="bg-gray-50 border-gray-200 mb-6 text-start">
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {isRtl ? "رقم الطلب:" : "Order ID:"}
                    </p>
                    <p className="font-mono text-sm font-semibold">
                      {paymentDetails.merchantOrderId}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-3">
              <Link href={`/${locale}/account/orders`}>
                <Button className="w-full" size="lg">
                  <ShoppingBag className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                  {isRtl ? "عرض طلباتي" : "View My Orders"}
                </Button>
              </Link>
              <Link href={`/${locale}`}>
                <Button variant="outline" className="w-full" size="lg">
                  <Home className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                  {isRtl ? "العودة للرئيسية" : "Back to Home"}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error State
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8" dir={isRtl ? "rtl" : "ltr"}>
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-12 pb-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isRtl ? "فشل في تأكيد الدفع" : "Payment Confirmation Failed"}
          </h2>
          <p className="text-muted-foreground mb-4">
            {errorMessage}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            {isRtl
              ? "إذا تم خصم المبلغ من حسابك، يرجى التواصل مع الدعم"
              : "If money was deducted from your account, please contact support"}
          </p>

          <div className="flex flex-col gap-3">
            <Link href={`/${locale}/checkout`}>
              <Button className="w-full" size="lg">
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
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
