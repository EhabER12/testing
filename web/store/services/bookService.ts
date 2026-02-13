import axiosInstance from "@/lib/axios";
import { Product } from "@/store/slices/productSlice";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface Book extends Product {
  productType: "digital_book";
  bookFilePath?: string;
  bookCoverPath?: string;
  author?: { ar?: string; en?: string };
  approvalStatus?: ApprovalStatus;
  approvedAt?: string;
  rejectionReason?: string;
  submittedByRole?: "admin" | "moderator" | "teacher" | "system";
  createdBy?: {
    id?: string;
    _id?: string;
    fullName?: { ar?: string; en?: string };
    email?: string;
    role?: string;
  };
}

type PaginationResult<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

const extractBooks = (payload: any): Book[] => {
  if (Array.isArray(payload?.books)) return payload.books;
  if (Array.isArray(payload?.data?.books)) return payload.data.books;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const bookService = {
  async getBooks(params?: Record<string, any>): Promise<PaginationResult<Book>> {
    const response = await axiosInstance.get("/books", { params });
    const items = extractBooks(response.data);
    const pagination =
      response.data?.pagination ||
      response.data?.data?.pagination || {
        page: 1,
        limit: items.length,
        total: items.length,
        pages: 1,
      };

    return { items, pagination };
  },

  async getBookBySlug(slug: string): Promise<Book> {
    const response = await axiosInstance.get(`/books/${slug}`);
    return response.data?.book || response.data?.data?.book || response.data?.data;
  },

  async getMyBooks(params?: Record<string, any>): Promise<PaginationResult<Book>> {
    const response = await axiosInstance.get("/books/manage/mine", { params });
    const items = extractBooks(response.data);
    const pagination =
      response.data?.pagination ||
      response.data?.data?.pagination || {
        page: 1,
        limit: items.length,
        total: items.length,
        pages: 1,
      };

    return { items, pagination };
  },

  async getPendingBooks(): Promise<Book[]> {
    const response = await axiosInstance.get("/books/manage/pending");
    return extractBooks(response.data);
  },

  async createBook(data: FormData): Promise<Book> {
    const response = await axiosInstance.post("/books", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data?.book || response.data?.data?.book || response.data?.data;
  },

  async reviewBook(
    id: string,
    payload: { action: "approve" | "reject"; rejectionReason?: string }
  ): Promise<Book> {
    const response = await axiosInstance.patch(`/books/${id}/review`, payload);
    return response.data?.book || response.data?.data?.book || response.data?.data;
  },
};

