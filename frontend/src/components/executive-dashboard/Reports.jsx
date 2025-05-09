import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box, Typography, Grid, Paper, Card, CardContent, Button, Alert, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Fade
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { clearReportState } from '../../redux/slices/reportSlice';
import axios from 'axios';

const Reports = ({ 
  departments,
  handleExportToExcel, 
  handleDownloadReport, 
  loading,
  selectedDepartmentForStats 
}) => {
  const dispatch = useDispatch();
  const { downloadSuccess, generationSuccess, error } = useSelector(state => state.reports);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  
  // Track individual loading states for each button
  const [loadingStates, setLoadingStates] = useState({
    'feedback-all': false,
    'department-stats': false,
    'overall-stats': false,
    'student': false,
    'staff': false
  });

  // Fetch meetings when component mounts
  useEffect(() => {
    fetchMeetings();
  }, []);

  // Helper function to determine role type
  const determineRoleType = (meeting) => {
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

  // Fetch meetings from API
  const fetchMeetings = async () => {
    setLoadingMeetings(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/meetings', {
        headers: {
          'x-access-token': token
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        // Sort meetings by date in descending order (newest first)
        const sortedMeetings = response.data.sort((a, b) => {
          return new Date(b.meetingDate || b.date || '') - new Date(a.meetingDate || a.date || '');
        });
        setMeetings(sortedMeetings);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoadingMeetings(false);
    }
  };
  
  // Debug props
  useEffect(() => {
    console.log('Reports component received props:');
    console.log('- handleExportToExcel:', typeof handleExportToExcel);
    console.log('- handleDownloadReport:', typeof handleDownloadReport);
    console.log('- selectedDepartmentForStats:', selectedDepartmentForStats);
  }, [handleExportToExcel, handleDownloadReport, selectedDepartmentForStats]);
  // Clear report states when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearReportState());
    };
  }, [dispatch]);

  // Create safe handlers that check if functions exist before calling
  const handleExport = (reportType) => {
    if (!selectedMeetingId) {
      alert('Please select a meeting first');
      return;
    }

    console.log('Export requested for:', reportType, 'meeting:', selectedMeetingId);
    // Set only this button's loading state to true
    setLoadingStates(prev => ({
      ...prev,
      [reportType]: true
    }));
    
    if (typeof handleExportToExcel === 'function') {
      // Create a Promise to handle the loading state
      Promise.resolve()
        .then(() => handleExportToExcel(reportType, selectedMeetingId))
        .catch(err => console.error(err))
        .finally(() => {
          // Always reset loading state in the component
          setTimeout(() => {
            setLoadingStates(prev => ({
              ...prev,
              [reportType]: false
            }));
          }, 500); // Small delay to ensure it completes
        });
    } else {
      console.error('handleExportToExcel is not a function', handleExportToExcel);
      alert('Export functionality is not available. Please try again later.');
      // Reset loading state if function doesn't exist
      setLoadingStates(prev => ({
        ...prev,
        [reportType]: false
      }));
    }
  };

  const handleDownload = (role, type) => {
    if (!selectedMeetingId) {
      alert('Please select a meeting first');
      return;
    }

    console.log('Download requested for role:', role, 'type:', type, 'meeting:', selectedMeetingId);
    // Set only this button's loading state to true
    setLoadingStates(prev => ({
      ...prev,
      [role]: true
    }));
    
    if (typeof handleDownloadReport === 'function') {
      // Create a Promise to handle the loading state
      Promise.resolve()
        .then(() => handleDownloadReport(role, type, selectedMeetingId))
        .catch(err => console.error(err))
        .finally(() => {
          // Always reset loading state in the component
          setTimeout(() => {
            setLoadingStates(prev => ({
              ...prev,
              [role]: false
            }));
          }, 500); // Small delay to ensure it completes
        });
    } else {
      console.error('handleDownloadReport is not a function', handleDownloadReport);
      alert('Download functionality is not available. Please try again later.');
      // Reset loading state if function doesn't exist
      setLoadingStates(prev => ({
        ...prev,
        [role]: false
      }));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Reports
      </Typography>
      
      {downloadSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Report downloaded successfully!
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={4}>
        {/* Meeting Selection Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, color: '#1A2137' }}>
              Select Meeting
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please select a meeting first. All reports will only include feedback data from the selected meeting.
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="meeting-select-label">Select Meeting</InputLabel>
              <Select
                labelId="meeting-select-label"
                id="meeting-select"
                value={selectedMeetingId}
                label="Select Meeting"
                onChange={(e) => setSelectedMeetingId(e.target.value)}
                disabled={loadingMeetings}
              >
                <MenuItem value="">
                  <em>Select a meeting</em>
                </MenuItem>
                {meetings.map((meeting) => (
                  <MenuItem key={meeting.id} value={meeting.id}>
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
                        {new Date(meeting.meetingDate || meeting.date).toLocaleDateString()}, {formatTime(meeting.startTime)}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {!selectedMeetingId && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                You must select a meeting before downloading any reports. Reports will only contain data from the selected meeting.
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Analytics Data Export Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, color: '#1A2137' }}>
              Export Analytics Data (Excel)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Export feedback data and statistics from the Analytics section to Excel files for further analysis.
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ p: 2, bgcolor: '#f8f9fa', height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                      All Feedback
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Export all raw feedback responses with user information to Excel
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={loadingStates['feedback-all'] ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                      onClick={() => handleExport('feedback-all')}
                      disabled={!selectedMeetingId || loadingStates['feedback-all']}
                      fullWidth
                      sx={{ 
                        bgcolor: '#4CAF50', 
                        '&:hover': { bgcolor: '#388E3C' }
                      }}
                    >
                      {loadingStates['feedback-all'] ? 'Downloading...' : 'Export All Feedback'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ p: 2, bgcolor: '#f8f9fa', height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Overall Summary
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Export overall feedback statistics and trends to Excel
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={loadingStates['overall-stats'] ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                      onClick={() => handleExport('overall-stats')}
                      disabled={!selectedMeetingId || loadingStates['overall-stats']}
                      fullWidth
                      sx={{ 
                        bgcolor: '#9C27B0', 
                        '&:hover': { bgcolor: '#7B1FA2' }
                      }}
                    >
                      {loadingStates['overall-stats'] ? 'Downloading...' : 'Export Summary Stats'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f7', borderRadius: 1, borderLeft: '4px solid #1976d2' }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Note:</strong> These reports are generated in Excel format for easy analysis and can be opened in Microsoft Excel, Google Sheets, or any compatible spreadsheet software.
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Individual Reports Section (Excel) */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, color: '#1A2137' }}>
              Individual Excel Reports
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Generate detailed individual reports by role type in Excel format.
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ p: 2, bgcolor: '#f8f9fa', height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Student Reports
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Individual student feedback organized by department
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={loadingStates['student'] ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                      onClick={() => handleDownload('student', 'individual')}
                      disabled={!selectedMeetingId || loadingStates['student']}
                      fullWidth
                      sx={{ 
                        bgcolor: '#FF9800', 
                        '&:hover': { bgcolor: '#F57C00' }
                      }}
                    >
                      {loadingStates['student'] ? 'Downloading...' : 'Export Student Reports'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ p: 2, bgcolor: '#f8f9fa', height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Staff Reports
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Individual staff feedback organized by department
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={loadingStates['staff'] ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                      onClick={() => handleDownload('staff', 'individual')}
                      disabled={!selectedMeetingId || loadingStates['staff']}
                      fullWidth
                      sx={{ 
                        bgcolor: '#607D8B', 
                        '&:hover': { bgcolor: '#455A64' }
                      }}
                    >
                      {loadingStates['staff'] ? 'Downloading...' : 'Export Staff Reports'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports; 