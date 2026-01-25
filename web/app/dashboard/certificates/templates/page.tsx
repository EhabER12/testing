"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  CertificateTemplate,
  Placeholder,
  ImagePlaceholder,
} from "@/store/services/certificateService";
import { getPackages } from "@/store/services/packageService";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Save,
  Undo,
  Type,
  Image as ImageIcon,
  Move,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "@/lib/axios";
import Link from "next/link";

// Google Fonts URL for all required fonts
const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&family=Amiri:ital,wght@0,400;0,700;1,400&family=Cairo:wght@200..1000&family=Changa:wght@200..800&family=Dancing+Script:wght@400..700&family=Great+Vibes&family=Noto+Kufi+Arabic:wght@100..900&family=Pacifico&family=Tajawal:wght@200;300;400;500;700;800;900&display=swap";

export default function CertificateDesignerPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { t, isRtl } = useAdminLocale();

  const { templates, isLoading } = useAppSelector((state) => state.certificates);
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showNewDialog, setShowShowNewDialog] = useState(false);

  // Designer State
  const [design, setDesign] = useState<{
    name: string;
    packageId?: string;
    backgroundImage: string;
    width: number;
    height: number;
    orientation: "portrait" | "landscape";
    placeholders: {
      studentName: Placeholder;
      courseName: Placeholder;
      issuedDate: Placeholder;
      certificateNumber: Placeholder;
      customText: Placeholder[];
      images: ImagePlaceholder[];
    };
    isDefault: boolean;
  }>({
    name: "",
    packageId: "",
    backgroundImage: "",
    width: 1200,
    height: 900,
    orientation: "landscape",
    placeholders: {
      studentName: { x: 600, y: 400, fontSize: 40, fontFamily: "Cairo", color: "#000000", align: "center", fontWeight: "bold" },
      courseName: { x: 600, y: 500, fontSize: 30, fontFamily: "Cairo", color: "#000000", align: "center", fontWeight: "normal" },
      issuedDate: { x: 600, y: 600, fontSize: 20, fontFamily: "Cairo", color: "#000000", align: "center", fontWeight: "normal" },
      certificateNumber: { x: 600, y: 700, fontSize: 16, fontFamily: "Cairo", color: "#000000", align: "center", fontWeight: "normal" },
      customText: [],
      images: [],
    },
    isDefault: false,
  });

  const [activePlaceholder, setActivePlaceholder] = useState<string>("studentName");
  const [activeType, setActiveType] = useState<"standard" | "custom" | "image">("standard");
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [previewScale, setPreviewScale] = useState(0.5);
  const containerRef = useRef<HTMLDivElement>(null);
  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const { packages } = useAppSelector((state) => state.packages);

  useEffect(() => {
    dispatch(getAllTemplates());
    dispatch(getPackages());
  }, [dispatch]);

  const handleSelectTemplate = (template: CertificateTemplate) => {
    setSelectedTemplate(template);
    setDesign({
      name: template.name,
      packageId: template.packageId || "",
      backgroundImage: template.backgroundImage,
      width: template.width,
      height: template.height,
      orientation: (template as any).orientation || "landscape",
      placeholders: {
        studentName: template.placeholders.studentName,
        courseName: template.placeholders.courseName,
        issuedDate: template.placeholders.issuedDate,
        certificateNumber: template.placeholders.certificateNumber,
        customText: template.placeholders.customText || [],
        images: template.placeholders.images || [],
      },
      isDefault: template.isDefault,
    });
    setIsEditing(true);
  };

  const handleCreateNew = () => {
    setDesign({
      name: design.name || "",
      packageId: "",
      backgroundImage: "",
      width: 1200,
      height: 900,
      orientation: "landscape",
      placeholders: {
        studentName: { x: 600, y: 400, fontSize: 40, fontFamily: "Cairo", color: "#000000", align: "center", fontWeight: "bold" },
        courseName: { x: 600, y: 500, fontSize: 30, fontFamily: "Cairo", color: "#000000", align: "center", fontWeight: "normal" },
        issuedDate: { x: 600, y: 600, fontSize: 20, fontFamily: "Cairo", color: "#000000", align: "center", fontWeight: "normal" },
        certificateNumber: { x: 600, y: 700, fontSize: 16, fontFamily: "Cairo", color: "#000000", align: "center", fontWeight: "normal" },
        customText: [],
        images: [],
      },
      isDefault: false,
    });
    setSelectedTemplate(null);
    setIsEditing(true);
    setShowShowNewDialog(false);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, target: "background" | "extra") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await axios.post("/upload/image", formData);
      const url = response.data.data.url;

      if (target === "background") {
        const img = new Image();
        img.onload = () => {
          setDesign({ ...design, backgroundImage: url, width: img.width, height: img.height });
        };
        img.src = url.startsWith("http") ? url : `${process.env.NEXT_PUBLIC_API_URL || ""}${url}`;
        toast.success(isRtl ? "تم رفع الخلفية بنجاح" : "Background uploaded successfully");
      } else {
        const newImage: ImagePlaceholder = {
          url,
          x: 100,
          y: 100,
          width: 150,
          height: 150
        };
        setDesign({
          ...design,
          placeholders: {
            ...design.placeholders,
            images: [...design.placeholders.images, newImage]
          }
        });
        setActiveType("image");
        setActiveIndex(design.placeholders.images.length);
        toast.success(isRtl ? "تمت إضافة الصورة" : "Image added");
      }
    } catch (error) {
      toast.error(isRtl ? "فشل رفع الصورة" : "Failed to upload image");
    }
  };

  const addCustomText = () => {
    const newText: Placeholder = {
      text: isRtl ? "نص إضافي" : "Custom Text",
      x: 600,
      y: 800,
      fontSize: 24,
      fontFamily: "Cairo",
      color: "#000000",
      align: "center",
      fontWeight: "normal"
    };
    setDesign({
      ...design,
      placeholders: {
        ...design.placeholders,
        customText: [...design.placeholders.customText, newText]
      }
    });
    setActiveType("custom");
    setActiveIndex(design.placeholders.customText.length);
  };

  const removeElement = (type: "custom" | "image", index: number) => {
    if (type === "custom") {
      const newCustom = [...design.placeholders.customText];
      newCustom.splice(index, 1);
      setDesign({
        ...design,
        placeholders: { ...design.placeholders, customText: newCustom }
      });
      setActiveType("standard");
      setActivePlaceholder("studentName");
    } else {
      const newImages = [...design.placeholders.images];
      newImages.splice(index, 1);
      setDesign({
        ...design,
        placeholders: { ...design.placeholders, images: newImages }
      });
      setActiveType("standard");
      setActivePlaceholder("studentName");
    }
  };

  const handleSave = async () => {
    if (!design.name) {
      toast.error(isRtl ? "يرجى إدخال اسم القالب" : "Please enter template name");
      return;
    }
    if (!design.backgroundImage) {
      toast.error(isRtl ? "يرجى رفع صورة الخلفية" : "Please upload background image");
      return;
    }

    try {
      if (selectedTemplate) {
        const templateId = selectedTemplate.id || (selectedTemplate as any)._id;
        await dispatch(updateTemplate({ id: templateId, data: design })).unwrap();
        toast.success(isRtl ? "تم تحديث القالب" : "Template updated");
      } else {
        await dispatch(createTemplate(design)).unwrap();
        toast.success(isRtl ? "تم إنشاء القالب بنجاح" : "Template created successfully");
      }
      setIsEditing(false);
      dispatch(getAllTemplates());
    } catch (error: any) {
      toast.error(error || "Failed to save template");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(isRtl ? "هل أنت متأكد من حذف هذا القالب؟" : "Are you sure you want to delete this template?")) {
      try {
        await dispatch(deleteTemplate(id)).unwrap();
        toast.success(isRtl ? "تم الحذف" : "Template deleted");
        if ((selectedTemplate?.id || (selectedTemplate as any)?._id) === id) setIsEditing(false);
      } catch (error: any) {
        toast.error(error || "Failed to delete template");
      }
    }
  };

  const updatePlaceholder = (key: string, updates: Partial<Placeholder>, type: "standard" | "custom" = "standard", index: number = -1) => {
    if (type === "standard") {
      setDesign({
        ...design,
        placeholders: {
          ...design.placeholders,
          [key]: { ...design.placeholders[key as keyof typeof design.placeholders] as Placeholder, ...updates },
        },
      });
    } else {
      const newCustom = [...design.placeholders.customText];
      newCustom[index] = { ...newCustom[index], ...updates };
      setDesign({
        ...design,
        placeholders: { ...design.placeholders, customText: newCustom },
      });
    }
  };

  const updateImage = (index: number, updates: Partial<ImagePlaceholder>) => {
    const newImages = [...design.placeholders.images];
    newImages[index] = { ...newImages[index], ...updates };
    setDesign({
      ...design,
      placeholders: { ...design.placeholders, images: newImages },
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, type: "standard" | "custom" | "image", indexOrKey: string | number) => {
    e.stopPropagation();
    if (!containerRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = (e.clientX - rect.left) / previewScale;
    const offsetY = (e.clientY - rect.top) / previewScale;

    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);

    if (type === "standard") {
      setActiveType("standard");
      setActivePlaceholder(indexOrKey as string);
    } else if (type === "custom") {
      setActiveType("custom");
      setActiveIndex(indexOrKey as number);
    } else if (type === "image") {
      setActiveType("image");
      setActiveIndex(indexOrKey as number);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    // Calculate mouse position relative to container
    const mouseX = (e.clientX - containerRect.left) / previewScale;
    const mouseY = (e.clientY - containerRect.top) / previewScale;

    // Calculate new element position (top-left) by subtracting offset
    // Note: This assumes we want to move the top-left of the element to mouse position minus offset
    // Which effectively keeps the mouse at the same relative point on the element
    // wait, I only have the offset from the element top-left.
    // So new_x = mouseX - dragOffset.x? No. dragOffset was clicked point relative to element top-left?
    // Let's refine:
    // We need element current x,y.
    // Actually simpler:
    // Update X/Y to (mouseX) - (dragOffset from element origin).
    // In handleMouseDown, offsetX/Y is relative to element.
    // So NewX = MouseXInContainer - OffsetX.

    // MousePosInContainer
    const currentX = Math.round(mouseX);
    const currentY = Math.round(mouseY);

    // We need the internal offset calculated in MouseDown.
    // Let's correct handleMouseDown to calculate offset from ELEMENT top-left.
    // e.currentTarget is the ELEMENT. rect is element rect.
    // So offsetX/Y IS correct.

    const newX = Math.round(mouseX - dragOffset.x);
    const newY = Math.round(mouseY - dragOffset.y);

    if (activeType === "standard") {
      updatePlaceholder(activePlaceholder, { x: newX, y: newY });
    } else if (activeType === "custom") {
      updatePlaceholder("", { x: newX, y: newY }, "custom", activeIndex);
    } else if (activeType === "image") {
      updateImage(activeIndex, { x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Disable simple click-to-move for cleaner UX, or keep it for background click?
  // Let's keep background click for deselecting or moving if needed, but dragging is primary.
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only move if we weren't just dragging
    // Implementation of drag usually prevents click.
    // We can just rely on drag.
  };

  if (isLoading && !isEditing) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-genoun-green border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`flex-1 space-y-4 p-8 pt-6 ${isRtl ? "text-right" : ""}`} dir={isRtl ? "rtl" : "ltr"}>
      <link href={GOOGLE_FONTS_URL} rel="stylesheet" />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isRtl ? "مصمم الشهادات" : "Certificate Designer"}
          </h2>
          <p className="text-muted-foreground">
            {isRtl ? "تخصيص شكل ومحتوى شهادات التقدير" : "Customize the look and content of certificates"}
          </p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={() => setShowShowNewDialog(true)} className="bg-genoun-green hover:bg-genoun-green/90">
              <Plus className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
              {isRtl ? "قالب جديد" : "New Template"}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <Undo className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                {isRtl ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={handleSave} className="bg-genoun-green hover:bg-genoun-green/90">
                <Save className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                {isRtl ? "حفظ القالب" : "Save Template"}
              </Button>
            </>
          )}
          <Link href="/dashboard/certificates">
            <Button variant="ghost">
              <ArrowLeft className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
              {isRtl ? "الرجوع للشهادات" : "Back to Certificates"}
            </Button>
          </Link>
        </div>
      </div>

      {!isEditing ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template, idx) => (
            <Card key={template.id || template._id || `template-${idx}`} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video relative bg-gray-100 border-b">
                <img
                  src={template.backgroundImage.startsWith("http") ? template.backgroundImage : `${process.env.NEXT_PUBLIC_API_URL || ""}${template.backgroundImage}`}
                  alt={template.name}
                  className="w-full h-full object-contain"
                />
                {template.isDefault && (
                  <Badge className="absolute top-2 right-2 bg-genoun-green">
                    {isRtl ? "افتراضي" : "Default"}
                  </Badge>
                )}
              </div>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription>{template.width}x{template.height} px</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => handleSelectTemplate(template)}>
                  {isRtl ? "تعديل" : "Edit"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id || (template as any)._id)} className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {templates.length === 0 && (
            <Card className="col-span-full py-12 flex flex-col items-center justify-center border-dashed">
              <ImageIcon className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-muted-foreground">{isRtl ? "لا توجد قوالب حالياً" : "No templates found"}</p>
              <Button variant="link" onClick={() => setShowShowNewDialog(true)} className="text-genoun-green">
                {isRtl ? "أنشئ أول قالب الآن" : "Create your first template"}
              </Button>
            </Card>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Sidebar */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="text-base">{isRtl ? "إعدادات القالب" : "Template Settings"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{isRtl ? "اسم القالب" : "Template Name"}</Label>
                <Input value={design.name} onChange={(e) => setDesign({ ...design, name: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>{isRtl ? "ربط بباقة (اختياري)" : "Link to Package (Optional)"}</Label>
                <Select
                  value={design.packageId || "none"}
                  onValueChange={(val) => setDesign({ ...design, packageId: val === "none" ? "" : val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRtl ? "اختر باقة..." : "Select package..."} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{isRtl ? "بدون ربط" : "No Link"}</SelectItem>
                    {packages.filter(pkg => pkg && (pkg.id || pkg._id) && String(pkg.id || pkg._id) !== "").map((pkg) => (
                      <SelectItem key={pkg.id || pkg._id} value={String(pkg.id || pkg._id)}>
                        {isRtl ? pkg.name.ar : pkg.name.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{isRtl ? "صورة الخلفية" : "Background Image"}</Label>
                <div className="flex flex-col gap-2">
                  {design.backgroundImage && (
                    <div className="aspect-video rounded border overflow-hidden bg-gray-50">
                      <img src={design.backgroundImage.startsWith("http") ? design.backgroundImage : `${process.env.NEXT_PUBLIC_API_URL || ""}${design.backgroundImage}`} className="w-full h-full object-contain" />
                    </div>
                  )}
                  <Input type="file" accept="image/*" onChange={(e) => handleUploadImage(e, "background")} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>{isRtl ? "قالب افتراضي" : "Set as Default"}</Label>
                <Switch checked={design.isDefault} onCheckedChange={(val) => setDesign({ ...design, isDefault: val })} />
              </div>

              {/* Orientation Switcher */}
              <div className="space-y-2">
                <Label>{isRtl ? "اتجاه الصفحة" : "Page Orientation"}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={design.orientation === "landscape" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const newOrientation = "landscape";
                      // Swap width/height if changing from portrait to landscape
                      const newWidth = design.orientation === "portrait" && design.width < design.height ? design.height : design.width;
                      const newHeight = design.orientation === "portrait" && design.width < design.height ? design.width : design.height;
                      setDesign({ ...design, orientation: newOrientation, width: newWidth, height: newHeight });
                    }}
                    className={design.orientation === "landscape" ? "bg-genoun-green hover:bg-genoun-green/90" : ""}
                  >
                    📄 {isRtl ? "أفقي" : "Landscape"}
                  </Button>
                  <Button
                    type="button"
                    variant={design.orientation === "portrait" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const newOrientation = "portrait";
                      // Swap width/height if changing from landscape to portrait
                      const newWidth = design.orientation === "landscape" && design.width > design.height ? design.height : design.width;
                      const newHeight = design.orientation === "landscape" && design.width > design.height ? design.width : design.height;
                      setDesign({ ...design, orientation: newOrientation, width: newWidth, height: newHeight });
                    }}
                    className={design.orientation === "portrait" ? "bg-genoun-green hover:bg-genoun-green/90" : ""}
                  >
                    📃 {isRtl ? "رأسي" : "Portrait"}
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4 flex flex-col gap-2">
                <Button variant="outline" size="sm" onClick={addCustomText} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  {isRtl ? "إضافة جملة مخصصة" : "Add Custom Text"}
                </Button>
                <div className="relative">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <label className="cursor-pointer">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      {isRtl ? "إضافة صورة / شعار" : "Add Image / Logo"}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadImage(e, "extra")} />
                    </label>
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="mb-4 block font-bold">{isRtl ? "تعديل العناصر" : "Edit Elements"}</Label>
                <Tabs value={activeType} onValueChange={(val: any) => setActiveType(val)}>
                  <TabsList className="grid grid-cols-3 w-full mb-4">
                    <TabsTrigger value="standard">{isRtl ? "أساسي" : "Standard"}</TabsTrigger>
                    <TabsTrigger value="custom">{isRtl ? "نصوص" : "Texts"}</TabsTrigger>
                    <TabsTrigger value="image">{isRtl ? "صور" : "Images"}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="standard" className="space-y-4">
                    <Select value={activePlaceholder} onValueChange={setActivePlaceholder}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="studentName">{isRtl ? "اسم الطالب" : "Student Name"}</SelectItem>
                        <SelectItem value="courseName">{isRtl ? "اسم الدورة" : "Course Name"}</SelectItem>
                        <SelectItem value="issuedDate">{isRtl ? "تاريخ الإصدار" : "Issue Date"}</SelectItem>
                        <SelectItem value="certificateNumber">{isRtl ? "رقم الشهادة" : "Certificate ID"}</SelectItem>
                      </SelectContent>
                    </Select>

                    {(() => {
                      const k = activePlaceholder as keyof typeof design.placeholders;
                      const p = design.placeholders[k] as Placeholder;
                      if (!p) return null;
                      return (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <Label>{isRtl ? "حجم الخط" : "Font Size"}</Label>
                              <span>{p.fontSize}px</span>
                            </div>
                            <Slider value={[p.fontSize]} min={10} max={100} onValueChange={([val]) => updatePlaceholder(k, { fontSize: val })} />
                          </div>
                          <div className="space-y-2">
                            <Label>{isRtl ? "اللون" : "Color"}</Label>
                            <div className="flex gap-2">
                              <Input type="color" className="w-12 h-10 p-1" value={p.color} onChange={(e) => updatePlaceholder(k, { color: e.target.value })} />
                              <Input value={p.color} onChange={(e) => updatePlaceholder(k, { color: e.target.value })} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>{isRtl ? "نوع الخط" : "Font Family"}</Label>
                            <Select
                              value={p.fontFamily}
                              onValueChange={(val) => updatePlaceholder(k, { fontFamily: val })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Cairo">Cairo - القاهرة</SelectItem>
                                <SelectItem value="Amiri">Amiri - الأميري</SelectItem>
                                <SelectItem value="Tajawal">Tajawal - تجوال</SelectItem>
                                <SelectItem value="Almarai">Almarai - المرعى</SelectItem>
                                <SelectItem value="Noto Kufi Arabic">Noto Kufi Arabic</SelectItem>
                                <SelectItem value="Great Vibes">✍️ Great Vibes (Signature)</SelectItem>
                                <SelectItem value="Dancing Script">✍️ Dancing Script (Signature)</SelectItem>
                                <SelectItem value="Pacifico">✍️ Pacifico (Signature)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>{isRtl ? "سُمك الخط" : "Font Weight"}</Label>
                            <Select
                              value={p.fontWeight || "normal"}
                              onValueChange={(val) => updatePlaceholder(k, { fontWeight: val })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">{isRtl ? "عادي" : "Normal"}</SelectItem>
                                <SelectItem value="bold">{isRtl ? "عريض" : "Bold"}</SelectItem>
                                <SelectItem value="500">Medium</SelectItem>
                                <SelectItem value="600">Semi Bold</SelectItem>
                                <SelectItem value="800">Extra Bold</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>{isRtl ? "محاذاة النص" : "Text Alignment"}</Label>
                            <Select
                              value={p.align || "center"}
                              onValueChange={(val) => updatePlaceholder(k, { align: val })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">{isRtl ? "يسار" : "Left"}</SelectItem>
                                <SelectItem value="center">{isRtl ? "وسط" : "Center"}</SelectItem>
                                <SelectItem value="right">{isRtl ? "يمين" : "Right"}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      );
                    })()}
                  </TabsContent>

                  <TabsContent value="custom" className="space-y-4">
                    {design.placeholders.customText.length > 0 ? (
                      <>
                        <Select value={activeIndex.toString()} onValueChange={(v) => setActiveIndex(parseInt(v))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {design.placeholders.customText.map((item, idx) => (
                              <SelectItem key={`sel-custom-${idx}`} value={idx.toString()}>{item.text || `Text ${idx + 1}`}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {activeIndex !== -1 && design.placeholders.customText[activeIndex] && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>{isRtl ? "النص" : "Text Content"}</Label>
                              <Input
                                value={design.placeholders.customText[activeIndex].text}
                                onChange={(e) => updatePlaceholder("", { text: e.target.value }, "custom", activeIndex)}
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <Label>{isRtl ? "حجم الخط" : "Font Size"}</Label>
                                <span>{design.placeholders.customText[activeIndex].fontSize}px</span>
                              </div>
                              <Slider
                                value={[design.placeholders.customText[activeIndex].fontSize]}
                                min={10} max={100}
                                onValueChange={([val]) => updatePlaceholder("", { fontSize: val }, "custom", activeIndex)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{isRtl ? "نوع الخط" : "Font Family"}</Label>
                              <Select
                                value={design.placeholders.customText[activeIndex].fontFamily}
                                onValueChange={(val) => updatePlaceholder("", { fontFamily: val }, "custom", activeIndex)}
                              >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Cairo">Cairo - القاهرة</SelectItem>
                                  <SelectItem value="Amiri">Amiri - الأميري</SelectItem>
                                  <SelectItem value="Tajawal">Tajawal - تجوال</SelectItem>
                                  <SelectItem value="Almarai">Almarai - المرعى</SelectItem>
                                  <SelectItem value="Noto Kufi Arabic">Noto Kufi Arabic</SelectItem>
                                  <SelectItem value="Great Vibes">✍️ Great Vibes (Signature)</SelectItem>
                                  <SelectItem value="Dancing Script">✍️ Dancing Script (Signature)</SelectItem>
                                  <SelectItem value="Pacifico">✍️ Pacifico (Signature)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>{isRtl ? "اللون" : "Color"}</Label>
                              <div className="flex gap-2">
                                <Input type="color" className="w-12 h-10 p-1" value={design.placeholders.customText[activeIndex].color} onChange={(e) => updatePlaceholder("", { color: e.target.value }, "custom", activeIndex)} />
                                <Input value={design.placeholders.customText[activeIndex].color} onChange={(e) => updatePlaceholder("", { color: e.target.value }, "custom", activeIndex)} />
                              </div>
                            </div>
                            <Button variant="destructive" size="sm" onClick={() => removeElement("custom", activeIndex)} className="w-full">
                              <Trash2 className="h-4 w-4 mr-2" /> {isRtl ? "حذف النص" : "Remove Text"}
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">{isRtl ? "لا توجد نصوص مخصصة" : "No custom texts added"}</p>
                    )}
                  </TabsContent>

                  <TabsContent value="image" className="space-y-4">
                    {design.placeholders.images.length > 0 ? (
                      <>
                        <Select value={activeIndex.toString()} onValueChange={(v) => setActiveIndex(parseInt(v))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {design.placeholders.images.map((img, idx) => (
                              <SelectItem key={`sel-img-${idx}`} value={idx.toString()}>Image {idx + 1}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {activeIndex !== -1 && design.placeholders.images[activeIndex] && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">{isRtl ? "العرض" : "Width"}</Label>
                                <Input type="number" value={design.placeholders.images[activeIndex].width} onChange={(e) => updateImage(activeIndex, { width: parseInt(e.target.value) })} />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">{isRtl ? "الطول" : "Height"}</Label>
                                <Input type="number" value={design.placeholders.images[activeIndex].height} onChange={(e) => updateImage(activeIndex, { height: parseInt(e.target.value) })} />
                              </div>
                            </div>
                            <Button variant="destructive" size="sm" onClick={() => removeElement("image", activeIndex)} className="w-full">
                              <Trash2 className="h-4 w-4 mr-2" /> {isRtl ? "حذف الصورة" : "Remove Image"}
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">{isRtl ? "لا توجد صور مضافة" : "No images added"}</p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          {/* Preview Area */}
          <Card className="lg:col-span-3 overflow-hidden bg-gray-100 flex flex-col min-h-[600px]">
            <CardHeader className="bg-white border-b py-3 px-6 flex flex-row items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <CardTitle className="text-base">{isRtl ? "المعاينة" : "Preview"}</CardTitle>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">{isRtl ? "تكبير" : "Zoom"}</Label>
                  <Slider
                    className="w-32"
                    value={[previewScale * 100]}
                    min={10} max={150}
                    onValueChange={([val]) => setPreviewScale(val / 100)}
                  />
                  <span className="text-xs w-10">{Math.round(previewScale * 100)}%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Move className="h-3 w-3" />
                {isRtl ? "انقر على الصورة لتغيير مكان النص" : "Click image to position selected text"}
              </p>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-8 flex items-start justify-center">
              <div
                ref={containerRef}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="relative bg-white shadow-2xl transition-all cursor-default shrink-0"
                style={{
                  width: design.width,
                  height: design.height,
                  transform: `scale(${previewScale})`,
                  transformOrigin: "top center",
                }}
              >
                {design.backgroundImage && (
                  <img
                    src={design.backgroundImage.startsWith("http") ? design.backgroundImage : `${process.env.NEXT_PUBLIC_API_URL || ""}${design.backgroundImage}`}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    alt="Certificate Background"
                  />
                )}

                {/* Standard Text Placeholders */}
                {Object.keys(design.placeholders).filter(k => !['customText', 'images', 'signature'].includes(k)).map((key) => {
                  const k = key as keyof typeof design.placeholders;
                  const p = design.placeholders[k] as Placeholder;
                  const isActive = activeType === "standard" && activePlaceholder === k;

                  return (
                    <div
                      key={k}
                      onMouseDown={(e) => handleMouseDown(e, "standard", k)}
                      className={`absolute pointer-events-auto select-none border-2 transition-colors cursor-move ${isActive ? 'border-genoun-green bg-genoun-green/10 z-10' : 'border-dashed border-gray-400/50 hover:border-genoun-green/50'}`}
                      style={{
                        top: p.y * previewScale,
                        left: p.align === "center" ? 0 : p.align === "right" ? "auto" : p.x * previewScale,
                        right: p.align === "right" ? (design.width - p.x) * previewScale : "auto",
                        width: p.align === "center" ? "100%" : "auto",
                        textAlign: (p.align || "center") as React.CSSProperties["textAlign"],
                        color: p.color,
                        fontSize: p.fontSize * previewScale,
                        fontFamily: p.fontFamily,
                        fontWeight: p.fontWeight,
                        lineHeight: 1,
                        padding: `${4 * previewScale}px`,
                      }}
                    >
                      {k === "studentName" ? (isRtl ? "اسم الطالب هنا" : "Student Name") :
                        k === "courseName" ? (isRtl ? "اسم الدورة القرآنية" : "Quran Course Name") :
                          k === "issuedDate" ? "2026-01-11" :
                            "CERT-2026-XXXX"}
                    </div>
                  );
                })}

                {/* Custom Text Placeholders */}
                {design.placeholders.customText.map((p, idx) => {
                  const isActive = activeType === "custom" && activeIndex === idx;
                  return (
                    <div
                      key={`custom-${idx}`}
                      onMouseDown={(e) => handleMouseDown(e, "custom", idx)}
                      className={`absolute pointer-events-auto select-none border-2 transition-colors cursor-move ${isActive ? 'border-genoun-green bg-genoun-green/10 z-10' : 'border-dashed border-gray-400/50 hover:border-genoun-green/50'}`}
                      style={{
                        top: p.y * previewScale,
                        left: p.align === "center" ? 0 : p.align === "right" ? "auto" : p.x * previewScale,
                        right: p.align === "right" ? (design.width - p.x) * previewScale : "auto",
                        width: p.align === "center" ? "100%" : "auto",
                        textAlign: (p.align || "center") as React.CSSProperties["textAlign"],
                        color: p.color,
                        fontSize: p.fontSize * previewScale,
                        fontFamily: p.fontFamily,
                        fontWeight: p.fontWeight,
                        lineHeight: 1,
                        padding: `${4 * previewScale}px`,
                      }}
                    >
                      {p.text || "Custom Text"}
                    </div>
                  );
                })}

                {/* Additional Images */}
                {design.placeholders.images.map((img, idx) => {
                  const isActive = activeType === "image" && activeIndex === idx;
                  return (
                    <div
                      key={`img-${idx}`}
                      onMouseDown={(e) => handleMouseDown(e, "image", idx)}
                      className={`absolute pointer-events-auto select-none border-2 transition-colors cursor-move ${isActive ? 'border-genoun-green bg-genoun-green/10 z-10' : 'border-dashed border-gray-400/50 hover:border-genoun-green/50'}`}
                      style={{
                        top: img.y * previewScale,
                        left: img.x * previewScale,
                        width: img.width * previewScale,
                        height: img.height * previewScale,
                      }}
                    >
                      <img
                        src={img.url.startsWith("http") ? img.url : `${process.env.NEXT_PUBLIC_API_URL || ""}${img.url}`}
                        className="w-full h-full object-contain pointer-events-none"
                        alt={`Extra Image ${idx + 1}`}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Template Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRtl ? "قالب شهادة جديد" : "New Certificate Template"}</DialogTitle>
            <DialogDescription>
              {isRtl ? "ابدأ بإنشاء قالب جديد وتخصيص مظهره" : "Start by creating a new template and customizing its look"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>{isRtl ? "اسم القالب" : "Template Name"}</Label>
              <Input
                placeholder={isRtl ? "مثلاً: شهادة إتمام جزء عم" : "e.g., Juz Amma Completion"}
                value={design.name}
                onChange={(e) => setDesign({ ...design, name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShowNewDialog(false)}>
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleCreateNew} className="bg-genoun-green hover:bg-genoun-green/90">
              {isRtl ? "ابدأ التصميم" : "Start Designing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
