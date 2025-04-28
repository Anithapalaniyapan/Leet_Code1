import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Card, CardContent, CircularProgress,
  Grid, Chip, Divider, Avatar, IconButton, Button, Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GroupIcon from '@mui/icons-material/Group';
import BusinessIcon from '@mui/icons-material/Business';
import SchoolIcon from '@mui/icons-material/School';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EventIcon from '@mui/icons-material/Event';
import VideocamIcon from '@mui/icons-material/Videocam';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const Meetings = ({ meetings, loading, error }) => {
  const theme = useTheme();
  const { activeSection } = useSelector(state => state.ui);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [isProcessing, setIsProcessing] = useState(true);

  // Process meetings on component mount or when meetings data changes
  useEffect(() => {
    // Don't process if not on meetings section
    if (activeSection !== 'meetings') return;
    
    console.log("Meetings data received:", meetings);
    setIsProcessing(true);
    
    // Filter for upcoming meetings only
    const filterUpcomingMeetings = () => {
      if (!meetings || !Array.isArray(meetings)) {
        console.log("Meetings is not an array or is empty");
        setUpcomingMeetings([]);
        setIsProcessing(false);
        return;
      }
      
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day
        console.log("Current date for filtering:", today);
        
        const filtered = meetings.filter(meeting => {
          // Ensure the meeting object is valid
          if (!meeting) {
            return false;
          }
          
          // Check if meeting has a date field (either date or meetingDate)
          if (!meeting.date && !meeting.meetingDate) {
            console.log("Meeting missing date:", meeting);
            return false;
          }
          
          // Support both date and meetingDate fields
          const dateField = meeting.date || meeting.meetingDate;
          console.log("Meeting date field:", dateField);
          
          try {
            const meetingDate = new Date(dateField);
            console.log("Parsed meeting date:", meetingDate);
            
            // Check if date is valid before comparing
            if (isNaN(meetingDate.getTime())) {
              console.log("Invalid date:", dateField);
              return false;
            }
            
            // Only include future meetings
            const isUpcoming = meetingDate >= today;
            console.log("Is upcoming:", isUpcoming);
            return isUpcoming;
          } catch (error) {
            console.error("Error parsing date:", error);
            return false;
          }
        });
        
        console.log("Filtered upcoming meetings:", filtered);
        
        // Sort by date (ascending)
        const sorted = [...filtered].sort((a, b) => {
          const dateA = new Date(a.date || a.meetingDate);
          const dateB = new Date(b.date || b.meetingDate);
          return dateA - dateB;
        });
        
        console.log("Sorted upcoming meetings:", sorted);
        setUpcomingMeetings(sorted);
      } catch (error) {
        console.error("Error processing meetings:", error);
        setUpcomingMeetings([]);
      } finally {
        setIsProcessing(false);
      }
    };
    
    filterUpcomingMeetings();
  }, [meetings, activeSection]);

  // Format the time range (start time to end time)
  const formatTimeRange = (meeting) => {
    // Check for different time field patterns
    const startTime = meeting.startTime || 
                      (meeting.time && meeting.time.startTime) || 
                      (meeting.time && meeting.time.split(' - ')[0]) ||
                      (meeting.time && meeting.time.split('-')[0]);
                      
    const endTime = meeting.endTime || 
                    (meeting.time && meeting.time.endTime) || 
                    (meeting.time && meeting.time.split(' - ')[1]) ||
                    (meeting.time && meeting.time.split('-')[1]);
    
    // If we have both start and end time, display the range
    if (startTime && endTime) {
      return `${startTime.trim()} - ${endTime.trim()}`;
    }
    
    // If the time already looks like a range (contains '-'), return as is
    if (meeting.time && (meeting.time.includes('-') || meeting.time.includes(' to '))) {
      return meeting.time;
    }
    
    // If only single time available
    if (startTime) {
      return startTime.trim();
    }
    
    // Default if no time info available
    return 'Not specified';
  };

  // Determine role information from meeting object
  const getRoleInfo = (meeting) => {
    // Check all possible properties that might indicate role
    const roleId = meeting.roleId || 
                   (meeting.role && meeting.role.id) || 
                   (meeting.targetRole && meeting.targetRole === 'staff' ? 2 : 1);
                   
    // Convert roleId to numeric if it's a string
    const numericRoleId = typeof roleId === 'string' ? parseInt(roleId, 10) : roleId;
    
    // Return both the formatted role name and whether it's a staff meeting
    const isStaff = numericRoleId === 2;
    
    return {
      roleName: isStaff ? "Staff" : "Student",
      isStaffMeeting: isStaff
    };
  };
  
  // Get initials for avatar
  const getInitials = (title) => {
    if (!title) return '?';
    
    return title
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Format date for UI display
  const formatDate = (dateString) => {
    if (!dateString) return { day: '??', month: '??', date: 'Not specified' };
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return { day: '??', month: '??', date: 'Invalid date' };
      
      return {
        day: date.getDate().toString().padStart(2, '0'),
        month: date.toLocaleString('en-US', { month: 'short' }),
        dayName: date.toLocaleString('en-US', { weekday: 'short' }),
        date: date.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        })
      };
    } catch (e) {
      console.error("Error formatting date:", e);
      return { day: '??', month: '??', date: 'Error' };
    }
  };
  
  // Get background color for meeting card based on role
  const getMeetingCardColor = (meeting) => {
    const { isStaffMeeting } = getRoleInfo(meeting);
    
    if (isStaffMeeting) {
      return 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.1) 100%)';
    } else {
      return 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(76, 175, 80, 0.1) 100%)';
    }
  };
  
  // Get color for date chip based on role
  const getDateChipColor = (meeting) => {
    const { isStaffMeeting } = getRoleInfo(meeting);
    return isStaffMeeting ? 'primary' : 'success';
  };

  // Format upcoming meetings to display
  const renderUpcomingMeetings = () => {
    // Show loading indicator if parent component is loading
    if (loading || isProcessing) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress size={40} thickness={4} />
          <Typography variant="h6" sx={{ ml: 2, color: 'text.secondary' }}>
            Loading meetings...
          </Typography>
        </Box>
      );
    }
    
    // Show error message if there's an error
    if (error) {
      return (
        <Card sx={{ p: 4, textAlign: 'center', bgcolor: '#fff1f0', borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" color="error" gutterBottom>
              Unable to Load Meetings
            </Typography>
            <Typography variant="body1" color="error.light">
              {error}
            </Typography>
          </CardContent>
        </Card>
      );
    }
    
    // Show meetings if available
    if (upcomingMeetings.length > 0) {
      return (
        <Grid container spacing={3}>
          {upcomingMeetings.map((meeting) => {
        // Get role information
        const { roleName, isStaffMeeting } = getRoleInfo(meeting);
            
            // Format date components
            const formattedDate = formatDate(meeting.date || meeting.meetingDate);
            
            // Get time range
            const timeRange = formatTimeRange(meeting);
            
            // Department name
            const departmentName = meeting.department?.name || meeting.departmentName || 'All departments';
        
        return (
              <Grid item xs={12} md={6} key={meeting._id || meeting.id}>
                <Card 
                  elevation={2}
            sx={{ 
                    borderRadius: 4,
                    overflow: 'hidden',
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 8
                    },
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Header with gradient background */}
                  <Box 
                    sx={{ 
                      background: getMeetingCardColor(meeting),
                      p: 2,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {/* Meeting type avatar */}
                    <Avatar 
                      sx={{ 
                        bgcolor: isStaffMeeting ? 'primary.main' : 'success.main',
                        color: '#fff',
                        mr: 2
                      }}
                    >
                      {isStaffMeeting ? <BusinessIcon /> : <SchoolIcon />}
                    </Avatar>
                    
                    {/* Meeting title */}
                    <Typography variant="h6" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
              {meeting.title}
            </Typography>
            
                    {/* Role chip */}
                    <Chip 
                      label={roleName} 
                      size="small"
                      color={isStaffMeeting ? "primary" : "success"}
                      sx={{ ml: 1, fontWeight: 'medium' }}
                    />
                  </Box>
                  
                  <CardContent sx={{ flexGrow: 1, pt: 2, pb: 3 }}>
                    <Grid container spacing={2}>
                      {/* Left column - Date display */}
                      <Grid item xs={4} sm={3}>
                        <Box 
                          sx={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            pb: 2
                          }}
                        >
                          {/* Calendar-style date display */}
                          <Paper 
                            elevation={0}
                            sx={{
                              width: '100%',
                              maxWidth: 80,
                              borderRadius: 2,
                              overflow: 'hidden',
                              border: `1px solid ${theme.palette[getDateChipColor(meeting)].light}`
                            }}
                          >
                            {/* Month header */}
                            <Box 
                              sx={{ 
                                bgcolor: theme.palette[getDateChipColor(meeting)].main,
                                color: theme.palette[getDateChipColor(meeting)].contrastText,
                                py: 0.5,
                                textAlign: 'center'
                              }}
                            >
                              <Typography variant="caption" fontWeight="bold">
                                {formattedDate.month}
                </Typography>
              </Box>
              
                            {/* Day number */}
                            <Box sx={{ py: 1, textAlign: 'center' }}>
                              <Typography variant="h4" fontWeight="bold">
                                {formattedDate.day}
                              </Typography>
                              <Typography variant="caption" display="block">
                                {formattedDate.dayName}
                </Typography>
                            </Box>
                          </Paper>
                        </Box>
                      </Grid>
                      
                      {/* Right column - Meeting details */}
                      <Grid item xs={8} sm={9}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          {/* Time */}
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 1.5 }} />
                            <Typography variant="body2">
                  {timeRange}
                </Typography>
              </Box>
              
                          {/* Department */}
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <BusinessIcon fontSize="small" color="action" sx={{ mr: 1.5 }} />
                            <Typography variant="body2" color="secondary.main" fontWeight="medium">
                              {departmentName}
                </Typography>
              </Box>
              
                          {/* Year (only for student meetings) */}
                          {!isStaffMeeting && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <SchoolIcon fontSize="small" color="action" sx={{ mr: 1.5 }} />
                              <Typography variant="body2">
                                Year: {meeting.year || 'All years'}
                </Typography>
              </Box>
                          )}
                          
                          {/* Optional location if available */}
                          {meeting.location && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <LocationOnIcon fontSize="small" color="action" sx={{ mr: 1.5 }} />
                              <Typography variant="body2">
                                {meeting.location}
                  </Typography>
                </Box>
              )}
            </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                  
                  {/* Footer with actions */}
                  <Box 
                    sx={{ 
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      p: 1.5,
                      display: 'flex',
                      justifyContent: 'flex-end'
                    }}
                  >
                   
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      );
    } else {
      return (
        <Card sx={{ p: 4, textAlign: 'center', bgcolor: '#f8f9fa', borderRadius: 3, boxShadow: 2 }}>
          <CardContent>
            <EventIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'medium' }}>
              No Upcoming Meetings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              When new meetings are scheduled, they will appear here.
            </Typography>
          </CardContent>
        </Card>
      );
    }
  };

  // If active section is not meetings, don't render anything
  if (activeSection !== 'meetings') {
    return null;
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <CalendarTodayIcon sx={{ fontSize: 32, mr: 2, color: theme.palette.primary.main }} />
        <Typography variant="h4" fontWeight="bold">
        Upcoming Meetings
      </Typography>
        
        {/* Optional action button */}
        <Box sx={{ flexGrow: 1 }}></Box>
     
      </Box>
      
      {renderUpcomingMeetings()}
    </Box>
  );
};

export default Meetings; 