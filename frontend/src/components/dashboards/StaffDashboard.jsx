import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Rating,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Container,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  CircularProgress
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import FeedbackIcon from '@mui/icons-material/Feedback';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DescriptionIcon from '@mui/icons-material/Description';
import LogoutIcon from '@mui/icons-material/Logout';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import EventIcon from '@mui/icons-material/Event';
import AssessmentIcon from '@mui/icons-material/Assessment';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import RefreshIcon from '@mui/icons-material/Refresh';
import BarChartIcon from '@mui/icons-material/BarChart';
import API from '../../api/axiosConfig';
import axios from 'axios';

// Import Redux actions
import { fetchUserProfile } from '../../redux/slices/userSlice';
import { fetchMeetings, resetCountdown } from '../../redux/slices/meetingSlice';
import { fetchAllQuestions, fetchQuestionsByDeptAndYear } from '../../redux/slices/questionSlice';
import { setRating, submitFeedback, clearRatings } from '../../redux/slices/feedbackSlice';
import { logout } from '../../redux/slices/authSlice';
import { 
  setActiveSection, 
  showSnackbar, 
  hideSnackbar 
} from '../../redux/slices/uiSlice';

// Import the components
import ProfileSection from '../staff-dashboard/ProfileSection';
import FeedbackSection from '../staff-dashboard/FeedbackSection';
import MeetingScheduleSection from '../staff-dashboard/MeetingScheduleSection';
import SidebarComponent from '../staff-dashboard/Sidebar';

// Configure axios defaults and interceptors
axios.defaults.baseURL = 'http://localhost:8080/api';

// Add request interceptor for all axios requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = {
        ...config.headers,
        'x-access-token': token,
        'Content-Type': 'application/json'
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear local storage and redirect to login
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const StaffDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redux state
  const { token, userRole } = useSelector(state => state.auth);
  const { profile } = useSelector(state => state.user);
  const { meetings } = useSelector(state => state.meetings);
  const { questions } = useSelector(state => state.questions);
  const { ratings: reduxRatings, loading: feedbackLoading, submitSuccess, error: feedbackError } = useSelector(state => state.feedback);
  const { activeSection } = useSelector(state => state.ui);
  const { loading: meetingsLoading, error: meetingsError, nextMeeting } = useSelector(state => state.meetings);

  // Local state
  const [localRatings, setLocalRatings] = useState({});
  const [loading, setLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [localQuestions, setLocalQuestions] = useState([]);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [shouldShowQuestions, setShouldShowQuestions] = useState(false);
  const [nextMeetingTimer, setNextMeetingTimer] = useState(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Ref for the polling interval
  const pollingIntervalRef = useRef(null);

  // Set initial active section
  useEffect(() => {
    dispatch(setActiveSection('profile'));
  }, [dispatch]);

  // Check authentication and role on component mount
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, redirecting to login');
        navigate('/login');
        return;
      }
      
      try {
        // Verify token by making a test request
        const response = await axios.get('/users/profile');
        if (!response.data) {
          throw new Error('Invalid profile response');
        }

        // Update user data in localStorage
        localStorage.setItem('userData', JSON.stringify(response.data));
        
        // Normalize and check role
        const normalizedRole = response.data.roles?.[0]?.name?.toLowerCase() || '';
      const isStaffRole = 
        normalizedRole === 'staff' || 
        normalizedRole === 'faculty' || 
        normalizedRole === 'teacher' ||
        normalizedRole.includes('staff');
      
      if (!isStaffRole) {
          console.log(`Invalid role for staff dashboard: ${normalizedRole}`);
        dispatch(showSnackbar({
          message: 'You do not have permission to access this dashboard',
          severity: 'error'
        }));
        navigate('/login');
        return;
      }
      
      console.log('Authentication successful for Staff Dashboard');
      
        // Store role in localStorage
        localStorage.setItem('userRole', 'staff');
        
        // Fetch meetings
        await fetchMeetingsDirectly();
        
      } catch (error) {
        console.error('Authentication error:', error.response?.data || error.message);
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        navigate('/login');
      }
    };

    checkAuthAndLoadData();
  }, [dispatch, navigate]);

  // Direct API call as fallback for profile loading
  const fetchUserProfileDirectly = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Token found:', token ? 'Yes' : 'No');
        
        if (!token) {
        console.error('No token found for direct profile fetch');
          return;
        }
        
      console.log('Attempting direct API call to fetch staff profile');
      
      // First try to get user data from login response stored in localStorage
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          const parsedUserData = JSON.parse(userData);
          console.log('Found stored user data:', parsedUserData);
          
          // Update the Redux store with this data
          dispatch({
            type: 'user/setUserProfile',
            payload: parsedUserData
          });
          
          return; // If we successfully loaded from localStorage, don't make API call
        } catch (e) {
          console.error('Error parsing stored user data:', e);
        }
      }
      
      // Call the API directly using the global API instance
      const response = await API.get('/users/profile');
      
      console.log('Profile API response received:', response.data);
      
      if (response.data && Object.keys(response.data).length > 0) {
        // Update Redux store with the profile data
        dispatch({
          type: 'user/setUserProfile',
          payload: response.data
        });
        
        // Store the data in localStorage for future use
        localStorage.setItem('userData', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Error in direct profile fetch:', error);
      console.error('Error response:', error.response?.data);
      
      // Set a default profile in case of error
      dispatch({
        type: 'user/setUserProfile',
        payload: {
          name: 'Staff Member',
          staffId: 'SF123456',
          department: { name: 'Engineering' },
          position: 'Lecturer',
          email: 'staff@university.edu'
        }
      });
    }
  };

  // Effect to show success/error messages for feedback submission
  useEffect(() => {
    if (submitSuccess) {
      dispatch(showSnackbar({
        message: 'Feedback submitted successfully',
        severity: 'success'
      }));
    } else if (feedbackError) {
      dispatch(showSnackbar({
        message: feedbackError,
        severity: 'error'
      }));
    }
  }, [dispatch, submitSuccess, feedbackError]);

  // Update fetchQuestions function
  const fetchQuestions = async (meetingId = null) => {
      setQuestionsLoading(true);
    setQuestionsError('');
    setFeedbackSubmitted(false);
      
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      let endpoint = '';
      
      // If meetingId is provided, use the meeting-specific endpoint
      if (meetingId) {
        endpoint = `http://localhost:8080/api/questions/meeting/${meetingId}`;
        
        // Also set this as the active meeting for feedback submission
        const meeting = meetings.find(m => m.id === meetingId);
        if (meeting) {
          setActiveMeeting(meeting);
          console.log('Set active meeting for feedback:', meeting);
          
          // Check if we're within 5 minutes of the meeting time
          const now = new Date();
          
          // Handle different date formats
          let meetingDate = meeting.date || meeting.meetingDate;
          const meetingTime = meeting.startTime || '00:00';
          
          // If date is an ISO string (contains 'T'), extract just the date part
          if (typeof meetingDate === 'string' && meetingDate.includes('T')) {
            meetingDate = meetingDate.split('T')[0]; // Extract just the YYYY-MM-DD part
          }
          
          const meetingDateTime = new Date(`${meetingDate}T${meetingTime}`);
          
          if (!isNaN(meetingDateTime.getTime())) {
            const diffMs = meetingDateTime.getTime() - now.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            
            // If meeting is more than 5 minutes away, we shouldn't show questions yet
            if (diffMins > 5) {
              console.log(`Meeting is ${diffMins} minutes away, questions will be available in ${diffMins - 5} minutes`);
              setShouldShowQuestions(false);
              setQuestionsLoading(false);
              return;
      } else {
              // Show questions if less than 5 minutes to meeting or if meeting has started but within 60 minutes
              if (diffMins >= -60) {
                console.log(`Meeting is ${diffMins <= 0 ? 'ongoing or past' : diffMins + ' minutes away'}, showing questions now`);
                setShouldShowQuestions(true);
              } else {
                console.log(`Meeting has passed by more than 60 minutes, not showing questions`);
                setShouldShowQuestions(false);
                setQuestionsLoading(false);
                return;
              }
            }
          } else {
            console.error('Invalid meeting date/time format:', meetingDate, meetingTime);
          }
        }
      } else {
        // If no meeting ID, only fetch if we have an active meeting and within 5 minutes
        if (activeMeeting) {
          const now = new Date();
          
          // Handle different date formats
          let meetingDate = activeMeeting.date || activeMeeting.meetingDate;
          const meetingTime = activeMeeting.startTime || '00:00';
          
          // If date is an ISO string (contains 'T'), extract just the date part
          if (typeof meetingDate === 'string' && meetingDate.includes('T')) {
            meetingDate = meetingDate.split('T')[0]; // Extract just the YYYY-MM-DD part
          }
          
          const meetingDateTime = new Date(`${meetingDate}T${meetingTime}`);
          
          if (!isNaN(meetingDateTime.getTime())) {
            const diffMs = meetingDateTime.getTime() - now.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMins > 5) {
              console.log(`Meeting is ${diffMins} minutes away, questions will be available in ${diffMins - 5} minutes`);
              setShouldShowQuestions(false);
              setQuestionsLoading(false);
              return;
            }
            
            // Use meeting-specific endpoint with active meeting ID
            endpoint = `http://localhost:8080/api/questions/meeting/${activeMeeting.id}`;
            setShouldShowQuestions(true);
          } else {
            console.error('Invalid meeting date/time format for active meeting:', meetingDate, meetingTime);
          }
        } else {
          // No meeting ID and no active meeting, use regular endpoint
          endpoint = 'http://localhost:8080/api/questions';
          // Clear active meeting when fetching all questions
        setActiveMeeting(null);
        }
      }
      
      const response = await axios.get(endpoint, {
        headers: {
          'x-access-token': token
        }
      });

      if (response.data) {
        console.log('Questions data:', response.data);
        
        // Set questions and initialize ratings
        const questionsData = Array.isArray(response.data) ? response.data : [];
        setLocalQuestions(questionsData);
        
        // Initialize ratings for each question
        const initialRatings = {};
        questionsData.forEach(question => {
          initialRatings[question.id] = 0;
        });
        setLocalRatings(initialRatings);
        
        // Check if feedback was already submitted for this meeting
        if ((meetingId || activeMeeting) && questionsData.length > 0) {
          const currentMeetingId = meetingId || activeMeeting.id;
          try {
            // Use the new endpoint that combines meeting ID and current user
            const feedbackResponse = await axios.get(`http://localhost:8080/api/feedback/meeting/${currentMeetingId}/user`, {
              headers: {
                'x-access-token': token
              }
            });

            if (feedbackResponse.data && Array.isArray(feedbackResponse.data) && feedbackResponse.data.length > 0) {
              console.log('Found existing feedback for this meeting/user:', feedbackResponse.data);
              setFeedbackSubmitted(true);
              setShouldShowQuestions(false);
            }
          } catch (error) {
            // 404 error is expected if no feedback exists yet
            if (error.response && error.response.status === 404) {
              console.log('No feedback found for this meeting/user, can submit new feedback');
              // This is normal, user hasn't submitted feedback yet
              setFeedbackSubmitted(false);
            } else {
              console.error('Error checking for existing feedback:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setQuestionsError('Failed to load questions. Please try again later.');
    } finally {
      setQuestionsLoading(false);
    }
  };

  // Add useEffect to fetch questions when component mounts and activeSection changes
  useEffect(() => {
    if (activeSection === 'submit-feedback') {
      console.log('Submit Feedback section active, fetching questions...');
      fetchQuestions();
    }
  }, [activeSection]);

  // Update the useEffect to monitor questions state changes
  useEffect(() => {
    // Log when questions state changes
    console.log('Questions state changed in Redux:', questions);
    console.log('Current local questions state:', localQuestions);
    
    // If we're in submit-feedback section but have no questions in either state, try to fetch them
    if (activeSection === 'submit-feedback' && 
        localQuestions.length === 0 && 
        (!questions || questions.length === 0)) {
      console.log('Active section is submit-feedback but no questions found in any state, fetching...');
      fetchQuestions();
    }
  }, [questions, localQuestions, activeSection]);

  // Add a check for department ID on mount
  useEffect(() => {
    // Check for department ID in user data
    const checkDepartmentId = () => {
      try {
        const userData = JSON.parse(localStorage.getItem('userData')) || {};
        console.log('Checking department ID in userData:', userData);
        
        const departmentId = userData.departmentId || 
                            (userData.department?.id) || 
                            (typeof userData.department === 'number' ? userData.department : null);
        
        if (!departmentId) {
          console.error('Department ID not found in user data. Staff cannot fetch questions without department ID.');
          setQuestionsError('Department ID not found in your profile. Please contact admin.');
          
          // Show error notification
          setSnackbar({
            open: true,
            message: 'Department ID not found in your profile. Staff feedback requires a department assignment.',
            severity: 'error'
          });
        } else {
          console.log('Department ID found:', departmentId);
        }
      } catch (error) {
        console.error('Error checking department ID:', error);
      }
    };
    
    checkDepartmentId();
  }, []);

  const handleRatingChange = (questionId, value) => {
    setLocalRatings(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmitFeedback = async (notes = {}) => {
    try {
      // Validate that all questions have ratings
      const hasEmptyRatings = Object.values(localRatings).some(rating => rating === 0);
      
      if (hasEmptyRatings) {
        setSnackbar({
          open: true,
          message: 'Please rate all questions before submitting',
          severity: 'warning'
        });
        return;
      }
      
      setLoading(true);

      // Try to submit feedback
      try {
        const token = localStorage.getItem('token');
        
        // Get meetingId from active meeting if available
        const activeMeetingId = activeMeeting?.id || null;
          
        console.log('Submitting feedback for meeting ID:', activeMeetingId);
        
        // Process each question's rating and submit individually
        for (const [questionId, rating] of Object.entries(localRatings)) {
          if (rating > 0) {
            // Get notes for this question if available
            const noteText = notes[questionId] || '';
            
            // Using the correct API endpoint for feedback submission
            await axios.post('http://localhost:8080/api/feedback/submit', {
              questionId: parseInt(questionId),
              rating: rating,
              notes: noteText, // Include notes from the form
              meetingId: activeMeetingId // Include the meetingId
            }, {
              headers: {
                'x-access-token': token,
                'Content-Type': 'application/json'
              }
            });
            
            console.log(`Feedback for question ${questionId} submitted successfully with notes: ${noteText ? 'Yes' : 'No'}`);
          }
        }

        // Show success message
        setSnackbar({
          open: true,
          message: 'Feedback submitted successfully',
          severity: 'success'
        });

        // Reset ratings
        const resetRatings = {};
        questions.forEach(q => {
          resetRatings[q.id] = 0;
        });
        setLocalRatings(resetRatings);
        setFeedbackSubmitted(true);
        setShouldShowQuestions(false);
        
        return true;
      } catch (apiError) {
        console.error('Error submitting feedback to API:', apiError);
        
        // Show error message
        setSnackbar({
          open: true,
          message: 'Failed to submit feedback: ' + (apiError.response?.data?.message || 'Please try again'),
          severity: 'error'
        });
        
        return false;
      }
    } catch (error) {
      console.error('Error in feedback submission flow:', error);
      // Show generic message
      setSnackbar({
        open: true,
        message: 'Please try again later',
        severity: 'info'
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  const handleCloseSnackbar = () => {
    dispatch(hideSnackbar());
  };

  // Add a direct API call function to fetch meetings
  const fetchMeetingsDirectly = async () => {
    try {
      console.log('Staff Dashboard: Fetching meetings directly from API');
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found for meeting fetch');
      }
      
      // Make direct API call using axios instead of fetch
      const response = await axios.get('/meetings/user/current');
      console.log('Staff Dashboard: Raw meetings data from API:', response.data);
      
      // Process the response based on its structure
      const meetingsData = response.data;
      if (meetingsData) {
        console.log('Staff Dashboard: Successfully fetched meetings from API');
        
        let pastMeetings = [];
        let currentMeetings = [];
        let futureMeetings = [];
        let allMeetings = [];
        
        // Check if the API returns categorized meetings or a flat array
        if (Array.isArray(meetingsData)) {
          console.log('Staff Dashboard: API returned an array of meetings, categorizing them');
          allMeetings = meetingsData;
          
          // Categorize meetings manually
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
          meetingsData.forEach(meeting => {
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
        } else if (typeof meetingsData === 'object') {
          // API returned an object with categories
          console.log('Staff Dashboard: API returned categorized meetings');
          pastMeetings = meetingsData.pastMeetings || [];
          currentMeetings = meetingsData.currentMeetings || [];
          futureMeetings = meetingsData.futureMeetings || [];
          allMeetings = [
            ...pastMeetings,
            ...currentMeetings,
            ...futureMeetings
          ];
        }
        
        console.log(`Staff Dashboard: Processed ${allMeetings.length} total meetings`,
                   `(${pastMeetings.length} past, ${currentMeetings.length} current, ${futureMeetings.length} future)`);
        
        // Update Redux state with categorized meetings
        dispatch({
          type: 'meetings/setMeetings',
          payload: {
            pastMeetings,
            currentMeetings,
            futureMeetings
          }
        });
        
        // Store in localStorage for persistence across refreshes
        localStorage.setItem('staffMeetings', JSON.stringify(allMeetings));
        console.log('Staff Dashboard: Saved meetings to localStorage');
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Staff Dashboard: Error fetching meetings from API:', error.response || error);
      
      // Try loading from localStorage as a last resort
      try {
        const storedMeetings = localStorage.getItem('staffMeetings');
        if (storedMeetings) {
          const parsedMeetings = JSON.parse(storedMeetings);
          if (Array.isArray(parsedMeetings)) {
            console.log('Staff Dashboard: Loading meetings from localStorage:', parsedMeetings.length);
            
            // Categorize meetings
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            const pastMeetings = [];
            const currentMeetings = [];
            const futureMeetings = [];
            
            parsedMeetings.forEach(meeting => {
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
            
            // Update Redux state
    dispatch({
      type: 'meetings/setMeetings',
      payload: {
                pastMeetings,
                currentMeetings,
                futureMeetings
              }
            });
            
            return true;
          }
        }
      } catch (localStorageError) {
        console.error('Staff Dashboard: Error loading meetings from localStorage:', localStorageError);
      }
      
      // If all else fails, return empty meetings
      dispatch({
        type: 'meetings/setMeetings',
        payload: {
          pastMeetings: [],
          currentMeetings: [],
          futureMeetings: []
        }
      });
      
      dispatch(showSnackbar({
        message: 'Could not load meetings. Please try again later.',
        severity: 'error'
      }));
      
      return false;
    }
  };

  // Handle fetching questions for a specific meeting
  const handleFetchQuestionsByMeeting = (meetingId) => {
    // First switch to the feedback section
    dispatch(setActiveSection('submit-feedback'));
    
    // Then fetch questions for this meeting after a short delay
    setTimeout(() => {
      fetchQuestions(meetingId);
    }, 100);
  };

  // Update handleSectionChange function
  const handleSectionChange = (sectionName) => {
    console.log('Changing section to:', sectionName);
    dispatch(setActiveSection(sectionName));
    
    // Force fetch questions if switching to feedback section
    if (sectionName === 'submit-feedback') {
      console.log('Submit Feedback section selected, forcing question fetch');
      // Add a small delay to ensure the section change has been processed
      setTimeout(() => {
      fetchQuestions();
      }, 100);
    }
  };

  // Add polling for upcoming meetings
  const checkForUpcomingMeetings = () => {
    if (!meetings || (!meetings.futureMeetings && !meetings.currentMeetings)) return;
    
    console.log('Checking for upcoming meetings within 5 minutes window...');
    
    const now = new Date();
    let upcomingMeeting = null;
    let minutesUntilStart = Infinity;
    
    // Get all meetings 
    const allMeetings = [
      ...(meetings.currentMeetings || []),
      ...(meetings.futureMeetings || [])
    ];
    
    // Find the closest upcoming meeting
    allMeetings.forEach(meeting => {
      // Parse meeting date and time
      let meetingDate = meeting.date || meeting.meetingDate;
      const meetingTime = meeting.startTime || '00:00';
      
      // If date is an ISO string (contains 'T'), extract just the date part
      if (typeof meetingDate === 'string' && meetingDate.includes('T')) {
        meetingDate = meetingDate.split('T')[0]; // Extract just the YYYY-MM-DD part
      }
      
      const meetingDateTime = new Date(`${meetingDate}T${meetingTime}`);
      
      if (isNaN(meetingDateTime.getTime())) {
        console.log(`Invalid meeting date/time for meeting ${meeting.id}`);
        return; // Skip this meeting
      }
      
      // Calculate minutes until meeting starts
      const diffMs = meetingDateTime.getTime() - now.getTime();
      const minsUntil = Math.floor(diffMs / 60000);
      
      // If this meeting is closer than our current closest but still in the future
      if (minsUntil >= -60 && minsUntil < minutesUntilStart) {
        minutesUntilStart = minsUntil;
        upcomingMeeting = meeting;
      }
    });
    
    // If we found an upcoming meeting within 5 minutes, show questions
    if (upcomingMeeting && minutesUntilStart <= 5 && minutesUntilStart >= -60) {
      console.log(`Found meeting starting in ${minutesUntilStart} minutes:`, upcomingMeeting.title);
      
      // Set as active meeting
      setActiveMeeting(upcomingMeeting);
      setShouldShowQuestions(true);
      
      // If we're on the feedback section, load questions for this meeting
      if (activeSection === 'submit-feedback') {
        fetchQuestions(upcomingMeeting.id);
      } else {
        // Show notification about available feedback
        setSnackbar({
          open: true,
          message: `Questions are now available for the upcoming meeting: ${upcomingMeeting.title}`,
          severity: 'info'
        });
      }
    } else if (upcomingMeeting) {
      console.log(`Next meeting is in ${minutesUntilStart} minutes, no questions yet.`);
      
      // We have a meeting but it's not within 5 minutes
      // Just set it as active meeting for tracking
      setActiveMeeting(upcomingMeeting);
      setShouldShowQuestions(false);
      
      // Schedule the questions to show at the right time
      if (minutesUntilStart > 5) {
        // Clear any existing timer
        if (nextMeetingTimer) {
          clearTimeout(nextMeetingTimer);
        }
        
        // Schedule when to show questions (5 minutes before)
        const timeoutMs = (minutesUntilStart - 5) * 60 * 1000;
        console.log(`Scheduling questions to appear in ${Math.floor(timeoutMs/60000)} minutes`);
        
        const newTimer = setTimeout(() => {
          console.log(`It's 5 minutes before meeting ${upcomingMeeting.id}, showing questions now`);
          setShouldShowQuestions(true);
          
          // Show notification
          setSnackbar({
            open: true,
            message: `Questions are now available for meeting: ${upcomingMeeting.title}`,
            severity: 'info'
          });
          
          // If already on feedback section, load questions
          if (activeSection === 'submit-feedback') {
            fetchQuestions(upcomingMeeting.id);
          }
        }, timeoutMs);
        
        setNextMeetingTimer(newTimer);
      }
    }
  };

  // Add polling interval setup
  const startPollingForMeetings = () => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    console.log('Starting to poll for upcoming meetings every 30 seconds');
    
    // Initial check
    checkForUpcomingMeetings();
    
    // Set up new interval
    pollingIntervalRef.current = setInterval(() => {
      checkForUpcomingMeetings();
    }, 30000); // 30 seconds interval
  };

  // Function to stop polling
  const stopPollingForMeetings = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    if (nextMeetingTimer) {
      clearTimeout(nextMeetingTimer);
    }
  };

  // Set up polling in a useEffect
  useEffect(() => {
    // Start polling for meetings after they've been loaded
    if (meetings && (meetings.currentMeetings || meetings.futureMeetings)) {
      startPollingForMeetings();
    }
    
    // Clean up on component unmount
    return () => {
      stopPollingForMeetings();
    };
  }, [meetings, activeSection, fetchQuestions]);

  // Main content
  const renderMainContent = () => {
    console.log('Rendering main content for section:', activeSection);
    
    switch(activeSection) {
      case 'profile':
        return (
          <ProfileSection 
            userProfile={profile} 
            loading={loading}
          />
        );
      case 'view-meetings':
        return (
          <MeetingScheduleSection 
            meetings={{
              pastMeetings: meetings.pastMeetings || [],
              currentMeetings: meetings.currentMeetings || [],
              futureMeetings: meetings.futureMeetings || []
            }}
            loading={meetingsLoading}
            error={meetingsError}
            handleFetchQuestionsByMeeting={handleFetchQuestionsByMeeting}
            handleRefreshMeetings={fetchMeetingsDirectly}
          />
        );
      case 'submit-feedback':
        return (
          <FeedbackSection 
            questions={localQuestions.length > 0 ? localQuestions : (questions || [])}
            localRatings={localRatings}
            handleRatingChange={handleRatingChange}
            handleSubmitFeedback={handleSubmitFeedback}
            loading={loading}
            questionsLoading={questionsLoading}
            questionsError={questionsError}
            activeMeeting={activeMeeting}
            feedbackSubmitted={feedbackSubmitted}
            setFeedbackSubmitted={setFeedbackSubmitted}
            shouldShowQuestions={shouldShowQuestions}
          />
        );
      default:
        return (
          <ProfileSection 
            userProfile={profile} 
            loading={loading}
          />
        );
    }
  }

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar */}
      <SidebarComponent 
        activeSection={activeSection} 
        handleSectionChange={handleSectionChange} 
        handleLogout={handleLogout}
      />

      {/* Main content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3,
          bgcolor: '#f5f5f7',
          ml: '240px',
          minHeight: '100vh'
        }}
      >
        <Container maxWidth="lg">
          {renderMainContent()}
        </Container>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StaffDashboard;
