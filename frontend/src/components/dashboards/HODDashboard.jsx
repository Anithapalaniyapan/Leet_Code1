import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Snackbar,
  Alert,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Chip,
  Tooltip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import DescriptionIcon from '@mui/icons-material/Description';
import LogoutIcon from '@mui/icons-material/Logout';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';

const HODDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [userProfile, setUserProfile] = useState({
    name: '',
    position: 'Head of Department',
    email: '',
    department: '',
    departmentId: ''
  });
  const [meetings, setMeetings] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Define sidebar tabs
  const tabs = [
    { id: 'profile', label: "Profile", icon: <PersonIcon /> },
    { id: 'meetings', label: "Meeting Schedule", icon: <EventIcon /> },
    { id: 'minutes', label: "Minutes of Meetings", icon: <DescriptionIcon /> }
  ];

  // Helper function to get role name from roleId
  const getRoleName = (roleId) => {
    switch (roleId) {
      case 1:
        return 'Student';
      case 2:
        return 'Staff';
      case 3:
        return 'HOD';
      case 4:
        return 'Director';
      default:
        return 'All Roles';
    }
  };

  // Fetch meetings for HOD's department
  const fetchMeetings = async (deptId) => {
    try {
      const token = localStorage.getItem('token');
      const departmentId = deptId || userProfile.departmentId;
      
      console.log('Fetching meetings for department:', {
        departmentId,
        token: token ? 'Present' : 'Missing'
      });

      if (!departmentId) {
        throw new Error('Department ID is missing');
      }

      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Make the API call with specific fields we want to retrieve
      const response = await axios({
        method: 'get',
        url: `http://localhost:8080/api/meetings/department/${departmentId}`,
        headers: { 
          'x-access-token': token
        },
        params: {
          fields: 'id,title,description,meetingDate,startTime,endTime,location,status,departmentId,year'
        }
      });

      console.log('Raw API Response:', {
        status: response.status,
        data: response.data
      });

      if (!response.data) {
        throw new Error('No data received from server');
      }

      // Ensure we're working with an array
      const meetingsArray = Array.isArray(response.data) ? response.data : [];
      
      // Sort meetings by meetingDate
      const sortedMeetings = meetingsArray.sort((a, b) => {
        const dateA = a.meetingDate ? new Date(a.meetingDate) : new Date(0);
        const dateB = b.meetingDate ? new Date(b.meetingDate) : new Date(0);
        return dateB - dateA; // Most recent first
      });

      console.log('Processed meetings:', sortedMeetings);
      setMeetings(sortedMeetings);

      if (sortedMeetings.length === 0) {
        setSnackbar({
          open: true,
          message: 'No meetings found for your department',
          severity: 'info'
        });
      } else {
        setSnackbar({
          open: true,
          message: `Successfully loaded ${sortedMeetings.length} meetings`,
          severity: 'success'
        });
      }

    } catch (error) {
      console.error('Meeting fetch error:', {
        name: error.name,
        message: error.message,
        response: {
          status: error.response?.status,
          data: error.response?.data,
          message: error.response?.data?.message
        },
        stack: error.stack
      });

      let errorMessage;
      
      if (error.message === 'Department ID is missing') {
        errorMessage = 'Department ID is not available. Please contact administrator.';
      } else if (error.message === 'Authentication token not found') {
        errorMessage = 'Please login again to continue.';
        navigate('/login');
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.response?.status === 500) {
        // Log the detailed error for debugging
        console.error('Server Error Details:', {
          error: error.response?.data,
          message: error.response?.data?.message,
          stack: error.response?.data?.stack
        });
        errorMessage = 'Unable to fetch meetings. Please try again later.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        navigate('/login');
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to view these meetings.';
      } else if (error.response?.status === 404) {
        errorMessage = 'No meetings found for your department.';
      } else {
        errorMessage = 'Unable to load meetings. Please try again later.';
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  // Fetch questions for HOD's department
  const fetchQuestions = async (deptId) => {
    try {
      const token = localStorage.getItem('token');
      const departmentId = deptId || userProfile.departmentId;
      
      console.log('Fetching questions for department:', departmentId);

      if (!departmentId) {
        console.error('Department ID not available');
        return;
      }

      const response = await axios.get(`http://localhost:8080/api/questions/department/${departmentId}`, {
        headers: { 
          'x-access-token': token 
        },
        params: {
          role: 'hod'
        }
      });

      if (response.data) {
        console.log('Questions fetched:', response.data);
        setQuestions(response.data);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load questions. Please try again later.',
        severity: 'error'
      });
    }
  };

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

        console.log('Auth verify response:', response.data); // Debug log

        if (!response.data.valid) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }

        const userData = response.data.user;
        
        if (!userData.department?.id) {
          setSnackbar({
            open: true,
            message: 'Department not assigned. Please contact administrator.',
            severity: 'error'
          });
          return;
        }

        // Set user profile data first
        const profileData = {
          name: userData.fullName || userData.name || '',
          email: userData.email || '',
          position: 'Head of Department',
          department: userData.department?.name || '',
          departmentId: userData.department?.id
        };

        console.log('Setting profile data:', profileData); // Debug log
        setUserProfile(profileData);

        // Then fetch data using the department ID directly from userData
        await Promise.all([
          fetchMeetings(userData.department.id),
          fetchQuestions(userData.department.id)
        ]);

      } catch (error) {
        console.error('Authentication error:', error);
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Authentication failed',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Handle response submission
  const handleResponseSubmit = async (questionId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.post('http://localhost:8080/api/responses', {
        questionId,
        response: responses[questionId],
        departmentId: userProfile.departmentId,
        role: 'hod'
      }, {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });

      setSnackbar({
        open: true,
        message: 'Response submitted successfully',
        severity: 'success'
      });

      // Refresh questions after submission
      await fetchQuestions(userProfile.departmentId);
      
    } catch (error) {
      console.error('Error submitting response:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to submit response',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Render profile section
  const renderProfile = () => (
    <Paper sx={{ p: 4, borderRadius: 0 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 4 }}>HOD Profile</Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0 }}>
        <Avatar sx={{ width: 76, height: 76, bgcolor: '#1A2137', mr: 4 }}>
          {userProfile.name ? userProfile.name.charAt(0) : 'H'}
        </Avatar>
        
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#666' }}>Name</Typography>
              <Typography variant="body1">{userProfile.name || 'Not specified'}</Typography>
            </Box>
            
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#666' }}>Position</Typography>
              <Typography variant="body1">{userProfile.position}</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6}>
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#666' }}>Email</Typography>
              <Typography variant="body1">{userProfile.email || 'Not specified'}</Typography>
            </Box>
            
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#666' }}>Department</Typography>
              <Typography variant="body1">{userProfile.department || 'Not specified'}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );

  // Render meetings section with role instead of location
  const renderMeetings = () => (
    <Paper sx={{ p: 4, borderRadius: 0 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 4 }}>Meeting Schedule</Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <LinearProgress sx={{ width: '100%' }} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Button 
            size="small" 
            onClick={() => fetchMeetings(userProfile.departmentId)} 
            sx={{ ml: 2 }}
          >
            Retry
          </Button>
        </Alert>
      ) : meetings.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No meetings scheduled for your department.
        </Alert>
      ) : (
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f7' }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f7' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f7' }}>Meeting Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f7' }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f7' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f7' }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f7' }}>Year</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f7' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {meetings.map((meeting) => (
                <TableRow 
                  key={meeting.id}
                  sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}
                >
                  <TableCell>{meeting.title || 'Untitled'}</TableCell>
                  <TableCell>
                    <Tooltip title={meeting.description || 'No description available'}>
                      <Typography
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {meeting.description || 'No description'}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {meeting.meetingDate ? 
                      new Date(meeting.meetingDate).toLocaleDateString() : 
                      'Not specified'}
                  </TableCell>
                  <TableCell>
                    {meeting.startTime && meeting.endTime ? 
                      `${meeting.startTime} - ${meeting.endTime}` : 
                      'Not specified'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        meeting.roleId === 1 ? 'Student' :
                        meeting.roleId === 2 ? 'Staff' :
                        meeting.roleId === 3 ? 'HOD' :
                        meeting.roleId === 4 ? 'Director' : 'All Roles'
                      }
                      color={
                        meeting.roleId === 1 ? 'primary' :
                        meeting.roleId === 2 ? 'secondary' :
                        meeting.roleId === 3 ? 'success' :
                        meeting.roleId === 4 ? 'warning' : 'default'
                      }
                      size="small"
                      sx={{ 
                        minWidth: 80,
                        '& .MuiChip-label': { px: 1 }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={meeting.department?.name || userProfile.department || 'Not specified'}
                      color="info"
                      size="small"
                      sx={{ 
                        minWidth: 100,
                        '& .MuiChip-label': { px: 1 }
                      }}
                    />
                  </TableCell>
                  <TableCell>{meeting.year || 'Not specified'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={meeting.status || 'Scheduled'} 
                      color={
                        meeting.status === 'Completed' ? 'success' :
                        meeting.status === 'Cancelled' ? 'error' :
                        meeting.status === 'Postponed' ? 'warning' : 'primary'
                      }
                      size="small"
                      sx={{ 
                        minWidth: 85,
                        '& .MuiChip-label': { px: 1 }
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );

  // Render minutes section
  const renderMinutes = () => (
    <Paper sx={{ p: 4, borderRadius: 0 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 4 }}>Minutes of Meetings</Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <LinearProgress sx={{ width: '100%' }} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : questions.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No questions available for your department.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {questions.map((question, index) => (
            <Grid item xs={12} key={question.id}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Department: {question.department?.name || userProfile.department}
                    </Typography>
                    {question.year && (
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Year: {question.year}
                      </Typography>
                    )}
                    {question.targetRole && (
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Target Role: {question.targetRole}
                      </Typography>
                    )}
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>
                    {index + 1}. {question.text}
                  </Typography>

                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Action Taken"
                    value={responses[question.id] || question.hodResponse?.response || ''}
                    onChange={(e) => setResponses(prev => ({
                      ...prev,
                      [question.id]: e.target.value
                    }))}
                    placeholder="Enter your response here"
                    sx={{ mb: 2 }}
                  />

                  <Button
                    variant="contained"
                    onClick={() => handleResponseSubmit(question.id)}
                    disabled={loading || !responses[question.id]}
                    sx={{ 
                      bgcolor: '#1A2137',
                      '&:hover': { bgcolor: '#2A3147' }
                    }}
                  >
                    Submit Response
                  </Button>

                  {question.hodResponse && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Previous Response:
                      </Typography>
                      <Typography variant="body1">
                        {question.hodResponse.response}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar */}
      <Box 
        sx={{
          width: 240,
          bgcolor: '#1A2137',
          color: 'white',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 1
        }}
      >
        <Box sx={{ p: 3, pb: 2, bgcolor: '#2A3147' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FFFFFF' }}>
            HOD Dashboard
          </Typography>
        </Box>
        
        <List sx={{ p: 0 }}>
          {tabs.map((tab) => (
            <ListItem 
              key={tab.id}
              button 
              onClick={() => setActiveSection(tab.id)}
              sx={{ 
                py: 2, 
                pl: 3,
                bgcolor: activeSection === tab.id ? '#2A3147' : 'transparent',
                '&:hover': { bgcolor: '#2A3147' }
              }}
            >
              <ListItemIcon sx={{ color: '#FFFFFF', minWidth: 30 }}>
                {tab.icon}
              </ListItemIcon>
              <ListItemText primary={tab.label} sx={{ color: '#FFFFFF' }} />
            </ListItem>
          ))}
        </List>
        
        <Box sx={{ position: 'absolute', bottom: 0, width: '100%' }}>
          <ListItem 
            button 
            onClick={handleLogout}
            sx={{ 
              py: 2, 
              pl: 3,
              '&:hover': { bgcolor: '#2A3147' }
            }}
          >
            <ListItemIcon sx={{ color: '#FFFFFF', minWidth: 30 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" sx={{ color: '#FFFFFF' }} />
          </ListItem>
        </Box>
      </Box>

      {/* Main content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3,
          bgcolor: '#f5f5f7',
          ml: '240px',
          minHeight: '100vh'
        }}
      >
        {loading && <LinearProgress />}
        
        {activeSection === 'profile' && renderProfile()}
        {activeSection === 'meetings' && renderMeetings()}
        {activeSection === 'minutes' && renderMinutes()}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default HODDashboard; 