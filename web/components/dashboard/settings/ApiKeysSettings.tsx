"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ApiKeysSettings as ApiKeysSettingsType } from "@/store/services/settingsService";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import { Key, Eye, EyeOff, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ApiKeysSettingsProps {
    settings: ApiKeysSettingsType;
    updateSettings: (key: keyof ApiKeysSettingsType, value: any) => void;
    formLang: "en" | "ar";
}

export const ApiKeysSettings: React.FC<ApiKeysSettingsProps> = ({
    settings,
    updateSettings,
    formLang,
}) => {
    const { t } = useAdminLocale();
    const [showGeminiKey, setShowGeminiKey] = useState(false);
    const [showGoogleKey, setShowGoogleKey] = useState(false);

    // Initialize with defaults if undefined
    const apiKeysSettings = settings || {
        geminiApiKey: "",
        googleCloudCredentials: "",
    };

    return (
        <div className="space-y-6">
            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    {formLang === "ar"
                        ? "المفاتيح المحفوظة هنا يتم تشفيرها وتخزينها بشكل آمن في قاعدة البيانات. سيتم استخدامها تلقائيًا بدلاً من المتغيرات البيئية."
                        : "Keys saved here are encrypted and stored securely in the database. They will be used automatically instead of environment variables."}
                </AlertDescription>
            </Alert>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        {formLang === "ar" ? "مفتاح Gemini AI" : "Gemini AI Key"}
                    </CardTitle>
                    <CardDescription>
                        {formLang === "ar"
                            ? "مطلوب لإنشاء المقالات بالذكاء الاصطناعي. احصل عليه من Google AI Studio"
                            : "Required for AI article generation. Get it from Google AI Studio"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="gemini-api-key">
                            {formLang === "ar" ? "مفتاح API" : "API Key"}
                        </Label>
                        <div className="relative">
                            <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="gemini-api-key"
                                type={showGeminiKey ? "text" : "password"}
                                value={apiKeysSettings.geminiApiKey || ""}
                                onChange={(e) => updateSettings("geminiApiKey", e.target.value)}
                                placeholder={formLang === "ar" ? "أدخل مفتاح Gemini API" : "Enter Gemini API key"}
                                className="pl-9 pr-10"
                                dir="ltr"
                                autoComplete="off"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1 h-7 w-7 p-0"
                                onClick={() => setShowGeminiKey(!showGeminiKey)}
                            >
                                {showGeminiKey ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {formLang === "ar" ? (
                                <>
                                    احصل على المفتاح من:{" "}
                                    <a
                                        href="https://aistudio.google.com/apikey"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        Google AI Studio
                                    </a>
                                </>
                            ) : (
                                <>
                                    Get your key from:{" "}
                                    <a
                                        href="https://aistudio.google.com/apikey"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        Google AI Studio
                                    </a>
                                </>
                            )}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        {formLang === "ar" ? "بيانات اعتماد Google Cloud" : "Google Cloud Credentials"}
                    </CardTitle>
                    <CardDescription>
                        {formLang === "ar"
                            ? "اختياري. مطلوب لاستخدام خدمات Google Cloud مثل البحث عن الصور"
                            : "Optional. Required for using Google Cloud services like image search"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="google-cloud-credentials">
                            {formLang === "ar" ? "مفتاح API أو مسار ملف JSON" : "API Key or JSON File Path"}
                        </Label>
                        <div className="relative">
                            <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="google-cloud-credentials"
                                type={showGoogleKey ? "text" : "password"}
                                value={apiKeysSettings.googleCloudCredentials || ""}
                                onChange={(e) => updateSettings("googleCloudCredentials", e.target.value)}
                                placeholder={
                                    formLang === "ar"
                                        ? "أدخل مفتاح API أو مسار الملف"
                                        : "Enter API key or file path"
                                }
                                className="pl-9 pr-10"
                                dir="ltr"
                                autoComplete="off"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1 h-7 w-7 p-0"
                                onClick={() => setShowGoogleKey(!showGoogleKey)}
                            >
                                {showGoogleKey ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {formLang === "ar"
                                ? "يمكنك إدخال مفتاح API أو مسار ملف JSON الخاص بحساب الخدمة"
                                : "You can enter an API key or path to a service account JSON file"}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Alert variant="default" className="bg-amber-50 border-amber-200 dark:bg-amber-950/20">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-300">
                    {formLang === "ar" ? (
                        <>
                            <strong>ملاحظة أمنية:</strong> يتم تشفير المفاتيح قبل حفظها في قاعدة البيانات. 
                            إذا كان لديك مفاتيح محفوظة في ملف .env، سيتم استخدام المفاتيح من الداشبورد بالأولوية.
                        </>
                    ) : (
                        <>
                            <strong>Security Note:</strong> Keys are encrypted before saving to the database.
                            If you have keys saved in .env file, dashboard keys will take priority.
                        </>
                    )}
                </AlertDescription>
            </Alert>
        </div>
    );
};
