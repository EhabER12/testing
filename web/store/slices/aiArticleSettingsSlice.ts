import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  AiArticleSettings,
  AiArticleProgress,
  AiArticleJob,
  TestPromptResult,
  getAiArticleSettings,
  updateAiArticleSettings,
  getAiArticleProgress,
  addAiArticleTitles,
  removeAiArticleTitle,
  testAiArticlePrompt,
  generateArticlesNow,
  getAiArticleJobs,
  retryAiArticleJob,
  cancelPendingJobs,
  testWhatsappConnection,
  resetAiArticleProgress,
} from "../services/aiArticleSettingsService";

interface AiArticleSettingsState {
  settings: AiArticleSettings | null;
  progress: AiArticleProgress | null;
  jobs: AiArticleJob[];
  jobsPagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  testResult: TestPromptResult | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
  isTesting: boolean;
  isGenerating: boolean;
}

const initialState: AiArticleSettingsState = {
  settings: null,
  progress: null,
  jobs: [],
  jobsPagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  testResult: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
  isTesting: false,
  isGenerating: false,
};

// Async Thunks
export const fetchAiSettings = createAsyncThunk(
  "aiArticleSettings/fetch",
  async (_, thunkAPI) => {
    try {
      return await getAiArticleSettings();
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error?.message ||
          error.message ||
          "Failed to fetch settings"
      );
    }
  }
);

export const saveAiSettings = createAsyncThunk(
  "aiArticleSettings/save",
  async (data: Partial<AiArticleSettings>, thunkAPI) => {
    try {
      return await updateAiArticleSettings(data);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error?.message ||
          error.message ||
          "Failed to save settings"
      );
    }
  }
);

export const fetchAiProgress = createAsyncThunk(
  "aiArticleSettings/fetchProgress",
  async (_, thunkAPI) => {
    try {
      return await getAiArticleProgress();
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error?.message ||
          error.message ||
          "Failed to fetch progress"
      );
    }
  }
);

export const addTitles = createAsyncThunk(
  "aiArticleSettings/addTitles",
  async (titles: string[], thunkAPI) => {
    try {
      const result = await addAiArticleTitles(titles);
      // Refetch settings to get updated titles
      thunkAPI.dispatch(fetchAiSettings());
      return result;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error?.message ||
          error.message ||
          "Failed to add titles"
      );
    }
  }
);

export const removeTitle = createAsyncThunk(
  "aiArticleSettings/removeTitle",
  async (id: string, thunkAPI) => {
    try {
      await removeAiArticleTitle(id);
      // Refetch settings to get updated titles
      thunkAPI.dispatch(fetchAiSettings());
      return id;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error?.message ||
          error.message ||
          "Failed to remove title"
      );
    }
  }
);

export const testPrompt = createAsyncThunk(
  "aiArticleSettings/testPrompt",
  async (
    data: {
      promptTemplate?: string;
      sampleTitle?: string;
      settings?: Partial<AiArticleSettings>;
    },
    thunkAPI
  ) => {
    try {
      return await testAiArticlePrompt(data);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error?.message ||
          error.message ||
          "Prompt test failed"
      );
    }
  }
);

export const generateNow = createAsyncThunk(
  "aiArticleSettings/generateNow",
  async (count: number = 1, thunkAPI) => {
    try {
      const result = await generateArticlesNow(count);
      // Refresh progress after generation
      thunkAPI.dispatch(fetchAiProgress());
      thunkAPI.dispatch(fetchAiSettings());
      return result;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error?.message ||
          error.message ||
          "Article generation failed"
      );
    }
  }
);

export const fetchJobs = createAsyncThunk(
  "aiArticleSettings/fetchJobs",
  async (
    params: { page?: number; limit?: number; status?: string } | undefined,
    thunkAPI
  ) => {
    try {
      return await getAiArticleJobs(params);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error?.message ||
          error.message ||
          "Failed to fetch jobs"
      );
    }
  }
);

export const retryJob = createAsyncThunk(
  "aiArticleSettings/retryJob",
  async (id: string, thunkAPI) => {
    try {
      const result = await retryAiArticleJob(id);
      thunkAPI.dispatch(fetchJobs(undefined));
      return result;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error?.message ||
          error.message ||
          "Failed to retry job"
      );
    }
  }
);

export const cancelAllPending = createAsyncThunk(
  "aiArticleSettings/cancelPending",
  async (_, thunkAPI) => {
    try {
      const result = await cancelPendingJobs();
      thunkAPI.dispatch(fetchJobs(undefined));
      return result;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error?.message ||
          error.message ||
          "Failed to cancel jobs"
      );
    }
  }
);

export const testWhatsapp = createAsyncThunk(
  "aiArticleSettings/testWhatsapp",
  async (number: string, thunkAPI) => {
    try {
      return await testWhatsappConnection(number);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error?.message ||
          error.message ||
          "WhatsApp test failed"
      );
    }
  }
);

export const resetProgress = createAsyncThunk(
  "aiArticleSettings/resetProgress",
  async (resetTitles: boolean, thunkAPI) => {
    try {
      const result = await resetAiArticleProgress(resetTitles);
      thunkAPI.dispatch(fetchAiSettings());
      thunkAPI.dispatch(fetchAiProgress());
      return result;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error?.message ||
          error.message ||
          "Failed to reset progress"
      );
    }
  }
);

const aiArticleSettingsSlice = createSlice({
  name: "aiArticleSettings",
  initialState,
  reducers: {
    resetStatus: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
    clearTestResult: (state) => {
      state.testResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Settings
      .addCase(fetchAiSettings.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAiSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload.settings;
      })
      .addCase(fetchAiSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // Save Settings
      .addCase(saveAiSettings.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(saveAiSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.settings = action.payload;
        state.message = "Settings saved successfully";
      })
      .addCase(saveAiSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // Fetch Progress
      .addCase(fetchAiProgress.fulfilled, (state, action) => {
        state.progress = action.payload;
      })
      // Test Prompt
      .addCase(testPrompt.pending, (state) => {
        state.isTesting = true;
        state.testResult = null;
      })
      .addCase(testPrompt.fulfilled, (state, action) => {
        state.isTesting = false;
        state.testResult = action.payload;
      })
      .addCase(testPrompt.rejected, (state, action) => {
        state.isTesting = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // Generate Now
      .addCase(generateNow.pending, (state) => {
        state.isGenerating = true;
      })
      .addCase(generateNow.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.isSuccess = true;
        state.message = `Generated ${action.payload.completed} articles`;
      })
      .addCase(generateNow.rejected, (state, action) => {
        state.isGenerating = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // Fetch Jobs
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.jobs = action.payload.jobs;
        state.jobsPagination = action.payload.pagination;
      })
      // Add Titles
      .addCase(addTitles.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.message = action.payload.addedCount
          ? `Added ${action.payload.addedCount} titles`
          : "Titles added";
      })
      .addCase(addTitles.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload as string;
      })
      // Remove Title
      .addCase(removeTitle.fulfilled, (state) => {
        state.isSuccess = true;
        state.message = "Title removed";
      });
  },
});

export const { resetStatus, clearTestResult } = aiArticleSettingsSlice.actions;
export default aiArticleSettingsSlice.reducer;
