import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import axios from 'axios';

const CreateMeetingForm = ({ onMeetingCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    meetingDate: '',
    startTime: '',
    endTime: '',
    role: '',
    departmentId: '',
    year: ''
  });

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/departments', {
        headers: {
          'x-access-token': token
        }
      });
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Failed to load departments');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.title || !formData.meetingDate || !formData.startTime || 
          !formData.endTime || !formData.role || !formData.departmentId) {
        throw new Error('Please fill in all required fields');
      }

      // Validate year for student meetings
      if (formData.role === 'student' && !formData.year) {
        throw new Error('Please select a year for student meeting');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Format the data for API
      const meetingData = {
        title: formData.title,
        description: formData.description,
        meetingDate: formData.meetingDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        role: formData.role === 'student' ? 1 : 2, // 1 for student, 2 for staff
        departmentId: parseInt(formData.departmentId),
        year: formData.role === 'student' ? parseInt(formData.year) : null
      };

      const response = await axios.post('http://localhost:8080/api/meetings', meetingData, {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });

      // Show success message
      setSnackbar({
        open: true,
        message: 'Meeting created successfully',
        severity: 'success'
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        meetingDate: '',
        startTime: '',
        endTime: '',
        role: '',
        departmentId: '',
        year: ''
      });

      // Notify parent component
      if (onMeetingCreated) {
        onMeetingCreated(response.data);
      }

    } catch (error) {
      console.error('Error creating meeting:', error);
      setError(error.response?.data?.message || error.message);
      setSnackbar({
        open: true,
        message: `Error: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            name="title"
            label="Meeting Title"
            required
            fullWidth
            value={formData.title}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            name="description"
            label="Description"
            multiline
            rows={3}
            fullWidth
            value={formData.description}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            name="meetingDate"
            label="Meeting Date"
            type="date"
            required
            fullWidth
            value={formData.meetingDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            name="startTime"
            label="Start Time"
            type="time"
            required
            fullWidth
            value={formData.startTime}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            name="endTime"
            label="End Time"
            type="time"
            required
            fullWidth
            value={formData.endTime}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth required>
            <InputLabel>Role</InputLabel>
            <Select
              name="role"
              value={formData.role}
              onChange={handleChange}
              label="Role"
            >
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="staff">Staff</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth required>
            <InputLabel>Department</InputLabel>
            <Select
              name="departmentId"
              value={formData.departmentId}
              onChange={handleChange}
              label="Department"
            >
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {formData.role === 'student' && (
          <Grid item xs={12} md={4}>
            <FormControl fullWidth required>
              <InputLabel>Year</InputLabel>
              <Select
                name="year"
                value={formData.year}
                onChange={handleChange}
                label="Year"
              >
                <MenuItem value="1">Year 1</MenuItem>
                <MenuItem value="2">Year 2</MenuItem>
                <MenuItem value="3">Year 3</MenuItem>
                <MenuItem value="4">Year 4</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? 'Creating...' : 'Create Meeting'}
          </Button>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateMeetingForm; 