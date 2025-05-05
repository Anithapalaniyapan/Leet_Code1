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
  CircularProgress,
  Fade
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
  // New state for persistent feedback submission alert
  const [feedbackAlert, setFeedbackAlert] = useState({
    open: false,
    message: 'Feedback submitted successfully'
  });

  // Ref for the polling interval
  const pollingIntervalRef = useRef(null);

  // Set initial active section and load data
  useEffect(() => {
    dispatch(setActiveSection('profile'));
    
    // Fetch user profile directly as soon as the component mounts
    fetchUserProfileDirectly();
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
        
        // Fetch profile data directly
        await fetchUserProfileDirectly();
        
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
        // Don't proceed without a token
        navigate('/login');
        return;
      }
      
      console.log('Attempting direct API call to fetch staff profile');
      
      // First try to get user data from login response stored in localStorage
      let userData = localStorage.getItem('userData');
      let parsedUserData = null;
      
      if (userData) {
        try {
          parsedUserData = JSON.parse(userData);
          console.log('Found stored user data:', parsedUserData);
          
          // If the stored data is empty or missing critical fields, don't use it
          if (!parsedUserData || !parsedUserData.id || !parsedUserData.email) {
            console.log('Stored user data is incomplete, will fetch from API');
            parsedUserData = null;
          }
        } catch (e) {
          console.error('Error parsing stored user data:', e);
          // Clear the invalid data
          localStorage.removeItem('userData');
        }
      }
      
      // If we don't have valid stored data, fetch from API
      if (!parsedUserData) {
        // Call the API directly using axios
        console.log('Making API call to /users/profile');
        const response = await axios.get('/users/profile');
        
        console.log('Profile API response received:', response.data);
        
        if (response.data && Object.keys(response.data).length > 0) {
          parsedUserData = response.data;
          
          // Store the data in localStorage for future use
          localStorage.setItem('userData', JSON.stringify(parsedUserData));
          console.log('Updated userData in localStorage');
        } else {
          throw new Error('Empty or invalid profile data received from API');
        }
      }
      
      // Update Redux store with the profile data
      dispatch({
        type: 'user/setUserProfile',
        payload: parsedUserData
      });
      
    } catch (error) {
      console.error('Error in direct profile fetch:', error);
      console.error('Error response:', error.response?.data);
      
      // Try one more time with a different endpoint if the first one failed
      try {
        console.log('Attempting alternative API endpoint for profile');
        const alternativeResponse = await axios.get('/users/me');
        
        if (alternativeResponse.data && Object.keys(alternativeResponse.data).length > 0) {
          // Update Redux store with the profile data
          dispatch({
            type: 'user/setUserProfile',
            payload: alternativeResponse.data
          });
          
          // Store the data in localStorage for future use
          localStorage.setItem('userData', JSON.stringify(alternativeResponse.data));
          console.log('Saved profile data from alternative endpoint');
          return;
        }
      } catch (altError) {
        console.error('Alternative profile endpoint also failed:', altError);
      }
      
      // If we still don't have profile data, show an error notification
      setSnackbar({
        open: true,
        message: 'Unable to load your profile. Please try refreshing the page.',
        severity: 'error'
      });
    }
  };

  // Effect to show success/error messages for feedback submission
  useEffect(() => {
    if (submitSuccess) {
      // Show persistent alert instead of temporary snackbar
      setFeedbackAlert({
        open: true,
        message: 'Feedback submitted successfully'
      });
      
      // Also set feedbackSubmitted to true when Redux state indicates success
      setFeedbackSubmitted(true);
    } else if (feedbackError) {
      dispatch(showSnackbar({
        message: feedbackError,
        severity: 'error'
      }));
    }
  }, [dispatch, submitSuccess, feedbackError]);

  // Update fetchQuestions function
  const fetchQuestions = async (meetingId = null) => {
    try {
      setQuestionsLoading(true);
      setQuestionsError(null);
      
      console.log('Fetching questions for meeting:', meetingId);
      
      // Try getting token from multiple sources to ensure we have one
      let token = localStorage.getItem('token');
      
      // Backup tokens (in case primary token is invalid)
      const backupToken = sessionStorage.getItem('token') || 
                         localStorage.getItem('refreshToken') || 
                         token;
      
      if (!token) {
        if (backupToken) {
          token = backupToken;
          console.log('Using backup token source');
          // Store this token for future use
          localStorage.setItem('token', token);
        } else {
          throw new Error('No authentication token found');
        }
      }
      
      // Track if this specific API call has already been completed
      let isCallCompleted = false;
      
      // Add a safety timeout to abort if API never returns
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          if (!isCallCompleted) {
            reject(new Error('Questions fetch timed out after 15 seconds'));
          }
        }, 15000);
      });
      
      // Determine the correct endpoint URL based on whether we have a meetingId
      let endpointUrl;
      if (meetingId) {
        endpointUrl = `http://localhost:8080/api/questions/meeting/${meetingId}?role=staff`;
      } else {
        // Use the department-based endpoint as fallback if no meeting is specified
        // Get user data to extract department
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const departmentId = userData.departmentId || 
                            (userData.department?.id) || 
                            (typeof userData.department === 'number' ? userData.department : null);
                            
        if (departmentId) {
          endpointUrl = `http://localhost:8080/api/questions/department/${departmentId}?role=staff`;
        } else {
          // Last resort - try the general questions endpoint
          endpointUrl = `http://localhost:8080/api/questions?role=staff`;
        }
      }
      
      console.log('Using questions endpoint:', endpointUrl);
      
      // Do the actual fetch
      const fetchPromise = axios.get(endpointUrl, {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      isCallCompleted = true;
      
      console.log('Questions API response:', response.data);
      
      // Extract questions from the response based on the structure
      let questionsList = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          questionsList = response.data;
        } else if (response.data.questions && Array.isArray(response.data.questions)) {
          questionsList = response.data.questions;
        } else if (typeof response.data === 'object') {
          // Try to extract questions in case they're nested under a different key
          const possibleQuestionsArray = Object.values(response.data).find(val => Array.isArray(val));
          if (possibleQuestionsArray && possibleQuestionsArray.length > 0) {
            questionsList = possibleQuestionsArray;
          }
        }
      }
      
      // Check if we found any questions
      if (questionsList.length > 0) {
        console.log(`Successfully retrieved ${questionsList.length} questions`);
        
        // Initialize local ratings for each question
        const initialRatings = {};
        questionsList.forEach(question => {
          initialRatings[question.id] = 0;
        });
        
        setLocalRatings(initialRatings);
        setLocalQuestions(questionsList);
        return questionsList;
      } else {
        // Set a specific error for no questions found
        setQuestionsError('No questions found for this meeting or department');
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      const errorMessage = error.response?.status === 404
        ? 'No questions available for this meeting yet. Please check back later.'
        : (error.response?.data?.message || error.message || 'Failed to fetch questions');
        
      setQuestionsError(errorMessage);
      
      return [];
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
        return false;
      }
      
      setLoading(true);

      // Create a flag to track submission completion to avoid duplicate submissions
      let isSubmissionCompleted = false;
      
      // Set a timeout to ensure we exit loading state even if API doesn't respond
      const submissionTimeout = setTimeout(() => {
        if (!isSubmissionCompleted) {
          console.error('Feedback submission timed out');
          setLoading(false);
          setSnackbar({
            open: true,
            message: 'Submission timed out. Please try again.',
            severity: 'error'
          });
        }
      }, 20000); // 20 second timeout
      
      // Try to submit feedback
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found for submission');
        }
        
        // Get meetingId from active meeting if available
        const activeMeetingId = activeMeeting?.id || null;
          
        console.log('Submitting feedback for meeting ID:', activeMeetingId);
        
        // Track all submission promises
        const submissionPromises = [];
        
        // Process each question's rating and submit individually
        for (const [questionId, rating] of Object.entries(localRatings)) {
          if (rating > 0) {
            // Get notes for this question if available
            const noteText = notes[questionId] || '';
            
            // Add to promises array instead of awaiting each one
            submissionPromises.push(
              axios.post('http://localhost:8080/api/feedback/submit', {
                questionId: parseInt(questionId),
                rating: rating,
                notes: noteText,
                meetingId: activeMeetingId
              }, {
                headers: {
                  'x-access-token': token,
                  'Content-Type': 'application/json'
                }
              })
            );
          }
        }
        
        // Wait for all submissions to complete
        const submitResponse = await Promise.all(submissionPromises);
        
        isSubmissionCompleted = true;
        clearTimeout(submissionTimeout);

        // Reset ratings
        const resetRatings = {};
        questions.forEach(q => {
          resetRatings[q.id] = 0;
        });
        setLocalRatings(resetRatings);
        setFeedbackSubmitted(true);
        setShouldShowQuestions(false);
        
        // Show permanent feedback alert
        setFeedbackAlert({
          open: true,
          message: 'Feedback submitted successfully'
        });
        
        return true;
      } catch (apiError) {
        console.error('Error submitting feedback to API:', apiError);
        isSubmissionCompleted = true;
        clearTimeout(submissionTimeout);
        
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

  // New function to close the persistent feedback alert if needed
  const handleCloseFeedbackAlert = () => {
    setFeedbackAlert(prev => ({
      ...prev,
      open: false
    }));
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

  // Function to check for meetings that are about to start within 5 minutes
  const checkForUpcomingMeetings = () => {
    // Disable notifications about upcoming meetings
    const disableNotifications = true;
    
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
          
          // If already on feedback section, load questions
          if (activeSection === 'submit-feedback') {
            fetchQuestions(upcomingMeeting.id);
          }
        }, timeoutMs);
        
        setNextMeetingTimer(newTimer);
      }
    }
  };

  // Set up polling in a useEffect
  useEffect(() => {
    // Start polling for meetings after they've been loaded
    if (meetings && (meetings.currentMeetings || meetings.futureMeetings)) {
      // Only start polling if we're not already polling
      if (!pollingIntervalRef.current) {
        startPollingForMeetings();
      }
    }
    
    // Clean up on component unmount
    return () => {
      stopPollingForMeetings();
    };
  }, [meetings, activeSection]);
  
  // Separate effect for meeting-specific actions
  useEffect(() => {
    // If we're on the feedback section and have an active meeting,
    // fetch questions for this meeting, but ONLY if we haven't loaded them yet
    if (activeSection === 'submit-feedback' && activeMeeting && 
        !questionsLoading && !localQuestions.length && !questionsError) {
      console.log('Loading questions for active meeting from section change:', activeMeeting.id);
      fetchQuestions(activeMeeting.id);
    }
  }, [activeSection, activeMeeting]);
  
  // Prevent unnecessary rerenders by using a ref to track if this is the initial load
  const initialLoadRef = useRef(false);
  
  // Reduce polling frequency for meeting checks
  const startPollingForMeetings = () => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    // If we already did one check and are on a different section than feedback,
    // we can poll less frequently
    const pollingInterval = activeSection === 'submit-feedback' ? 30000 : 60000;
    
    console.log(`Starting to poll for upcoming meetings every ${pollingInterval/1000} seconds`);
    
    // Initial check only if we haven't done one yet
    if (!initialLoadRef.current) {
      checkForUpcomingMeetings();
      initialLoadRef.current = true;
    }
    
    // Set up new interval with more reasonable frequency
    pollingIntervalRef.current = setInterval(() => {
      // Only check for upcoming meetings if needed
      if (!feedbackSubmitted) {
        checkForUpcomingMeetings();
      }
    }, pollingInterval);
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

  // Add useEffect to clear any info notifications on mount
  useEffect(() => {
    // Clear any info notifications about questions on component mount
    const infoMessages = [
      "Questions are now available for the upcoming meeting",
      "Questions are now available for meeting"
    ];
    
    // Check if current snackbar is an info notification about questions
    if (snackbar.open && 
        snackbar.severity === 'info' && 
        infoMessages.some(msg => (snackbar.message || '').includes(msg))) {
      dispatch(hideSnackbar());
    }
  }, []);

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
            setQuestionsLoading={setQuestionsLoading}
            setQuestionsError={setQuestionsError}
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
        onSectionChange={handleSectionChange}
        activeSection={activeSection} 
        onLogout={handleLogout}
      />

      {/* Main content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3,
          ml: { sm: '240px' },
          bgcolor: '#f5f5f7',
          minHeight: '100vh',
          position: 'relative'
        }}
      >
        {/* Persistent feedback submission alert */}
        {feedbackAlert.open && (
          <Alert 
            severity="success"
            icon={<CheckCircleIcon fontSize="large" />}
            sx={{ 
              position: 'fixed', 
              bottom: 24, 
              left: { xs: '50%', sm: 'calc(240px + 50%)' }, 
              transform: 'translateX(-50%)',
              zIndex: 9999,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
              minWidth: '300px',
              maxWidth: { xs: '90%', sm: '400px' },
              py: 2,
              fontSize: '1rem',
              fontWeight: 'medium',
              border: '1px solid #c8e6c9',
              bgcolor: 'rgba(255, 255, 255, 0.97)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                Feedback submitted successfully
              </Typography>
      </Box>
          </Alert>
        )}

        {/* Loading overlay - similar to Academic Director's dashboard */}
        {(loading || questionsLoading || meetingsLoading || feedbackLoading) && !profile && (
          <Fade in={true}>
            <Box sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              backgroundColor: 'rgba(25, 118, 210, 0.05)',
              backdropFilter: 'blur(5px)'
            }}>
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <Box sx={{
                  width: '80px',
                  height: '80px',
                  position: 'relative',
                  animation: 'rotate 3s linear infinite',
                  '@keyframes rotate': {
                    '0%': {
                      transform: 'rotate(0deg)'
                    },
                    '100%': {
                      transform: 'rotate(360deg)'
                    }
                  }
                }}>
                  <Box sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    border: '3px solid transparent',
                    borderRadius: '50%',
                    borderTopColor: '#3f51b5',
                    borderBottomColor: '#f50057',
                    borderLeftColor: '#00acc1',
                    borderRightColor: '#ff9800',
                    filter: 'drop-shadow(0 0 8px rgba(63, 81, 181, 0.5))'
                  }} />
                  <Box sx={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    right: '10px',
                    bottom: '10px',
                    border: '3px solid transparent',
                    borderRadius: '50%',
                    borderTopColor: '#00acc1',
                    borderBottomColor: '#3f51b5',
                    borderLeftColor: '#ff9800',
                    borderRightColor: '#f50057',
                    animation: 'rotate 1.5s linear infinite reverse',
                  }} />
                </Box>

                <Box sx={{
                  mt: 4,
                  textAlign: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  border: '1px solid rgba(0, 0, 0, 0.05)'
                }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      background: 'linear-gradient(45deg, #3f51b5 30%, #00acc1 90%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1
                    }}
                  >
                    Staff Dashboard
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Loading your dashboard...
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Fade>
        )}

        {/* Main content */}
        {renderMainContent()}

      {/* Snackbar for notifications */}
      <Snackbar
          open={snackbar.open && !(
            snackbar.severity === 'info' && 
            (snackbar.message || '').includes('Questions are now available')
          )}
        autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Box>
    </Box>
  );
};

export default StaffDashboard;
