"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createQuiz,
  updateQuiz,
  Quiz,
  QuizQuestion,
} from "@/store/services/quizService";
import { getCourses } from "@/store/services/courseService";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Type,
  CheckCircle2,
  XCircle,
  Clock,
  Settings2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface QuizFormProps {
  initialData?: Quiz | null;
  isEdit?: boolean;
}

export default function QuizForm({ initialData, isEdit = false }: QuizFormProps) {
  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <QuizFormContent initialData={initialData} isEdit={isEdit} />
    </Suspense>
  );
}

function QuizFormContent({ initialData, isEdit = false }: QuizFormProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, isRtl } = useAdminLocale();
  const { courses } = useAppSelector((state) => state.courses);

  const [formData, setFormData] = useState({
    title: { ar: "", en: "" },
    description: { ar: "", en: "" },
    courseId: searchParams.get("courseId") || "",
    sectionId: searchParams.get("sectionId") || "",
    linkedTo: (searchParams.get("linkedTo") as "course" | "section" | "general") || "course",
    passingScore: 70,
    timeLimit: null as number | null,
    attemptsAllowed: null as number | null,
    shuffleQuestions: false,
    showCorrectAnswers: true,
    isRequiredForCertificate: false,
    isPublished: false,
  });

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(getCourses());
  }, [dispatch]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || { ar: "", en: "" },
        description: initialData.description || { ar: "", en: "" },
        courseId: typeof initialData.courseId === 'string' ? initialData.courseId : (initialData.courseId?.id || initialData.courseId?._id || ""),
        sectionId: typeof initialData.sectionId === 'string' ? initialData.sectionId : (initialData.sectionId?.id || initialData.sectionId?._id || ""),
        linkedTo: initialData.linkedTo || "course",
        passingScore: initialData.passingScore || 70,
        timeLimit: initialData.timeLimit || null,
        attemptsAllowed: initialData.attemptsAllowed || null,
        shuffleQuestions: !!initialData.shuffleQuestions,
        showCorrectAnswers: !!initialData.showCorrectAnswers,
        isRequiredForCertificate: !!initialData.isRequiredForCertificate,
        isPublished: !!initialData.isPublished,
      });
      setQuestions(initialData.questions || []);
    }
  }, [initialData]);

  const selectedCourse = courses.find((c) => (c.id || c._id) === formData.courseId);
  const courseSections = (selectedCourse as any)?.sections || [];

  const getTextValue = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return (isRtl ? value.ar : value.en) || value.en || value.ar || "";
  };

  const handleAddQuestion = (type: "mcq" | "true_false") => {
    const newQuestion: QuizQuestion = {
      questionText: { ar: "", en: "" },
      type,
      choices: type === "mcq" 
        ? [{ ar: "", en: "" }, { ar: "", en: "" }] 
        : [{ ar: "صواب", en: "True" }, { ar: "خطأ", en: "False" }],
      correctAnswer: 0,
      points: 1,
      explanation: { ar: "", en: "" },
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { 
      ...newQuestions[index], 
      ...updates,
      explanation: updates.explanation 
        ? { ...newQuestions[index].explanation, ...updates.explanation }
        : newQuestions[index].explanation
    };
    setQuestions(newQuestions);
  };

  const addChoice = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].choices.push({ ar: "", en: "" });
    setQuestions(newQuestions);
  };

  const removeChoice = (qIndex: number, cIndex: number) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].choices.length > 2) {
      newQuestions[qIndex].choices.splice(cIndex, 1);
      if (newQuestions[qIndex].correctAnswer === cIndex) {
        newQuestions[qIndex].correctAnswer = 0;
      } else if (newQuestions[qIndex].correctAnswer > cIndex) {
        newQuestions[qIndex].correctAnswer -= 1;
      }
      setQuestions(newQuestions);
    } else {
      toast.error(isRtl ? "يجب أن يكون هناك خياران على الأقل" : "At least 2 choices are required");
    }
  };

  const updateChoice = (qIndex: number, cIndex: number, updates: Partial<{ ar: string; en: string }>) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].choices[cIndex] = { ...newQuestions[qIndex].choices[cIndex], ...updates };
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.ar || !formData.title.en) {
      toast.error(isRtl ? "يرجى إدخال العنوان باللغتين" : "Please enter title in both languages");
      return;
    }
    if (formData.linkedTo !== "general" && !formData.courseId) {
      toast.error(isRtl ? "يرجى اختيار الدورة" : "Please select a course");
      return;
    }
    if (questions.length === 0) {
      toast.error(isRtl ? "يرجى إضافة سؤال واحد على الأقل" : "Please add at least one question");
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.ar || !q.questionText.en) {
        toast.error(`${isRtl ? "السؤال" : "Question"} ${i + 1}: ${isRtl ? "النص مطلوب" : "Text is required"}`);
        return;
      }
      for (let j = 0; j < q.choices.length; j++) {
        if (!q.choices[j].ar || !q.choices[j].en) {
          toast.error(`${isRtl ? "السؤال" : "Question"} ${i + 1}, ${isRtl ? "الخيار" : "Choice"} ${j + 1}: ${isRtl ? "مطلوب" : "is required"}`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const data = { 
        ...formData, 
        questions,
        courseId: formData.linkedTo === "general" ? undefined : formData.courseId,
        sectionId: formData.linkedTo === "section" ? formData.sectionId : undefined
      };
      let result;
      if (isEdit && initialData) {
        result = await dispatch(updateQuiz({ id: (initialData.id || initialData._id)!, data })).unwrap();
        toast.success(isRtl ? "تم تحديث الاختبار بنجاح" : "Quiz updated successfully");
      } else {
        result = await dispatch(createQuiz(data)).unwrap();
        toast.success(isRtl ? "تم إنشاء الاختبار بنجاح" : "Quiz created successfully");
      }
      
      if (formData.linkedTo === "general" && result?.slug && !isEdit) {
        toast.success(isRtl ? "تم إنشاء الاختبار بنجاح" : "Quiz created successfully");
        router.push(`/dashboard/quizzes/${result.id || result._id}/edit`);
        return;
      }
      
      router.push("/dashboard/quizzes");
    } catch (error: any) {
      toast.error(error || "Failed to save quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20">
      <div className="flex items-center justify-between sticky top-0 z-10 bg-white/80 backdrop-blur-md p-4 border-b -mx-4">
        <h2 className="text-xl font-bold">
          {isEdit ? (isRtl ? "تعديل اختبار" : "Edit Quiz") : (isRtl ? "إنشاء اختبار جديد" : "Create New Quiz")}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            {isRtl ? "إلغاء" : "Cancel"}
          </Button>
          <Button type="submit" disabled={loading} className="bg-genoun-green hover:bg-genoun-green/90">
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
            ) : (
              <Save className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
            )}
            {isRtl ? "حفظ الاختبار" : "Save Quiz"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>{isRtl ? "المعلومات الأساسية" : "Basic Information"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRtl ? "العنوان بالعربية" : "Title (Arabic)"}</Label>
                  <Input 
                    value={formData.title.ar} 
                    onChange={(e) => setFormData({ ...formData, title: { ...formData.title, ar: e.target.value } })} 
                    placeholder="مثلاً: اختبار نهاية الجزء الأول"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRtl ? "العنوان بالإنجليزية" : "Title (English)"}</Label>
                  <Input 
                    value={formData.title.en} 
                    onChange={(e) => setFormData({ ...formData, title: { ...formData.title, en: e.target.value } })} 
                    placeholder="e.g., Part 1 Final Quiz"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRtl ? "الوصف بالعربية" : "Description (Arabic)"}</Label>
                  <Textarea 
                    value={formData.description.ar} 
                    onChange={(e) => setFormData({ ...formData, description: { ...formData.description, ar: e.target.value } })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRtl ? "الوصف بالإنجليزية" : "Description (English)"}</Label>
                  <Textarea 
                    value={formData.description.en} 
                    onChange={(e) => setFormData({ ...formData, description: { ...formData.description, en: e.target.value } })} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{isRtl ? "الأسئلة" : "Questions"} ({questions.length})</h3>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => handleAddQuestion("mcq")}>
                  <Plus className="h-4 w-4 mr-1" /> {isRtl ? "سؤال اختيار من متعدد" : "Add MCQ"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => handleAddQuestion("true_false")}>
                  <Plus className="h-4 w-4 mr-1" /> {isRtl ? "سؤال صح/خطأ" : "Add True/False"}
                </Button>
              </div>
            </div>

            {questions.map((q, qIndex) => (
              <Card key={qIndex} className="relative group overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${q.type === 'mcq' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                <CardHeader className="pb-3 flex flex-row items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-sm font-bold">
                      {qIndex + 1}
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {q.type === 'mcq' ? (isRtl ? "اختيار من متعدد" : "Multiple Choice") : (isRtl ? "صح / خطأ" : "True / False")}
                      </CardTitle>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveQuestion(qIndex)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">{isRtl ? "نص السؤال (عربي)" : "Question Text (Arabic)"}</Label>
                      <Input 
                        value={q.questionText.ar} 
                        onChange={(e) => updateQuestion(qIndex, { questionText: { ...q.questionText, ar: e.target.value } })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">{isRtl ? "نص السؤال (إنجليزي)" : "Question Text (English)"}</Label>
                      <Input 
                        value={q.questionText.en} 
                        onChange={(e) => updateQuestion(qIndex, { questionText: { ...q.questionText, en: e.target.value } })}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="text-xs font-bold">{isRtl ? "الخيارات" : "Choices"}</Label>
                    {q.choices.map((choice, cIndex) => (
                      <div key={cIndex} className="flex items-center gap-2 group/choice">
                        <div 
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full cursor-pointer border-2 transition-colors ${q.correctAnswer === cIndex ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 hover:border-gray-400'}`}
                          onClick={() => updateQuestion(qIndex, { correctAnswer: cIndex })}
                        >
                          {q.correctAnswer === cIndex ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-[10px] font-bold">{String.fromCharCode(65 + cIndex)}</span>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1">
                          <Input 
                            size={1}
                            className="h-8 text-xs" 
                            value={choice.ar} 
                            onChange={(e) => updateChoice(qIndex, cIndex, { ar: e.target.value })}
                            placeholder={isRtl ? "خيار عربي" : "Arabic option"}
                            disabled={q.type === 'true_false'}
                          />
                          <Input 
                            size={1}
                            className="h-8 text-xs" 
                            value={choice.en} 
                            onChange={(e) => updateChoice(qIndex, cIndex, { en: e.target.value })}
                            placeholder={isRtl ? "خيار إنجليزي" : "English option"}
                            disabled={q.type === 'true_false'}
                          />
                        </div>
                        {q.type === 'mcq' && q.choices.length > 2 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeChoice(qIndex, cIndex)} className="opacity-0 group-hover/choice:opacity-100 h-8 w-8 p-0 text-red-400">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {q.type === 'mcq' && q.choices.length < 6 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => addChoice(qIndex)} className="text-xs text-blue-600 hover:text-blue-700">
                        <Plus className="h-3 w-3 mr-1" /> {isRtl ? "إضافة خيار" : "Add Choice"}
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-4">
                    <div className="space-y-2">
                      <Label className="text-xs">{isRtl ? "شرح الإجابة (عربي)" : "Explanation (Arabic)"}</Label>
                      <Input 
                        value={q.explanation?.ar || ""} 
                        onChange={(e) => updateQuestion(qIndex, { explanation: { ar: e.target.value, en: q.explanation?.en || "" } })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">{isRtl ? "شرح الإجابة (إنجليزي)" : "Explanation (English)"}</Label>
                      <Input 
                        value={q.explanation?.en || ""} 
                        onChange={(e) => updateQuestion(qIndex, { explanation: { en: e.target.value, ar: q.explanation?.ar || "" } })}
                      />
                    </div>
                  </div>
                  
                  <div className="w-24">
                    <Label className="text-xs">{isRtl ? "النقاط" : "Points"}</Label>
                    <Input 
                      type="number" 
                      min="1" 
                      value={q.points} 
                      onChange={(e) => updateQuestion(qIndex, { points: parseInt(e.target.value) || 1 })}
                      className="h-8"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            {questions.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Type className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">{isRtl ? "ابدأ بإضافة أسئلة لاختبارك" : "Start adding questions to your quiz"}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Publishing & Linking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                {isRtl ? "الإعدادات والربط" : "Settings & Link"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.linkedTo === "general" && initialData?.slug && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                  <Label className="text-blue-700 font-bold">{isRtl ? "رابط الاختبار العام" : "Public Quiz Link"}</Label>
                  <div className="flex gap-2">
                    <Input 
                      readOnly 
                      value={`${window.location.origin}/quizzes/p/${initialData.slug}`} 
                      className="bg-white"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/quizzes/p/${initialData.slug}`);
                        toast.success(isRtl ? "تم نسخ الرابط" : "Link copied");
                      }}
                    >
                      {isRtl ? "نسخ" : "Copy"}
                    </Button>
                  </div>
                  <p className="text-[10px] text-blue-500">
                    {isRtl ? "يمكن لأي شخص لديه هذا الرابط إجراء الاختبار" : "Anyone with this link can take the quiz"}
                  </p>
                </div>
              )}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{isRtl ? "نوع الربط" : "Linked To"}</Label>
                  <Select 
                    value={formData.linkedTo} 
                    onValueChange={(val: any) => setFormData({ ...formData, linkedTo: val })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">{isRtl ? "اختبار عام (رابط خارجي)" : "General Quiz (Public Link)"}</SelectItem>
                      <SelectItem value="course">{isRtl ? "الدورة مباشرة" : "Main Course"}</SelectItem>
                      <SelectItem value="section">{isRtl ? "قسم محدد" : "Specific Section"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.linkedTo !== "general" && (
                  <div className="space-y-2">
                    <Label>{isRtl ? "الدورة التدريبية" : "Course"}</Label>
                    <Select 
                      value={formData.courseId} 
                      onValueChange={(val) => setFormData({ ...formData, courseId: val, sectionId: "" })}
                    >
                      <SelectTrigger><SelectValue placeholder={isRtl ? "اختر الدورة" : "Select Course"} /></SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id || course._id} value={(course.id || course._id)!}>{getTextValue(course.title)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.linkedTo === "section" && (
                  <div className="space-y-2">
                    <Label>{isRtl ? "القسم" : "Section"}</Label>
                    <Select 
                      value={formData.sectionId} 
                      onValueChange={(val) => setFormData({ ...formData, sectionId: val })}
                      disabled={!formData.courseId}
                    >
                      <SelectTrigger><SelectValue placeholder={isRtl ? "اختر القسم" : "Select Section"} /></SelectTrigger>
                      <SelectContent>
                        {courseSections.map((section: any) => (
                          <SelectItem key={section.id || section._id} value={(section.id || section._id)!}>{getTextValue(section.title)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <hr />

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>{isRtl ? "درجة النجاح" : "Passing Score"}</Label>
                    <span className="text-sm font-bold text-genoun-green">{formData.passingScore}%</span>
                  </div>
                  <Input 
                    type="range" 
                    min="0" max="100" step="5" 
                    value={formData.passingScore} 
                    onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>{isRtl ? "الوقت (بالدقائق)" : "Time Limit (min)"}</Label>
                  <Input 
                    type="number" 
                    placeholder={isRtl ? "بلا حدود" : "Unlimited"} 
                    value={formData.timeLimit || ""} 
                    onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value ? parseInt(e.target.value) : null })} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>{isRtl ? "المحاولات المسموحة" : "Allowed Attempts"}</Label>
                  <Input 
                    type="number" 
                    placeholder={isRtl ? "بلا حدود" : "Unlimited"} 
                    value={formData.attemptsAllowed || ""} 
                    onChange={(e) => setFormData({ ...formData, attemptsAllowed: e.target.value ? parseInt(e.target.value) : null })} 
                  />
                </div>
              </div>

              <hr />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{isRtl ? "بعثرة الأسئلة" : "Shuffle Questions"}</Label>
                    <p className="text-xs text-muted-foreground">{isRtl ? "تغيير ترتيب الأسئلة لكل طالب" : "Randomize question order"}</p>
                  </div>
                  <Switch checked={formData.shuffleQuestions} onCheckedChange={(v) => setFormData({ ...formData, shuffleQuestions: v })} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{isRtl ? "إظهار الإجابات الصحيحة" : "Show Answers"}</Label>
                    <p className="text-xs text-muted-foreground">{isRtl ? "إظهار الإجابة الصحيحة بعد الإرسال" : "Show correct answers after submission"}</p>
                  </div>
                  <Switch checked={formData.showCorrectAnswers} onCheckedChange={(v) => setFormData({ ...formData, showCorrectAnswers: v })} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 text-blue-600">
                    <Label>{isRtl ? "مطلوب للشهادة" : "Required for Certificate"}</Label>
                    <p className="text-xs text-blue-400">{isRtl ? "يجب النجاح في هذا الاختبار للحصول على الشهادة" : "Must pass to earn certificate"}</p>
                  </div>
                  <Switch checked={formData.isRequiredForCertificate} onCheckedChange={(v) => setFormData({ ...formData, isRequiredForCertificate: v })} />
                </div>

                <div className="flex items-center justify-between border-t pt-4 mt-4">
                  <div className="space-y-0.5 text-genoun-green">
                    <Label>{isRtl ? "نشر الاختبار" : "Published"}</Label>
                    <p className="text-xs text-muted-foreground">{isRtl ? "إظهار الاختبار للطلاب" : "Make quiz visible to students"}</p>
                  </div>
                  <Switch checked={formData.isPublished} onCheckedChange={(v) => setFormData({ ...formData, isPublished: v })} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
