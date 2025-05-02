import React, { useState } from 'react';
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
import { Player } from '@lottiefiles/react-lottie-player';
import FeedbackIcon from '@mui/icons-material/Feedback';
import RefreshIcon from '@mui/icons-material/Refresh';
import EventIcon from '@mui/icons-material/Event';
import scheduleAnimation from '../../assets/animations/calendar.json';

const MeetingScheduleSection = ({ 
  meetings = { pastMeetings: [], currentMeetings: [], futureMeetings: [] },
  loading, 
  error, 
  handleFetchQuestionsByMeeting, 
  handleRefreshMeetings
}) => {
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

  // Combine all meetings for display
  const allMeetings = [
    ...(meetings.currentMeetings || []),
    ...(meetings.futureMeetings || []),
    ...(meetings.pastMeetings || [])
  ];
  
  // Remove duplicates
  const uniqueMeetings = allMeetings.filter((meeting, index, self) =>
    index === self.findIndex((m) => m.id === meeting.id)
  );

  // When meetings are loading
  if (loading) {
    return (
      <Paper sx={{ 
        p: 4, 
        borderRadius: 0, 
        minHeight: '400px', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        flexDirection: 'column' 
      }}>
        <CircularProgress size={60} thickness={4} sx={{ color: '#1A2137', mb: 3 }} />
        <Typography variant="h6" sx={{ color: '#1A2137' }}>Loading meetings...</Typography>
      </Paper>
    );
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
        p: 4, 
        borderRadius: 0,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        textAlign: 'center'
      }}>
        <Box sx={{ width: '200px', height: '200px', mb: 3 }}>
          <Player
            autoplay
            loop
            src={scheduleAnimation}
            style={{ width: '100%', height: '100%' }}
          />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1A2137', mb: 2 }}>
          No meetings scheduled
        </Typography>
        <Typography variant="body1" sx={{ color: '#555', maxWidth: '600px', mx: 'auto', mb: 3 }}>
          There are no meetings scheduled for you at this time.
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleRefreshMeetings}
          startIcon={<RefreshIcon />}
        >
          Refresh Meetings
        </Button>
      </Paper>
    );
  }

  // Main content - meetings available
  return (
    <Paper sx={{ 
      p: 4, 
      borderRadius: 2, 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background */}
      <Box sx={{ 
        position: 'absolute', 
        top: -20, 
        right: -20, 
        width: '150px', 
        height: '150px', 
        opacity: 0.1,
        zIndex: 0,
        transform: 'rotate(10deg)'
      }}>
        <Player
          autoplay
          loop
          src={scheduleAnimation}
          style={{ width: '100%', height: '100%' }}
        />
      </Box>
      
      {/* Header with title */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
        position: 'relative',
        zIndex: 1
      }}>
        <Typography variant="h5" sx={{ 
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
        }}>
          Meeting Schedule
        </Typography>
        
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={handleRefreshMeetings}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            borderColor: '#1A2137',
            color: '#1A2137',
            '&:hover': {
              borderColor: '#1A2137',
              backgroundColor: 'rgba(26, 33, 55, 0.04)'
            }
          }}
        >
          Refresh
        </Button>
      </Box>
      
      {/* Today's meetings section */}
      {meetings.currentMeetings && meetings.currentMeetings.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ 
            mb: 2, 
            color: '#1A2137',
            display: 'flex',
            alignItems: 'center',
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}>
            <EventIcon sx={{ mr: 1 }} /> Today's Meetings
          </Typography>
          
          <TableContainer component={Card} sx={{ 
            borderRadius: 2,
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            mb: 2
          }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'rgba(26, 33, 55, 0.02)' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {meetings.currentMeetings.map((meeting) => {
                  // Normalize meeting data
                  const meetingDate = meeting.meetingDate || meeting.date;
                  const formattedDate = formatDate(meetingDate);
                  
                  // Get department name
                  const departmentName = meeting.department?.name || 
                    (typeof meeting.department === 'string' ? meeting.department : null) ||
                    getDepartmentNameById(meeting.departmentId) || 
                    'Not specified';
                  
                  return (
                    <TableRow 
                      key={meeting.id || Math.random().toString(36).substr(2, 9)}
                      sx={{ 
                        '&:hover': { backgroundColor: 'rgba(26, 33, 55, 0.02)' },
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                        {meeting.title}
                      </TableCell>
                      <TableCell>
                        {meeting.startTime ? (
                          meeting.endTime ? 
                            `${formatTimeWithAMPM(meeting.startTime)} - ${formatTimeWithAMPM(meeting.endTime)}` :
                            formatTimeWithAMPM(meeting.startTime)
                        ) : 'Time not specified'}
                      </TableCell>
                      <TableCell>{departmentName}</TableCell>
                      <TableCell>
                        <Chip 
                          label={meeting.status || 'Today'} 
                          size="small"
                          sx={{ 
                            bgcolor: 
                              meeting.status === 'completed' ? '#e8f5e9' : 
                              meeting.status === 'cancelled' ? '#ffebee' : 
                              meeting.status === 'in-progress' ? '#fff3e0' : '#e3f2fd',
                            color: 
                              meeting.status === 'completed' ? '#2e7d32' : 
                              meeting.status === 'cancelled' ? '#c62828' : 
                              meeting.status === 'in-progress' ? '#ef6c00' : '#0277bd',
                            textTransform: 'capitalize',
                            fontWeight: 'medium'
                          }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outlined"
                          size="small"
                          color="primary"
                          onClick={() => handleFetchQuestionsByMeeting(meeting.id)}
                          startIcon={<FeedbackIcon />}
                          sx={{ 
                            borderRadius: 2, 
                            textTransform: 'none',
                            borderColor: '#1A2137',
                            color: '#1A2137',
                            '&:hover': {
                              borderColor: '#1A2137',
                              backgroundColor: 'rgba(26, 33, 55, 0.04)'
                            }
                          }}
                        >
                          Feedback
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
      
      {/* Upcoming meetings section */}
      {meetings.futureMeetings && meetings.futureMeetings.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ 
            mb: 2, 
            color: '#1A2137',
            display: 'flex',
            alignItems: 'center',
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}>
            <EventIcon sx={{ mr: 1 }} /> Upcoming Meetings
          </Typography>
          
          <TableContainer component={Card} sx={{ 
            borderRadius: 2,
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            mb: 2
          }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'rgba(26, 33, 55, 0.02)' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {meetings.futureMeetings.map((meeting) => {
                  // Normalize meeting data
                  const meetingDate = meeting.meetingDate || meeting.date;
                  const formattedDate = formatDate(meetingDate);
                  
                  // Get department name
                  const departmentName = meeting.department?.name || 
                    (typeof meeting.department === 'string' ? meeting.department : null) ||
                    getDepartmentNameById(meeting.departmentId) || 
                    'Not specified';
                  
                  return (
                    <TableRow 
                      key={meeting.id || Math.random().toString(36).substr(2, 9)}
                      sx={{ 
                        '&:hover': { backgroundColor: 'rgba(26, 33, 55, 0.02)' },
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                        {meeting.title}
                      </TableCell>
                      <TableCell>{formattedDate}</TableCell>
                      <TableCell>
                        {meeting.startTime ? (
                          meeting.endTime ? 
                            `${formatTimeWithAMPM(meeting.startTime)} - ${formatTimeWithAMPM(meeting.endTime)}` :
                            formatTimeWithAMPM(meeting.startTime)
                        ) : 'Time not specified'}
                      </TableCell>
                      <TableCell>{departmentName}</TableCell>
                      <TableCell>
                        <Chip 
                          label={meeting.status || 'Scheduled'} 
                          size="small"
                          sx={{ 
                            bgcolor: '#e3f2fd',
                            color: '#0277bd',
                            textTransform: 'capitalize',
                            fontWeight: 'medium'
                          }} 
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
      
      {/* Past meetings section */}
      {meetings.pastMeetings && meetings.pastMeetings.length > 0 && (
        <Box>
          <Typography variant="h6" sx={{ 
            mb: 2, 
            color: '#1A2137',
            display: 'flex',
            alignItems: 'center',
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}>
            <EventIcon sx={{ mr: 1 }} /> Past Meetings
          </Typography>
          
          <TableContainer component={Card} sx={{ 
            borderRadius: 2,
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
          }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'rgba(26, 33, 55, 0.02)' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {meetings.pastMeetings.map((meeting) => {
                  // Normalize meeting data
                  const meetingDate = meeting.meetingDate || meeting.date;
                  const formattedDate = formatDate(meetingDate);
                  
                  // Get department name
                  const departmentName = meeting.department?.name || 
                    (typeof meeting.department === 'string' ? meeting.department : null) ||
                    getDepartmentNameById(meeting.departmentId) || 
                    'Not specified';
                  
                  return (
                    <TableRow 
                      key={meeting.id || Math.random().toString(36).substr(2, 9)}
                      sx={{ 
                        '&:hover': { backgroundColor: 'rgba(26, 33, 55, 0.02)' },
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                        {meeting.title}
                      </TableCell>
                      <TableCell>{formattedDate}</TableCell>
                      <TableCell>
                        {meeting.startTime ? (
                          meeting.endTime ? 
                            `${formatTimeWithAMPM(meeting.startTime)} - ${formatTimeWithAMPM(meeting.endTime)}` :
                            formatTimeWithAMPM(meeting.startTime)
                        ) : 'Time not specified'}
                      </TableCell>
                      <TableCell>{departmentName}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outlined"
                          size="small"
                          color="primary"
                          onClick={() => handleFetchQuestionsByMeeting(meeting.id)}
                          startIcon={<FeedbackIcon />}
                          sx={{ 
                            borderRadius: 2, 
                            textTransform: 'none',
                            borderColor: '#1A2137',
                            color: '#1A2137',
                            '&:hover': {
                              borderColor: '#1A2137',
                              backgroundColor: 'rgba(26, 33, 55, 0.04)'
                            }
                          }}
                        >
                          View Feedback
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Paper>
  );
};

export default MeetingScheduleSection; 