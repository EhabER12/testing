"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getManualPaymentMethodsThunk,
  createManualPaymentMethodThunk,
  updateManualPaymentMethodThunk,
  toggleManualPaymentMethodThunk,
  deleteManualPaymentMethodThunk,
  ManualPaymentMethod,
} from "@/store/services/settingsService";
import { resetSettingsStatus } from "@/store/slices/settingsSlice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Trash2,
  Edit,
  Upload,
  Image as ImageIcon,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";

export function ManualPaymentMethods() {
  const dispatch = useAppDispatch();
  const { t, isRtl } = useAdminLocale();
  const { manualPaymentMethods, isLoading, isSuccess, isError, message } =
    useAppSelector((state) => state.settings);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] =
    useState<ManualPaymentMethod | null>(null);
  const [deleteMethod, setDeleteMethod] = useState<ManualPaymentMethod | null>(
    null
  );

  const [formLang, setFormLang] = useState<"ar" | "en">("ar");
  const [formData, setFormData] = useState({
    title: { ar: "", en: "" },
    description: { ar: "", en: "" },
    imageUrl: "",
    isEnabled: true,
    requiresAttachment: true,
    instructions: { ar: "", en: "" },
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  useEffect(() => {
    dispatch(getManualPaymentMethodsThunk());

    return () => {
      dispatch(resetSettingsStatus());
    };
  }, [dispatch]);

  useEffect(() => {
    if (isSuccess && message) {
      toast.success(message);
      dispatch(resetSettingsStatus());
      setIsDialogOpen(false);
      resetForm();
    }

    if (isError && message) {
      toast.error(message);
      dispatch(resetSettingsStatus());
    }
  }, [isSuccess, isError, message, dispatch]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that both AR and EN are filled
    if (!formData.title.ar.trim() || !formData.title.en.trim()) {
      toast.error(
        isRtl
          ? "يرجى ملء عنوان الطريقة بالعربية والإنجليزية"
          : "Please fill in the title in both Arabic and English"
      );
      return;
    }

    if (!formData.description.ar.trim() || !formData.description.en.trim()) {
      toast.error(
        isRtl
          ? "يرجى ملء الوصف بالعربية والإنجليزية"
          : "Please fill in the description in both Arabic and English"
      );
      return;
    }

    const method = {
      ...formData,
      order: editingMethod ? editingMethod.order : manualPaymentMethods.length,
    };

    if (editingMethod) {
      dispatch(
        updateManualPaymentMethodThunk({
          id: editingMethod._id,
          method: method as any, // Type assertion as thunk expects specific Partial<ManualPaymentMethod>
          image: imageFile || undefined,
        })
      );
    } else {
      dispatch(
        createManualPaymentMethodThunk({
          method: method as any,
          image: imageFile || undefined,
        })
      );
    }
  };

  const handleEdit = (method: ManualPaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      title:
        typeof method.title === "string"
          ? { ar: method.title, en: method.title }
          : method.title,
      description:
        typeof method.description === "string"
          ? { ar: method.description, en: method.description }
          : method.description,
      imageUrl: method.imageUrl,
      isEnabled: method.isEnabled,
      requiresAttachment: method.requiresAttachment,
      instructions:
        typeof method.instructions === "string"
          ? { ar: method.instructions || "", en: method.instructions || "" }
          : method.instructions || { ar: "", en: "" },
    });
    setImagePreview(method.imageUrl);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteMethod) return;

    dispatch(deleteManualPaymentMethodThunk(deleteMethod._id));
    setDeleteMethod(null);
  };

  const toggleEnabled = async (methodId: string, isEnabled: boolean) => {
    dispatch(toggleManualPaymentMethodThunk({ id: methodId, isEnabled }));
  };

  const resetForm = () => {
    setFormData({
      title: { ar: "", en: "" },
      description: { ar: "", en: "" },
      imageUrl: "",
      isEnabled: true,
      requiresAttachment: true,
      instructions: { ar: "", en: "" },
    });
    setImageFile(null);
    setImagePreview("");
    setEditingMethod(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const getLocalizedText = (
    text: string | { ar: string; en: string } | undefined,
    lang: string
  ) => {
    if (!text) return "";
    if (typeof text === "string") return text;
    return text[lang as "ar" | "en"] || text.en || text.ar || "";
  };

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      <div
        className={`flex items-center justify-between ${isRtl ? "flex-row-reverse" : ""
          }`}
      >
        <div className="flex items-center gap-4"></div>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
              {t("admin.payments.addPaymentMethod")}
            </Button>
          </DialogTrigger>
          <DialogContent
            className="max-w-2xl max-h-[90vh] overflow-y-auto"
            dir={isRtl ? "rtl" : "ltr"}
          >
            <DialogHeader>
              <DialogTitle>
                {editingMethod
                  ? t("admin.payments.editPaymentMethod")
                  : t("admin.payments.addPaymentMethod")}
              </DialogTitle>
              <DialogDescription>
                {t("admin.payments.createPaymentMethod")}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Language Switcher */}
              <div className="flex justify-end mb-4">
                <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                  <button
                    type="button"
                    onClick={() => setFormLang("ar")}
                    className={`px-3 py-1 text-sm rounded-md transition-all ${formLang === "ar"
                      ? "bg-white shadow text-primary font-medium"
                      : "text-gray-500 hover:text-gray-900"
                      }`}
                  >
                    العربية
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormLang("en")}
                    className={`px-3 py-1 text-sm rounded-md transition-all ${formLang === "en"
                      ? "bg-white shadow text-primary font-medium"
                      : "text-gray-500 hover:text-gray-900"
                      }`}
                  >
                    English
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="title">
                  {t("admin.payments.paymentMethodTitle")} (
                  {formLang.toUpperCase()}) *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Vodafone Cash, InstaPay"
                  value={formData.title[formLang]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title: { ...formData.title, [formLang]: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="description">
                  {t("admin.payments.description")} ({formLang.toUpperCase()}) *
                </Label>
                <Textarea
                  id="description"
                  placeholder={t("admin.payments.descriptionPlaceholder")}
                  value={formData.description[formLang]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: {
                        ...formData.description,
                        [formLang]: e.target.value,
                      },
                    })
                  }
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="instructions">
                  {t("admin.payments.paymentInstructions")} (
                  {formLang.toUpperCase()})
                </Label>
                <Textarea
                  id="instructions"
                  placeholder={t("admin.payments.instructionsPlaceholder")}
                  value={formData.instructions[formLang]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      instructions: {
                        ...formData.instructions,
                        [formLang]: e.target.value,
                      },
                    })
                  }
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t("admin.payments.instructionsHint")}
                </p>
              </div>

              <div>
                <Label htmlFor="image">
                  {t("admin.payments.paymentMethodIcon")}
                </Label>
                <div className="mt-2 space-y-4">
                  {imagePreview && (
                    <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("image")?.click()}
                    >
                      <Upload
                        className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`}
                      />
                      {t("admin.payments.uploadImage")}
                    </Button>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="requiresAttachment"
                  checked={formData.requiresAttachment}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requiresAttachment: checked })
                  }
                />
                <Label htmlFor="requiresAttachment" className="cursor-pointer">
                  {t("admin.payments.requireProof")}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isEnabled"
                  checked={formData.isEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isEnabled: checked })
                  }
                />
                <Label htmlFor="isEnabled" className="cursor-pointer">
                  {t("admin.payments.enableMethod")}
                </Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDialogClose}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit">
                  {editingMethod
                    ? t("admin.payments.editPaymentMethod")
                    : t("admin.payments.createPaymentMethod")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Methods Summary */}
      {!isLoading && manualPaymentMethods.length > 0 && (
        <Card className="bg-gray-100 border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              {t("admin.payments.activePaymentMethods")}
            </CardTitle>
            <CardDescription>
              {t("admin.payments.methodsEnabled", {
                count: manualPaymentMethods.filter(
                  (m: ManualPaymentMethod) => m.isEnabled
                ).length,
                total: manualPaymentMethods.length,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {manualPaymentMethods
                .filter((m: ManualPaymentMethod) => m.isEnabled)
                .map((method: ManualPaymentMethod) => (
                  <div
                    key={method._id}
                    className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border"
                  >
                    {method.imageUrl && (
                      <img
                        src={method.imageUrl}
                        alt={getLocalizedText(
                          method.title,
                          isRtl ? "ar" : "en"
                        )}
                        className="w-6 h-6 object-contain"
                      />
                    )}
                    <span className="text-sm font-medium">
                      {getLocalizedText(method.title, isRtl ? "ar" : "en")}
                    </span>
                  </div>
                ))}
              {manualPaymentMethods.filter(
                (m: ManualPaymentMethod) => m.isEnabled
              ).length === 0 && (
                  <p className="text-gray-600 text-sm">
                    {t("admin.payments.noActiveMethodsHint")}
                  </p>
                )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <Card key={`skeleton-${i}`} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : manualPaymentMethods.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t("admin.payments.noMethodsYet")}
              </h3>
              <p className="text-gray-600 mb-4">
                {t("admin.payments.addFirstMethod")}
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                {t("admin.payments.addPaymentMethod")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          manualPaymentMethods.map((method: ManualPaymentMethod) => (
            <Card
              key={method._id}
              className={!method.isEnabled ? "opacity-60" : ""}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {getLocalizedText(method.title, isRtl ? "ar" : "en")}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {getLocalizedText(
                        method.description,
                        isRtl ? "ar" : "en"
                      )}
                    </CardDescription>
                  </div>
                  <Switch
                    checked={method.isEnabled}
                    onCheckedChange={(checked) =>
                      toggleEnabled(method._id, checked)
                    }
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {method.imageUrl && (
                  <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={method.imageUrl}
                      alt={getLocalizedText(method.title, isRtl ? "ar" : "en")}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {method.instructions && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    <p className="font-medium mb-1">
                      {t("admin.payments.instructions")}:
                    </p>
                    <p className="whitespace-pre-wrap">
                      {getLocalizedText(
                        method.instructions,
                        isRtl ? "ar" : "en"
                      )}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  {method.requiresAttachment && (
                    <span className="text-black bg-gray-100 px-2 py-1 rounded">
                      {t("admin.payments.requiresProof")}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(method)}
                  >
                    <Edit className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                    {t("common.edit")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setDeleteMethod(method)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteMethod}
        onOpenChange={() => setDeleteMethod(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("admin.payments.deletePaymentMethod")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.payments.deleteConfirm", {
                title: getLocalizedText(
                  deleteMethod?.title,
                  isRtl ? "ar" : "en"
                ),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
