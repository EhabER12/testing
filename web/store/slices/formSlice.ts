import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  getForms,
  ApiForm,
  GetFormsResponse,
  GetSingleFormResponse,
  getFormById, // Assuming we might need admin view too
  getPublicFormBySlug,
  updateForm,
  submitForm, // Add import
  SubmitFormResponse, // Add import
  createForm, // Add import for createForm
} from "../services/formService";

export type Form = ApiForm;

interface FormState {
  forms: Form[];
  isLoading: boolean;
  error: string | null; // Error for list

  selectedForm: Form | null; // For admin edit page
  isLoadingSelected: boolean;
  errorSelected: string | null;

  publicForm: Form | null; // For public view page
  isLoadingPublicForm: boolean;
  errorPublicForm: string | null;

  // Add state for creating form
  isCreatingForm: boolean;
  createFormError: string | null;
  createFormSuccess: boolean;

  // Add submission state
  isSubmitting: boolean;
  submissionError: string | null;
  submissionSuccess: boolean;
}

const initialState: FormState = {
  forms: [],
  isLoading: false,
  error: null,
  selectedForm: null,
  isLoadingSelected: false,
  errorSelected: null,
  publicForm: null,
  isLoadingPublicForm: false,
  errorPublicForm: null,
  // Add initial create form state
  isCreatingForm: false,
  createFormError: null,
  createFormSuccess: false,
  // Add initial submission state
  isSubmitting: false,
  submissionError: null,
  submissionSuccess: false,
};

const formSlice = createSlice({
  name: "forms",
  initialState,
  reducers: {
    resetFormState: (state) => {
      // Reset list state
      state.forms = [];
      state.isLoading = false;
      state.error = null;
    },
    resetSelectedForm: (state) => {
      state.selectedForm = null;
      state.isLoadingSelected = false;
      state.errorSelected = null;
    },
    resetPublicForm: (state) => {
      state.publicForm = null;
      state.isLoadingPublicForm = false;
      state.errorPublicForm = null;
    },
    // Add reset for create form state
    resetCreateForm: (state) => {
      state.isCreatingForm = false;
      state.createFormError = null;
      state.createFormSuccess = false;
    },
    // Add reset for submission state
    resetSubmission: (state) => {
      state.isSubmitting = false;
      state.submissionError = null;
      state.submissionSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get All Forms (List)
      .addCase(getForms.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        getForms.fulfilled,
        (state, action: PayloadAction<GetFormsResponse>) => {
          state.isLoading = false;
          state.forms = action.payload.data.results;
        }
      )
      .addCase(
        getForms.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.error = action.payload || "Failed to fetch forms";
        }
      )

      // Create Form
      .addCase(createForm.pending, (state) => {
        state.isCreatingForm = true;
        state.createFormError = null;
        state.createFormSuccess = false;
      })
      .addCase(
        createForm.fulfilled,
        (state, action: PayloadAction<GetSingleFormResponse>) => {
          state.isCreatingForm = false;
          if (action.payload.success && action.payload.data) {
            state.createFormSuccess = true;
            // Add the new form to the forms list
            state.forms.push(action.payload.data);
          } else {
            state.createFormError =
              action.payload.message || "Failed to create form";
          }
        }
      )
      .addCase(
        createForm.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.isCreatingForm = false;
          state.createFormError = action.payload || "Failed to create form";
        }
      )

      // Get Form By ID (Admin Edit)
      .addCase(getFormById.pending, (state) => {
        state.isLoadingSelected = true;
        state.selectedForm = null;
        state.errorSelected = null;
      })
      .addCase(
        getFormById.fulfilled,
        (state, action: PayloadAction<GetSingleFormResponse>) => {
          state.isLoadingSelected = false;
          if (action.payload.success && action.payload.data) {
            state.selectedForm = action.payload.data;
          } else {
            state.errorSelected =
              action.payload.message || "Failed to get form details";
          }
        }
      )
      .addCase(
        getFormById.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoadingSelected = false;
          state.errorSelected =
            action.payload || "Failed to fetch form details";
        }
      )

      // Get Public Form By Slug
      .addCase(getPublicFormBySlug.pending, (state) => {
        state.isLoadingPublicForm = true;
        state.publicForm = null;
        state.errorPublicForm = null;
      })
      .addCase(
        getPublicFormBySlug.fulfilled,
        (state, action: PayloadAction<GetSingleFormResponse>) => {
          state.isLoadingPublicForm = false;
          if (action.payload.success && action.payload.data) {
            state.publicForm = action.payload.data;
          } else {
            state.errorPublicForm =
              action.payload.message || "Public form not found or invalid data";
          }
        }
      )
      .addCase(
        getPublicFormBySlug.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoadingPublicForm = false;
          state.errorPublicForm =
            action.payload || "Failed to fetch public form";
        }
      )

      // Update Form (Admin Edit)
      .addCase(updateForm.pending, (state) => {
        state.isLoadingSelected = true; // Use selected loading indicator
        state.errorSelected = null;
      })
      .addCase(
        updateForm.fulfilled,
        (state, action: PayloadAction<GetSingleFormResponse>) => {
          state.isLoadingSelected = false;
          // Optionally update state.selectedForm if needed after update
          // Or potentially update the list state.forms if displayed on same page
          if (action.payload.success && action.payload.data) {
            // Find and update in the main list if present
            const index = state.forms.findIndex(
              (f) => f._id === action.payload.data._id
            );
            if (index !== -1) {
              state.forms[index] = action.payload.data;
            }
            // Also update selected form if it's the one being edited
            if (state.selectedForm?._id === action.payload.data._id) {
              state.selectedForm = action.payload.data;
            }
          } else {
            // Handle update failure reported by API
            state.errorSelected =
              action.payload.message ||
              "Update successful, but failed to get updated data";
          }
        }
      )
      .addCase(
        updateForm.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoadingSelected = false;
          state.errorSelected = action.payload || "Failed to update form";
        }
      )

      // Submit Form (Public form submission)
      .addCase(submitForm.pending, (state) => {
        state.isSubmitting = true;
        state.submissionError = null;
        state.submissionSuccess = false;
      })
      .addCase(
        submitForm.fulfilled,
        (state, action: PayloadAction<SubmitFormResponse>) => {
          state.isSubmitting = false;
          if (action.payload.success) {
            state.submissionSuccess = true;
          } else {
            state.submissionError =
              action.payload.message || "Submission failed";
          }
        }
      )
      .addCase(
        submitForm.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.isSubmitting = false;
          state.submissionError = action.payload || "Failed to submit form";
        }
      );
  },
});

export const {
  resetFormState,
  resetSelectedForm,
  resetPublicForm,
  resetSubmission,
  resetCreateForm, // Export the new reset action
} = formSlice.actions;
export default formSlice.reducer;
