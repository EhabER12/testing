"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  CreditCard,
  Upload,
  Image as ImageIcon,
  User as UserIcon,
  ShieldCheck,
  AlertCircle,
  TicketPercent,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getPackage, Package } from "@/store/services/packageService";
import { 
  getManualPaymentMethodsThunk, 
  ManualPaymentMethod 
} from "@/store/services/settingsService";
import { createCustomerManualPaymentThunk } from "@/store/services/paymentService";
import {
  validateCouponThunk,
  type ValidateCouponResponse,
} from "@/store/services/couponService";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

export default function PackageCheckoutPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const pkgId = params?.id as string;
  const isRtl = locale === "ar";
  const t = useTranslations();
  const dispatch = useAppDispatch();

  const { currentPackage: selectedPackage, isLoading: pkgLoading } = useAppSelector((state) => state.packages);
  const { manualPaymentMethods } = useAppSelector((state) => state.settings);
  const { user } = useAppSelector((state) => state.auth);

  const isLoggedIn = !!user?.token;
  const packageCheckoutPath =
    pkgId && pkgId !== "undefined"
      ? `/${locale}/packages/checkout/${pkgId}`
      : `/${locale}/packages`;
  const loginHref = `/${locale}/login?redirect=${encodeURIComponent(
    packageCheckoutPath
  )}`;
  const registerHref = `/${locale}/register?redirect=${encodeURIComponent(
    packageCheckoutPath
  )}`;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<ValidateCouponResponse | null>(null);

  const packageBaseAmount = Number(selectedPackage?.price || 0);
  const packageCurrency = (selectedPackage?.currency || "EGP") as "EGP" | "SAR" | "USD";
  const packageDiscountAmount = Number(appliedCoupon?.discountAmount || 0);
  const packageFinalAmount = Number(
    Math.max(packageBaseAmount - packageDiscountAmount, 0).toFixed(2)
  );

  useEffect(() => {
    if (pkgId && pkgId !== "undefined") {
      dispatch(getPackage(pkgId));
    }
    dispatch(getManualPaymentMethodsThunk());
  }, [dispatch, pkgId]);

  useEffect(() => {
    if (user && isLoggedIn) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: (user as any).phone || prev.phone,
      }));
    }
  }, [user, isLoggedIn]);

  useEffect(() => {
    if (!appliedCoupon) return;
    if (packageBaseAmount <= 0) {
      setAppliedCoupon(null);
      return;
    }
    if (appliedCoupon.currency !== packageCurrency) {
      setAppliedCoupon(null);
      return;
    }
    if (Math.abs(Number(appliedCoupon.originalAmount) - packageBaseAmount) > 0.01) {
      setAppliedCoupon(null);
    }
  }, [appliedCoupon, packageBaseAmount, packageCurrency]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
  };

  const handleApplyCoupon = async () => {
    const code = couponCodeInput.trim();
    if (!code) {
      toast.error(isRtl ? "أدخل كود الكوبون" : "Enter a coupon code");
      return;
    }
    if (!isLoggedIn) {
      toast.error(
        isRtl
          ? "سجل دخولك أولاً لاستخدام الكوبون"
          : "Please login first to use a coupon"
      );
      return;
    }
    if (!selectedPackage || packageBaseAmount <= 0) {
      toast.error(isRtl ? "لا يمكن تطبيق الكوبون الآن" : "Cannot apply coupon right now");
      return;
    }

    try {
      setCouponApplying(true);
      const result = await dispatch(
        validateCouponThunk({
          code,
          amount: packageBaseAmount,
          currency: packageCurrency,
          context: "package",
        })
      ).unwrap();
      setAppliedCoupon(result);
      setCouponCodeInput(result.code);
      toast.success(
        isRtl
          ? `تم تطبيق الكوبون (-${result.discountAmount} ${result.currency})`
          : `Coupon applied (-${result.discountAmount} ${result.currency})`
      );
    } catch (error: any) {
      setAppliedCoupon(null);
      toast.error(error || (isRtl ? "كوبون غير صالح" : "Invalid coupon"));
    } finally {
      setCouponApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn) {
      toast.error(
        isRtl
          ? "يرجى تسجيل الدخول أو إنشاء حساب قبل تأكيد الاشتراك"
          : "Please login or create an account before confirming the subscription"
      );
      return;
    }

    if (!selectedPackage) return;

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error(isRtl ? "يرجى إكمال البيانات الشخصية" : "Please complete contact info");
      return;
    }

    if (!selectedMethodId) {
      toast.error(isRtl ? "Please select payment method" : "Please select payment method");
      return;
    }

    if (couponCodeInput.trim() && !appliedCoupon) {
      toast.error(
        isRtl
          ? "Please apply the coupon before confirming subscription"
          : "Please apply the coupon before confirming subscription"
      );
      return;
    }

    const selectedMethod = manualPaymentMethods.find(m => m._id === selectedMethodId);
    if (selectedMethod?.requiresAttachment && !paymentProof) {
      toast.error(isRtl ? "يرجى رفع إثبات الدفع" : "Please upload payment proof");
      return;
    }

    setSubmitting(true);

    try {
      const paymentData = {
        packageId: selectedPackage.id || selectedPackage._id,
        pricingTierId: "package_subscription",
        manualPaymentMethodId: selectedMethodId,
        paymentProof: paymentProof || undefined,
        couponCode: appliedCoupon?.code,
        billingInfo: {
          ...formData,
          amount: packageFinalAmount,
        },
        amount: packageFinalAmount,
        currency: packageCurrency,
      };

      await dispatch(createCustomerManualPaymentThunk(paymentData)).unwrap();
      setOrderSuccess(true);
      toast.success(isRtl ? "تم إرسال طلب الاشتراك بنجاح" : "Subscription request sent successfully");
    } catch (err: any) {
      toast.error(err || (isRtl ? "فشل إرسال الطلب" : "Failed to send request"));
    } finally {
      setSubmitting(false);
    }
  };

  const getLocalizedText = (text: any) => {
    if (!text) return "";
    if (typeof text === 'string') return text;
    return text[locale] || text.en || text.ar || "";
  };

  if (pkgLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!selectedPackage) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold">{isRtl ? "الباقة غير موجودة" : "Package Not Found"}</h2>
        <Link href={`/${locale}/packages`} className="mt-4 inline-block">
          <Button>{isRtl ? "العودة للباقات" : "Back to Packages"}</Button>
        </Link>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="container mx-auto px-4 py-20 flex items-center justify-center">
        <Card className="max-w-md w-full text-center p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold mb-2">{isRtl ? "شكراً لك!" : "Thank You!"}</h2>
          <p className="text-muted-foreground mb-8">
            {isRtl 
              ? "تم استلام طلب اشتراكك بنجاح. سيتم تفعيل حسابك فور مراجعة عملية الدفع من قبل الإدارة."
              : "Your subscription request has been received. Your account will be activated once the payment is verified by our team."}
          </p>
          <div className="flex flex-col gap-3">
            <Link href={`/${locale}/account`}>
              <Button className="w-full h-12 text-lg">{isRtl ? "الانتقال لحسابي" : "Go to My Account"}</Button>
            </Link>
            <Link href={`/${locale}`}>
              <Button variant="outline" className="w-full">{isRtl ? "الرئيسية" : "Home"}</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/${locale}/packages`}>
            <Button variant="ghost" size="icon">
              {isRtl ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
            </Button>
          </Link>
          <h1 className="text-xl font-bold">{isRtl ? "إتمام الاشتراك" : "Complete Subscription"}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Forms */}
          <div className="lg:col-span-2 space-y-6">
            {!isLoggedIn && (
              <Card className="border-amber-300 bg-amber-50">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-lg text-amber-900">
                    {isRtl ? "تسجيل الدخول مطلوب" : "Login required"}
                  </CardTitle>
                  <CardDescription className="text-amber-800">
                    {isRtl
                      ? "لا يمكن إتمام الاشتراك كزائر. سجل الدخول أو أنشئ حسابًا ثم أكمل الطلب."
                      : "Guest checkout is not available. Please login or create an account to continue."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-3">
                  <Button asChild>
                    <Link href={loginHref}>
                      {isRtl ? "تسجيل الدخول" : "Login"}
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={registerHref}>
                      {isRtl ? "إنشاء حساب" : "Create account"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-primary" />
                  {isRtl ? "المعلومات الشخصية" : "Personal Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{isRtl ? "الاسم الكامل" : "Full Name"}</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{isRtl ? "البريد الإلكتروني" : "Email Address"}</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    required 
                    readOnly={isLoggedIn}
                    className={isLoggedIn ? "bg-muted" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{isRtl ? "رقم الهاتف / واتساب" : "Phone / WhatsApp"}</Label>
                  <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">{isRtl ? "ملاحظات إضافية" : "Additional Notes"}</Label>
                  <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={2} />
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  {isRtl ? "طريقة الدفع" : "Payment Method"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedMethodId} onValueChange={setSelectedMethodId} className="space-y-3">
                  {manualPaymentMethods.filter(m => m.isEnabled).map((method, index) => (
                    <div 
                      key={method._id || `method-${index}`}
                      className={`rounded-xl border-2 transition-all ${
                        selectedMethodId === method._id ? "border-primary bg-primary/5" : "border-gray-100"
                      }`}
                    >
                      <label className="flex items-center gap-4 p-4 cursor-pointer">
                        <RadioGroupItem value={method._id} />
                        <div className="flex-1">
                          <p className="font-bold">{getLocalizedText(method.title)}</p>
                          <p className="text-sm text-muted-foreground">{getLocalizedText(method.description)}</p>
                        </div>
                        {method.imageUrl && <img src={method.imageUrl} className="h-8 w-auto grayscale opacity-70" alt="" />}
                      </label>

                      {selectedMethodId === method._id && (
                        <div className="px-4 pb-4 pt-2 border-t border-dashed space-y-4">
                          {method.instructions && (
                            <div className="bg-white p-3 rounded text-sm text-gray-600 whitespace-pre-wrap">
                              {getLocalizedText(method.instructions)}
                            </div>
                          )}
                          
                          {method.requiresAttachment && (
                            <div className="space-y-2">
                              <Label className="text-xs uppercase font-bold text-gray-500">
                                {isRtl ? "صورة التحويل / إيصال الدفع" : "Payment Receipt / Screenshot"}
                              </Label>
                              <div className="flex items-center gap-3">
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => document.getElementById('proof-upload')?.click()}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  {isRtl ? "اختر ملف" : "Choose File"}
                                </Button>
                                <input id="proof-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                {paymentProof && (
                                  <span className="text-xs text-green-600 flex items-center gap-1">
                                    <ImageIcon className="h-3 w-3" />
                                    {paymentProof.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Right: Summary */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>{isRtl ? "ملخص الاشتراك" : "Subscription Summary"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRtl ? "الباقة" : "Package"}</span>
                  <span className="font-bold text-primary">{getLocalizedText(selectedPackage.name)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{isRtl ? "المدة" : "Duration"}</span>
                  <span>{selectedPackage.duration.value} {getLocalizedText(selectedPackage.duration.unit)}</span>
                </div>
                
                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="packageCouponCode" className="text-sm font-medium">
                    {isRtl ? "Coupon Code" : "Discount Coupon"}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="packageCouponCode"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                      placeholder={isRtl ? "e.g. SAVE20" : "e.g. SAVE20"}
                      disabled={couponApplying || submitting}
                    />
                    {appliedCoupon ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRemoveCoupon}
                        disabled={couponApplying || submitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleApplyCoupon}
                        disabled={couponApplying || submitting || !couponCodeInput.trim()}
                      >
                        {couponApplying ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <TicketPercent className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  {appliedCoupon && (
                    <p className="text-xs text-green-700">
                      {isRtl
                        ? `${appliedCoupon.code} applied successfully`
                        : `${appliedCoupon.code} applied successfully`}
                    </p>
                  )}
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{isRtl ? "Subtotal" : "Subtotal"}</span>
                  <span>{packageBaseAmount} {packageCurrency}</span>
                </div>
                {packageDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>{isRtl ? "Discount" : "Discount"}</span>
                    <span>- {packageDiscountAmount} {packageCurrency}</span>
                  </div>
                )}

                <div className="flex justify-between items-end">
                  <span className="font-bold text-lg">{isRtl ? "Total" : "Total"}</span>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">
                      {packageFinalAmount} {packageCurrency}
                    </div>
                  </div>
                </div>



                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg mt-4" 
                  disabled={submitting || !isLoggedIn}
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    isLoggedIn
                      ? (isRtl ? "تأكيد الاشتراك" : "Confirm Subscription")
                      : (isRtl ? "سجل دخولك لإتمام الاشتراك" : "Login to confirm subscription")
                  )}
                </Button>
                <p className="text-[10px] text-center text-muted-foreground mt-2">
                  {isRtl 
                    ? "بالنقر على تأكيد الاشتراك، أنت توافق على شروط الخدمة وسياسة الخصوصية."
                    : "By clicking Confirm Subscription, you agree to our Terms of Service and Privacy Policy."}
                </p>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}



