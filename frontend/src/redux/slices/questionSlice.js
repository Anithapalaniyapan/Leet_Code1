import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  questions: [],
  loading: false,
  error: null
};

// Async thunk for fetching all questions
export const fetchAllQuestions = createAsyncThunk(
  'questions/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.token) {
        return rejectWithValue('No authentication token found');
      }
      
      const response = await axios.get('http://localhost:8080/api/questions', {
        headers: {
          'x-access-token': auth.token
        }
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch questions');
    }
  }
);

// Async thunk for fetching questions by department and year
export const fetchQuestionsByDeptAndYear = createAsyncThunk(
  'questions/fetchByDeptAndYear',
  async ({ departmentId, year, role }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.token) {
        return rejectWithValue('No authentication token found');
      }
      
      // Build URL with query parameters
      const url = new URL(`http://localhost:8080/api/questions/department/${departmentId}/year/${year}`);
      if (role) {
        url.searchParams.append('role', role);
      }
      
      const response = await axios.get(url.toString(), {
        headers: {
          'x-access-token': auth.token
        }
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch questions');
    }
  }
);

// Async thunk for creating a new question
export const createQuestion = createAsyncThunk(
  'questions/create',
  async (questionData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.token) {
        return rejectWithValue('No authentication token found');
      }
      
      const response = await axios.post('http://localhost:8080/api/questions', questionData, {
        headers: {
          'x-access-token': auth.token
        }
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create question');
    }
  }
);

// Async thunk for updating a question
export const updateQuestion = createAsyncThunk(
  'questions/update',
  async ({ questionId, questionData }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.token) {
        return rejectWithValue('No authentication token found');
      }
      
      const response = await axios.put(`http://localhost:8080/api/questions/${questionId}`, questionData, {
        headers: {
          'x-access-token': auth.token
        }
      });
      
      return response.data.question;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update question');
    }
  }
);

// Async thunk for deleting a question
export const deleteQuestion = createAsyncThunk(
  'questions/delete',
  async (questionId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.token) {
        return rejectWithValue('No authentication token found');
      }
      
      await axios.delete(`http://localhost:8080/api/questions/${questionId}`, {
        headers: {
          'x-access-token': auth.token
        }
      });
      
      return questionId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete question');
    }
  }
);

const questionSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    clearQuestions: (state) => {
      state.questions = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all questions
      .addCase(fetchAllQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllQuestions.fulfilled, (state, action) => {
        state.questions = action.payload;
        state.loading = false;
      })
      .addCase(fetchAllQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch questions';
      })
    
      // Fetch questions by department and year
      .addCase(fetchQuestionsByDeptAndYear.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuestionsByDeptAndYear.fulfilled, (state, action) => {
        state.questions = action.payload;
        state.loading = false;
      })
      .addCase(fetchQuestionsByDeptAndYear.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch questions';
      })
      
      // Create question
      .addCase(createQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuestion.fulfilled, (state, action) => {
        state.questions.push(action.payload);
        state.loading = false;
      })
      .addCase(createQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create question';
      })
      
      // Update question
      .addCase(updateQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQuestion.fulfilled, (state, action) => {
        const index = state.questions.findIndex(q => q.id === action.payload.id);
        if (index !== -1) {
          state.questions[index] = action.payload;
        }
        state.loading = false;
      })
      .addCase(updateQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update question';
      })
      
      // Delete question
      .addCase(deleteQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteQuestion.fulfilled, (state, action) => {
        state.questions = state.questions.filter(q => q.id !== action.payload);
        state.loading = false;
      })
      .addCase(deleteQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete question';
      });
  }
});

export const { clearQuestions } = questionSlice.actions;

export default questionSlice.reducer; 