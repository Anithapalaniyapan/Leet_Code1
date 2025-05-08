import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box, Typography, Grid, Paper, Card, CardContent, Button, Alert, CircularProgress, Fade,
  FormControl, InputLabel, Select, MenuItem, Chip
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { clearReportState } from '../../../redux/slices/reportSlice';
import axios from 'axios';

const ReportTap = ({ 
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
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  
  // Track individual loading states for each button
  const [loadingStates, setLoadingStates] = useState({
    'department-stats': false,
    'overall-stats': false
  });

  // Fetch meetings when component mounts
  useEffect(() => {
    fetchMeetings();
  }, []);

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

  // Fetch meetings from API
  const fetchMeetings = async () => {
    setLoadingMeetings(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/meetings/all', {
        headers: {
          'x-access-token': token
        }
      });
      
      if (response.data) {
        // Sort meetings by date in descending order (newest first)
        const sortedMeetings = Array.isArray(response.data) ? response.data : [];
        
        sortedMeetings.sort((a, b) => {
          return new Date(b.meetingDate || b.date || '') - new Date(a.meetingDate || a.date || '');
        });
        
        console.log('Fetched meetings:', sortedMeetings);
        setMeetings(sortedMeetings);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoadingMeetings(false);
    }
  };
  
  // Handle meeting selection change
  const handleMeetingChange = (e) => {
    const meetingId = e.target.value;
    setSelectedMeetingId(meetingId);
    
    // Find the selected meeting object
    const meeting = meetings.find(m => m.id == meetingId);
    console.log('Selected meeting:', meeting);
    setSelectedMeeting(meeting || null);
  };

  // Get meeting display text
  const getMeetingDisplayText = (meeting) => {
    if (!meeting) return "Select a meeting";
    
    const roleType = determineRoleType(meeting);
    const formattedTime = formatTime(meeting.startTime);
    const formattedDate = formatDate(meeting.meetingDate || meeting.date);
    
    return `${meeting.title} - ${roleType} - ${formattedDate}, ${formattedTime}`;
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

  // Handle meeting-specific department stats
  const handleMeetingDepartmentStats = async () => {
    if (!selectedMeetingId) {
      alert('Please select a meeting first');
      return;
    }

    // Set the loading state for department stats button
    setLoadingStates(prev => ({
      ...prev,
      'department-stats': true
    }));

    try {
      const token = localStorage.getItem('token');
      
      // If no department selected, use the overall departments stats endpoint
      const url = selectedDepartmentForStats
        ? `http://localhost:8080/api/feedback/excel/meeting/${selectedMeetingId}/department/${selectedDepartmentForStats}`
        : `http://localhost:8080/api/feedback/excel/meeting/${selectedMeetingId}/overall`;
        
      const filename = selectedDepartmentForStats
        ? `meeting_${selectedMeetingId}_department_${selectedDepartmentForStats}_stats.xlsx`
        : `meeting_${selectedMeetingId}_all_departments_stats.xlsx`;
      
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'blob', // Important for file downloads
        headers: {
          'x-access-token': token
        }
      });

      // Create a download link and trigger download
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading department stats:', error);
      alert('Failed to download department statistics. Please try again later.');
    } finally {
      // Reset the loading state
      setTimeout(() => {
        setLoadingStates(prev => ({
          ...prev,
          'department-stats': false
        }));
      }, 500);
    }
  };

  // Handle meeting-specific overall stats
  const handleMeetingOverallStats = async () => {
    if (!selectedMeetingId) {
      alert('Please select a meeting first');
      return;
    }

    // Set the loading state for overall stats button
    setLoadingStates(prev => ({
      ...prev,
      'overall-stats': true
    }));

    try {
      const token = localStorage.getItem('token');
      const response = await axios({
        method: 'GET',
        url: `http://localhost:8080/api/feedback/excel/meeting/${selectedMeetingId}/overall`,
        responseType: 'blob', // Important for file downloads
        headers: {
          'x-access-token': token
        }
      });

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `meeting_${selectedMeetingId}_overall_stats.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading overall stats:', error);
      alert('Failed to download overall statistics. Please try again later.');
    } finally {
      // Reset the loading state
      setTimeout(() => {
      setLoadingStates(prev => ({
        ...prev,
          'overall-stats': false
      }));
      }, 500);
    }
  };

  // Render meeting details component
  const renderMeetingDetails = () => {
    if (!selectedMeeting) return null;
    
    const roleType = determineRoleType(selectedMeeting);
    const formattedTime = formatTime(selectedMeeting.startTime);
    const formattedDate = formatDate(selectedMeeting.meetingDate || selectedMeeting.date);
    
    return (
      <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, border: '1px solid #e0e0e0' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Selected Meeting: {selectedMeeting.title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Chip 
            label={roleType}
            size="small"
            sx={{ 
              bgcolor: roleType === 'Student' ? '#e3f2fd' : '#e8f5e9',
              color: roleType === 'Student' ? '#1565c0' : '#2e7d32',
              fontWeight: 'bold',
              mr: 2
            }}
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <CalendarTodayIcon sx={{ fontSize: 18, mr: 0.5, color: '#666' }} />
            <Typography variant="body2">{formattedDate}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccessTimeIcon sx={{ fontSize: 18, mr: 0.5, color: '#666' }} />
            <Typography variant="body2">{formattedTime}</Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3, position: 'relative' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Reports
      </Typography>
      
      {/* Consistent loading UI overlay */}
      {loading && (
        <Fade in={loading}>
          <Box sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backgroundColor: 'rgba(25, 118, 210, 0.05)',
            backdropFilter: 'blur(5px)'
          }}>
            <CircularProgress size={60} thickness={4} sx={{ color: '#1A2137', mb: 3 }} />
            <Box sx={{
              mt: 4,
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '12px 24px',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(0, 0, 0, 0.05)'
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  background: 'linear-gradient(45deg, #3f51b5 30%, #00acc1 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                Reports
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Generating your reports...
              </Typography>
            </Box>
          </Box>
        </Fade>
      )}
      
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
              Export feedback statistics from the selected meeting to Excel files for further analysis.
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Card sx={{ p: 2, bgcolor: '#f8f9fa', height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Department Stats
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Export department-by-department performance statistics to Excel
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={loadingStates['department-stats'] ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                      onClick={handleMeetingDepartmentStats}
                      disabled={!selectedMeetingId || loadingStates['department-stats']}
                      fullWidth
                      sx={{ 
                        bgcolor: '#2196F3', 
                        '&:hover': { bgcolor: '#1565C0' }
                      }}
                    >
                      {loadingStates['department-stats'] ? 'Downloading...' : 'Export Department Stats'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6}>
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
                      onClick={handleMeetingOverallStats}
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
      </Grid>
    </Box>
  );
};

export default ReportTap; 