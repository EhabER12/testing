import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  addEmployeeNote,
  deleteEmployeeNote,
  getEmployeeTasks,
  createEmployeeTask,
  updateEmployeeTask,
  deleteEmployeeTask,
  getTaskStats,
  getEmployeeRecords,
  updateEmployeeRecord,
  generateMonthlyRecords,
  getMyProfile,
  getMyTasks,
  updateMyTaskStatus,
  Employee,
  EmployeeTask,
  EmployeeRecord,
  TaskStats,
} from "../services/employeeService";

interface EmployeeManagementState {
  employees: Employee[];
  selectedEmployee: Employee | null;
  currentEmployee: Employee | null; // For self-service (my profile)
  tasks: EmployeeTask[];
  records: EmployeeRecord[];
  taskStats: TaskStats | null;
  isLoading: boolean;
  isTasksLoading: boolean;
  isRecordsLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
  totalPages: number;
  currentPage: number;
  totalEmployees: number;
}

const initialState: EmployeeManagementState = {
  employees: [],
  selectedEmployee: null,
  currentEmployee: null,
  tasks: [],
  records: [],
  taskStats: null,
  isLoading: false,
  isTasksLoading: false,
  isRecordsLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
  totalPages: 1,
  currentPage: 1,
  totalEmployees: 0,
};

export const employeeSlice = createSlice({
  name: "employees",
  initialState,
  reducers: {
    resetEmployeeStatus: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
    resetSelectedEmployee: (state) => {
      state.selectedEmployee = null;
      state.tasks = [];
      state.records = [];
      state.taskStats = null;
    },
    clearTasks: (state) => {
      state.tasks = [];
    },
    clearRecords: (state) => {
      state.records = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // GET ALL EMPLOYEES
      .addCase(getAllEmployees.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllEmployees.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.employees = action.payload.data.results;
        state.totalPages = action.payload.data.pagination.pages;
        state.currentPage = action.payload.data.pagination.page;
        state.totalEmployees = action.payload.data.pagination.total;
      })
      .addCase(getAllEmployees.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })

      // GET EMPLOYEE BY ID
      .addCase(getEmployeeById.pending, (state) => {
        state.isLoading = true;
        state.selectedEmployee = null;
      })
      .addCase(
        getEmployeeById.fulfilled,
        (state, action: PayloadAction<Employee>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.selectedEmployee = action.payload;
          if (action.payload.recentRecords) {
            state.records = action.payload.recentRecords;
          }
          if (action.payload.taskStats) {
            state.taskStats = action.payload.taskStats;
          }
        }
      )
      .addCase(getEmployeeById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })

      // UPDATE EMPLOYEE
      .addCase(updateEmployee.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        updateEmployee.fulfilled,
        (state, action: PayloadAction<Employee>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.message = "Employee updated successfully";
          state.employees = state.employees.map((emp) =>
            emp._id === action.payload._id ? action.payload : emp
          );
          if (state.selectedEmployee?._id === action.payload._id) {
            state.selectedEmployee = action.payload;
          }
        }
      )
      .addCase(updateEmployee.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })

      // ADD NOTE
      .addCase(
        addEmployeeNote.fulfilled,
        (state, action: PayloadAction<Employee>) => {
          state.isSuccess = true;
          state.message = "Note added successfully";
          if (state.selectedEmployee?._id === action.payload._id) {
            state.selectedEmployee = action.payload;
          }
        }
      )
      .addCase(addEmployeeNote.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload as string;
      })

      // DELETE NOTE
      .addCase(
        deleteEmployeeNote.fulfilled,
        (state, action: PayloadAction<Employee>) => {
          state.isSuccess = true;
          state.message = "Note deleted successfully";
          if (state.selectedEmployee?._id === action.payload._id) {
            state.selectedEmployee = action.payload;
          }
        }
      )
      .addCase(deleteEmployeeNote.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload as string;
      })

      // GET TASKS
      .addCase(getEmployeeTasks.pending, (state) => {
        state.isTasksLoading = true;
      })
      .addCase(getEmployeeTasks.fulfilled, (state, action) => {
        state.isTasksLoading = false;
        state.tasks = action.payload.data.results;
      })
      .addCase(getEmployeeTasks.rejected, (state, action) => {
        state.isTasksLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })

      // CREATE TASK
      .addCase(
        createEmployeeTask.fulfilled,
        (state, action: PayloadAction<EmployeeTask>) => {
          state.isSuccess = true;
          state.message = "Task created successfully";
          state.tasks.unshift(action.payload);
        }
      )
      .addCase(createEmployeeTask.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload as string;
      })

      // UPDATE TASK
      .addCase(
        updateEmployeeTask.fulfilled,
        (state, action: PayloadAction<EmployeeTask>) => {
          state.isSuccess = true;
          state.message = "Task updated successfully";
          state.tasks = state.tasks.map((task) =>
            task.id === action.payload.id ? action.payload : task
          );
        }
      )
      .addCase(updateEmployeeTask.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload as string;
      })

      // DELETE TASK
      .addCase(
        deleteEmployeeTask.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.isSuccess = true;
          state.message = "Task deleted successfully";
          state.tasks = state.tasks.filter(
            (task) => task.id !== action.payload
          );
        }
      )
      .addCase(deleteEmployeeTask.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload as string;
      })

      // GET TASK STATS
      .addCase(
        getTaskStats.fulfilled,
        (state, action: PayloadAction<TaskStats>) => {
          state.taskStats = action.payload;
        }
      )

      // GET RECORDS
      .addCase(getEmployeeRecords.pending, (state) => {
        state.isRecordsLoading = true;
      })
      .addCase(
        getEmployeeRecords.fulfilled,
        (state, action: PayloadAction<EmployeeRecord[]>) => {
          state.isRecordsLoading = false;
          state.records = action.payload;
        }
      )
      .addCase(getEmployeeRecords.rejected, (state, action) => {
        state.isRecordsLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })

      // UPDATE RECORD
      .addCase(
        updateEmployeeRecord.fulfilled,
        (state, action: PayloadAction<EmployeeRecord>) => {
          state.isSuccess = true;
          state.message = "Record updated successfully";
          state.records = state.records.map((record) =>
            record.id === action.payload.id ? action.payload : record
          );
        }
      )
      .addCase(updateEmployeeRecord.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload as string;
      })

      // GENERATE MONTHLY RECORDS
      .addCase(
        generateMonthlyRecords.fulfilled,
        (state, action: PayloadAction<EmployeeRecord[]>) => {
          state.isSuccess = true;
          state.message = `Generated ${action.payload.length} monthly records`;
        }
      )
      .addCase(generateMonthlyRecords.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload as string;
      })

      // ========== SELF-SERVICE THUNKS ==========

      // GET MY PROFILE
      .addCase(getMyProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        getMyProfile.fulfilled,
        (state, action: PayloadAction<Employee>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.currentEmployee = action.payload;
          if (action.payload.taskStats) {
            state.taskStats = action.payload.taskStats;
          }
        }
      )
      .addCase(getMyProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })

      // GET MY TASKS
      .addCase(getMyTasks.pending, (state) => {
        state.isTasksLoading = true;
      })
      .addCase(getMyTasks.fulfilled, (state, action) => {
        state.isTasksLoading = false;
        state.tasks = action.payload.data.results;
      })
      .addCase(getMyTasks.rejected, (state, action) => {
        state.isTasksLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })

      // UPDATE MY TASK STATUS
      .addCase(
        updateMyTaskStatus.fulfilled,
        (state, action: PayloadAction<EmployeeTask>) => {
          state.isSuccess = true;
          state.message = "Task status updated";
          state.tasks = state.tasks.map((task) =>
            task._id === action.payload._id ? action.payload : task
          );
        }
      )
      .addCase(updateMyTaskStatus.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload as string;
      });
  },
});

export const {
  resetEmployeeStatus,
  resetSelectedEmployee,
  clearTasks,
  clearRecords,
} = employeeSlice.actions;
export default employeeSlice.reducer;
