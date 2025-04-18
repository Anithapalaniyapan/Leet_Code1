import { Box, Typography, Paper, Tooltip } from '@mui/material';
import { CalendarToday, AccessTime } from '@mui/icons-material';

const MeetingList = ({ title, meetings }) => {
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeUntilMeeting = (meetingDate, startTime) => {
    const meetingDateTime = new Date(`${meetingDate}T${startTime}`);
    const now = new Date();
    const diffMs = meetingDateTime - now;
    
    if (diffMs < 0) return 'Meeting has ended';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `Starts in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `Starts in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else if (diffMinutes > 0) {
      return `Starts in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else {
      return 'Starting now';
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
        {title}
      </Typography>
      <Paper elevation={1} sx={{ borderRadius: 1 }}>
        {meetings && meetings.length > 0 ? (
          meetings.map((meeting, index) => (
            <Tooltip
              key={meeting.id || index}
              title={getTimeUntilMeeting(meeting.meetingDate, meeting.startTime)}
              placement="top"
            >
              <Box
                component="div"
                sx={{
                  p: 2,
                  borderBottom: index < meetings.length - 1 ? '1px solid #eee' : 'none',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarToday sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(meeting.meetingDate)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTime sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {meeting.startTime}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ mt: 1, color: 'text.primary' }}>
                  {meeting.title}
                </Typography>
              </Box>
            </Tooltip>
          ))
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No {title.toLowerCase()}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default MeetingList; 