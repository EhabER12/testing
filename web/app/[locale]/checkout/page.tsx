"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Image as ImageIcon,
  User,
  CreditCard as CreditCardIcon,
  Banknote,
  Upload,
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
import {
  initializeCart,
  clearCart,
  calculateCartTotal,
  getCartItemCount,
  CartItem,
} from "@/store/slices/cartSlice";
import {
  getManualPaymentMethodsThunk,
  getPaymentGatewaysThunk,
  ManualPaymentMethod,
} from "@/store/services/settingsService";
import {
  createCustomerManualPaymentThunk,
  createPaypalPaymentThunk,
  createCashierPaymentThunk,
} from "@/store/services/paymentService";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { countries } from "@/constants/countries";
import {
  syncCartSession,
  updateCustomerInfo,
  markSessionConverted,
} from "@/store/services/cartSessionService";
import { useAuth } from "@/components/auth/auth-provider";

// Get localized text helper
const getLocalizedText = (
  text: { ar: string; en: string } | string | undefined,
  locale: string
): string => {
  if (!text) return "";
  if (typeof text === "string") return text;
  return text[locale as "ar" | "en"] || text.en || text.ar || "";
};

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "ar";
  const isRtl = locale === "ar";
  const t = useTranslations();

  const dispatch = useAppDispatch();
  const { items } = useAppSelector((state) => state.cart);
  const { manualPaymentMethods } = useAppSelector((state) => state.settings);
  const { user } = useAppSelector((state) => state.auth);
  const { userData } = useAuth();

  // Determine if user is logged in
  const isLoggedIn = !!user?.token;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
    address: "",
    city: "",
    country: "",
  });
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [itemsData, setItemsData] = useState<
    Record<number, Record<string, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [gateways, setGateways] = useState<any>({});

  // Initialize cart and fetch payment methods
  useEffect(() => {
    dispatch(initializeCart());
    dispatch(getManualPaymentMethodsThunk());
    dispatch(getPaymentGatewaysThunk()).unwrap().then(setGateways).catch(console.error);
  }, [dispatch]);

  const total = calculateCartTotal(items);
  const itemCount = getCartItemCount(items);

  // Sync cart session on load and when cart changes
  useEffect(() => {
    if (items.length > 0) {
      syncCartSession(items, total, items[0]?.product?.currency || "SAR");
    }
  }, [items, total]);

  // Pre-fill form with user data when logged in
  useEffect(() => {
    if (userData && isLoggedIn) {
      setFormData((prev) => ({
        ...prev,
        name: userData.name || prev.name,
        email: userData.email || prev.email,
      }));
    }
  }, [userData, isLoggedIn]);

  // Debounced customer info update
  const [customerInfoTimeout, setCustomerInfoTimeout] =
    useState<NodeJS.Timeout | null>(null);

  const handleCustomerInfoBlur = () => {
    // Clear existing timeout
    if (customerInfoTimeout) {
      clearTimeout(customerInfoTimeout);
    }

    // Set new timeout to update after 500ms
    const timeout = setTimeout(() => {
      if (formData.name || formData.email || formData.phone) {
        updateCustomerInfo({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        });
      }
    }, 500);

    setCustomerInfoTimeout(timeout);
  };

  // Handle form change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handle custom field change
  const handleItemFieldChange = (
    itemIndex: number,
    fieldIndex: number,
    value: string
  ) => {
    setItemsData((prev) => ({
      ...prev,
      [itemIndex]: {
        ...(prev[itemIndex] || {}),
        [fieldIndex]: value,
      },
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
  };

  // Handle checkout submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error(t("checkout.name") + " is required");
      return;
    }
    if (!formData.email.trim()) {
      toast.error(t("checkout.email") + " is required");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error(t("checkout.phone") + " is required");
      return;
    }
    if (!selectedMethodId) {
      toast.error(t("checkout.paymentMethod") + " is required");
      return;
    }

    const selectedMethod = manualPaymentMethods.find(
      (m) => m._id === selectedMethodId
    );
    // Only check proof if it's a manual method (not paypal/cashier) and requires it
    if (selectedMethodId !== "paypal" && selectedMethodId !== "cashier" && selectedMethod?.requiresAttachment && !paymentProof) {
      toast.error(t("admin.payments.paymentProof") + " is required");
      return;
    }

    // Validate Custom Fields
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.product.customFields) {
        for (
          let fIndex = 0;
          fIndex < item.product.customFields.length;
          fIndex++
        ) {
          const field = item.product.customFields[fIndex];
          if (field.required) {
            const val = itemsData[i]?.[fIndex];
            if (!val || !val.trim()) {
              const label = getLocalizedText(field.label, locale);
              toast.error(
                `${getLocalizedText(
                  item.product.name,
                  locale
                )}: ${label} is required`
              );
              return;
            }
          }
        }
      }
    }

    setSubmitting(true);

    try {
      // 1. PayPal
      if (selectedMethodId === "paypal") {
        const mainItem = items[0];
        const productId = mainItem?.product?.id || (mainItem?.product as any)?._id;

        const response = await dispatch(createPaypalPaymentThunk({
          amount: total,
          productId,
          currency: items[0]?.product?.currency || "USD", // PayPal usually USD
          locale,
          billingInfo: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          },
        })).unwrap();

        if (response.approvalUrl) {
          window.location.href = response.approvalUrl;
          return;
        } else if ((response as any).links) { // Fallback if structure differs
          const link = (response as any).links.find((l: any) => l.rel === 'approve');
          if (link) {
            window.location.href = link.href;
            return;
          }
        }
      }
      // 2. Cashier
      else if (selectedMethodId === "cashier") {
        const response = await dispatch(createCashierPaymentThunk({
          amount: total,
          currency: items[0]?.product?.currency || "EGP", // Cashier uses EGP
          customer: {
            name: formData.name,
            email: formData.email
          }
        })).unwrap();

        if (response.checkoutUrl) {
          window.location.href = response.checkoutUrl;
          return;
        }
      }
      // 3. Manual Payment (Existing Logic)
      else {
        // Compress image if it's too large (> 2MB) - helps mobile users
        let processedProof = paymentProof;
        if (paymentProof && paymentProof.size > 2 * 1024 * 1024) {
          toast.loading(isRtl ? "جاري ضغط الصورة..." : "Compressing image...", {
            id: "compress",
          });
          try {
            processedProof = await compressImage(paymentProof);
            toast.dismiss("compress");
          } catch (compressError) {
            toast.dismiss("compress");
            console.warn(
              "Image compression failed, using original",
              compressError
            );
          }
        }

        // Use the first item's product ID as the main reference (Limitation of current backend)
        const mainItem = items[0];
        const productId =
          mainItem?.product?.id || (mainItem?.product as any)?._id;

        const itemsPayload = items.map((item, index) => ({
          productId: item.product.id || (item.product as any)._id || "",
          name: getLocalizedText(item.product.name, "en"),
          price: item.variant?.price ?? item.product.basePrice,
          quantity: item.quantity,
          variantId: item.variantId,
          addonIds: item.addonIds,
          customFields: item.product.customFields?.map((f, fIndex) => ({
            label: getLocalizedText(f.label, "en"),
            value: itemsData[index]?.[fIndex] || "",
          })),
        }));

        const paymentData = {
          productId: productId,
          serviceId: undefined,
          pricingTierId: "checkout_order", // Placeholder required by backend
          manualPaymentMethodId: selectedMethodId,
          paymentProof: processedProof || undefined,
          billingInfo: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address || "",
            city: formData.city || "",
            country: formData.country,
            amount: total,
            items: itemsPayload,
          },
          amount: total,
          items: itemsPayload,
          currency: items[0]?.product?.currency || "SAR",
        };

        await dispatch(createCustomerManualPaymentThunk(paymentData)).unwrap();

        // Clear cart and show success
        dispatch(clearCart());
        setOrderSuccess(true);
        toast.success(t("checkout.orderSuccessMessage"));

        // Mark cart session as converted
        markSessionConverted();
      }
    } catch (err: any) {
      // Better error messages for common issues
      let errorMessage = isRtl ? "فشل في إتمام الطلب" : "Failed to place order";

      if (typeof err === "string") {
        errorMessage = err;
      } else if (err.message) {
        // Network errors
        if (
          err.message.includes("Network Error") ||
          err.message.includes("ECONNABORTED")
        ) {
          errorMessage = isRtl
            ? "خطأ في الاتصال. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى."
            : "Connection error. Please check your internet and try again.";
        } else if (err.message.includes("timeout")) {
          errorMessage = isRtl
            ? "انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى."
            : "Request timed out. Please try again.";
        } else {
          errorMessage = err.message;
        }
      }

      toast.error(errorMessage);
      console.error("Checkout error:", err);
      // Don't set submitting false if we are redirecting (logic simplified here)
      // Actually if redirecting we might unmount, but if error we stay.
      // For redirects, we want to keep spinner.
      if (selectedMethodId === "paypal" || selectedMethodId === "cashier") {
        // If error occurred, stop spinner
        setSubmitting(false);
      } else {
        setSubmitting(false);
      }
    } finally {
      if (selectedMethodId !== "paypal" && selectedMethodId !== "cashier") {
        setSubmitting(false);
      }
    }
  };

  // Helper function to compress images for mobile
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Max dimensions
        const maxWidth = 1200;
        const maxHeight = 1200;

        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: "image/jpeg" }));
            } else {
              reject(new Error("Compression failed"));
            }
          },
          "image/jpeg",
          0.8
        );
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  // Success state
  if (orderSuccess) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center p-8"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-12 pb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t("checkout.orderSuccess")}
            </h2>
            <p className="text-muted-foreground mb-2">
              {t("checkout.orderSuccessMessage")}
            </p>
            <p className="text-sm text-muted-foreground/80 mb-6">
              {t("checkout.orderSuccessSubtitle")}
            </p>
            <Link href={`/${locale}`}>
              <Button size="lg">{t("checkout.backToHome")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center p-8"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-12 pb-8">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t("cart.empty")}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t("cart.emptyMessage")}
            </p>
            <Link href={`/${locale}/products`}>
              <Button size="lg">{t("cart.continueShopping")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/products`}>
              <Button variant="ghost" size="icon">
                {isRtl ? (
                  <ArrowRight className="h-5 w-5" />
                ) : (
                  <ArrowLeft className="h-5 w-5" />
                )}
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{t("checkout.title")}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("checkout.contactInfo")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("checkout.name")}</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleCustomerInfoBlur}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("checkout.email")}</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleCustomerInfoBlur}
                      required
                      readOnly={isLoggedIn}
                      className={
                        isLoggedIn ? "bg-muted cursor-not-allowed" : ""
                      }
                    />
                    {isLoggedIn && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {t("checkout.loggedInAs")} {userData?.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("checkout.phone")}</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleCustomerInfoBlur}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">{t("checkout.city")}</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">{t("checkout.country")}</Label>
                      <select
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            country: e.target.value,
                          }))
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      >
                        <option value="" disabled>
                          {t("checkout.country")}
                        </option>
                        {countries.map((c) => (
                          <option key={c.code} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">{t("checkout.notes")}</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder={t("checkout.notesPlaceholder")}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Product Custom Fields */}
              {items.map((item, index) => {
                const fields = item.product.customFields || [];
                if (fields.length === 0) return null;

                return (
                  <Card key={`item-${index}`}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {getLocalizedText(item.product.name, locale)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {fields.map((field, fIndex) => {
                        const label = getLocalizedText(field.label, locale);
                        const placeholder = getLocalizedText(
                          field.placeholder,
                          locale
                        );

                        return (
                          <div key={fIndex} className="space-y-2">
                            <Label>
                              {label}{" "}
                              {field.required && (
                                <span className="text-red-500">*</span>
                              )}
                            </Label>
                            {field.type === "textarea" ? (
                              <Textarea
                                placeholder={placeholder}
                                required={field.required}
                                value={itemsData[index]?.[fIndex] || ""}
                                onChange={(e) =>
                                  handleItemFieldChange(
                                    index,
                                    fIndex,
                                    e.target.value
                                  )
                                }
                              />
                            ) : (
                              <Input
                                type={
                                  field.type === "number"
                                    ? "number"
                                    : field.type === "email"
                                      ? "email"
                                      : "text"
                                }
                                placeholder={placeholder}
                                required={field.required}
                                value={itemsData[index]?.[fIndex] || ""}
                                onChange={(e) =>
                                  handleItemFieldChange(
                                    index,
                                    fIndex,
                                    e.target.value
                                  )
                                }
                              />
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("checkout.paymentMethod")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={selectedMethodId}
                    onValueChange={setSelectedMethodId}
                    className="space-y-3"
                  >
                    {/* PayPal Option */}
                    {gateways?.paypal?.isEnabled && (
                      <div
                        className={`rounded-xl border-2 transition-all overflow-hidden ${selectedMethodId === "paypal"
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-primary/50"
                          }`}
                        dir={isRtl ? "rtl" : "ltr"}
                      >
                        <label className="flex items-center gap-4 p-4 cursor-pointer">
                          <RadioGroupItem value="paypal" id="paypal" />
                          <Banknote className="h-6 w-6 text-blue-600" />
                          <div>
                            <p className="font-medium">PayPal</p>
                            <p className="text-sm text-muted-foreground">
                              {isRtl ? "الدفع الآمن عبر باي بال" : "Secure payment via PayPal"}
                            </p>
                          </div>
                        </label>
                      </div>
                    )}

                    {/* Cashier Option */}
                    {gateways?.cashier?.isEnabled && (
                      <div
                        className={`rounded-xl border-2 transition-all overflow-hidden ${selectedMethodId === "cashier"
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-primary/50"
                          }`}
                        dir={isRtl ? "rtl" : "ltr"}
                      >
                        <label className="flex items-center gap-4 p-4 cursor-pointer">
                          <RadioGroupItem value="cashier" id="cashier" />
                          <CreditCardIcon className="h-6 w-6 text-purple-600" />
                          <div>
                            <p className="font-medium">{isRtl ? "بطاقة ائتمان / ميزة" : "Credit Card / Meeza"}</p>
                            <p className="text-sm text-muted-foreground">
                              {isRtl ? "الدفع السريع بالبطاقات" : "Fast payment via Cards/Wallets"}
                            </p>
                          </div>
                        </label>
                      </div>
                    )}

                    {manualPaymentMethods && manualPaymentMethods.length > 0 ? (
                      manualPaymentMethods
                        .filter((m) => m.isEnabled)
                        .map((method) => (
                          <div
                            key={method._id}
                            className={`rounded-xl border-2 transition-all overflow-hidden ${selectedMethodId === method._id
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-primary/50"
                              }`}
                            dir={isRtl ? "rtl" : "ltr"}
                          >
                            <label className="flex items-center gap-4 p-4 cursor-pointer">
                              <RadioGroupItem
                                value={method._id}
                                id={method._id}
                              />
                              {method.imageUrl ? (
                                <img
                                  src={method.imageUrl}
                                  alt={getLocalizedText(method.title, locale)}
                                  className="w-10 h-10 object-contain"
                                />
                              ) : (
                                <CreditCardIcon className="h-6 w-6 text-muted-foreground" />
                              )}
                              <div>
                                <p className="font-medium">
                                  {getLocalizedText(method.title, locale)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {getLocalizedText(method.description, locale)}
                                </p>
                              </div>
                            </label>

                            {selectedMethodId === method._id && (
                              <div
                                className={`px-4 pb-4 space-y-4 ${isRtl ? "pr-12" : "pl-12"
                                  }`}
                              >
                                {method.instructions && (
                                  <div className="bg-white p-3 rounded border text-sm text-gray-600 whitespace-pre-wrap">
                                    {getLocalizedText(
                                      method.instructions,
                                      locale
                                    )}
                                  </div>
                                )}

                                {method.requiresAttachment && (
                                  <div className="space-y-2">
                                    <Label
                                      htmlFor="proof"
                                      className="text-sm font-medium"
                                    >
                                      {t("admin.payments.uploadProof")}{" "}
                                      <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          document
                                            .getElementById("proof")
                                            ?.click()
                                        }
                                      >
                                        <Upload
                                          className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"
                                            }`}
                                        />
                                        {t("admin.payments.chooseFile")}
                                      </Button>
                                      <Input
                                        id="proof"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                      />
                                      {paymentProof && (
                                        <div className="flex items-center gap-2 text-sm text-green-600">
                                          <ImageIcon className="h-4 w-4" />
                                          {paymentProof.name}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        {t("checkout.noPaymentMethods")}
                      </p>
                    )}
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Right: Order Summary */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>{t("checkout.orderSummary")}</CardTitle>
                  <CardDescription>
                    {itemCount} {t("cart.itemsInCart")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items */}
                  {items.map((item: CartItem, index: number) => (
                    <div key={index} className="flex gap-3 text-sm">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {item.product.coverImage ? (
                          <img
                            src={item.product.coverImage}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium line-clamp-1">
                          {getLocalizedText(item.product.name, locale)}
                        </p>
                        <p className="text-muted-foreground">
                          x{item.quantity}
                        </p>
                      </div>
                      <p className="font-medium text-primary">
                        {(item.variant?.price ?? item.product.basePrice) *
                          item.quantity}{" "}
                        {item.product.currency}
                      </p>
                    </div>
                  ))}

                  <Separator />

                  {/* Total */}
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>{t("cart.total")}</span>
                    <span className="text-primary">
                      {total} {items[0]?.product.currency || "SAR"}
                    </span>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2
                          className={`h-4 w-4 animate-spin ${isRtl ? "ml-2" : "mr-2"
                            }`}
                        />
                        {t("checkout.processing")}
                      </>
                    ) : (
                      t("checkout.placeOrder")
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
