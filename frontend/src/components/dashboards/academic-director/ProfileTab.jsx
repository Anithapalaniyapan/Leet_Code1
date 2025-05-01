import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  Container,
  useTheme,
  useMediaQuery,
  Button,
  Stack
} from '@mui/material';
import { blue } from '@mui/material/colors';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import WorkIcon from '@mui/icons-material/Work';
import BarChartIcon from '@mui/icons-material/BarChart';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import EventNoteIcon from '@mui/icons-material/EventNote';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ArticleIcon from '@mui/icons-material/Article';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../../redux/slices/authSlice';

/**
 * Enhanced Profile tab component for displaying user information
 */
const ProfileTab = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Get user profile from Redux store
  const { profile } = useSelector(state => state.user);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Format profile data for display
  const profileData = {
    name: profile?.fullName || profile?.name || 'User',
    role: profile?.role || 'Academic Director',
    id: profile?.username || profile?.id || '',
    email: profile?.email || ''
  };

  // Handle logout
  const handleLogout = () => {
    // Clear local token
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    
    // Dispatch the logout action
    dispatch(logout());
    
    // Redirect to login
    navigate('/login', { replace: true });
  };

  // Get user's first name for more personal greeting
  const firstName = profileData.name.split(' ')[0] || 'Director';
  
  // Random cover image URL - education/academic themed
  const coverImage = "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?q=80&w=1000&auto=format&fit=crop";

  // Mock activity data
  const activityData = {
    meetingsManaged: 24,
    questionsCreated: 18,
    reportsGenerated: 8
  };

  return (
    <Box sx={{ pb: 5, bgcolor: 'background.default' }}>
      {/* Cover Photo Area */}
      <Box 
        sx={{
          height: 200, 
          width: '100%', 
          position: 'relative',
          backgroundImage: `linear-gradient(rgba(25, 118, 210, 0.8), rgba(25, 118, 210, 0.9)), url(${coverImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          mb: 8,
          borderRadius: 2
        }}
      >
        <Container maxWidth="lg">
          {/* Profile Avatar - positioned to overlap cover and content */}
            <Avatar
              sx={{
              width: 150, 
              height: 150, 
              border: '5px solid white',
              position: 'absolute',
              bottom: -75,
              left: { xs: '50%', md: 32 },
              transform: { xs: 'translateX(-50%)', md: 'none' },
              bgcolor: theme.palette.primary.main,
              fontSize: '4rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}
          >
            {profileData.name.charAt(0) || 'A'}
            </Avatar>

            {/* Logout button - positioned in top right of cover */}
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ 
                position: 'absolute',
                top: 16,
                right: 16,
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.3)',
                }
              }}
            >
              Logout
            </Button>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Left Column */}
          <Grid item xs={12} md={4}>
            {/* Basic Profile Info */}
            <Card elevation={2} sx={{ mb: 3, borderRadius: 2, overflow: 'visible', pt: isMobile ? 2 : 7 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                {/* Only show name and title here on mobile */}
                {isMobile && (
                  <>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 2 }}>
                      {profileData.name}
                    </Typography>
                    <Chip 
                      label={profileData.role} 
                      color="primary" 
                      sx={{ mt: 1, mb: 2, px: 2, py: 2.5, fontWeight: 'bold', fontSize: '1rem' }}
                    />
                  </>
                )}
                
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                    <EmailIcon color="primary" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Email Address</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {profileData.email || 'academic-director@example.com'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                    <BadgeIcon color="primary" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">ID</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {profileData.id || 'AD1234'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Quick Actions
            </Typography>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    startIcon={<CalendarMonthIcon />} 
                    fullWidth
                    sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1 }}
                  >
                    Create New Meeting
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<QuestionAnswerIcon />} 
                    fullWidth
                    sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1 }}
                  >
                    Add Feedback Questions
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<AssessmentIcon />} 
                    fullWidth
                    sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1 }}
                  >
                    Generate Reports
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<CloudDownloadIcon />} 
                    fullWidth
                    sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1 }}
                  >
                    Download Analytics
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Right Column */}
          <Grid item xs={12} md={8}>
            {/* Welcome Section */}
            <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
                  <CardContent>
                {/* On larger screens, show name and title here */}
                {!isMobile && (
                  <>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {profileData.name}
                    </Typography>
                    <Chip 
                      label={profileData.role} 
                      color="primary" 
                      sx={{ mt: 1, mb: 3, px: 2, py: 2.5, fontWeight: 'bold', fontSize: '1rem' }}
                    />
                  </>
                )}
                
                <Typography variant="h6" fontWeight="medium" color="primary" sx={{ mt: 2 }}>
                  Welcome back, {firstName}!
                </Typography>
                
                <Typography variant="body1" sx={{ my: 2, color: 'text.secondary' }}>
                  As an Academic Director, you are responsible for overseeing the academic operations and ensuring quality standards across departments. Your dashboard provides tools to manage feedback collection, monitor department performance, and implement improvements based on stakeholder input.
                </Typography>
                  </CardContent>
                </Card>

            {/* Activity Overview */}
            <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <AssessmentIcon sx={{ mr: 1 }} /> Activity Overview
                </Typography>
                
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, border: `1px solid ${blue[100]}`, borderRadius: 2 }}>
                      <EventNoteIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                      <Typography variant="h4" color="primary" fontWeight="bold">
                        {activityData.meetingsManaged}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Meetings Managed
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, border: `1px solid ${blue[100]}`, borderRadius: 2 }}>
                      <QuestionAnswerIcon color="secondary" sx={{ fontSize: 36, mb: 1 }} />
                      <Typography variant="h4" color="secondary" fontWeight="bold">
                        {activityData.questionsCreated}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Questions Created
                      </Typography>
                    </Box>
              </Grid>
              
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, border: `1px solid ${blue[100]}`, borderRadius: 2 }}>
                      <ArticleIcon sx={{ fontSize: 36, mb: 1, color: theme.palette.info.main }} />
                      <Typography variant="h4" fontWeight="bold" sx={{ color: theme.palette.info.main }}>
                        {activityData.reportsGenerated}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Reports Generated
                    </Typography>
                    </Box>
                  </Grid>
                </Grid>
                  </CardContent>
                </Card>

            {/* Responsibilities Card */}
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <WorkIcon sx={{ mr: 1 }} /> Your Dashboard Features
                </Typography>
                
                <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, p: 3, boxShadow: 'inset 0 0 5px rgba(0,0,0,0.05)' }}>
                  <Typography variant="body1" fontWeight="medium" color="text.primary" gutterBottom>
                    As Academic Director, you have access to these key features:
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ 
                        p: 2, 
                        bgcolor: 'primary.light', 
                        color: 'primary.contrastText', 
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        height: '100%',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                          cursor: 'pointer'
                        }
                      }}>
                        <EventNoteIcon sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="body2" fontWeight="bold">
                          Manage feedback meetings and schedules
                        </Typography>
                      </Box>
              </Grid>
              
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ 
                        p: 2, 
                        bgcolor: 'secondary.light', 
                        color: 'secondary.contrastText', 
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        height: '100%',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                          cursor: 'pointer'
                        }
                      }}>
                        <QuestionAnswerIcon sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="body2" fontWeight="bold">
                          Create and manage feedback questions
                    </Typography>
                      </Box>
              </Grid>
              
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ 
                        p: 2, 
                        bgcolor: 'info.light', 
                        color: 'info.contrastText', 
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        height: '100%',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                          cursor: 'pointer'
                        }
                      }}>
                        <BarChartIcon sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="body2" fontWeight="bold">
                          View analytics and generate reports
                    </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
                  </CardContent>
                </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ProfileTab; 