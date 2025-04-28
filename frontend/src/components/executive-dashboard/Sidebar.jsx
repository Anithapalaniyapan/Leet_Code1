import React from 'react';
import { Box, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import {
  BarChart as BarChartIcon, 
  Assessment as AssessmentIcon,
  Event as EventIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { setActiveSection } from '../../redux/slices/uiSlice';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ activeSection }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const tabs = [
    { id: 'profile', label: "Profile", icon: <PersonIcon /> },
    { id: 'meetings', label: "Meetings", icon: <EventIcon /> },
    { id: 'analytics', label: "Analytics", icon: <BarChartIcon /> },
    { id: 'reports', label: "Reports", icon: <AssessmentIcon /> },
    { id: 'minutesOfMeetings', label: "Minutes of Meetings", icon: <DescriptionIcon /> }
  ];

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

  return (
    <Box 
      sx={{
        width: 240,
        bgcolor: '#1A2137', // Dark navy blue
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
          Executive Director
        </Typography>
      </Box>
      
      <List sx={{ p: 0 }}>
        {tabs.map(tab => (
          <ListItem key={tab.id} disablePadding>
            <ListItemButton
              onClick={() => dispatch(setActiveSection(tab.id))}
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
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ position: 'absolute', bottom: 0, width: '100%' }}>
        <ListItem disablePadding>
          <ListItemButton
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
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );
};

export default Sidebar; 