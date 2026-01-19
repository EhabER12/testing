import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  EmailTemplate,
  getEmailTemplates,
  getEmailTemplateByName,
  saveEmailTemplate,
} from "../services/emailTemplateService";

interface EmailTemplateState {
  templates: EmailTemplate[];
  currentTemplate: EmailTemplate | null;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: EmailTemplateState = {
  templates: [],
  currentTemplate: null,
  isLoading: false,
  error: null,
  success: false,
};

const emailTemplateSlice = createSlice({
  name: "emailTemplates",
  initialState,
  reducers: {
    resetEmailTemplateStatus: (state) => {
      state.isLoading = false;
      state.error = null;
      state.success = false;
    },
    clearCurrentTemplate: (state) => {
      state.currentTemplate = null;
    },
  },
  extraReducers: (builder) => {
    // Get All Templates
    builder
      .addCase(getEmailTemplates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getEmailTemplates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.templates = action.payload;
      })
      .addCase(getEmailTemplates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get Template By Name
    builder
      .addCase(getEmailTemplateByName.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getEmailTemplateByName.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTemplate = action.payload;
      })
      .addCase(getEmailTemplateByName.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Save Template
    builder
      .addCase(saveEmailTemplate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(saveEmailTemplate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        const index = state.templates.findIndex((t) => t.name === action.payload.name);
        if (index !== -1) {
          state.templates[index] = action.payload;
        } else {
          state.templates.unshift(action.payload);
        }
        state.currentTemplate = action.payload;
      })
      .addCase(saveEmailTemplate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.success = false;
      });
  },
});

export const { resetEmailTemplateStatus, clearCurrentTemplate } = emailTemplateSlice.actions;
export default emailTemplateSlice.reducer;
