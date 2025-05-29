import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Paper, FormControl, InputLabel, 
  Select, MenuItem, CircularProgress, Fade,
  Grid, Card, CardContent, Chip
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import TagIcon from '@mui/icons-material/Tag';
import TitleIcon from '@mui/icons-material/Title';

// Import all the analytics components
import FeedbackOverview from '../../analytics/FeedbackOverview';
import MeetingSelector from '../../analytics/MeetingSelector';
// Import the new QuestionAnalysis component
import QuestionAnalysis from '../../analytics/QuestionAnalysis';

const AnalyticsTap = () => {
  const [departments, setDepartments] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [feedbackData, setFeedbackData] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState({
    totalResponses: 0,
    overallAverageRating: 0,
    overallRatingDistribution: {},
    departmentStats: []
  });
  const [previousMeetingStats, setPreviousMeetingStats] = useState(null);
  const [selectedDepartmentForStats, setSelectedDepartmentForStats] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [allQuestions, setAllQuestions] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [questionFeedback, setQuestionFeedback] = useState({
    questionId: '',
    totalResponses: 0,
    averageRating: 0,
    ratingDistribution: {},
    feedback: []
  });
  const [questionFeedbackLoading, setQuestionFeedbackLoading] = useState(false);
  const [departmentFeedback, setDepartmentFeedback] = useState({
    departmentId: '',
    totalResponses: 0,
    averageRating: 0,
    ratingDistribution: {},
    questionStats: []
  });
  const [departmentFeedbackLoading, setDepartmentFeedbackLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Effect to check auth and fetch initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          fetchDepartments(),
          fetchMeetings(),
          fetchAllQuestions()
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setError(error.message);
      }
    };

    loadInitialData();
  }, []);

  // Effect to fetch feedback data when a meeting is selected
  useEffect(() => {
    if (selectedMeetingId) {
      fetchFeedbackData(selectedMeetingId);
      fetchFeedbackStats(selectedMeetingId);
      fetchPreviousMeetingStats(selectedMeetingId);
    }
  }, [selectedMeetingId]);

  // Effect to fetch question feedback when a question is selected
  useEffect(() => {
    if (selectedQuestionId && selectedMeetingId) {
      fetchQuestionFeedback(selectedQuestionId, selectedMeetingId);
    }
  }, [selectedQuestionId, selectedMeetingId]);

  // Effect to fetch department feedback when a department is selected
  useEffect(() => {
    if (selectedDepartmentForStats && selectedMeetingId) {
      fetchDepartmentFeedback(selectedDepartmentForStats, selectedMeetingId);
    }
  }, [selectedDepartmentForStats, selectedMeetingId]);

  // Fetch meetings
  const fetchMeetings = async () => {
    setMeetingsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/meetings/all', {
        headers: { 'x-access-token': token }
      });
      
      if (response.data && Array.isArray(response.data)) {
        console.log('Fetched meetings:', response.data);
        
        // Sort meetings by date (newest first)
        const sortedMeetings = response.data.sort((a, b) => {
          return new Date(b.meetingDate || b.date || '') - new Date(a.meetingDate || a.date || '');
        });
        
        setMeetings(sortedMeetings);
        
        // If there are meetings and none selected yet, select the first one
        if (sortedMeetings.length > 0 && !selectedMeetingId) {
          setSelectedMeetingId(sortedMeetings[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setError('Failed to load meetings. Please try again later.');
    } finally {
      setMeetingsLoading(false);
    }
  };

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/departments', {
        headers: { 'x-access-token': token }
      });
      
      if (response.data) {
        setDepartments(response.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  };

  // Fetch feedback data for a specific meeting
  const fetchFeedbackData = async (meetingId) => {
    if (!meetingId) return;
    
    setFeedbackLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.get(`http://localhost:8080/api/feedback/meeting/${meetingId}`, {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        console.log('Received feedback data for meeting:', response.data);
        setFeedbackData(response.data);
      } else {
        console.error('Invalid feedback data format:', response.data);
      }
    } catch (error) {
      console.error('Error fetching feedback data:', error);
      setError(error.message);
      setSnackbar({
        open: true,
        message: 'Failed to load feedback data: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      });
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Fetch feedback stats for a specific meeting
  const fetchFeedbackStats = async (meetingId) => {
    if (!meetingId) return;
    
    setFeedbackLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Try to fetch overall stats for this meeting
      const response = await axios.get(`http://localhost:8080/api/feedback/stats/overall`, {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        },
        params: { meetingId: meetingId } // Pass meetingId as a query parameter
      });
      
      if (response.data) {
        console.log('Received feedback stats for meeting:', response.data);
        setFeedbackStats(response.data);
      } else {
        console.error('Invalid feedback stats format:', response.data);
      }
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
      setError(error.message);
      setSnackbar({
        open: true,
        message: 'Failed to load feedback statistics: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      });
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Fetch previous meeting stats for trend comparison
  const fetchPreviousMeetingStats = async (currentMeetingId) => {
    if (!currentMeetingId) return;
    
    try {
      // Find the current meeting in our list
      const currentMeeting = meetings.find(m => m.id == currentMeetingId);
      if (!currentMeeting) return;
      
      // Find the date of the current meeting
      const currentMeetingDate = new Date(currentMeeting.meetingDate || currentMeeting.date);
      
      // Find meetings older than the current one
      const olderMeetings = meetings.filter(m => {
        const meetingDate = new Date(m.meetingDate || m.date);
        return meetingDate < currentMeetingDate;
      });
      
      // If there are no older meetings, we can't show trends
      if (olderMeetings.length === 0) {
        setPreviousMeetingStats(null);
        return;
      }
      
      // Get the most recent previous meeting
      const previousMeeting = olderMeetings[0];
      
      // Fetch stats for that meeting
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Try to fetch overall stats for the previous meeting
      const response = await axios.get(`http://localhost:8080/api/feedback/stats/overall`, {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        },
        params: { meetingId: previousMeeting.id } // Pass meetingId as a query parameter
      });
      
      if (response.data) {
        console.log('Received previous meeting stats:', response.data);
        setPreviousMeetingStats(response.data);
      } else {
        console.error('Invalid previous meeting stats format:', response.data);
      }
    } catch (error) {
      console.error('Error fetching previous meeting stats:', error);
      setPreviousMeetingStats(null);
    }
  };

  // Fetch all questions
  const fetchAllQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.get('http://localhost:8080/api/questions', {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        console.log('Received all questions:', response.data);
        setAllQuestions(response.data);
      } else {
        console.error('Invalid questions data format:', response.data);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  // Fetch question feedback for a specific meeting
  const fetchQuestionFeedback = async (questionId, meetingId) => {
    if (!questionId || !meetingId) return;
    
    setQuestionFeedbackLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.get(`http://localhost:8080/api/feedback/question/${questionId}/meeting/${meetingId}`, {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data) {
        console.log('Received question feedback:', response.data);
        setQuestionFeedback(response.data);
      } else {
        console.error('Invalid question feedback format:', response.data);
      }
    } catch (error) {
      console.error(`Error fetching feedback for question ${questionId}:`, error);
      setError(error.message);
      setSnackbar({
        open: true,
        message: `Failed to load feedback for question: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    } finally {
      setQuestionFeedbackLoading(false);
    }
  };

  // Fetch department feedback for a specific meeting
  const fetchDepartmentFeedback = async (departmentId, meetingId) => {
    if (!departmentId || !meetingId) return;
    
    setDepartmentFeedbackLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.get(`http://localhost:8080/api/feedback/stats/department/${departmentId}/meeting/${meetingId}`, {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data) {
        console.log('Received department feedback:', response.data);
        setDepartmentFeedback(response.data);
      } else {
        console.error('Invalid department feedback format:', response.data);
      }
    } catch (error) {
      console.error(`Error fetching feedback for department ${departmentId}:`, error);
      setError(error.message);
      setSnackbar({
        open: true,
        message: `Failed to load feedback for department: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    } finally {
      setDepartmentFeedbackLoading(false);
    }
  };

  // Analytics dashboard overview card
  const renderDashboardOverview = () => {
    // Find the selected meeting data
    const selectedMeeting = meetings.find(m => m.id == selectedMeetingId);
    
    return (
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3, color: '#1A2137', fontWeight: 'bold' }}>
          Analytics Dashboard Overview
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', p: 2, bgcolor: '#f5f5f7' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Total Meetings
                </Typography>
                <Typography variant="h4" sx={{ mb: 1, color: '#1976d2', fontWeight: 'bold' }}>
                  {meetings.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total feedback meetings in the system
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', p: 2, bgcolor: '#f5f5f7' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Departments
                </Typography>
                <Typography variant="h4" sx={{ mb: 1, color: '#9c27b0', fontWeight: 'bold' }}>
                  {departments.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active departments with feedback data
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', p: 2, bgcolor: '#f5f5f7' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Total Questions
                </Typography>
                <Typography variant="h4" sx={{ mb: 1, color: '#2e7d32', fontWeight: 'bold' }}>
                  {allQuestions.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active feedback questions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        
          
        </Grid>
      </Paper>
    );
  };

  return (
    <Box sx={{ p: 3, position: 'relative' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Feedback Analysis Dashboard
      </Typography>
      
      {/* Consistent loading UI overlay */}
      {feedbackLoading && (
        <Fade in={feedbackLoading}>
          <Box sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10
            }}>
            <CircularProgress />
          </Box>
        </Fade>
      )}
      
      {/* Meeting Selector Section */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, color: '#1A2137', fontWeight: 'bold' }}>
          Select Meeting for Analytics
            </Typography>
            <MeetingSelector
              meetings={meetings}
              selectedMeetingId={selectedMeetingId}
              onMeetingChange={setSelectedMeetingId}
              loading={meetingsLoading}
            />
          </Paper>
          
          {/* Dashboard Overview */}
          {renderDashboardOverview()}
          
      {/* Only show analytics if a meeting is selected */}
      {selectedMeetingId ? (
            <>
          {/* Feedback Overview */}
              <FeedbackOverview 
                feedbackStats={feedbackStats}
            previousMeetingStats={previousMeetingStats}
          />
          
          {/* Question Analysis Section */}
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 2 }}>
            <QuestionAnalysis 
              meetingId={selectedMeetingId} 
              allQuestions={allQuestions}
            />
          </Paper>
              
            
            </>
      ) : (
        <Paper sx={{ p: 6, mb: 4, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Please select a meeting to view analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a meeting from the selector above to see detailed feedback and analytics
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default AnalyticsTap; 