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
import InfoIcon from '@mui/icons-material/Info';

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
        <Box sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: '250px',
          height: '250px',
          opacity: 0.1,
          zIndex: 0,
          transform: 'rotate(5deg)'
        }}>
          <Player
            autoplay
            loop
            src={scheduleAnimation}
            style={{ width: '100%', height: '100%' }}
          />
        </Box>

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
          <Box sx={{ 
            width: '120px', 
            height: '120px', 
            mb: 2,
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))'
          }}>
            <Player
              autoplay
              loop
              src={scheduleAnimation}
              style={{ width: '100%', height: '100%' }}
            />
          </Box>
          
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
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, color: '#666' }}>
            <InfoIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              Check back later or contact the Academic Director for more information
            </Typography>
          </Box>
        </Card>
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
      {/* Animated background - make it more visible */}
      <Box sx={{ 
        position: 'absolute', 
        top: -20, 
        right: -20, 
        width: '180px', 
        height: '180px', 
        opacity: 0.15,  // Increased opacity
        zIndex: 0,
        transform: 'rotate(10deg)'
      }}>
        <Player
          autoplay
          loop
          src={scheduleAnimation}
          style={{ width: '100%', height: '100%' }}
          rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
        />
      </Box>
      
      {/* Header with underline */}
      <Box sx={{ position: 'relative', mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 'bold', 
          color: '#1A2137',
          position: 'relative',
          '&:after': {
            content: '""',
            position: 'absolute',
            bottom: -8,
            left: 0,
            width: 40,
            height: 3,
            backgroundColor: '#FFD700',
            borderRadius: 1.5
          }
        }}>
          Meeting Schedule
        </Typography>
        
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={handleRefreshMeetings}
          startIcon={<RefreshIcon />}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
          Refresh
        </Button>
      </Box>
      
      {/* Table of meetings */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          boxShadow: 'none',
          backgroundColor: 'transparent',
          backgroundImage: 'none',
          mb: 3,
          '& .MuiTableCell-root': {
            borderBottom: '1px solid rgba(224, 224, 224, 0.5)'
          },
          '& .MuiTableHead-root': {
            backgroundColor: 'rgba(26, 33, 55, 0.03)'
          }
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: '#1A2137' }}>Meeting Title</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#1A2137' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#1A2137' }}>Time</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#1A2137' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#1A2137' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {uniqueMeetings.map((meeting) => {
              // Calculate if meeting is past, ongoing, or upcoming
              const now = new Date();
              let meetingDate = meeting.date || meeting.meetingDate;
              const meetingTime = meeting.startTime || '00:00';
              
              // If meetingDate is an ISO string (contains 'T'), extract just the date part
              if (typeof meetingDate === 'string' && meetingDate.includes('T')) {
                meetingDate = meetingDate.split('T')[0]; // Extract just the YYYY-MM-DD part
              }
              
              const meetingDateTime = new Date(`${meetingDate}T${meetingTime}`);
              const endTime = meeting.endTime || '23:59';
              const meetingEndDateTime = new Date(`${meetingDate}T${endTime}`);
              
              let status = 'upcoming';
              if (now > meetingEndDateTime) {
                status = 'past';
              } else if (now >= meetingDateTime && now <= meetingEndDateTime) {
                status = 'ongoing';
              }
              
              return (
                <TableRow 
                  key={meeting.id}
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: 'rgba(0,0,0,0.03)',
                      transition: 'background-color 0.2s ease'
                    },
                  }}
                >
                  <TableCell sx={{ 
                    color: '#333',
                    fontWeight: status === 'ongoing' ? 'bold' : 'normal'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EventIcon sx={{ 
                        mr: 1, 
                        color: status === 'ongoing' ? '#1976d2' : 
                               status === 'past' ? '#757575' : '#4caf50',
                        fontSize: '1.2rem'
                      }} />
                      {meeting.title || "Scheduled Meeting"}
                    </Box>
                  </TableCell>
                  
                  <TableCell>{formatDate(meetingDate)}</TableCell>
                  
                  <TableCell>
                    {formatTimeWithAMPM(meetingTime)}
                    {meeting.endTime && ` - ${formatTimeWithAMPM(meeting.endTime)}`}
                  </TableCell>
                  
                  <TableCell>
                    <Chip 
                      label={
                        status === 'past' ? 'Completed' : 
                        status === 'ongoing' ? 'Ongoing' : 'Upcoming'
                      }
                      size="small"
                      sx={{ 
                        backgroundColor: 
                          status === 'past' ? 'rgba(117, 117, 117, 0.1)' : 
                          status === 'ongoing' ? 'rgba(25, 118, 210, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                        color: 
                          status === 'past' ? '#757575' : 
                          status === 'ongoing' ? '#1976d2' : '#4caf50',
                        fontWeight: 'medium',
                        borderRadius: 1
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
                      disabled={status === 'upcoming' && (meetingDateTime - now) > 300000} // Disable if more than 5 minutes away
                      sx={{ 
                        borderRadius: 1,
                        textTransform: 'none',
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap',
                        minWidth: '120px'
                      }}
                    >
                      {status === 'past' ? 'View Feedback' : 'Give Feedback'}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Tip section */}
      <Card sx={{ 
        p: 2, 
        borderRadius: 2, 
        bgcolor: 'rgba(255, 215, 0, 0.05)', 
        border: '1px dashed rgba(255, 215, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        my: 2
      }}>
        <InfoIcon sx={{ color: '#FFD700', mr: 2 }} />
        <Typography variant="body2" sx={{ color: '#666' }}>
          Feedback for upcoming meetings will be available 5 minutes before the scheduled start time.
        </Typography>
      </Card>
    </Paper>
  );
};

export default MeetingScheduleSection; 