"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmailSettings as EmailSettingsType } from "@/store/services/settingsService";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import { Mail, Lock, Server, User } from "lucide-react";

interface EmailSettingsProps {
    settings: EmailSettingsType;
    updateSettings: (key: keyof EmailSettingsType, value: any) => void;
    formLang: "en" | "ar";
}

export const EmailSettings: React.FC<EmailSettingsProps> = ({
    settings,
    updateSettings,
    formLang,
}) => {
    const { t } = useAdminLocale();

    // Initialize with defaults if undefined
    const emailSettings = settings || {
        enabled: false,
        host: "",
        port: 587,
        secure: false,
        user: "",
        pass: "",
        fromName: "Genoun",
        fromEmail: "",
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                {formLang === "ar" ? "إعدادات البريد الإلكتروني (SMTP)" : "Email Settings (SMTP)"}
                            </CardTitle>
                            <CardDescription>
                                {formLang === "ar"
                                    ? "قم بتكوين إعدادات خادم البريد لإرسال الإشعارات ورسائل النظام"
                                    : "Configure SMTP server settings for sending notifications and system emails"}
                            </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="email-enabled">
                                {formLang === "ar" ? "تفعيل البريد" : "Enable Email"}
                            </Label>
                            <Switch
                                id="email-enabled"
                                checked={emailSettings.enabled}
                                onCheckedChange={(checked) => updateSettings("enabled", checked)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>{formLang === "ar" ? "خادم SMTP" : "SMTP Host"}</Label>
                            <div className="relative">
                                <Server className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={emailSettings.host}
                                    onChange={(e) => updateSettings("host", e.target.value)}
                                    placeholder="smtp.example.com"
                                    className="pl-9"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{formLang === "ar" ? "المنفذ (Port)" : "SMTP Port"}</Label>
                            <Input
                                type="number"
                                value={emailSettings.port}
                                onChange={(e) => updateSettings("port", Number(e.target.value))}
                                placeholder="587"
                                dir="ltr"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{formLang === "ar" ? "اسم المستخدم" : "Username"}</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={emailSettings.user}
                                    onChange={(e) => updateSettings("user", e.target.value)}
                                    placeholder="user@example.com"
                                    className="pl-9"
                                    dir="ltr"
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{formLang === "ar" ? "كلمة المرور" : "Password"}</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="password"
                                    value={emailSettings.pass}
                                    onChange={(e) => updateSettings("pass", e.target.value)}
                                    placeholder="••••••••"
                                    className="pl-9"
                                    dir="ltr"
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{formLang === "ar" ? "اسم المرسل" : "From Name"}</Label>
                            <Input
                                value={emailSettings.fromName}
                                onChange={(e) => updateSettings("fromName", e.target.value)}
                                placeholder="Genoun Support"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{formLang === "ar" ? "بريد المرسل" : "From Email"}</Label>
                            <Input
                                value={emailSettings.fromEmail}
                                onChange={(e) => updateSettings("fromEmail", e.target.value)}
                                placeholder="no-reply@genoun.com"
                                dir="ltr"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 rounded-lg border p-4">
                        <Switch
                            id="email-secure"
                            checked={emailSettings.secure}
                            onCheckedChange={(checked) => updateSettings("secure", checked)}
                        />
                        <div className="flex flex-col">
                            <Label htmlFor="email-secure">
                                {formLang === "ar" ? "اتصال آمن (SSL/TLS)" : "Secure Connection (SSL/TLS)"}
                            </Label>
                            <span className="text-sm text-muted-foreground">
                                {formLang === "ar"
                                    ? "قم بتفعيله إذا كنت تستخدم المنفذ 465"
                                    : "Enable this if you are using port 465"}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
