import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const MeetingManagement = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    department: '',
    year: ''
  });

  // Fetch meetings
  useEffect(() => {
    const fetchMeetings = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:8080/api/meetings', {
          headers: {
            'x-access-token': localStorage.getItem('token')
          }
        });
        setMeetings(response.data);
      } catch (error) {
        console.error('Error in fetchMeetings:', error);
        setError(error.message);
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Failed to load meetings. Please try again later.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  const handleOpenDialog = (meeting = null) => {
    if (meeting) {
      setEditingMeeting(meeting);
      setFormData({
        title: meeting.title,
        date: meeting.date,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        location: meeting.location,
        department: meeting.department,
        year: meeting.year
      });
    } else {
      setEditingMeeting(null);
      setFormData({
        title: '',
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        department: '',
        year: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMeeting(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingMeeting) {
        await axios.put(`http://localhost:8080/api/meetings/${editingMeeting.id}`, formData, {
          headers: {
            'x-access-token': localStorage.getItem('token')
          }
        });
        setMeetings(meetings.map(m => m.id === editingMeeting.id ? { ...m, ...formData } : m));
      } else {
        const response = await axios.post('http://localhost:8080/api/meetings', formData, {
          headers: {
            'x-access-token': localStorage.getItem('token')
          }
        });
        setMeetings([...meetings, response.data]);
      }
      setSnackbar({
        open: true,
        message: `Meeting ${editingMeeting ? 'updated' : 'created'} successfully`,
        severity: 'success'
      });
      handleCloseDialog();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || `Failed to ${editingMeeting ? 'update' : 'create'} meeting`,
        severity: 'error'
      });
    }
  };

  const handleDelete = async (meetingId) => {
    try {
      await axios.delete(`http://localhost:8080/api/meetings/${meetingId}`, {
        headers: {
          'x-access-token': localStorage.getItem('token')
        }
      });
      setMeetings(meetings.filter(m => m.id !== meetingId));
      setSnackbar({
        open: true,
        message: 'Meeting deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error in handleDelete:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to delete meeting',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Manage Meetings</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Meeting
        </Button>
      </Box>

      <Grid container spacing={3}>
        {meetings.map((meeting) => (
          <Grid item xs={12} md={6} lg={4} key={meeting.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {meeting.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Date: {new Date(meeting.date).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Time: {meeting.startTime} - {meeting.endTime}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Location: {meeting.location}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <IconButton onClick={() => handleOpenDialog(meeting)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(meeting.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {editingMeeting ? 'Edit Meeting' : 'Add New Meeting'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              fullWidth
            />
            <TextField
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Start Time"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Time"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                label="Department"
              >
                <MenuItem value="1">Computer Science</MenuItem>
                <MenuItem value="2">Information Technology</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Year</InputLabel>
              <Select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                label="Year"
              >
                <MenuItem value="1">1st Year</MenuItem>
                <MenuItem value="2">2nd Year</MenuItem>
                <MenuItem value="3">3rd Year</MenuItem>
                <MenuItem value="4">4th Year</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingMeeting ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MeetingManagement; 