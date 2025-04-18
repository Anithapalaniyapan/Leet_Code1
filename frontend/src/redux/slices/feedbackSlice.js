import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  feedbacks: [],
  ratings: {},  // Structure: { questionId: rating }
  loading: false,
  error: null,
  submitSuccess: false
};

// Async thunk for submitting feedback
export const submitFeedback = createAsyncThunk(
  'feedback/submit',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth, feedback, questions } = getState();
      
      if (!auth.token) {
        return rejectWithValue('No authentication token found');
      }
      
      // Format each rating as a separate feedback submission
      const responses = [];
      
      for (const [questionId, rating] of Object.entries(feedback.ratings)) {
        const questionObj = questions.questions.find(q => q.id === parseInt(questionId));
        
        responses.push({
          questionId: parseInt(questionId),
          rating,
          notes: ''  // Add notes field if applicable
        });
      }
      
      // Map responses to an array of promises for individual feedback submissions
      const submissionPromises = responses.map(response => 
        axios.post('http://localhost:8080/api/feedback/submit', response, {
          headers: {
            'x-access-token': auth.token
          }
        })
      );
      
      // Wait for all submissions to complete
      const results = await Promise.all(submissionPromises);
      
      return results.map(result => result.data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit feedback');
    }
  }
);

// Async thunk for fetching feedback for the current user
export const fetchMyFeedback = createAsyncThunk(
  'feedback/fetchMyFeedback',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.token) {
        return rejectWithValue('No authentication token found');
      }
      
      const response = await axios.get('http://localhost:8080/api/feedback/my-feedback', {
        headers: {
          'x-access-token': auth.token
        }
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch feedback');
    }
  }
);

// Async thunk for fetching feedback by question
export const fetchFeedbackByQuestion = createAsyncThunk(
  'feedback/fetchByQuestion',
  async (questionId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.token) {
        return rejectWithValue('No authentication token found');
      }
      
      const response = await axios.get(`http://localhost:8080/api/feedback/question/${questionId}`, {
        headers: {
          'x-access-token': auth.token
        }
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch feedback');
    }
  }
);

// Async thunk for downloading feedback report
export const downloadFeedbackReport = createAsyncThunk(
  'feedback/downloadReport',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.token) {
        return rejectWithValue('No authentication token found');
      }
      
      // This endpoint might need to be updated based on actual backend implementation
      const response = await axios.get('http://localhost:8080/api/feedback/stats/overall', {
        headers: {
          'x-access-token': auth.token
        },
        responseType: 'blob'
      });
      
      // If the API returns blob data for download
      if (response.headers['content-type'].includes('application/pdf')) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'feedback-report.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to download report');
    }
  }
);

const feedbackSlice = createSlice({
  name: 'feedback',
  initialState,
  reducers: {
    setRating: (state, action) => {
      const { questionId, rating } = action.payload;
      state.ratings[questionId] = rating;
    },
    clearRatings: (state) => {
      state.ratings = {};
      state.submitSuccess = false;
    },
    resetFeedbackState: (state) => {
      state.feedbacks = [];
      state.ratings = {};
      state.submitSuccess = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Submit feedback
      .addCase(submitFeedback.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.submitSuccess = false;
      })
      .addCase(submitFeedback.fulfilled, (state, action) => {
        state.feedbacks = state.feedbacks.concat(action.payload);
        state.ratings = {}; // Clear ratings after successful submission
        state.loading = false;
        state.submitSuccess = true;
      })
      .addCase(submitFeedback.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to submit feedback';
        state.submitSuccess = false;
      })
      
      // Fetch my feedback
      .addCase(fetchMyFeedback.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyFeedback.fulfilled, (state, action) => {
        state.feedbacks = action.payload;
        state.loading = false;
      })
      .addCase(fetchMyFeedback.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch feedback';
      })
      
      // Fetch feedback by question
      .addCase(fetchFeedbackByQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFeedbackByQuestion.fulfilled, (state, action) => {
        state.feedbacks = [action.payload]; // Question feedback comes as a single object with nested feedback array
        state.loading = false;
      })
      .addCase(fetchFeedbackByQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch feedback';
      })
      
      // Download report
      .addCase(downloadFeedbackReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(downloadFeedbackReport.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(downloadFeedbackReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to download report';
      });
  }
});

export const { setRating, clearRatings, resetFeedbackState } = feedbackSlice.actions;

export default feedbackSlice.reducer; 