import React from 'react';
import { Grid, Box, Paper, Typography, Card, CardContent, LinearProgress } from '@mui/material';
import StarRating from './StarRating';

const FeedbackOverview = ({ feedbackStats }) => {
  // Define rating colors for consistent styling
  const ratingColors = {
    5: '#4CAF50', // Green
    4: '#8BC34A', // Light Green
    3: '#FFC107', // Amber
    2: '#FF9800', // Orange
    1: '#F44336'  // Red
  };

  // Function to render a pie chart for rating distribution
  const renderRatingPieChart = (ratingDistribution = {}, totalResponses = 0, size = 180) => {
    if (!totalResponses) return null;
    
    const pieData = Object.entries(ratingDistribution).map(([rating, count]) => ({
      rating: parseInt(rating),
      count,
      percentage: (count / totalResponses) * 100
    })).filter(item => item.count > 0);
    
    // Sort by rating in descending order
    pieData.sort((a, b) => b.rating - a.rating);
    
    // Calculate stroke dasharray and offset for each segment
    let cumulativePercentage = 0;
    const circumference = 2 * Math.PI * 70; // Radius is 70
    
    pieData.forEach(item => {
      item.dashArray = (item.percentage / 100) * circumference;
      item.dashOffset = ((100 - cumulativePercentage) / 100) * circumference;
      cumulativePercentage += item.percentage;
    });
    
    return (
      <Box sx={{ position: 'relative', width: size, height: size, mx: 'auto' }}>
        {/* Background circle */}
        <Box 
          component="svg" 
          viewBox="0 0 180 180" 
          sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
        >
          <circle 
            cx="90" 
            cy="90" 
            r="70" 
            fill="none" 
            stroke="#f0f0f0" 
            strokeWidth="20" 
          />
        </Box>
        
        {/* Pie segments */}
        <Box 
          component="svg" 
          viewBox="0 0 180 180" 
          sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
        >
          {pieData.map((item, index) => (
            <circle 
              key={`pie-${item.rating}`}
              cx="90" 
              cy="90" 
              r="70" 
              fill="none" 
              stroke={ratingColors[item.rating]} 
              strokeWidth="20" 
              strokeDasharray={`${item.dashArray} ${circumference}`}
              strokeDashoffset={item.dashOffset}
              style={{ transition: 'all 0.5s ease-in-out' }}
            />
          ))}
        </Box>
            
        {/* Center text */}
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {totalResponses}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Responses
          </Typography>
        </Box>
        
        {/* Legend */}
        <Box sx={{ 
          position: 'absolute', 
          top: '100%', 
          left: 0, 
          width: '100%', 
          mt: 2,
          display: 'flex', 
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 1
        }}>
          {pieData.map(item => (
            <Box key={`legend-${item.rating}`} sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
              <Box sx={{ 
                width: 12, 
                height: 12, 
                bgcolor: ratingColors[item.rating], 
                mr: 0.5, 
                borderRadius: '50%' 
              }} />
              <Typography variant="caption">
                {item.rating}★: {item.count} ({item.percentage.toFixed(1)}%)
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  // Function to render radial progress chart
  const renderRadialProgress = (value, maxValue, color, size = 150, thickness = 15) => {
    const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
    const circumference = 2 * Math.PI * ((size - thickness) / 2);
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference * (1 - percentage / 100);
    
    return (
      <Box sx={{ position: 'relative', width: size, height: size, mx: 'auto' }}>
        {/* Background circle */}
        <Box 
          component="svg" 
          viewBox={`0 0 ${size} ${size}`}
          sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
        >
          <circle 
            cx={size / 2} 
            cy={size / 2} 
            r={(size - thickness) / 2} 
            fill="none" 
            stroke="#f0f0f0" 
            strokeWidth={thickness} 
          />
        </Box>
        
        {/* Progress circle */}
        <Box 
          component="svg" 
          viewBox={`0 0 ${size} ${size}`}
          sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
        >
          <circle 
            cx={size / 2} 
            cy={size / 2} 
            r={(size - thickness) / 2} 
            fill="none" 
            stroke={color} 
            strokeWidth={thickness} 
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
        </Box>
        
        {/* Content */}
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Typography 
            variant="h4" 
            component="div" 
            sx={{ fontWeight: 'bold' }}
          >
            {value.toFixed(1)}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Feedback Overview</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, bgcolor: '#f5f5f7' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1A2137' }}>Total Responses</Typography>
            {/* Render pie chart for rating distribution */}
            {renderRatingPieChart(feedbackStats.overallRatingDistribution, feedbackStats.totalResponses)}
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 3, bgcolor: '#f5f5f7' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1A2137' }}>Overall Rating</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Render radial progress */}
              {renderRadialProgress(
                parseFloat(feedbackStats.overallAverageRating),
                5, 
                parseFloat(feedbackStats.overallAverageRating) >= 4 ? '#4CAF50' : 
                parseFloat(feedbackStats.overallAverageRating) >= 3 ? '#FFC107' : '#F44336',
                150,
                15
              )}
              <Box sx={{ mt: 2 }}>
                <StarRating rating={parseFloat(feedbackStats.overallAverageRating)} size="large" />
              </Box>
            </Box>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', p: 3, bgcolor: '#f5f5f7' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1A2137', textAlign: 'center' }}>Rating Distribution</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {Object.entries(feedbackStats.overallRatingDistribution || {}).map(([rating, count]) => (
                <Box key={rating} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ width: 30 }}>{rating}★</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(count / feedbackStats.totalResponses || 0) * 100}
                    sx={{ 
                      flexGrow: 1, 
                      mx: 1, 
                      height: 10, 
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
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default FeedbackOverview; 