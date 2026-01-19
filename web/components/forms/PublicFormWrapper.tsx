"use client";

import React from "react";
import { useAppDispatch } from "@/store/hooks";
import {
  submitForm,
  ApiForm,
  getLocalizedText,
} from "@/store/services/formService";
import { resetSubmission } from "@/store/slices/formSlice";
import { DynamicForm } from "@/components/forms/DynamicForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PublicFormWrapperProps {
  form: ApiForm;
  locale?: "ar" | "en";
}

export function PublicFormWrapper({
  form,
  locale = "ar",
}: PublicFormWrapperProps) {
  const dispatch = useAppDispatch();

  const handleSubmit = async (data: Record<string, any> | FormData) => {
    try {
      dispatch(resetSubmission());

      if (data instanceof FormData) {
        let formData: any = {};
        let files: Record<string, File> = {};

        for (const [key, value] of data.entries()) {
          if (key.startsWith("files.")) {
            const fieldId = key.split(".")[1];
            if (value instanceof File) {
              files[fieldId] = value;
            }
          } else {
            // Normal field
            try {
              formData[key] = JSON.parse(value as string);
            } catch (e) {
              formData[key] = value;
            }
          }
        }

        const payload = {
          data: formData,
          files: files,
        };

        await dispatch(
          submitForm({
            formId: form._id,
            formData: payload,
          })
        ).unwrap();
      } else {
        // Regular JSON submission (no files)
        await dispatch(
          submitForm({
            formId: form._id,
            formData: data,
          })
        ).unwrap();
      }
    } catch (error) {
      console.error("[PublicFormWrapper] Submission error:", error);
      throw error; // Let the form component handle the error
    }
  };

  const title = getLocalizedText(form.title, locale);
  const description = getLocalizedText(form.description, locale);

  return (
    <div className="container mx-auto max-w-2xl p-4 py-10">
      <Card className="bg-background">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && (
            <CardDescription className="text-black">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <DynamicForm form={form} onSubmit={handleSubmit} locale={locale} />
        </CardContent>
      </Card>
    </div>
  );
}
