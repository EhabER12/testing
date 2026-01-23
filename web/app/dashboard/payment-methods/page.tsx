"use client";

import React, { useEffect, useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import {
    getPaymentMethodsThunk,
    updatePaymentMethodThunk,
    togglePaymentMethodThunk,
    createPaymentMethodThunk,
    PaymentMethod,
} from "@/store/services/paymentMethodService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CreditCard, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PaymentMethodsPage() {
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [methods, setMethods] = useState<PaymentMethod[]>([]);

    // PayPal state
    const [paypal, setPaypal] = useState<PaymentMethod | null>(null);
    const [paypalForm, setPaypalForm] = useState({
        clientId: "",
        clientSecret: "",
        webhookId: "",
        mode: "sandbox" as "sandbox" | "live",
        returnUrl: "",
        cancelUrl: "",
        isActive: false,
    });

    // Cashier state
    const [cashier, setCashier] = useState<PaymentMethod | null>(null);
    const [cashierForm, setCashierForm] = useState({
        mid: "",
        paymentApiKey: "",
        secretKey: "",
        mode: "sandbox" as "sandbox" | "live",
        checkoutUrl: "",
        callbackUrl: "",
        redirectUrl: "",
        isActive: false,
    });

    useEffect(() => {
        loadPaymentMethods();
    }, []);

    const loadPaymentMethods = async () => {
        try {
            setLoading(true);
            const result = await dispatch(
                getPaymentMethodsThunk({ includeInactive: true })
            ).unwrap();

            setMethods(result);

            // Find PayPal and Cashier
            const paypalMethod = result.find((m) => m.provider === "paypal");
            const cashierMethod = result.find((m) => m.provider === "cashier");

            if (paypalMethod) {
                setPaypal(paypalMethod);
                setPaypalForm({
                    clientId: paypalMethod.credentials.clientId || "",
                    clientSecret: paypalMethod.credentials.clientSecret || "",
                    webhookId: paypalMethod.credentials.webhookId || "",
                    mode: paypalMethod.mode as "sandbox" | "live",
                    returnUrl: paypalMethod.config.returnUrl || "",
                    cancelUrl: paypalMethod.config.cancelUrl || "",
                    isActive: paypalMethod.isActive,
                });
            }

            if (cashierMethod) {
                setCashier(cashierMethod);
                setCashierForm({
                    mid: cashierMethod.credentials.mid || "",
                    paymentApiKey: cashierMethod.credentials.paymentApiKey || "",
                    secretKey: cashierMethod.credentials.secretKey || "",
                    mode: cashierMethod.mode as "sandbox" | "live",
                    checkoutUrl: cashierMethod.config.checkoutUrl || "",
                    callbackUrl: cashierMethod.config.callbackUrl || "",
                    redirectUrl: cashierMethod.config.redirectUrl || "",
                    isActive: cashierMethod.isActive,
                });
            }
        } catch (error: any) {
            toast.error(error || "Failed to load payment methods");
        } finally {
            setLoading(false);
        }
    };

    const handlePayPalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setSaving(true);

            const paymentData: Partial<PaymentMethod> = {
                credentials: {
                    clientId: paypalForm.clientId,
                    clientSecret: paypalForm.clientSecret,
                    webhookId: paypalForm.webhookId,
                },
                mode: paypalForm.mode,
                config: {
                    returnUrl: paypalForm.returnUrl,
                    cancelUrl: paypalForm.cancelUrl,
                },
                isActive: paypalForm.isActive,
            };

            if (paypal) {
                // Update existing PayPal method
                await dispatch(
                    updatePaymentMethodThunk({ id: paypal._id, data: paymentData })
                ).unwrap();
                toast.success("PayPal configuration updated successfully");
            } else {
                // Create new PayPal method
                const createData = {
                    ...paymentData,
                    provider: "paypal" as const,
                    displayName: {
                        ar: "باي بال",
                        en: "PayPal",
                    },
                    description: {
                        ar: "الدفع عبر باي بال",
                        en: "Pay with PayPal",
                    },
                    order: 1,
                };
                await dispatch(createPaymentMethodThunk(createData)).unwrap();
                toast.success("PayPal configuration created successfully");
            }

            await loadPaymentMethods();
        } catch (error: any) {
            toast.error(error || "Failed to save PayPal configuration");
        } finally {
            setSaving(false);
        }
    };

    const handleCashierSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setSaving(true);

            const paymentData: Partial<PaymentMethod> = {
                credentials: {
                    mid: cashierForm.mid,
                    paymentApiKey: cashierForm.paymentApiKey,
                    secretKey: cashierForm.secretKey,
                },
                mode: cashierForm.mode,
                config: {
                    checkoutUrl: cashierForm.checkoutUrl,
                    callbackUrl: cashierForm.callbackUrl,
                    redirectUrl: cashierForm.redirectUrl,
                },
                isActive: cashierForm.isActive,
            };

            if (cashier) {
                // Update existing Cashier method
                await dispatch(
                    updatePaymentMethodThunk({ id: cashier._id, data: paymentData })
                ).unwrap();
                toast.success("Cashier configuration updated successfully");
            } else {
                // Create new Cashier method
                const createData = {
                    ...paymentData,
                    provider: "cashier" as const,
                    displayName: {
                        ar: "كاشير",
                        en: "Cashier",
                    },
                    description: {
                        ar: "الدفع عبر كاشير",
                        en: "Pay with Cashier (Kashier)",
                    },
                    order: 2,
                };
                await dispatch(createPaymentMethodThunk(createData)).unwrap();
                toast.success("Cashier configuration created successfully");
            }

            await loadPaymentMethods();
        } catch (error: any) {
            toast.error(error || "Failed to save Cashier configuration");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Payment Gateways</h1>
                <p className="text-muted-foreground">
                    Configure PayPal and Cashier payment methods
                </p>
            </div>

            <Tabs defaultValue="paypal" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="paypal" className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        PayPal
                        {paypal?.isActive ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                            <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="cashier" className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Cashier
                        {cashier?.isActive ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                            <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* PayPal Tab */}
                <TabsContent value="paypal">
                    <Card>
                        <CardHeader>
                            <CardTitle>PayPal Configuration</CardTitle>
                            <CardDescription>
                                Configure your PayPal payment gateway settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePayPalSubmit} className="space-y-6">
                                {/* Active Toggle */}
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <Label className="text-base font-semibold">Enable PayPal</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Allow customers to pay with PayPal
                                        </p>
                                    </div>
                                    <Switch
                                        checked={paypalForm.isActive}
                                        onCheckedChange={(checked) =>
                                            setPaypalForm({ ...paypalForm, isActive: checked })
                                        }
                                    />
                                </div>

                                {/* Mode */}
                                <div className="space-y-2">
                                    <Label>Mode</Label>
                                    <Select
                                        value={paypalForm.mode}
                                        onValueChange={(value) =>
                                            setPaypalForm({ ...paypalForm, mode: value as "sandbox" | "live" })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sandbox">Sandbox (Test)</SelectItem>
                                            <SelectItem value="live">Live (Production)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Client ID */}
                                <div className="space-y-2">
                                    <Label htmlFor="paypal-client-id">Client ID</Label>
                                    <Input
                                        id="paypal-client-id"
                                        value={paypalForm.clientId}
                                        onChange={(e) =>
                                            setPaypalForm({ ...paypalForm, clientId: e.target.value })
                                        }
                                        placeholder="Enter PayPal Client ID"
                                    />
                                </div>

                                {/* Client Secret */}
                                <div className="space-y-2">
                                    <Label htmlFor="paypal-client-secret">Client Secret</Label>
                                    <Input
                                        id="paypal-client-secret"
                                        type="password"
                                        value={paypalForm.clientSecret}
                                        onChange={(e) =>
                                            setPaypalForm({ ...paypalForm, clientSecret: e.target.value })
                                        }
                                        placeholder="Enter PayPal Client Secret"
                                    />
                                </div>

                                {/* Webhook ID */}
                                <div className="space-y-2">
                                    <Label htmlFor="paypal-webhook-id">Webhook ID</Label>
                                    <Input
                                        id="paypal-webhook-id"
                                        value={paypalForm.webhookId}
                                        onChange={(e) =>
                                            setPaypalForm({ ...paypalForm, webhookId: e.target.value })
                                        }
                                        placeholder="Enter PayPal Webhook ID"
                                    />
                                </div>

                                {/* Return URL */}
                                <div className="space-y-2">
                                    <Label htmlFor="paypal-return-url">Return URL</Label>
                                    <Input
                                        id="paypal-return-url"
                                        value={paypalForm.returnUrl}
                                        onChange={(e) =>
                                            setPaypalForm({ ...paypalForm, returnUrl: e.target.value })
                                        }
                                        placeholder="https://yoursite.com/payment/success"
                                    />
                                </div>

                                {/* Cancel URL */}
                                <div className="space-y-2">
                                    <Label htmlFor="paypal-cancel-url">Cancel URL</Label>
                                    <Input
                                        id="paypal-cancel-url"
                                        value={paypalForm.cancelUrl}
                                        onChange={(e) =>
                                            setPaypalForm({ ...paypalForm, cancelUrl: e.target.value })
                                        }
                                        placeholder="https://yoursite.com/payment/cancel"
                                    />
                                </div>

                                <Button type="submit" disabled={saving}>
                                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    {paypal ? "Save PayPal Configuration" : "Create PayPal Configuration"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Cashier Tab */}
                <TabsContent value="cashier">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cashier (Kashier) Configuration</CardTitle>
                            <CardDescription>
                                Configure your Kashier payment gateway settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCashierSubmit} className="space-y-6">
                                {/* Active Toggle */}
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <Label className="text-base font-semibold">Enable Cashier</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Allow customers to pay with Cashier
                                        </p>
                                    </div>
                                    <Switch
                                        checked={cashierForm.isActive}
                                        onCheckedChange={(checked) =>
                                            setCashierForm({ ...cashierForm, isActive: checked })
                                        }
                                    />
                                </div>

                                {/* Mode */}
                                <div className="space-y-2">
                                    <Label>Mode</Label>
                                    <Select
                                        value={cashierForm.mode}
                                        onValueChange={(value) =>
                                            setCashierForm({ ...cashierForm, mode: value as "sandbox" | "live" })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sandbox">Sandbox (Test)</SelectItem>
                                            <SelectItem value="live">Live (Production)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Merchant ID */}
                                <div className="space-y-2">
                                    <Label htmlFor="cashier-mid">Merchant ID</Label>
                                    <Input
                                        id="cashier-mid"
                                        value={cashierForm.mid}
                                        onChange={(e) =>
                                            setCashierForm({ ...cashierForm, mid: e.target.value })
                                        }
                                        placeholder="Enter Cashier Merchant ID"
                                    />
                                </div>

                                {/* Payment API Key */}
                                <div className="space-y-2">
                                    <Label htmlFor="cashier-api-key">Payment API Key</Label>
                                    <Input
                                        id="cashier-api-key"
                                        type="password"
                                        value={cashierForm.paymentApiKey}
                                        onChange={(e) =>
                                            setCashierForm({ ...cashierForm, paymentApiKey: e.target.value })
                                        }
                                        placeholder="Enter Payment API Key"
                                    />
                                </div>

                                {/* Secret Key */}
                                <div className="space-y-2">
                                    <Label htmlFor="cashier-secret">Secret Key</Label>
                                    <Input
                                        id="cashier-secret"
                                        type="password"
                                        value={cashierForm.secretKey}
                                        onChange={(e) =>
                                            setCashierForm({ ...cashierForm, secretKey: e.target.value })
                                        }
                                        placeholder="Enter Secret Key"
                                    />
                                </div>

                                {/* Checkout URL */}
                                <div className="space-y-2">
                                    <Label htmlFor="cashier-checkout-url">Checkout URL</Label>
                                    <Input
                                        id="cashier-checkout-url"
                                        value={cashierForm.checkoutUrl}
                                        onChange={(e) =>
                                            setCashierForm({ ...cashierForm, checkoutUrl: e.target.value })
                                        }
                                        placeholder="https://checkout.kashier.io"
                                    />
                                </div>

                                {/* Callback URL */}
                                <div className="space-y-2">
                                    <Label htmlFor="cashier-callback-url">Callback URL</Label>
                                    <Input
                                        id="cashier-callback-url"
                                        value={cashierForm.callbackUrl}
                                        onChange={(e) =>
                                            setCashierForm({ ...cashierForm, callbackUrl: e.target.value })
                                        }
                                        placeholder="https://yoursite.com/api/payments/cashier/callback"
                                    />
                                </div>

                                {/* Redirect URL */}
                                <div className="space-y-2">
                                    <Label htmlFor="cashier-redirect-url">Redirect URL</Label>
                                    <Input
                                        id="cashier-redirect-url"
                                        value={cashierForm.redirectUrl}
                                        onChange={(e) =>
                                            setCashierForm({ ...cashierForm, redirectUrl: e.target.value })
                                        }
                                        placeholder="https://yoursite.com/payment/success"
                                    />
                                </div>

                                <Button type="submit" disabled={saving}>
                                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    {cashier ? "Save Cashier Configuration" : "Create Cashier Configuration"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
