import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Paper, FormControl, InputLabel, 
  Select, MenuItem, CircularProgress, Fade,
  Grid, Card, CardContent, Tabs, Tab, Chip,
  Button, Collapse, Divider, List, ListItem, ListItemText,
  Avatar, Tooltip, Badge, Rating
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import StarIcon from '@mui/icons-material/Star';

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
      <Paper sx={{ p: 4, mb: 4, borderRadius: 2, bgcolor: '#ffebee' }}>
        <Typography variant="h6" color="error" sx={{ mb: 1 }}>
          Error Loading Question Analysis
        </Typography>
        <Typography variant="body1">
          {error}
        </Typography>
      </Paper>
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
    <Box sx={{ mt: 1 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 4,
        flexWrap: 'wrap'
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            Questions Analysis
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Showing {filteredQuestions.length} questions with feedback from {questions.reduce((sum, q) => sum + q.responses.length, 0)} responses
          </Typography>
        </Box>
        
        <FormControl sx={{ minWidth: 150, mt: { xs: 2, md: 0 } }}>
          <InputLabel id="filter-select-label">Filter</InputLabel>
          <Select
            labelId="filter-select-label"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            label="Filter"
            size="small"
          >
            <MenuItem value="all">All Questions</MenuItem>
            <MenuItem value="high">High Ratings (≥4)</MenuItem>
            <MenuItem value="low">Low Ratings ({'<'}3)</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* Question List */}
      <Grid container spacing={3} sx={{ maxHeight: 'none', overflow: 'visible' }}>
        {filteredQuestions.map((question) => (
          <Grid item xs={12} key={question.id}>
            <Paper sx={{ 
              p: 3, 
              borderRadius: 2, 
              boxShadow: 2,
              borderLeft: `6px solid ${getRatingColor(question.averageRating)}`
            }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'medium' }}>
                      {question.text}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      <Chip 
                        label={`${question.responses.length} responses`} 
                        size="small" 
                        sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }}
                      />
                      
                      {question.departmentName && (
                        <Chip 
                          label={question.departmentName} 
                          size="small" 
                          sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }}
                        />
                      )}
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Box sx={{ textAlign: 'center' }}>
                      {renderRatingCircle(question.averageRating)}
                      <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium', color: 'text.secondary' }}>
                        Average Rating
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', ml: 3 }}>
                      {[5, 4, 3, 2, 1].map(star => (
                        <Box key={star} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            width: '36px',
                            color: star >= 4 ? '#4CAF50' : star >= 3 ? '#FFC107' : '#F44336'
                          }}>
                            <StarIcon fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography variant="body2">{star}</Typography>
                          </Box>
                          <Box sx={{ 
                            width: '100px', 
                            height: '8px', 
                            bgcolor: '#eee', 
                            borderRadius: '4px',
                            position: 'relative',
                            overflow: 'hidden'
                          }}>
                            <Box sx={{ 
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              height: '100%',
                              width: `${(question.ratingCounts[star] / question.responses.length) * 100}%`,
                              bgcolor: star >= 4 ? '#4CAF50' : star >= 3 ? '#FFC107' : '#F44336',
                              borderRadius: '4px'
                            }} />
                          </Box>
                          <Typography variant="body2" sx={{ ml: 1, minWidth: '26px' }}>
                            {question.ratingCounts[star] || 0}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default QuestionAnalysis; 