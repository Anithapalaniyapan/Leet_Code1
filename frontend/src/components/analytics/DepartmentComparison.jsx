import React from 'react';
import { Box, Paper, Typography, Grid, Card, Tooltip, Chip } from '@mui/material';
import StarRating from './StarRating';

const DepartmentComparison = ({ feedbackStats }) => {
  // Define rating colors for consistent styling
  const ratingColors = {
    5: '#4CAF50', // Green
    4: '#8BC34A', // Light Green
    3: '#FFC107', // Amber
    2: '#FF9800', // Orange
    1: '#F44336'  // Red
  };

  // Function to render radial progress chart for department metrics
  const renderRadialProgress = (value, maxValue, color, size = 120, thickness = 12) => {
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
            variant={size > 70 ? "h6" : "body1"} 
            component="div" 
            sx={{ fontWeight: 'bold' }}
          >
            {value}
          </Typography>
        </Box>
      </Box>
    );
  };

  // Function to render a comprehensive dashboard card for department
  const renderDepartmentDashboardCard = (dept) => {
    if (!dept) return null;
    
    const averageRating = parseFloat(dept.averageRating) || 0;
    const ratingColor = 
      averageRating >= 4.5 ? ratingColors[5] : 
      averageRating >= 3.5 ? ratingColors[4] : 
      averageRating >= 2.5 ? ratingColors[3] : 
      averageRating >= 1.5 ? ratingColors[2] : 
      ratingColors[1];
    
    return (
      <Card sx={{ mb: 2, borderRadius: 2, boxShadow: 2 }}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom noWrap sx={{ fontWeight: 'bold' }}>
                {dept.departmentName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ mr: 1 }}>Average Rating:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <StarRating rating={averageRating} />
                </Box>
              </Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Total Responses: <strong>{dept.responses}</strong>
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {Object.entries(dept.ratingDistribution || {}).map(([rating, count]) => (
                  count > 0 && (
                    <Chip 
                      key={`chip-${dept.departmentId}-${rating}`}
                      label={`${rating}★: ${count}`}
                      size="small"
                      sx={{ 
                        bgcolor: `${ratingColors[rating]}20`, 
                        color: ratingColors[rating],
                        fontWeight: 'bold',
                        border: `1px solid ${ratingColors[rating]}`
                      }}
                    />
                  )
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {dept.responses > 0 ? (
                <Box sx={{ position: 'relative', height: 120, width: 120 }}>
                  {renderRadialProgress(
                    parseFloat(dept.averageRating).toFixed(1), 
                    5, 
                    ratingColor, 
                    120, 
                    12
                  )}
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      position: 'absolute', 
                      bottom: -20, 
                      left: 0, 
                      width: '100%', 
                      textAlign: 'center',
                      color: 'text.secondary'
                    }}
                  >
                    out of 5 stars
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No data available
                </Typography>
              )}
            </Grid>
          </Grid>
        </Box>
      </Card>
    );
  };

  // Function to render a horizontal stacked bar chart for department comparison
  const renderDepartmentStackedBarChart = () => {
    const departmentsWithData = feedbackStats.departmentStats?.filter(dept => dept.responses > 0) || [];
    
    if (departmentsWithData.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">No department data available</Typography>
        </Box>
      );
    }
    
    // Sort departments by average rating
    const sortedDepartments = [...departmentsWithData].sort((a, b) => 
      parseFloat(b.averageRating) - parseFloat(a.averageRating)
    );
    
    return (
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Department Rating Distribution
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          {sortedDepartments.map(dept => {
            // Calculate percentages for each rating
            const totalResponses = dept.responses;
            const distribution = dept.ratingDistribution || {};
            
            // Create array of rating segments
            const ratingSegments = [5, 4, 3, 2, 1].map(rating => {
              const count = distribution[rating] || 0;
              const percentage = totalResponses > 0 ? (count / totalResponses) * 100 : 0;
              return { rating, count, percentage };
            }).filter(segment => segment.count > 0);
            
            return (
              <Box key={dept.departmentId} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Typography sx={{ minWidth: 150, mr: 2 }} noWrap>
                    {dept.departmentName}
                  </Typography>
                  <Typography variant="body2" sx={{ mr: 2, color: 'text.secondary' }}>
                    {parseFloat(dept.averageRating).toFixed(1)}★
                  </Typography>
                  <Box sx={{ display: 'flex', flexGrow: 1, height: 30, borderRadius: 1, overflow: 'hidden' }}>
                    {ratingSegments.map(segment => (
                      <Tooltip 
                        key={`segment-${dept.departmentId}-${segment.rating}`}
                        title={`${segment.rating}★: ${segment.count} (${segment.percentage.toFixed(1)}%)`}
                      >
                        <Box 
                          sx={{ 
                            width: `${segment.percentage}%`, 
                            bgcolor: ratingColors[segment.rating],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s',
                            '&:hover': {
                              opacity: 0.8,
                              transform: 'scaleY(1.1)'
                            }
                          }} 
                        >
                          {segment.percentage > 10 && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: '#fff',
                                textShadow: '0px 1px 2px rgba(0,0,0,0.5)',
                                fontWeight: 'bold' 
                              }}
                            >
                              {segment.percentage > 20 ? `${segment.rating}★` : ''}
                            </Typography>
                          )}
                        </Box>
                      </Tooltip>
                    ))}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', ml: 'auto', width: 'calc(100% - 190px)' }}>
                  <Typography variant="caption" sx={{ width: '100%', textAlign: 'left' }}>
                    0%
                  </Typography>
                  <Typography variant="caption" sx={{ width: '100%', textAlign: 'right' }}>
                    100%
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
        
        {/* Legend */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, mt: 2 }}>
          {[5, 4, 3, 2, 1].map(rating => (
            <Box key={`legend-${rating}`} sx={{ display: 'flex', alignItems: 'center', mx: 1 }}>
              <Box sx={{ 
                width: 12, 
                height: 12, 
                bgcolor: ratingColors[rating], 
                mr: 0.5, 
                borderRadius: 1 
              }} />
              <Typography variant="caption">
                {rating}★
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" sx={{ mb: 4, fontWeight: 'bold' }}>Department Performance</Typography>
      
      {/* Enhanced visualization with stacked bar charts */}
      {renderDepartmentStackedBarChart()}
      
      <Box sx={{ my: 4, borderTop: '1px dashed #e0e0e0', pt: 4 }} />
      
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>Department Details</Typography>
      
      <Grid container spacing={3}>
        {feedbackStats.departmentStats?.map((dept) => (
          <Grid item xs={12} md={6} key={dept.departmentId}>
            {renderDepartmentDashboardCard(dept)}
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default DepartmentComparison; 