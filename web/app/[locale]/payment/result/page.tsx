"use client";

import { useEffect, useState, Suspense, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Home,
  ShoppingBag,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axiosInstance from "@/lib/axios";
import { useAppDispatch } from "@/store/hooks";
import { clearCart } from "@/store/slices/cartSlice";
import { markSessionConverted } from "@/store/services/cartSessionService";

function PaymentResultContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || "ar";
  const isRtl = locale === "ar";
  const dispatch = useAppDispatch();
  const handledSuccessRef = useRef(false);

  const paymentId = searchParams.get("paymentId");

  const [status, setStatus] = useState<
    "loading" | "success" | "pending" | "failed"
  >("loading");
  const [paymentData, setPaymentData] = useState<any>(null);
  const [pollCount, setPollCount] = useState(0);
  const maxPolls = 10;

  const checkPaymentStatus = useCallback(async () => {
    if (!paymentId) {
      setStatus("failed");
      return;
    }

    try {
      const response = await axiosInstance.get(
        `/payments/status/${paymentId}`
      );
      const data = response.data?.data;
      setPaymentData(data);

      if (data?.status === "success" || data?.status === "delivered") {
        if (!handledSuccessRef.current) {
          handledSuccessRef.current = true;
          dispatch(clearCart());
          markSessionConverted(data?.id).catch(() => null);
        }
        setStatus("success");
        return true;
      } else if (data?.status === "failed" || data?.status === "cancelled") {
        setStatus("failed");
        return true;
      } else {
        setStatus("pending");
        return false;
      }
    } catch (error) {
      console.error("Failed to check payment status:", error);
      setStatus("failed");
      return true;
    }
  }, [paymentId]);

  // Initial check + polling
  useEffect(() => {
    if (!paymentId) {
      setStatus("failed");
      return;
    }

    let interval: NodeJS.Timeout;

    const startPolling = async () => {
      const done = await checkPaymentStatus();
      if (done) return;

      // Poll every 3 seconds for up to maxPolls
      let count = 0;
      interval = setInterval(async () => {
        count++;
        setPollCount(count);
        const isDone = await checkPaymentStatus();
        if (isDone || count >= maxPolls) {
          clearInterval(interval);
        }
      }, 3000);
    };

    startPolling();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [paymentId, checkPaymentStatus]);

  // Loading
  if (status === "loading") {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center p-8"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-12 pb-8">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isRtl ? "جاري التحقق من الدفع..." : "Checking Payment..."}
            </h2>
            <p className="text-muted-foreground">
              {isRtl
                ? "يرجى الانتظار بينما نتحقق من حالة الدفع"
                : "Please wait while we verify your payment status"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pending (webhook hasn't arrived yet)
  if (status === "pending") {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center p-8"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-12 pb-8">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="h-10 w-10 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isRtl ? "جاري معالجة الدفع" : "Payment Processing"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isRtl
                ? "تم استلام طلب الدفع وجاري معالجته. قد يستغرق الأمر بضع دقائق."
                : "Your payment has been received and is being processed. This may take a few minutes."}
            </p>

            {paymentData?.merchantOrderId && (
              <Alert className="bg-gray-50 border-gray-200 mb-6 text-start">
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {isRtl ? "رقم الطلب:" : "Order ID:"}
                    </p>
                    <p className="font-mono text-sm font-semibold">
                      {paymentData.merchantOrderId}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  setStatus("loading");
                  setPollCount(0);
                  checkPaymentStatus();
                }}
                variant="outline"
                size="lg"
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                {isRtl ? "تحقق مرة أخرى" : "Check Again"}
              </Button>
              <Link href={`/${locale}`}>
                <Button variant="ghost" className="w-full" size="lg">
                  <Home className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                  {isRtl ? "العودة للرئيسية" : "Back to Home"}
                </Button>
              </Link>
            </div>

            <p className="text-xs text-muted-foreground mt-6">
              {isRtl
                ? "سيتم تفعيل حسابك تلقائياً بعد تأكيد الدفع"
                : "Your account will be activated automatically once payment is confirmed"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success
  if (status === "success") {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center p-8"
        dir={isRtl ? "rtl" : "ltr"}
      >
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

            {paymentData?.merchantOrderId && (
              <Alert className="bg-gray-50 border-gray-200 mb-6 text-start">
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {isRtl ? "رقم الطلب:" : "Order ID:"}
                    </p>
                    <p className="font-mono text-sm font-semibold">
                      {paymentData.merchantOrderId}
                    </p>
                    {paymentData.amount && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {isRtl ? "المبلغ:" : "Amount:"}{" "}
                        <span className="font-semibold text-gray-900">
                          {paymentData.amount} {paymentData.currency}
                        </span>
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-3">
              <Link href={`/${locale}/account/orders`}>
                <Button className="w-full" size="lg">
                  <ShoppingBag
                    className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`}
                  />
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

  // Failed
  return (
    <div
      className="min-h-screen bg-gray-50 flex items-center justify-center p-8"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-12 pb-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isRtl ? "فشل في الدفع" : "Payment Failed"}
          </h2>
          <p className="text-muted-foreground mb-4">
            {isRtl
              ? "لم تتم عملية الدفع بنجاح. يرجى المحاولة مرة أخرى."
              : "Your payment was not successful. Please try again."}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            {isRtl
              ? "إذا تم خصم المبلغ من حسابك، يرجى التواصل مع الدعم"
              : "If money was deducted from your account, please contact support"}
          </p>

          <div className="flex flex-col gap-3">
            <Link href={`/${locale}/checkout`}>
              <Button className="w-full" size="lg">
                <RefreshCw
                  className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`}
                />
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

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
