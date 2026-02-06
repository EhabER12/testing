import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/lib/axios";
import { BilingualText } from "./courseService";

export type TeacherType = "course" | "subscription";

export interface SubscriptionTeacherRef {
  id?: string;
  _id?: string;
  name: BilingualText;
  email?: string;
  phone?: string;
}

export interface TeacherGroup {
  id: string;
  _id?: string;
  teacherType?: TeacherType;
  teacherId?: {
    id: string;
    _id?: string;
    fullName: BilingualText;
    email: string;
    profilePic?: string;
    teacherInfo?: {
      isApproved?: boolean;
      studentsCount?: number;
      coursesCount?: number;
    };
  };
  subscriptionTeacherId?: string;
  subscriptionTeacher?: SubscriptionTeacherRef | null;
  groupName?: BilingualText;
  students: {
    studentId: {
      id: string;
      _id?: string;
      studentName: BilingualText;
      whatsappNumber: string;
      packageId?: {
        id: string;
        _id?: string;
        name: BilingualText;
        price: number;
      };
      status: string;
      subscriptionStartDate: string;
      subscriptionEndDate: string;
    };
    assignedDate: string;
    status: "active" | "inactive" | "completed";
    id: string;
    _id?: string;
  }[];
  groupType: "individual" | "group";
  pricing: {
    individualRate: number;
    groupRate: number;
    studentsPerIndividual: number;
    currency: "EGP" | "SAR" | "USD";
  };
  permissions: {
    canUploadCourses: boolean;
    canPublishDirectly: boolean;
  };
  stats: {
    totalStudents: number;
    activeStudents: number;
    completedStudents: number;
    coursesCreated: number;
    totalRevenue: number;
  };
  schedule?: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  expectedRevenue?: number;
}

export interface CreateTeacherGroupData {
  teacherId?: string;
  subscriptionTeacherId?: string;
  teacherType?: TeacherType;
  groupName?: BilingualText;
  students?: {
    studentId: string;
    status?: "active" | "inactive" | "completed";
  }[];
  groupType: "individual" | "group";
  pricing: {
    individualRate: number;
    groupRate: number;
    studentsPerIndividual: number;
    currency: "EGP" | "SAR" | "USD";
  };
  permissions?: {
    canUploadCourses: boolean;
    canPublishDirectly: boolean;
  };
  schedule?: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  notes?: string;
}

export interface UpdateTeacherGroupData extends Partial<CreateTeacherGroupData> {
  isActive?: boolean;
}

export interface TeacherStatistics {
  teacherId: string;
  totalGroups: number;
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  coursesCreated: number;
  expectedRevenue: number;
  groups: {
    id: string;
    groupName?: BilingualText;
    groupType: string;
    studentsCount: number;
    activeStudentsCount: number;
  }[];
}

export interface TeacherWithStats {
  id: string;
  _id?: string;
  fullName: BilingualText;
  email: string;
  profilePic?: string;
  teacherInfo?: {
    isApproved?: boolean;
    studentsCount?: number;
    coursesCount?: number;
  };
  statistics: TeacherStatistics;
}

// Get all teacher groups
export const getTeacherGroups = createAsyncThunk<
  TeacherGroup[],
  {
    teacherId?: string;
    subscriptionTeacherId?: string;
    teacherType?: TeacherType;
    groupType?: string;
    isActive?: boolean;
  } | undefined,
  { rejectValue: string }
>("teacherGroups/getAll", async (filters, { rejectWithValue }) => {
  try {
    const params = new URLSearchParams();
    if (filters?.teacherId) params.append("teacherId", filters.teacherId);
    if (filters?.subscriptionTeacherId) {
      params.append("subscriptionTeacherId", filters.subscriptionTeacherId);
    }
    if (filters?.teacherType) params.append("teacherType", filters.teacherType);
    if (filters?.groupType) params.append("groupType", filters.groupType);
    if (filters?.isActive !== undefined) params.append("isActive", filters.isActive.toString());

    const response = await axios.get(`/teacher-groups?${params.toString()}`);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch teacher groups"
    );
  }
});

// Get teacher group by ID
export const getTeacherGroup = createAsyncThunk<
  TeacherGroup,
  string,
  { rejectValue: string }
>("teacherGroups/getById", async (id, { rejectWithValue }) => {
  try {
    const response = await axios.get(`/teacher-groups/${id}`);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch teacher group"
    );
  }
});

// Create teacher group
export const createTeacherGroup = createAsyncThunk<
  TeacherGroup,
  CreateTeacherGroupData,
  { rejectValue: string }
>("teacherGroups/create", async (data, { rejectWithValue }) => {
  try {
    const response = await axios.post("/teacher-groups", data);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to create teacher group"
    );
  }
});

// Update teacher group
export const updateTeacherGroup = createAsyncThunk<
  TeacherGroup,
  { id: string; data: UpdateTeacherGroupData },
  { rejectValue: string }
>("teacherGroups/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await axios.put(`/teacher-groups/${id}`, data);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to update teacher group"
    );
  }
});

// Delete teacher group
export const deleteTeacherGroup = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("teacherGroups/delete", async (id, { rejectWithValue }) => {
  try {
    await axios.delete(`/teacher-groups/${id}`);
    return id;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to delete teacher group"
    );
  }
});

// Add student to group
export const addStudentToGroup = createAsyncThunk<
  TeacherGroup,
  { groupId: string; studentId: string },
  { rejectValue: string }
>("teacherGroups/addStudent", async ({ groupId, studentId }, { rejectWithValue }) => {
  try {
    const response = await axios.post(`/teacher-groups/${groupId}/students`, { studentId });
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to add student to group"
    );
  }
});

// Remove student from group
export const removeStudentFromGroup = createAsyncThunk<
  TeacherGroup,
  { groupId: string; studentId: string },
  { rejectValue: string }
>("teacherGroups/removeStudent", async ({ groupId, studentId }, { rejectWithValue }) => {
  try {
    const response = await axios.delete(`/teacher-groups/${groupId}/students/${studentId}`);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to remove student from group"
    );
  }
});

// Update student status in group
export const updateStudentStatus = createAsyncThunk<
  TeacherGroup,
  { groupId: string; studentId: string; status: "active" | "inactive" | "completed" },
  { rejectValue: string }
>("teacherGroups/updateStudentStatus", async ({ groupId, studentId, status }, { rejectWithValue }) => {
  try {
    const response = await axios.patch(`/teacher-groups/${groupId}/students/${studentId}`, { status });
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to update student status"
    );
  }
});

// Get teacher statistics
export const getTeacherStatistics = createAsyncThunk<
  TeacherStatistics,
  string,
  { rejectValue: string }
>("teacherGroups/getStats", async (teacherId, { rejectWithValue }) => {
  try {
    const response = await axios.get(`/teacher-groups/teacher/${teacherId}/stats`);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch teacher statistics"
    );
  }
});

// Get all teachers with statistics
export const getAllTeachersWithStats = createAsyncThunk<
  TeacherWithStats[],
  void,
  { rejectValue: string }
>("teacherGroups/getAllWithStats", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get("/teacher-groups/teachers/all");
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch teachers"
    );
  }
});
