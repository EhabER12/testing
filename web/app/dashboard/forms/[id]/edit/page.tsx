"use client";

import type React from "react";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getFormById,
  updateForm,
  getLocalizedText,
} from "@/store/services/formService";
import { Loader2, Plus, Trash } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import toast from "react-hot-toast";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";

// Field type options
const FIELD_TYPES = [
  "text",
  "email",
  "tel",
  "number",
  "select",
  "checkbox",
  "radio",
  "textarea",
  "date",
  "attachment",
] as const;

// Simple form field interface (single language)
interface SimpleFormField {
  id: string;
  label: string;
  fieldType: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

// Simple form interface (single language)
interface SimpleForm {
  _id: string;
  title: string;
  description: string;
  status: string;
  slug?: string;
  fields: SimpleFormField[];
}

export default function EditFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t, isRtl } = useAdminLocale();
  const resolvedParams = use(params);

  const [form, setForm] = useState<SimpleForm | null>(null);
  // Language controls RTL/LTR direction for the form
  const [formDirection, setFormDirection] = useState<"ar" | "en">("en");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const formIsRtl = formDirection === "ar";

  // Fetch form data
  useEffect(() => {
    const fetchForm = async () => {
      setLoading(true);
      setError("");

      try {
        const resultAction = await dispatch(getFormById(resolvedParams.id));

        if (getFormById.fulfilled.match(resultAction)) {
          if (resultAction.payload.success && resultAction.payload.data) {
            const formData = resultAction.payload.data;

            // Convert to simple form format (extract string values)
            const simpleForm: SimpleForm = {
              _id: formData._id,
              title:
                getLocalizedText(formData.title, "en") ||
                getLocalizedText(formData.title, "ar"),
              description:
                getLocalizedText(formData.description, "en") ||
                getLocalizedText(formData.description, "ar"),
              status: formData.status || "draft",
              slug: formData.slug,
              fields: formData.fields.map((field) => ({
                id: field.id || field._id || crypto.randomUUID(),
                label:
                  getLocalizedText(field.label, "en") ||
                  getLocalizedText(field.label, "ar"),
                fieldType: field.fieldType || (field as any).type || "text",
                required: field.required || false,
                placeholder:
                  getLocalizedText(field.placeholder, "en") ||
                  getLocalizedText(field.placeholder, "ar"),
                options: field.options?.map((opt) =>
                  typeof opt === "string"
                    ? opt
                    : (opt as any).en || (opt as any).ar || ""
                ),
              })),
            };

            setForm(simpleForm);

            // Detect form direction from content (if Arabic characters present)
            if (simpleForm.title && /[\u0600-\u06FF]/.test(simpleForm.title)) {
              setFormDirection("ar");
            }
          } else {
            setError(
              resultAction.payload.message || t("admin.forms.formFailed")
            );
          }
        } else {
          setError(
            (resultAction.payload as string) || t("admin.forms.formFailed")
          );
        }
      } catch (err) {
        console.error("Error fetching form:", err);
        setError(t("admin.forms.formFailed"));
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [resolvedParams.id, dispatch, t]);

  // Update form title/description
  const handleTextChange = (field: "title" | "description", value: string) => {
    if (!form) return;
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  // Update form status
  const handleStatusChange = (value: string) => {
    if (!form) return;
    setForm((prev) => (prev ? { ...prev, status: value } : prev));
  };

  // Update field property
  const handleFieldChange = (
    index: number,
    field: keyof SimpleFormField,
    value: any
  ) => {
    if (!form) return;

    setForm((prev) => {
      if (!prev) return prev;

      const newFields = [...prev.fields];
      const currentField = newFields[index];

      if (field === "fieldType") {
        // Clear options for non-option fields
        const updatedField = { ...currentField, [field]: value };
        if (value !== "select" && value !== "checkbox" && value !== "radio") {
          delete updatedField.options;
        }
        if (value === "attachment") {
          delete updatedField.placeholder;
        }
        newFields[index] = updatedField;
      } else {
        newFields[index] = { ...currentField, [field]: value };
      }

      return { ...prev, fields: newFields };
    });
  };

  // Add new field
  const addField = () => {
    if (!form) return;

    const newField: SimpleFormField = {
      id: crypto.randomUUID(),
      label: "",
      fieldType: "text",
      required: false,
      placeholder: "",
    };

    setForm((prev) =>
      prev ? { ...prev, fields: [...prev.fields, newField] } : prev
    );
  };

  // Remove field
  const removeField = (index: number) => {
    if (!form) return;
    setForm((prev) =>
      prev
        ? { ...prev, fields: prev.fields.filter((_, i) => i !== index) }
        : prev
    );
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!form) return false;

    if (!form.title.trim()) {
      setError(t("admin.forms.titleRequired") || "Form title is required");
      return false;
    }

    for (const field of form.fields) {
      if (!field.label.trim()) {
        setError(
          t("admin.forms.fieldLabelRequired") || "All field labels are required"
        );
        return false;
      }
    }

    return true;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!form || !validateForm()) return;

    setSaving(true);
    setError("");

    try {
      // Convert simple form to API format (already single-language strings)
      const formDataForApi = {
        _id: form._id,
        title: form.title,
        description: form.description,
        status: form.status,
        slug: form.slug,
        fields: form.fields.map((field) => ({
          id: field.id,
          label: field.label,
          fieldType: field.fieldType,
          required: field.required,
          placeholder: field.placeholder,
          options: field.options,
        })),
      };

      const resultAction = await dispatch(
        updateForm({
          formId: resolvedParams.id,
          formData: formDataForApi as any,
        })
      );

      if (updateForm.fulfilled.match(resultAction)) {
        toast.success(t("admin.forms.formUpdated"));
        router.push("/dashboard/forms");
      } else {
        setError(
          (resultAction.payload as string) || t("admin.forms.formFailed")
        );
      }
    } catch (err) {
      console.error("Error updating form:", err);
      setError(t("admin.forms.formFailed"));
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state (no form)
  if (error && !form) {
    return (
      <div className="p-8" dir={isRtl ? "rtl" : "ltr"}>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p>{error}</p>
        </div>
        <Button
          className="mt-4"
          onClick={() => router.push("/dashboard/forms")}
        >
          {t("admin.forms.backToForms")}
        </Button>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="pb-24" dir={isRtl ? "rtl" : "ltr"}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("admin.forms.editForm")}
          </h1>
          <p className="text-gray-500 mt-1">
            {t("admin.forms.editFormDescription")}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <p>{error}</p>
          </div>
        )}

        {/* Form Direction Selector */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {t("admin.forms.formDirection")}
              </CardTitle>
              <Tabs
                value={formDirection}
                onValueChange={(v) => setFormDirection(v as "ar" | "en")}
              >
                <TabsList>
                  <TabsTrigger value="en">
                    {t("admin.forms.ltrEnglish")}
                  </TabsTrigger>
                  <TabsTrigger value="ar">
                    {t("admin.forms.rtlArabic")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t("admin.forms.directionHint")}
            </p>
          </CardHeader>
        </Card>

        {/* Form Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.forms.formDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Form Title */}
            <div className="space-y-2">
              <Label htmlFor="title">{t("admin.forms.formTitle")}</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => handleTextChange("title", e.target.value)}
                placeholder={t("admin.forms.formTitlePlaceholder")}
                dir={formIsRtl ? "rtl" : "ltr"}
                required
              />
            </div>

            {/* Form Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                {t("admin.forms.formDescription")}
              </Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  handleTextChange("description", e.target.value)
                }
                placeholder={t("admin.forms.formDescriptionPlaceholder")}
                dir={formIsRtl ? "rtl" : "ltr"}
              />
            </div>

            {/* Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">{t("admin.forms.status")}</Label>
                <Select
                  value={form.status || "draft"}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder={t("admin.forms.status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">
                      {t("admin.articles.published")}
                    </SelectItem>
                    <SelectItem value="draft">
                      {t("admin.articles.draft")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <Label>{t("admin.forms.formFields")}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addField}
                >
                  <Plus className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                  {t("admin.forms.addField")}
                </Button>
              </div>

              {/* Fields List */}
              {form.fields.map((field, index) => (
                <Card key={field.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50 pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {t("admin.forms.field")} {index + 1}
                      </CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeField(index)}
                        className="h-8 w-8 text-red-500"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    {/* Field Label */}
                    <div className="space-y-2">
                      <Label htmlFor={`field-${index}-label`}>
                        {t("admin.forms.fieldLabel")}
                      </Label>
                      <Input
                        id={`field-${index}-label`}
                        value={field.label}
                        onChange={(e) =>
                          handleFieldChange(index, "label", e.target.value)
                        }
                        placeholder={t("admin.forms.fieldLabelPlaceholder")}
                        dir={formIsRtl ? "rtl" : "ltr"}
                      />
                    </div>

                    {/* Field Type */}
                    <div className="space-y-2">
                      <Label htmlFor={`field-${index}-type`}>
                        {t("admin.forms.fieldType")}
                      </Label>
                      <Select
                        value={field.fieldType}
                        onValueChange={(value) =>
                          handleFieldChange(index, "fieldType", value)
                        }
                      >
                        <SelectTrigger id={`field-${index}-type`}>
                          <SelectValue
                            placeholder={t("admin.forms.selectFieldType")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {t(`admin.forms.fieldTypes.${type}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Required Checkbox */}
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`field-${index}-required`}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          id={`field-${index}-required`}
                          checked={field.required}
                          onChange={(e) =>
                            handleFieldChange(
                              index,
                              "required",
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        {t("admin.forms.requiredField")}
                      </Label>
                    </div>

                    {/* Options for select/checkbox/radio */}
                    {(field.fieldType === "select" ||
                      field.fieldType === "checkbox" ||
                      field.fieldType === "radio") && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>{t("admin.forms.options")}</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentOptions = field.options || [];
                              handleFieldChange(index, "options", [
                                ...currentOptions,
                                "",
                              ]);
                            }}
                          >
                            <Plus
                              className={`h-3 w-3 ${isRtl ? "ml-1" : "mr-1"}`}
                            />
                            {t("admin.forms.addOption")}
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {(field.options || [""]).map((option, optIndex) => (
                            <div key={optIndex} className="flex gap-2">
                              <Input
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...(field.options || [])];
                                  newOptions[optIndex] = e.target.value;
                                  handleFieldChange(
                                    index,
                                    "options",
                                    newOptions
                                  );
                                }}
                                placeholder={`Option ${optIndex + 1}`}
                                dir={formIsRtl ? "rtl" : "ltr"}
                              />
                              {(field.options?.length || 0) > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const newOptions = (
                                      field.options || []
                                    ).filter((_, i) => i !== optIndex);
                                    handleFieldChange(
                                      index,
                                      "options",
                                      newOptions
                                    );
                                  }}
                                  className="text-red-500"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Placeholder (not for attachment) */}
                    {field.fieldType !== "attachment" && (
                      <div className="space-y-2">
                        <Label htmlFor={`field-${index}-placeholder`}>
                          {t("admin.forms.placeholderOptional")}
                        </Label>
                        <Input
                          id={`field-${index}-placeholder`}
                          value={field.placeholder || ""}
                          onChange={(e) =>
                            handleFieldChange(
                              index,
                              "placeholder",
                              e.target.value
                            )
                          }
                          placeholder={t("admin.forms.placeholderText")}
                          dir={formIsRtl ? "rtl" : "ltr"}
                        />
                      </div>
                    )}

                    {/* Attachment Note */}
                    {field.fieldType === "attachment" && (
                      <div className="bg-amber-50 p-3 rounded-md">
                        <p className="text-sm text-amber-700">
                          {t("admin.forms.attachmentNote")}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Bottom Bar */}
      <div
        className={`fixed bottom-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40 ${
          isRtl ? "left-0 right-64" : "left-64 right-0"
        }`}
      >
        <div
          className={`flex ${
            isRtl ? "flex-row-reverse" : "flex-row"
          } justify-between items-center gap-4`}
        >
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/forms")}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={saving} size="lg">
            {saving ? t("admin.forms.updating") : t("common.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
