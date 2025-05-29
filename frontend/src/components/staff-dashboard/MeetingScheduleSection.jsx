import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Chip, 
  Button, 
  CircularProgress,
  Alert,
  Card,
  IconButton
} from '@mui/material';
import FeedbackIcon from '@mui/icons-material/Feedback';
import RefreshIcon from '@mui/icons-material/Refresh';
import EventIcon from '@mui/icons-material/Event';
import InfoIcon from '@mui/icons-material/Info';
import HistoryIcon from '@mui/icons-material/History';

const MeetingScheduleSection = ({ 
  meetings = { pastMeetings: [], currentMeetings: [], futureMeetings: [] },
  loading, 
  error, 
  handleFetchQuestionsByMeeting, 
  handleRefreshMeetings
}) => {
  const [meetingsData, setMeetingsData] = useState({
    pastMeetings: [],
    currentMeetings: [],
    futureMeetings: []
  });

  // Format time with AM/PM
  const formatTimeWithAMPM = (timeString) => {
    if (!timeString) return '';
    
    // If already includes AM/PM, return as is
    if (timeString.includes('AM') || timeString.includes('PM') || 
        timeString.includes('am') || timeString.includes('pm')) {
      return timeString;
    }
    
    // Parse the time string (expected format: "HH:MM")
    const [hours, minutes] = timeString.split(':').map(part => parseInt(part, 10));
    if (isNaN(hours) || isNaN(minutes)) return timeString;
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // If it's already a formatted date, return as is
    if (dateString.includes('/')) return dateString;
    
    // If dateString is an ISO string with 'T', extract just the date part
    const dateToFormat = dateString.includes('T') 
      ? dateString.split('T')[0] 
      : dateString;
    
    try {
      const date = new Date(dateToFormat);
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Helper function to get department name by ID
  const getDepartmentNameById = (id) => {
    if (!id) return null;
    
    const departmentMap = {
      1: 'Computer Science and Engineering',
      2: 'Information Technology',
      3: 'Electronics and Communication',
      4: 'Electrical Engineering',
      5: 'Mechanical Engineering'
    };
    
    return departmentMap[id] || `Department ${id}`;
  };

  // Filter meetings to hide those that ended more than 10 minutes ago
  const shouldDisplayMeeting = (meeting) => {
    const now = new Date();
    let meetingDate = meeting.date || meeting.meetingDate;
    const meetingTime = meeting.endTime || '00:00';
    
    // Handle different date formats
    if (typeof meetingDate === 'string' && meetingDate.includes('T')) {
      meetingDate = meetingDate.split('T')[0];
    }
    
    // Create date objects for meeting end time
    const meetingEndDateTime = new Date(`${meetingDate}T${meetingTime}`);
    
    // Add 10 minutes to meeting end time
    const meetingEndPlusTenMinutes = new Date(meetingEndDateTime.getTime() + 10 * 60000);
    
    // Return true if now is before meeting end time + 10 minutes
    return now < meetingEndPlusTenMinutes;
  };

  useEffect(() => {
    if (meetings) {
      // Filter out meetings that ended more than 10 minutes ago
      const filteredPastMeetings = meetings.pastMeetings?.filter(shouldDisplayMeeting) || [];
      const filteredCurrentMeetings = meetings.currentMeetings || [];
      const filteredFutureMeetings = meetings.futureMeetings || [];
      
      setMeetingsData({
        pastMeetings: filteredPastMeetings,
        currentMeetings: filteredCurrentMeetings,
        futureMeetings: filteredFutureMeetings
      });
    }
  }, [meetings]);

  // Filter meetings to only show those that should be displayed
  const filteredMeetings = {
    pastMeetings: meetings.pastMeetings.filter(shouldDisplayMeeting),
    currentMeetings: meetings.currentMeetings.filter(shouldDisplayMeeting),
    futureMeetings: meetings.futureMeetings.filter(shouldDisplayMeeting)
  };

  // Combine all meetings for display
  const allMeetings = [
    ...(filteredMeetings.currentMeetings || []),
    ...(filteredMeetings.futureMeetings || []),
    ...(filteredMeetings.pastMeetings || [])
  ];
  
  // Remove duplicates
  const uniqueMeetings = allMeetings.filter((meeting, index, self) =>
    index === self.findIndex((m) => m.id === meeting.id)
  );

  // Render meeting card with Give Feedback button
  const renderMeetingCard = (meeting, isFirstCard = false) => {
    const meetingDate = new Date(meeting.date || meeting.meetingDate);
    const formattedDate = meetingDate.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    // Check if meeting is active (current date is on or after meeting date)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const meetingDay = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate());
    const isPastOrCurrentMeeting = meetingDay <= today;
    
    // Meeting is within feedback submission window if it's a past or current meeting
    const isWithinFeedbackWindow = isPastOrCurrentMeeting;

    return (
      <Paper
        elevation={isFirstCard ? 6 : 2}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
          },
          ...(isFirstCard ? {
            background: 'linear-gradient(135deg, #f0f7ff 0%, #e4f1ff 100%)',
            border: '1px solid #c0d8ff'
          } : {})
        }}
      >
        {/* Meeting content */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1A2137' }}>
            {meeting.title}
          </Typography>
          <Typography variant="body2" sx={{ 
            color: 'white', 
            bgcolor: isFirstCard ? '#1976d2' : '#546e7a',
            px: 1.5, 
            py: 0.5, 
            borderRadius: 4,
            display: 'inline-block',
            fontSize: '0.8rem',
            fontWeight: 'medium'
          }}>
            {isFirstCard ? 'NEXT' : isPastOrCurrentMeeting ? 'PAST' : 'UPCOMING'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ mb: { xs: 2, sm: 0 } }}>
            <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
              <strong>Date:</strong> {formattedDate}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
              <strong>Time:</strong> {formatTimeWithAMPM(meeting.startTime)} - {formatTimeWithAMPM(meeting.endTime)}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              <strong>Location:</strong> {meeting.location || 'Online'}
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: { xs: 'flex-start', sm: 'flex-end' } 
          }}>
            {isWithinFeedbackWindow && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<FeedbackIcon />}
                onClick={() => handleFetchQuestionsByMeeting(meeting.id)}
                sx={{ 
                  mt: { xs: 2, sm: 0 }, 
                  mb: 1,
                  bgcolor: '#1976d2',
                  '&:hover': { bgcolor: '#1565c0' },
                  fontSize: '0.8rem'
                }}
              >
                Give Feedback
              </Button>
            )}
            
            <Typography variant="body2" sx={{ 
              color: '#777', 
              fontSize: '0.8rem', 
              fontStyle: 'italic',
              mt: 0.5 
            }}>
              {meeting.department
                ? (typeof meeting.department === 'object' && meeting.department !== null
                    ? (meeting.department.name || '')
                    : meeting.department)
                : ''}
              {meeting.department && meeting.year ? ' • ' : ''}
              {meeting.year ? `Year ${meeting.year}` : ''}
            </Typography>
          </Box>
        </Box>
        
        {meeting.description && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
            <Typography variant="body2" sx={{ color: '#666' }}>
              {meeting.description}
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  // When meetings are loading
  if (loading) {
    return <Box sx={{ display: 'none' }}></Box>;
  }

  // When there's an error loading meetings
  if (error) {
    return (
      <Paper sx={{ p: 4, borderRadius: 0 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Button size="small" onClick={handleRefreshMeetings} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      </Paper>
    );
  }

  // When no meetings are available
  if (uniqueMeetings.length === 0) {
    return (
      <Paper sx={{ 
        p: 3, 
        borderRadius: 2,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
        minHeight: '350px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background design elements */}
        <Card sx={{
          maxWidth: 500,
          width: '100%',
          py: 3,
          px: 4,
          borderRadius: 3,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          position: 'relative',
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(0,0,0,0.05)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          
          <Typography variant="h5" sx={{ 
            fontWeight: 'bold', 
            color: '#1A2137', 
            mb: 1.5,
            position: 'relative',
            display: 'inline-block',
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: -6,
              left: '25%',
              width: '50%',
              height: 3,
              backgroundColor: '#FFD700',
              borderRadius: 2
            }
          }}>
          No meetings scheduled
        </Typography>
          
          <Typography variant="body1" sx={{ color: '#555', maxWidth: '90%', mx: 'auto', mb: 2 }}>
            There are no upcoming meetings scheduled for you at this time. Meetings will appear here once they are assigned to your department.
        </Typography>
          
        <Button
            variant="contained"
          color="primary"
          onClick={handleRefreshMeetings}
          startIcon={<RefreshIcon />}
            sx={{ 
              px: 3, 
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 'medium',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              background: 'linear-gradient(45deg, #1A2137 30%, #2A3147 90%)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
              }
            }}
        >
          Refresh Meetings
        </Button>
        </Card>
      </Paper>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4
        }}
      >
        <Typography 
          variant="h5" 
          sx={{ 
          fontWeight: 'bold', 
          color: '#1A2137',
          position: 'relative',
          '&:after': {
            content: '""',
            position: 'absolute',
              bottom: -10,
            left: 0,
              width: 60,
              height: 4,
            backgroundColor: '#FFD700',
              borderRadius: 2
          }
          }}
        >
          Meeting Schedule
        </Typography>
        
        <Button
          variant="outlined"
          color="primary"
          onClick={handleRefreshMeetings}
          startIcon={<RefreshIcon />}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 'medium'
          }}
        >
          Refresh
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : (
        <>
          {/* Today's and Upcoming Meetings */}
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h6" 
        sx={{ 
                mb: 2, 
                color: '#1976d2',
                fontWeight: 'medium',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <EventIcon sx={{ mr: 1 }} />
              Current & Upcoming Meetings
            </Typography>
            
            {meetingsData.currentMeetings.length === 0 && meetingsData.futureMeetings.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No current or upcoming meetings scheduled.
              </Alert>
            ) : (
              <Box>
                {/* Current Meetings */}
                {meetingsData.currentMeetings.map((meeting, index) => (
                  <Box key={meeting.id || index}>
                    {renderMeetingCard(meeting, index === 0)}
                  </Box>
                ))}
                
                {/* Future Meetings */}
                {meetingsData.futureMeetings.map((meeting, index) => (
                  <Box key={meeting.id || index}>
                    {renderMeetingCard(meeting, 
                      meetingsData.currentMeetings.length === 0 && index === 0)}
                  </Box>
                ))}
              </Box>
            )}
                    </Box>

          {/* Past Meetings */}
          <Box>
            <Typography 
              variant="h6" 
                      sx={{ 
                mb: 2, 
                color: '#546e7a',
                        fontWeight: 'medium',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <HistoryIcon sx={{ mr: 1 }} />
              Past Meetings
            </Typography>
            
            {meetingsData.pastMeetings.length === 0 ? (
              <Alert severity="info">
                No past meetings to display.
              </Alert>
            ) : (
              <Box>
                {meetingsData.pastMeetings.map((meeting, index) => (
                  <Box key={meeting.id || index}>
                    {renderMeetingCard(meeting)}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default MeetingScheduleSection; 