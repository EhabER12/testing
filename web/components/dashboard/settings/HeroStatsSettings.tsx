"use client";

import React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Briefcase, TrendingUp, Globe } from "lucide-react";
import { HeroStatsSettings as HeroStatsSettingsType } from "@/store/services/settingsService";

interface HeroStatsSettingsProps {
    heroStats: HeroStatsSettingsType;
    setHeroStats: React.Dispatch<React.SetStateAction<HeroStatsSettingsType>>;
    isRtl: boolean;
}

export function HeroStatsSettings({
    heroStats,
    setHeroStats,
    isRtl,
}: HeroStatsSettingsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {isRtl ? "إحصائيات Hero Section" : "Hero Section Statistics"}
                </CardTitle>
                <CardDescription>
                    {isRtl
                        ? "تخصيص الأرقام والنصوص المعروضة في قسم الإحصائيات بالـ Hero Section"
                        : "Customize the numbers and labels displayed in the Hero Section statistics bar"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Enable toggle */}
                <div className="flex items-center justify-between">
                    <Label>
                        {isRtl
                            ? "تفعيل الإحصائيات المخصصة"
                            : "Enable Custom Statistics"}
                    </Label>
                    <Switch
                        checked={heroStats.enabled}
                        onCheckedChange={(checked) =>
                            setHeroStats({ ...heroStats, enabled: checked })
                        }
                    />
                </div>

                {/* Projects Stat */}
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        {isRtl ? "المشاريع / Projects" : "Projects / المشاريع"}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label>{isRtl ? "القيمة" : "Value"}</Label>
                            <Input
                                value={heroStats.projects.value}
                                onChange={(e) =>
                                    setHeroStats({
                                        ...heroStats,
                                        projects: { ...heroStats.projects, value: e.target.value },
                                    })
                                }
                                placeholder="+1000"
                                disabled={!heroStats.enabled}
                            />
                        </div>
                        <div>
                            <Label>{isRtl ? "النص (عربي)" : "Label (Arabic)"}</Label>
                            <Input
                                value={heroStats.projects.label.ar}
                                onChange={(e) =>
                                    setHeroStats({
                                        ...heroStats,
                                        projects: {
                                            ...heroStats.projects,
                                            label: { ...heroStats.projects.label, ar: e.target.value },
                                        },
                                    })
                                }
                                placeholder="ختمة"
                                disabled={!heroStats.enabled}
                            />
                        </div>
                        <div>
                            <Label>{isRtl ? "النص (English)" : "Label (English)"}</Label>
                            <Input
                                value={heroStats.projects.label.en}
                                onChange={(e) =>
                                    setHeroStats({
                                        ...heroStats,
                                        projects: {
                                            ...heroStats.projects,
                                            label: { ...heroStats.projects.label, en: e.target.value },
                                        },
                                    })
                                }
                                placeholder="Projects"
                                disabled={!heroStats.enabled}
                            />
                        </div>
                    </div>
                </div>

                {/* Growth Stat */}
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        {isRtl ? "النمو / Growth" : "Growth / النمو"}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label>{isRtl ? "القيمة" : "Value"}</Label>
                            <Input
                                value={heroStats.growth.value}
                                onChange={(e) =>
                                    setHeroStats({
                                        ...heroStats,
                                        growth: { ...heroStats.growth, value: e.target.value },
                                    })
                                }
                                placeholder="+250"
                                disabled={!heroStats.enabled}
                            />
                        </div>
                        <div>
                            <Label>{isRtl ? "النص (عربي)" : "Label (Arabic)"}</Label>
                            <Input
                                value={heroStats.growth.label.ar}
                                onChange={(e) =>
                                    setHeroStats({
                                        ...heroStats,
                                        growth: {
                                            ...heroStats.growth,
                                            label: { ...heroStats.growth.label, ar: e.target.value },
                                        },
                                    })
                                }
                                placeholder="طالب جديد"
                                disabled={!heroStats.enabled}
                            />
                        </div>
                        <div>
                            <Label>{isRtl ? "النص (English)" : "Label (English)"}</Label>
                            <Input
                                value={heroStats.growth.label.en}
                                onChange={(e) =>
                                    setHeroStats({
                                        ...heroStats,
                                        growth: {
                                            ...heroStats.growth,
                                            label: { ...heroStats.growth.label, en: e.target.value },
                                        },
                                    })
                                }
                                placeholder="New Students"
                                disabled={!heroStats.enabled}
                            />
                        </div>
                    </div>
                </div>

                {/* Countries Stat */}
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        {isRtl ? "البلدان / Countries" : "Countries / البلدان"}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label>{isRtl ? "القيمة" : "Value"}</Label>
                            <Input
                                value={heroStats.countries.value}
                                onChange={(e) =>
                                    setHeroStats({
                                        ...heroStats,
                                        countries: { ...heroStats.countries, value: e.target.value },
                                    })
                                }
                                placeholder="6"
                                disabled={!heroStats.enabled}
                            />
                        </div>
                        <div>
                            <Label>{isRtl ? "النص (عربي)" : "Label (Arabic)"}</Label>
                            <Input
                                value={heroStats.countries.label.ar}
                                onChange={(e) =>
                                    setHeroStats({
                                        ...heroStats,
                                        countries: {
                                            ...heroStats.countries,
                                            label: { ...heroStats.countries.label, ar: e.target.value },
                                        },
                                    })
                                }
                                placeholder="دول"
                                disabled={!heroStats.enabled}
                            />
                        </div>
                        <div>
                            <Label>{isRtl ? "النص (English)" : "Label (English)"}</Label>
                            <Input
                                value={heroStats.countries.label.en}
                                onChange={(e) =>
                                    setHeroStats({
                                        ...heroStats,
                                        countries: {
                                            ...heroStats.countries,
                                            label: { ...heroStats.countries.label, en: e.target.value },
                                        },
                                    })
                                }
                                placeholder="Countries"
                                disabled={!heroStats.enabled}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
