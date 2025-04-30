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

const CreateMeetingForm = ({ departments = [], handleSubmit, handleCancel, initialData, isEditing }) => {
  // Enhanced function to convert role to string format
  const convertRoleToString = (role) => {
    if (role === 1 || role === '1' || role === 'student' || (typeof role === 'string' && role.toLowerCase() === 'student')) {
      return 'student';
    } else if (role === 2 || role === '2' || role === 'staff' || (typeof role === 'string' && role.toLowerCase() === 'staff')) {
      return 'staff';
    }
    
    // Try to extract role from object
    if (typeof role === 'object' && role !== null) {
      if (role.id === 1 || role.id === '1' || (role.name && role.name.toLowerCase().includes('student'))) {
        return 'student';
      } else if (role.id === 2 || role.id === '2' || (role.name && role.name.toLowerCase().includes('staff'))) {
        return 'staff';
      }
    }
    
    // Default to empty if we can't determine the role
    return '';
  };
  
  // Helper function to normalize department ID
  const normalizeDepartmentId = (deptId) => {
    if (deptId === null || deptId === undefined) return '';
    
    // If it's already a string, return it
    if (typeof deptId === 'string') return deptId;
    
    // If it's a number, convert to string
    if (typeof deptId === 'number') return deptId.toString();
    
    // Try to get ID from department object
    if (typeof deptId === 'object' && deptId !== null) {
      if (deptId.id) return deptId.id.toString();
    }
    
    // Fall back to empty string
    return '';
  };

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Add console.log to inspect departments prop
  console.log('CreateMeetingForm departments:', departments);

  // Initialize form with initial data if provided (for editing)
  useEffect(() => {
    if (initialData) {
      console.log('Initializing form with data:', initialData);
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        meetingDate: initialData.meetingDate || initialData.date || '',
        startTime: initialData.startTime || '',
        endTime: initialData.endTime || '',
        role: convertRoleToString(initialData.role || initialData.roleId),
        departmentId: normalizeDepartmentId(initialData.departmentId),
        year: initialData.year?.toString() || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = async (e) => {
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

      // Call parent's handleSubmit function
      await handleSubmit(meetingData);

      // Show success message
      setSnackbar({
        open: true,
        message: isEditing ? 'Meeting updated successfully' : 'Meeting created successfully',
        severity: 'success'
      });

      // Reset form if not editing
      if (!isEditing) {
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
      }

    } catch (error) {
      console.error(isEditing ? 'Error updating meeting:' : 'Error creating meeting:', error);
      setError(error.message || 'An error occurred');
      setSnackbar({
        open: true,
        message: `Error: ${error.message || 'An error occurred'}`,
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
    <Box component="form" onSubmit={handleFormSubmit} sx={{ mt: 2 }}>
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
              {departments && departments.length > 0 ? (
                departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id.toString()}>
                    {dept.name || `Department ${dept.id}`}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>
                  No departments available
                </MenuItem>
              )}
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
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            {handleCancel && (
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Meeting' : 'Create Meeting')}
            </Button>
          </Box>
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

// Default props
CreateMeetingForm.defaultProps = {
  departments: [],
  handleSubmit: () => {},
  handleCancel: null,
  initialData: null,
  isEditing: false
};

export default CreateMeetingForm; 