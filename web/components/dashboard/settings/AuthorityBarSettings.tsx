import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface AuthorityBarItem {
    icon: string;
    text: { ar: string; en: string };
}

interface AuthorityBarSettings {
    isEnabled: boolean;
    title: { ar: string; en: string };
    items: AuthorityBarItem[];
}

interface AuthorityBarSettingsProps {
    settings: AuthorityBarSettings;
    onChange: (settings: AuthorityBarSettings) => void;
    lang: "ar" | "en";
}

const iconOptions = [
    { value: "shield", label: "Shield (حماية)" },
    { value: "users", label: "Users (مستخدمين)" },
    { value: "award", label: "Award (جائزة)" },
    { value: "check", label: "Check (صح)" },
    { value: "star", label: "Star (نجمة)" },
];

export function AuthorityBarSettings({ settings, onChange, lang }: AuthorityBarSettingsProps) {
    const addItem = () => {
        onChange({
            ...settings,
            items: [
                ...settings.items,
                {
                    icon: "shield",
                    text: { ar: "", en: "" },
                },
            ],
        });
    };

    const removeItem = (index: number) => {
        const newItems = settings.items.filter((_, i) => i !== index);
        onChange({ ...settings, items: newItems });
    };

    const updateItem = (index: number, field: "icon" | "text", value: any) => {
        const newItems = [...settings.items];
        if (field === "icon") {
            newItems[index].icon = value;
        } else {
            newItems[index].text = value;
        }
        onChange({ ...settings, items: newItems });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Authority Bar Settings</CardTitle>
                        <CardDescription>
                            Platform recognition badges - شارات التقدير والثقة
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="authority-enabled">Enable Section</Label>
                        <Switch
                            id="authority-enabled"
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
                            placeholder="موثوق من قبل المؤسسات الرائدة"
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
                            placeholder="Trusted by Leading Institutions"
                        />
                    </div>
                </div>

                {/* Items */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Trust Badges / Items</Label>
                        <Button onClick={addItem} size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                        </Button>
                    </div>

                    {settings.items && settings.items.length > 0 ? (
                        <div className="space-y-4">
                            {settings.items.map((item, index) => (
                                <Card key={index} className="p-4">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium">Item #{index + 1}</Label>
                                            <Button
                                                onClick={() => removeItem(index)}
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
                                                value={item.icon}
                                                onValueChange={(value) => updateItem(index, "icon", value)}
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

                                        {/* Text bilingual */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Text (Arabic)</Label>
                                                <Input
                                                    value={item.text?.ar || ""}
                                                    onChange={(e) =>
                                                        updateItem(index, "text", {
                                                            ...item.text,
                                                            ar: e.target.value,
                                                        })
                                                    }
                                                    placeholder="نص شارة التقدير"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Text (English)</Label>
                                                <Input
                                                    value={item.text?.en || ""}
                                                    onChange={(e) =>
                                                        updateItem(index, "text", {
                                                            ...item.text,
                                                            en: e.target.value,
                                                        })
                                                    }
                                                    placeholder="Trust badge text"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No items added yet. Click "Add Item" to create trust badges.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
