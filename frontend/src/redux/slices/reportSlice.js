import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  loading: false,
  error: null,
  reportData: null,
  downloadSuccess: false,
  generationSuccess: false
};

// Async thunk for generating all feedback Excel report
export const generateAllFeedbackReport = createAsyncThunk(
  'reports/generateAllFeedback',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.token) {
        return rejectWithValue('No authentication token found');
      }
      
      const response = await axios.get('http://localhost:8080/api/feedback/excel/all', {
        headers: {
          'x-access-token': auth.token
        },
        responseType: 'blob'
      });
      
      // Handle the Excel blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'all-feedback-report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate feedback report');
    }
  }
);

// Async thunk for generating department statistics Excel report
export const generateDepartmentStatsReport = createAsyncThunk(
  'reports/generateDepartmentStats',
  async (departmentId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.token) {
        return rejectWithValue('No authentication token found');
      }
      
      const response = await axios.get(`http://localhost:8080/api/feedback/excel/department/${departmentId}`, {
        headers: {
          'x-access-token': auth.token
        },
        responseType: 'blob'
      });
      
      // Handle the Excel blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `department-${departmentId}-report.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true, departmentId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate department report');
    }
  }
);

// Async thunk for generating overall statistics Excel report
export const generateOverallStatsReport = createAsyncThunk(
  'reports/generateOverallStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.token) {
        return rejectWithValue('No authentication token found');
      }
      
      const response = await axios.get('http://localhost:8080/api/feedback/excel/overall', {
        headers: {
          'x-access-token': auth.token
        },
        responseType: 'blob'
      });
      
      // Handle the Excel blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'overall-statistics-report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate overall statistics report');
    }
  }
);

// Async thunk for generating individual role report Excel
export const generateIndividualRoleReport = createAsyncThunk(
  'reports/generateIndividualRole',
  async (roleType, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.token) {
        return rejectWithValue('No authentication token found');
      }
      
      const response = await axios.get(`http://localhost:8080/api/feedback/excel/individual/${roleType}`, {
        headers: {
          'x-access-token': auth.token
        },
        responseType: 'blob'
      });
      
      // Handle the Excel blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${roleType}-report.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true, roleType };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate individual role report');
    }
  }
);

const reportSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    clearReportState: (state) => {
      state.reportData = null;
      state.downloadSuccess = false;
      state.generationSuccess = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Generate All Feedback Report
      .addCase(generateAllFeedbackReport.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.downloadSuccess = false;
      })
      .addCase(generateAllFeedbackReport.fulfilled, (state) => {
        state.loading = false;
        state.downloadSuccess = true;
        state.generationSuccess = true;
      })
      .addCase(generateAllFeedbackReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to generate report';
        state.downloadSuccess = false;
      })
      
      // Generate Department Stats Report
      .addCase(generateDepartmentStatsReport.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.downloadSuccess = false;
      })
      .addCase(generateDepartmentStatsReport.fulfilled, (state) => {
        state.loading = false;
        state.downloadSuccess = true;
        state.generationSuccess = true;
      })
      .addCase(generateDepartmentStatsReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to generate department report';
        state.downloadSuccess = false;
      })
      
      // Generate Overall Stats Report
      .addCase(generateOverallStatsReport.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.downloadSuccess = false;
      })
      .addCase(generateOverallStatsReport.fulfilled, (state) => {
        state.loading = false;
        state.downloadSuccess = true;
        state.generationSuccess = true;
      })
      .addCase(generateOverallStatsReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to generate overall report';
        state.downloadSuccess = false;
      })
      
      // Generate Individual Role Report
      .addCase(generateIndividualRoleReport.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.downloadSuccess = false;
      })
      .addCase(generateIndividualRoleReport.fulfilled, (state) => {
        state.loading = false;
        state.downloadSuccess = true;
        state.generationSuccess = true;
      })
      .addCase(generateIndividualRoleReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to generate individual role report';
        state.downloadSuccess = false;
      })
  }
});

export const { clearReportState } = reportSlice.actions;
export default reportSlice.reducer; 