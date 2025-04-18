import React from 'react';
import { Typography, Box, Paper, Grid, Card, CardContent, Divider, List, ListItem, ListItemIcon, ListItemText, Button } from '@mui/material';
import { Event, Assessment, Description } from '@mui/icons-material';

const MeetingMinutes = ({ meetingMinutes, selectedMeeting, onViewChange }) => {
  const handleBack = () => {
    if (onViewChange) {
      onViewChange('meetings');
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ color: '#1a237e', fontWeight: 'bold' }}>
          Meeting Minutes
        </Typography>
        <Button 
          variant="outlined" 
          onClick={handleBack}
          sx={{ borderColor: '#1a237e', color: '#1a237e' }}
        >
          Back to Meetings
        </Button>
      </Box>
      
      {selectedMeeting ? (
        <>
          {meetingMinutes && meetingMinutes.length > 0 ? (
            <>
              {meetingMinutes.map((minute) => (
                <Card key={minute.id} variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: '#1a237e', fontWeight: 'medium' }}>
                      {minute.meeting?.title || 'Meeting Minutes'}
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Date:</strong> {minute.meeting?.meetingDate ? new Date(minute.meeting.meetingDate).toLocaleDateString() : 'Not available'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Time:</strong> {minute.meeting?.startTime || 'Not available'} - {minute.meeting?.endTime || 'Not available'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Created by:</strong> {minute.creator?.fullName || 'Unknown'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Created at:</strong> {new Date(minute.createdAt).toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                      {minute.content}
                    </Typography>
                    
                    {minute.attachments && minute.attachments.length > 0 && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                          Attachments:
                        </Typography>
                        <List dense>
                          {minute.attachments.map((attachment, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <Description sx={{ color: '#1a237e' }} />
                              </ListItemIcon>
                              <ListItemText primary={attachment.name || `Attachment ${index + 1}`} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <Box sx={{ p: 5, textAlign: 'center', border: '1px dashed #ccc', borderRadius: 2 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Meeting Minutes Available
              </Typography>
              <Typography variant="body1" color="text.secondary">
                There are no minutes available for this meeting yet.
              </Typography>
            </Box>
          )}
        </>
      ) : (
        <Box sx={{ p: 5, textAlign: 'center', border: '1px dashed #ccc', borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Select a Meeting
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Please select a meeting from the schedule to view its minutes.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => onViewChange('schedule')}
            startIcon={<Event />}
            sx={{ mt: 2, bgcolor: '#1a237e' }}
          >
            View Meeting Schedule
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default MeetingMinutes;