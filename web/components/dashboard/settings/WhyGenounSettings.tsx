import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface WhyGenounFeature {
    icon: string;
    title: { ar: string; en: string };
    description: { ar: string; en: string };
}

interface WhyGenounSettings {
    isEnabled: boolean;
    title: { ar: string; en: string };
    titleHighlight: { ar: string; en: string };
    subtitle: { ar: string; en: string };
    features: WhyGenounFeature[];
}

interface WhyGenounSettingsProps {
    settings: WhyGenounSettings;
    onChange: (settings: WhyGenounSettings) => void;
    lang: "ar" | "en";
}

const iconOptions = [
    { value: "book", label: "Book (كتاب)" },
    { value: "users", label: "Users (مستخدمين)" },
    { value: "award", label: "Award (جائزة)" },
    { value: "video", label: "Video (فيديو)" },
    { value: "check", label: "Check (صح)" },
    { value: "star", label: "Star (نجمة)" },
    { value: "shield", label: "Shield (حماية)" },
    { value: "heart", label: "Heart (قلب)" },
    { value: "lightbulb", label: "Lightbulb (فكرة)" },
    { value: "clock", label: "Clock (ساعة)" },
];

export function WhyGenounSettings({ settings, onChange, lang }: WhyGenounSettingsProps) {
    const addFeature = () => {
        onChange({
            ...settings,
            features: [
                ...settings.features,
                {
                    icon: "book",
                    title: { ar: "", en: "" },
                    description: { ar: "", en: "" },
                },
            ],
        });
    };

    const removeFeature = (index: number) => {
        const newFeatures = settings.features.filter((_, i) => i !== index);
        onChange({ ...settings, features: newFeatures });
    };

    const updateFeature = (index: number, field: "icon" | "title" | "description", value: any) => {
        const newFeatures = [...settings.features];
        if (field === "icon") {
            newFeatures[index].icon = value;
        } else if (field === "title") {
            newFeatures[index].title = value;
        } else {
            newFeatures[index].description = value;
        }
        onChange({ ...settings, features: newFeatures });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Why Genoun Section Settings</CardTitle>
                        <CardDescription>
                            Platform features and value proposition - المميزات والقيمة المقدمة
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="whygenoun-enabled">Enable Section</Label>
                        <Switch
                            id="whygenoun-enabled"
                            checked={settings.isEnabled}
                            onCheckedChange={(checked) =>
                                onChange({ ...settings, isEnabled: checked })
                            }
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Title */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Title (Arabic)</Label>
                        <Input
                            value={settings.title?.ar || ""}
                            onChange={(e) =>
                                onChange({
                                    ...settings,
                                    title: { ...settings.title, ar: e.target.value },
                                })
                            }
                            placeholder="لماذا تختار"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Title (English)</Label>
                        <Input
                            value={settings.title?.en || ""}
                            onChange={(e) =>
                                onChange({
                                    ...settings,
                                    title: { ...settings.title, en: e.target.value },
                                })
                            }
                            placeholder="Why Choose"
                        />
                    </div>
                </div>

                {/* Title Highlight (the colored part) */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Title Highlight (Arabic) - الجزء الملون</Label>
                        <Input
                            value={settings.titleHighlight?.ar || ""}
                            onChange={(e) =>
                                onChange({
                                    ...settings,
                                    titleHighlight: { ...settings.titleHighlight, ar: e.target.value },
                                })
                            }
                            placeholder="منصة جنون"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Title Highlight (English) - Colored part</Label>
                        <Input
                            value={settings.titleHighlight?.en || ""}
                            onChange={(e) =>
                                onChange({
                                    ...settings,
                                    titleHighlight: { ...settings.titleHighlight, en: e.target.value },
                                })
                            }
                            placeholder="Genoun Platform"
                        />
                    </div>
                </div>

                {/* Subtitle */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Subtitle (Arabic)</Label>
                        <Input
                            value={settings.subtitle?.ar || ""}
                            onChange={(e) =>
                                onChange({
                                    ...settings,
                                    subtitle: { ...settings.subtitle, ar: e.target.value },
                                })
                            }
                            placeholder="منصة متكاملة لحفظ القرآن الكريم"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Subtitle (English)</Label>
                        <Input
                            value={settings.subtitle?.en || ""}
                            onChange={(e) =>
                                onChange({
                                    ...settings,
                                    subtitle: { ...settings.subtitle, en: e.target.value },
                                })
                            }
                            placeholder="Complete platform for Quran memorization"
                        />
                    </div>
                </div>

                {/* Features */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Features / Value Points</Label>
                        <Button onClick={addFeature} size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Feature
                        </Button>
                    </div>

                    {settings.features && settings.features.length > 0 ? (
                        <div className="space-y-4">
                            {settings.features.map((feature, index) => (
                                <Card key={index} className="p-4">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium">Feature #{index + 1}</Label>
                                            <Button
                                                onClick={() => removeFeature(index)}
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* Icon Selector */}
                                        <div className="space-y-2">
                                            <Label>Icon</Label>
                                            <Select
                                                value={feature.icon}
                                                onValueChange={(value) => updateFeature(index, "icon", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {iconOptions.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Title bilingual */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Title (Arabic)</Label>
                                                <Input
                                                    value={feature.title?.ar || ""}
                                                    onChange={(e) =>
                                                        updateFeature(index, "title", {
                                                            ...feature.title,
                                                            ar: e.target.value,
                                                        })
                                                    }
                                                    placeholder="عنوان الميزة"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Title (English)</Label>
                                                <Input
                                                    value={feature.title?.en || ""}
                                                    onChange={(e) =>
                                                        updateFeature(index, "title", {
                                                            ...feature.title,
                                                            en: e.target.value,
                                                        })
                                                    }
                                                    placeholder="Feature title"
                                                />
                                            </div>
                                        </div>

                                        {/* Description bilingual */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Description (Arabic)</Label>
                                                <Textarea
                                                    value={feature.description?.ar || ""}
                                                    onChange={(e) =>
                                                        updateFeature(index, "description", {
                                                            ...feature.description,
                                                            ar: e.target.value,
                                                        })
                                                    }
                                                    placeholder="وصف الميزة"
                                                    rows={3}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Description (English)</Label>
                                                <Textarea
                                                    value={feature.description?.en || ""}
                                                    onChange={(e) =>
                                                        updateFeature(index, "description", {
                                                            ...feature.description,
                                                            en: e.target.value,
                                                        })
                                                    }
                                                    placeholder="Feature description"
                                                    rows={3}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No features added yet. Click "Add Feature" to create value points.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
