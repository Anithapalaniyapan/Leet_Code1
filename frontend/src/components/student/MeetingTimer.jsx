import { Box, Typography } from '@mui/material';

const MeetingTimer = ({ nextMeeting, countdownTime }) => {
  return (
    <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 2, mt: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
        Meeting Timer
      </Typography>

      <Typography variant="body1" sx={{ mb: 2 }}>
        Next Meeting: {nextMeeting ? `${nextMeeting.meetingDate} - ${nextMeeting.startTime}` : 'No upcoming meetings'}
      </Typography>

      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 1,
        mt: 3
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1a2a5e' }}>
            {String(countdownTime.minutes).padStart(2, '0')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            minutes
          </Typography>
        </Box>

        <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1a2a5e' }}>
          :
        </Typography>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1a2a5e' }}>
            {String(countdownTime.seconds).padStart(2, '0')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            seconds
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default MeetingTimer; 