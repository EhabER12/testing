import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/lib/axios";
import { BilingualText } from "./courseService";

export interface EmailTemplate {
  _id: string;
  name: string;
  type: string;
  subject: BilingualText;
  content: BilingualText;
  variables: {
    name: string;
    description: string;
  }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Get all email templates
export const getEmailTemplates = createAsyncThunk<
  EmailTemplate[],
  void,
  { rejectValue: string }
>("emailTemplates/getAll", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get("/settings/email/templates");
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch email templates"
    );
  }
});

// Get email template by name
export const getEmailTemplateByName = createAsyncThunk<
  EmailTemplate,
  string,
  { rejectValue: string }
>("emailTemplates/getByName", async (name, { rejectWithValue }) => {
  try {
    const response = await axios.get(`/settings/email/templates/${name}`);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch email template"
    );
  }
});

// Save (create or update) email template
export const saveEmailTemplate = createAsyncThunk<
  EmailTemplate,
  Partial<EmailTemplate>,
  { rejectValue: string }
>("emailTemplates/save", async (data, { rejectWithValue }) => {
  try {
    const response = await axios.post("/settings/email/templates", data);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to save email template"
    );
  }
});
