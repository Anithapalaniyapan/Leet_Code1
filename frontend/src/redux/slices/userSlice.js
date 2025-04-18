import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  profile: null,
  users: [],
  loading: false,
  error: null
};

// Try to initialize from localStorage if available
try {
  const userData = localStorage.getItem('userData');
  if (userData) {
    initialState.profile = JSON.parse(userData);
  }
} catch (e) {
  console.error('Error parsing user data from localStorage', e);
}

// Async thunk for fetching user profile
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.token) {
        return rejectWithValue('No authentication token found');
      }
      
      const response = await axios.get('http://localhost:8080/api/users/profile', {
        headers: {
          'x-access-token': auth.token
        }
      });
      
      // Store user data in localStorage for persistence
      localStorage.setItem('userData', JSON.stringify(response.data));
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user profile');
    }
  }
);

// Async thunk for fetching all users (admin only)
export const fetchAllUsers = createAsyncThunk(
  'user/fetchAllUsers',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.token) {
        return rejectWithValue('No authentication token found');
      }
      
      const response = await axios.get('http://localhost:8080/api/users/all', {
        headers: {
          'x-access-token': auth.token
        }
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

// Async thunk for fetching user by ID
export const fetchUserById = createAsyncThunk(
  'user/fetchUserById',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.token) {
        return rejectWithValue('No authentication token found');
      }
      
      const response = await axios.get(`http://localhost:8080/api/users/${userId}`, {
        headers: {
          'x-access-token': auth.token
        }
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
    }
  }
);

// Async thunk for updating user profile
export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (userData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.token) {
        return rejectWithValue('No authentication token found');
      }
      
      const userId = getState().user.profile?.id;
      if (!userId) {
        return rejectWithValue('User ID not found');
      }
      
      const response = await axios.put(`http://localhost:8080/api/users/${userId}`, userData, {
        headers: {
          'x-access-token': auth.token
        }
      });
      
      // Update localStorage with new user data
      const updatedProfile = response.data.user;
      localStorage.setItem('userData', JSON.stringify(updatedProfile));
      
      return updatedProfile;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user profile');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserData: (state) => {
      state.profile = null;
      state.users = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch user profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.loading = false;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch user profile';
      })
      
      // Fetch all users
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.users = action.payload;
        state.loading = false;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch users';
      })
      
      // Fetch user by ID
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        // If this is the current user, update profile
        if (state.profile && state.profile.id === action.payload.id) {
          state.profile = action.payload;
        }
        
        // Update in users array if present
        const index = state.users.findIndex(u => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        
        state.loading = false;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch user';
      })
      
      // Update user profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        
        // Update in users array if present
        const index = state.users.findIndex(u => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        
        state.loading = false;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update user profile';
      });
  }
});

export const { clearUserData } = userSlice.actions;

export default userSlice.reducer; 