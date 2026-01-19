export type Submission = {
  _id: string;
  data: Record<string, any>;
  submittedAt: Date;
  formId?: string;
  formTitle?: string;
  mappedData?: Record<string, any>;
  isRead: boolean;
  adminNotes?: string;
};

export type ReadFilter = "all" | "read" | "unread";

export type ExportMode = "current" | "form" | "all" | "dateRange";
