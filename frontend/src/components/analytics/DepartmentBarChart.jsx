import React from 'react';
import { Box, Paper, Typography, Tooltip, useTheme } from '@mui/material';

const DepartmentBarChart = ({ feedbackStats }) => {
  const theme = useTheme();
  
  // Define rating colors for consistent styling
  const ratingColors = {
    5: '#4CAF50', // Green
    4: '#8BC34A', // Light Green
    3: '#FFC107', // Amber
    2: '#FF9800', // Orange
    1: '#F44336'  // Red
  };

  // Function to render radial progress for response count indicator
  const renderRadialProgress = (value, maxValue, color, size = 30, thickness = 4) => {
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
            variant="caption" 
            component="div" 
            sx={{ fontSize: '0.6rem', fontWeight: 'bold' }}
          >
            {value}
          </Typography>
        </Box>
      </Box>
    );
  };

  // Filter out departments with no responses
  const departmentsWithData = feedbackStats.departmentStats?.filter(dept => dept.responses > 0) || [];
  
  if (departmentsWithData.length === 0) {
    return (
      <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Department Rating Comparison</Typography>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">No department data available</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" sx={{ mb: 4, fontWeight: 'bold' }}>Department Rating Comparison</Typography>
      
      <Box sx={{ height: 400, position: 'relative' }}>
        {/* Y-axis labels */}
        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 40, width: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', pr: 1 }}>
          <Typography variant="body2">5.0</Typography>
          <Typography variant="body2">4.0</Typography>
          <Typography variant="body2">3.0</Typography>
          <Typography variant="body2">2.0</Typography>
          <Typography variant="body2">1.0</Typography>
          <Typography variant="body2">0</Typography>
        </Box>
        
        {/* Horizontal grid lines */}
        <Box sx={{ position: 'absolute', left: 40, right: 0, top: 0, bottom: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {[0, 1, 2, 3, 4, 5].map((value) => (
            <Box key={value} sx={{ borderBottom: '1px dashed #e0e0e0', height: 1 }} />
          ))}
        </Box>
        
        {/* Bars */}
        <Box sx={{ position: 'absolute', left: 40, right: 0, top: 0, bottom: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', pt: 2 }}>
          {departmentsWithData.map((dept) => {
            const rating = parseFloat(dept.averageRating);
            const ratingColor = 
              rating >= 4.5 ? ratingColors[5] : 
              rating >= 3.5 ? ratingColors[4] : 
              rating >= 2.5 ? ratingColors[3] : 
              rating >= 1.5 ? ratingColors[2] : 
              ratingColors[1];
            
            return (
              <Box key={dept.departmentId} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: `${100 / departmentsWithData.length}%` }}>
                <Box 
                  sx={{ 
                    width: '70%', 
                    height: `${(rating / 5) * 100}%`, 
                    bgcolor: ratingColor,
                    transition: 'height 0.5s ease-in-out, transform 0.2s ease-in-out',
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                    position: 'relative',
                    '&:hover': { 
                      opacity: 0.8,
                      transform: 'scaleX(1.1)'
                    },
                    minHeight: '5px',
                    // Add gradient overlay for 3D effect
                    backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.2), rgba(255,255,255,0), rgba(0,0,0,0.1))',
                    // Add box shadow for depth
                    boxShadow: '0 3px 5px rgba(0,0,0,0.1)'
                  }}
                >
                  <Tooltip title={`${dept.departmentName}: ${rating.toFixed(2)}`}>
                    <Typography 
                      sx={{ 
                        position: 'absolute', 
                        top: -25,
                        left: 0,
                        right: 0,
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '0.8rem'
                      }}
                    >
                      {rating.toFixed(1)}
                    </Typography>
                  </Tooltip>
                </Box>
                
                {/* Add small radial chart showing response count */}
                <Box sx={{ mt: 2, position: 'relative', height: 30, width: 30 }}>
                  {renderRadialProgress(
                    dept.responses,
                    Math.max(...departmentsWithData.map(d => d.responses)),
                    ratingColor,
                    30,
                    4
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
        
        {/* X-axis labels */}
        <Box sx={{ position: 'absolute', left: 40, right: 0, bottom: 0, height: 40, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start' }}>
          {departmentsWithData.map((dept) => (
            <Typography 
              key={dept.departmentId} 
              variant="body2" 
              sx={{ 
                width: `${100 / departmentsWithData.length}%`, 
                textAlign: 'center',
                fontSize: '0.75rem',
                pt: 1,
                px: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              <Tooltip title={`${dept.departmentName} (${dept.responses} responses)`}>
                <span>{dept.departmentName}</span>
              </Tooltip>
            </Typography>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default DepartmentBarChart; 