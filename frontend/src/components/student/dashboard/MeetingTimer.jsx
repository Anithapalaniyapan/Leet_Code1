import { Box, Paper, Typography } from '@mui/material';

const MeetingTimer = ({ nextMeeting, countdownTime }) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 'bold' }}>Meeting Timer</Typography>
      <Paper elevation={1} sx={{ p: 3, borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Next Meeting: {nextMeeting ? 
            `${nextMeeting.meetingDate} - ${nextMeeting.startTime}` : 
            'No upcoming meetings'}
        </Typography>
        {nextMeeting && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            gap: 1
          }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center'
            }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {countdownTime.minutes.toString().padStart(2, '0')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                minutes
              </Typography>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              :
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center'
            }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {countdownTime.seconds.toString().padStart(2, '0')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                seconds
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default MeetingTimer; 