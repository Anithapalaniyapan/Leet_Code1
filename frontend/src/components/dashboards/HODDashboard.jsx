import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Snackbar,
  Alert,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Chip,
  Tooltip,
  Modal,
  Fade,
  IconButton,
  Backdrop,
  CircularProgress
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import DescriptionIcon from '@mui/icons-material/Description';
import LogoutIcon from '@mui/icons-material/Logout';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CloseIcon from '@mui/icons-material/Close';

const HODDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [userProfile, setUserProfile] = useState({
    name: '',
    position: 'Head of Department',
    email: '',
    department: '',
    departmentId: ''
  });
  const [meetings, setMeetings] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // New state for handling meeting-specific questions
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetingQuestions, setMeetingQuestions] = useState([]);
  const [openQuestionModal, setOpenQuestionModal] = useState(false);
  const [respondedMeetings, setRespondedMeetings] = useState([]);

  // Define sidebar tabs
  const tabs = [
    { id: 'profile', label: "Profile", icon: <PersonIcon /> },
    { id: 'meetings', label: "Meeting Schedule", icon: <EventIcon /> },
    { id: 'minutes', label: "Minutes of Meetings", icon: <DescriptionIcon /> }
  ];

  // Helper function to get role name from roleId - updated to handle different formats
  const getRoleName = (role) => {
    // Add debugging 
    console.log('HOD Dashboard - Role conversion debug:', { 
      role, 
      type: typeof role 
    });
    
    // Handle numeric role values
    if (role === 1 || role === '1') {
      return 'Student';
    } else if (role === 2 || role === '2') {
      return 'Staff';
    } else if (role === 3 || role === '3') {
      return 'HOD';
    } else if (role === 4 || role === '4') {
      return 'Director';
    }
    
    // Handle string values
    if (typeof role === 'string') {
      const roleStr = role.toLowerCase();
      if (roleStr === 'student' || roleStr.includes('student')) {
        return 'Student';
      } else if (roleStr === 'staff' || roleStr.includes('staff') || roleStr.includes('faculty')) {
        return 'Staff';
      } else if (roleStr === 'hod' || roleStr.includes('hod') || roleStr.includes('head')) {
        return 'HOD';
      } else if (roleStr === 'director' || roleStr.includes('director') || roleStr.includes('academic director')) {
        return 'Director';
      }
    }
    
    // Default case
    return 'All Roles';
  };

  // Helper function to get role ID from any role format
  const getRoleId = (meeting) => {
    // Check for direct roleId property first
    if (meeting.roleId) {
      return meeting.roleId;
    }
    
    // Then check role property
    if (meeting.role !== undefined) {
      // If it's a number, return it
      if (typeof meeting.role === 'number') {
        return meeting.role;
      }
      
      // If it's a string, convert appropriately
      if (typeof meeting.role === 'string') {
        const roleStr = meeting.role.toLowerCase();
        if (roleStr === 'student' || roleStr.includes('student') || roleStr === '1') {
          return 1;
        } else if (roleStr === 'staff' || roleStr.includes('staff') || roleStr === '2') {
          return 2;
        } else if (roleStr === 'hod' || roleStr.includes('hod') || roleStr === '3') {
          return 3;
        } else if (roleStr === 'director' || roleStr.includes('director') || roleStr === '4') {
          return 4;
        }
      }
    }
    
    // Default
    return 0;
  };

  // Helper function to format time in 12-hour format with AM/PM
  const formatTimeWithAMPM = (timeString) => {
    if (!timeString) return '';
    
    // If already includes AM/PM, return as is
    if (timeString.includes('AM') || timeString.includes('PM') || 
        timeString.includes('am') || timeString.includes('pm')) {
      return timeString;
    }
    
    // Parse the time string (expected format: "HH:MM" or "HH:MM:SS")
    const timeParts = timeString.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    
    if (isNaN(hours) || isNaN(minutes)) return timeString;
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Fetch meetings for HOD's department
  const fetchMeetings = async (deptId) => {
    try {
      const token = localStorage.getItem('token');
      const departmentId = deptId || userProfile.departmentId;
      
      console.log('Fetching meetings for department:', {
        departmentId,
        token: token ? 'Present' : 'Missing'
      });

      if (!departmentId) {
        throw new Error('Department ID is missing');
      }

      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Make the API call with specific fields we want to retrieve
      const response = await axios({
        method: 'get',
        url: `http://localhost:8080/api/meetings/department/${departmentId}`,
        headers: { 
          'x-access-token': token
        },
        params: {
          fields: 'id,title,description,meetingDate,startTime,endTime,location,status,departmentId,year'
        }
      });

      console.log('Raw API Response:', {
        status: response.status,
        data: response.data
      });

      if (!response.data) {
        throw new Error('No data received from server');
      }

      // Ensure we're working with an array
      const meetingsArray = Array.isArray(response.data) ? response.data : [];
      
      // Sort meetings by meetingDate
      const sortedMeetings = meetingsArray.sort((a, b) => {
        const dateA = a.meetingDate ? new Date(a.meetingDate) : new Date(0);
        const dateB = b.meetingDate ? new Date(b.meetingDate) : new Date(0);
        return dateB - dateA; // Most recent first
      });

      console.log('Processed meetings:', sortedMeetings);
      setMeetings(sortedMeetings);

      if (sortedMeetings.length === 0) {
        setSnackbar({
          open: true,
          message: 'No meetings found for your department',
          severity: 'info'
        });
      } else {
        setSnackbar({
          open: true,
          message: `Successfully loaded ${sortedMeetings.length} meetings`,
          severity: 'success'
        });
      }

    } catch (error) {
      console.error('Meeting fetch error:', {
        name: error.name,
        message: error.message,
        response: {
          status: error.response?.status,
          data: error.response?.data,
          message: error.response?.data?.message
        },
        stack: error.stack
      });

      let errorMessage;
      
      if (error.message === 'Department ID is missing') {
        errorMessage = 'Department ID is not available. Please contact administrator.';
      } else if (error.message === 'Authentication token not found') {
        errorMessage = 'Please login again to continue.';
        navigate('/login');
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.response?.status === 500) {
        // Log the detailed error for debugging
        console.error('Server Error Details:', {
          error: error.response?.data,
          message: error.response?.data?.message,
          stack: error.response?.data?.stack
        });
        errorMessage = 'Unable to fetch meetings. Please try again later.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        navigate('/login');
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to view these meetings.';
      } else if (error.response?.status === 404) {
        errorMessage = 'No meetings found for your department.';
      } else {
        errorMessage = 'Unable to load meetings. Please try again later.';
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  // Fetch questions for HOD's department
  const fetchQuestions = async (deptId) => {
    try {
      const token = localStorage.getItem('token');
      const departmentId = deptId || userProfile.departmentId;
      
      console.log('Fetching questions for department:', departmentId);

      if (!departmentId) {
        console.error('Department ID not available');
        return;
      }

      const response = await axios.get(`http://localhost:8080/api/questions/department/${departmentId}`, {
        headers: { 
          'x-access-token': token 
        },
        params: {
          role: 'hod'
        }
      });

      if (response.data) {
        console.log('Questions fetched:', response.data);
        setQuestions(response.data);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load questions. Please try again later.',
        severity: 'error'
      });
    }
  };

  // New function to fetch questions for a specific meeting
  const fetchMeetingQuestions = async (meetingId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`http://localhost:8080/api/questions/meeting/${meetingId}`, {
        headers: { 
          'x-access-token': token 
        },
        params: {
          role: 'hod'
        }
      });

      if (response.data) {
        console.log('Meeting questions fetched:', response.data);
        setMeetingQuestions(response.data);
        setOpenQuestionModal(true);
      }
    } catch (error) {
      console.error('Error fetching meeting questions:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load meeting questions. Please try again later.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('http://localhost:8080/api/auth/verify', {
          headers: {
            'x-access-token': token
          }
        });

        console.log('Auth verify response:', response.data); // Debug log

        if (!response.data.valid) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }

        const userData = response.data.user;
        
        if (!userData.department?.id) {
          setSnackbar({
            open: true,
            message: 'Department not assigned. Please contact administrator.',
            severity: 'error'
          });
          return;
        }

        // Set user profile data first
        const profileData = {
          name: userData.fullName || userData.name || '',
          email: userData.email || '',
          position: 'Head of Department',
          department: userData.department?.name || '',
          departmentId: userData.department?.id
        };

        console.log('Setting profile data:', profileData); // Debug log
        setUserProfile(profileData);

        // Then fetch data using the department ID directly from userData
        await Promise.all([
          fetchMeetings(userData.department.id),
          fetchQuestions(userData.department.id)
        ]);

      } catch (error) {
        console.error('Authentication error:', error);
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Authentication failed',
          severity: 'error'
        });
      } finally {
        setLoading(false);
        setPageLoading(false); // Set page loading to false after initialization
      }
    };

    checkAuth();
  }, [navigate]);

  // Handle response submission
  const handleResponseSubmit = async (questionId, skipSnackbar = false) => {
    try {
      if (!skipSnackbar) {
      setLoading(true);
      }
      
      const token = localStorage.getItem('token');
      const meetingId = selectedMeeting?.id;
      
      console.log(`Submitting response for questionId=${questionId}, meetingId=${meetingId}`);
      
      // Make the API call to submit the response
      const submitResponse = await axios.post('http://localhost:8080/api/responses', {
        questionId,
        response: responses[questionId],
        departmentId: userProfile.departmentId,
        meetingId, // Add meeting ID to the response
        role: 'hod'
      }, {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response submission result:', submitResponse.data);

      // If this is not part of a batch submission, handle the UI updates
      if (!skipSnackbar && meetingId) {
        console.log(`Updating responded meetings to include meetingId=${meetingId}`);
        
        // Update local state ensuring no duplicates
        setRespondedMeetings(prev => {
          if (!prev.includes(meetingId)) {
            const updatedList = [...prev, meetingId];
            console.log('Updated responded meetings list:', updatedList);
            return updatedList;
          }
          return prev;
        });
        
        // Store in localStorage for persistence, avoiding duplicates
        const storedResponses = JSON.parse(localStorage.getItem('hodRespondedMeetings') || '[]');
        if (!storedResponses.includes(meetingId)) {
          const updatedStoredResponses = [...storedResponses, meetingId];
          localStorage.setItem('hodRespondedMeetings', JSON.stringify(updatedStoredResponses));
          console.log('Updated localStorage responded meetings:', updatedStoredResponses);
        }
        
        // Also make an API call to mark the meeting as responded by this HOD
        try {
          await axios.post(`http://localhost:8080/api/meetings/${meetingId}/hod-response`, {
            departmentId: userProfile.departmentId
          }, {
            headers: { 'x-access-token': token }
          });
          console.log(`Meeting ${meetingId} marked as responded by HOD on server`);
        } catch (markError) {
          console.error('Error marking meeting as responded:', markError);
        }
      }

      if (!skipSnackbar) {
      setSnackbar({
        open: true,
        message: 'Response submitted successfully',
        severity: 'success'
      });

        // Close the modal
        setOpenQuestionModal(false);
        
        // Show loading animation temporarily to refresh data
        setPageLoading(true);
        
        // Refresh data
        await fetchMeetings(userProfile.departmentId);
        
        // Reload responded meetings from server for accuracy
        try {
          if (token && userProfile.departmentId) {
            const response = await axios.get(`http://localhost:8080/api/responses/hod/${userProfile.departmentId}`, {
              headers: { 'x-access-token': token }
            });
            
            if (response.data && Array.isArray(response.data)) {
              const serverRespondedMeetings = response.data
                .filter(r => r.meetingId)
                .map(r => r.meetingId);
                
              console.log('Server responded meetings after submission:', serverRespondedMeetings);
                
              // Update local state with server data
              setRespondedMeetings(prev => {
                const newResponseList = [...new Set([...prev, ...serverRespondedMeetings])];
                // Update localStorage
                localStorage.setItem('hodRespondedMeetings', JSON.stringify(newResponseList));
                console.log('Final responded meetings after submission:', newResponseList);
                return newResponseList;
              });
            }
          }
        } catch (error) {
          console.error('Error reloading responses after submission:', error);
        }
        
        // Hide loading after a short delay for smoother UI
        setTimeout(() => {
          setPageLoading(false);
        }, 800);
      }

      // Success result for Promise.all 
      return true;
    } catch (error) {
      console.error('Error submitting response:', error);
      
      if (!skipSnackbar) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to submit response',
        severity: 'error'
      });
        setPageLoading(false);
      }
      
      // Fail result for Promise.all
      return false;
    } finally {
      if (!skipSnackbar) {
      setLoading(false);
      }
    }
  };

  // Function to handle "Action Taken" button click
  const handleActionTaken = (meeting) => {
    setSelectedMeeting(meeting);
    fetchMeetingQuestions(meeting.id);
  };

  // Load responded meetings from localStorage
  useEffect(() => {
    const loadRespondedMeetings = async () => {
      try {
        // Get from localStorage first for immediate display
        const storedResponses = JSON.parse(localStorage.getItem('hodRespondedMeetings') || '[]');
        setRespondedMeetings(storedResponses);
        
        // Then fetch from server to ensure data is up-to-date
        const token = localStorage.getItem('token');
        if (token && userProfile.departmentId) {
          console.log('Fetching HOD responses from server for department ID:', userProfile.departmentId);
          const response = await axios.get(`http://localhost:8080/api/responses/hod/${userProfile.departmentId}`, {
            headers: { 'x-access-token': token }
          });
          
          // If we have response data, extract meeting IDs
          if (response.data && Array.isArray(response.data)) {
            console.log('Server responded meetings data:', response.data);
            const serverRespondedMeetings = response.data
              .filter(r => r.meetingId)
              .map(r => r.meetingId);
              
            console.log('Responded meetings from server:', serverRespondedMeetings);
            
            // Combine with localStorage and remove duplicates
            const allResponded = [...new Set([...storedResponses, ...serverRespondedMeetings])];
            
            // Update localStorage for future reference
            localStorage.setItem('hodRespondedMeetings', JSON.stringify(allResponded));
            
            // Update state
            setRespondedMeetings(allResponded);
            console.log('Updated responded meetings list:', allResponded);
          }
        }
      } catch (error) {
        console.error('Error loading responded meetings:', error);
        // Fall back to localStorage only
        const storedResponses = JSON.parse(localStorage.getItem('hodRespondedMeetings') || '[]');
        setRespondedMeetings(storedResponses);
      }
    };
    
    // Only run this effect if we have a departmentId
    if (userProfile.departmentId) {
      loadRespondedMeetings();
    }
  }, [userProfile.departmentId]);

  // Effect to periodically refetch responded meetings from server
  useEffect(() => {
    // Skip if no department ID available
    if (!userProfile.departmentId) return;
    
    // Function to refresh data from server
    const refreshRespondedMeetings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        console.log(`Refreshing HOD responses for department ID: ${userProfile.departmentId}`);
        
        const response = await axios.get(`http://localhost:8080/api/responses/hod/${userProfile.departmentId}`, {
          headers: { 'x-access-token': token },
          timeout: 5000 // Add timeout to prevent long-hanging requests
        });
        
        // Ensure we get a valid array of meeting IDs
        if (response.data && Array.isArray(response.data)) {
          console.log(`Received ${response.data.length} meeting responses from server`);
          
          // Extract meeting IDs, ensuring we handle different response formats
          const serverRespondedMeetings = response.data
            .filter(r => r && (r.meetingId || typeof r === 'number'))
            .map(r => typeof r === 'number' ? r : r.meetingId);
          
          console.log('Extracted meeting IDs:', serverRespondedMeetings);
          
          if (serverRespondedMeetings.length > 0) {
            // Get current stored responses
            const storedResponses = JSON.parse(localStorage.getItem('hodRespondedMeetings') || '[]');
            
            // Combine both lists and remove duplicates
            const allResponded = [...new Set([...storedResponses, ...serverRespondedMeetings])];
            
            // Update localStorage
            localStorage.setItem('hodRespondedMeetings', JSON.stringify(allResponded));
            
            // Update state if different
            if (JSON.stringify(allResponded) !== JSON.stringify(respondedMeetings)) {
              setRespondedMeetings(allResponded);
              console.log('Responded meetings refreshed from server:', allResponded);
            }
          }
        } else {
          console.log('Server returned empty or invalid response data:', response.data);
        }
      } catch (error) {
        console.error('Error refreshing responded meetings:', error);
        
        // Only show error message if it's not a timeout and it's a serious error
        if (error.code !== 'ECONNABORTED' && (!error.response || error.response.status >= 500)) {
          // Don't show snackbar for common errors or timeouts to avoid spamming the user
          // Instead, just rely on localStorage data if API fails
          
          // Fallback to localStorage data
          const storedResponses = JSON.parse(localStorage.getItem('hodRespondedMeetings') || '[]');
          if (JSON.stringify(storedResponses) !== JSON.stringify(respondedMeetings)) {
            setRespondedMeetings(storedResponses);
          }
        }
      }
    };
    
    // Initial fetch
    refreshRespondedMeetings();
    
    // Set interval for periodic refresh - increase to 60 seconds to reduce server load
    const intervalId = setInterval(refreshRespondedMeetings, 60000); // 60 seconds
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [userProfile.departmentId, respondedMeetings]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Handle modal close
  const handleCloseModal = () => {
    setOpenQuestionModal(false);
    setSelectedMeeting(null);
    setMeetingQuestions([]);
  };

  // Render profile section with improved UI
  const renderProfile = () => (
    <Paper sx={{ 
      p: 4, 
      borderRadius: 2, 
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      background: 'linear-gradient(to right bottom, #ffffff, #f8f9fa)'
    }}>
      <Typography variant="h5" sx={{ 
        fontWeight: 'bold', 
        mb: 4, 
        color: '#1A2137',
        borderBottom: '2px solid #3f51b5',
        pb: 1
      }}>
        HOD Profile
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0 }}>
        <Avatar sx={{ 
          width: 100, 
          height: 100, 
          bgcolor: 'linear-gradient(135deg, #1A2137 0%, #3f51b5 100%)', 
          mr: 4,
          boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
        }}>
          {userProfile.name ? userProfile.name.charAt(0) : 'H'}
        </Avatar>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3, background: '#f8f9fa', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#666', mb: 0.5 }}>Name</Typography>
              <Typography variant="h6">{userProfile.name || 'Not specified'}</Typography>
            </Box>
            
            <Box sx={{ mb: 3, background: '#f8f9fa', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#666', mb: 0.5 }}>Position</Typography>
              <Typography variant="h6">{userProfile.position}</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3, background: '#f8f9fa', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#666', mb: 0.5 }}>Email</Typography>
              <Typography variant="h6">{userProfile.email || 'Not specified'}</Typography>
            </Box>
            
            <Box sx={{ background: '#f8f9fa', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#666', mb: 0.5 }}>Department</Typography>
              <Typography variant="h6">{userProfile.department || 'Not specified'}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );

  // Render meetings section with improved UI and Action Taken column
  const renderMeetings = () => (
    <Paper sx={{ 
      p: { xs: 2, sm: 4 }, 
      borderRadius: 2, 
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      background: 'linear-gradient(to right bottom, #ffffff, #f8f9fa)'
    }}>
      <Typography variant="h5" sx={{ 
        fontWeight: 'bold', 
        mb: 3, 
        color: '#1A2137',
        borderBottom: '2px solid #3f51b5',
        pb: 1
      }}>
        Meeting Schedule
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'none' }}></Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
          <Button 
            size="small" 
            onClick={() => fetchMeetings(userProfile.departmentId)} 
            sx={{ ml: 2 }}
          >
            Retry
          </Button>
        </Alert>
      ) : meetings.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          No meetings scheduled for your department.
        </Alert>
      ) : (
        <Grid container spacing={2}>
              {meetings.map((meeting) => (
            <Grid item xs={12} sm={6} md={4} key={meeting.id}>
              <Card 
                        sx={{
                  height: '100%',
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: 2,
                          overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                    transform: 'translateY(-5px)'
                  },
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  position: 'relative'
                }}
              >
                <Box 
                  sx={{
                    p: 2,
                    bgcolor: meeting.status === 'Completed' ? '#e8f5e9' : 
                             meeting.status === 'Cancelled' ? '#ffebee' :
                             meeting.status === 'Postponed' ? '#fff8e1' : '#e3f2fd',
                    borderBottom: '1px solid rgba(0,0,0,0.08)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mr: 1 }}>
                      {meeting.title || 'Untitled Meeting'}
                      </Typography>
                    <Chip
                      label={getRoleName(meeting.role || meeting.roleId)}
                      color={
                        getRoleId(meeting) === 1 ? 'primary' :
                        getRoleId(meeting) === 2 ? 'secondary' :
                        getRoleId(meeting) === 3 ? 'success' :
                        getRoleId(meeting) === 4 ? 'warning' : 'default'
                      }
                      size="small"
                      sx={{ minWidth: 80, '& .MuiChip-label': { px: 1 } }}
                    />
                  </Box>
                </Box>
                
                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <EventIcon color="action" fontSize="small" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Meeting Date & Time
                        </Typography>
                        <Typography variant="body1">
                          {meeting.meetingDate ? 
                            new Date(meeting.meetingDate).toLocaleDateString() : 
                            'Not specified'}
                          {meeting.startTime && meeting.endTime && (
                            <Box component="span" sx={{ display: 'block' }}>
                              {`${formatTimeWithAMPM(meeting.startTime)} - ${formatTimeWithAMPM(meeting.endTime)}`}
                            </Box>
                          )}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <DescriptionIcon color="action" fontSize="small" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Description
                        </Typography>
                        <Tooltip title={meeting.description || 'No description available'}>
                          <Typography
                            variant="body1"
                      sx={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {meeting.description || 'No description'}
                          </Typography>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={meeting.department?.name || userProfile.department || 'Not specified'}
                      color="info"
                      size="small"
                        variant="outlined"
                      />
                      
                      {meeting.year && (
                        <Chip
                          label={`Year: ${meeting.year}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      
                    <Chip 
                      label={meeting.status || 'Scheduled'} 
                      color={
                        meeting.status === 'Completed' ? 'success' :
                        meeting.status === 'Cancelled' ? 'error' :
                        meeting.status === 'Postponed' ? 'warning' : 'primary'
                      }
                      size="small"
                      />
                    </Box>
                  </Box>
                </CardContent>
                
                <Box sx={{ p: 2, pt: 0, bgcolor: 'rgba(0,0,0,0.02)' }}>
                  {respondedMeetings.includes(meeting.id) ? (
                    <Button
                      fullWidth
                      variant="outlined"
                      color="success"
                      startIcon={<AssignmentTurnedInIcon />}
                      disabled
                      sx={{ borderRadius: 2 }}
                    >
                      Response Submitted
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleActionTaken(meeting)}
                      sx={{ 
                        bgcolor: '#3f51b5',
                        '&:hover': { bgcolor: '#2c3e9e' },
                        borderRadius: 2
                      }}
                    >
                      Provide Action
                    </Button>
                  )}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Question Modal for Action Taken */}
      <Modal
        open={openQuestionModal}
        onClose={handleCloseModal}
        closeAfterTransition
      >
        <Fade in={openQuestionModal}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '95%', sm: '90%', md: '80%' },
            maxWidth: 900,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: { xs: 2, sm: 3, md: 4 },
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: '#1A2137' }}>
                  {selectedMeeting?.title || 'Meeting Questions'}
                </Typography>
                {selectedMeeting && (
                  <Typography variant="subtitle2" color="text.secondary">
                    {selectedMeeting.meetingDate ? new Date(selectedMeeting.meetingDate).toLocaleDateString() : ''}
                    {selectedMeeting.startTime ? 
                      ` • ${formatTimeWithAMPM(selectedMeeting.startTime)} - ${formatTimeWithAMPM(selectedMeeting.endTime)}` : 
                      ''}
                  </Typography>
                )}
              </Box>
              <IconButton onClick={handleCloseModal} size="small" sx={{ bgcolor: '#f0f0f0' }}>
                <CloseIcon />
              </IconButton>
            </Box>
      
      {loading ? (
              <Box sx={{ display: 'none' }}></Box>
            ) : meetingQuestions.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                No questions available for this meeting.
              </Alert>
            ) : (
              <>
                <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
                  Please provide your responses to the following questions:
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  {meetingQuestions.map((question, index) => (
                    <Card 
                      sx={{ 
                        mb: 3, 
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
                        borderRadius: 2,
                        border: '1px solid rgba(0,0,0,0.05)'
                      }} 
                      key={question.id}
                    >
                <CardContent>
                        <Typography 
                          variant="subtitle2" 
                          color="text.secondary" 
                          gutterBottom
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <QuestionAnswerIcon fontSize="small" color="primary" />
                          Question {index + 1}
                    </Typography>
                        
                        <Typography 
                          variant="subtitle1" 
                          component="div" 
                          sx={{ 
                            mb: 3,
                            fontWeight: 'medium',
                            borderLeft: '3px solid #3f51b5',
                            pl: 2,
                            py: 0.5
                          }}
                        >
                          {question.text}
                  </Typography>

                  <TextField
                    fullWidth
                    multiline
                          rows={3}
                    label="Action Taken"
                          value={responses[question.id] || ''}
                    onChange={(e) => setResponses(prev => ({
                      ...prev,
                      [question.id]: e.target.value
                    }))}
                          placeholder="Describe the action taken for this issue..."
                          sx={{ 
                            mb: 1,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1.5
                            }
                          }}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={handleCloseModal}
                    sx={{ mr: 2, borderRadius: 2 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      // Check if all questions have responses
                      const allQuestionsAnswered = meetingQuestions.every(q => responses[q.id]?.trim());
                      if (!allQuestionsAnswered) {
                        setSnackbar({
                          open: true,
                          message: 'Please answer all questions before submitting',
                          severity: 'warning'
                        });
                        return;
                      }
                      
                      // Show loading animation
                      setPageLoading(true);
                      
                      // Submit all responses one by one
                      Promise.all(
                        meetingQuestions.map(q => handleResponseSubmit(q.id, true))
                      ).then(async (results) => {
                        // Add meeting to responded meetings list
                        if (selectedMeeting) {
                          // Update local state
                          setRespondedMeetings(prev => {
                            if (!prev.includes(selectedMeeting.id)) {
                              return [...prev, selectedMeeting.id];
                            }
                            return prev;
                          });
                          
                          // Store in localStorage for persistence
                          const storedResponses = JSON.parse(localStorage.getItem('hodRespondedMeetings') || '[]');
                          if (!storedResponses.includes(selectedMeeting.id)) {
                            localStorage.setItem('hodRespondedMeetings', 
                              JSON.stringify([...storedResponses, selectedMeeting.id]));
                          }
                        }
                        
                        // Close the modal
                        setOpenQuestionModal(false);
                        
                        // Success message
                        setSnackbar({
                          open: true,
                          message: 'All responses submitted successfully',
                          severity: 'success'
                        });
                        
                        // Refresh meetings data
                        await fetchMeetings(userProfile.departmentId);
                        
                        // Reload responded meetings from server
                        try {
                          const token = localStorage.getItem('token');
                          if (token && userProfile.departmentId) {
                            const response = await axios.get(`http://localhost:8080/api/responses/hod/${userProfile.departmentId}`, {
                              headers: { 'x-access-token': token }
                            });
                            
                            if (response.data && Array.isArray(response.data)) {
                              const serverRespondedMeetings = response.data
                                .filter(r => r.meetingId)
                                .map(r => r.meetingId);
                                
                              // Update local state with server data
                              setRespondedMeetings(prev => {
                                const newResponseList = [...new Set([...prev, ...serverRespondedMeetings])];
                                // Update localStorage
                                localStorage.setItem('hodRespondedMeetings', JSON.stringify(newResponseList));
                                return newResponseList;
                              });
                            }
                          }
                        } catch (error) {
                          console.error('Error reloading responses after submission:', error);
                        }
                        
                        // Hide loading after a short delay for better UX
                        setTimeout(() => {
                          setPageLoading(false);
                        }, 800);
                      }).catch(error => {
                        console.error('Error submitting responses:', error);
                        setSnackbar({
                          open: true,
                          message: 'Failed to submit responses. Please try again.',
                          severity: 'error'
                        });
                        setPageLoading(false);
                      });
                    }}
                    disabled={meetingQuestions.length === 0 || loading}
                    sx={{ 
                      bgcolor: '#3f51b5',
                      '&:hover': { bgcolor: '#2c3e9e' },
                      borderRadius: 2,
                      px: 3
                    }}
                  >
                    Submit All Responses
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Fade>
      </Modal>
    </Paper>
  );

  // Render minutes section with improved UI
  const renderMinutes = () => (
    <Paper sx={{ 
      p: 4, 
      borderRadius: 2, 
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      background: 'linear-gradient(to right bottom, #ffffff, #f8f9fa)'
    }}>
      <Typography variant="h5" sx={{ 
        fontWeight: 'bold', 
        mb: 4, 
        color: '#1A2137',
        borderBottom: '2px solid #3f51b5',
        pb: 1
      }}>
        Minutes of Meetings
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'none' }}></Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      ) : (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Card sx={{
            maxWidth: 600,
            mx: 'auto',
            p: 4,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            bgcolor: '#f0f7ff',
            border: '1px solid rgba(63, 81, 181, 0.2)'
          }}>
            <Box sx={{ mb: 2 }}>
              <AssignmentTurnedInIcon sx={{ fontSize: 60, color: '#3f51b5', mb: 2 }} />
            </Box>
            <Typography variant="h6" gutterBottom color="primary">
              Respond to Meeting Questions
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              To provide your responses to questions, please go to the <strong>Meeting Schedule</strong> tab and click the <strong>Provide Action</strong> button for the relevant meeting.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={() => setActiveSection('meetings')}
                sx={{ 
                  bgcolor: '#3f51b5',
                  '&:hover': { bgcolor: '#2c3e9e' },
                  px: 3,
                  borderRadius: 2
                }}
                startIcon={<EventIcon />}
              >
                Go to Meeting Schedule
              </Button>
            </Box>
          </Card>
          
          {respondedMeetings.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ 
                mb: 3, 
                color: '#1A2137',
                fontWeight: 'medium',
                borderBottom: '2px solid #3f51b5',
                pb: 1,
                display: 'flex',
                alignItems: 'center'
              }}>
                <AssignmentTurnedInIcon sx={{ mr: 1.5, color: '#3f51b5' }} />
                Your Responded Meetings
              </Typography>
              
              <Grid container spacing={2}>
                {meetings
                  .filter(meeting => respondedMeetings.includes(meeting.id))
                  .map((meeting) => (
                    <Grid item xs={12} sm={6} md={4} key={meeting.id}>
                      <Card 
                        sx={{
                          height: '100%',
                          display: 'flex', 
                          flexDirection: 'column',
                          borderRadius: 2,
                          overflow: 'hidden',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          position: 'relative',
                          border: '1px solid rgba(63, 81, 181, 0.12)',
                          '&:hover': {
                            boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                            transform: 'translateY(-3px)'
                          },
                        }}
                      >
                        <Box 
                          sx={{
                            p: 2,
                            bgcolor: '#e8f5e9',
                            borderBottom: '1px solid rgba(0,0,0,0.05)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {meeting.title || 'Untitled Meeting'}
                          </Typography>
                          <Chip 
                            label="Response Submitted" 
                            color="success"
                            size="small"
                            icon={<AssignmentTurnedInIcon />}
                            sx={{ '& .MuiChip-icon': { fontSize: '0.9rem' } }}
                          />
                        </Box>
                        
                        <CardContent sx={{ p: 2, flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <EventIcon color="action" fontSize="small" />
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  Meeting Date & Time
                      </Typography>
                      <Typography variant="body1">
                                  {meeting.meetingDate ? 
                                    new Date(meeting.meetingDate).toLocaleDateString() : 
                                    'Not specified'}
                                  {meeting.startTime && meeting.endTime && (
                                    <Box component="span" sx={{ display: 'block' }}>
                                      {`${formatTimeWithAMPM(meeting.startTime)} - ${formatTimeWithAMPM(meeting.endTime)}`}
                                    </Box>
                                  )}
                      </Typography>
                    </Box>
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                              <Chip
                                label={getRoleName(meeting.role || meeting.roleId)}
                                color={
                                  getRoleId(meeting) === 1 ? 'primary' :
                                  getRoleId(meeting) === 2 ? 'secondary' :
                                  getRoleId(meeting) === 3 ? 'success' :
                                  getRoleId(meeting) === 4 ? 'warning' : 'default'
                                }
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.75rem' }}
                              />
                              
                              <Chip
                                label={meeting.department?.name || userProfile.department || 'Not specified'}
                                color="info"
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.75rem' }}
                              />
                              
                              {meeting.year && (
                                <Chip
                                  label={`Year: ${meeting.year}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.75rem' }}
                                />
                              )}
                            </Box>
                          </Box>
                </CardContent>
                        
                        <Box sx={{ 
                          p: 1.5, 
                          pt: 0, 
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderTop: '1px solid rgba(0,0,0,0.05)',
                          bgcolor: 'rgba(0,0,0,0.01)'
                        }}>
                          <Typography variant="caption" color="text.secondary">
                            ID: {meeting.id}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              bgcolor: '#e8f5e9', 
                              px: 1, 
                              py: 0.5, 
                              borderRadius: 1,
                              color: '#2e7d32',
                              fontWeight: 'medium'
                            }}
                          >
                            Completed
                          </Typography>
                        </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar with improved UI */}
      <Box 
        sx={{
          width: 240,
          background: 'linear-gradient(180deg, #1A2137 0%, #2A3147 100%)',
          color: 'white',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 10,
          boxShadow: '2px 0 15px rgba(0,0,0,0.1)'
        }}
      >
        <Box sx={{ 
          p: 3, 
          pb: 2, 
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(90deg, #2A3147 0%, #3f51b5 100%)'
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 'bold', 
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center'
          }}>
            <QuestionAnswerIcon sx={{ mr: 1.5 }} />
            HOD Dashboard
          </Typography>
        </Box>
        
        <List sx={{ p: 0 }}>
          {tabs.map((tab) => (
            <ListItem 
              key={tab.id}
              button 
              onClick={() => setActiveSection(tab.id)}
              sx={{ 
                py: 2, 
                pl: 3,
                bgcolor: activeSection === tab.id ? 'rgba(63, 81, 181, 0.2)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(63, 81, 181, 0.1)' },
                transition: 'background-color 0.2s',
                borderLeft: activeSection === tab.id ? '4px solid #3f51b5' : '4px solid transparent'
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
              '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
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
          bgcolor: '#f0f3ff',
          ml: '240px',
          minHeight: '100vh',
          position: 'relative'
        }}
      >
        {/* Page loading UI */}
        {pageLoading && (
          <Fade in={pageLoading}>
            <Box sx={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              backgroundColor: 'rgba(63, 81, 181, 0.05)',
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
                    animation: 'rotate 1.5s linear infinite reverse'
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
                    HOD Dashboard
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Loading your dashboard...
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Fade>
        )}
        
        {activeSection === 'profile' && renderProfile()}
        {activeSection === 'meetings' && renderMeetings()}
        {activeSection === 'minutes' && renderMinutes()}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ 
              width: '100%',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)', 
              borderRadius: 2
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default HODDashboard; 