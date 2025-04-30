import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  LinearProgress,
  Paper,
  Typography,
  Button,
  Snackbar,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Import components from the academic-director directory
import {
  Sidebar,
  ProfileTab,
  MeetingManagement,
  QuestionsTab,
  ViewScheduleTab,
  tabs
} from './academic-director';

// Import updated components
import AnalyticsTap from './academic-director/AnalyticsTap';
import ReportTap from './academic-director/ReportTap';
import MinutesOfMeetings from '../executive-dashboard/MinutesOfMeetings';

// Import Redux actions
import { fetchUserProfile } from '../../redux/slices/userSlice';
import { fetchMeetings } from '../../redux/slices/meetingSlice';
import { fetchAllQuestions } from '../../redux/slices/questionSlice';
import { logout, syncAuthState } from '../../redux/slices/authSlice';

const AcademicDirectorDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Local UI state
  const [initialized, setInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDeptName, setSelectedDeptName] = useState('');
  const [hodResponses, setHodResponses] = useState([]);
  const [reports, setReports] = useState([]);
  const [loadedTabs, setLoadedTabs] = useState({});
  
  // Redux state
  const { profile } = useSelector(state => state.user);
  const { token, isAuthenticated } = useSelector(state => state.auth);
  const { meetings, loading: meetingsLoading, error: meetingsError } = useSelector(state => state.meetings);
  const { questions, loading: questionsLoading, error: questionsError } = useSelector(state => state.questions);
  
  // Combined loading state
  const loading = meetingsLoading || questionsLoading;
  
  // Combined error state
  const error = meetingsError || questionsError;

  // Synchronize token state with localStorage and Redux on mount
  useEffect(() => {
    // Synchronize Redux auth state with localStorage
    dispatch(syncAuthState());
  }, [dispatch]);

  // Check authentication first
  useEffect(() => {
    // If not authenticated redirect to login
    if (!isAuthenticated && !token && !localStorage.getItem('token')) {
      console.log('Not authenticated, redirecting to login');
      navigate('/login');
    }
  }, [isAuthenticated, token, navigate]);

  // Initialize dashboard after authentication check
  useEffect(() => {
    const initializeDashboard = async () => {
      if (initialized) return;
      
      try {
        // Ensure Redux auth state is synchronized with localStorage
        dispatch(syncAuthState());
        
        // Check tokens after synchronization
        const currentToken = token || localStorage.getItem('token');
        
        if (!currentToken) {
          console.log('No token found during initialization');
          setSnackbar({
            open: true,
            message: 'No authentication token found. Please log in again.',
            severity: 'error'
          });
          return;
        }

        console.log('Initializing dashboard, fetching user profile');
        
        // Load user profile - this will use the token from Redux state which is now synchronized
        const profileResult = await dispatch(fetchUserProfile()).unwrap();
        console.log('Profile loaded successfully:', !!profileResult);
        
        if (!profileResult) {
          throw new Error('Failed to load user profile');
        }
        
        // Verify this is an academic director
        const userRoles = profileResult.roles || [];
        let roleString = '';

        // Convert roles to a string for easier checking
        if (Array.isArray(userRoles)) {
          roleString = userRoles.join(' ').toLowerCase();
        } else if (typeof profileResult.roles === 'string') {
          roleString = profileResult.roles.toLowerCase();
        } else if (typeof profileResult.role === 'string') {
          roleString = profileResult.role.toLowerCase();
        } 

        // Also check userRole if present
        if (profileResult.userRole && typeof profileResult.userRole === 'string') {
          roleString += ' ' + profileResult.userRole.toLowerCase();
        }

        // Add originalUserRole from localStorage for additional verification
        const originalUserRole = localStorage.getItem('originalUserRole');
        if (originalUserRole) {
          roleString += ' ' + originalUserRole.toLowerCase();
        }

        // Add normalized role from localStorage
        const storedUserRole = localStorage.getItem('userRole');
        if (storedUserRole) {
          roleString += ' ' + storedUserRole.toLowerCase();
        }

        console.log('Role check - combined role string:', roleString);

        // Check various forms of academic director in the role string
        const isAcademicDirector = 
          roleString.includes('academic') || 
          roleString.includes('director') || 
          roleString.includes('academic_director') || 
          roleString.includes('academic-director') ||
          roleString.includes('academicdirector');

        console.log('Roles check:', { 
          userRoles, 
          profileRole: profileResult.role,
          roleString,
          originalUserRole,
          storedUserRole,
          isAcademicDirector 
        });
        
        if (!isAcademicDirector) {
          console.error('User is not an academic director', userRoles);
          setSnackbar({
            open: true,
            message: 'Unauthorized access: You need Academic Director permissions.',
            severity: 'error'
          });
          return;
        }
        
        // Set profile tab as loaded
        setLoadedTabs(prev => ({ ...prev, 0: true }));
        
        // Load initial data for active tab
        if (!loadedTabs[activeTab]) {
          await handleTabClick(activeTab);
        }
        
        setInitialized(true);
        console.log('Dashboard initialized successfully');
      } catch (error) {
        console.error('Initialization error:', error);
        
        // Check if it's an auth error
        if (error.message && (
            error.message.toLowerCase().includes('authentication') || 
            error.message.toLowerCase().includes('token') || 
            error.message.toLowerCase().includes('unauthorized')
          )) {
          setSnackbar({
            open: true,
            message: 'Authentication error: ' + (error.message || 'Session may have expired'),
            severity: 'error'
          });
        } else {
          setSnackbar({
            open: true,
            message: 'Failed to initialize dashboard: ' + (error.message || 'Unknown error'),
            severity: 'error'
          });
        }
      }
    };

    // Always try to initialize if not already initialized
    if (!initialized) {
      initializeDashboard();
    }
  }, [dispatch, token, isAuthenticated, activeTab, initialized, loadedTabs]);

  // Handle tab changes
  const handleTabClick = async (tabId) => {
    setActiveTab(tabId);
    
    // Don't redirect immediately if no token - let the renderContent function handle it
    if (!token && !localStorage.getItem('token')) {
      console.log('No token available for tab click - will show auth error');
      setSnackbar({
        open: true,
        message: 'Authentication error: No token found',
        severity: 'error'
      });
      return;
    }

    // Skip data loading if this tab has already been loaded
    if (loadedTabs[tabId] && !initialized) {
      console.log(`Tab ${tabId} data already loaded, skipping fetch`);
      return;
    }

    try {
      console.log(`Loading data for tab ${tabId}: ${tabs[tabId]?.label}`);
      
      switch (tabId) {
        case 0: // Profile
          // Profile is already loaded
          setLoadedTabs(prev => ({ ...prev, 0: true }));
          break;

        case 1: // Manage Meetings
        case 5: // View Schedule
          // Check if meetings data is already loaded
          if (meetings && (
              (Array.isArray(meetings.pastMeetings) && meetings.pastMeetings.length > 0) || 
              (Array.isArray(meetings.currentMeetings) && meetings.currentMeetings.length > 0) || 
              (Array.isArray(meetings.futureMeetings) && meetings.futureMeetings.length > 0) ||
              (Array.isArray(meetings) && meetings.length > 0)
          )) {
            console.log('Meetings data already loaded, skipping fetch');
            setLoadedTabs(prev => ({ ...prev, 1: true, 5: true }));
          } else {
            try {
              console.log('Fetching meetings data...');
              const result = await dispatch(fetchMeetings()).unwrap();
              console.log('Meetings fetched successfully:', result);
              
              // Mark these tabs as loaded
              setLoadedTabs(prev => ({ ...prev, 1: true, 5: true }));
              
              // Verify the data structure
              if (result) {
                console.log('Meetings structure check:', {
                  hasPastMeetings: Array.isArray(result.pastMeetings),
                  hasCurrentMeetings: Array.isArray(result.currentMeetings),
                  hasFutureMeetings: Array.isArray(result.futureMeetings),
                  pastCount: result.pastMeetings?.length || 0,
                  currentCount: result.currentMeetings?.length || 0, 
                  futureCount: result.futureMeetings?.length || 0
                });
              }
            } catch (meetingError) {
              console.error('Error fetching meetings:', meetingError);
              throw new Error(meetingError?.message || 'Failed to get meetings for current user');
            }
          }
          break;

        case 2: // Manage Questions
          // Check if questions data is already loaded
          if (Array.isArray(questions) && questions.length > 0) {
            console.log('Questions data already loaded, skipping fetch');
          } else {
            await dispatch(fetchAllQuestions()).unwrap();
          }
          
          // For Questions tab, always load meetings as well to ensure meetings dropdown works
          console.log('Loading meetings data for Questions tab...');
          await dispatch(fetchMeetings()).unwrap();
          
          // Mark tab as loaded
          setLoadedTabs(prev => ({ ...prev, 2: true }));
          break;

        case 3: // Analytics
          // The Analytics component will handle its own data fetching
          setLoadedTabs(prev => ({ ...prev, 3: true }));
          break;

        case 4: // View Reports
          if (!loadedTabs[4]) {
            await fetchReports();
            setLoadedTabs(prev => ({ ...prev, 4: true }));
          }
          break;
          
        case 6: // Minutes of Meetings
          if (!loadedTabs[6]) {
            await fetchHodResponses();
            setLoadedTabs(prev => ({ ...prev, 6: true }));
          }
          break;
      }
    } catch (error) {
      console.error('Error handling tab:', error);
      
      // Check if it's an auth error
      if (error.message && error.message.toLowerCase().includes('authentication')) {
        setSnackbar({
          open: true,
          message: 'Session expired. Please log in again.',
          severity: 'error'
        });
      } else {
        setSnackbar({
          open: true,
          message: `Error loading ${tabs[tabId]?.label || 'tab'} content: ${error.message}`,
          severity: 'error'
        });
      }
    }
  };

  // Fetch reports (still using local state for demo)
  const fetchReports = async () => {
    try {
      // Simulating reports data
      setReports([
        { 
          id: 1, 
          name: 'Computer Science Department Feedback Summary', 
          department: 'Computer Science',
          generatedDate: new Date(2023, 5, 15),
          type: 'Summary',
          status: 'Completed'
        },
        { 
          id: 2, 
          name: 'Information Technology Detailed Feedback', 
          department: 'Information Technology',
          generatedDate: new Date(2023, 5, 14),
          type: 'Detailed',
          status: 'Completed'
        },
        { 
          id: 3, 
          name: 'Electronics Department Quarterly Report', 
          department: 'Electronics',
          generatedDate: new Date(2023, 5, 10),
          type: 'Summary',
          status: 'Processing'
        },
      ]);
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  };

  // Fetch HOD responses for minutes of meetings (still using local state for demo)
  const fetchHodResponses = async () => {
    try {
      setHodResponses([]);
      
      if (!selectedDepartment) {
        return;
      }
      
      // Set selected department name
      const dept = profile?.departments?.find(d => d.id === parseInt(selectedDepartment));
      setSelectedDeptName(dept ? dept.name : 'Unknown Department');

      // Sample data for demo
      setTimeout(() => {
        setHodResponses([
          {
            id: 1,
            text: 'What steps are being taken to improve lab facilities?',
            role: 'student',
            year: '3',
            hodResponse: {
              response: 'We have ordered new equipment and upgraded existing machines. The university has allocated additional budget for the next semester.',
              createdAt: new Date(2023, 4, 15).toISOString()
            }
          },
          {
            id: 2,
            text: 'How can we improve the practical components of the curriculum?',
            role: 'staff',
            hodResponse: {
              response: 'We are introducing more industry-focused projects and hands-on workshops. Additionally, we are building partnerships with local companies for internship opportunities.',
              createdAt: new Date(2023, 4, 18).toISOString()
            }
          },
        ]);
      }, 500);
    } catch (error) {
      console.error('Error fetching HOD responses:', error);
      throw error;
    }
  };

  // Handle minutes department change
  const handleMinutesDepartmentChange = async (event) => {
    setSelectedDepartment(event.target.value);
    await fetchHodResponses();
  };

  // Handle logout
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Handle download report
  const handleDownloadReport = async (role, type) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      if (type === 'individual') {
        // Use the new backend API for individual reports
        const response = await axios({
          url: `http://localhost:8080/api/feedback/excel/individual/${role}`,
          method: 'GET',
          responseType: 'blob',
          headers: { 'x-access-token': token }
        });
        
        // Create a download link
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', `${role}_individual_report.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
        
        setSnackbar({
          open: true,
          message: `Successfully exported ${role} individual report`,
          severity: 'success'
        });
      } else {
        // Original functionality for overall reports
        const response = await axios.get(
          `http://localhost:8080/api/reports/download?role=${role}&type=${type}`,
          {
            headers: { 'x-access-token': token },
            responseType: 'blob'
          }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${role}_${type}_report.pdf`);
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
    }
  };

  // Handle export department stats
  const handleExportDepartmentStats = async (reportType) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      let url = '';
      let filename = '';
      
      switch (reportType) {
        case 'feedback-all':
          url = 'http://localhost:8080/api/feedback/excel/all';
          filename = 'all_feedback_data.xlsx';
          break;
          
        case 'department-stats':
          // Ask user to select a department first
          if (!selectedDepartment) {
            setSnackbar({
              open: true,
              message: "Please select a department in the Analytics section first",
              severity: 'warning'
            });
            return;
          }
          
          url = `http://localhost:8080/api/feedback/excel/department/${selectedDepartment}`;
          filename = `department_${selectedDepartment}_feedback_stats.xlsx`;
          break;
          
        case 'overall-stats':
          url = 'http://localhost:8080/api/feedback/excel/overall';
          filename = 'overall_feedback_stats.xlsx';
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
    }
  };

  // Handle Snackbar close
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Get department name by ID
  const getDepartmentName = (departmentId) => {
    const department = profile?.departments?.find(d => d.id === parseInt(departmentId));
    return department ? department.name : 'Unknown Department';
  };

  // Handle reset session
  const handleResetSession = () => {
    // Clear all tokens and state
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    
    // Dispatch logout to clear Redux state
    dispatch(logout());
    
    // Show message
    setSnackbar({
      open: true,
      message: 'Session reset. Please log in again.',
      severity: 'info'
    });
    
    // Redirect to login after a short delay
    setTimeout(() => {
      navigate('/login');
    }, 1500);
  };

  // Render content based on active tab
  const renderContent = () => {
    // If there's an authentication error, show a special error component
    if (!token && !localStorage.getItem('token')) {
      return (
        <Paper sx={{ p: 3, m: 2, maxWidth: '600px' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Authentication Error
          </Typography>
          <Typography paragraph>
            No authentication token found. Please log in again.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            sx={{ mt: 2 }} 
            onClick={() => navigate('/login')}
          >
            Go to Login
          </Button>
        </Paper>
      );
    }

    switch (activeTab) {
      case 0:
        return <ProfileTab />;

      case 1:
        return (
          <MeetingManagement
            getDepartmentName={getDepartmentName}
            isDataPreloaded={loadedTabs[1]}
          />
        );

      case 2:
        return <QuestionsTab isDataPreloaded={loadedTabs[2]} />;

      case 3:
        return <AnalyticsTap />;

      case 4:
        return (
          <ReportTap
            departments={profile?.departments || []}
            handleExportToExcel={handleExportDepartmentStats}
            handleDownloadReport={handleDownloadReport}
            loading={loading}
            selectedDepartmentForStats={selectedDepartment}
          />
        );

      case 5:
        return (
          <ViewScheduleTab
            getDepartmentName={getDepartmentName}
            isDataPreloaded={loadedTabs[5]}
          />
        );

      case 6:
        return (
          <MinutesOfMeetings 
            departments={profile?.departments || []}
            meetings={meetings}
          />
        );

      default:
        return <ProfileTab />;
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Debug info */}
      <Box sx={{ 
        position: 'fixed', 
        top: 0, 
        right: 0, 
        bgcolor: 'rgba(0,0,0,0.7)', 
        color: 'white', 
        p: 1, 
        zIndex: 9999,
        fontSize: '10px'
      }}>
        Active Tab: {activeTab} | Initialized: {initialized ? 'Yes' : 'No'} | Auth: {isAuthenticated ? 'Yes' : 'No'}
      </Box>
      
      {/* Sidebar */}
      <Sidebar
        tabs={tabs}
        activeTab={activeTab}
        onTabClick={handleTabClick}
        onLogout={handleLogout}
      />
      
      {/* Main content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 0, 
          bgcolor: '#f5f5f7',
          ml: '240px',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {loading && (
          <Box sx={{ width: '100%' }}>
            <LinearProgress />
          </Box>
        )}
        
        {error && (
          <Paper sx={{ p: 3, m: 2, maxWidth: '600px' }}>
            <Typography variant="h6" color="error" gutterBottom>
              Error
            </Typography>
            <Typography>{error}</Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button 
                variant="contained" 
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
              <Button 
                variant="outlined" 
                color="secondary"
                onClick={handleResetSession}
              >
                Reset Session
              </Button>
            </Box>
          </Paper>
        )}
        
        {!loading && !error && initialized && (
          <Box sx={{ width: '1010px', mt: 2, mb: 2 }}>
            {renderContent()}
          </Box>
        )}
        
        {!loading && !error && !initialized && (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6">
              Initializing dashboard...
            </Typography>
            <Button 
              variant="contained" 
              sx={{ mt: 3 }}
              onClick={handleResetSession}
            >
              Reset Session
            </Button>
          </Box>
        )}
      </Box>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AcademicDirectorDashboard;