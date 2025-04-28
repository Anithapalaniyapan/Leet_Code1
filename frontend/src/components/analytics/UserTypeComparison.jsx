import React from 'react';
import { Box, Paper, Typography, Grid, Card, CardContent } from '@mui/material';
import StarRating from './StarRating';

const UserTypeComparison = ({ feedbackData }) => {
  // Define rating colors for consistent styling
  const ratingColors = {
    5: '#4CAF50', // Green
    4: '#8BC34A', // Light Green
    3: '#FFC107', // Amber
    2: '#FF9800', // Orange
    1: '#F44336'  // Red
  };

  // Function to render radial progress chart
  const renderRadialProgress = (value, maxValue, color, size = 100, thickness = 12) => {
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
            variant="h6"
            component="div" 
            sx={{ fontWeight: 'bold' }}
          >
            {value.toFixed(1)}
          </Typography>
        </Box>
      </Box>
    );
  };

  if (!feedbackData || feedbackData.length === 0) {
    return (
      <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>User Type Comparison</Typography>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">No feedback data available for user comparison</Typography>
        </Box>
      </Paper>
    );
  }
  
  // Initialize user type data
  const userTypeStats = {
    student: { type: 'Students', totalRating: 0, totalResponses: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
    staff: { type: 'Staff', totalRating: 0, totalResponses: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
    hod: { type: 'HOD', totalRating: 0, totalResponses: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
  };
  
  // Process feedback data to categorize by user type
  feedbackData.forEach(feedback => {
    const user = feedback.user;
    if (!user) return;
    
    // Determine user type based on username pattern
    let userType = 'other';
    
    // Students typically have E followed by numbers or ST prefix
    if (user.username?.match(/^E\d/) || user.username?.startsWith('ST')) {
      userType = 'student';
    } 
    // HODs typically have HOD in their username
    else if (user.username?.includes('HOD')) {
      userType = 'hod';
    }
    // Staff members typically have STAFF or don't match other patterns
    else {
      userType = 'staff';
    }
    
    // Only process the main user types we're tracking
    if (!userTypeStats[userType]) return;
    
    userTypeStats[userType].totalRating += feedback.rating;
    userTypeStats[userType].totalResponses += 1;
    userTypeStats[userType].distribution[feedback.rating] += 1;
  });
  
  // Calculate averages and convert to array
  const userTypeData = Object.values(userTypeStats).map(stats => ({
    ...stats,
    averageRating: stats.totalResponses > 0 ? stats.totalRating / stats.totalResponses : 0
  }));
  
  // Filter out user types with no responses
  const filteredUserTypeData = userTypeData.filter(data => data.totalResponses > 0);
  
  if (filteredUserTypeData.length === 0) {
    return (
      <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>User Type Comparison</Typography>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">No feedback data available for user comparison</Typography>
        </Box>
      </Paper>
    );
  }
  
  return (
    <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>User Type Comparison</Typography>
      
      <Grid container spacing={3}>
        {filteredUserTypeData.map((userData, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card sx={{ bgcolor: '#f5f5f7', p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
                {userData.type}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                {renderRadialProgress(
                  userData.averageRating,
                  5,
                  userData.averageRating >= 4 ? '#4CAF50' : 
                  userData.averageRating >= 3 ? '#FFC107' : '#F44336',
                  100,
                  12
                )}
              </Box>
              
              <Typography variant="body1" sx={{ textAlign: 'center', mb: 1 }}>
                <span style={{ fontWeight: 'bold' }}>{userData.totalResponses}</span> Responses
              </Typography>
              
              {/* Mini rating distribution */}
              <Box sx={{ display: 'flex', mt: 2, height: 30 }}>
                {[5, 4, 3, 2, 1].map(rating => {
                  const count = userData.distribution[rating] || 0;
                  const percentage = (count / userData.totalResponses) * 100;
                  
                  return (
                    <Box 
                      key={rating} 
                      title={`${rating}★: ${count} (${percentage.toFixed(1)}%)`}
                      sx={{ 
                        flexGrow: percentage || 1,
                        bgcolor: ratingColors[rating],
                        height: '100%',
                        mr: rating > 1 ? 0.5 : 0,
                        borderRadius: 1,
                        minWidth: 1
                      }}
                    />
                  );
                })}
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default UserTypeComparison; 