import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const TrendAnalysis = ({ feedbackData }) => {
  // Process real data from feedbackData to get trend data by month
  const trendData = [];
  
  if (!feedbackData || feedbackData.length === 0) {
    return (
      <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Feedback Trends Over Time</Typography>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">No feedback data available to generate trends</Typography>
        </Box>
      </Paper>
    );
  }
  
  // Process feedbackData to get trend data
  const monthData = {};
  
  // Group feedback by month
  feedbackData.forEach(feedback => {
    if (!feedback.submittedAt) return;
    
    const date = new Date(feedback.submittedAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleString('default', { month: 'short' });
    
    if (!monthData[monthKey]) {
      monthData[monthKey] = {
        month: monthLabel,
        totalRating: 0,
        count: 0,
        monthKey: monthKey
      };
    }
    
    monthData[monthKey].totalRating += feedback.rating;
    monthData[monthKey].count += 1;
  });
  
  // Calculate averages and convert to array
  Object.values(monthData).forEach(data => {
    data.average = data.count > 0 ? data.totalRating / data.count : 0;
    trendData.push(data);
  });
  
  // Sort by month
  trendData.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  
  // Limit to last 6 months if we have more data
  const displayData = trendData.slice(-6);
  
  const maxResponses = Math.max(...displayData.map(item => item.count), 1);
  
  return (
    <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Feedback Trends Over Time</Typography>
      
      <Box sx={{ height: 350, position: 'relative', mt: 4 }}>
        {/* Y-axis labels for average rating */}
        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 40, width: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', pr: 1 }}>
          <Typography variant="body2" color="primary">5.0</Typography>
          <Typography variant="body2" color="primary">4.0</Typography>
          <Typography variant="body2" color="primary">3.0</Typography>
          <Typography variant="body2" color="primary">2.0</Typography>
          <Typography variant="body2" color="primary">1.0</Typography>
          <Typography variant="body2" color="primary">0</Typography>
        </Box>
        
        {/* Y-axis labels for response count */}
        <Box sx={{ position: 'absolute', right: 0, top: 0, bottom: 40, width: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start', pl: 1 }}>
          <Typography variant="body2" color="secondary">{maxResponses}</Typography>
          <Typography variant="body2" color="secondary">{Math.round(maxResponses * 0.8)}</Typography>
          <Typography variant="body2" color="secondary">{Math.round(maxResponses * 0.6)}</Typography>
          <Typography variant="body2" color="secondary">{Math.round(maxResponses * 0.4)}</Typography>
          <Typography variant="body2" color="secondary">{Math.round(maxResponses * 0.2)}</Typography>
          <Typography variant="body2" color="secondary">0</Typography>
        </Box>
        
        {/* Horizontal grid lines */}
        <Box sx={{ position: 'absolute', left: 40, right: 40, top: 0, bottom: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {[0, 1, 2, 3, 4, 5].map((value) => (
            <Box key={value} sx={{ borderBottom: '1px dashed #e0e0e0', height: 1 }} />
          ))}
        </Box>
        
        {/* Line chart for average rating */}
        <Box sx={{ position: 'absolute', left: 40, right: 40, top: 0, bottom: 40, display: 'flex', alignItems: 'flex-end' }}>
          <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
            {displayData.length > 1 && (
              <>
                {/* Line for average rating */}
                <path
                  d={`M ${100 / displayData.length / 2}% ${100 - (displayData[0].average / 5) * 100}% ${displayData.map((item, index) => 
                    `L ${(index + 0.5) * (100 / displayData.length)}% ${100 - (item.average / 5) * 100}%`
                  ).join(' ')}`}
                  fill="none"
                  stroke="#1976d2"
                  strokeWidth="3"
                />
                
                {/* Line for response count */}
                <path
                  d={`M ${100 / displayData.length / 2}% ${100 - (displayData[0].count / maxResponses) * 100}% ${displayData.map((item, index) => 
                    `L ${(index + 0.5) * (100 / displayData.length)}% ${100 - (item.count / maxResponses) * 100}%`
                  ).join(' ')}`}
                  fill="none"
                  stroke="#9c27b0"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                />
              </>
            )}
            
            {/* Dots for average rating */}
            {displayData.map((item, index) => (
              <circle
                key={`avg-${index}`}
                cx={`${(index + 0.5) * (100 / displayData.length)}%`}
                cy={`${100 - (item.average / 5) * 100}%`}
                r="5"
                fill="#1976d2"
              />
            ))}
            
            {/* Dots for response count */}
            {displayData.map((item, index) => (
              <circle
                key={`resp-${index}`}
                cx={`${(index + 0.5) * (100 / displayData.length)}%`}
                cy={`${100 - (item.count / maxResponses) * 100}%`}
                r="5"
                fill="#9c27b0"
              />
            ))}
          </svg>
        </Box>
        
        {/* X-axis labels */}
        <Box sx={{ position: 'absolute', left: 40, right: 40, bottom: 0, height: 40, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start' }}>
          {displayData.map((item, index) => (
            <Typography key={index} variant="body2" sx={{ textAlign: 'center', pt: 1 }}>
              {item.month}
            </Typography>
          ))}
        </Box>
      </Box>
      
      {/* Legend */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 12, height: 12, bgcolor: '#1976d2', borderRadius: '50%', mr: 1 }} />
          <Typography variant="body2">Average Rating</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 12, height: 12, bgcolor: '#9c27b0', borderRadius: '50%', mr: 1 }} />
          <Typography variant="body2">Response Count</Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default TrendAnalysis; 