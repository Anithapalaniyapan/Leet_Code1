import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';

/**
 * View Schedule Tab component for displaying meeting schedules
 */
const ViewScheduleTab = ({ getDepartmentName, isDataPreloaded }) => {
  // Get meetings and departments from Redux store
  const { meetings } = useSelector(state => state.meetings);
  const { profile } = useSelector(state => state.user);
  
  // Get meetings data from the new structure
  const pastMeetings = meetings?.pastMeetings || [];
  const currentMeetings = meetings?.currentMeetings || [];
  const futureMeetings = meetings?.futureMeetings || [];
  
  // Combine all meetings for display
  const meetingsData = [...pastMeetings, ...currentMeetings, ...futureMeetings];
  const departments = profile?.departments || [];

  // Helper function to get department name
  const getFormattedDepartmentName = (meeting) => {
    // Check if meeting has a department object with name
    if (meeting.department && meeting.department.name) {
      return meeting.department.name;
    }
    
    // Check if meeting has a departmentId and use the provided function
    if (meeting.departmentId && getDepartmentName) {
      return getDepartmentName(meeting.departmentId);
    }
    
    // If departmentName is directly available
    if (meeting.departmentName) {
      return meeting.departmentName;
    }
    
    // Try to find department from departments list
    if (meeting.departmentId && departments && departments.length > 0) {
      const dept = departments.find(d => d.id === parseInt(meeting.departmentId));
      if (dept) return dept.name;
    }
    
    // Fallback
    return 'All Departments';
  };

  // Helper function to get upcoming meetings
  const getUpcomingMeetings = () => {
    const now = new Date();
    
    // First check current meetings from today
    const todayMeetings = currentMeetings.filter(meeting => {
      // If we have startTime, check if it's later than current time
      if (meeting.startTime) {
        const [hours, minutes] = meeting.startTime.split(':');
        const meetingTime = new Date();
        meetingTime.setHours(parseInt(hours, 10));
        meetingTime.setMinutes(parseInt(minutes, 10));
        return meetingTime > now;
      }
      return true; // Include if no specific time
    });
    
    // Combine with future meetings and sort by date
    return [...todayMeetings, ...futureMeetings]
      .sort((a, b) => {
        const dateA = new Date(a.meetingDate || a.date);
        const dateB = new Date(b.meetingDate || b.date);
        
        // If dates are the same, sort by time
        if (dateA.toDateString() === dateB.toDateString()) {
          if (a.startTime && b.startTime) {
            return a.startTime.localeCompare(b.startTime);
          }
        }
        
        return dateA - dateB;
      })
      .slice(0, 5); // Get up to 5 upcoming meetings
  };

  // Get upcoming meetings
  const upcomingMeetings = getUpcomingMeetings();

  // Helper function to format date
  const formatDate = (dateStr) => {
    try {
      if (!dateStr) return 'Invalid Date';
      
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString(undefined, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateStr);
      return 'Invalid Date';
    }
  };

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

  // Group meetings by date
  const meetingsByDate = meetingsData.reduce((acc, meeting) => {
    try {
      const meetingDate = new Date(meeting.meetingDate || meeting.date);
      if (isNaN(meetingDate.getTime())) {
        console.warn('Invalid date for meeting:', meeting);
        return acc;
      }
      
      const dateStr = meetingDate.toDateString();
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(meeting);
      return acc;
    } catch (error) {
      console.error('Error processing meeting date:', error, meeting);
      return acc;
    }
  }, {});

  // Count meetings by department
  const meetingsByDepartment = departments.map(dept => {
    return {
      id: dept.id,
      name: dept.name,
      count: meetingsData.filter(m => m.departmentId === dept.id).length
    };
  }).sort((a, b) => b.count - a.count);

  // Get role display name
  const getRoleDisplayName = (meeting) => {
    // Enhanced debugging 
    console.log('Meeting role debug (ViewSchedule):', { 
      meetingId: meeting.id,
      role: meeting.role, 
      roleId: meeting.roleId,
      roleType: typeof meeting.role,
      meeting: meeting
    });
    
    // First check for numeric values - most reliable format (1=Student, 2=Staff)
    if (meeting.role === 1 || meeting.roleId === 1 || meeting.role === '1') {
      return 'Student';
    } else if (meeting.role === 2 || meeting.roleId === 2 || meeting.role === '2') {
      return 'Staff';
    } 
    
    // Then check string values
    if (typeof meeting.role === 'string') {
      const roleStr = meeting.role.toLowerCase();
      if (roleStr === 'student' || roleStr.includes('student')) {
        return 'Student';
      } else if (roleStr === 'staff' || roleStr.includes('staff') || roleStr.includes('faculty')) {
        return 'Staff';
      }
    }
    
    // If role is an object with a name/id property
    if (typeof meeting.role === 'object' && meeting.role !== null) {
      if (meeting.role.id === 1 || meeting.role.name?.toLowerCase()?.includes('student')) {
        return 'Student';
      } else if (meeting.role.id === 2 || meeting.role.name?.toLowerCase()?.includes('staff')) {
        return 'Staff';
      }
    }
    
    // If we still have a value, try to make sense of it
    if (meeting.role) {
      const roleStr = String(meeting.role).toLowerCase();
      if (roleStr.includes('student') || roleStr === '1') return 'Student';
      if (roleStr.includes('staff') || roleStr.includes('faculty') || roleStr === '2') return 'Staff';
      return String(meeting.role); // Return the value as a string
    }
    
    // Last resort: check for targetRole (sometimes used in API)
    if (meeting.targetRole) {
      return meeting.targetRole.charAt(0).toUpperCase() + meeting.targetRole.slice(1);
    }
    
    return 'N/A'; // Default fallback when no role information is found
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        View Meeting Schedule
      </Typography>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: '#f1f8e9', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Meetings
              </Typography>
              <Typography variant="h3" sx={{ mb: 1, color: '#33691e' }}>
                {meetingsData.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Scheduled across all departments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: '#e3f2fd', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upcoming Meetings
              </Typography>
              <Typography variant="h3" sx={{ mb: 1, color: '#0d47a1' }}>
                {upcomingMeetings.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Scheduled in the next 30 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upcoming Meetings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Upcoming Meetings
        </Typography>
        
        {upcomingMeetings.length === 0 ? (
          <Typography variant="body1" color="textSecondary" sx={{ py: 2 }}>
            No upcoming meetings scheduled.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {upcomingMeetings.map((meeting) => (
              <Grid item xs={12} md={6} key={meeting.id}>
                <Card variant="outlined" sx={{ mb: 1 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">{meeting.title}</Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {formatDate(meeting.meetingDate || meeting.date)}
                      {meeting.startTime ? ` at ${formatTimeWithAMPM(meeting.startTime)}` : ''}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip 
                        label={getFormattedDepartmentName(meeting)}
                        size="small"
                        color="primary"
                      />
                      <Chip 
                        label={getRoleDisplayName(meeting)}
                        size="small"
                        color="secondary"
                      />
                      {getRoleDisplayName(meeting) === 'Student' && meeting.year && (
                        <Chip 
                          label={`Year: ${meeting.year}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      {meeting.description || 'No description provided.'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Calendar View */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Calendar View
        </Typography>
        
        {Object.keys(meetingsByDate).length === 0 ? (
          <Typography variant="body1" color="textSecondary" sx={{ py: 2 }}>
            No meetings scheduled.
          </Typography>
        ) : (
          <Box>
            {Object.entries(meetingsByDate)
              .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
              .map(([date, dateMeetings]) => (
                <Box key={date} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, mt: 2 }}>
                    {formatDate(date)}
                  </Typography>
                  
                  {dateMeetings.map(meeting => (
                    <Card key={meeting.id} variant="outlined" sx={{ mb: 1, p: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                          <Typography variant="body2" color="textSecondary">
                            {meeting.startTime ? formatTimeWithAMPM(meeting.startTime) : 'No time specified'}
                            {meeting.endTime && ` - ${formatTimeWithAMPM(meeting.endTime)}`}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={9}>
                          <Typography variant="subtitle1">{meeting.title}</Typography>
                          <Box sx={{ mt: 1 }}>
                            <Chip 
                              label={getFormattedDepartmentName(meeting)}
                              size="small"
                              color="primary"
                              sx={{ mr: 1 }}
                            />
                            <Chip 
                              label={getRoleDisplayName(meeting)}
                              size="small"
                              color="secondary"
                              sx={{ mr: 1 }}
                            />
                            {getRoleDisplayName(meeting) === 'Student' && meeting.year && (
                              <Chip 
                                label={`Year: ${meeting.year}`}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 1 }}
                              />
                            )}
                            <Chip 
                              label={meeting.status || 'Scheduled'}
                              size="small"
                              color={
                                meeting.status === 'Completed' || meeting.status === 'completed' ? 'success' : 
                                meeting.status === 'Cancelled' || meeting.status === 'cancelled' ? 'error' : 'default'
                              }
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </Card>
                  ))}
                </Box>
              ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

// Default props
ViewScheduleTab.defaultProps = {
  isDataPreloaded: false
};

export default ViewScheduleTab; 