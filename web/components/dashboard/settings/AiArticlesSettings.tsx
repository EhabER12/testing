"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchAiSettings,
  saveAiSettings,
  fetchAiProgress,
  addTitles,
  removeTitle,
  testPrompt,
  generateNow,
  resetStatus,
  clearTestResult,
} from "@/store/slices/aiArticleSettingsSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TagsInput } from "@/components/ui/tags-input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  Plus,
  Trash2,
  Play,
  RefreshCcw,
  Sparkles,
  MessageSquare,
  Image as ImageIcon,
  Globe,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  FileText,
  Send,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";

interface FormData {
  promptTemplate: string;
  numberOfParagraphs: number;
  averageWordsPerParagraph: number;
  targetKeywords: string[];
  language: "ar" | "en";
  includeImages: boolean;
  includeCoverImage: boolean;
  imageSearchKeywords: string[];
  autoPublish: boolean;
  totalArticlesNeeded: number;
  articlesPerDay: number;
  startDate: string;
  generationTime: string;
  whatsappNotificationNumbers: string[];
  notifyOnCompletion: boolean;
  isActive: boolean;
}

const defaultPromptTemplate = `Role & Mindset (Mandatory):
You are a senior content strategist and professional human writer, not an AI.
Write as if you have real-world experience, editorial judgment, and market awareness.
Avoid generic phrasing, filler language, robotic transitions, or predictable AI patterns.
Your writing must sound naturally human, confident, persuasive, and commercially aware, suitable for a senior Saudi / GCC market audience.

Task:
Write a high-quality, professional blog article about:
Title: {{title}}

Language & Audience:
- Write in {{language}}
- Target a senior, educated, decision-making audience
- Assume readers are knowledgeable and expect depth, clarity, and authority

Content Structure Requirements:
- Total paragraphs: {{paragraphs}}
- Each paragraph: approximately {{wordsPerParagraph}} words
- Include a strong introduction that establishes context, relevance, and value
- Include a clear conclusion that reinforces insights and leaves a lasting impression
- Use a logical narrative flow, not formulaic blog structure

SEO & Keyword Strategy:
- Naturally integrate these keywords without forced repetition: {{keywords}}
- Use semantic variations, synonyms, and contextual phrasing
- Optimize for search intent, not keyword stuffing
- Content must be SEO-friendly but editorial-grade, as if written for a premium publication

Headings & Formatting:
- Use proper heading hierarchy (H2 for main sections, H3 for subsections)
- Headings must be informative and compelling, not generic
- Paragraphs should be scannable, well-paced, and varied in sentence length
- Use bullet points only when they add clarity, not as filler

Tone & Style Guidelines:
- Professional, authoritative, and engaging
- Write like a human expert, not a content generator
- Avoid: Overused AI phrases ("In today's fast-paced world", "Moreover", "Furthermore"), repetitive sentence structures, over-explaining obvious concepts
- Include: Natural transitions, subtle persuasion, confident experience-based language

Human Authenticity Rules (Critical):
- Vary sentence rhythm and paragraph length
- Show judgment: emphasize what matters, skip what doesn't
- Do not sound neutral or generic — sound intentional
- Write as if this article reflects your personal professional reputation

Quality Benchmark:
The final article should feel like it was written by a senior SEO consultant, content director, or subject-matter expert — not by an AI or entry-level writer.`;

export function AiArticlesSettings() {
  const dispatch = useAppDispatch();
  const { t, isRtl } = useAdminLocale();
  const {
    settings,
    progress,
    isLoading,
    isSuccess,
    isError,
    message,
    isTesting,
    isGenerating,
    testResult,
  } = useAppSelector((state) => state.aiArticleSettings);

  const [formData, setFormData] = useState<FormData>({
    promptTemplate: defaultPromptTemplate,
    numberOfParagraphs: 5,
    averageWordsPerParagraph: 150,
    targetKeywords: [],
    language: "ar",
    includeImages: true,
    includeCoverImage: true,
    imageSearchKeywords: [],
    autoPublish: false,
    totalArticlesNeeded: 10,
    articlesPerDay: 1,
    startDate: new Date().toISOString().split("T")[0],
    generationTime: "09:00",
    whatsappNotificationNumbers: [],
    notifyOnCompletion: true,
    isActive: false,
  });

  const [newTitle, setNewTitle] = useState("");
  const [newTitles, setNewTitles] = useState<string[]>([]);
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [testTitle, setTestTitle] = useState("");

  useEffect(() => {
    dispatch(fetchAiSettings());
    dispatch(fetchAiProgress());
  }, [dispatch]);

  useEffect(() => {
    if (settings) {
      setFormData({
        // Only use default if promptTemplate is undefined/null, not empty string
        promptTemplate:
          settings.promptTemplate !== undefined &&
          settings.promptTemplate !== null
            ? settings.promptTemplate
            : defaultPromptTemplate,
        numberOfParagraphs: settings.numberOfParagraphs ?? 5,
        averageWordsPerParagraph: settings.averageWordsPerParagraph ?? 150,
        targetKeywords: settings.targetKeywords ?? [],
        language: settings.language ?? "ar",
        includeImages: settings.includeImages ?? true,
        includeCoverImage: settings.includeCoverImage ?? true,
        imageSearchKeywords: settings.imageSearchKeywords ?? [],
        autoPublish: settings.autoPublish ?? false,
        totalArticlesNeeded: settings.totalArticlesNeeded ?? 10,
        articlesPerDay: settings.articlesPerDay ?? 1,
        startDate:
          settings.startDate?.split("T")[0] ??
          new Date().toISOString().split("T")[0],
        generationTime: settings.generationTime ?? "09:00",
        whatsappNotificationNumbers: settings.whatsappNotificationNumbers ?? [],
        notifyOnCompletion: settings.notifyOnCompletion ?? true,
        isActive: settings.isActive ?? false,
      });
    }
  }, [settings]);

  useEffect(() => {
    if (isSuccess && message) {
      toast.success(message);
      dispatch(resetStatus());
    }
    if (isError && message) {
      toast.error(message);
      dispatch(resetStatus());
    }
  }, [isSuccess, isError, message, dispatch]);

  // Auto-redirect to edit page when test is successful
  useEffect(() => {
    if (testResult?.article?.slug) {
      toast.success(
        isRtl ? "تم إنشاء المقال بنجاح!" : "Article created successfully!"
      );
      window.location.href = `/dashboard/articles/${testResult.article.slug}/edit`;
    }
  }, [testResult, isRtl]);

  const handleSave = () => {
    dispatch(saveAiSettings(formData));
  };

  const handleAddTitle = () => {
    if (newTitle.trim()) {
      setNewTitles([...newTitles, newTitle.trim()]);
      setNewTitle("");
    }
  };

  const handleAddTitlesSubmit = () => {
    if (newTitles.length > 0) {
      dispatch(addTitles(newTitles));
      setNewTitles([]);
    }
  };

  const handleRemoveNewTitle = (index: number) => {
    setNewTitles(newTitles.filter((_, i) => i !== index));
  };

  const handleRemoveExistingTitle = (id: string) => {
    dispatch(removeTitle(id));
  };

  const handleAddPhoneNumber = () => {
    if (newPhoneNumber.trim()) {
      setFormData({
        ...formData,
        whatsappNotificationNumbers: [
          ...formData.whatsappNotificationNumbers,
          newPhoneNumber.trim(),
        ],
      });
      setNewPhoneNumber("");
    }
  };

  const handleRemovePhoneNumber = (index: number) => {
    setFormData({
      ...formData,
      whatsappNotificationNumbers: formData.whatsappNotificationNumbers.filter(
        (_, i) => i !== index
      ),
    });
  };

  const handleTestPrompt = () => {
    dispatch(
      testPrompt({
        promptTemplate: formData.promptTemplate,
        sampleTitle: testTitle || "عنوان تجريبي للمقال",
        settings: {
          numberOfParagraphs: formData.numberOfParagraphs,
          averageWordsPerParagraph: formData.averageWordsPerParagraph,
          targetKeywords: formData.targetKeywords,
          language: formData.language,
        },
      })
    );
  };

  const handleGenerateNow = () => {
    dispatch(generateNow(1));
  };

  const unusedTitles = settings?.readyTitles?.filter((t) => !t.used) || [];
  const usedTitles = settings?.readyTitles?.filter((t) => t.used) || [];

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Progress Overview */}
      {progress?.configured && (
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {isRtl ? "نظرة عامة على التقدم" : "Progress Overview"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {progress.generated}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isRtl ? "تم التوليد" : "Generated"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-muted-foreground">
                  {progress.remaining}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isRtl ? "المتبقي" : "Remaining"}
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">
                  {progress.completedToday}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isRtl ? "اليوم" : "Today"}
                </div>
              </div>
            </div>
            <Progress value={progress.progressPercentage} className="h-3" />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>
                {progress.progressPercentage}% {isRtl ? "مكتمل" : "Complete"}
              </span>
              <span
                className={
                  progress.unusedTitles === 0
                    ? "text-destructive font-medium"
                    : ""
                }
              >
                {progress.unusedTitles}{" "}
                {isRtl ? "عناوين متاحة" : "titles available"}
              </span>
            </div>
            {/* Warning when no titles */}
            {progress.unusedTitles === 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {isRtl ? "لا توجد عناوين!" : "No titles available!"}
                </AlertTitle>
                <AlertDescription>
                  {isRtl
                    ? 'أضف عناوين في تبويب "العناوين" لتتمكن من توليد المقالات.'
                    : 'Add titles in the "Titles" tab to generate articles.'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="gap-2">
            <Button
              onClick={handleGenerateNow}
              disabled={isGenerating || progress.unusedTitles === 0}
              className="gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {isRtl ? "توليد الآن" : "Generate Now"}
            </Button>
            <Badge variant={progress.isActive ? "default" : "secondary"}>
              {progress.isActive
                ? isRtl
                  ? "نشط"
                  : "Active"
                : isRtl
                ? "متوقف"
                : "Paused"}
            </Badge>
          </CardFooter>
        </Card>
      )}

      <Tabs defaultValue="prompt" dir={isRtl ? "rtl" : "ltr"}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="prompt" className="gap-1">
            <FileText className="h-4 w-4" />
            <span className="hidden md:inline">
              {isRtl ? "القالب" : "Prompt"}
            </span>
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-1">
            <Sparkles className="h-4 w-4" />
            <span className="hidden md:inline">
              {isRtl ? "الإعدادات" : "Config"}
            </span>
          </TabsTrigger>
          <TabsTrigger value="titles" className="gap-1">
            <FileText className="h-4 w-4" />
            <span className="hidden md:inline">
              {isRtl ? "العناوين" : "Titles"}
            </span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1">
            <Calendar className="h-4 w-4" />
            <span className="hidden md:inline">
              {isRtl ? "الجدولة" : "Schedule"}
            </span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden md:inline">
              {isRtl ? "الإشعارات" : "Notify"}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Prompt Template Tab */}
        <TabsContent value="prompt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isRtl ? "قالب الأمر" : "Prompt Template"}</CardTitle>
              <CardDescription>
                {isRtl
                  ? "أدخل قالب الأمر مع المتغيرات المتاحة"
                  : "Enter the prompt template with available variables"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="mb-4">
                <Label className="text-sm font-medium mb-2 block">
                  {isRtl ? "المتغيرات المتاحة:" : "Available Variables:"}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "{{title}}",
                    "{{keywords}}",
                    "{{paragraphs}}",
                    "{{wordsPerParagraph}}",
                    "{{language}}",
                    "{{siteName}}",
                    "{{siteDescription}}",
                  ].map((v) => (
                    <Badge
                      key={v}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          promptTemplate: formData.promptTemplate + " " + v,
                        });
                      }}
                    >
                      {v}
                    </Badge>
                  ))}
                </div>
              </div>
              <Textarea
                value={formData.promptTemplate}
                onChange={(e) =>
                  setFormData({ ...formData, promptTemplate: e.target.value })
                }
                className="min-h-[300px] font-mono text-sm"
                dir="ltr"
              />
            </CardContent>
          </Card>

          {/* Test Prompt Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                {isRtl ? "اختبار القالب" : "Test Prompt"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder={isRtl ? "عنوان تجريبي..." : "Sample title..."}
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  dir={formData.language === "ar" ? "rtl" : "ltr"}
                />
                <Button
                  onClick={handleTestPrompt}
                  disabled={isTesting}
                  className="shrink-0"
                >
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {isTesting && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">
                      {isRtl ? "جارٍ توليد المقال..." : "Generating article..."}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {isRtl ? "إعدادات المقال" : "Article Configuration"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Number of Paragraphs */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>
                    {isRtl ? "عدد الفقرات" : "Number of Paragraphs"}
                  </Label>
                  <span className="text-sm font-medium">
                    {formData.numberOfParagraphs}
                  </span>
                </div>
                <Slider
                  value={[formData.numberOfParagraphs]}
                  onValueChange={(v) =>
                    setFormData({ ...formData, numberOfParagraphs: v[0] })
                  }
                  min={2}
                  max={20}
                  step={1}
                />
              </div>

              {/* Words per Paragraph */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>
                    {isRtl
                      ? "متوسط الكلمات لكل فقرة"
                      : "Avg Words per Paragraph"}
                  </Label>
                  <span className="text-sm font-medium">
                    {formData.averageWordsPerParagraph}
                  </span>
                </div>
                <Slider
                  value={[formData.averageWordsPerParagraph]}
                  onValueChange={(v) =>
                    setFormData({ ...formData, averageWordsPerParagraph: v[0] })
                  }
                  min={50}
                  max={500}
                  step={10}
                />
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label>{isRtl ? "لغة المقال" : "Article Language"}</Label>
                <Select
                  value={formData.language}
                  onValueChange={(v: "ar" | "en") =>
                    setFormData({ ...formData, language: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية (Arabic)</SelectItem>
                    <SelectItem value="en">English (الإنجليزية)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target Keywords */}
              <div className="space-y-2">
                <Label>{isRtl ? "الكلمات المفتاحية" : "Target Keywords"}</Label>
                <TagsInput
                  value={formData.targetKeywords}
                  onChange={(v) =>
                    setFormData({ ...formData, targetKeywords: v })
                  }
                  placeholder={
                    isRtl ? "اكتب واضغط Enter..." : "Type and press Enter..."
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Image Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                {isRtl ? "إعدادات الصور" : "Image Settings"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{isRtl ? "تضمين صور" : "Include Images"}</Label>
                  <p className="text-sm text-muted-foreground">
                    {isRtl
                      ? "البحث وإضافة صور للمقال"
                      : "Search and add images to article"}
                  </p>
                </div>
                <Switch
                  checked={formData.includeImages}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, includeImages: v })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>{isRtl ? "صورة الغلاف" : "Cover Image"}</Label>
                  <p className="text-sm text-muted-foreground">
                    {isRtl
                      ? "إضافة صورة غلاف للمقال"
                      : "Add cover image to article"}
                  </p>
                </div>
                <Switch
                  checked={formData.includeCoverImage}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, includeCoverImage: v })
                  }
                />
              </div>
              {formData.includeImages && (
                <div className="space-y-2">
                  <Label>
                    {isRtl ? "كلمات البحث عن الصور" : "Image Search Keywords"}
                  </Label>
                  <TagsInput
                    value={formData.imageSearchKeywords}
                    onChange={(v) =>
                      setFormData({ ...formData, imageSearchKeywords: v })
                    }
                    placeholder={
                      isRtl
                        ? "اتركها فارغة لاستخدام الكلمات المفتاحية"
                        : "Leave empty to use target keywords"
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Publishing Settings */}
          <Card>
            <CardHeader>
              <CardTitle>
                {isRtl ? "إعدادات النشر" : "Publishing Settings"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label>{isRtl ? "نشر تلقائي" : "Auto Publish"}</Label>
                  <p className="text-sm text-muted-foreground">
                    {isRtl
                      ? "نشر المقالات مباشرة أو حفظها كمسودة"
                      : "Publish articles directly or save as draft"}
                  </p>
                </div>
                <Switch
                  checked={formData.autoPublish}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, autoPublish: v })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Titles Tab */}
        <TabsContent value="titles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {isRtl ? "إضافة عناوين جديدة" : "Add New Titles"}
              </CardTitle>
              <CardDescription>
                {isRtl
                  ? "أضف العناوين التي سيتم استخدامها لتوليد المقالات"
                  : "Add titles that will be used to generate articles"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder={
                    isRtl ? "أدخل عنوان المقال..." : "Enter article title..."
                  }
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTitle()}
                  dir={formData.language === "ar" ? "rtl" : "ltr"}
                />
                <Button onClick={handleAddTitle} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {newTitles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">
                    {isRtl ? "عناوين للإضافة:" : "Titles to add:"} (
                    {newTitles.length})
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {newTitles.map((title, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="gap-1 py-1"
                      >
                        {title}
                        <button
                          onClick={() => handleRemoveNewTitle(index)}
                          className="ml-1 hover:text-destructive"
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Button onClick={handleAddTitlesSubmit} className="w-full">
                    {isRtl
                      ? `إضافة ${newTitles.length} عناوين`
                      : `Add ${newTitles.length} Titles`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Existing Titles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{isRtl ? "العناوين المتاحة" : "Available Titles"}</span>
                <Badge variant="outline">{unusedTitles.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unusedTitles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {isRtl ? "لا توجد عناوين متاحة" : "No titles available"}
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {unusedTitles.map((title) => (
                    <div
                      key={title._id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded"
                    >
                      <span className="text-sm">{title.title}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveExistingTitle(title._id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Used Titles */}
          {usedTitles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{isRtl ? "العناوين المستخدمة" : "Used Titles"}</span>
                  <Badge variant="secondary">{usedTitles.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {usedTitles.map((title) => (
                    <div
                      key={title._id}
                      className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded"
                    >
                      <span className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        {title.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {title.usedAt &&
                          new Date(title.usedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {isRtl ? "إعدادات الجدولة" : "Scheduling Settings"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    {isRtl
                      ? "إجمالي المقالات المطلوبة"
                      : "Total Articles Needed"}
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    value={formData.totalArticlesNeeded}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalArticlesNeeded: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRtl ? "مقالات يومياً" : "Articles per Day"}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.articlesPerDay}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        articlesPerDay: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {isRtl ? "تاريخ البدء" : "Start Date"}
                  </Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {isRtl ? "وقت التوليد" : "Generation Time"}
                  </Label>
                  <Input
                    type="time"
                    value={formData.generationTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        generationTime: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activation */}
          <Card>
            <CardHeader>
              <CardTitle>
                {isRtl ? "تفعيل الجدولة" : "Scheduler Activation"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label>
                    {isRtl
                      ? "تفعيل التوليد التلقائي"
                      : "Enable Auto Generation"}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {isRtl
                      ? "سيتم توليد المقالات تلقائياً حسب الجدول"
                      : "Articles will be generated automatically on schedule"}
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, isActive: v })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {isRtl ? "إشعارات واتساب" : "WhatsApp Notifications"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>
                    {isRtl ? "الإشعار عند الانتهاء" : "Notify on Completion"}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {isRtl
                      ? "إرسال إشعار عند انتهاء مقالات اليوم"
                      : "Send notification when daily articles are done"}
                  </p>
                </div>
                <Switch
                  checked={formData.notifyOnCompletion}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, notifyOnCompletion: v })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {isRtl ? "أرقام الإشعارات" : "Notification Numbers"}
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="+966xxxxxxxxx"
                    value={newPhoneNumber}
                    onChange={(e) => setNewPhoneNumber(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleAddPhoneNumber()
                    }
                    dir="ltr"
                  />
                  <Button onClick={handleAddPhoneNumber} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.whatsappNotificationNumbers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.whatsappNotificationNumbers.map((num, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {num}
                        <button
                          onClick={() => handleRemovePhoneNumber(index)}
                          className="ml-1 hover:text-destructive"
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button - Styled to match parent settings page */}
      <div className="sticky bottom-0 z-10 flex justify-end bg-background p-4 border-t mt-6 -mx-6 px-6 shadow-sm">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-secondary-blue hover:bg-secondary-blue/90 text-white min-w-[150px]"
        >
          {isLoading ? (
            <>
              <Loader2
                className={`h-4 w-4 animate-spin ${isRtl ? "ml-2" : "mr-2"}`}
              />
              {isRtl ? "جارٍ الحفظ..." : "Saving..."}
            </>
          ) : isRtl ? (
            "حفظ إعدادات AI"
          ) : (
            "Save AI Settings"
          )}
        </Button>
      </div>
    </div>
  );
}
