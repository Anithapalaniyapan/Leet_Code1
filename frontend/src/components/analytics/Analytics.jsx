import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Paper, FormControl, InputLabel, 
  Select, MenuItem, CircularProgress, Fade,
  Grid, Card, CardContent, Tabs, Tab, Chip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';

// Import all the analytics components
import FeedbackOverview from './FeedbackOverview';
import DepartmentFeedback from './DepartmentFeedback';
import DepartmentComparison from './DepartmentComparison';
import QuestionFeedback from './QuestionFeedback';
import RecentFeedback from './RecentFeedback';
import StarRating from './StarRating';
import MeetingSelector from './MeetingSelector';
import AnalyticsTrends from './AnalyticsTrends';

const Analytics = () => {
  const [departments, setDepartments] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'student', 'staff'
  const [previousMeetingStats, setPreviousMeetingStats] = useState(null);
  const [feedbackData, setFeedbackData] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState({
    totalResponses: 0,
    overallAverageRating: 0,
    overallRatingDistribution: {},
    departmentStats: [],
    roleStats: {
      student: {
        totalResponses: 0,
        averageRating: 0,
        ratingDistribution: {}
      },
      staff: {
        totalResponses: 0,
        averageRating: 0,
        ratingDistribution: {}
      }
    }
  });
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
      
      const response = await axios.get(`http://localhost:8080/api/feedback/stats/meeting/${meetingId}/detailed`, {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data) {
        console.log('Received detailed feedback stats for meeting:', response.data);
        setFeedbackStats(response.data);
      } else {
        console.error('Invalid feedback stats format:', response.data);
      }
    } catch (error) {
      console.error('Error fetching detailed feedback stats:', error);
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
      
      const response = await axios.get(`http://localhost:8080/api/feedback/stats/meeting/${previousMeeting.id}/detailed`, {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
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
      
      const endpoint = roleFilter !== 'all' 
        ? `http://localhost:8080/api/feedback/question/${questionId}/meeting/${meetingId}/role/${roleFilter}`
        : `http://localhost:8080/api/feedback/question/${questionId}/meeting/${meetingId}`;
      
      const response = await axios.get(endpoint, {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data) {
        console.log(`Received question feedback (role filter: ${roleFilter}):`, response.data);
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
      
      const endpoint = roleFilter !== 'all' 
        ? `http://localhost:8080/api/feedback/stats/department/${departmentId}/meeting/${meetingId}/role/${roleFilter}`
        : `http://localhost:8080/api/feedback/stats/department/${departmentId}/meeting/${meetingId}`;
      
      const response = await axios.get(endpoint, {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data) {
        console.log(`Received department feedback (role filter: ${roleFilter}):`, response.data);
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

  // Render role comparison section
  const renderRoleComparison = () => {
    const studentStats = feedbackStats.roleStats?.student || { 
      totalResponses: 0, 
      averageRating: 0, 
      ratingDistribution: {} 
    };
    
    const staffStats = feedbackStats.roleStats?.staff || { 
      totalResponses: 0, 
      averageRating: 0, 
      ratingDistribution: {} 
    };
    
    return (
      <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Student vs. Staff Perspective</Typography>
        
        <Tabs
          value={roleFilter}
          onChange={(e, newValue) => setRoleFilter(newValue)}
          aria-label="role filter tabs"
          sx={{ mb: 3 }}
        >
          <Tab 
            icon={<PeopleIcon />} 
            iconPosition="start" 
            label="All Feedback" 
            value="all" 
          />
          <Tab 
            icon={<PersonIcon />} 
            iconPosition="start" 
            label="Student Feedback" 
            value="student" 
          />
          <Tab 
            icon={<PersonIcon />} 
            iconPosition="start" 
            label="Staff Feedback" 
            value="staff" 
          />
        </Tabs>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', bgcolor: '#e3f2fd', p: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon sx={{ color: '#1565c0', mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1565c0' }}>
                    Student Perspective
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ mr: 2 }}>
                    <Typography variant="body2" color="text.secondary">Average Rating</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1565c0' }}>
                      {parseFloat(studentStats.averageRating).toFixed(1)}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">Responses</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1565c0' }}>
                      {studentStats.totalResponses}
                    </Typography>
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Rating Distribution</Typography>
                  {Object.entries(studentStats.ratingDistribution || {})
                    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
                    .map(([rating, count]) => (
                      <Box key={`student-rating-${rating}`} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ width: 30 }}>{rating}★</Typography>
                        <Box sx={{ 
                          flexGrow: 1, 
                          height: 10, 
                          bgcolor: '#e0e0e0', 
                          borderRadius: 5, 
                          mr: 1,
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          <Box sx={{ 
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            width: `${(count / studentStats.totalResponses || 0) * 100}%`,
                            bgcolor: '#1565c0',
                            borderRadius: 5
                          }} />
                        </Box>
                        <Typography variant="caption">
                          {count} ({((count / studentStats.totalResponses || 0) * 100).toFixed(1)}%)
                        </Typography>
                      </Box>
                    ))
                  }
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', bgcolor: '#e8f5e9', p: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon sx={{ color: '#2e7d32', mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                    Staff Perspective
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ mr: 2 }}>
                    <Typography variant="body2" color="text.secondary">Average Rating</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                      {parseFloat(staffStats.averageRating).toFixed(1)}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">Responses</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                      {staffStats.totalResponses}
                    </Typography>
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Rating Distribution</Typography>
                  {Object.entries(staffStats.ratingDistribution || {})
                    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
                    .map(([rating, count]) => (
                      <Box key={`staff-rating-${rating}`} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ width: 30 }}>{rating}★</Typography>
                        <Box sx={{ 
                          flexGrow: 1, 
                          height: 10, 
                          bgcolor: '#e0e0e0', 
                          borderRadius: 5, 
                          mr: 1,
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          <Box sx={{ 
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            width: `${(count / staffStats.totalResponses || 0) * 100}%`,
                            bgcolor: '#2e7d32',
                            borderRadius: 5
                          }} />
                        </Box>
                        <Typography variant="caption">
                          {count} ({((count / staffStats.totalResponses || 0) * 100).toFixed(1)}%)
                        </Typography>
                      </Box>
                    ))
                  }
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  // Analytics dashboard overview card
  const renderDashboardOverview = () => {
    // Find the selected meeting data
    const selectedMeeting = meetings.find(m => m.id == selectedMeetingId);
    
    return (
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3, color: '#1A2137', fontWeight: 'bold' }}>
          Executive Analytics Dashboard
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
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
          
          <Grid item xs={12} md={3}>
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
          
          <Grid item xs={12} md={3}>
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
          
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%', p: 2, bgcolor: '#f5f5f7' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Total Responses
                </Typography>
                <Typography variant="h4" sx={{ mb: 1, color: '#f44336', fontWeight: 'bold' }}>
                  {feedbackStats.totalResponses || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Feedback submissions received
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {selectedMeeting && (
            <>
              <Grid item xs={12} sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ 
                  mb: 2, 
                  color: '#1A2137', 
                  fontWeight: 'bold',
                  borderLeft: '4px solid #1976d2',
                  pl: 2
                }}>
                  Selected Meeting: {selectedMeeting.title}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card sx={{ height: '100%', p: 2, bgcolor: '#e3f2fd', borderLeft: '4px solid #1976d2' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Meeting Responses
                    </Typography>
                    <Typography variant="h4" sx={{ mb: 1, color: '#1976d2', fontWeight: 'bold' }}>
                      {feedbackStats.totalResponses || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Members who provided feedback
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card sx={{ height: '100%', p: 2, bgcolor: '#e8f5e9', borderLeft: '4px solid #2e7d32' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Average Rating
                    </Typography>
                    <Typography variant="h4" sx={{ mb: 1, color: '#2e7d32', fontWeight: 'bold' }}>
                      {parseFloat(feedbackStats.overallAverageRating || 0).toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Overall satisfaction score (out of 5)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card sx={{ height: '100%', p: 2, bgcolor: '#e8eaf6', borderLeft: '4px solid #3f51b5' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Student Responses
                    </Typography>
                    <Typography variant="h4" sx={{ mb: 1, color: '#3f51b5', fontWeight: 'bold' }}>
                      {feedbackStats.roleStats?.student?.totalResponses || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg. {parseFloat(feedbackStats.roleStats?.student?.averageRating || 0).toFixed(1)} rating
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card sx={{ height: '100%', p: 2, bgcolor: '#fce4ec', borderLeft: '4px solid #d81b60' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Staff Responses
                    </Typography>
                    <Typography variant="h4" sx={{ mb: 1, color: '#d81b60', fontWeight: 'bold' }}>
                      {feedbackStats.roleStats?.staff?.totalResponses || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg. {parseFloat(feedbackStats.roleStats?.staff?.averageRating || 0).toFixed(1)} rating
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>
    );
  };

  return (
    <Box sx={{ p: 3, position: 'relative' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Executive Feedback Analysis Dashboard
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
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backgroundColor: 'rgba(25, 118, 210, 0.05)',
            backdropFilter: 'blur(5px)'
          }}>
            <CircularProgress size={60} thickness={4} sx={{ color: '#1A2137', mb: 3 }} />
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
                Executive Analytics Dashboard
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Loading analytics data...
              </Typography>
            </Box>
          </Box>
        </Fade>
      )}
      
      {!feedbackLoading && (
        <>
          {/* Meeting Selector - Now First */}
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
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
          
          {/* Selected Meeting Statistics - Now Separated */}
          {selectedMeetingId && (
            <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3, color: '#1A2137', fontWeight: 'bold' }}>
                Selected Meeting Statistics
              </Typography>
              
              {/* Enhanced Meeting Details */}
              {(() => {
                const selectedMeeting = meetings.find(m => m.id == selectedMeetingId);
                if (!selectedMeeting) return null;
                
                // Format date
                const meetingDate = new Date(selectedMeeting.meetingDate || selectedMeeting.date);
                const formattedDate = meetingDate.toLocaleDateString('en-US', {
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric'
                });
                
                // Format times to AM/PM
                const formatTimeToAMPM = (timeString) => {
                  if (!timeString) return '';
                  
                  // If it's already a Date object
                  if (timeString instanceof Date) {
                    return timeString.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    });
                  }
                  
                  // If it's a string in 24-hour format
                  if (typeof timeString === 'string' && timeString.includes(':')) {
                    const [hours, minutes] = timeString.split(':');
                    const date = new Date();
                    date.setHours(parseInt(hours, 10));
                    date.setMinutes(parseInt(minutes, 10));
                    
                    return date.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    });
                  }
                  
                  return timeString;
                };
                
                // Determine role type
                const roleType = selectedMeeting.isStaffMeeting ? 'Staff' :
                                 selectedMeeting.roleId === 2 ? 'Staff' : 'Student';
                
                const startTime = formatTimeToAMPM(selectedMeeting.startTime);
                const endTime = formatTimeToAMPM(selectedMeeting.endTime);
                
                return (
                  <Box sx={{ 
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
                    bgcolor: '#f8f9fa',
                    border: '1px solid #e0e0e0'
                  }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {selectedMeeting.title || "Meeting Details"}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Meeting ID
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedMeeting.id}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Date
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {formattedDate}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Time
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {startTime} - {endTime}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Participant Role
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Chip 
                            label={roleType}
                            size="small"
                            sx={{ 
                              bgcolor: roleType === 'Student' ? '#e3f2fd' : '#e8f5e9',
                              color: roleType === 'Student' ? '#1565c0' : '#2e7d32',
                              fontWeight: 'bold'
                            }}
                          />
                          
                          {roleType === 'Student' && selectedMeeting.year && (
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              Year: {selectedMeeting.year}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Department
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedMeeting.department?.name || 
                           (selectedMeeting.departmentId ? 
                            departments.find(d => d.id === selectedMeeting.departmentId)?.name : 
                            "All Departments")}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                );
              })()}
              
              {/* Overall feedback overview */}
              <FeedbackOverview 
                feedbackStats={feedbackStats}
              />
              
              {/* Student vs Staff Comparison */}
              {renderRoleComparison()}
              
            </Paper>
          )}

          {/* Dashboard Overview */}
          {renderDashboardOverview()}

          {selectedMeetingId && (
            <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3, color: '#1A2137', fontWeight: 'bold' }}>
                Selected Meeting Statistics
              </Typography>
              
              {/* Enhanced Meeting Details */}
              {(() => {
                const selectedMeeting = meetings.find(m => m.id == selectedMeetingId);
                if (!selectedMeeting) return null;
                
                // Format date
                const meetingDate = new Date(selectedMeeting.meetingDate || selectedMeeting.date);
                const formattedDate = meetingDate.toLocaleDateString('en-US', {
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric'
                });
                
                // Format times to AM/PM
                const formatTimeToAMPM = (timeString) => {
                  if (!timeString) return '';
                  
                  // If it's already a Date object
                  if (timeString instanceof Date) {
                    return timeString.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    });
                  }
                  
                  // If it's a string in 24-hour format
                  if (typeof timeString === 'string' && timeString.includes(':')) {
                    const [hours, minutes] = timeString.split(':');
                    const date = new Date();
                    date.setHours(parseInt(hours, 10));
                    date.setMinutes(parseInt(minutes, 10));
                    
                    return date.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    });
                  }
                  
                  return timeString;
                };
                
                // Determine role type
                const roleType = selectedMeeting.isStaffMeeting ? 'Staff' :
                                 selectedMeeting.roleId === 2 ? 'Staff' : 'Student';
                
                const startTime = formatTimeToAMPM(selectedMeeting.startTime);
                const endTime = formatTimeToAMPM(selectedMeeting.endTime);
                
                return (
                  <Box sx={{ 
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
                    bgcolor: '#f8f9fa',
                    border: '1px solid #e0e0e0'
                  }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {selectedMeeting.title || "Meeting Details"}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Meeting ID
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedMeeting.id}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Date
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {formattedDate}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Time
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {startTime} - {endTime}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Participant Role
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Chip 
                            label={roleType}
                            size="small"
                            sx={{ 
                              bgcolor: roleType === 'Student' ? '#e3f2fd' : '#e8f5e9',
                              color: roleType === 'Student' ? '#1565c0' : '#2e7d32',
                              fontWeight: 'bold'
                            }}
                          />
                          
                          {roleType === 'Student' && selectedMeeting.year && (
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              Year: {selectedMeeting.year}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Department
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedMeeting.department?.name || 
                           (selectedMeeting.departmentId ? 
                            departments.find(d => d.id === selectedMeeting.departmentId)?.name : 
                            "All Departments")}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                );
              })()}
              
              {/* Overall feedback overview */}
              <FeedbackOverview 
                feedbackStats={feedbackStats}
              />
              
              {/* Student vs Staff Comparison */}
              {renderRoleComparison()}
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};

export default Analytics; 