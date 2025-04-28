import React from 'react';
import { Box, Paper, Typography, Tooltip } from '@mui/material';

const FeedbackHeatmap = ({ departments, allQuestions, feedbackData }) => {
  // Use real departments and questions data
  if (!departments || departments.length === 0 || !allQuestions || allQuestions.length === 0 || !feedbackData || feedbackData.length === 0) {
    return (
      <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Feedback Heatmap</Typography>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">Insufficient data to generate heatmap</Typography>
        </Box>
      </Paper>
    );
  }
  
  // Get active departments
  const activeDepartments = departments.filter(dept => dept.active !== false).slice(0, 5);
  
  // Get the most common question categories
  const questionCategories = {};
  allQuestions.forEach(question => {
    // Create a simplified category from the question text (use first few words)
    const category = question.text.split(' ').slice(0, 2).join(' ');
    
    if (!questionCategories[category]) {
      questionCategories[category] = {
        category: category,
        questions: [],
        count: 0
      };
    }
    
    questionCategories[category].questions.push(question);
    questionCategories[category].count += 1;
  });
  
  // Sort categories by frequency and take top 5
  const topCategories = Object.values(questionCategories)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(cat => cat.category);
  
  // Prepare heatmap data structure
  const heatmapData = activeDepartments.map(dept => {
    // Filter feedback for this department
    const deptFeedback = feedbackData.filter(feedback => 
      feedback.user?.departmentId === dept.id || 
      feedback.question?.department?.id === dept.id
    );
    
    // Calculate ratings for each category
    const categoryRatings = topCategories.map(category => {
      // Find questions in this category
      const categoryQuestions = allQuestions.filter(q => 
        q.text.startsWith(category) || q.text.includes(category)
      ).map(q => q.id);
      
      // Filter feedback for these questions
      const categoryFeedback = deptFeedback.filter(feedback => 
        categoryQuestions.includes(feedback.questionId)
      );
      
      // Calculate average rating
      let totalRating = 0;
      let count = 0;
      
      categoryFeedback.forEach(feedback => {
        totalRating += feedback.rating;
        count += 1;
      });
      
      return {
        question: category,
        rating: count > 0 ? (totalRating / count) : 0
      };
    });
    
    return {
      department: dept.name,
      ratings: categoryRatings
    };
  });
  
  // Filter out departments with no ratings
  const filteredHeatmapData = heatmapData.filter(dept => 
    dept.ratings.some(r => r.rating > 0)
  );
  
  const getColorForRating = (rating) => {
    if (rating === 0) return '#f5f5f5'; // No data
    if (rating >= 4.5) return '#1b5e20'; // Dark green
    if (rating >= 4.0) return '#388e3c'; // Green
    if (rating >= 3.5) return '#7cb342'; // Light green
    if (rating >= 3.0) return '#fdd835'; // Yellow
    if (rating >= 2.5) return '#fb8c00'; // Orange
    return '#e53935'; // Red
  };
  
  if (filteredHeatmapData.length === 0) {
    return (
      <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Feedback Heatmap</Typography>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">Insufficient feedback data to generate heatmap</Typography>
        </Box>
      </Paper>
    );
  }
  
  return (
    <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Feedback Heatmap</Typography>
      <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
        Average rating by department and question category
      </Typography>
      
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ minWidth: 600, display: 'grid', gridTemplateColumns: `auto repeat(${topCategories.length}, 1fr)`, gap: 1 }}>
          {/* Header row with question names */}
          <Box sx={{ gridColumn: '1', p: 1 }}></Box>
          {topCategories.map((category, index) => (
            <Box 
              key={index} 
              sx={{ 
                p: 1, 
                textAlign: 'center', 
                fontWeight: 'bold',
                bgcolor: '#f5f5f7',
                borderRadius: 1
              }}
            >
              {category}
            </Box>
          ))}
          
          {/* Data rows with department names and ratings */}
          {filteredHeatmapData.map((dept, deptIndex) => (
            <React.Fragment key={deptIndex}>
              <Box 
                sx={{ 
                  p: 1, 
                  fontWeight: 'bold',
                  bgcolor: '#f5f5f7',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {dept.department}
              </Box>
              
              {dept.ratings.map((item, ratingIndex) => (
                <Tooltip 
                  key={ratingIndex}
                  title={`${dept.department} - ${topCategories[ratingIndex]}: ${item.rating > 0 ? item.rating.toFixed(1) : 'No data'}`}
                >
                  <Box 
                    sx={{ 
                      p: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: getColorForRating(item.rating),
                      color: item.rating === 0 ? '#999' : 'white',
                      borderRadius: 1,
                      height: '100%',
                      fontWeight: 'bold',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        cursor: 'pointer'
                      }
                    }}
                  >
                    {item.rating > 0 ? item.rating.toFixed(1) : 'N/A'}
                  </Box>
                </Tooltip>
              ))}
            </React.Fragment>
          ))}
        </Box>
      </Box>
      
      {/* Legend */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, flexWrap: 'wrap', gap: 2 }}>
        {[4.5, 4.0, 3.5, 3.0, 2.5, 2.0].map((rating, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                width: 16, 
                height: 16, 
                bgcolor: getColorForRating(rating),
                mr: 1,
                borderRadius: '2px'
              }} 
            />
            <Typography variant="body2">
              {index === 0 ? `≥ ${rating}` : index === 5 ? `< ${rating}` : `${rating} - ${4.5 - index * 0.5}`}
            </Typography>
          </Box>
        ))}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box 
            sx={{ 
              width: 16, 
              height: 16, 
              bgcolor: '#f5f5f5',
              mr: 1,
              borderRadius: '2px',
              border: '1px solid #ddd'
            }} 
          />
          <Typography variant="body2">No data</Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default FeedbackHeatmap; 