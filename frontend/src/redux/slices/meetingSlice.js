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
      
      // Get token from either Redux state or localStorage
      let token = auth.token || localStorage.getItem('token');
      
      if (!token) {
        return rejectWithValue('No authentication token found');
      }
      
      const response = await axios.get('http://localhost:8080/api/meetings', {
        headers: {
          'x-access-token': token
        }
      });
      
      // Remove token revealing log
      console.log('Fetching meetings...');
      
      try {
        // Try the user-specific endpoint first
        const userResponse = await axios.get('http://localhost:8080/api/meetings/user/current', {
          headers: {
            'x-access-token': token
          }
        });
        
        console.log('User meetings fetch successful:', userResponse.data ? 'Data received' : 'No data');
        
        // If the API already returns categories, use them directly
        if (userResponse.data.pastMeetings && userResponse.data.currentMeetings && userResponse.data.futureMeetings) {
          // Calculate next meeting for timer
          const nextMeeting = calculateNextMeeting([...userResponse.data.currentMeetings, ...userResponse.data.futureMeetings]);
          
          return {
            pastMeetings: userResponse.data.pastMeetings || [],
            currentMeetings: userResponse.data.currentMeetings || [],
            futureMeetings: userResponse.data.futureMeetings || [],
            userDetails: userResponse.data.userDetails || null,
            nextMeeting
          };
        }
        
        // Otherwise, create categorized meetings structure 
        const allMeetings = Array.isArray(userResponse.data) ? userResponse.data : [];
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
      } catch (specificError) {
        console.error('Error with user meetings endpoint, trying general endpoint:', specificError);
        
        // Try the general meetings endpoint as backup
        const generalResponse = await axios.get('http://localhost:8080/api/meetings', {
          headers: {
            'x-access-token': token
          }
        });
        
        console.log('General meetings fetch successful:', generalResponse.data ? `${generalResponse.data.length || 0} meetings` : 'No data');
        
        // Process the data similarly
        const allMeetings = generalResponse.data;
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
      }
    } catch (error) {
      console.error('API error in fetchMeetings:', error);
      
      // Create demo meetings as a last resort
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      // Next week
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];
      
      // Create demo meetings
      const demoMeetings = [
        {
          id: 1,
          title: "Department Review Meeting",
          date: today,
          meetingDate: today,
          startTime: "14:00",
          endTime: "15:30",
          departmentId: 1,
          department: {
            id: 1,
            name: "Computer Science"
          },
          status: "Scheduled"
        },
        {
          id: 2,
          title: "Faculty Feedback Session",
          date: tomorrowStr,
          meetingDate: tomorrowStr,
          startTime: "10:00",
          endTime: "11:30",
          departmentId: 2,
          department: {
            id: 2,
            name: "Information Technology"
          },
          status: "Scheduled"
        },
        {
          id: 3,
          title: "Curriculum Planning",
          date: nextWeekStr,
          meetingDate: nextWeekStr,
          startTime: "09:00",
          endTime: "11:00",
          departmentId: 1,
          department: {
            id: 1,
            name: "Computer Science"
          },
          status: "Scheduled"
        }
      ];
      
      // Store in localStorage for persistence
      localStorage.setItem('demoMeetings', JSON.stringify(demoMeetings));
      
      console.log('Using demo meetings as fallback');
      
      return {
        pastMeetings: [],
        currentMeetings: [demoMeetings[0]],
        futureMeetings: [demoMeetings[1], demoMeetings[2]],
        nextMeeting: calculateNextMeeting([demoMeetings[1], demoMeetings[2]])
      };
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
      
      // Enhanced role formatting logic
      let formattedMeetingData = { ...meetingData };
      
      // Normalize role value - ensure it's a number (1=student, 2=staff)
      if (formattedMeetingData.role !== undefined) {
        if (typeof formattedMeetingData.role === 'string') {
          const roleStr = formattedMeetingData.role.toLowerCase().trim();
          if (roleStr === 'student' || roleStr.includes('student')) {
            formattedMeetingData.role = 1;
            // Also set roleId for consistency
            formattedMeetingData.roleId = 1;
          } else if (roleStr === 'staff' || roleStr.includes('staff') || roleStr.includes('faculty')) {
            formattedMeetingData.role = 2;
            // Also set roleId for consistency
            formattedMeetingData.roleId = 2;
          } else if (roleStr === '1') {
            formattedMeetingData.role = 1;
            formattedMeetingData.roleId = 1;
          } else if (roleStr === '2') {
            formattedMeetingData.role = 2;
            formattedMeetingData.roleId = 2;
          }
        } else if (typeof formattedMeetingData.role === 'number') {
          // Ensure roleId matches role for consistency
          formattedMeetingData.roleId = formattedMeetingData.role;
        }
      }
      
      // Debug formatted data
      console.log('Sending meeting data to API:', formattedMeetingData);
      
      const response = await axios.post('http://localhost:8080/api/meetings', formattedMeetingData, {
        headers: {
          'x-access-token': auth.token
        }
      });
      
      // Ensure role is properly set in the response
      let meeting = response.data.meeting || response.data;
      
      // If response doesn't have a valid role, use the input role
      if (meeting.role === undefined || meeting.role === null) {
        meeting.role = formattedMeetingData.role;
        meeting.roleId = formattedMeetingData.roleId;
      }
      
      // Additional formatting on the response to ensure consistent format
      if (typeof meeting.role === 'string') {
        if (meeting.role.toLowerCase() === 'student') {
          meeting.role = 1;
          meeting.roleId = 1;
        } else if (meeting.role.toLowerCase() === 'staff') {
          meeting.role = 2;
          meeting.roleId = 2;
        } else if (meeting.role === '1') {
          meeting.role = 1;
          meeting.roleId = 1;
        } else if (meeting.role === '2') {
          meeting.role = 2;
          meeting.roleId = 2;
        }
      }
      
      console.log('Meeting created successfully, normalized data:', meeting);
      return meeting;
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
      
      // Enhanced role formatting logic - same as in createMeeting
      let formattedMeetingData = { ...meetingData };
      
      // Normalize role value - ensure it's a number (1=student, 2=staff)
      if (formattedMeetingData.role !== undefined) {
        if (typeof formattedMeetingData.role === 'string') {
          const roleStr = formattedMeetingData.role.toLowerCase().trim();
          if (roleStr === 'student' || roleStr.includes('student')) {
            formattedMeetingData.role = 1;
            // Also set roleId for consistency
            formattedMeetingData.roleId = 1;
          } else if (roleStr === 'staff' || roleStr.includes('staff') || roleStr.includes('faculty')) {
            formattedMeetingData.role = 2;
            // Also set roleId for consistency
            formattedMeetingData.roleId = 2;
          } else if (roleStr === '1') {
            formattedMeetingData.role = 1;
            formattedMeetingData.roleId = 1;
          } else if (roleStr === '2') {
            formattedMeetingData.role = 2;
            formattedMeetingData.roleId = 2;
          }
        } else if (typeof formattedMeetingData.role === 'number') {
          // Ensure roleId matches role for consistency
          formattedMeetingData.roleId = formattedMeetingData.role;
        }
      }
      
      console.log('Updating meeting data:', { meetingId, meetingData: formattedMeetingData });
      
      const response = await axios.put(`http://localhost:8080/api/meetings/${meetingId}`, formattedMeetingData, {
        headers: {
          'x-access-token': auth.token
        }
      });
      
      // Ensure role is properly set in the response
      let meeting = response.data.meeting || response.data;
      
      // If response doesn't have a valid role, use the input role
      if (meeting.role === undefined || meeting.role === null) {
        meeting.role = formattedMeetingData.role;
        meeting.roleId = formattedMeetingData.roleId;
      }
      
      // Additional formatting on the response to ensure consistent format
      if (typeof meeting.role === 'string') {
        if (meeting.role.toLowerCase() === 'student') {
          meeting.role = 1;
          meeting.roleId = 1;
        } else if (meeting.role.toLowerCase() === 'staff') {
          meeting.role = 2;
          meeting.roleId = 2;
        } else if (meeting.role === '1') {
          meeting.role = 1;
          meeting.roleId = 1;
        } else if (meeting.role === '2') {
          meeting.role = 2;
          meeting.roleId = 2;
        }
      }
      
      console.log('Meeting updated successfully, normalized data:', meeting);
      return meeting;
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

// Helper function to normalize role values in meeting objects
const normalizeRoleValue = (meeting) => {
  if (!meeting) return meeting;
  
  // Create a new object to avoid mutation
  const normalizedMeeting = { ...meeting };
  
  // Normalize role field
  if (normalizedMeeting.role !== undefined) {
    if (typeof normalizedMeeting.role === 'string') {
      const roleStr = normalizedMeeting.role.toLowerCase().trim();
      if (roleStr === 'student' || roleStr.includes('student') || roleStr === '1') {
        normalizedMeeting.role = 1;
        normalizedMeeting.roleId = 1;
      } else if (roleStr === 'staff' || roleStr.includes('staff') || roleStr === '2') {
        normalizedMeeting.role = 2;
        normalizedMeeting.roleId = 2;
      }
    }
  }
  
  // Also check roleId if role isn't set
  if ((normalizedMeeting.role === undefined || normalizedMeeting.role === null) && normalizedMeeting.roleId !== undefined) {
    if (normalizedMeeting.roleId === 1 || normalizedMeeting.roleId === '1') {
      normalizedMeeting.role = 1;
    } else if (normalizedMeeting.roleId === 2 || normalizedMeeting.roleId === '2') {
      normalizedMeeting.role = 2;
    }
  }
  
  return normalizedMeeting;
};

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
        // Check if response is already in the expected format
        if (action.payload.pastMeetings && action.payload.currentMeetings && action.payload.futureMeetings) {
          // Normalize roles in each meeting
          state.meetings = {
            pastMeetings: action.payload.pastMeetings.map(normalizeRoleValue),
            currentMeetings: action.payload.currentMeetings.map(normalizeRoleValue),
            futureMeetings: action.payload.futureMeetings.map(normalizeRoleValue)
          };
        } else {
          // Fallback for when the data is not in the expected format
          const allMeetings = Array.isArray(action.payload) ? action.payload : [];
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          const pastMeetings = [];
          const currentMeetings = [];
          const futureMeetings = [];
          
          allMeetings.forEach(meeting => {
            // Normalize the meeting object
            const normalizedMeeting = normalizeRoleValue(meeting);
            
            const meetingDate = new Date(normalizedMeeting.meetingDate || normalizedMeeting.date);
            const meetingDateOnly = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate());
            
            if (meetingDateOnly < today) {
              pastMeetings.push(normalizedMeeting);
            } else if (meetingDateOnly.getTime() === today.getTime()) {
              currentMeetings.push(normalizedMeeting);
            } else {
              futureMeetings.push(normalizedMeeting);
            }
          });
          
          state.meetings = {
            pastMeetings,
            currentMeetings,
            futureMeetings
          };
        }
        
        // Set next meeting for timer if available
        if (action.payload.nextMeeting) {
          state.nextMeeting = normalizeRoleValue(action.payload.nextMeeting);
        }
        
        state.loading = false;
        state.error = null;
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
        // Normalize role for the new meeting
        const meeting = normalizeRoleValue(action.payload);
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const meetingDate = new Date(meeting.meetingDate || meeting.date);
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
        // Normalize the updated meeting
        const updatedMeeting = normalizeRoleValue(action.payload);
        const meetingId = updatedMeeting.id;
        
        // Helper function to update meeting in specific category
        const updateInCategory = (category) => {
          const index = state.meetings[category].findIndex(m => m.id === meetingId);
          if (index !== -1) {
            state.meetings[category][index] = updatedMeeting;
            return true;
          }
          return false;
        };
        
        // Try to update in all categories
        const updatedInPast = updateInCategory('pastMeetings');
        const updatedInCurrent = updateInCategory('currentMeetings');
        const updatedInFuture = updateInCategory('futureMeetings');
        
        // If not found in any category, check if dates changed and move appropriately
        if (!updatedInPast && !updatedInCurrent && !updatedInFuture) {
          // Add to appropriate category based on the updated date
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const meetingDate = new Date(updatedMeeting.meetingDate || updatedMeeting.date);
          const meetingDateOnly = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate());
          
          if (meetingDateOnly < today) {
            state.meetings.pastMeetings.push(updatedMeeting);
          } else if (meetingDateOnly.getTime() === today.getTime()) {
            state.meetings.currentMeetings.push(updatedMeeting);
          } else {
            state.meetings.futureMeetings.push(updatedMeeting);
          }
        }
        
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