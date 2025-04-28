import React from 'react';
import { Box, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarHalfIcon from '@mui/icons-material/StarHalf';

const StarRating = ({ rating, showValue = true, size = 'medium' }) => {
  if (rating === undefined || rating === null) {
    return null;
  }

  const numericRating = parseFloat(rating);
  
  if (isNaN(numericRating)) {
    return null;
  }

  const fullStars = Math.floor(numericRating);
  const hasHalfStar = numericRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  // Determine icon size based on prop
  const iconSize = size === 'small' ? { fontSize: 'small' } :
                  size === 'large' ? { fontSize: 'large' } :
                  {};
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {[...Array(fullStars)].map((_, i) => (
        <StarIcon key={`full-${i}`} sx={{ color: '#FFC107', ...iconSize }} />
      ))}
      {hasHalfStar && <StarHalfIcon sx={{ color: '#FFC107', ...iconSize }} />}
      {[...Array(emptyStars)].map((_, i) => (
        <StarBorderIcon key={`empty-${i}`} sx={{ color: '#FFC107', ...iconSize }} />
      ))}
      {showValue && (
        <Typography variant="body2" sx={{ ml: 1 }}>({numericRating.toFixed(1)})</Typography>
      )}
    </Box>
  );
};

export default StarRating; 