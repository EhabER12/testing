import axiosInstance from "@/lib/axios";
import { createAsyncThunk } from "@reduxjs/toolkit";

// Bilingual text support for AR/EN content
export interface BilingualText {
  ar: string;
  en: string;
}

// Helper to check if value is BilingualText
export function isBilingualText(value: any): value is BilingualText {
  return value && typeof value === "object" && ("ar" in value || "en" in value);
}

// Helper to get text for a specific language
export function getLocalizedText(
  value: string | BilingualText | undefined,
  locale: "ar" | "en"
): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[locale] || value.en || value.ar || "";
}

export function flattenBilingualText(
  value: string | BilingualText | undefined
): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.ar || value.en || "";
}

// Helper to create empty bilingual text
export function createEmptyBilingualText(): BilingualText {
  return { ar: "", en: "" };
}

export interface FormField {
  _id?: string;
  id: string;
  label: string | BilingualText;
  fieldType:
    | "text"
    | "email"
    | "textarea"
    | "select"
    | "checkbox"
    | "radio"
    | "tel"
    | "number"
    | "date"
    | "attachment";
  placeholder?: string | BilingualText;
  required?: boolean;
  options?: string[] | BilingualText[];

  type?: string;

  isAttachment?: boolean;
  originalType?: string;
}

export interface ApiForm {
  _id: string;
  id?: string;
  title: string | BilingualText;
  slug?: string;
  description?: string | BilingualText;
  fields: FormField[];
  submissions?: any[];
  createdAt: string;
  updatedAt: string;
  status?: "published" | "draft" | string;
}

export interface GetFormsResponse {
  success: boolean;
  data: {
    results: ApiForm[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message: string | null;
}

export interface GetSingleFormResponse {
  success: boolean;
  data: ApiForm;
  message: string | null;
}

export const getForms = createAsyncThunk<
  GetFormsResponse,
  void,
  { rejectValue: string }
>("forms/getAll", async (_, thunkAPI) => {
  try {
    const response = await axiosInstance.get("/forms");
    return response.data as GetFormsResponse;
  } catch (error: any) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

function mapFieldTypeForBackend(fieldType: string): string {
  const supportedTypes = [
    "text",
    "email",
    "tel",
    "number",
    "select",
    "checkbox",
    "radio",
    "textarea",
    "date",
  ];

  return supportedTypes.includes(fieldType) ? fieldType : "text";
}

function processFormFields(fields: FormField[]): any[] {
  return fields.map((field) => {
    const cleanField = Object.entries(field).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    const rawType = cleanField.fieldType || cleanField.type || "text";
    const backendType = mapFieldTypeForBackend(rawType);

    const label = flattenBilingualText(cleanField.label);
    const placeholder = flattenBilingualText(cleanField.placeholder);

    const options = cleanField.options?.map((opt: string | BilingualText) =>
      typeof opt === "string" ? opt : flattenBilingualText(opt)
    );

    const result: Record<string, any> = {
      id: cleanField.id,
      label,
      type: backendType,
      required: cleanField.required || false,
      originalType: cleanField.fieldType,
    };

    // Only include placeholder if non-empty
    if (placeholder) {
      result.placeholder = placeholder;
    }

    // Only include options for select/checkbox/radio
    if (
      options &&
      options.length > 0 &&
      (rawType === "select" || rawType === "checkbox" || rawType === "radio")
    ) {
      result.options = options.filter((opt: string) => opt); // Filter out empty strings
    }

    if (rawType === "attachment") {
      result.isAttachment = true;
      result.originalType = "attachment";
      result.type = "attachment";
    }

    return result;
  });
}
const fieldTypeRegistry: Record<string, Record<string, string>> = {};

function registerFormFieldTypes(formId: string, fields: FormField[]): void {
  if (!fieldTypeRegistry[formId]) {
    fieldTypeRegistry[formId] = {};
  }

  fields.forEach((field) => {
    if (field.id) {
      const fieldType = field.fieldType || field.type;
      if (fieldType) {
        fieldTypeRegistry[formId][field.id] = fieldType;
      }

      if (
        field.isAttachment ||
        field.originalType === "attachment" ||
        fieldType === "attachment"
      ) {
        fieldTypeRegistry[formId][field.id] = "attachment";
      }
    }
  });
}

// Restore field type information to a form response
function restoreFormFieldTypes(formId: string, form: ApiForm): ApiForm {
  if (!fieldTypeRegistry[formId] || !form.fields) {
    return form;
  }

  const processedForm = {
    ...form,
    fields: form.fields.map((field) => {
      const registeredType = field.id
        ? fieldTypeRegistry[formId][field.id]
        : null;

      if (registeredType === "attachment") {
        return {
          ...field,
          fieldType: "attachment" as any, // Type assertion to avoid issues
          isAttachment: true,
          originalType: "attachment",
        };
      }

      return {
        ...field,
        fieldType: field.fieldType || field.type,
      };
    }),
  };

  return processedForm as ApiForm; // Type assertion
}

// Thunk to create a new form
export const createForm = createAsyncThunk<
  GetSingleFormResponse,
  Partial<ApiForm>,
  { rejectValue: string }
>("forms/create", async (formData, thunkAPI) => {
  try {
    // Process and store field type information
    if (formData.fields) {
      registerFormFieldTypes("new-form", formData.fields);
    }

    const processedFormData = {
      title: flattenBilingualText(formData.title),
      description: flattenBilingualText(formData.description),
      status: formData.status || "draft",
      slug: formData.slug,
      fields: processFormFields(formData.fields || []),
    };

    const response = await axiosInstance.post("/forms", processedFormData);

    if (response.data?.success && response.data?.data?._id && formData.fields) {
      registerFormFieldTypes(response.data.data._id, formData.fields);
      response.data.data = restoreFormFieldTypes(
        response.data.data._id,
        response.data.data
      );
    }

    return response.data as GetSingleFormResponse;
  } catch (error: any) {
    // Log the full error for debugging
    console.error("Create form error:", error.response?.data || error);
    const message =
      error.response?.data?.message || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// Thunk to fetch a single form by ID
export const getFormById = createAsyncThunk<
  GetSingleFormResponse,
  string, // formId
  { rejectValue: string }
>("forms/getById", async (formId, thunkAPI) => {
  try {
    const response = await axiosInstance.get(`/forms/${formId}`);

    // Restore field types in the response
    if (response.data?.success && response.data?.data) {
      response.data.data = restoreFormFieldTypes(formId, response.data.data);
    }

    return response.data as GetSingleFormResponse;
  } catch (error: any) {
    const message =
      error.response?.data?.message || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// Thunk to update a form
export const updateForm = createAsyncThunk<
  GetSingleFormResponse,
  { formId: string; formData: Partial<ApiForm> },
  { rejectValue: string }
>("forms/update", async ({ formId, formData }, thunkAPI) => {
  try {
    const { _id, ...updateData } = formData;

    if (updateData.fields) {
      registerFormFieldTypes(formId, updateData.fields);
    }

    const processedFormData = {
      title: flattenBilingualText(updateData.title),
      description: flattenBilingualText(updateData.description),
      status: updateData.status,
      slug: updateData.slug,
      fields: processFormFields(updateData.fields || []),
    };

    const response = await axiosInstance.put(
      `/forms/${formId}`,
      processedFormData
    );

    if (response.data?.success && response.data?.data) {
      response.data.data = restoreFormFieldTypes(formId, response.data.data);
    }

    return response.data as GetSingleFormResponse;
  } catch (error: any) {
    console.error("Update form error:", error.response?.data || error);
    const message =
      error.response?.data?.message || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const getPublicFormBySlug = createAsyncThunk<
  GetSingleFormResponse,
  string, // slug
  { rejectValue: string }
>("forms/getPublicBySlug", async (slug, thunkAPI) => {
  try {
    // No auth needed for public endpoint
    const response = await axiosInstance.get(`/forms/public/by-slug/${slug}`);
    return response.data as GetSingleFormResponse;
  } catch (error: any) {
    console.error("Error fetching public form by slug:", error);
    const message =
      error.response?.data?.message || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// Interface for form submission response
export interface SubmitFormResponse {
  success: boolean;
  data: {
    _id: string;
    submittedAt: string;
  };
  message: string | null;
}

// Thunk to submit a form
export const submitForm = createAsyncThunk<
  SubmitFormResponse,
  { formId: string; formData: Record<string, any> },
  { rejectValue: string }
>("forms/submit", async ({ formId, formData }, thunkAPI) => {
  try {
    const hasFiles = formData.files && Object.keys(formData.files).length > 0;

    if (hasFiles) {
      const multipartFormData = new FormData();

      multipartFormData.append("data", JSON.stringify(formData.data || {}));

      if (formData.files) {
        Object.entries(formData.files).forEach(([fieldId, file]) => {
          multipartFormData.append(fieldId, file as File);
        });
      }

      const response = await axiosInstance.post(
        `/forms/${formId}/submit`,
        multipartFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data as SubmitFormResponse;
    } else {
      // Regular JSON submission without files
      const payload = { data: formData.data || formData };
      const response = await axiosInstance.post(
        `/forms/${formId}/submit`,
        payload
      );
      return response.data as SubmitFormResponse;
    }
  } catch (error: any) {
    console.error("Error submitting form:", error);
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.error?.details?.[0]?.message ||
      (Array.isArray(error.response?.data?.missingFields)
        ? `Missing required fields: ${error.response.data.missingFields.join(
            ", "
          )}`
        : error.message || "Failed to submit form");
    return thunkAPI.rejectWithValue(message);
  }
});
