import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  meetings: {
    pastMeetings: [],
    currentMeetings: [],
    futureMeetings: []
  },
  currentMeeting: null,
  nextMeeting: null,  // Added for timer functionality
  loading: false,
  error: null
};

// Helper to calculate and set next meeting data for timer
const calculateNextMeeting = (meetings) => {
  if (!meetings || !Array.isArray(meetings) || meetings.length === 0) {
    return null;
  }
  
  const now = new Date();
  
  // Find first future meeting
  const sortedMeetings = [...meetings].sort((a, b) => {
    const dateA = new Date(a.date || a.meetingDate);
    const dateB = new Date(b.date || b.meetingDate);
    return dateA - dateB;
  });
  
  const upcomingMeeting = sortedMeetings.find(m => {
    const meetingDate = new Date(m.date || m.meetingDate);
    return meetingDate > now;
  });
  
  if (!upcomingMeeting) {
    return null;
  }
  
  // Calculate timer values
  const meetingDate = new Date(upcomingMeeting.date || upcomingMeeting.meetingDate);
  const [hours, minutes] = (upcomingMeeting.startTime || '00:00').split(':').map(Number);
  
  meetingDate.setHours(hours || 0);
  meetingDate.setMinutes(minutes || 0);
  meetingDate.setSeconds(0);
  
  const diffMs = meetingDate - now;
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));
  const diffSecs = Math.max(0, Math.floor((diffMs % 60000) / 1000));
  
  const nextMeetingData = {
    id: upcomingMeeting.id,
    title: upcomingMeeting.title,
    date: meetingDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    time: upcomingMeeting.startTime || '00:00',
    minutesLeft: diffMins,
    secondsLeft: diffSecs,
    originalDate: upcomingMeeting.date || upcomingMeeting.meetingDate,
    department: upcomingMeeting.department || upcomingMeeting.departmentId
  };
  
  // Save to localStorage for persistence
  localStorage.setItem('nextMeetingData', JSON.stringify(nextMeetingData));
  
  return nextMeetingData;
};

// Async thunk for fetching all meetings
export const fetchMeetings = createAsyncThunk(
  'meetings/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.token) {
        return rejectWithValue('No authentication token found');
      }
      
      // Updated to use the user-specific endpoint instead of general meetings endpoint
      const response = await axios.get('http://localhost:8080/api/meetings/user/current', {
        headers: {
          'x-access-token': auth.token
        }
      });
      
      // Create categorized meetings structure if API doesn't return it that way
      const allMeetings = response.data;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const pastMeetings = [];
      const currentMeetings = [];
      const futureMeetings = [];
      
      allMeetings.forEach(meeting => {
        const meetingDate = new Date(meeting.meetingDate || meeting.date);
        const meetingDateOnly = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate());
        
        if (meetingDateOnly < today) {
          pastMeetings.push(meeting);
        } else if (meetingDateOnly.getTime() === today.getTime()) {
          currentMeetings.push(meeting);
        } else {
          futureMeetings.push(meeting);
        }
      });
      
      // Calculate next meeting for timer
      const nextMeeting = calculateNextMeeting([...currentMeetings, ...futureMeetings]);
      
      return {
        pastMeetings,
        currentMeetings,
        futureMeetings,
        nextMeeting
      };
    } catch (error) {
      console.error('API error in fetchMeetings:', error);
      
      // Fallback to localStorage if API fails
      try {
        // Get user data and role for filtering
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const userRole = localStorage.getItem('userRole')?.replace('ROLE_', '').toLowerCase() || '';
        const userDept = userData.department?.id || userData.departmentId || '';
        const userYear = userData.year || '';
        
        console.log('User data for filtering meetings:', { userRole, userDept, userYear });
        
        // Get meetings from localStorage
        const storedMeetings = localStorage.getItem('submittedMeetings');
        if (storedMeetings) {
          const parsedMeetings = JSON.parse(storedMeetings);
          console.log('Retrieved meetings from localStorage:', parsedMeetings);
          
          if (!Array.isArray(parsedMeetings) || parsedMeetings.length === 0) {
            throw new Error('No valid meetings found in localStorage');
          }
          
          // Filter meetings for this user's role - be more strict with role filtering
          const userRoleLower = userRole.toLowerCase();
          console.log('User role for filtering (lowercase):', userRoleLower);
          
          const relevantMeetings = parsedMeetings.filter(meeting => {
            // Convert values to lowercase strings for case-insensitive comparison
            const meetingRole = (meeting.role || '').toLowerCase();
            const deptId = String(userDept || '').toLowerCase();
            const meetingDeptId = String(meeting.departmentId || meeting.department || '').toLowerCase();
            
            console.log(`Checking meeting:`, { 
              id: meeting.id,
              title: meeting.title, 
              meetingRole,
              userRole: userRoleLower,
              roleMatch: meetingRole === userRoleLower || 
                         (userRoleLower === 'staff' && meetingRole === 'staff') ||
                         (userRoleLower === 'student' && meetingRole === 'student'),
              deptMatch: meetingDeptId.includes(deptId) || deptId.includes(meetingDeptId)
            });
            
            // Only match exact role names (staff or student)
            const isRoleMatch = 
              // For staff users, only show staff meetings
              (userRoleLower === 'staff' && meetingRole === 'staff') ||
              // For student users, only show student meetings 
              (userRoleLower === 'student' && meetingRole === 'student');
            
            // Accept the meeting if:
            // 1. The role matches exactly (staff/student)
            // 2. Department IDs match (or no department specified)
            // 3. Status is submitted or not specified
            return (
              isRoleMatch && 
              (deptId === '' || meetingDeptId === '' || 
               meetingDeptId.includes(deptId) || deptId.includes(meetingDeptId)) &&
              (!meeting.status || meeting.status === 'SUBMITTED')
            );
          });
          
          console.log('Filtered relevant meetings:', relevantMeetings);
          
          // If no relevant meetings were found, use all meetings for testing
          const meetingsToUse = relevantMeetings.length > 0 ? relevantMeetings : parsedMeetings;
          console.log(`Using ${meetingsToUse === relevantMeetings ? 'filtered' : 'all'} meetings:`, meetingsToUse);
          
          // Categorize meetings
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          const pastMeetings = [];
          const currentMeetings = [];
          const futureMeetings = [];
          
          meetingsToUse.forEach(meeting => {
            // Handle both date and meetingDate formats
            const meetingDate = new Date(meeting.date || meeting.meetingDate || '');
            
            if (meetingDate < today) {
              pastMeetings.push(meeting);
            } else if (meetingDate.getFullYear() === today.getFullYear() && 
                      meetingDate.getMonth() === today.getMonth() && 
                      meetingDate.getDate() === today.getDate()) {
              currentMeetings.push(meeting);
            } else {
              futureMeetings.push(meeting);
            }
          });
          
          // Calculate next meeting for timer
          const nextMeeting = calculateNextMeeting([...currentMeetings, ...futureMeetings]);
          
          return {
            pastMeetings,
            currentMeetings,
            futureMeetings,
            nextMeeting
          };
        }
      } catch (fallbackError) {
        console.error('Error using localStorage fallback:', fallbackError);
      }
      
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch meetings');
    }
  }
);

// Async thunk for fetching meetings by department and year
export const fetchMeetingsByDeptAndYear = createAsyncThunk(
  'meetings/fetchByDeptAndYear',
  async ({ departmentId, year }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.token) {
        return rejectWithValue('No authentication token found');
      }
      
      const response = await axios.get(`http://localhost:8080/api/meetings/department/${departmentId}/year/${year}`, {
        headers: {
          'x-access-token': auth.token
        }
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch meetings');
    }
  }
);

// Async thunk for creating a new meeting
export const createMeeting = createAsyncThunk(
  'meetings/create',
  async (meetingData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.token) {
        return rejectWithValue('No authentication token found');
      }
      
      const response = await axios.post('http://localhost:8080/api/meetings', meetingData, {
        headers: {
          'x-access-token': auth.token
        }
      });
      
      return response.data.meeting;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create meeting');
    }
  }
);

// Async thunk for updating a meeting
export const updateMeeting = createAsyncThunk(
  'meetings/update',
  async ({ meetingId, meetingData }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.token) {
        return rejectWithValue('No authentication token found');
      }
      
      const response = await axios.put(`http://localhost:8080/api/meetings/${meetingId}`, meetingData, {
        headers: {
          'x-access-token': auth.token
        }
      });
      
      return response.data.meeting;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update meeting');
    }
  }
);

// Async thunk for deleting a meeting
export const deleteMeeting = createAsyncThunk(
  'meetings/delete',
  async (meetingId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.token) {
        return rejectWithValue('No authentication token found');
      }
      
      await axios.delete(`http://localhost:8080/api/meetings/${meetingId}`, {
        headers: {
          'x-access-token': auth.token
        }
      });
      
      return meetingId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete meeting');
    }
  }
);

// Async thunk for fetching a single meeting by ID
export const fetchMeetingById = createAsyncThunk(
  'meetings/fetchById',
  async (meetingId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.token) {
        return rejectWithValue('No authentication token found');
      }
      
      const response = await axios.get(`http://localhost:8080/api/meetings/${meetingId}`, {
        headers: {
          'x-access-token': auth.token
        }
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch meeting');
    }
  }
);

const meetingSlice = createSlice({
  name: 'meetings',
  initialState,
  reducers: {
    setCurrentMeeting: (state, action) => {
      state.currentMeeting = action.payload;
    },
    setMeetings: (state, action) => {
      console.log('Redux: Setting meetings with payload:', action.payload);
      state.meetings = {
        pastMeetings: action.payload.pastMeetings || [],
        currentMeetings: action.payload.currentMeetings || [],
        futureMeetings: action.payload.futureMeetings || []
      };
      
      // Also add these directly to the state for compatibility
      state.pastMeetings = action.payload.pastMeetings || [];
      state.currentMeetings = action.payload.currentMeetings || [];
      state.futureMeetings = action.payload.futureMeetings || [];
      
      // Calculate next meeting for timer if available
      if (action.payload.currentMeetings?.length > 0 || action.payload.futureMeetings?.length > 0) {
        const allUpcomingMeetings = [
          ...(action.payload.currentMeetings || []),
          ...(action.payload.futureMeetings || [])
        ];
        state.nextMeeting = calculateNextMeeting(allUpcomingMeetings);
      }
    },
    clearMeetings: (state) => {
      state.meetings = {
        pastMeetings: [],
        currentMeetings: [],
        futureMeetings: []
      };
      state.pastMeetings = [];
      state.currentMeetings = [];
      state.futureMeetings = [];
      state.currentMeeting = null;
    },
    updateNextMeeting: (state, action) => {
      state.nextMeeting = action.payload;
      // Persist to localStorage
      localStorage.setItem('nextMeetingData', JSON.stringify(action.payload));
    },
    resetCountdown: (state) => {
      // Recalculate countdown for next meeting
      if (state.nextMeeting && state.nextMeeting.originalDate) {
        const now = new Date();
        const meetingDate = new Date(state.nextMeeting.originalDate);
        const [hours, minutes] = (state.nextMeeting.time || '00:00').split(':').map(Number);
        
        meetingDate.setHours(hours || 0);
        meetingDate.setMinutes(minutes || 0);
        meetingDate.setSeconds(0);
        
        const diffMs = meetingDate - now;
        if (diffMs > 0) {
          const diffMins = Math.floor(diffMs / 60000);
          const diffSecs = Math.floor((diffMs % 60000) / 1000);
          
          state.nextMeeting = {
            ...state.nextMeeting,
            minutesLeft: diffMins,
            secondsLeft: diffSecs
          };
          
          localStorage.setItem('nextMeetingData', JSON.stringify(state.nextMeeting));
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all meetings
      .addCase(fetchMeetings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMeetings.fulfilled, (state, action) => {
        state.meetings = action.payload;
        state.loading = false;
        
        // Store the next meeting for timer functionality
        if (action.payload.nextMeeting) {
          state.nextMeeting = action.payload.nextMeeting;
        } else {
          // Try to load from localStorage if API didn't provide one
          try {
            const storedMeeting = localStorage.getItem('nextMeetingData');
            if (storedMeeting) {
              state.nextMeeting = JSON.parse(storedMeeting);
            }
          } catch (e) {
            console.error('Error loading stored meeting data:', e);
          }
        }
      })
      .addCase(fetchMeetings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch meetings';
        
        // Try to restore nextMeeting from localStorage if API fetch failed
        try {
          const storedMeeting = localStorage.getItem('nextMeetingData');
          if (storedMeeting) {
            state.nextMeeting = JSON.parse(storedMeeting);
          }
        } catch (e) {
          console.error('Error loading stored meeting data:', e);
        }
      })
      
      // Fetch meetings by department and year
      .addCase(fetchMeetingsByDeptAndYear.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMeetingsByDeptAndYear.fulfilled, (state, action) => {
        state.meetings = action.payload;
        state.loading = false;
      })
      .addCase(fetchMeetingsByDeptAndYear.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch meetings';
      })
      
      // Fetch meeting by ID
      .addCase(fetchMeetingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMeetingById.fulfilled, (state, action) => {
        state.currentMeeting = action.payload;
        state.loading = false;
      })
      .addCase(fetchMeetingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch meeting';
      })
      
      // Create meeting
      .addCase(createMeeting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMeeting.fulfilled, (state, action) => {
        // Add the new meeting to the appropriate category based on date
        const meeting = action.payload;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const meetingDate = new Date(meeting.meetingDate);
        const meetingDateOnly = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate());
        
        if (meetingDateOnly < today) {
          state.meetings.pastMeetings.push(meeting);
        } else if (meetingDateOnly.getTime() === today.getTime()) {
          state.meetings.currentMeetings.push(meeting);
        } else {
          state.meetings.futureMeetings.push(meeting);
        }
        
        state.loading = false;
      })
      .addCase(createMeeting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create meeting';
      })
      
      // Update meeting
      .addCase(updateMeeting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMeeting.fulfilled, (state, action) => {
        const updatedMeeting = action.payload;
        
        // Helper function to update meeting in a category
        const updateInCategory = (category) => {
          const index = state.meetings[category].findIndex(m => m.id === updatedMeeting.id);
          if (index !== -1) {
            state.meetings[category][index] = updatedMeeting;
            return true;
          }
          return false;
        };
        
        // Try to update the meeting in each category
        let found = updateInCategory('pastMeetings');
        if (!found) found = updateInCategory('currentMeetings');
        if (!found) found = updateInCategory('futureMeetings');
        
        // Update current meeting if it matches
        if (state.currentMeeting?.id === updatedMeeting.id) {
          state.currentMeeting = updatedMeeting;
        }
        
        state.loading = false;
      })
      .addCase(updateMeeting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update meeting';
      })
      
      // Delete meeting
      .addCase(deleteMeeting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMeeting.fulfilled, (state, action) => {
        const deletedId = action.payload;
        
        // Remove the meeting from all categories
        state.meetings.pastMeetings = state.meetings.pastMeetings.filter(m => m.id !== deletedId);
        state.meetings.currentMeetings = state.meetings.currentMeetings.filter(m => m.id !== deletedId);
        state.meetings.futureMeetings = state.meetings.futureMeetings.filter(m => m.id !== deletedId);
        
        // Clear current meeting if it matches
        if (state.currentMeeting?.id === deletedId) {
          state.currentMeeting = null;
        }
        
        state.loading = false;
      })
      .addCase(deleteMeeting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete meeting';
      });
  }
});

export const { setCurrentMeeting, setMeetings, clearMeetings, updateNextMeeting, resetCountdown } = meetingSlice.actions;

export default meetingSlice.reducer; 