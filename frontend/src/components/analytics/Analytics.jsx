import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Paper, FormControl, InputLabel, 
  Select, MenuItem, CircularProgress, Fade,
  Grid, Card, CardContent, Tabs, Tab, Chip,
  Button, Collapse, Divider, List, ListItem, ListItemText,
  Avatar, Tooltip, Badge, Rating, Snackbar, Alert
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ErrorIcon from '@mui/icons-material/Error';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import ApartmentIcon from '@mui/icons-material/Apartment';
import StarIcon from '@mui/icons-material/Star';

// Import all the analytics components
import FeedbackOverview from './FeedbackOverview';
import DepartmentComparison from './DepartmentComparison';
import QuestionFeedback from './QuestionFeedback';
import StarRating from './StarRating';
import MeetingSelector from './MeetingSelector';

// New component to show question analysis with detailed responses
const QuestionAnalysis = ({ meetingId, allQuestions }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [expandedDetails, setExpandedDetails] = useState({});
  const [filterValue, setFilterValue] = useState('all'); // 'all', 'high', 'low'
  
  useEffect(() => {
    if (meetingId) {
      fetchQuestionAnalysis(meetingId);
    }
  }, [meetingId]);
  
  const fetchQuestionAnalysis = async (meetingId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get(`http://localhost:8080/api/feedback/meeting/${meetingId}/questions/ratings`, {
          headers: { 'x-access-token': token }
        });
        
        if (response.data) {
          // Format question data with responses
          const formattedQuestions = response.data.map(q => ({
            ...q,
            ratingCounts: {
              1: q.responses.filter(r => r.rating === 1).length,
              2: q.responses.filter(r => r.rating === 2).length,
              3: q.responses.filter(r => r.rating === 3).length,
              4: q.responses.filter(r => r.rating === 4).length,
              5: q.responses.filter(r => r.rating === 5).length
            }
          }));
          setQuestions(formattedQuestions);
        }
      } catch (apiError) {
        console.error('API error in QuestionAnalysis:', apiError);
        
        // Fallback: Use general feedback data to reconstruct question analysis
        try {
          const fallbackResponse = await axios.get(`http://localhost:8080/api/feedback/meeting/${meetingId}`, {
            headers: { 'x-access-token': token }
          });
          
          if (fallbackResponse.data && Array.isArray(fallbackResponse.data)) {
            // Group feedback by questions
            const feedbacksByQuestion = {};
            
            fallbackResponse.data.forEach(feedback => {
              if (!feedback.question) return;
              
              const questionId = feedback.question.id;
              if (!feedbacksByQuestion[questionId]) {
                feedbacksByQuestion[questionId] = {
                  id: questionId,
                  text: feedback.question.text || 'Question',
                  responses: []
                };
              }
              
              feedbacksByQuestion[questionId].responses.push({
                id: feedback.id,
                rating: feedback.rating,
                notes: feedback.notes,
                user: feedback.user,
                userName: feedback.user?.fullName || feedback.user?.username || 'Anonymous',
                department: feedback.question?.department,
                role: feedback.user?.roles?.[0]?.name?.toLowerCase() || 'unknown'
              });
            });
            
            // Process each question's stats
            const formattedQuestions = Object.values(feedbacksByQuestion).map(q => {
              let totalRating = 0;
              q.responses.forEach(r => totalRating += r.rating || 0);
              
              return {
                ...q,
                totalResponses: q.responses.length,
                averageRating: q.responses.length > 0 ? totalRating / q.responses.length : 0,
                ratingCounts: {
                  1: q.responses.filter(r => r.rating === 1).length,
                  2: q.responses.filter(r => r.rating === 2).length,
                  3: q.responses.filter(r => r.rating === 3).length,
                  4: q.responses.filter(r => r.rating === 4).length,
                  5: q.responses.filter(r => r.rating === 5).length
                }
              };
            });
            
            setQuestions(formattedQuestions);
          }
        } catch (fallbackError) {
          console.error('Fallback error in QuestionAnalysis:', fallbackError);
          setError('Failed to load question analysis data. API endpoint may not be implemented.');
        }
      }
    } catch (error) {
      console.error('Error fetching question analysis:', error);
      setError('Failed to load question analysis data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleDetails = (questionId) => {
    setExpandedQuestionId(expandedQuestionId === questionId ? null : questionId);
  };
  
  const handleToggleResponseDetails = (responseId) => {
    setExpandedDetails(prev => ({
      ...prev,
      [responseId]: !prev[responseId]
    }));
  };
  
  const getFirstLetterOfName = (name) => {
    return name && typeof name === 'string' ? name.charAt(0).toUpperCase() : '?';
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return '#4CAF50'; // Green
    if (rating >= 3.5) return '#8BC34A'; // Light Green
    if (rating >= 2.5) return '#FFC107'; // Amber
    if (rating >= 1.5) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getFilteredQuestions = () => {
    if (filterValue === 'all') return questions;
    if (filterValue === 'high') return questions.filter(q => q.averageRating >= 4);
    if (filterValue === 'low') return questions.filter(q => q.averageRating < 3);
    return questions;
  };

  const renderRatingCircle = (rating, size = 64) => {
    const color = getRatingColor(rating);
    return (
      <Box sx={{ 
        width: size, 
        height: size, 
        borderRadius: '50%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: `${color}15`,
        border: `3px solid ${color}`,
        boxShadow: `0 0 10px ${color}30`,
        fontSize: size * 0.4,
        fontWeight: 'bold',
        color: color
      }}>
        {rating.toFixed(1)}
      </Box>
    );
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', py: 8 }}>
        <CircularProgress size={60} thickness={5} sx={{ mb: 3 }} />
        <Typography variant="h6" color="text.secondary">
          Loading question analysis...
        </Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 4, bgcolor: '#ffebee', borderRadius: 2, my: 2, textAlign: 'center' }}>
        <ErrorIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
        <Typography variant="h6" color="error" gutterBottom>
          Error Loading Data
        </Typography>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }
  
  if (questions.length === 0) {
    return (
      <Box sx={{ p: 6, bgcolor: '#f5f5f5', borderRadius: 2, textAlign: 'center', my: 2 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Question Data Available
        </Typography>
        <Typography variant="body1" color="text.secondary">
          There are no questions with feedback for the selected meeting.
        </Typography>
      </Box>
    );
  }

  const filteredQuestions = getFilteredQuestions();
  
  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 4,
        flexWrap: 'wrap'
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
            Questions Analysis
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Showing {filteredQuestions.length} questions with feedback from {questions.reduce((sum, q) => sum + q.responses.length, 0)} responses
          </Typography>
        </Box>
        
        <Box sx={{ mt: { xs: 2, sm: 0 } }}>
          <Tabs 
            value={filterValue}
            onChange={(e, val) => setFilterValue(val)}
            sx={{ 
              '& .MuiTab-root': { 
                borderRadius: '20px',
                minHeight: '36px',
                minWidth: 'auto',
                px: 2,
                mx: 0.5,
                fontSize: '0.875rem'
              } 
            }}
          >
            <Tab value="all" label="All Questions" />
            <Tab 
              value="high" 
              label="High Rated (≥4)" 
              icon={<StarIcon sx={{ fontSize: 16, color: '#4CAF50' }} />} 
              iconPosition="end" 
            />
            <Tab 
              value="low" 
              label="Low Rated (<3)" 
              icon={<StarIcon sx={{ fontSize: 16, color: '#F44336' }} />} 
              iconPosition="end" 
            />
          </Tabs>
        </Box>
      </Box>
      
      {filteredQuestions.length === 0 ? (
        <Box sx={{ p: 4, bgcolor: '#f5f5f5', borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No questions match the selected filter.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredQuestions.map(question => (
            <Grid item xs={12} key={question.id}>
              <Paper 
                sx={{ 
                  borderRadius: 3,
                  boxShadow: expandedQuestionId === question.id ? 4 : 2,
                  transition: 'all 0.3s ease',
                  overflow: 'hidden',
                  border: `1px solid ${expandedQuestionId === question.id ? '#e1e1e1' : 'transparent'}`
                }}
              >
                <Box sx={{ 
                  p: 3, 
                  background: expandedQuestionId === question.id ? 
                    'linear-gradient(to right, #f9fafb, #f1f4f9)' : 
                    'linear-gradient(to right, #ffffff, #f9fafb)'
                }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={8}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 'medium',
                        mb: 1,
                        color: expandedQuestionId === question.id ? '#1A2137' : 'text.primary'
                      }}>
                        {question.text}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                          <Rating 
                            value={question.averageRating || 0} 
                            precision={0.1} 
                            readOnly 
                            sx={{ mr: 1 }}
                          />
                          <Typography sx={{ fontWeight: 'bold', color: getRatingColor(question.averageRating) }}>
                            {question.averageRating ? question.averageRating.toFixed(1) : 'N/A'}
                          </Typography>
                        </Box>
                        
                        <Chip 
                          label={`${question.responses.length} responses`}
                          size="small"
                          sx={{ 
                            fontWeight: 'medium', 
                            bgcolor: 'rgba(25, 118, 210, 0.1)', 
                            color: 'primary.main',
                            mr: 1
                          }}
                        />
                        
                        {question.responses.some(r => r.notes) && (
                          <Chip 
                            icon={<ErrorIcon sx={{ fontSize: '1rem !important' }} />}
                            label="Has comments"
                            size="small"
                            sx={{ 
                              fontWeight: 'medium', 
                              bgcolor: 'rgba(156, 39, 176, 0.1)', 
                              color: 'secondary.main'
                            }}
                          />
                        )}
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                      <Button
                        variant={expandedQuestionId === question.id ? "contained" : "outlined"}
                        size="small"
                        color="primary"
                        endIcon={expandedQuestionId === question.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        onClick={() => handleToggleDetails(question.id)}
                        sx={{ 
                          borderRadius: '20px',
                          px: 2,
                          boxShadow: expandedQuestionId === question.id ? 2 : 0
                        }}
                      >
                        {expandedQuestionId === question.id ? 'Hide Details' : 'View Details'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
                
                <Collapse in={expandedQuestionId === question.id}>
                  <Box sx={{ px: 3, pt: 0, pb: 3 }}>
                    <Divider sx={{ my: 2 }} />
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>Rating Distribution</Typography>
                        <Box sx={{ mb: 1 }}>
                          {[5, 4, 3, 2, 1].map(rating => (
                            <Box key={`${question.id}-rating-${rating}`} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Box sx={{ 
                                width: 24, 
                                height: 24, 
                                borderRadius: '50%',
                                bgcolor: getRatingColor(rating),
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 1,
                                fontWeight: 'bold',
                                fontSize: '0.75rem'
                              }}>
                                {rating}
                              </Box>
                              
                              <Box sx={{ 
                                flexGrow: 1, 
                                bgcolor: '#f0f0f0', 
                                height: 12, 
                                borderRadius: 6,
                                position: 'relative',
                                overflow: 'hidden',
                                mx: 1
                              }}>
                                <Box sx={{ 
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  height: '100%',
                                  width: `${(question.ratingCounts[rating] / question.responses.length) * 100 || 0}%`,
                                  bgcolor: getRatingColor(rating),
                                  borderRadius: 6,
                                  transition: 'width 1s ease-in-out'
                                }} />
                              </Box>
                              
                              <Box sx={{ minWidth: 60, textAlign: 'right' }}>
                                <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                                  {question.ratingCounts[rating] || 0} 
                                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                    ({((question.ratingCounts[rating] / question.responses.length) * 100 || 0).toFixed(0)}%)
                                  </Typography>
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                          {renderRatingCircle(question.averageRating || 0, 80)}
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={8}>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>Response Details</Typography>
                        
                        {/* Grouped responses by rating */}
                        <Tabs
                          value={0}
                          variant="scrollable"
                          scrollButtons="auto"
                          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                        >
                          <Tab label={`All Responses (${question.responses.length})`} />
                          {[5, 4, 3, 2, 1].map(rating => {
                            const count = question.ratingCounts[rating] || 0;
                            if (count === 0) return null;
                            return (
                              <Tab 
                                key={`tab-${rating}`}
                                label={`${rating}★ (${count})`} 
                                sx={{
                                  color: getRatingColor(rating),
                                  '&.Mui-selected': { color: getRatingColor(rating) }
                                }}
                              />
                            );
                          })}
                        </Tabs>
                        
                        {/* Response list */}
                        <Box sx={{ maxHeight: 400, overflow: 'auto', pr: 1 }}>
                          {/* Group responses by rating */}
                          {[5, 4, 3, 2, 1].map(rating => {
                            const ratingResponses = question.responses.filter(r => r.rating === rating);
                            
                            if (ratingResponses.length === 0) return null;
                            
                            return (
                              <Box key={`${question.id}-responses-${rating}`} sx={{ mb: 3 }}>
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  bgcolor: `${getRatingColor(rating)}10`,
                                  color: getRatingColor(rating),
                                  p: 1,
                                  borderRadius: 1,
                                  mb: 1,
                                  fontWeight: 'bold'
                                }}>
                                  <Rating value={rating} readOnly size="small" sx={{ mr: 1 }} />
                                  <Typography variant="subtitle2">
                                    {rating} Star Ratings ({ratingResponses.length})
                                  </Typography>
                                </Box>
                                
                                <Box>
                                  {ratingResponses.map(response => (
                                    <Paper
                                      key={`${question.id}-response-${response.id}`}
                                      sx={{
                                        p: 2,
                                        mb: 1.5,
                                        borderRadius: 2,
                                        bgcolor: expandedDetails[response.id] ? '#f9f9f9' : '#fff',
                                        boxShadow: expandedDetails[response.id] ? 2 : 1,
                                        cursor: 'pointer',
                                        '&:hover': { boxShadow: 2 }
                                      }}
                                      onClick={() => handleToggleResponseDetails(response.id)}
                                    >
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: response.notes && expandedDetails[response.id] ? 1.5 : 0 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <Avatar sx={{ 
                                            mr: 1.5, 
                                            bgcolor: response.role === 'student' ? '#1565c0' : '#2e7d32',
                                            width: 32,
                                            height: 32,
                                            fontSize: '0.875rem'
                                          }}>
                                            {getFirstLetterOfName(response.user?.name || response.userName || '')}
                                          </Avatar>
                                          
                                          <Box>
                                            <Typography sx={{ fontWeight: 'medium' }}>
                                              {response.user?.name || response.userName || 'Anonymous'}
                                            </Typography>
                                            
                                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                              <Tooltip title={response.role === 'student' ? 'Student' : 'Staff'}>
                                                {response.role === 'student' ? (
                                                  <SchoolIcon fontSize="small" sx={{ mr: 0.5, color: '#1565c0' }} />
                                                ) : (
                                                  <WorkIcon fontSize="small" sx={{ mr: 0.5, color: '#2e7d32' }} />
                                                )}
                                              </Tooltip>
                                              
                                              {response.department && (
                                                <Tooltip title={response.department?.name || 'Unknown Department'}>
                                                  <ApartmentIcon fontSize="small" sx={{ mx: 0.5, color: '#9c27b0' }} />
                                                </Tooltip>
                                              )}
                                              
                                              {response.role === 'student' && response.year && (
                                                <Chip 
                                                  label={`Year ${response.year}`} 
                                                  size="small" 
                                                  sx={{ ml: 0.5, height: 20, fontSize: '0.7rem' }} 
                                                />
                                              )}
                                            </Box>
                                          </Box>
                                        </Box>
                                        
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <Rating value={response.rating} readOnly size="small" sx={{ mr: 1 }} />
                                          <KeyboardArrowRightIcon 
                                            sx={{ 
                                              transition: 'transform 0.3s',
                                              transform: expandedDetails[response.id] ? 'rotate(90deg)' : 'rotate(0deg)'
                                            }} 
                                          />
                                        </Box>
                                      </Box>
                                      
                                      {response.notes && expandedDetails[response.id] && (
                                        <Box sx={{ 
                                          mt: 2, 
                                          p: 2, 
                                          bgcolor: 'rgba(0, 0, 0, 0.02)', 
                                          borderRadius: 1, 
                                          borderLeft: `4px solid ${getRatingColor(response.rating)}`
                                        }}>
                                          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                            "{response.notes}"
                                          </Typography>
                                        </Box>
                                      )}
                                    </Paper>
                                  ))}
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Collapse>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

const Analytics = () => {
  const [departments, setDepartments] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [meetingsLoading, setMeetingsLoading] = useState(false);
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
  const [allQuestions, setAllQuestions] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
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
      fetchFeedbackStats(selectedMeetingId);
    }
  }, [selectedMeetingId]);

  // Fetch meetings
  const fetchMeetings = async () => {
    setMeetingsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/meetings', {
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

  // Fetch feedback stats for a specific meeting
  const fetchFeedbackStats = async (meetingId) => {
    if (!meetingId) return;
    
    setFeedbackLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      try {
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
      } catch (apiError) {
        console.error('API error:', apiError);
        
        // If API endpoint doesn't exist, try the fallback endpoint
        try {
          const fallbackResponse = await axios.get(`http://localhost:8080/api/feedback/meeting/${meetingId}`, {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });
      
          if (fallbackResponse.data && Array.isArray(fallbackResponse.data)) {
            // Process the raw feedback data to calculate stats
            const feedbacks = fallbackResponse.data;
            const totalResponses = feedbacks.length;
            let totalRating = 0;
            const overallRatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            
            feedbacks.forEach(feedback => {
              totalRating += feedback.rating || 0;
              overallRatingDistribution[feedback.rating] = (overallRatingDistribution[feedback.rating] || 0) + 1;
            });
            
            const stats = {
              totalResponses,
              overallAverageRating: totalResponses > 0 ? totalRating / totalResponses : 0,
              overallRatingDistribution,
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
            };
            
            setFeedbackStats(stats);
          }
        } catch (fallbackError) {
          console.error('Fallback API error:', fallbackError);
          throw apiError; // Re-throw the original error
        }
      }
    } catch (error) {
      console.error('Error fetching detailed feedback stats:', error);
      setError(error.message);
      setSnackbar({
        open: true,
        message: 'Failed to load feedback statistics: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      });
      
      // Set default empty feedback stats
      setFeedbackStats({
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

  // Analytics dashboard overview card
  const renderDashboardOverview = () => {
    return (
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3, color: '#1A2137', fontWeight: 'bold' }}>
          Executive Analytics Dashboard
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
        Executive Feedback Analysis Dashboard
      </Typography>
      
      {/* Error message if any */}
      {error && (
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: '#ffebee' }}>
          <Typography color="error" sx={{ fontWeight: 'medium' }}>
            {error}
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            size="small" 
            sx={{ mt: 2 }}
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Paper>
      )}
      
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
      
      {/* Executive Analytics Dashboard - FIRST SECTION */}
      {renderDashboardOverview()}
      
      {/* Meeting Selector */}
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, color: '#1A2137', fontWeight: 'bold' }}>
          Select Meeting to Analyze
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
        <Paper 
          sx={{ 
            p: 0, 
            mb: 4, 
            borderRadius: 3, 
            boxShadow: 3,
            overflow: 'hidden',
            background: 'linear-gradient(145deg, #f9f9f9 0%, #f0f4f8 100%)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}
        >
          <Box sx={{ 
            p: 3, 
            background: 'linear-gradient(90deg, #1A2137 0%, #2a3a5f 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Selected Meeting Statistics
              </Typography>
          </Box>
          
              
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
                
            // Get department name
            const departmentName = selectedMeeting.department?.name || 
                                  (selectedMeeting.departmentId ? 
                                    departments.find(d => d.id === selectedMeeting.departmentId)?.name : 
                                    "All Departments");
            
            // Icons for stat items
            const CalendarIcon = () => (
                  <Box sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #3f51b5 0%, #2196f3 100%)',
                boxShadow: '0 4px 8px rgba(63, 81, 181, 0.25)',
                color: 'white'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
                </svg>
              </Box>
            );
            
            const ClockIcon = () => (
              <Box sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #43a047 0%, #66bb6a 100%)',
                boxShadow: '0 4px 8px rgba(67, 160, 71, 0.25)',
                color: 'white'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
              </Box>
            );
            
            const PersonIcon = () => (
              <Box sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: roleType === 'Student' ? 
                  'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)' : 
                  'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)',
                boxShadow: roleType === 'Student' ? 
                  '0 4px 8px rgba(25, 118, 210, 0.25)' : 
                  '0 4px 8px rgba(46, 125, 50, 0.25)',
                color: 'white'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </Box>
            );
            
            const BuildingIcon = () => (
              <Box sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
                boxShadow: '0 4px 8px rgba(156, 39, 176, 0.25)',
                color: 'white'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
                </svg>
                        </Box>
            );
            
            const IdIcon = () => (
              <Box sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #ff5722 0%, #ff9800 100%)',
                boxShadow: '0 4px 8px rgba(255, 87, 34, 0.25)',
                color: 'white'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-7 2h7v12h-7V6zm-3 12H4V6h6v12zm-1-9H5v-1h4v1zm0 3H5v-1h4v1zm0 3H5v-1h4v1z"/>
                </svg>
                  </Box>
                );
                
                return (
              <Box sx={{ p: 3 }}>
                  <Box sx={{ 
                  mb: 4, 
                    p: 3,
                    borderRadius: 2,
                  background: 'linear-gradient(145deg, #ffffff 0%, #f5faff 100%)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  border: '1px solid rgba(0,0,0,0.08)'
                }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 'bold', 
                    mb: 1,
                    background: 'linear-gradient(90deg, #1A2137 0%, #2a3a5f 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                          {selectedMeeting.title || "Meeting Details"}
                        </Typography>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ 
                      p: 3, 
                      height: '100%',
                      borderRadius: 3, 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <CalendarIcon />
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            MEETING DATE
                        </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem', mb: 1 }}>
                          {formattedDate}
                        </Typography>
                          <Box 
                            component="span"
                            sx={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 'bold',
                              display: 'inline-block',
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 10,
                              bgcolor: '#e3f2fd',
                              color: '#1565c0'
                            }}
                          >
                            {new Date(meetingDate).toLocaleDateString('en-US', { weekday: 'long' })}
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                      </Grid>
                      
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ 
                      p: 3, 
                      height: '100%',
                      borderRadius: 3, 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <ClockIcon />
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            MEETING TIME
                        </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem', mb: 1 }}>
                          {startTime} - {endTime}
                        </Typography>
                        </Box>
                      </Box>
                    </Paper>
                      </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ 
                      p: 3, 
                      height: '100%',
                      borderRadius: 3, 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <PersonIcon />
                        <Box sx={{ ml: 2, width: '100%' }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            PARTICIPANT ROLE
                        </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem', mb: 1 }}>
                              {roleType}
                            </Typography>
                          <Chip 
                            label={roleType}
                            size="small"
                            sx={{ 
                              bgcolor: roleType === 'Student' ? '#e3f2fd' : '#e8f5e9',
                              color: roleType === 'Student' ? '#1565c0' : '#2e7d32',
                                fontWeight: 'bold',
                                px: 1
                            }}
                          />
                          </Box>
                          
                          {roleType === 'Student' && selectedMeeting.year && (
                            <Box sx={{ 
                              mt: 1, 
                              p: 1, 
                              borderRadius: 1, 
                              bgcolor: 'rgba(0,0,0,0.02)',
                              border: '1px dashed rgba(0,0,0,0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <Typography variant="body2" color="text.secondary">
                                Academic Year:
                            </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                Year {selectedMeeting.year}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                      </Grid>
                      
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ 
                      p: 3, 
                      height: '100%',
                      borderRadius: 3, 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <BuildingIcon />
                        <Box sx={{ ml: 2, width: '100%' }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            DEPARTMENT
                        </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem', mb: 1 }}>
                              {departmentName}
                        </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                );
              })()}
        </Paper>
      )}

      {/* Feedback Overview - Separate section */}
      {selectedMeetingId && feedbackStats.totalResponses > 0 && (
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3, color: '#1A2137', fontWeight: 'bold' }}>
            Feedback Overview
          </Typography>
              <FeedbackOverview 
                feedbackStats={feedbackStats}
              />
        </Paper>
      )}

      {/* Question Analysis - Only show if meeting is selected */}
      {selectedMeetingId && (
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
          <QuestionAnalysis 
            meetingId={selectedMeetingId} 
            allQuestions={allQuestions} 
          />
            </Paper>
          )}

      {/* Department Comparison - Only show if we have department stats */}
      {selectedMeetingId && feedbackStats.departmentStats?.length > 0 && (
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3, color: '#1A2137', fontWeight: 'bold' }}>
            Department Analysis
          </Typography>
          <DepartmentComparison 
            departmentStats={feedbackStats.departmentStats}
            loading={feedbackLoading}
          />
        </Paper>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Analytics; 