import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Avatar, CircularProgress, Card, Divider, Grid, Button } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';

const ProfileSection = ({ userProfile, loading }) => {
  const [localProfile, setLocalProfile] = useState(null);
  const [localLoading, setLocalLoading] = useState(loading);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch profile data directly from the component if needed
  useEffect(() => {
    if (userProfile && Object.keys(userProfile).length > 0) {
      console.log('Using provided userProfile:', userProfile);
      setLocalProfile(userProfile);
    } else if (!loading && retryCount === 0) {
      console.log('No profile data provided, attempting direct fetch');
      fetchProfileDirectly();
    }
  }, [userProfile, loading]);

  const fetchProfileDirectly = async () => {
    setLocalLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found for direct profile fetch in ProfileSection');
        setLocalLoading(false);
        return;
      }

      console.log('ProfileSection making direct API call to fetch profile');
      const response = await axios.get('/users/profile', {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && Object.keys(response.data).length > 0) {
        console.log('Direct profile fetch successful in ProfileSection:', response.data);
        setLocalProfile(response.data);
        
        // Also update localStorage to ensure consistency
        localStorage.setItem('userData', JSON.stringify(response.data));
      } else {
        throw new Error('Empty or invalid profile data received from API');
      }
    } catch (error) {
      console.error('Error in ProfileSection direct fetch:', error);
      
      // Try to load from localStorage as fallback
      try {
        const storedData = localStorage.getItem('userData');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          if (parsedData && Object.keys(parsedData).length > 0) {
            console.log('Loading profile from localStorage in ProfileSection');
            setLocalProfile(parsedData);
          }
        }
      } catch (localStorageError) {
        console.error('Error loading from localStorage:', localStorageError);
      }
    } finally {
      setLocalLoading(false);
      setRetryCount(prev => prev + 1);
    }
  };

  const handleRefreshProfile = () => {
    fetchProfileDirectly();
  };

  if (localLoading) {
    return <Box sx={{ display: 'none' }}></Box>;
  }

  // For debugging - log the original data to find issues
  console.log('Profile data being used for display:', localProfile || userProfile);

  // Enhanced profile data extraction with improved fallbacks
  const extractRoleFromRoles = (rolesArray) => {
    if (!Array.isArray(rolesArray) || rolesArray.length === 0) return null;
    
    const role = rolesArray.find(r => r?.name);
    return role?.name || null;
  };

  // Get profile to use (either local or prop)
  const profileToUse = localProfile || userProfile || {};

  // Enhanced profile data extraction with better fallbacks
  const profileData = {
    // Name extraction with multiple fallback options
    name: profileToUse?.name || 
          profileToUse?.fullName || 
          profileToUse?.username ||
          (profileToUse?.firstName && profileToUse?.lastName ? 
            `${profileToUse.firstName} ${profileToUse.lastName}` : 
            profileToUse?.displayName ||  
            'Staff Member'),
    
    // Staff ID extraction
    staffId: profileToUse?.staffId || 
             profileToUse?.employeeId || 
             profileToUse?.id || 
             profileToUse?.username || 
             profileToUse?.userId || 
             'Staff-001',
    
    // Department extraction with handling for both object and string formats
    department: typeof profileToUse?.department === 'object' ? 
                  (profileToUse?.department?.name || 'Department') : 
                  (typeof profileToUse?.department === 'string' ? 
                    profileToUse.department : 
                    profileToUse?.departmentName || 
                    'Computer Science and Engineering'),
    
    // Position/role extraction with enhanced logic
    position: profileToUse?.position || 
              profileToUse?.designation || 
              profileToUse?.role || 
              extractRoleFromRoles(profileToUse?.roles) || 
              (profileToUse?.roles && profileToUse.roles[0]?.name) || 
              'Professor',
    
    // Email extraction
    email: profileToUse?.email || 
           profileToUse?.emailAddress || 
           profileToUse?.mail ||
           `${profileToUse?.username || 'staff'}@university.edu`
  };

  console.log('Normalized profileData:', profileData);

  // Add backup profile image in case animation fails
  const defaultAvatar = profileToUse?.avatarUrl || profileToUse?.photoUrl || null;

  // Check if we have minimal profile data
  const hasMinimalData = Object.keys(profileToUse).length > 0;

  return (
    <Box sx={{ position: 'relative' }}>
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
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
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
          
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={handleRefreshProfile}
            size="small"
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Refresh
          </Button>
        </Box>
        
        {!hasMinimalData ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#555' }}>
              Profile data could not be loaded
            </Typography>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRefreshProfile}
              sx={{ mt: 2 }}
            >
              Refresh Profile
            </Button>
          </Box>
        ) : (
          /* Main content */
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Left side - Avatar */}
              <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar
                  src={defaultAvatar}
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
                  {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'S'}
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
                
                <Box sx={{ mb: 3 }}>
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
                      {/* Full Name */}
                      <Grid item xs={12} sm={4}>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>
                            Full Name
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {profileData.name}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      {/* Staff ID */}
                      <Grid item xs={12} sm={4}>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>
                            Staff ID
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {profileData.staffId}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      {/* Email ID */}
                      <Grid item xs={12} sm={4}>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>
                            Email ID
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
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
        )}
      </Paper>
    </Box>
  );
};

export default ProfileSection; 