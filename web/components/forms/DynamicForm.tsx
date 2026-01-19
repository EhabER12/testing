import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { DynamicFormField } from "./DynamicFormField";
import { FormField as ApiFormField } from "@/store/services/formService";
import { ApiForm } from "@/store/services/formService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface DynamicFormProps {
  form: ApiForm;
  onSubmit: (data: Record<string, any> | FormData) => Promise<void>;
  locale?: "ar" | "en";
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  form,
  onSubmit,
  locale = "ar",
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const hasAttachmentFields = form.fields.some((field) => {
    return (
      field.fieldType === "attachment" ||
      field.isAttachment ||
      field.originalType === "attachment"
    );
  });

  const methods = useForm({
    defaultValues: form.fields.reduce((acc, field) => {
      const fieldType = field.fieldType || (field as any).type;
      const isAttachment =
        fieldType === "attachment" ||
        field.isAttachment ||
        field.originalType === "attachment";

      if (fieldType === "checkbox") {
        acc[field.id] = [];
      } else if (isAttachment) {
        // File fields start empty
        acc[field.id] = null;
      } else {
        acc[field.id] = "";
      }
      return acc;
    }, {} as Record<string, any>),
    mode: "onSubmit",
  });

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      setIsSubmitting(true);
      setSubmitSuccess(false);
      setSubmitError(null);

      if (hasAttachmentFields) {
        const formData = new FormData();

        Object.keys(data).forEach((fieldId) => {
          const field = form.fields.find((f) => f.id === fieldId);
          const value = data[fieldId];

          if (value == null) return;

          const isAttachment =
            field?.fieldType === "attachment" ||
            field?.isAttachment ||
            field?.originalType === "attachment";

          if (isAttachment && value instanceof File) {
            formData.append(`files.${fieldId}`, value);
          } else if (Array.isArray(value)) {
            formData.append(fieldId, JSON.stringify(value));
          } else {
            formData.append(fieldId, value);
          }
        });

        await onSubmit(formData);
      } else {
        await onSubmit(data);
      }

      setSubmitSuccess(true);

      // Reset form data
      methods.reset();

      // Explicitly clear file inputs
      if (hasAttachmentFields) {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach((input) => {
          if (input instanceof HTMLInputElement) {
            input.value = "";
          }
        });
      }
    } catch (error: any) {
      console.error("Form submission error:", error);
      let errorMessage = "Failed to submit form";

      if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {submitSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Thank You!</AlertTitle>
          <AlertDescription className="text-green-700">
            Your submission has been received.
          </AlertDescription>
        </Alert>
      )}

      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <Form {...methods}>
        <form
          onSubmit={methods.handleSubmit(handleSubmit)}
          className="space-y-6"
          encType={
            hasAttachmentFields
              ? "multipart/form-data"
              : "application/x-www-form-urlencoded"
          }
        >
          {form.fields.map((field: ApiFormField) => (
            <DynamicFormField
              key={field.id}
              field={field}
              control={methods.control}
              locale={locale}
            />
          ))}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};
