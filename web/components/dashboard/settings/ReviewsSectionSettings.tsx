import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface ReviewsSectionSettings {
    isEnabled: boolean;
    title: { ar: string; en: string };
    subtitle: { ar: string; en: string };
    showRating: boolean;
    showDate: boolean;
    displayCount: number;
}

interface ReviewsSectionSettingsProps {
    settings: ReviewsSectionSettings;
    onChange: (settings: ReviewsSectionSettings) => void;
    lang: "ar" | "en";
}

export function ReviewsSectionSettings({ settings, onChange, lang }: ReviewsSectionSettingsProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Reviews Section Settings</CardTitle>
                        <CardDescription>
                            Student testimonials and reviews - آراء وتقييمات الطلاب
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="reviews-enabled">Enable Section</Label>
                        <Switch
                            id="reviews-enabled"
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
                            placeholder="آراء طلابنا"
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
                            placeholder="Student Reviews"
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
                            placeholder="ماذا يقول طلابنا عنا"
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
                            placeholder="What our students say about us"
                        />
                    </div>
                </div>

                {/* Display Options */}
                <div className="space-y-4 border-t pt-4">
                    <Label className="text-base font-semibold">Display Options</Label>

                    {/* Show Rating */}
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="show-rating">Show Rating Stars</Label>
                            <p className="text-sm text-muted-foreground">
                                Display star ratings in reviews
                            </p>
                        </div>
                        <Switch
                            id="show-rating"
                            checked={settings.showRating}
                            onCheckedChange={(checked) =>
                                onChange({ ...settings, showRating: checked })
                            }
                        />
                    </div>

                    {/* Show Date */}
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="show-date">Show Review Date</Label>
                            <p className="text-sm text-muted-foreground">
                                Display when the review was posted
                            </p>
                        </div>
                        <Switch
                            id="show-date"
                            checked={settings.showDate}
                            onCheckedChange={(checked) =>
                                onChange({ ...settings, showDate: checked })
                            }
                        />
                    </div>

                    {/* Display Count */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Number of Reviews to Display</Label>
                            <span className="text-sm font-medium">{settings.displayCount}</span>
                        </div>
                        <Slider
                            value={[settings.displayCount || 6]}
                            onValueChange={(value) =>
                                onChange({ ...settings, displayCount: value[0] })
                            }
                            min={1}
                            max={20}
                            step={1}
                            className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                            1 - 20 reviews (currently: {settings.displayCount})
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
