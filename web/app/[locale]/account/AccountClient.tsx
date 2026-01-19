"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store"; // Check this path
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Clock, CheckCircle2 } from "lucide-react";
import { OrdersTab } from "@/components/account/OrdersTab";
import { ReviewsTab } from "@/components/account/ReviewsTab";
import { SubscriptionsTab } from "@/components/account/SubscriptionsTab";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { setPayments } from "@/store/slices/paymentSlice"; // Need to export this
import { setReviews } from "@/store/slices/reviewSlice";
import { QuizzesTab } from "../../../components/account/QuizzesTab";
import CertificatesTab from "../../../components/account/CertificatesTab";

interface AccountClientProps {
  initialOrders: any[];
  initialReviews: any[];
  initialEnrolledCourses: any[];
  initialSubscriptions: any[];
  initialQuizzes: any[];
  settings: any;
  locale: string;
}

export default function AccountClient({
  initialOrders,
  initialReviews,
  initialEnrolledCourses,
  initialSubscriptions,
  initialQuizzes,
  settings,
  locale,
}: AccountClientProps) {
  const t = useTranslations("account");
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("orders");
  const dispatch = useDispatch<AppDispatch>();
  const isArabic = locale === "ar";

  const message = searchParams.get("message");
  const isPendingApproval = message === "pending_approval" || (user?.role === "teacher" && !user?.teacherInfo?.isApproved);

  useEffect(() => {
    if (initialOrders && initialOrders.length > 0) {
      dispatch(setPayments(initialOrders));
    }
    if (initialReviews && initialReviews.length > 0) {
      dispatch(setReviews(initialReviews));
    }
  }, [initialOrders, initialReviews, dispatch]);

  useEffect(() => {
    if (!user) {
      // router.push("/login"); // Handled by server redirect ideally or client side
    }
  }, [user, router]);

  return (
    <>
      <main className="container mx-auto py-10 min-h-[80vh] px-4 md:px-6" dir={locale === "ar" ? "rtl" : "ltr"}>
        <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

        {isPendingApproval && user?.role === "teacher" && (
          <Alert className="mb-8 border-amber-200 bg-amber-50 text-amber-800">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertTitle className="font-bold">
              {isArabic ? "طلبك قيد المراجعة" : "Application Pending Approval"}
            </AlertTitle>
            <AlertDescription>
              {isArabic
                ? "حسابك كمعلم قيد المراجعة حالياً من قبل الإدارة. ستتمكن من الوصول إلى لوحة تحكم المعلم فور الموافقة على طلبك. سنقوم بإرسال بريد إلكتروني إليك بمجرد تفعيل الحساب."
                : "Your teacher account is currently being reviewed by our administration. You will gain access to the teacher dashboard once your application is approved. We will send you an email as soon as your account is activated."}
            </AlertDescription>
          </Alert>
        )}

        <Tabs
          defaultValue="orders"
          className="w-full"
          onValueChange={setActiveTab}
          dir={locale === "ar" ? "rtl" : "ltr"}
        >
          <TabsList className="grid w-full grid-cols-5 max-w-[900px] mb-8">
            <TabsTrigger value="orders">{t("tabs.orders")}</TabsTrigger>
            <TabsTrigger value="subscriptions">{isArabic ? "اشتراكاتي" : "My Subscriptions"}</TabsTrigger>
            <TabsTrigger value="quizzes">{isArabic ? "الاختبارات" : "Quizzes"}</TabsTrigger>
            <TabsTrigger value="certificates">{isArabic ? "الشهادات" : "Certificates"}</TabsTrigger>
            <TabsTrigger value="reviews">{t("tabs.reviews")}</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>{t("orders.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Pass initial data if we refactor OrdersTab, or let it fetch/hydrate */}
                <OrdersTab initialData={initialOrders} isArabic={locale === "ar"} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>{t("reviews.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Pass initial data if we refactor ReviewsTab */}
                <ReviewsTab initialData={initialReviews} isArabic={locale === "ar"} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quizzes">
            <Card>
              <CardHeader>
                <CardTitle>{isArabic ? "الاختبارات المتاحة" : "Available Quizzes"}</CardTitle>
                <CardDescription>
                  {isArabic ? "الاختبارات من الدورات التي سجلت بها" : "Quizzes from courses you've enrolled in"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuizzesTab initialData={initialQuizzes} isArabic={locale === "ar"} locale={locale} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certificates">
            <Card>
              <CardHeader>
                <CardTitle>{isArabic ? "شهاداتي" : "My Certificates"}</CardTitle>
                <CardDescription>
                  {isArabic ? "الشهادات التي حصلت عليها والدورات المؤهلة" : "Certificates you've earned and eligible courses"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CertificatesTab locale={locale} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions">
            <div className="space-y-6">
              {/* Courses Card */}
              <Card>
                <CardHeader>
                  <CardTitle>{isArabic ? "دوراتي" : "My Courses"}</CardTitle>
                  <CardDescription>
                    {isArabic
                      ? "الدورات التي سجلت بها وتقدمك فيها"
                      : "Courses you've enrolled in and your progress"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SubscriptionsTab
                    initialData={initialEnrolledCourses}
                    isArabic={locale === "ar"}
                    locale={locale}
                    type="courses"
                  />
                </CardContent>
              </Card>

              {/* Package Subscriptions Card */}
              {initialSubscriptions && initialSubscriptions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{isArabic ? "اشتراكات البرامج" : "Program Subscriptions"}</CardTitle>
                    <CardDescription>
                      {isArabic
                        ? "اشتراكاتك في برامج التحفيظ والخدمات الأخرى"
                        : "Your subscriptions to Tahfeez programs and other services"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SubscriptionsTab
                      initialData={initialSubscriptions}
                      isArabic={locale === "ar"}
                      locale={locale}
                      type="packages"
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
