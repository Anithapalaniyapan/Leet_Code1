import React from 'react';
import { Box, Paper, Typography, Grid, Chip, Button } from '@mui/material';
import StarRating from './StarRating';

const RecentFeedback = ({ feedbackData }) => {
  // Define rating colors for consistent styling
  const ratingColors = {
    5: '#4CAF50', // Green
    4: '#8BC34A', // Light Green
    3: '#FFC107', // Amber
    2: '#FF9800', // Orange
    1: '#F44336'  // Red
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Recent Feedback</Typography>
      
      {feedbackData.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">No feedback data available</Typography>
        </Box>
      ) : (
        <Box>
          {feedbackData.slice(0, 5).map((feedback) => (
            <Paper 
              key={feedback.id} 
              elevation={1} 
              sx={{ 
                p: 2.5, 
                mb: 2, 
                borderLeft: `4px solid ${feedback.rating >= 4 ? '#4CAF50' : feedback.rating >= 3 ? '#FFC107' : '#F44336'}`,
                '&:hover': { boxShadow: 3 }
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                    Question: {feedback.question?.text || 'N/A'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    <Chip 
                      label={`${feedback.user?.department?.name || 'Unknown Department'}`} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                    {feedback.user?.year && (
                      <Chip 
                        label={`Year ${feedback.user.year}`}
                        size="small"
                        color="info"
                      />
                    )}
                  </Box>
                  
                  {feedback.notes && (
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                      Comment: {feedback.notes}
                    </Typography>
                  )}
                </Grid>
                
                <Grid item xs={12} sm={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <StarRating rating={feedback.rating} />
                  </Box>
                  
                  <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
                    Submitted: {formatDate(feedback.submittedAt)} {new Date(feedback.submittedAt).toLocaleTimeString()}
                  </Typography>
                  
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    By: {feedback.user?.fullName || feedback.user?.username || 'Anonymous'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          ))}
          
          {feedbackData.length > 5 && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button 
                variant="outlined" 
                color="primary"
                onClick={() => {/* Could implement pagination or "View More" functionality */}}
              >
                View More Feedback
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default RecentFeedback; 