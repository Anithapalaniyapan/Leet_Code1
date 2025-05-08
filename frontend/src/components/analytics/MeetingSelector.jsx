import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, FormControl, InputLabel,
  Select, MenuItem, Chip, TextField, InputAdornment,
  IconButton, Tabs, Tab, Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FilterListIcon from '@mui/icons-material/FilterList';
import TodayIcon from '@mui/icons-material/Today';
import DateRangeIcon from '@mui/icons-material/DateRange';
import EventNoteIcon from '@mui/icons-material/EventNote';

const MeetingSelector = ({ 
  meetings = [], 
  selectedMeetingId,
  onMeetingChange,
  loading = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'month', 'semester', 'year'
  const [filteredMeetings, setFilteredMeetings] = useState([]);

  // Helper function to determine role type
  const determineRoleType = (meeting) => {
    if (!meeting) return 'Student';
    
    if (meeting.roleId === 2 || 
        (meeting.targetRole && meeting.targetRole.toLowerCase().includes('staff')) ||
        meeting.isStaffMeeting) {
      return 'Staff';
    }
    return 'Student';
  };

  // Format time to 12-hour (AM/PM) format
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    // If the time is already in a Date object or timestamp
    if (timeString instanceof Date) {
      return timeString.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    
    // If time is in 24-hour format (HH:MM:SS or HH:MM)
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    
    return timeString;
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };

  // Effect to handle filtering meetings
  useEffect(() => {
    let filtered = [...meetings];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(meeting => 
        (meeting.title && meeting.title.toLowerCase().includes(term))
      );
    }
    
    // Apply time filter
    const now = new Date();
    if (timeFilter === 'month') {
      // Filter to current month
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      filtered = filtered.filter(meeting => {
        const meetingDate = new Date(meeting.meetingDate || meeting.date);
        return meetingDate.getMonth() === currentMonth && 
               meetingDate.getFullYear() === currentYear;
      });
    } else if (timeFilter === 'semester') {
      // Assume a semester is 6 months
      // Current semester is either Jan-Jun or Jul-Dec
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const isFirstSemester = currentMonth < 6;
      
      filtered = filtered.filter(meeting => {
        const meetingDate = new Date(meeting.meetingDate || meeting.date);
        const meetingMonth = meetingDate.getMonth();
        return meetingDate.getFullYear() === currentYear && 
               (isFirstSemester ? meetingMonth < 6 : meetingMonth >= 6);
      });
    } else if (timeFilter === 'year') {
      // Filter to current year
      const currentYear = now.getFullYear();
      filtered = filtered.filter(meeting => {
        const meetingDate = new Date(meeting.meetingDate || meeting.date);
        return meetingDate.getFullYear() === currentYear;
      });
    }
    
    // Sort by date (most recent first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.meetingDate || a.date || 0);
      const dateB = new Date(b.meetingDate || b.date || 0);
      return dateB - dateA;
    });
    
    setFilteredMeetings(filtered);
  }, [meetings, searchTerm, timeFilter]);

  // Function to handle rendering the selected meeting display
  const renderSelectedMeetingDetails = () => {
    if (!selectedMeetingId) return null;
    
    const meeting = meetings.find(m => m.id == selectedMeetingId);
    if (!meeting) return null;
    
    const roleType = determineRoleType(meeting);
    const formattedTime = formatTime(meeting.startTime);
    const formattedDate = formatDate(meeting.meetingDate || meeting.date);
    
    return (
      <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, border: '1px solid #e0e0e0' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Selected Meeting: {meeting.title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
          <Chip 
            label={roleType}
            size="small"
            sx={{ 
              bgcolor: roleType === 'Student' ? '#e3f2fd' : '#e8f5e9',
              color: roleType === 'Student' ? '#1565c0' : '#2e7d32',
              fontWeight: 'bold',
              mr: 2,
              mb: { xs: 1, sm: 0 }
            }}
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, mb: { xs: 1, sm: 0 } }}>
            <CalendarTodayIcon sx={{ fontSize: 18, mr: 0.5, color: '#666' }} />
            <Typography variant="body2">{formattedDate}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 0 } }}>
            <AccessTimeIcon sx={{ fontSize: 18, mr: 0.5, color: '#666' }} />
            <Typography variant="body2">{formattedTime}</Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Select Meeting for Analytics
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={timeFilter}
          onChange={(e, newValue) => setTimeFilter(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="meeting time filter tabs"
        >
          <Tab 
            icon={<FilterListIcon />} 
            iconPosition="start" 
            label="All Time" 
            value="all" 
          />
          <Tab 
            icon={<TodayIcon />} 
            iconPosition="start" 
            label="This Month" 
            value="month" 
          />
          <Tab 
            icon={<DateRangeIcon />} 
            iconPosition="start" 
            label="This Semester" 
            value="semester" 
          />
          <Tab 
            icon={<EventNoteIcon />} 
            iconPosition="start" 
            label="This Year" 
            value="year" 
          />
        </Tabs>
      </Box>
      
      <TextField
        fullWidth
        placeholder="Search meetings..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      
      <Divider sx={{ my: 2 }} />
      
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="meeting-select-label">Select Meeting</InputLabel>
        <Select
          labelId="meeting-select-label"
          id="meeting-select"
          value={selectedMeetingId || ''}
          label="Select Meeting"
          onChange={(e) => onMeetingChange(e.target.value)}
          disabled={loading}
          displayEmpty
          renderValue={(selected) => {
            if (!selected) return <Typography component="span">Select a meeting</Typography>;
            const meeting = meetings.find(m => m.id == selected);
            if (!meeting) return <Typography component="span">Select a meeting</Typography>;
            return (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 'medium' }}>
                  {meeting.title} 
                </Typography>
                <Typography component="span" sx={{ mx: 1 }}>-</Typography>
                <Typography component="span" sx={{ 
                  bgcolor: determineRoleType(meeting) === 'Student' ? '#e3f2fd' : '#e8f5e9',
                  color: determineRoleType(meeting) === 'Student' ? '#1565c0' : '#2e7d32',
                  fontWeight: 'bold',
                  px: 1, 
                  py: 0.5, 
                  borderRadius: 1, 
                  fontSize: '0.75rem'
                }}>
                  {determineRoleType(meeting)}
                </Typography>
                <Typography component="span" sx={{ mx: 1 }}>-</Typography>
                <Typography component="span" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                  {formatDate(meeting.meetingDate || meeting.date)}, {formatTime(meeting.startTime)}
                </Typography>
              </Box>
            );
          }}
        >
          <MenuItem value="">
            <Typography>Select a meeting</Typography>
          </MenuItem>
          {filteredMeetings.length === 0 ? (
            <MenuItem disabled>
              <Typography color="text.secondary">
                {searchTerm ? "No meetings match your search" : "No meetings available"}
              </Typography>
            </MenuItem>
          ) : (
            filteredMeetings.map((meeting) => (
              <MenuItem key={meeting.id} value={meeting.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography sx={{ fontWeight: 'medium' }}>
                    {meeting.title} 
                  </Typography>
                  <Typography component="span" sx={{ mx: 1 }}>-</Typography>
                  <Typography component="span" sx={{ 
                    bgcolor: determineRoleType(meeting) === 'Student' ? '#e3f2fd' : '#e8f5e9',
                    color: determineRoleType(meeting) === 'Student' ? '#1565c0' : '#2e7d32',
                    fontWeight: 'bold',
                    px: 1, 
                    py: 0.5, 
                    borderRadius: 1, 
                    fontSize: '0.75rem'
                  }}>
                    {determineRoleType(meeting)}
                  </Typography>
                  <Typography component="span" sx={{ mx: 1 }}>-</Typography>
                  <Typography component="span" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                    {formatDate(meeting.meetingDate || meeting.date)}, {formatTime(meeting.startTime)}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>
      
      {renderSelectedMeetingDetails()}
    </Paper>
  );
};

export default MeetingSelector; 