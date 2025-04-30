import React from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  Chip
} from '@mui/material';

/**
 * Minutes of Meetings Tab component for displaying HOD responses to meeting minutes
 */
const MinutesOfMeetingsTab = ({
  departments,
  selectedDepartment,
  selectedDeptName,
  hodResponses,
  loading,
  onMinutesDepartmentChange
}) => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Minutes of Meetings - HOD Responses
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="department-select-label">Select Department</InputLabel>
          <Select
            labelId="department-select-label"
            id="department-select"
            value={selectedDepartment}
            onChange={onMinutesDepartmentChange}
            label="Select Department"
            displayEmpty
            renderValue={(selected) => {
              if (!selected) {
                return <em>Select Department</em>;
              }
              
              const dept = departments.find(d => d.id === parseInt(selected));
              return dept ? dept.name : 'Select Department';
            }}
          >
            <MenuItem value="">
              <em>Select Department</em>
            </MenuItem>
            {departments.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>
                {dept.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {loading ? (
          <LinearProgress sx={{ my: 4 }} />
        ) : !selectedDepartment ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Please select a department to view HOD responses.
          </Alert>
        ) : hodResponses.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            No responses found for {selectedDeptName}.
          </Alert>
        ) : (
          <Box>
            {hodResponses.map((question) => {
              // Check if this question has an HOD response
              if (!question.hodResponse) return null;
              
              // Get department name
              const departmentName = selectedDeptName;
              
              return (
                <Paper 
                  key={question.id} 
                  elevation={2} 
                  sx={{ 
                    p: 3, 
                    mb: 3, 
                    borderLeft: '4px solid #1976d2',
                    transition: 'all 0.3s',
                    '&:hover': { boxShadow: 6 }
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 1, color: '#1976d2' }}>
                    {question.text}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label={`Department: ${departmentName}`} 
                      size="small" 
                      color="primary" 
                      sx={{ mr: 1, mb: 1 }} 
                    />
                    <Chip 
                      label={`Role: ${question.role}`} 
                      size="small" 
                      color="secondary" 
                      sx={{ mr: 1, mb: 1 }} 
                    />
                    {question.year && (
                      <Chip 
                        label={`Year: ${question.year}`} 
                        size="small" 
                        color="info" 
                        sx={{ mr: 1, mb: 1 }} 
                      />
                    )}
                  </Box>
                  
                  <Box sx={{ 
                    bgcolor: '#f5f5f5', 
                    p: 2, 
                    borderRadius: 1,
                    border: '1px solid #e0e0e0'
                  }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Action Taken from HOD of {departmentName}:
                    </Typography>
                    <Typography variant="body1">
                      {question.hodResponse.response || 'No response provided'}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                      {question.hodResponse.createdAt ? 
                        `Submitted on: ${new Date(question.hodResponse.createdAt).toLocaleString()}` : 
                        ''}
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default MinutesOfMeetingsTab; 