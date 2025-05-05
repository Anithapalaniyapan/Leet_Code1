import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TableContainer, 
  Table,
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell, 
  Chip, 
  CircularProgress,
  Avatar
} from '@mui/material';
import FeedbackIcon from '@mui/icons-material/Feedback';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';

const MeetingScheduleSection = ({ meetings, loading, handleFetchQuestionsByMeeting }) => {
  // Helper function to format time with AM/PM
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
  
  // Helper to get status color and icon
  const getStatusDetails = (status) => {
    const statusLower = (status || 'scheduled').toLowerCase();
    
    const statusMap = {
      completed: {
        color: '#e8f5e9',
        textColor: '#2e7d32',
        icon: <EventAvailableIcon sx={{ fontSize: 20 }} />
      },
      cancelled: {
        color: '#ffebee',
        textColor: '#c62828',
        icon: <EventBusyIcon sx={{ fontSize: 20 }} />
      },
      'in-progress': {
        color: '#fff3e0',
        textColor: '#ef6c00',
        icon: <AccessTimeIcon sx={{ fontSize: 20 }} />
      },
      scheduled: {
        color: '#e3f2fd',
        textColor: '#0277bd',
        icon: <EventIcon sx={{ fontSize: 20 }} />
      }
    };
    
    return statusMap[statusLower] || statusMap.scheduled;
  };

  // Get today's date for highlighting
  const today = new Date().toLocaleDateString();
  
  // New function to check if meeting is within 5 minutes
  const isWithinFiveMinutes = (meeting) => {
    if (!meeting) return false;
    
    const now = new Date();
    const meetingDate = new Date(`${meeting.date || meeting.meetingDate}T${meeting.startTime || '00:00'}`);
    
    if (isNaN(meetingDate.getTime())) return false;
    
    const minsUntilMeeting = Math.floor((meetingDate - now) / 60000);
    return minsUntilMeeting <= 5;
  };
  
  // New function to get feedback button text based on meeting time
  const getFeedbackButtonText = (meeting) => {
    if (!meeting) return "Feedback";
    
    const now = new Date();
    const meetingDate = new Date(`${meeting.date || meeting.meetingDate}T${meeting.startTime || '00:00'}`);
    
    if (isNaN(meetingDate.getTime())) return "Feedback";
    
    const minsUntilMeeting = Math.floor((meetingDate - now) / 60000);
    
    if (minsUntilMeeting <= 5) {
      return "Give Feedback";
    } else {
      return "View Meeting";
    }
  };

  if (loading) {
    return <Box sx={{ display: 'none' }}></Box>;
  }

  return (
    <Paper sx={{ 
      p: 4, 
      borderRadius: 0,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      border: '1px solid #e0e0e0'
    }}>
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 'bold', 
          mb: 4, 
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
        }}>
          View Meeting Schedule
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 3, color: '#666', fontStyle: 'italic' }}>
          Feedback questions become available 5 minutes before each meeting starts
        </Typography>
        
        {meetings && meetings.length > 0 ? (
          <TableContainer sx={{ 
            '& .MuiTableCell-root': { 
              borderColor: '#f0f0f0'
            }
          }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ 
                  backgroundColor: '#f9f9f9',
                  '& th': { 
                    fontWeight: 'bold', 
                    color: '#1A2137',
                    fontSize: '0.875rem'
                  }
                }}>
                  <TableCell>Meeting Title</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {meetings.map((meeting) => {
                  // Normalize meeting data
                  const meetingDate = meeting.meetingDate || meeting.date;
                  const formattedDate = meetingDate 
                    ? new Date(meetingDate).toLocaleDateString() 
                    : 'Not specified';
                  
                  const departmentName = meeting.department?.name || 
                                      (typeof meeting.department === 'string' ? meeting.department : null) ||
                                      getDepartmentNameById(meeting.departmentId) || 
                                      'Not specified';
                  
                  const status = meeting.status || 'scheduled';
                  const statusDetails = getStatusDetails(status);
                  
                  // Check if meeting is today
                  const isToday = formattedDate === today;
                  
                  // Check if meeting is within 5 minutes
                  const canProvideFeedback = isWithinFiveMinutes(meeting);
                  
                  return (
                    <TableRow 
                      key={meeting.id}
                      sx={{ 
                        '&:last-child td, &:last-child th': { border: 0 },
                        transition: 'background-color 0.3s',
                        backgroundColor: isToday ? 'rgba(255, 215, 0, 0.05)' : 'inherit',
                        '&:hover': {
                          backgroundColor: isToday ? 'rgba(255, 215, 0, 0.1)' : 'rgba(0, 0, 0, 0.02)'
                        },
                        border: isToday ? '1px solid rgba(255, 215, 0, 0.3)' : 'inherit'
                      }}
                    >
                      <TableCell component="th" scope="row" sx={{ 
                        fontWeight: isToday ? 'bold' : 'normal',
                        py: 2
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: '#1A2137', 
                            mr: 1.5,
                            fontSize: '0.8rem'
                          }}>
                            {meeting.title ? meeting.title.charAt(0) : 'M'}
                          </Avatar>
                          {meeting.title}
                          {isToday && (
                            <Chip 
                              label="Today" 
                              size="small" 
                              sx={{ 
                                ml: 1, 
                                bgcolor: '#ffd700', 
                                color: '#1A2137',
                                fontWeight: 'bold',
                                height: 22
                              }} 
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>{formattedDate}</TableCell>
                      <TableCell sx={{ py: 2 }}>{meeting.startTime 
                        ? (meeting.endTime 
                          ? `${formatTimeWithAMPM(meeting.startTime)} - ${formatTimeWithAMPM(meeting.endTime)}`
                          : formatTimeWithAMPM(meeting.startTime))
                        : 'Time not specified'}</TableCell>
                      <TableCell sx={{ py: 2 }}>{departmentName}</TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Chip 
                          icon={statusDetails.icon}
                          label={status} 
                          size="small"
                          sx={{ 
                            bgcolor: statusDetails.color,
                            color: statusDetails.textColor,
                            textTransform: 'capitalize',
                            fontWeight: 'medium',
                            px: 0.5
                          }} 
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Button 
                          variant="outlined"
                          size="small"
                          onClick={() => handleFetchQuestionsByMeeting(meeting.id)}
                          startIcon={<FeedbackIcon />}
                          sx={{
                            borderColor: canProvideFeedback ? '#4caf50' : '#1A2137',
                            color: canProvideFeedback ? '#4caf50' : '#1A2137',
                            backgroundColor: canProvideFeedback ? 'rgba(76, 175, 80, 0.05)' : 'transparent',
                            '&:hover': {
                              backgroundColor: canProvideFeedback ? 'rgba(76, 175, 80, 0.1)' : 'rgba(26, 33, 55, 0.05)',
                              borderColor: canProvideFeedback ? '#4caf50' : '#1A2137'
                            },
                            textTransform: 'none',
                            fontWeight: 'medium'
                          }}
                        >
                          {getFeedbackButtonText(meeting)}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ 
            textAlign: 'center', 
            py: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center' 
          }}>
            <Typography variant="h6" color="#1A2137" sx={{ fontWeight: 'medium', mb: 1 }}>
              No meetings scheduled at this time
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Check back later for upcoming meetings
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default MeetingScheduleSection; 