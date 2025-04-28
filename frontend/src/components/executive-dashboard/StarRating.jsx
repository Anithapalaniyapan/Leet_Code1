import React from 'react';
import { Box } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarHalfIcon from '@mui/icons-material/StarHalf';

const StarRating = ({ rating, size = 24, color = '#FFD700' }) => {
  // Generate an array of 5 items representing our stars
  const stars = [];
  const roundedRating = Math.round(rating * 2) / 2; // Round to nearest 0.5
  
  for (let i = 1; i <= 5; i++) {
    if (i <= roundedRating) {
      // Full star
      stars.push(<StarIcon key={i} sx={{ color, fontSize: size }} />);
    } else if (i - 0.5 === roundedRating) {
      // Half star
      stars.push(<StarHalfIcon key={i} sx={{ color, fontSize: size }} />);
    } else {
      // Empty star
      stars.push(<StarBorderIcon key={i} sx={{ color, fontSize: size }} />);
    }
  }
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {stars}
    </Box>
  );
};

export default StarRating; 