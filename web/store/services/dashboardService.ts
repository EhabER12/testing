import axiosInstance from "@/lib/axios";

export interface DashboardStats {
  revenue: {
    today: number;
    week: number;
    month: number;
    total: number;
    currency: string;
    history?: { _id: string; total: number }[];
  };
  orders: {
    pending: number;
    processing: number;
    completed: number;
    delivered: number;
    failed: number;
  };
  carts: {
    abandoned: number;
    converted: number;
    potentialRevenue: number;
    conversionRate: number;
  };
  content: {
    articles: {
      published: number;
      draft: number;
      total: number;
      totalViews: number;
    };
    products: number;
    services: number;
  };
  users: {
    total: number;
    newThisWeek: number;
    byRole: {
      admin: number;
      moderator: number;
      user: number;
    };
  };
  reviews: {
    pending: number;
    avgRating: string;
  };
  seo: {
    suggestionsPending: number;
  };
  aiArticles: {
    scheduled: number;
  };
  lms?: {
    courses?: {
      total: number;
      published: number;
      draft: number;
    };
    enrollments?: {
      total: number;
      completed: number;
      completionRate: number;
    };
    certificates?: number;
    studentMembers?: {
      active: number;
    };
    teachers?: {
      total: number;
      groups: number;
      activeStudents: number;
      expectedRevenue: number;
    };
  };
  analytics?: {
    users: number;
    sessions: number;
    pageViews: number;
    avgSessionDuration: number;
    realtimeUsers?: number;
    topCountries?: { country: string; users: number }[];
    topPages?: { path: string; title: string; views: number }[];
  };
}

export interface ActivityItem {
  type: "payment" | "review" | "user";
  title: string;
  subtitle: string;
  status: string;
  timestamp: string;
}

// Analytics types
export interface AnalyticsData {
  dateRange: { startDate: string; endDate: string };
  overview: {
    users: number;
    sessions: number;
    pageViews: number;
    avgSessionDuration: number;
    realtimeUsers: number;
  };
  topCountries: { country: string; users: number }[];
  topPages: { path: string; title: string; views: number }[];
  trafficSources: {
    source: string;
    medium: string;
    sessions: number;
    users: number;
  }[];
  devices: { device: string; sessions: number; users: number }[];
  browsers: { browser: string; sessions: number }[];
}

export interface PageDetails {
  path: string;
  views: number;
  users: number;
  avgDuration: number;
  bounceRate: number;
  countries: { country: string; views: number }[];
  devices: { device: string; views: number }[];
}

export interface TeacherStats {
  courses: {
    total: number;
    published: number;
    pending: number;
    draft: number;
  };
  enrollments: {
    total: number;
    completed: number;
    completionRate: number;
  };
  groups: {
    total: number;
    activeStudents: number;
  };
  revenue: {
    expected: number;
    currency: string;
  };
  recentCourses: any[];
  recentStudents?: any[];
}

// Get comprehensive dashboard stats
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await axiosInstance.get("/dashboard/stats");
  return response.data.data;
};

// Get teacher-specific dashboard stats
export const getTeacherStats = async (): Promise<TeacherStats> => {
  const response = await axiosInstance.get("/dashboard/teacher-stats");
  return response.data.data;
};

// Get recent activity
export const getRecentActivity = async (
  limit?: number
): Promise<ActivityItem[]> => {
  const response = await axiosInstance.get("/dashboard/activity", {
    params: { limit },
  });
  return response.data.data;
};

// Get detailed analytics with date range
export const getAnalytics = async (
  startDate?: string,
  endDate?: string
): Promise<AnalyticsData> => {
  const response = await axiosInstance.get("/dashboard/analytics", {
    params: { startDate, endDate },
  });
  return response.data.data;
};

// Get page-specific analytics
export const getPageAnalytics = async (
  path: string,
  startDate?: string,
  endDate?: string
): Promise<PageDetails> => {
  const response = await axiosInstance.get("/dashboard/analytics/page", {
    params: { path, startDate, endDate },
  });
  return response.data.data;
};

// Product analytics types
export interface ProductAnalyticsItem {
  id: string;
  title: { ar: string; en: string };
  slug: string;
  views: number;
  salesCount: number;
  revenue: number;
  refundsCount: number;
  refundAmount: number;
  netRevenue: number;
}

export interface ProductAnalyticsData {
  products: ProductAnalyticsItem[];
  totals: {
    totalSales: number;
    totalRevenue: number;
    totalRefunds: number;
    totalRefundAmount: number;
    totalViews: number;
  };
}

// Get product analytics
export const getProductAnalytics = async (
  startDate?: string,
  endDate?: string
): Promise<ProductAnalyticsData> => {
  const response = await axiosInstance.get("/dashboard/products/analytics", {
    params: { startDate, endDate },
  });
  return response.data.data;
};
