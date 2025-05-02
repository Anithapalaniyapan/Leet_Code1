import React from 'react';
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import FeedbackIcon from '@mui/icons-material/Feedback';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LogoutIcon from '@mui/icons-material/Logout';

const Sidebar = ({ activeSection, setActiveSection, handleLogout }) => (
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
        Student Dashboard
      </Typography>
    </Box>
    
    <List sx={{ p: 0 }}>
      <ListItem 
        button 
        onClick={() => setActiveSection('profile')}
        sx={{ 
          py: 2, 
          pl: 3,
          bgcolor: activeSection === 'profile' ? '#2A3147' : 'transparent',
          '&:hover': { bgcolor: '#2A3147' }
        }}
      >
        <ListItemIcon sx={{ color: '#FFFFFF', minWidth: 30 }}>
          <PersonIcon />
        </ListItemIcon>
        <ListItemText primary="Profile" sx={{ color: '#FFFFFF' }} />
      </ListItem>
      
      <ListItem 
        button 
        onClick={() => setActiveSection('feedback')}
        sx={{ 
          py: 2, 
          pl: 3,
          bgcolor: activeSection === 'feedback' ? '#2A3147' : 'transparent',
          '&:hover': { bgcolor: '#2A3147' }
        }}
      >
        <ListItemIcon sx={{ color: '#FFFFFF', minWidth: 30 }}>
          <FeedbackIcon />
        </ListItemIcon>
        <ListItemText primary="Submit Feedback" sx={{ color: '#FFFFFF' }} />
      </ListItem>
      
      <ListItem 
        button 
        onClick={() => setActiveSection('meeting-schedule')}
        sx={{ 
          py: 2, 
          pl: 3,
          bgcolor: activeSection === 'meeting-schedule' ? '#2A3147' : 'transparent',
          '&:hover': { bgcolor: '#2A3147' }
        }}
      >
        <ListItemIcon sx={{ color: '#FFFFFF', minWidth: 30 }}>
          <CalendarTodayIcon />
        </ListItemIcon>
        <ListItemText primary="View Meeting Schedule" sx={{ color: '#FFFFFF' }} />
      </ListItem>
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
);

export default Sidebar; 