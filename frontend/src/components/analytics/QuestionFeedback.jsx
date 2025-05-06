import React from 'react';
import { Box, Paper, Typography, Grid, Card, CardContent, CircularProgress, Chip, LinearProgress, Divider, List, ListItem, ListItemText } from '@mui/material';
import StarRating from './StarRating';

const QuestionFeedback = ({ questionFeedback, questionFeedbackLoading, selectedQuestionId, allQuestions }) => {
  if (!selectedQuestionId) {
    return (
      <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Question-Specific Feedback</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
          Select a question from the dropdown above to view its feedback details.
        </Typography>
      </Paper>
    );
  }

  const selectedQuestion = allQuestions.find(q => q.id === parseInt(selectedQuestionId));
  const questionText = selectedQuestion ? selectedQuestion.text : `Question ${selectedQuestionId}`;

  // Define rating colors for consistent styling
  const ratingColors = {
    5: '#4CAF50', // Green
    4: '#8BC34A', // Light Green
    3: '#FFC107', // Amber
    2: '#FF9800', // Orange
    1: '#F44336'  // Red
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <Paper id="question-feedback-section" sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Feedback for Question</Typography>
      
      <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f7', borderRadius: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {questionText}
        </Typography>
        {selectedQuestion && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            <Chip 
              label={selectedQuestion.department?.name || 'Unknown Department'} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
            {selectedQuestion.year && (
              <Chip 
                label={`Year ${selectedQuestion.year}`} 
                size="small" 
                color="secondary"
              />
            )}
            <Chip 
              label={selectedQuestion.role || 'Not specified'} 
              size="small" 
              color="info"
            />
          </Box>
        )}
      </Box>
      
      {questionFeedbackLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Total Responses
                  </Typography>
                  <Typography variant="h3" sx={{ color: '#1976d2' }}>
                    {questionFeedback.totalResponses}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Average Rating
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <StarRating rating={parseFloat(questionFeedback.averageRating) || 0} size="large" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', p: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}>
                    Rating Distribution
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {Object.entries(questionFeedback.ratingDistribution || {}).map(([rating, count]) => (
                      <Box key={rating} sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ width: 30 }}>{rating}★</Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={(count / questionFeedback.totalResponses || 0) * 100}
                          sx={{ 
                            flexGrow: 1, 
                            mx: 1, 
                            height: 8, 
                            borderRadius: 5,
                            bgcolor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: rating === '5' ? ratingColors[5] : 
                                      rating === '4' ? ratingColors[4] : 
                                      rating === '3' ? ratingColors[3] : 
                                      rating === '2' ? ratingColors[2] : ratingColors[1]
                            }
                          }} 
                        />
                        <Typography>{count}</Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Individual Responses
          </Typography>
          
          {questionFeedback.feedback && questionFeedback.feedback.length > 0 ? (
            <List sx={{ bgcolor: '#f5f5f7', borderRadius: 1 }}>
              {questionFeedback.feedback.map((feedback, index) => (
                <React.Fragment key={feedback.id || index}>
                  <ListItem 
                    alignItems="flex-start" 
                    sx={{ 
                      py: 2,
                      px: 2,
                      borderLeft: `4px solid ${
                        feedback.rating >= 4 ? ratingColors[5] : 
                        feedback.rating >= 3 ? ratingColors[3] : 
                        ratingColors[1]
                      }`,
                      mb: 1,
                      bgcolor: 'white',
                      borderRadius: '0 4px 4px 0',
                      boxShadow: 1
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                              {feedback.user?.fullName || feedback.user?.username || 'Anonymous User'}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                              {feedback.user?.department?.name && (
                                <Chip 
                                  label={feedback.user.department.name} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                />
                              )}
                              {feedback.user?.year && (
                                <Chip 
                                  label={`Year ${feedback.user.year}`}
                                  size="small"
                                  color="info"
                                />
                              )}
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <StarRating rating={feedback.rating} size="small" />
                            <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary' }}>
                              {formatDate(feedback.submittedAt)}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      secondary={
                        feedback.notes ? (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="textSecondary" component="span">
                              {feedback.notes}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                            No comments provided
                          </Typography>
                        )
                      }
                    />
                  </ListItem>
                  {index < questionFeedback.feedback.length - 1 && <Box sx={{ my: 1 }} />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f5f5f7', borderRadius: 1 }}>
              <Typography variant="body1" color="text.secondary">
                No individual feedback responses available for this question.
              </Typography>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

export default QuestionFeedback; 