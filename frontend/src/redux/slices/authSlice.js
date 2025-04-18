import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  token: localStorage.getItem('token') || null,
  userRole: localStorage.getItem('userRole') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null
};

// Async thunk for login
export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const serverUrl = 'http://localhost:8080';
      const response = await axios.post(`${serverUrl}/api/auth/signin`, {
        username,
        password
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.data || !response.data.accessToken) {
        return rejectWithValue('Invalid response from server');
      }
      
      const { accessToken, roles, ...userData } = response.data;
      
      // Validate roles
      if (!roles || roles.length === 0) {
        return rejectWithValue('User role not found in response');
      }
      
      // Get the first role
      const userRole = roles[0];
      
      // Normalize role for consistent dashboard routing
      let normalizedRole = '';
      
      // Convert to lowercase first
      const roleLower = userRole.toLowerCase();
      
      if (roleLower.includes('student')) {
        normalizedRole = 'student';
      } else if (roleLower.includes('staff')) {
        normalizedRole = 'staff';
      } else if (roleLower.includes('academic')) {
        normalizedRole = 'academic-director';
      } else if (roleLower.includes('executive')) {
        normalizedRole = 'executive-director';
      } else {
        // Default - use lowercase version
        normalizedRole = roleLower;
      }
      
      // Log role information for debugging
      console.log('Login successful. Role info:', { 
        original: userRole, 
        normalized: normalizedRole 
      });
      
      // Store in localStorage - store both original and normalized roles
      localStorage.setItem('token', accessToken);
      localStorage.setItem('userRole', normalizedRole);
      localStorage.setItem('originalUserRole', userRole); // Keep the original for reference
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Set axios default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      return { token: accessToken, userRole: normalizedRole, userData };
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific error cases
      if (!error.response) {
        return rejectWithValue('Unable to connect to the server. Please ensure the backend service is running and try again.');
      } 
      
      switch (error.response.status) {
        case 401:
        case 404:
          return rejectWithValue('User not found or invalid credentials. Please check your username and password.');
        case 403:
          return rejectWithValue('Access forbidden. Please check your credentials.');
        case 500:
          return rejectWithValue('Server error. Please try again later.');
        default:
          return rejectWithValue(error.response?.data?.message || 'An error occurred during login. Please try again.');
      }
    }
  }
);

// Async thunk for logout
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    
    // Also clear user data when logging out
    dispatch({ type: 'user/clearUserData' });
    
    return null;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // For syncing auth state with localStorage if needed
    syncAuthState: (state) => {
      state.token = localStorage.getItem('token');
      state.userRole = localStorage.getItem('userRole');
      state.isAuthenticated = !!state.token;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.userRole = action.payload.userRole;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.token = null;
        state.userRole = null;
        state.isAuthenticated = false;
      });
  }
});

export const { syncAuthState } = authSlice.actions;

export default authSlice.reducer; 