import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/lib/axios";
import { BilingualText } from "./courseService";

export interface Certificate {
  id: string;
  _id?: string;
  userId: {
    id: string;
    _id?: string;
    fullName: BilingualText;
    email: string;
  };
  courseId: {
    id: string;
    _id?: string;
    title: BilingualText;
  };
  certificateNumber: string;
  issuedAt: string;
  status: "issued" | "revoked";
  templateId?: string;
  pdfUrl?: string;
  metadata?: {
    quizScore?: number;
    completionDate?: string;
    grade?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Placeholder {
  text?: string; // For custom text
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: string;
  fontWeight: string;
}

export interface ImagePlaceholder {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CertificateTemplate {
  _id?: string;
  id: string;
  name: string;
  description?: string;
  backgroundImage: string;
  width: number;
  height: number;
  placeholders: {
    studentName: Placeholder;
    courseName: Placeholder;
    issuedDate: Placeholder;
    certificateNumber: Placeholder;
    customText?: Placeholder[];
    images?: ImagePlaceholder[];
    signature?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Issue certificate
export const issueCertificate = createAsyncThunk(
  "certificates/issue",
  async (data: { userId: string; courseId: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post("/certificates/issue", data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to issue certificate"
      );
    }
  }
);

// Get all certificates
export const getCertificates = createAsyncThunk(
  "certificates/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/certificates");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch certificates"
      );
    }
  }
);

// Get single certificate
export const getCertificate = createAsyncThunk(
  "certificates/getOne",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/certificates/${id}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch certificate"
      );
    }
  }
);

// Verify certificate
export const verifyCertificate = createAsyncThunk(
  "certificates/verify",
  async (certificateNumber: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `/certificates/verify/${certificateNumber}`
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to verify certificate"
      );
    }
  }
);

// Revoke certificate
export const revokeCertificate = createAsyncThunk(
  "certificates/revoke",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/certificates/${id}/revoke`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to revoke certificate"
      );
    }
  }
);

// Download certificate PDF
export const downloadCertificate = createAsyncThunk(
  "certificates/download",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/certificates/${id}/download`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to download certificate"
      );
    }
  }
);

// Get my certificates
export const getMyCertificates = createAsyncThunk(
  "certificates/getMyCertificates",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/certificates/my-certificates");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch certificates"
      );
    }
  }
);

// Get my certificate eligibility
export const getMyCertificatesEligibility = createAsyncThunk(
  "certificates/getMyCertificatesEligibility",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/certificates/my-eligibility");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch eligibility"
      );
    }
  }
);

// Claim certificate
export const claimCertificate = createAsyncThunk(
  "certificates/claim",
  async (courseId: string, { rejectWithValue }) => {
    try {
      const response = await axios.post("/certificates/claim", { courseId });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to claim certificate"
      );
    }
  }
);

// Get certificate for a course (check if user has certificate)
export const getCourseCertificate = createAsyncThunk(
  "certificates/getCourseCertificate",
  async (courseId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get("/certificates/my-certificates");
      const certificates = response.data.data;
      // Find certificate for this course
      const certificate = certificates.find(
        (cert: Certificate) => {
          const certCourseId = typeof cert.courseId === 'string' ? cert.courseId : (cert.courseId?.id || cert.courseId?._id);
          return certCourseId === courseId;
        }
      );
      return certificate || null;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch certificate"
      );
    }
  }
);

// Get all templates
export const getAllTemplates = createAsyncThunk(
  "certificates/getAllTemplates",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/certificates/templates");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch templates"
      );
    }
  }
);

// Get template by ID
export const getTemplate = createAsyncThunk(
  "certificates/getTemplate",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/certificates/templates/${id}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch template"
      );
    }
  }
);

// Create template
export const createTemplate = createAsyncThunk(
  "certificates/createTemplate",
  async (data: Partial<CertificateTemplate>, { rejectWithValue }) => {
    try {
      const response = await axios.post("/certificates/templates", data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create template"
      );
    }
  }
);

// Update template
export const updateTemplate = createAsyncThunk(
  "certificates/updateTemplate",
  async ({ id, data }: { id: string; data: Partial<CertificateTemplate> }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/certificates/templates/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update template"
      );
    }
  }
);

// Delete template
export const deleteTemplate = createAsyncThunk(
  "certificates/deleteTemplate",
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/certificates/templates/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete template"
      );
    }
  }
);
