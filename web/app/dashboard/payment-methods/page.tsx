"use client";

import React, { useEffect, useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import {
    getPaymentMethodsThunk,
    updatePaymentMethodThunk,
    createPaymentMethodThunk,
    PaymentMethod,
} from "@/store/services/paymentMethodService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CreditCard, CheckCircle2, XCircle, Info } from "lucide-react";
import toast from "react-hot-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PaymentMethodsPage() {
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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
        redirectUrl: "",
        isActive: false,
    });

    useEffect(() => {
        let isMounted = true;
        loadPaymentMethods(() => isMounted);
        return () => {
            isMounted = false;
        };
    }, []);

    const loadPaymentMethods = async (getIsMounted?: () => boolean) => {
        try {
            setLoading(true);
            const result = await dispatch(
                getPaymentMethodsThunk({ includeInactive: true })
            ).unwrap();

            if (getIsMounted && !getIsMounted()) return;

            console.log("📦 All payment methods loaded:", result.length);
            console.log("   Providers:", result.map(m => m.provider).join(", "));

            // Find PayPal and Cashier
            const paypalMethod = result.find((m) => m.provider === "paypal");
            const cashierMethod = result.find((m) => m.provider === "cashier");

            console.log("🔍 Looking for cashier... Found:", !!cashierMethod);
            if (!cashierMethod) {
                console.log("⚠️  Kashier NOT found in database! Available providers:", result.map(m => m.provider));
            }

            if (paypalMethod) {
                setPaypal(paypalMethod);
                setPaypalForm({
                    clientId: paypalMethod.credentials?.clientId || "",
                    clientSecret: paypalMethod.credentials?.clientSecret || "",
                    webhookId: paypalMethod.credentials?.webhookId || "",
                    mode: paypalMethod.mode as "sandbox" | "live",
                    returnUrl: paypalMethod.config?.returnUrl || "",
                    cancelUrl: paypalMethod.config?.cancelUrl || "",
                    isActive: paypalMethod.isActive,
                });
            }

            if (cashierMethod) {
                console.log("✅ Found existing Kashier payment method:", {
                    id: cashierMethod._id,
                    isActive: cashierMethod.isActive,
                    mode: cashierMethod.mode,
                });
                setCashier(cashierMethod);
                setCashierForm({
                    mid: cashierMethod.credentials?.mid || "",
                    paymentApiKey: cashierMethod.credentials?.paymentApiKey || "",
                    secretKey: cashierMethod.credentials?.secretKey || "",
                    mode: cashierMethod.mode as "sandbox" | "live",
                    redirectUrl: cashierMethod.config?.redirectUrl || "",
                    isActive: cashierMethod.isActive,
                });
            } else {
                console.log("ℹ️  No existing Kashier found - you can create a new one");
            }
        } catch (error: any) {
            console.error("❌ Error loading payment methods:", error);
            toast.error(error?.message || "Failed to load payment methods");
        } finally {
            if (!getIsMounted || getIsMounted()) {
                setLoading(false);
            }
        }
    };

    const handlePayPalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setSaving(true);

            const clientId = paypalForm.clientId.trim();
            const clientSecret = paypalForm.clientSecret.trim();
            const webhookId = paypalForm.webhookId.trim();
            const returnUrl = paypalForm.returnUrl.trim();
            const cancelUrl = paypalForm.cancelUrl.trim();

            if (!clientId || !clientSecret) {
                toast.error("Client ID and Client Secret are required");
                setSaving(false);
                return;
            }

            const paymentData: Partial<PaymentMethod> = {
                credentials: {
                    clientId,
                    clientSecret,
                    webhookId,
                },
                mode: paypalForm.mode,
                config: {
                    returnUrl,
                    cancelUrl,
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
            toast.error(error?.message || "Failed to save PayPal configuration");
        } finally {
            setSaving(false);
        }
    };

    const handleCashierSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setSaving(true);

            const mid = cashierForm.mid.trim();
            const paymentApiKey = cashierForm.paymentApiKey.trim();
            const secretKey = cashierForm.secretKey.trim();
            const redirectUrl = cashierForm.redirectUrl.trim();

            if (!mid || !paymentApiKey || !secretKey) {
                toast.error("Merchant ID, API Key, and Secret Key are required");
                setSaving(false);
                return;
            }

            const paymentData: Partial<PaymentMethod> = {
                credentials: {
                    mid,
                    paymentApiKey,
                    secretKey,
                },
                mode: cashierForm.mode,
                config: {
                    redirectUrl,
                },
                isActive: cashierForm.isActive,
            };

            if (cashier) {
                // Update existing Kashier method
                console.log("🔄 Updating Kashier payment method:", cashier._id, paymentData);
                await dispatch(
                    updatePaymentMethodThunk({ id: cashier._id, data: paymentData })
                ).unwrap();
                toast.success("Kashier configuration updated successfully");
            } else {
                // Create new Kashier method
                const createData = {
                    ...paymentData,
                    provider: "cashier" as const,
                    displayName: {
                        ar: "كاشير",
                        en: "Kashier",
                    },
                    description: {
                        ar: "الدفع عبر كاشير",
                        en: "Pay with Kashier",
                    },
                    order: 2,
                };
                console.log("➕ Creating new Kashier payment method:", JSON.stringify(createData, null, 2));
                await dispatch(createPaymentMethodThunk(createData)).unwrap();
                toast.success("Cashier configuration created successfully");
            }

            await loadPaymentMethods();
        } catch (error: any) {
            console.error("❌ Cashier submit error:", {
                message: error?.message,
                response: error?.response,
                data: error?.response?.data,
                full: error,
            });
            toast.error(error?.message || "Failed to save Cashier configuration");
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
                            <CardTitle>Kashier Configuration (Payment Sessions API v3)</CardTitle>
                            <CardDescription>
                                Configure your Kashier payment gateway. Get your credentials from{" "}
                                <a
                                    href="https://merchant.kashier.io"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    Kashier Merchant Dashboard
                                </a>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCashierSubmit} className="space-y-6">
                                {/* Active Toggle */}
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <Label className="text-base font-semibold">Enable Kashier</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Allow customers to pay with Kashier (Cards, Wallets, etc.)
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
                                            <SelectItem value="sandbox">Test Mode (Sandbox)</SelectItem>
                                            <SelectItem value="live">Live Mode (Production)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Use Test Mode for testing. Switch to Live Mode when ready for production.
                                    </p>
                                </div>

                                {/* Merchant ID */}
                                <div className="space-y-2">
                                    <Label htmlFor="cashier-mid">Merchant ID *</Label>
                                    <Input
                                        id="cashier-mid"
                                        value={cashierForm.mid}
                                        onChange={(e) =>
                                            setCashierForm({ ...cashierForm, mid: e.target.value })
                                        }
                                        placeholder="MID-XXXX-XXXX"
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Your Merchant ID from Kashier Dashboard
                                    </p>
                                </div>

                                {/* API Key */}
                                <div className="space-y-2">
                                    <Label htmlFor="cashier-api-key">API Key *</Label>
                                    <Input
                                        id="cashier-api-key"
                                        type="password"
                                        value={cashierForm.paymentApiKey}
                                        onChange={(e) =>
                                            setCashierForm({ ...cashierForm, paymentApiKey: e.target.value })
                                        }
                                        placeholder="Enter your API Key"
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        API Key for authenticating payment requests
                                    </p>
                                </div>

                                {/* Secret Key */}
                                <div className="space-y-2">
                                    <Label htmlFor="cashier-secret">Secret Key *</Label>
                                    <Input
                                        id="cashier-secret"
                                        type="password"
                                        value={cashierForm.secretKey}
                                        onChange={(e) =>
                                            setCashierForm({ ...cashierForm, secretKey: e.target.value })
                                        }
                                        placeholder="Enter your Secret Key"
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Secret Key for webhook signature verification
                                    </p>
                                </div>

                                {/* Webhook URL (Read-only) */}
                                <div className="space-y-2">
                                    <Label htmlFor="cashier-webhook-url">Webhook URL (Configure in Kashier Dashboard)</Label>
                                    <Input
                                        id="cashier-webhook-url"
                                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/payments/kashier/webhook`}
                                        readOnly
                                        className="bg-muted"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Copy this URL and add it to your Kashier Merchant Dashboard → Settings → Webhooks
                                    </p>
                                </div>

                                {/* Success Redirect URL (Optional) */}
                                <div className="space-y-2">
                                    <Label htmlFor="cashier-redirect-url">Success Redirect URL (Optional)</Label>
                                    <Input
                                        id="cashier-redirect-url"
                                        value={cashierForm.redirectUrl}
                                        onChange={(e) =>
                                            setCashierForm({ ...cashierForm, redirectUrl: e.target.value })
                                        }
                                        placeholder="https://yoursite.com/payment/success"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Where to redirect customers after successful payment (default: /payment/result)
                                    </p>
                                </div>

                                {/* Instructions */}
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <Info className="w-4 h-4" />
                                        Setup Instructions
                                    </h4>
                                    <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                                        <li>Sign up or log in to <a href="https://merchant.kashier.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Kashier Merchant Dashboard</a></li>
                                        <li>Go to Settings → API Keys to get your Merchant ID, API Key, and Secret Key</li>
                                        <li>Copy the Webhook URL above and add it in Settings → Webhooks</li>
                                        <li>Test with Sandbox mode first, then switch to Live mode when ready</li>
                                    </ol>
                                </div>

                                <Button type="submit" disabled={saving} className="w-full">
                                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    {cashier ? "Save Kashier Configuration" : "Create Kashier Configuration"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
