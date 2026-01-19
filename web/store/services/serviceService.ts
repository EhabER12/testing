import axiosInstance from "@/lib/axios";

export const serviceService = {
  // Get all services
  getServices: async (params?: {
    category?: string;
    featured?: boolean;
    active?: boolean;
    limit?: number;
    page?: number;
  }) => {
    const response = await axiosInstance.get("/services", { params });
    return response.data;
  },

  // Get featured services
  getFeaturedServices: async () => {
    const response = await axiosInstance.get("/services/featured");
    return response.data.services;
  },

  // Get service by slug
  getServiceBySlug: async (slug: string) => {
    const response = await axiosInstance.get(`/services/slug/${slug}`);
    return response.data.service;
  },

  // Get service by ID
  getServiceById: async (id: string) => {
    const response = await axiosInstance.get(`/services/${id}`);
    return response.data.service;
  },

  // Get categories
  getCategories: async () => {
    const response = await axiosInstance.get("/services/categories");
    return response.data.categories;
  },

  // Create service (admin)
  createService: async (data: FormData) => {
    const response = await axiosInstance.post("/services", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.service;
  },

  // Update service (admin)
  updateService: async (id: string, data: FormData) => {
    const response = await axiosInstance.put(`/services/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.service;
  },

  // Delete service (admin)
  deleteService: async (id: string) => {
    await axiosInstance.delete(`/services/${id}`);
    return id;
  },

  // Toggle status (admin)
  toggleStatus: async (
    id: string,
    updates: { isActive?: boolean; isFeatured?: boolean }
  ) => {
    const response = await axiosInstance.patch(
      `/services/${id}/status`,
      updates
    );
    return response.data.service;
  },

  // Reorder services (admin)
  reorderServices: async (orderedIds: string[]) => {
    await axiosInstance.post("/services/reorder", { orderedIds });
  },

  // Remove gallery image (admin)
  removeGalleryImage: async (id: string, imageUrl: string) => {
    const response = await axiosInstance.post(
      `/services/${id}/gallery/remove`,
      {
        imageUrl,
      }
    );
    return response.data.service;
  },
};

export default serviceService;
