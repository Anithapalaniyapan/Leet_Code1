import React from 'react';
import { Typography, Box, Paper, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button } from '@mui/material';
import { Event } from '@mui/icons-material';

const MeetingSchedule = ({ meetings, handleViewChange }) => {
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
  };

  const formatTime = (timeStr) => {
    return timeStr;
  };

  const renderMeetingList = (meetingList) => {
    return meetingList.map((meeting) => (
      <Box
        key={meeting.id}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          py: 1.5
        }}
      >
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
            {formatDate(meeting.meetingDate)}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {formatTime(meeting.startTime)}
          </Typography>
        </Box>
      </Box>
    ));
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ color: '#1a237e', fontWeight: 'bold' }}>
          Meeting Schedule
        </Typography>
      </Box>
      
      <Tabs 
        value={0} 
        indicatorColor="primary"
        textColor="primary"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="All Meetings" />
      </Tabs>
      
      {/* Current Meetings */}
      {meetings.currentMeetings && meetings.currentMeetings.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#1a237e', fontWeight: 'medium', display: 'flex', alignItems: 'center' }}>
            <Event sx={{ mr: 1 }} /> Today's Meetings
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#e8eaf6' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {meetings.currentMeetings.map((meeting) => (
                  <TableRow key={meeting.id}>
                    <TableCell>{meeting.title}</TableCell>
                    <TableCell>
                      {new Date(meeting.meetingDate).toLocaleDateString()}<br />
                      {meeting.startTime} - {meeting.endTime || 'TBD'}
                    </TableCell>
                    <TableCell>{meeting.location || 'Not specified'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={meeting.status} 
                        size="small" 
                        color={meeting.status === 'scheduled' ? 'primary' : meeting.status === 'in-progress' ? 'warning' : meeting.status === 'completed' ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => handleViewChange('minutes', meeting.id)}
                      >
                        View Minutes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
      
      {/* Future Meetings */}
      {meetings.futureMeetings && meetings.futureMeetings.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#1a237e', fontWeight: 'medium', display: 'flex', alignItems: 'center' }}>
            <Event sx={{ mr: 1 }} /> Upcoming Meetings
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#e8eaf6' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {meetings.futureMeetings.map((meeting) => (
                  <TableRow key={meeting.id}>
                    <TableCell>{meeting.title}</TableCell>
                    <TableCell>{new Date(meeting.meetingDate).toLocaleDateString()}</TableCell>
                    <TableCell>{meeting.startTime} - {meeting.endTime || 'TBD'}</TableCell>
                    <TableCell>{meeting.location || 'Not specified'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={meeting.status} 
                        size="small" 
                        color={meeting.status === 'scheduled' ? 'primary' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
      
      {/* Past Meetings */}
      {meetings.pastMeetings && meetings.pastMeetings.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ color: '#1a237e', fontWeight: 'medium', display: 'flex', alignItems: 'center' }}>
            <Event sx={{ mr: 1 }} /> Past Meetings
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#e8eaf6' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {meetings.pastMeetings.map((meeting) => (
                  <TableRow key={meeting.id}>
                    <TableCell>{meeting.title}</TableCell>
                    <TableCell>{new Date(meeting.meetingDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={meeting.status} 
                        size="small" 
                        color={meeting.status === 'completed' ? 'success' : meeting.status === 'cancelled' ? 'error' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => handleViewChange('minutes', meeting.id)}
                      >
                        View Minutes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
      
      {/* No meetings message */}
      {(!meetings.currentMeetings || meetings.currentMeetings.length === 0) && 
       (!meetings.futureMeetings || meetings.futureMeetings.length === 0) && 
       (!meetings.pastMeetings || meetings.pastMeetings.length === 0) && (
        <Box sx={{ p: 5, textAlign: 'center', border: '1px dashed #ccc', borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Meetings Scheduled
          </Typography>
          <Typography variant="body1" color="text.secondary">
            There are currently no meetings scheduled for your department and year.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default MeetingSchedule;