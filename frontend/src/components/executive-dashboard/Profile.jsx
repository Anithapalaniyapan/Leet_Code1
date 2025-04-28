import React from 'react';
import {
  Box, Typography, Paper, Avatar, Chip, Button, Grid, Divider,
  Card, CardContent, IconButton, Container, useTheme, useMediaQuery
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BarChartIcon from '@mui/icons-material/BarChart';
import FeedbackIcon from '@mui/icons-material/Feedback';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LogoutIcon from '@mui/icons-material/Logout';

const Profile = ({ userProfile }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
  const firstName = userProfile?.name?.split(' ')[0] || 'Director';
  
  // Random cover image URL
  const coverImage = "https://images.unsplash.com/photo-1579547945413-497e1b99dac0?q=80&w=1000&auto=format&fit=crop";
  
  // Format any date 
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <Box sx={{ 
      pb: 5,
      bgcolor: 'background.default',
    }}>
      {/* Cover Photo Area */}
      <Box 
            sx={{ 
          height: 200, 
          width: '100%', 
          position: 'relative',
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${coverImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          mb: 8
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
              bottom: -80,
              left: { xs: '50%', md: 32 },
              transform: { xs: 'translateX(-50%)', md: 'none' },
              bgcolor: theme.palette.primary.main,
              fontSize: '4rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}
            >
              {userProfile?.name?.charAt(0) || 'E'}
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
                      {userProfile?.name || 'Executive Director'}
                    </Typography>
                    <Chip 
                      label="Executive Director" 
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
                        {userProfile?.email || 'ed@shanmugha.edu.in'}
            </Typography>
                    </Box>
                  </Box>
                  
                  <Divider />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                    <PersonIcon color="primary" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Username</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {userProfile?.username || 'ED7327'}
                  </Typography>
                    </Box>
                  </Box>
                  
                  <Divider />
                  
                
                </Box>
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
                      {userProfile?.name || 'Executive Director'}
                    </Typography>
                    <Chip 
                      label="Executive Director" 
                      color="primary" 
                      sx={{ mt: 1, mb: 3, px: 2, py: 2.5, fontWeight: 'bold', fontSize: '1rem' }}
                    />
                  </>
                )}
                
                <Typography variant="h6" fontWeight="medium" color="primary" sx={{ mt: 2 }}>
                  Welcome back, {firstName}!
                </Typography>
                
                <Typography variant="body1" sx={{ my: 2, color: 'text.secondary' }}>
                  As an Executive Director, you play a crucial role in our institution's success. Your dashboard provides comprehensive oversight 
                  of all departments and academic activities. From here, you can monitor feedback metrics, review meeting minutes, and generate reports 
                  to guide strategic decision-making.
                </Typography>
              </CardContent>
            </Card>

            {/* System Access Card */}
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <WorkIcon sx={{ mr: 1 }} /> System Access & Privileges
                </Typography>
                
                <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, p: 3, boxShadow: 'inset 0 0 5px rgba(0,0,0,0.05)' }}>
                  <Typography variant="body1" fontWeight="medium" color="text.primary" gutterBottom>
                    As Executive Director, you have access to all system features including:
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
                        height: '100%'
                      }}>
                        <BarChartIcon sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="body2" fontWeight="bold">
                          View & download all analytics and reports
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
                        height: '100%'
                      }}>
                        <FeedbackIcon sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="body2" fontWeight="bold">
                          Monitor feedback across all departments
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
                        height: '100%'
                      }}>
                        <AssignmentIcon sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="body2" fontWeight="bold">
                          Access all meeting minutes and HOD responses
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

export default Profile; 