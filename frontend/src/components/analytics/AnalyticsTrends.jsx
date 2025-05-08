import React from 'react';
import { Box, Typography, Paper, Card, CardContent, Grid, Tooltip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

const AnalyticsTrends = ({ feedbackStats, selectedMeeting, previousMeetingStats }) => {
  // Define colors for trending indicators
  const trendColors = {
    up: '#4CAF50',    // Green for positive trends
    down: '#F44336',  // Red for negative trends
    neutral: '#FFC107' // Amber for neutral/minimal change
  };

  // Function to calculate trend between current and previous values
  const calculateTrend = (current, previous) => {
    if (!previous || !current) return { direction: 'neutral', percentage: 0 };
    
    const diff = current - previous;
    const percentChange = previous !== 0 ? (diff / previous) * 100 : 0;
    
    return {
      direction: diff > 0.1 ? 'up' : diff < -0.1 ? 'down' : 'neutral',
      percentage: Math.abs(percentChange).toFixed(1)
    };
  };

  // Function to render trend indicator
  const renderTrendIndicator = (trend) => {
    const { direction, percentage } = trend;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
        {direction === 'up' ? (
          <TrendingUpIcon sx={{ color: trendColors.up }} />
        ) : direction === 'down' ? (
          <TrendingDownIcon sx={{ color: trendColors.down }} />
        ) : (
          <TrendingFlatIcon sx={{ color: trendColors.neutral }} />
        )}
        
        <Typography 
          variant="caption" 
          sx={{ 
            ml: 0.5, 
            color: trendColors[direction],
            fontWeight: 'bold'
          }}
        >
          {percentage}%
        </Typography>
      </Box>
    );
  };

  // Calculate trends
  const ratingTrend = calculateTrend(
    feedbackStats.overallAverageRating,
    previousMeetingStats?.overallAverageRating
  );
  
  const responseTrend = calculateTrend(
    feedbackStats.totalResponses,
    previousMeetingStats?.totalResponses
  );
  
  // Calculate top improved and declined questions
  const questionTrends = [];
  
  if (previousMeetingStats?.questionStats && feedbackStats.questionStats) {
    // Map previous question ratings for easy lookup
    const prevQuestionRatings = {};
    previousMeetingStats.questionStats.forEach(q => {
      prevQuestionRatings[q.questionId] = q.averageRating;
    });
    
    // Calculate trends for each question
    feedbackStats.questionStats?.forEach(question => {
      const prevRating = prevQuestionRatings[question.questionId];
      if (prevRating) {
        questionTrends.push({
          questionId: question.questionId,
          questionText: question.questionText,
          currentRating: question.averageRating,
          previousRating: prevRating,
          change: question.averageRating - prevRating,
          percentChange: ((question.averageRating - prevRating) / prevRating) * 100
        });
      }
    });
    
    // Sort by change amount
    questionTrends.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }
  
  // Extract most improved and most declined
  const mostImproved = questionTrends.filter(q => q.change > 0).slice(0, 3);
  const mostDeclined = questionTrends.filter(q => q.change < 0).slice(0, 3);

  return (
    <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Analytics Trends</Typography>
      
      {(!previousMeetingStats || Object.keys(previousMeetingStats).length === 0) ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Trend analysis requires data from at least two meetings.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Trend summary cards */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', bgcolor: '#f5f5f7' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Overall Rating Trend
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {parseFloat(feedbackStats.overallAverageRating).toFixed(1)}
                  </Typography>
                  {renderTrendIndicator(ratingTrend)}
                  
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                    vs. {parseFloat(previousMeetingStats?.overallAverageRating).toFixed(1)} previously
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  {ratingTrend.direction === 'up' 
                    ? 'Overall rating has improved compared to the previous meeting.'
                    : ratingTrend.direction === 'down'
                    ? 'Overall rating has decreased compared to the previous meeting.'
                    : 'Overall rating is consistent with the previous meeting.'
                  }
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', bgcolor: '#f5f5f7' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Response Rate Trend
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {feedbackStats.totalResponses}
                  </Typography>
                  {renderTrendIndicator(responseTrend)}
                  
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                    vs. {previousMeetingStats?.totalResponses} previously
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  {responseTrend.direction === 'up' 
                    ? 'Participation has increased compared to the previous meeting.'
                    : responseTrend.direction === 'down'
                    ? 'Participation has decreased compared to the previous meeting.'
                    : 'Participation rate is consistent with the previous meeting.'
                  }
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Most improved questions */}
          {mostImproved.length > 0 && (
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', bgcolor: '#f5f5f7' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: trendColors.up }}>
                    Most Improved Questions
                  </Typography>
                  
                  {mostImproved.map((question, index) => (
                    <Box key={`improved-${question.questionId}`} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Tooltip title={question.questionText}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: '80%' }}>
                            {index + 1}. {question.questionText}
                          </Typography>
                        </Tooltip>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {question.currentRating.toFixed(1)}
                          </Typography>
                          <TrendingUpIcon sx={{ color: trendColors.up, fontSize: '1rem', ml: 0.5 }} />
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Previous: {question.previousRating.toFixed(1)}
                        </Typography>
                        <Typography variant="caption" sx={{ ml: 1, color: trendColors.up, fontWeight: 'bold' }}>
                          (+{question.change.toFixed(1)})
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                  
                  {mostImproved.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No improved questions to display.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
          
          {/* Most declined questions */}
          {mostDeclined.length > 0 && (
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', bgcolor: '#f5f5f7' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: trendColors.down }}>
                    Questions Needing Attention
                  </Typography>
                  
                  {mostDeclined.map((question, index) => (
                    <Box key={`declined-${question.questionId}`} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Tooltip title={question.questionText}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: '80%' }}>
                            {index + 1}. {question.questionText}
                          </Typography>
                        </Tooltip>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {question.currentRating.toFixed(1)}
                          </Typography>
                          <TrendingDownIcon sx={{ color: trendColors.down, fontSize: '1rem', ml: 0.5 }} />
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Previous: {question.previousRating.toFixed(1)}
                        </Typography>
                        <Typography variant="caption" sx={{ ml: 1, color: trendColors.down, fontWeight: 'bold' }}>
                          ({question.change.toFixed(1)})
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                  
                  {mostDeclined.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No declined questions to display.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </Paper>
  );
};

export default AnalyticsTrends; 