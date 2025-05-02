import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Paper, FormControl, InputLabel, 
  Select, MenuItem, CircularProgress, Fade
} from '@mui/material';

// Import all the analytics components
import FeedbackOverview from '../../analytics/FeedbackOverview';
import UserTypeComparison from '../../analytics/UserTypeComparison';
import DepartmentFeedback from '../../analytics/DepartmentFeedback';
import DepartmentComparison from '../../analytics/DepartmentComparison';


const AnalyticsTap = () => {
  const [departments, setDepartments] = useState([]);
  const [feedbackData, setFeedbackData] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState({
    totalResponses: 0,
    overallAverageRating: 0,
    overallRatingDistribution: {},
    departmentStats: []
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
          fetchFeedbackData(),
          fetchFeedbackStats(),
          fetchAllQuestions()
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setError(error.message);
      }
    };

    loadInitialData();
  }, []);

  // Effect to fetch question feedback when a question is selected
  useEffect(() => {
    if (selectedQuestionId) {
      fetchQuestionFeedback(selectedQuestionId);
    }
  }, [selectedQuestionId]);

  // Effect to fetch department feedback when a department is selected
  useEffect(() => {
    if (selectedDepartmentForStats) {
      fetchDepartmentFeedback(selectedDepartmentForStats);
    }
  }, [selectedDepartmentForStats]);

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

  // Fetch feedback data
  const fetchFeedbackData = async () => {
    setFeedbackLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.get('http://localhost:8080/api/feedback/all', {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        console.log('Received feedback data:', response.data);
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

  // Fetch feedback stats
  const fetchFeedbackStats = async () => {
    setFeedbackLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.get('http://localhost:8080/api/feedback/stats/overall', {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data) {
        console.log('Received feedback stats:', response.data);
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

  // Fetch question feedback
  const fetchQuestionFeedback = async (questionId) => {
    if (!questionId) return;
    
    setQuestionFeedbackLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.get(`http://localhost:8080/api/feedback/question/${questionId}`, {
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

  // Fetch department feedback
  const fetchDepartmentFeedback = async (departmentId) => {
    if (!departmentId) return;
    
    setDepartmentFeedbackLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.get(`http://localhost:8080/api/feedback/stats/department/${departmentId}`, {
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

  return (
    <Box sx={{ p: 3, position: 'relative' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Feedback Analysis Dashboard
      </Typography>
      
      {/* Consistent loading UI overlay, same as other dashboards */}
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
                Analytics Dashboard
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
          {/* Department selector */}
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              Department Analysis
            </Typography>
            <FormControl fullWidth>
              <InputLabel id="department-select-label">Select Department</InputLabel>
              <Select
                labelId="department-select-label"
                id="department-select"
                value={selectedDepartmentForStats}
                onChange={(e) => setSelectedDepartmentForStats(e.target.value)}
                label="Select Department"
              >
                <MenuItem value="">
                  <em>Select a department</em>
                </MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
          
          {/* Overall feedback overview */}
          <FeedbackOverview 
            feedbackStats={feedbackStats}
          />
          
          {/* User type comparison */}
          <UserTypeComparison 
            feedbackData={feedbackData}
          />
       
          
          {/* Department-specific feedback */}
          <DepartmentFeedback 
            departmentFeedback={departmentFeedback}
            departmentFeedbackLoading={departmentFeedbackLoading}
            departments={departments}
            selectedDepartmentForStats={selectedDepartmentForStats}
            setSelectedQuestionId={setSelectedQuestionId}
          />
          
          {/* Department comparisons */}
          <DepartmentComparison 
            feedbackStats={feedbackStats}
          />
        </>
      )}
    </Box>
  );
};

export default AnalyticsTap; 