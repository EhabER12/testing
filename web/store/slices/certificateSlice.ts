import { createSlice } from "@reduxjs/toolkit";
import {
  getCertificates,
  getCertificate,
  verifyCertificate,
  getCertificatesByEmail,
  revokeCertificate,
  issueCertificate,
  getAllTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getMyCertificates,
  getMyCertificatesEligibility,
  claimCertificate,
  Certificate,
  CertificateTemplate,
} from "../services/certificateService";
import { BilingualText } from "../services/courseService";

export interface CertificateEligibility {
  courseId: string;
  courseTitle: BilingualText;
  courseSlug: string;
  thumbnail: string;
  status: "claimed" | "eligible" | "not_eligible";
  reason?: string;
  failedQuizzes?: string[];
  progress?: number;
  certificateId?: string;
  certificateNumber?: string;
  pdfUrl?: string;
  issuedAt?: string;
}

interface CertificateState {
  certificates: Certificate[];
  eligibility: CertificateEligibility[];
  templates: CertificateTemplate[];
  currentCertificate: Certificate | null;
  currentTemplate: CertificateTemplate | null;
  verifiedCertificate: Certificate | null;
  publicCertificates: any[]; // For public certificate lookup
  publicUser: any | null; // For public certificate lookup
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
}

const initialState: CertificateState = {
  certificates: [],
  eligibility: [],
  templates: [],
  currentCertificate: null,
  currentTemplate: null,
  verifiedCertificate: null,
  publicCertificates: [],
  publicUser: null,
  isLoading: false,
  isSuccess: false,
  error: null,
};

const certificateSlice = createSlice({
  name: "certificates",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentCertificate: (state) => {
      state.currentCertificate = null;
    },
    clearVerifiedCertificate: (state) => {
      state.verifiedCertificate = null;
    },
    clearCurrentTemplate: (state) => {
      state.currentTemplate = null;
    },
    clearPublicCertificates: (state) => {
      state.publicCertificates = [];
      state.publicUser = null;
    },
    resetStatus: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all certificates
      .addCase(getCertificates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCertificates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.certificates = action.payload;
      })
      .addCase(getCertificates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get single certificate
      .addCase(getCertificate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCertificate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCertificate = action.payload;
      })
      .addCase(getCertificate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Verify certificate
      .addCase(verifyCertificate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyCertificate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.verifiedCertificate = action.payload;
      })
      .addCase(verifyCertificate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get certificates by email (public)
      .addCase(getCertificatesByEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCertificatesByEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.publicCertificates = action.payload.certificates;
        state.publicUser = action.payload.user;
      })
      .addCase(getCertificatesByEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.publicCertificates = [];
        state.publicUser = null;
      })
      // Issue certificate
      .addCase(issueCertificate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.isSuccess = false;
      })
      .addCase(issueCertificate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.certificates.unshift(action.payload);
      })
      .addCase(issueCertificate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isSuccess = false;
      })
      // Revoke certificate
      .addCase(revokeCertificate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(revokeCertificate.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.certificates.findIndex(
          (c) => (c.id || c._id) === (action.payload.id || action.payload._id)
        );
        if (index !== -1) {
          state.certificates[index] = action.payload;
        }
        state.currentCertificate = action.payload;
      })
      .addCase(revokeCertificate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get all templates
      .addCase(getAllTemplates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllTemplates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.templates = action.payload;
      })
      .addCase(getAllTemplates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get single template
      .addCase(getTemplate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTemplate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTemplate = action.payload;
      })
      .addCase(getTemplate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create template
      .addCase(createTemplate.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
        state.error = null;
      })
      .addCase(createTemplate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.templates.unshift(action.payload);
      })
      .addCase(createTemplate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update template
      .addCase(updateTemplate.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
        state.error = null;
      })
      .addCase(updateTemplate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const index = state.templates.findIndex(
          (t) => (t.id || t._id) === (action.payload.id || action.payload._id)
        );
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
        state.currentTemplate = action.payload;
      })
      .addCase(updateTemplate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete template
      .addCase(deleteTemplate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.templates = state.templates.filter((t) => (t.id || t._id) !== action.payload);
      })
      .addCase(deleteTemplate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get my certificates
      .addCase(getMyCertificates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMyCertificates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.certificates = action.payload;
      })
      .addCase(getMyCertificates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get my eligibility
      .addCase(getMyCertificatesEligibility.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMyCertificatesEligibility.fulfilled, (state, action) => {
        state.isLoading = false;
        state.eligibility = action.payload;
      })
      .addCase(getMyCertificatesEligibility.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Claim certificate
      .addCase(claimCertificate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.isSuccess = false;
      })
      .addCase(claimCertificate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.certificates.unshift(action.payload);
        // Update eligibility status
        const index = state.eligibility.findIndex(e => e.courseId === action.payload.courseId?._id || e.courseId === action.payload.courseId);
        if (index !== -1) {
          state.eligibility[index].status = "claimed";
          state.eligibility[index].certificateId = action.payload._id || action.payload.id;
        }
      })
      .addCase(claimCertificate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isSuccess = false;
      });
  },
});

export const {
  clearError,
  clearCurrentCertificate,
  clearVerifiedCertificate,
  clearCurrentTemplate,
  clearPublicCertificates,
  resetStatus,
} = certificateSlice.actions;
export default certificateSlice.reducer;
