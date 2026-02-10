import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface ReviewsSectionSettings {
    isEnabled?: boolean;
    title?: { ar: string; en: string };
    subtitle?: { ar: string; en: string };
    showRating?: boolean;
    showDate?: boolean;
    displayCount?: number;
    useFakeReviews?: boolean;
    fakeReviews?: Array<{
        name: string;
        comment: string;
        rating: number;
    }>;
}

interface ReviewsSectionSettingsProps {
    settings: ReviewsSectionSettings;
    onChange: (settings: ReviewsSectionSettings) => void;
    lang: "ar" | "en";
}

export function ReviewsSectionSettings({ settings, onChange, lang }: ReviewsSectionSettingsProps) {
    // Helper functions for fake reviews
    const addFakeReview = () => {
        onChange({
            ...settings,
            fakeReviews: [
                ...(settings.fakeReviews || []),
                { name: "", comment: "", rating: 5 }
            ]
        });
    };

    const removeFakeReview = (index: number) => {
        const newReviews = settings.fakeReviews?.filter((_, i) => i !== index) || [];
        onChange({ ...settings, fakeReviews: newReviews });
    };

    const updateFakeReview = (index: number, field: string, value: any) => {
        const newReviews = settings.fakeReviews?.map((review, i) => {
            if (i !== index) return review;
            return { ...review, [field]: value };
        }) || [];
        onChange({ ...settings, fakeReviews: newReviews });
    };

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
                                    title: {
                                        ar: e.target.value,
                                        en: settings.title?.en || ""
                                    },
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
                                    title: {
                                        ar: settings.title?.ar || "",
                                        en: e.target.value
                                    },
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
                                    subtitle: {
                                        ar: e.target.value,
                                        en: settings.subtitle?.en || ""
                                    },
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
                                    subtitle: {
                                        ar: settings.subtitle?.ar || "",
                                        en: e.target.value
                                    },
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

                {/* Fake Reviews Section */}
                <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="use-fake-reviews">Use Demo Reviews</Label>
                            <p className="text-sm text-muted-foreground">
                                Show demo reviews when no real reviews exist
                            </p>
                        </div>
                        <Switch
                            id="use-fake-reviews"
                            checked={settings.useFakeReviews || false}
                            onCheckedChange={(checked) =>
                                onChange({ ...settings, useFakeReviews: checked })
                            }
                        />
                    </div>

                    {/* Fake Reviews List */}
                    {settings.useFakeReviews && (
                        <div className="space-y-4 mt-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Demo Reviews</Label>
                                <Button onClick={addFakeReview} size="sm" type="button">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Review
                                </Button>
                            </div>

                            {settings.fakeReviews && settings.fakeReviews.length > 0 ? (
                                <div className="space-y-4">
                                    {settings.fakeReviews.map((review, index) => (
                                        <Card key={index} className="p-4 bg-muted/50">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <Label className="text-sm font-medium">Demo Review #{index + 1}</Label>
                                                    <Button
                                                        onClick={() => removeFakeReview(index)}
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        type="button"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-sm">Reviewer Name</Label>
                                                    <Input
                                                        placeholder="أحمد محمد"
                                                        value={review.name || ""}
                                                        onChange={(e) =>
                                                            updateFakeReview(index, "name", e.target.value)
                                                        }
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-sm">Review Comment</Label>
                                                    <Textarea
                                                        placeholder="منصة رائعة ساعدتني كثيراً في حفظ القرآن"
                                                        value={review.comment || ""}
                                                        onChange={(e) =>
                                                            updateFakeReview(index, "comment", e.target.value)
                                                        }
                                                        rows={3}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-sm">Rating</Label>
                                                    <Select
                                                        value={String(review.rating || 5)}
                                                        onValueChange={(value) =>
                                                            updateFakeReview(index, "rating", parseInt(value))
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {[5, 4, 3, 2, 1].map((r) => (
                                                                <SelectItem key={r} value={String(r)}>
                                                                    {r} ⭐ Stars
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p className="text-sm">No demo reviews added yet.</p>
                                    <p className="text-xs mt-1">Click "Add Review" to create demo reviews.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
