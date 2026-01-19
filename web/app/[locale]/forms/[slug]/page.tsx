import { Metadata } from "next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { PublicFormWrapper } from "@/components/forms/PublicFormWrapper";
import { ApiForm, BilingualText } from "@/store/services/formService";

function getTextValue(value: string | BilingualText | undefined): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.en || value.ar || "";
}

async function getForm(slug: string): Promise<ApiForm | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/forms/public/by-slug/${slug}`,
      {
        next: { revalidate: 300 }, // Cache for 5 minutes (ISR)
      }
    );

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch form");
    }

    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching form:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const form = await getForm(slug);

  if (!form) {
    return {
      title: "Form Not Found",
    };
  }

  return {
    title: getTextValue(form.title),
    description: getTextValue(form.description),
  };
}

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const form = await getForm(slug);

  if (!form) {
    return (
      <div className="container mx-auto max-w-2xl p-4 py-10">
        <Alert variant="default">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Form Not Found</AlertTitle>
          <AlertDescription>
            The requested form could not be found.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const transformedForm = {
    ...form,
    fields: form.fields.map((field) => {
      const fieldWithCorrectType = { ...field };

      if (field.isAttachment || field.originalType === "attachment") {
        fieldWithCorrectType.fieldType = "attachment";
      } else if ((field as any).type && !field.fieldType) {
        fieldWithCorrectType.fieldType = (field as any).type;
      }

      return fieldWithCorrectType;
    }),
  };

  return (
    <PublicFormWrapper form={transformedForm} locale={locale as "ar" | "en"} />
  );
}
