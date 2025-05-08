import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Box, LinearProgress, Snackbar, Alert, Typography, Paper, FormControl, InputLabel, Select, MenuItem, Grid, CircularProgress, Fade } from '@mui/material';
import { setActiveSection } from '../../redux/slices/uiSlice';
import { clearReportState} from '../../redux/slices/reportSlice';

// Import components from executive-dashboard folder
import Meetings from '../executive-dashboard/Meetings';
import MinutesOfMeetings from '../executive-dashboard/MinutesOfMeetings';
import Profile from '../executive-dashboard/Profile';
import Sidebar from '../executive-dashboard/Sidebar';
import Reports from '../executive-dashboard/Reports';

// Import the new Analytics component
import Analytics from '../analytics/Analytics';

const ExecutiveDirectorDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { activeSection } = useSelector(state => state.ui);
  const { loading: reportLoading, error: reportError, downloadSuccess } = useSelector(state => state.reports);
  
  const [userProfile, setUserProfile] = useState({});
  const [meetings, setMeetings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentForStats, setSelectedDepartmentForStats] = useState('');
  const [departmentFeedback, setDepartmentFeedback] = useState({});
  const [departmentFeedbackLoading, setDepartmentFeedbackLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportDownloadLoading, setReportDownloadLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Set initial active section
  useEffect(() => {
    dispatch(setActiveSection('profile'));
  }, [dispatch]);

  // Check authentication and role on component mount
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
    
        const response = await axios.get('http://localhost:8080/api/auth/verify', {
          headers: {
            'x-access-token': token
          }
        });

        if (!response.data.valid) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
    
        const userRoles = response.data.user.roles;
        if (!userRoles.includes('executive_director')) {
          setError('You do not have permission to access this dashboard');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
          return;
        }

        setUserProfile(response.data.user);
        await Promise.all([
          fetchMeetings(),
          fetchDepartments()
        ]);
      } catch (error) {
        console.error('Authentication error:', error);
        setError(error.response?.data?.message || 'Authentication failed');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Fetch meetings data
  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Fetching meetings for Executive Director dashboard');
      
      try {
        // Use the standard /meetings endpoint to get all meetings
        const response = await axios.get('http://localhost:8080/api/meetings', {
          headers: {
            'x-access-token': token,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data && Array.isArray(response.data)) {
          console.log(`Received ${response.data.length} meetings from API`);
          
          // Process meetings to ensure roleId is present
          const processedMeetings = response.data.map(meeting => {
            // Create a new meeting object with all existing properties
            const processedMeeting = { ...meeting };
            
            // Ensure roleId is present - default to 1 (student) if not specified
            if (!processedMeeting.roleId && !processedMeeting.role) {
              // Try to determine roleId from various meeting properties
              if (processedMeeting.isStaffMeeting || 
                  (processedMeeting.targetRole && 
                   processedMeeting.targetRole.toLowerCase().includes('staff'))) {
                processedMeeting.roleId = 2; // Staff
              } else {
                processedMeeting.roleId = 1; // Default to Student
              }
              console.log(`Set roleId ${processedMeeting.roleId} for meeting: ${processedMeeting.title}`);
            }
            
            return processedMeeting;
          });
          
          // Executive Director should see ALL meetings regardless of role/department/year
          const sortedMeetings = processedMeetings.sort((a, b) => {
            const dateA = new Date(a.meetingDate || a.date || '');
            const dateB = new Date(b.meetingDate || b.date || '');
            return dateA - dateB;
          });
          
          // Store meetings in localStorage for offline access
          localStorage.setItem('allMeetings', JSON.stringify(sortedMeetings));
          setMeetings(sortedMeetings);
          console.log('Meetings set in state:', sortedMeetings.length);
        } else {
          console.error('Invalid meeting data format:', response.data);
          setMeetings([]);
        }
      } catch (apiError) {
        console.error('API fetch failed, trying localStorage:', apiError);
        
        // If API fails with 401, clear token and redirect to login
        if (apiError.response?.status === 401) {
          localStorage.removeItem('token');
          setSnackbar({
            open: true,
            message: 'Session expired. Please log in again.',
            severity: 'error'
          });
          navigate('/login');
          return;
        }
        
        // If API fails for other reasons, try to load from localStorage
        const storedMeetings = localStorage.getItem('allMeetings');
        if (storedMeetings) {
          try {
            const parsedMeetings = JSON.parse(storedMeetings);
            if (Array.isArray(parsedMeetings)) {
              console.log('Loaded meetings from localStorage:', parsedMeetings.length);
              setMeetings(parsedMeetings);
            }
          } catch (parseError) {
            console.error('Error parsing stored meetings:', parseError);
            setMeetings([]);
          }
        } else {
          setMeetings([]);
        }
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setError('Failed to load meetings');
      setMeetings([]);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to load meetings. Please try again later.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch departments
  const fetchDepartments = async () => {
    try {
      console.log("Fetching departments...");
      const token = localStorage.getItem('token');
      
      try {
        const response = await axios.get('http://localhost:8080/api/departments', {
          headers: { 'x-access-token': token }
        });
        
        if (response.data && Array.isArray(response.data)) {
          console.log("Departments fetched successfully:", response.data);
          
          // Process and format the department data
          const formattedDepartments = response.data.map(dept => ({
            id: dept.id,
            name: dept.name || 'Unknown Department',
            // Add any additional properties you need
            roleId: dept.roleId,
            hodId: dept.hodId
          }));
          
          console.log("Formatted departments:", formattedDepartments);
          
          if (formattedDepartments.length > 0) {
            setDepartments(formattedDepartments);
            setSelectedDepartmentForStats(String(formattedDepartments[0].id));
          } else {
            // No departments returned, use mock data
            console.log("No departments returned from API, using mock data");
            createMockDepartments();
          }
        } else {
          console.warn("Invalid department data format:", response.data);
          createMockDepartments();
        }
      } catch (apiError) {
        console.error('Department API fetch error:', apiError);
        createMockDepartments();
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Failed to load departments');
      createMockDepartments();
      
      // Only show serious errors to the user
      if (error.message !== "Network Error") {
        setSnackbar({
          open: true,
          message: 'Error loading departments: ' + (error.response?.data?.message || error.message),
          severity: 'error'
        });
      }
    }
  };

  // Handle export to Excel using direct API calls instead of Redux
  const handleExportToExcel = async (reportType, meetingId) => {
    try {
      setReportDownloadLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      if (!meetingId) {
        setSnackbar({
          open: true,
          message: "Please select a meeting first",
          severity: 'warning'
        });
        setReportDownloadLoading(false);
        return;
      }
      
      let url = '';
      let filename = '';
      
      switch (reportType) {
        case 'feedback-all':
          url = `http://localhost:8080/api/feedback/excel/meeting/${meetingId}/all`;
          filename = `meeting_${meetingId}_all_feedback.xlsx`;
          break;
          
        case 'department-stats':
          // Ask user to select a department first
          if (!selectedDepartmentForStats) {
            setSnackbar({
              open: true,
              message: "Please select a department in the Analytics section first",
              severity: 'warning'
            });
            setReportDownloadLoading(false);
            return;
          }
          
          url = `http://localhost:8080/api/feedback/excel/meeting/${meetingId}/department/${selectedDepartmentForStats}`;
          filename = `meeting_${meetingId}_department_${selectedDepartmentForStats}_stats.xlsx`;
          break;
          
        case 'overall-stats':
          url = `http://localhost:8080/api/feedback/excel/meeting/${meetingId}/overall`;
          filename = `meeting_${meetingId}_overall_stats.xlsx`;
          break;
          
        default:
          throw new Error('Invalid report type');
      }
      
      // Execute the API request with proper headers for file download
      const response = await axios({
        url: url,
        method: 'GET',
        responseType: 'blob',
        headers: { 'x-access-token': token }
      });
      
      // Create a download link
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      setSnackbar({
        open: true,
        message: `Successfully exported ${filename}`,
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Export failed:', error);
      setSnackbar({
        open: true,
        message: `Failed to export: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      // Set the loading state to false
      setReportDownloadLoading(false);
    }
  };

  // Handle download report using direct API calls instead of Redux
  const handleDownloadReport = async (role, type, meetingId) => {
    try {
      setReportDownloadLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      if (!meetingId) {
        setSnackbar({
          open: true,
          message: "Please select a meeting first",
          severity: 'warning'
        });
        setReportDownloadLoading(false);
        return;
      }
      
      if (type === 'individual') {
        // Use the new backend API for individual reports
        const response = await axios({
          url: `http://localhost:8080/api/feedback/excel/meeting/${meetingId}/individual/${role}`,
          method: 'GET',
          responseType: 'blob',
          headers: { 'x-access-token': token }
        });
        
        // Create a download link
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', `meeting_${meetingId}_${role}_individual_report.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
        
        setSnackbar({
          open: true,
          message: `Successfully exported ${role} individual report for the selected meeting`,
          severity: 'success'
        });
      } else {
        // Original functionality for overall reports but with meeting filter
        const response = await axios.get(
          `http://localhost:8080/api/reports/download?role=${role}&type=${type}&meetingId=${meetingId}`,
          {
            headers: { 'x-access-token': token },
            responseType: 'blob'
          }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `meeting_${meetingId}_${role}_${type}_report.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        setSnackbar({
          open: true,
          message: 'Report downloaded successfully',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      setSnackbar({
        open: true,
        message: 'Error downloading report: ' + (error.message || 'Unknown error'),
        severity: 'error'
      });
    } finally {
      // Set the loading state to false
      setReportDownloadLoading(false);
    }
  };

  // Close snackbar handler
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  // Create mock departments when API fails
  const createMockDepartments = () => {
    console.log("Creating mock departments data");
    const mockDepartments = [
      { id: "1", name: "Computer Science" },
      { id: "2", name: "Electrical Engineering" },
      { id: "3", name: "Business Administration" },
      { id: "4", name: "Mathematics" }
    ];
    setDepartments(mockDepartments);
  };

  // Create a wrapper component for Reports to ensure proper binding of event handlers
  const ReportsWrapper = () => {
    // Make sure we're binding the event handlers correctly
    const handleExportWrapper = (reportType, meetingId) => {
      console.log('Export report called for type:', reportType, 'meeting:', meetingId);
      handleExportToExcel(reportType, meetingId);
    };

    const handleDownloadWrapper = (role, type, meetingId) => {
      console.log('Download report called for role:', role, 'type:', type, 'meeting:', meetingId);
      handleDownloadReport(role, type, meetingId);
    };

    return (
      <Reports 
        departments={departments}
        handleExportToExcel={handleExportWrapper}
        handleDownloadReport={handleDownloadWrapper}
        selectedDepartmentForStats={selectedDepartmentForStats} 
        loading={reportDownloadLoading}
      />
    );
  };

  const renderContent = () => {
    if (error) {
      return (
        <Box sx={{ mt: 4, p: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      );
    }

    switch(activeSection) {
      case 'profile':
        return <Profile userProfile={userProfile} />;
      case 'meetings':
        return <Meetings meetings={meetings} user={userProfile} />;
      case 'analytics':
        return <Analytics />;
      case 'minutesOfMeetings':
        return <MinutesOfMeetings meetings={meetings} departments={departments} />;
      case 'reports':
        return <ReportsWrapper />;
      default:
        return <Profile userProfile={userProfile} />;
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      <Sidebar />
      <Box 
        sx={{ 
          flexGrow: 1, 
          marginLeft: '240px',  // Match sidebar width
          p: 3,
          minHeight: '100vh',
          bgcolor: '#f9f9f9',  // Light background to match design
          position: 'relative'
        }}
      >
        {/* Loading overlay */}
        {(loading || reportDownloadLoading || departmentFeedbackLoading || reportLoading) && (
          <Fade in={true}>
            <Box sx={{ 
              position: 'fixed', // Changed from absolute to fixed for better centering
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center', // Center vertically
              justifyContent: 'center', // Center horizontally
              zIndex: 9999,
              backgroundColor: 'rgba(25, 118, 210, 0.05)',
              backdropFilter: 'blur(5px)',
              height: '100vh', // Ensure full height
              width: '100%', // Ensure full width
              margin: 0, // Remove any margin
              transform: 'translateY(0)', // Ensure no vertical offset
              paddingLeft: '240px' // Add padding to account for sidebar
            }}>
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transform: 'translateY(-20px)' // Small offset to adjust for visual center
              }}>
                <Box sx={{
                  width: '80px',
                  height: '80px',
                  position: 'relative',
                  animation: 'rotate 3s linear infinite',
                  '@keyframes rotate': {
                    '0%': {
                      transform: 'rotate(0deg)'
                    },
                    '100%': {
                      transform: 'rotate(360deg)'
                    }
                  }
                }}>
                  <Box sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    border: '3px solid transparent',
                    borderRadius: '50%',
                    borderTopColor: '#3f51b5',
                    borderBottomColor: '#f50057',
                    borderLeftColor: '#00acc1',
                    borderRightColor: '#ff9800',
                    filter: 'drop-shadow(0 0 8px rgba(63, 81, 181, 0.5))'
                  }} />
                  <Box sx={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    right: '10px',
                    bottom: '10px',
                    border: '3px solid transparent',
                    borderRadius: '50%',
                    borderTopColor: '#00acc1',
                    borderBottomColor: '#3f51b5',
                    borderLeftColor: '#ff9800',
                    borderRightColor: '#f50057',
                    animation: 'rotate 1.5s linear infinite reverse',
                  }} />
                </Box>

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
                    Executive Director
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Loading your dashboard...
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Fade>
        )}
        
        {/* Main content */}
        {renderContent()}
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!reportError}
        autoHideDuration={6000}
        onClose={() => dispatch(clearReportState())}
      >
        <Alert onClose={() => dispatch(clearReportState())} severity="error">
          {reportError}
        </Alert>
      </Snackbar>
      <Snackbar
        open={downloadSuccess}
        autoHideDuration={6000}
        onClose={() => dispatch(clearReportState())}
      >
        <Alert onClose={() => dispatch(clearReportState())} severity="success">
          Report downloaded successfully
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ExecutiveDirectorDashboard;