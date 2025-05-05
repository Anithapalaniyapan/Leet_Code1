import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { Box, Snackbar, Alert, CircularProgress, Fade, Typography } from '@mui/material';

// Import our new components
import Sidebar from '../student-dashboard/Sidebar';
import ProfileSection from '../student-dashboard/ProfileSection';
import FeedbackSection from '../student-dashboard/FeedbackSection';
import MeetingScheduleSection from '../student-dashboard/MeetingScheduleSection';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [userProfile, setUserProfile] = useState({
    name: 'Sowmiya',
    department: 'Computer Science',
    sin: 'ST23456789',
    year: 'Third Year',
    email: 'sowmiya@shanmugha.edu.in'
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
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState('');
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [nextMeetingTimer, setNextMeetingTimer] = useState(null);
  const [shouldShowQuestions, setShouldShowQuestions] = useState(false);
  
  // Add ref for the polling interval
  const pollingIntervalRef = useRef(null);

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
    
    // Start polling for meetings that are about to start (5 minutes window)
    startPollingForMeetings();
    
    // Clean up on component unmount
    return () => {
      stopPollingForMeetings();
      if (nextMeetingTimer) {
        clearTimeout(nextMeetingTimer);
      }
    };
  }, [navigate]);
  
  // Function to start polling for meetings every 10 seconds
  const startPollingForMeetings = () => {
    // Clear any existing interval
    stopPollingForMeetings();
    
    console.log('Starting to poll for upcoming meetings every 10 seconds');
    
    // Set up new interval
    pollingIntervalRef.current = setInterval(() => {
      checkForUpcomingMeetings();
    }, 10000); // 10 seconds interval
    
    // Do an initial check immediately
    checkForUpcomingMeetings();
  };
  
  // Function to stop polling
  const stopPollingForMeetings = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };
  
  // Function to check for meetings that are about to start within 5 minutes
  const checkForUpcomingMeetings = () => {
    if (!meetings || meetings.length === 0) return;
    
    console.log('Checking for upcoming meetings within 5 minutes window...');
    
    const now = new Date();
    let upcomingMeeting = null;
    let minutesUntilStart = Infinity;
    
    // Find the closest upcoming meeting
    meetings.forEach(meeting => {
      // Parse meeting date and time
      const meetingDate = new Date(`${meeting.date || meeting.meetingDate}T${meeting.startTime || '00:00'}`);
      
      if (isNaN(meetingDate.getTime())) {
        console.log(`Invalid meeting date/time for meeting ${meeting.id}`);
        return; // Skip this meeting
      }
      
      // Calculate minutes until meeting starts
      const diffMs = meetingDate.getTime() - now.getTime();
      const minsUntil = Math.floor(diffMs / 60000);
      
      // If this meeting is closer than our current closest but still in the future
      if (minsUntil >= 0 && minsUntil < minutesUntilStart) {
        minutesUntilStart = minsUntil;
        upcomingMeeting = meeting;
      }
    });
    
    // If we found an upcoming meeting within 5 minutes, show questions
    if (upcomingMeeting && minutesUntilStart <= 5) {
      console.log(`Found meeting starting in ${minutesUntilStart} minutes:`, upcomingMeeting.title);
      
      // Set as active meeting
      setActiveMeeting(upcomingMeeting);
      setShouldShowQuestions(true);
      
      // If we're on the feedback section, load questions for this meeting
      if (activeSection === 'feedback') {
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
    }
  };

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

  // Fetch meetings 
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
            
            // Check for any meetings starting soon
            checkForUpcomingMeetings();
            
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

  // Enhanced helper function to set up meeting timer with questions check
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
      const nextMeeting = upcomingMeetings[0];
      setTimerFromMeeting(nextMeeting);
      
      // Check if we need to show questions now or schedule for later
      checkAndScheduleQuestions(nextMeeting);
    }
  };
  
  // New function to properly check and schedule when to show questions
  const checkAndScheduleQuestions = (meeting) => {
    // Get current time
    const now = new Date();
    
    // Get meeting time - handle both regular date and ISO string format
    let meetingDate = meeting.date || meeting.meetingDate;
    const meetingTime = meeting.startTime || '00:00';
    
    // If date is an ISO string (contains 'T'), extract just the date part
    if (typeof meetingDate === 'string' && meetingDate.includes('T')) {
      meetingDate = meetingDate.split('T')[0]; // Extract just the YYYY-MM-DD part
    }
    
    // Create a proper date object with the extracted date and time
    const meetingDateTime = new Date(`${meetingDate}T${meetingTime}`);
    
    if (isNaN(meetingDateTime.getTime())) {
      console.error('Invalid meeting date/time format:', meetingDate, meetingTime);
      return false;
    }
    
    // Calculate difference in milliseconds
    const diffMs = meetingDateTime.getTime() - now.getTime();
    
    // Convert to minutes
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    console.log(`Meeting ${meeting.id} (${meeting.title}) starts in ${diffMins} minutes`);
    
    // If meeting starts in 5 minutes or less, show questions now
    if (diffMins <= 5 && diffMins >= -60) { // Allow up to 60 minutes after start time to still show questions
      console.log(`Meeting starts in less than 5 minutes or has recently started, showing questions now`);
      setShouldShowQuestions(true);
      setActiveMeeting(meeting);
      fetchQuestions(meeting.id);
      return true;
    } 
    // If meeting is in the future, schedule questions to appear exactly 5 mins before
    else if (diffMins > 5) {
      // Clear any existing timer
      if (nextMeetingTimer) {
        clearTimeout(nextMeetingTimer);
      }
      
      // Calculate when to show questions (exactly 5 minutes before meeting)
      const timeUntilFiveMinsBefore = diffMs - (5 * 60 * 1000);
      
      console.log(`Scheduling questions to appear in ${Math.floor(timeUntilFiveMinsBefore/60000)} minutes (5 minutes before meeting)`);
      
      // Set timer
      const timerId = setTimeout(() => {
        console.log(`It's exactly 5 minutes before meeting ${meeting.id}, showing questions now`);
        setShouldShowQuestions(true);
        setActiveMeeting(meeting);
        fetchQuestions(meeting.id);
        
        // Switch to feedback section if the dashboard is open
        setActiveSection('feedback');
        
        // Show notification
        setSnackbar({
          open: true,
          message: `Questions are now available for meeting: ${meeting.title}`,
          severity: 'info'
        });
      }, timeUntilFiveMinsBefore);
      
      setNextMeetingTimer(timerId);
      return true;
    } else {
      // Meeting has passed by more than 60 minutes
      console.log(`Meeting has passed by more than 60 minutes, not showing questions`);
      return false;
    }
  };
  
  // Update existing scheduleQuestionCheck to use the new function
  const scheduleQuestionCheck = (meeting) => {
    return checkAndScheduleQuestions(meeting);
  };

  // Update fetchQuestions function to handle meeting-specific questions
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
        setQuestions(questionsData);
        
        // Initialize ratings for each question
        const initialRatings = {};
        questionsData.forEach(question => {
          initialRatings[question.id] = 0;
        });
        setRatings(initialRatings);

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

  const handleRatingChange = (questionId, value) => {
    setRatings(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmitFeedback = async (notes = {}) => {
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
        
        // Get meetingId from active meeting if available
        const activeMeetingId = activeMeeting?.id || null;
          
        console.log('Submitting feedback for meeting ID:', activeMeetingId);
        
        // Process each question's rating and submit individually
        for (const [questionId, rating] of Object.entries(ratings)) {
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
        setRatings(resetRatings);
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
    // Stop polling when logging out
    stopPollingForMeetings();
    if (nextMeetingTimer) {
      clearTimeout(nextMeetingTimer);
    }
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
      const storedMeetings = localStorage.getItem('studentMeetings') || localStorage.getItem('meetings');
      
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
        
        // Check for upcoming meetings
        checkForUpcomingMeetings();
        
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

  // Add useEffect for fetching questions when feedback section is active
  useEffect(() => {
    if (activeSection === 'feedback') {
      if (activeMeeting) {
        fetchQuestions(activeMeeting.id);
      } else {
        fetchQuestions();
      }
    }
  }, [activeSection]);

  // Handle fetching questions for a specific meeting
  const handleFetchQuestionsByMeeting = (meetingId) => {
    // First switch to the feedback section
    setActiveSection('feedback');
    
    // Then fetch questions for this meeting
    fetchQuestions(meetingId);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
        onLogout={handleLogout}
      />
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
        {/* Loading overlay - similar to Academic Director's dashboard */}
        {(loading || questionsLoading) && !userProfile.name && (
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
                    Student Dashboard
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Loading your dashboard...
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Fade>
        )}

        {/* Main Content */}
          {activeSection === 'profile' && (
          <ProfileSection 
            userProfile={userProfile} 
            loading={loading}
          />
          )}
          
          {activeSection === 'feedback' && (
            <FeedbackSection 
              questions={questions}
              handleRatingChange={handleRatingChange}
              handleSubmitFeedback={handleSubmitFeedback}
            ratings={ratings}
              loading={loading}
              questionsLoading={questionsLoading}
              questionsError={questionsError}
              activeMeeting={activeMeeting}
              shouldShowQuestions={shouldShowQuestions}
            feedbackSubmitted={feedbackSubmitted}
            />
          )}
          
        {activeSection === 'meetings' && (
            <MeetingScheduleSection 
              meetings={meetings}
              loading={loading}
            error={error}
              handleFetchQuestionsByMeeting={handleFetchQuestionsByMeeting}
            />
          )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Box>
    </Box>
  );
};

export default StudentDashboard;