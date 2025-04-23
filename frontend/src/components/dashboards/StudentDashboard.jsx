import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API from '../../api/axiosConfig'; // Import the global API instance
import { useNavigate } from 'react-router-dom';
import {Box,Typography,Paper,Button,Grid,Rating,Avatar,Drawer,List,ListItem,ListItemIcon,ListItemText,Divider,Snackbar,Alert,Container,Card,CardContent,TableContainer,Table,TableHead,TableBody,TableRow,TableCell,Chip} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import FeedbackIcon from '@mui/icons-material/Feedback';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DescriptionIcon from '@mui/icons-material/Description';
import LogoutIcon from '@mui/icons-material/Logout';
import StarIcon from '@mui/icons-material/Star';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RefreshIcon from '@mui/icons-material/Refresh';
import CircularProgress from '@mui/material/CircularProgress';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [userProfile, setUserProfile] = useState({
    name: 'Sowmiya',
    department: 'Computer Science',
    sin: 'ST23456789',
    year: 'Third Year',
    email: 'john.doe@university.edu'
  });
  const [meetings, setMeetings] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [nextMeeting, setNextMeeting] = useState({
    date: 'January 25, 2026',
    time: '09:00 AM',
    minutesLeft: 45,
    secondsLeft: 30
  });
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState('');

  // Check authentication and role on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login');
      return;
    }
    
    // Normalize the user role for case-insensitive comparison
    const normalizedUserRole = (userRole || '').replace('ROLE_', '').toUpperCase();
    
    if (normalizedUserRole !== 'STUDENT') {
      console.log('User role is not STUDENT:', userRole, 'Normalized:', normalizedUserRole);
      setSnackbar({
        open: true,
        message: 'You do not have permission to access this dashboard',
        severity: 'error'
      });
      navigate('/login');
      return;
    }
    
    console.log('Student authorized, loading student dashboard...');
    
    // Store student role in localStorage for meeting filtering (lowercase for consistency with filtering logic)
    localStorage.setItem('userRole', 'student');
    
    setLoading(true); // Set loading state while data is being fetched
    fetchUserProfile();
    loadMeetingsFromStorage(); // First try to load from localStorage
    fetchMeetings(); // Then try to fetch from API as backup
  }, [navigate]);

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      console.log('Fetching user profile with token:', token.substring(0, 10) + '...');
      
      // First try to get user data from login response that might be stored in localStorage
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          const parsedUserData = JSON.parse(userData);
          console.log('Found stored user data:', parsedUserData);
          
          setUserProfile({
            name: parsedUserData.fullName || 'Priya',
            department: parsedUserData.department?.name || 'Information Technology',
            sin: parsedUserData.sinNumber || parsedUserData.username || 'E22IT039',
            year: parsedUserData.year ? `Year ${parsedUserData.year}` : 'Third Year',
            email: parsedUserData.email || 'e22it039@shanmugha.du.in'
          });
        } catch (e) {
          console.error('Error parsing stored user data:', e);
        }
      }
      
      // Still try the API call to ensure data is fresh
      console.log('Making API request to users/profile endpoint');
      
      // Use the global API instance with interceptors
      const response = await API.get('/users/profile');
      
      console.log('Profile API response received:', response.data);
      
      if (response.data && Object.keys(response.data).length > 0) {
        // Set user profile with data from backend using the field names from API documentation
        setUserProfile({
          name: response.data.fullName || 'John Doe',
          department: response.data.department?.name || 'Computer Science',
          sin: response.data.sinNumber || response.data.username || 'ST23456789',
          year: response.data.year ? `Year ${response.data.year}` : 'Third Year',
          email: response.data.email || 'john.doe@university.edu'
        });
        
        // Store the user data for future use
        localStorage.setItem('userData', JSON.stringify(response.data));
      } else {
        console.error('Empty profile data received from API');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      console.error('Error response:', error.response?.data);
      
      // Don't show error notification to user if we already loaded data from localStorage
      if (!localStorage.getItem('userData')) {
        setSnackbar({
          open: true,
          message: 'Unable to load profile from server. Using default values.',
          severity: 'warning'
        });
      }
    }
  };

  // Fetch meetings - defined outside useEffect to avoid recreating it on each render
  const fetchMeetings = async () => {
    setLoading(true);
    try {
      console.log('Fetching meetings for student dashboard');
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        throw new Error('No authentication token found');
      }
      
      // Use the new user-specific endpoint to get meetings filtered by role, department, and year
      try {
        const response = await axios.get('http://localhost:8080/api/meetings/user/current', {
          headers: {
            'x-access-token': token
          }
        });
        
        console.log('User-specific meetings API response:', response.data);
        
        if (response.data) {
          let meetingsData = [];
          
          // Extract past, current and future meetings
          if (response.data.pastMeetings) meetingsData.push(...response.data.pastMeetings);
          if (response.data.currentMeetings) meetingsData.push(...response.data.currentMeetings);
          if (response.data.futureMeetings) meetingsData.push(...response.data.futureMeetings);
          
          console.log('Processed student meetings:', meetingsData.length);
          
          if (meetingsData.length > 0) {
            // Save to localStorage
            localStorage.setItem('studentMeetings', JSON.stringify(meetingsData));
            setMeetings(meetingsData);
            
            // Find next upcoming meeting for timer
            setupMeetingTimer(meetingsData);
            return;
          }
        }
      } catch (userMeetingsError) {
        console.error('Failed to fetch user-specific meetings:', userMeetingsError);
        // Continue with fallback without showing errors to the user
      }
      
      // Fallback to all meetings endpoint and filter client-side
      try {
        const allMeetingsResponse = await axios.get('http://localhost:8080/api/meetings', {
          headers: {
            'x-access-token': token
          }
        });
        
        console.log('All meetings API response:', allMeetingsResponse.data);
        
        if (Array.isArray(allMeetingsResponse.data) && allMeetingsResponse.data.length > 0) {
          const meetingsData = allMeetingsResponse.data;
          
          // Filter for student meetings
          const userProfile = JSON.parse(localStorage.getItem('userData') || '{}');
          const studentDepartment = userProfile?.department?.id || userProfile?.departmentId;
            const studentYear = userProfile?.year;
            
          console.log('Filtering meetings for department:', studentDepartment, 'year:', studentYear);
          
          const filteredMeetings = meetingsData.filter(meeting => {
            // Filter by role (roleId = 1 for students)
            const roleMatch = meeting.roleId === 1;
            
            // Department match if specified
            const deptMatch = !studentDepartment || 
                           meeting.departmentId == studentDepartment;
            
            // Year match if specified
            const yearMatch = !studentYear || 
                           meeting.year == studentYear;
            
            return roleMatch && deptMatch && yearMatch;
          });
          
          console.log('Filtered student meetings:', filteredMeetings.length);
          
          // Save filtered meetings
          localStorage.setItem('studentMeetings', JSON.stringify(filteredMeetings));
          setMeetings(filteredMeetings);
          
          // Set up timer for next meeting
          setupMeetingTimer(filteredMeetings);
          return;
        }
      } catch (allMeetingsError) {
        console.error('Failed to fetch all meetings:', allMeetingsError);
        // Continue with fallback without showing errors
      }
      
      // If we get here, try loading from localStorage
      console.log('No meetings found from API, trying localStorage');
      const loadSuccess = loadMeetingsFromStorage();
      
      if (!loadSuccess) {
        console.log('No meetings found in storage, creating demo meeting');
        // Create a demo meeting for display
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const demoMeeting = {
          id: 'demo-' + Date.now(),
          title: 'Student Feedback Session',
          date: tomorrow.toISOString().split('T')[0],
          meetingDate: tomorrow.toISOString().split('T')[0],
          startTime: '10:00',
          endTime: '11:30',
          department: 'Computer Science',
          departmentId: 1,
          roleId: 1,
          year: 4
        };
        
        const demoMeetings = [demoMeeting];
        setMeetings(demoMeetings);
        localStorage.setItem('studentMeetings', JSON.stringify(demoMeetings));
        setupMeetingTimer(demoMeetings);
      }
    } catch (error) {
      console.error('Error in fetchMeetings:', error);
      // Silently fail - don't show errors to user
      loadMeetingsFromStorage();
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to set up meeting timer
  const setupMeetingTimer = (meetingsList) => {
    if (!Array.isArray(meetingsList) || meetingsList.length === 0) return;
    
    const now = new Date();
    const upcomingMeetings = meetingsList
      .filter(meeting => {
        const meetingDate = new Date(meeting.meetingDate || meeting.date);
        return !isNaN(meetingDate.getTime()) && meetingDate > now;
      })
      .sort((a, b) => {
        const dateA = new Date(a.meetingDate || a.date);
        const dateB = new Date(b.meetingDate || b.date);
        return dateA - dateB;
      });
    
    if (upcomingMeetings.length > 0) {
      setTimerFromMeeting(upcomingMeetings[0]);
    }
  };

  // Fetch meetings when component mounts
  useEffect(() => {
    // First, try to restore timer data from localStorage
    try {
      const storedTimerData = localStorage.getItem('nextMeetingData');
      if (storedTimerData) {
        const parsedTimerData = JSON.parse(storedTimerData);
        console.log('Restored timer data from localStorage:', parsedTimerData);
        
        // Check if the timer data is still valid (not in the past)
        if (parsedTimerData.minutesLeft > 0 || parsedTimerData.secondsLeft > 0) {
          setNextMeeting(parsedTimerData);
        } else {
          console.log('Stored timer data is expired (countdown is zero)');
        }
      }
    } catch (error) {
      console.error('Error restoring timer data from localStorage:', error);
    }
  }, []);

  // Add useEffect for fetching questions
  useEffect(() => {
    if (activeSection === 'feedback') {
      fetchQuestions();
    }
  }, [activeSection]);

  // Update fetchQuestions function
  const fetchQuestions = async () => {
    setQuestionsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const userData = JSON.parse(localStorage.getItem('userData')) || {};
      const departmentId = userData.departmentId || userData.department?.id || 5;
      const yearOfStudy = userData.year || 4;

      console.log('Fetching questions for department:', departmentId, 'year:', yearOfStudy);

      const response = await axios.get(
        `http://localhost:8080/api/questions/department/${departmentId}/year/${yearOfStudy}?role=student`,
        {
          headers: {
            'x-access-token': token
          }
        }
      );

      if (response.data && Array.isArray(response.data)) {
        console.log('Received questions:', response.data);
        setQuestions(response.data);
        
        // Initialize ratings state for new questions
        const newRatings = {};
        response.data.forEach(question => {
          newRatings[question.id] = 0;
        });
        setRatings(newRatings);
        
        setQuestionsError('');
      } else {
        setQuestions([]);
        setQuestionsError('No questions available for your year and department');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setQuestionsError('Failed to fetch questions. Please try again later.');
      setQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleRatingChange = (questionId, value) => {
    setRatings(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmitFeedback = async () => {
    try {
      // Validate that all questions have ratings
      const hasEmptyRatings = Object.values(ratings).some(rating => rating === 0);
      
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
        
        // Process each question's rating and submit individually
        for (const [questionId, rating] of Object.entries(ratings)) {
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
      setRatings(resetRatings);
      } catch (apiError) {
        console.error('Error submitting feedback to API:', apiError);
        
        // Show error message
          setSnackbar({
            open: true,
          message: 'Failed to submit feedback: ' + (apiError.response?.data?.message || 'Please try again'),
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error in feedback submission flow:', error);
      // Show generic message
      setSnackbar({
        open: true,
        message: 'Please try again later',
        severity: 'info'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Add a dedicated function to load meetings from localStorage
  const loadMeetingsFromStorage = () => {
    try {
      // Try both possible localStorage keys for meetings
      const storedMeetings = localStorage.getItem('submittedMeetings') || localStorage.getItem('meetings');
      
      if (!storedMeetings) {
        console.log('No meetings found in localStorage');
        return false;
      }
      
      const parsedMeetings = JSON.parse(storedMeetings);
      
      if (!Array.isArray(parsedMeetings) || parsedMeetings.length === 0) {
        console.log('No valid meetings found in localStorage');
        return false;
      }
      
      console.log('Found', parsedMeetings.length, 'meetings in localStorage');
      
      // Filter student meetings
      const studentMeetings = parsedMeetings.filter(meeting => {
        // Check if role exists and is 'student' (case-insensitive)
        const role = (meeting.role || '').toLowerCase();
        return role === 'student' || role.includes('student');
      });
      
      console.log('Filtered', studentMeetings.length, 'student meetings from', parsedMeetings.length, 'total meetings');
      
      if (studentMeetings.length > 0) {
        setMeetings(studentMeetings);
        
        // Find next upcoming meeting for timer
        const now = new Date();
        const upcomingMeeting = studentMeetings
          .filter(m => {
            const meetingDate = new Date(m.date || m.meetingDate || '');
            return !isNaN(meetingDate.getTime()) && meetingDate > now;
          })
          .sort((a, b) => {
            const dateA = new Date(a.date || a.meetingDate || '');
            const dateB = new Date(b.date || b.meetingDate || '');
            return dateA - dateB;
          })[0];
        
        if (upcomingMeeting) {
          setTimerFromMeeting(upcomingMeeting);
        }
        
        setSnackbar({
          open: true,
          message: `Loaded ${studentMeetings.length} student meetings`,
          severity: 'success'
        });
        
        return true;
      }
      
      console.log('No student meetings found in localStorage');
      return false;
    } catch (error) {
      console.error('Error loading meetings from localStorage:', error);
      return false;
    }
  };

  // Helper function to set timer from meeting
  const setTimerFromMeeting = (meeting) => {
    try {
      const now = new Date();
      const meetingDate = new Date(`${meeting.date || meeting.meetingDate}T${meeting.startTime || '00:00'}`);
      
      if (!isNaN(meetingDate.getTime())) {
        const diffMs = Math.max(0, meetingDate - now);
        const diffMins = Math.floor(diffMs / 60000);
        const diffSecs = Math.floor((diffMs % 60000) / 1000);
        
        const timerData = {
          id: meeting.id,
          title: meeting.title,
          date: meetingDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          time: meeting.startTime,
          minutesLeft: diffMins,
          secondsLeft: diffSecs,
          originalDate: meeting.date || meeting.meetingDate,
          role: 'student',
          year: meeting.year
        };
        
        setNextMeeting(timerData);
        
        // Save to localStorage for timer persistence
        localStorage.setItem('studentNextMeetingData', JSON.stringify(timerData));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error setting timer from meeting:', error);
      return false;
    }
  };

  // Render student profile section
  const renderProfile = () => (
    <Paper sx={{ 
      p: 4, 
      borderRadius: 0,
      position: 'relative'
    }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 4 }}>Student Profile</Typography>
      
      <Box sx={{ 
        display: 'flex',
        alignItems: 'flex-start',
        mb: 0
      }}>
        <Avatar sx={{ width: 76, height: 76, bgcolor: '#1A2137', mr: 4 }}>
          {userProfile.name ? userProfile.name.charAt(0) : 'J'}
        </Avatar>
        
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, mb: 3 }}>
        <Box>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>Name</Typography>
                <Typography variant="body1">{userProfile.name}</Typography>
                    </Box>
        </Box>

        <Box>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>SIN Number</Typography>
                <Typography variant="body1">{userProfile.sin}</Typography>
              </Box>
              </Box>
            </Box>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, mb: 3 }}>
            <Box>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>Department</Typography>
                <Typography variant="body1">{userProfile.department}</Typography>
                    </Box>
        </Box>
        
            <Box>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>Year</Typography>
                <Typography variant="body1">{userProfile.year}</Typography>
                    </Box>
                    </Box>
        </Box>
        
        <Box>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>Email ID</Typography>
              <Typography variant="body1">{userProfile.email}</Typography>
                    </Box>
                    </Box>
                  </Box>
                    </Box>
          </Paper>
  );

  // Render feedback section
  const renderFeedback = () => (
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
      ) : questions.length === 0 ? (
        <Alert severity="info">
          No feedback questions available for your year and department.
        </Alert>
      ) : (
        <>
          {questions.map((question) => (
            <Box key={question.id} sx={{ mb: 4 }}>
              <Typography variant="body1" gutterBottom>
                {question.text}
              </Typography>
              <Rating
                name={`rating-${question.id}`}
                value={ratings[question.id] || 0}
                onChange={(event, newValue) => handleRatingChange(question.id, newValue)}
                size="medium"
                sx={{ color: '#FFD700', mt: 1 }}
              />
            </Box>
          ))}
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button 
              variant="contained" 
              onClick={handleSubmitFeedback} 
              disabled={loading}
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

  // Render meeting schedule section
  const renderViewMeetingSchedule = () => {
    return (
      <Paper sx={{ p: 4, borderRadius: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 4 }}>
          View Meeting Schedule
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {meetings && meetings.length > 0 ? (
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
                    {meetings.map((meeting) => {
                      // Normalize meeting data
                      const meetingDate = meeting.meetingDate || meeting.date;
                      const formattedDate = meetingDate 
                        ? new Date(meetingDate).toLocaleDateString() 
                        : 'Not specified';
                      
                      const departmentName = meeting.department?.name || 
                                          (typeof meeting.department === 'string' ? meeting.department : null) ||
                                          getDepartmentNameById(meeting.departmentId) || 
                                          'Not specified';
              
              return (
                        <TableRow 
                          key={meeting.id}
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
                              onClick={() => fetchQuestions(meeting.id)}
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

  // Sidebar component to match the screenshot exactly
  const Sidebar = () => (
    <Box 
      sx={{
        width: 240,
        bgcolor: '#1A2137', // Dark navy blue
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
          Student Dashboard
        </Typography>
      </Box>
      
      <List sx={{ p: 0 }}>
        <ListItem 
          button 
          onClick={() => setActiveSection('profile')}
          sx={{ 
            py: 2, 
            pl: 3,
            bgcolor: activeSection === 'profile' ? '#2A3147' : 'transparent',
            '&:hover': { bgcolor: '#2A3147' }
          }}
        >
          <ListItemIcon sx={{ color: '#FFFFFF', minWidth: 30 }}>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary="Profile" sx={{ color: '#FFFFFF' }} />
        </ListItem>
        
        <ListItem 
          button 
          onClick={() => setActiveSection('feedback')}
          sx={{ 
            py: 2, 
            pl: 3,
            bgcolor: activeSection === 'feedback' ? '#2A3147' : 'transparent',
            '&:hover': { bgcolor: '#2A3147' }
          }}
        >
          <ListItemIcon sx={{ color: '#FFFFFF', minWidth: 30 }}>
            <FeedbackIcon />
          </ListItemIcon>
          <ListItemText primary="Submit Feedback" sx={{ color: '#FFFFFF' }} />
        </ListItem>
        
        <ListItem 
          button 
          onClick={() => setActiveSection('meeting-schedule')}
          sx={{ 
            py: 2, 
            pl: 3,
            bgcolor: activeSection === 'meeting-schedule' ? '#2A3147' : 'transparent',
            '&:hover': { bgcolor: '#2A3147' }
          }}
        >
          <ListItemIcon sx={{ color: '#FFFFFF', minWidth: 30 }}>
            <CalendarTodayIcon />
          </ListItemIcon>
          <ListItemText primary="View Meeting Schedule" sx={{ color: '#FFFFFF' }} />
        </ListItem>
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
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Custom sidebar that matches the screenshot */}
      <Sidebar />
      
      {/* Main content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 0, 
          bgcolor: '#f5f5f7',
          ml: '240px',
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Box sx={{ width: '1010px', mt: 2, mb: 2 }}>
          {activeSection === 'profile' && renderProfile()}
          {activeSection === 'feedback' && renderFeedback()}
          {activeSection === 'meeting-schedule' && renderViewMeetingSchedule()}
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentDashboard;