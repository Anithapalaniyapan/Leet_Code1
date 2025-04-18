import React, { useEffect, useState } from 'react';
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
  const fetchQuestions = async () => {
    setQuestionsLoading(true);
    setQuestionsError('');
    
    console.log('Starting to fetch questions, current Redux questions state:', questions);
    
    try {
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem('userData')) || {};
      console.log('Staff userData:', userData);

      // Get department ID
      const departmentId = userData.departmentId || 
                          (userData.department?.id) || 
                          (typeof userData.department === 'number' ? userData.department : null);

      if (!departmentId) {
        throw new Error('Department ID not found in your profile');
      }

      console.log('Fetching questions for department:', departmentId);

      // Make the API call
      const response = await axios.get(`http://localhost:8080/api/questions/department/${departmentId}`, {
          params: {
            role: 'staff'
          },
          headers: {
            'x-access-token': localStorage.getItem('token')
          }
      });

      console.log('Questions API Response:', response.data);

      if (response.data && Array.isArray(response.data)) {
        const staffQuestions = response.data.filter(question => {
          const isStaffQuestion = 
            question.role?.toLowerCase() === 'staff' ||
            question.role?.toLowerCase() === 'both' ||
            question.roleId === 2 ||
            question.targetRole?.toLowerCase() === 'staff';
          
          return isStaffQuestion;
        });

        console.log('Filtered staff questions:', staffQuestions);

        if (staffQuestions.length === 0) {
          console.log('No staff questions found after filtering');
          setQuestionsError('No questions available for staff in your department');
          
          // Update both Redux and local state
          dispatch({
            type: 'questions/setQuestions',
            payload: []
          });
          setLocalQuestions([]);
          return;
        }

        // Update both Redux and local state
        dispatch({
          type: 'questions/setQuestions',
          payload: staffQuestions
        });
        setLocalQuestions(staffQuestions);
        
        // Initialize ratings state for new questions
        const newRatings = {};
        staffQuestions.forEach(question => {
          newRatings[question.id] = 0;
        });
        setLocalRatings(newRatings);
        setQuestionsError('');
        
        console.log('Questions loaded successfully, count:', staffQuestions.length);
      } else {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to fetch questions. Please try again later.';
      
      console.log('Setting error message:', errorMessage);
      setQuestionsError(errorMessage);
      
      // Clear questions in both Redux and local state
      dispatch({
        type: 'questions/setQuestions',
        payload: []
      });
      setLocalQuestions([]);
    } finally {
      setQuestionsLoading(false);
      // Log the final state after the operation
      console.log('Questions fetch completed, Redux questions state:', questions);
      console.log('Questions fetch completed, local questions state:', localQuestions);
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

  const handleSubmitFeedback = async () => {
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

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Process each question's rating and submit individually
      for (const [questionId, rating] of Object.entries(localRatings)) {
        if (rating > 0) {
          // Using the correct API endpoint for feedback submission
          await axios.post('http://localhost:8080/api/feedback/submit', {
            questionId: parseInt(questionId),
            rating: rating,
            notes: '' // Optional notes field
          }, {
        headers: {
              'x-access-token': token,
              'Content-Type': 'application/json'
        }
      });
          
          console.log(`Feedback for question ${questionId} submitted successfully`);
        }
      }

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

    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSnackbar({
        open: true,
        message: 'Failed to submit feedback: ' + (error.response?.data?.message || 'Please try again.'),
        severity: 'error'
      });
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

  // Render staff profile section
  const renderProfile = () => {
    // Get user data from both Redux and localStorage
    const userData = JSON.parse(localStorage.getItem('userData')) || {};
    console.log('Staff Profile - User Data:', userData);

    // Combine profile data with fallbacks
    const profileData = {
      name: profile?.fullName || userData?.fullName || 'Professor',
      staffId: profile?.username || userData?.username || 'CS001',
      department: profile?.department?.name || userData?.department?.name || 'Computer Science and Engineering',
      position: 'Professor', // Default position for staff
      email: profile?.email || userData?.email || 'CS001@shanmugha.edu.in'
    };

    return (
      <Paper sx={{ 
        p: 4, 
        borderRadius: 0,
        position: 'relative'  
      }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 4 }}>Staff Profile</Typography>
        
        <Box sx={{ 
          display: 'flex',
          alignItems: 'flex-start',
          mb: 0
        }}>
          <Avatar sx={{ width: 76, height: 76, bgcolor: '#1A2137', mr: 4 }}>
            {profileData.name ? profileData.name.charAt(0) : 'P'}
          </Avatar>
          
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, mb: 3 }}>
              <Box>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>Name</Typography>
                  <Typography variant="body1">{profileData.name}</Typography>
                </Box>
              </Box>
              
              <Box>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>Staff ID</Typography>
                  <Typography variant="body1">{profileData.staffId}</Typography>
                </Box>
              </Box>
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, mb: 3 }}>
              <Box>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>Department</Typography>
                  <Typography variant="body1">{profileData.department}</Typography>
                </Box>
              </Box>
              
              <Box>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>Position</Typography>
                  <Typography variant="body1">{profileData.position}</Typography>
                </Box>
              </Box>
            </Box>
            
            <Box>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>Email ID</Typography>
                <Typography variant="body1">{profileData.email}</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    );
  };

  // Render feedback section
  const renderFeedback = () => {
    console.log('Rendering feedback section, Redux questions:', questions);
    console.log('Rendering feedback section, local questions:', localQuestions);
    console.log('Questions loading state:', questionsLoading);
    console.log('Questions error state:', questionsError);
    
    // Use local questions instead of Redux state
    const currentQuestions = localQuestions.length > 0 ? localQuestions : (questions || []);
    
    console.log('Using questions for rendering:', currentQuestions);
    
    return (
    <Paper sx={{ p: 4, borderRadius: 0 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 4 }}>Submit Feedback</Typography>
      
      {questionsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : questionsError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {questionsError}
          <Button 
            size="small" 
            onClick={fetchQuestions} 
            sx={{ ml: 2 }}
          >
            Retry
          </Button>
        </Alert>
      ) : currentQuestions.length === 0 ? (
        <Alert severity="info">
          No feedback questions available for your department.
          <Button 
            size="small" 
            onClick={fetchQuestions} 
            sx={{ ml: 2 }}
          >
            Refresh Questions
          </Button>
        </Alert>
      ) : (
        <>
          {currentQuestions.map((question) => (
            <Box 
              key={question.id} 
              sx={{ 
                mb: 4,
                p: 3,
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: '#f5f5f5'
                }
              }}
            >
              <Typography 
                variant="body1" 
                gutterBottom
                sx={{ 
                  fontWeight: 500,
                  color: '#1A2137'
                }}
              >
                {question.text}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" color="textSecondary" sx={{ mr: 2 }}>
                  Your Rating:
              </Typography>
              <Rating
                name={`rating-${question.id}`}
                value={localRatings[question.id] || 0}
                onChange={(event, newValue) => handleRatingChange(question.id, newValue)}
                size="medium"
                precision={1}
                  sx={{ 
                    color: '#FFD700',
                    '& .MuiRating-iconFilled': {
                      color: '#FFD700'
                    }
                  }}
                />
              </Box>
            </Box>
          ))}
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button 
              variant="contained" 
              onClick={handleSubmitFeedback} 
              disabled={loading || currentQuestions.length === 0}
              sx={{ 
                bgcolor: '#1A2137', 
                '&:hover': { bgcolor: '#2A3147' },
                fontWeight: 'medium',
                px: 4,
                py: 1
              }}
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
  };

  // Render meeting schedule section
  const renderViewMeetingSchedule = () => {
    // Extract meetings from different sources in state to ensure we catch all meetings
    const allMeetings = [
      ...(meetings.pastMeetings || []),
      ...(meetings.currentMeetings || []),
      ...(meetings.futureMeetings || []),
      // Also try the nested meetings structure
      ...((meetings.meetings?.pastMeetings || [])),
      ...((meetings.meetings?.currentMeetings || [])), 
      ...((meetings.meetings?.futureMeetings || []))
    ];
    
    // Remove duplicates if any (by id)
    const uniqueMeetings = allMeetings.filter((meeting, index, self) =>
      index === self.findIndex((m) => m.id === meeting.id)
    );
    
    console.log('Staff Dashboard - renderViewMeetingSchedule: Current meetings state:', meetings);
    console.log('Staff Dashboard - renderViewMeetingSchedule: Combined allMeetings:', uniqueMeetings);

    return (
      <Paper sx={{ p: 4, borderRadius: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 4 }}>
          View Meeting Schedule
        </Typography>
        
        {meetings.loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {uniqueMeetings && uniqueMeetings.length > 0 ? (
              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {uniqueMeetings.map((meeting) => {
                      console.log('Staff Dashboard - renderViewMeetingSchedule: Rendering meeting:', meeting);
                      // Normalize meeting data
                      const meetingDate = meeting.meetingDate || meeting.date;
                      const formattedDate = meetingDate 
                        ? new Date(meetingDate).toLocaleDateString() 
                        : 'Not specified';
                      
                      // Get department name
                      const departmentName = meeting.department?.name || 
                        (typeof meeting.department === 'string' ? meeting.department : null) ||
                        getDepartmentNameById(meeting.departmentId) || 
                        'Not specified';
              
              return (
                        <TableRow 
                          key={meeting.id || Math.random().toString(36).substr(2, 9)}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell component="th" scope="row">
                        {meeting.title}
                          </TableCell>
                          <TableCell>{formattedDate}</TableCell>
                          <TableCell>{`${meeting.startTime || '00:00'} - ${meeting.endTime || '00:00'}`}</TableCell>
                          <TableCell>{departmentName}</TableCell>
                          <TableCell>
                            <Chip 
                              label={meeting.status || 'Scheduled'} 
                              size="small"
                              sx={{ 
                                bgcolor: 
                                  meeting.status === 'completed' ? '#e8f5e9' : 
                                  meeting.status === 'cancelled' ? '#ffebee' : 
                                  meeting.status === 'in-progress' ? '#fff3e0' : '#e3f2fd',
                                color: 
                                  meeting.status === 'completed' ? '#2e7d32' : 
                                  meeting.status === 'cancelled' ? '#c62828' : 
                                  meeting.status === 'in-progress' ? '#ef6c00' : '#0277bd',
                                textTransform: 'capitalize'
                              }} 
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outlined"
                              color="primary"
                              size="small"
                              onClick={() => handleFetchQuestions(meeting.id)}
                              startIcon={<FeedbackIcon />}
                            >
                              Feedback
                            </Button>
                          </TableCell>
                        </TableRow>
              );
            })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="textSecondary">
                  No meetings scheduled at this time.
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={() => fetchMeetingsDirectly()}
                  sx={{ mt: 2 }}
                >
                  Refresh Meetings
                </Button>
      </Box>
            )}
          </>
        )}
      </Paper>
    );
  };

  // Helper function to get department name by ID
  const getDepartmentNameById = (id) => {
    if (!id) return null;
    
    const departmentMap = {
      1: 'Computer Science and Engineering',
      2: 'Information Technology',
      3: 'Electronics and Communication',
      4: 'Electrical Engineering',
      5: 'Mechanical Engineering'
    };
    
    return departmentMap[id] || `Department ${id}`;
  };

  // Update sidebar click handler
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

  // Update tabs array
  const tabs = [
    { id: 0, label: "Profile", icon: <PersonIcon />, section: 'profile' },
    { id: 1, label: "View Meetings", icon: <EventIcon />, section: 'view-meetings' },
    { id: 2, label: "Submit Feedback", icon: <QuestionAnswerIcon />, section: 'submit-feedback' }
  ];

  // Render meeting timer section
  const renderMeetingTimer = () => {
    // Add a countdown timer effect
    const [countdown, setCountdown] = useState({
      minutes: nextMeeting?.minutesLeft || 0,
      seconds: nextMeeting?.secondsLeft || 0
    });
    
    // Initialize countdown from localStorage when component mounts
    useEffect(() => {
      try {
        // First try to get staff-specific timer data
        const storedStaffTimer = localStorage.getItem('staffNextMeetingData');
        console.log('Staff Dashboard: Looking for staff-specific timer data');
        
        if (storedStaffTimer) {
          const timerData = JSON.parse(storedStaffTimer);
          console.log('Staff Dashboard: Retrieved staff-specific timer data:', timerData);
          
          // Always recalculate time from original date if available
          if (timerData.originalDate) {
            const now = new Date();
            const meetingDate = new Date(timerData.originalDate + 'T' + (timerData.time || '00:00'));
            
            if (!isNaN(meetingDate.getTime())) {
              const diffMs = Math.max(0, meetingDate - now);
              const diffMins = Math.floor(diffMs / 60000);
              const diffSecs = Math.floor((diffMs % 60000) / 1000);
              
              console.log('Staff Dashboard: Recalculating timer from original date:', timerData.originalDate);
              console.log(`Staff Dashboard: Calculated ${diffMins}m ${diffSecs}s until meeting`);
              
              setCountdown({
                minutes: diffMins,
                seconds: diffSecs
              });
              
              // Update localStorage with fresh values
              const updatedTimer = {
                ...timerData,
                minutesLeft: diffMins,
                secondsLeft: diffSecs
              };
              localStorage.setItem('staffNextMeetingData', JSON.stringify(updatedTimer));
              
              console.log('Staff Dashboard: Updated staff timer: ', diffMins, 'minutes,', diffSecs, 'seconds');
              return;
            } else {
              console.log('Staff Dashboard: Invalid meeting date:', timerData.originalDate);
            }
          } else if (timerData.minutesLeft !== undefined && timerData.secondsLeft !== undefined) {
            // Fallback to stored values if we can't recalculate
            console.log('Staff Dashboard: No original date found, using stored countdown values');
            setCountdown({
              minutes: timerData.minutesLeft,
              seconds: timerData.secondsLeft
            });
            return;
          }
        } else {
          console.log('Staff Dashboard: No staff-specific timer data found');
        }
        
        // No valid staff timer found, try to rebuild it from meetings
        if (rebuildStaffTimerFromMeetings()) {
          console.log('Staff Dashboard: Successfully rebuilt timer from meetings data');
          return;
        }
        
        // Fallback to generic timer data only if necessary
        const storedTimer = localStorage.getItem('nextMeetingData');
        if (storedTimer) {
          const timerData = JSON.parse(storedTimer);
          console.log('Staff Dashboard: Checking generic timer data:', timerData);
          
          // Only use this data if it's for staff role
          if (timerData.role?.toLowerCase() === 'staff') {
            console.log('Staff Dashboard: Using generic timer data with staff role');
            
            // Always recalculate time from original date if available
            if (timerData.originalDate) {
              const now = new Date();
              const meetingDate = new Date(timerData.originalDate + 'T' + (timerData.time || '00:00'));
              
              if (!isNaN(meetingDate.getTime())) {
                const diffMs = Math.max(0, meetingDate - now);
                const diffMins = Math.floor(diffMs / 60000);
                const diffSecs = Math.floor((diffMs % 60000) / 1000);
                
                console.log('Staff Dashboard: Recalculating timer from generic data original date');
                console.log(`Staff Dashboard: Calculated ${diffMins}m ${diffSecs}s until meeting`);
                
                setCountdown({
                  minutes: diffMins,
                  seconds: diffSecs
                });
                
                // Create staff-specific timer data
                const updatedTimer = {
                  ...timerData,
                  minutesLeft: diffMins,
                  secondsLeft: diffSecs
                };
                localStorage.setItem('staffNextMeetingData', JSON.stringify(updatedTimer));
                
                console.log('Staff Dashboard: Created staff timer from generic data');
                return;
              } else if (timerData.minutesLeft !== undefined && timerData.secondsLeft !== undefined) {
                // Fallback to stored values if we can't recalculate
                console.log('Staff Dashboard: No original date in generic data, using stored values');
                setCountdown({
                  minutes: timerData.minutesLeft,
                  seconds: timerData.secondsLeft
                });
              }
            } else {
              console.log('Staff Dashboard: Generic timer is not for staff role:', timerData.role);
            }
          } else {
            console.log('Staff Dashboard: Generic timer is not for staff role:', timerData.role);
          }
        }
      } catch (error) {
        console.error('Staff Dashboard: Error initializing countdown from localStorage:', error);
      }
    }, []);
    
    // Keep the timer running
    useEffect(() => {
      if (!countdown || (countdown.minutes === 0 && countdown.seconds === 0)) {
        return; // Don't start timer if no valid countdown
      }
      
      console.log('Staff Dashboard: Starting countdown timer with values:', countdown);
      
      // Set up the interval to update every second
      const timer = setInterval(() => {
        setCountdown(prev => {
          // Calculate new values
          let newSeconds = prev.seconds - 1;
          let newMinutes = prev.minutes;
          
          if (newSeconds < 0) {
            newSeconds = 59;
            newMinutes = newMinutes - 1;
          }
          
          // Don't go below zero
          if (newMinutes < 0) {
            newMinutes = 0;
            newSeconds = 0;
            clearInterval(timer);
          }
          
          // Update localStorage with current values
          try {
            // Update both generic and staff-specific timer data
            const storedStaffTimer = localStorage.getItem('staffNextMeetingData');
            if (storedStaffTimer) {
              const timerData = JSON.parse(storedStaffTimer);
              const updatedTimer = {
                ...timerData,
                minutesLeft: newMinutes,
                secondsLeft: newSeconds
              };
              localStorage.setItem('staffNextMeetingData', JSON.stringify(updatedTimer));
            }
            
            // Also update the generic timer for backwards compatibility
            const storedGenericTimer = localStorage.getItem('nextMeetingData');
            if (storedGenericTimer) {
              const timerData = JSON.parse(storedGenericTimer);
              // Only update if it's a staff timer
              if (timerData.role?.toLowerCase() === 'staff') {
                const updatedTimer = {
                  ...timerData,
                  minutesLeft: newMinutes,
                  secondsLeft: newSeconds
                };
                localStorage.setItem('nextMeetingData', JSON.stringify(updatedTimer));
              }
            }
          } catch (error) {
            console.error('Staff Dashboard: Error updating timer in localStorage:', error);
          }
          
          return { minutes: newMinutes, seconds: newSeconds };
        });
      }, 1000);
      
      // Clean up when component unmounts
      return () => {
        clearInterval(timer);
      };
    }, [countdown]);
    
    // Get meeting details from localStorage if not available from Redux
    const meetingDetails = React.useMemo(() => {
      if (nextMeeting?.date && nextMeeting?.time) {
        return nextMeeting;
      }
      
      try {
        // First try staff-specific timer data
        const storedStaffTimer = localStorage.getItem('staffNextMeetingData');
        if (storedStaffTimer) {
          const timerData = JSON.parse(storedStaffTimer);
          console.log('Staff Dashboard: Using staff-specific meeting details:', timerData);
          if (timerData.date && timerData.time) {
            return timerData;
          }
        }
        
        // Fallback to generic timer data only if it's for staff
        const storedTimer = localStorage.getItem('nextMeetingData');
        if (storedTimer) {
          const timerData = JSON.parse(storedTimer);
          if (timerData.role?.toLowerCase() === 'staff' && timerData.date && timerData.time) {
            console.log('Staff Dashboard: Using generic meeting data with staff role');
            return timerData;
          }
        }
      } catch (e) {
        console.error('Staff Dashboard: Error getting meeting details from localStorage:', e);
      }
      
      return null;
    }, [nextMeeting]);
    
    // Debug function to rebuild timer from localStorage
    const rebuildStaffTimerFromMeetings = () => {
      try {
        // Check for staff meetings in localStorage and create a timer if found
        const storedMeetings = localStorage.getItem('submittedMeetings');
        if (storedMeetings) {
          const parsedMeetings = JSON.parse(storedMeetings);
          console.log('Staff Dashboard: Checking submittedMeetings for staff meetings:', parsedMeetings.length);
          
          // Filter for staff meetings only
          const staffMeetings = parsedMeetings.filter(m => 
            (m.role || '').toLowerCase() === 'staff'
          );
          
          console.log(`Staff Dashboard: Found ${staffMeetings.length} staff meetings out of ${parsedMeetings.length} total`);
          
          if (staffMeetings.length > 0) {
            // Find next upcoming staff meeting
            const now = new Date();
            const upcomingStaffMeetings = staffMeetings
              .filter(m => {
                // Handle both date formats
                const meetingDate = new Date(m.date || m.meetingDate || '');
                return !isNaN(meetingDate.getTime()) && meetingDate > now;
              })
              .sort((a, b) => {
                const dateA = new Date(a.date || a.meetingDate || '');
                const dateB = new Date(b.date || b.meetingDate || '');
                return dateA - dateB;
              });
            
            if (upcomingStaffMeetings.length > 0) {
              const nextStaffMeeting = upcomingStaffMeetings[0];
              const meetingDate = new Date(nextStaffMeeting.date || nextStaffMeeting.meetingDate || '');
              const meetingTime = nextStaffMeeting.startTime || '00:00';
              
              // Add time component to date
              const [hours, minutes] = meetingTime.split(':').map(Number);
              meetingDate.setHours(hours || 0, minutes || 0, 0, 0);
              
              // Calculate countdown
              const diffMs = Math.max(0, meetingDate - now);
              const diffMins = Math.floor(diffMs / 60000);
              const diffSecs = Math.floor((diffMs % 60000) / 1000);
              
              // Create new timer data
              const nextStaffMeetingData = {
                id: nextStaffMeeting.id,
                title: nextStaffMeeting.title,
                date: meetingDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                time: meetingTime,
                minutesLeft: diffMins,
                secondsLeft: diffSecs,
                originalDate: nextStaffMeeting.date || nextStaffMeeting.meetingDate,
                department: nextStaffMeeting.department || nextStaffMeeting.departmentId,
                role: 'staff'
              };
              
              // Set countdown and store timer data
              setCountdown({
                minutes: diffMins,
                seconds: diffSecs
              });
              
              localStorage.setItem('staffNextMeetingData', JSON.stringify(nextStaffMeetingData));
              
              dispatch(showSnackbar({
                message: `Timer created for next staff meeting: ${nextStaffMeeting.title}`,
                severity: 'success'
              }));
              return true;
            }
          }
          
          dispatch(showSnackbar({
            message: 'No upcoming staff meetings found',
            severity: 'info'
          }));
          return false;
        }
        return false;
      } catch (error) {
        console.error('Staff Dashboard: Error rebuilding timer from meetings:', error);
        return false;
      }
    };

    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Meeting Timer
        </Typography>
        
        {meetingDetails ? (
          <Typography variant="body1">
            {`Next meeting: ${meetingDetails.title} at ${meetingDetails.date} ${meetingDetails.time}`}
          </Typography>
        ) : (
          <Typography variant="body1" sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>
            No upcoming meeting scheduled.
          </Typography>
        )}
      </Box>
    );
  };

  // Main content
  const renderMainContent = () => {
    console.log('Rendering main content for section:', activeSection);
    
    switch(activeSection) {
      case 'profile':
        return renderProfile();
      case 'view-meetings':
        return renderViewMeetingSchedule();
      case 'submit-feedback':
        return renderFeedback();
      case 'meeting-timer':
        return renderMeetingTimer();
      default:
        return renderProfile();
    }
  }

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar */}
      <Box 
        sx={{
          width: 240,
          bgcolor: '#1A2137',
          color: 'white',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 1
        }}
      >
        <Box sx={{ p: 3, pb: 2, bgcolor: '#2A3147' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FFFFFF' }}>
            Staff Dashboard
          </Typography>
        </Box>
        
        <List sx={{ p: 0 }}>
          {tabs.map((tab) => (
            <ListItem 
              key={tab.id}
              button 
              onClick={() => handleSectionChange(tab.section)}
              sx={{ 
                py: 2, 
                pl: 3,
                bgcolor: activeSection === tab.section ? '#2A3147' : 'transparent',
                '&:hover': { bgcolor: '#2A3147' }
              }}
            >
              <ListItemIcon sx={{ color: '#FFFFFF', minWidth: 30 }}>
                {tab.icon}
              </ListItemIcon>
              <ListItemText primary={tab.label} sx={{ color: '#FFFFFF' }} />
            </ListItem>
          ))}
        </List>
        
        <Box sx={{ position: 'absolute', bottom: 0, width: '100%' }}>
          <ListItem 
            button 
            onClick={handleLogout}
            sx={{ 
              py: 2, 
              pl: 3,
              '&:hover': { bgcolor: '#2A3147' }
            }}
          >
            <ListItemIcon sx={{ color: '#FFFFFF', minWidth: 30 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" sx={{ color: '#FFFFFF' }} />
          </ListItem>
        </Box>
      </Box>

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
