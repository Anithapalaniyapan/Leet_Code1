import React from 'react';
import { Box, Typography, Paper, Avatar, CircularProgress, Card, Divider, Grid } from '@mui/material';
import { Player } from '@lottiefiles/react-lottie-player';
import professorAnimation from '../../assets/animations/professor.json';
import EmailIcon from '@mui/icons-material/Email';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';

const ProfileSection = ({ userProfile, loading }) => {
  if (loading) {
    return (
      <Paper sx={{ 
        p: 4, 
        borderRadius: 2, 
        minHeight: '400px', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} thickness={4} sx={{ color: '#1A2137', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#666' }}>
            Loading profile information...
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Combine profile data with fallbacks
  const profileData = {
    name: userProfile?.fullName || userProfile?.name || 'Professor',
    staffId: userProfile?.username || userProfile?.staffId || 'CS001',
    department: userProfile?.department?.name || (typeof userProfile?.department === 'string' ? userProfile.department : 'Computer Science and Engineering'),
    position: userProfile?.position || 'Professor', 
    email: userProfile?.email || 'staff@university.edu'
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Background decoration */}
      <Box sx={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: '250px',
        height: '250px',
        opacity: 0.4,
        zIndex: 0,
        transform: 'rotate(10deg)'
      }}>
        <Player
          autoplay
          loop
          src={professorAnimation}
          style={{ width: '100%', height: '100%' }}
        />
      </Box>
      
      <Paper sx={{ 
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        position: 'relative',
        zIndex: 1,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
      }}>
        {/* Header section with title and underline */}
        <Box sx={{ 
          p: 3, 
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          position: 'relative'
        }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 'bold', 
            color: '#1A2137',
            position: 'relative',
            display: 'inline-block',
            zIndex: 1,
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: -10,
              left: 0,
              width: 60,
              height: 4,
              backgroundColor: '#FFD700',
              borderRadius: 2
            }
          }}>
            Staff Profile
          </Typography>
        </Box>
        
        {/* Main content */}
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Left side - Avatar */}
            <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                sx={{ 
                  width: 120, 
                  height: 120, 
                  bgcolor: '#1A2137',
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  mb: 2,
                  boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                }}
              >
                {profileData.name ? profileData.name.charAt(0) : 'P'}
              </Avatar>
              
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5, textAlign: 'center' }}>
                {profileData.name}
              </Typography>
              
              <Typography variant="body2" sx={{ color: '#666', mb: 2, textAlign: 'center' }}>
                {profileData.position}
              </Typography>
              
              <Card sx={{ 
                width: '100%', 
                maxWidth: 250,
                bgcolor: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(10px)',
                p: 2,
                borderRadius: 2,
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AssignmentIndIcon sx={{ color: '#1A2137', mr: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {profileData.staffId}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EmailIcon sx={{ color: '#1A2137', mr: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body2" sx={{ 
                    fontWeight: 'medium',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '180px'
                  }}>
                    {profileData.email}
                  </Typography>
                </Box>
              </Card>
            </Grid>
            
            {/* Right side - Details */}
            <Grid item xs={12} md={8}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ 
                  mb: 2, 
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  color: '#1A2137',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <SchoolIcon sx={{ mr: 1 }} /> Academic Information
                </Typography>
                
                <Card sx={{ 
                  p: 2, 
                  borderRadius: 2,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                  bgcolor: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <Grid container spacing={2}>
                    {/* Department */}
                    <Grid item xs={12} sm={6}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>
                          Department
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BusinessIcon sx={{ color: '#1A2137', mr: 1, fontSize: '1.1rem' }} />
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {profileData.department}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    {/* Position */}
                    <Grid item xs={12} sm={6}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>
                          Position
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <WorkIcon sx={{ color: '#1A2137', mr: 1, fontSize: '1.1rem' }} />
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {profileData.position}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Card>
              </Box>
              
              <Box>
                <Typography variant="h6" sx={{ 
                  mb: 2, 
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  color: '#1A2137',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <AssignmentIndIcon sx={{ mr: 1 }} /> Staff Details
                </Typography>
                
                <Card sx={{ 
                  p: 2, 
                  borderRadius: 2,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                  bgcolor: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <Grid container spacing={2}>
                    {/* Name */}
                    <Grid item xs={12} sm={6}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>
                          Full Name
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {profileData.name}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    {/* Staff ID */}
                    <Grid item xs={12} sm={6}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>
                          Staff ID
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {profileData.staffId}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    {/* Email */}
                    <Grid item xs={12}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>
                          Email ID
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {profileData.email}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Card>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProfileSection; 