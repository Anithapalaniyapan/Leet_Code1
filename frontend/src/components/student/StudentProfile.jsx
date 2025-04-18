import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';

const StudentProfile = ({ userProfile }) => {
  return (
    <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
        Student Profile
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
          <Avatar
            sx={{ 
            width: 56,
            height: 56,
            bgcolor: '#1a2a5e',
            fontSize: '1.5rem'
          }}
        >
          {userProfile?.fullName?.[0] || 'J'}
          </Avatar>

        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <Box>
              <Typography color="textSecondary" variant="body2">
                Name
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5 }}>
                {userProfile?.fullName || 'John Doe'}
              </Typography>
            </Box>

            <Box>
              <Typography color="textSecondary" variant="body2">
                SIN Number
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5 }}>
                {userProfile?.sinNumber || 'ST23456789'}
            </Typography>
            </Box>

            <Box>
              <Typography color="textSecondary" variant="body2">
                Department
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5 }}>
                {userProfile?.department || 'Computer Science'}
                </Typography>
              </Box>
              
            <Box>
              <Typography color="textSecondary" variant="body2">
                Year
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5 }}>
                {userProfile?.year ? `${userProfile.year}${getOrdinalSuffix(userProfile.year)} Year` : 'Third Year'}
                </Typography>
              </Box>

            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography color="textSecondary" variant="body2">
                Email ID
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5 }}>
                {userProfile?.email || 'john.doe@university.edu'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const getOrdinalSuffix = (num) => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
};

export default StudentProfile;