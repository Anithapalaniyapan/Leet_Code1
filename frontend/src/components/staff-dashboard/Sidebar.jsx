import React from 'react';
import { Box, List, ListItem, ListItemIcon, ListItemText, Typography, Divider } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import FeedbackIcon from '@mui/icons-material/Feedback';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LogoutIcon from '@mui/icons-material/Logout';

const Sidebar = ({ activeSection, onSectionChange, onLogout }) => {
  // Define tabs for the sidebar
  const tabs = [
    { id: 0, label: "Profile", icon: <PersonIcon />, section: 'profile' },
    { id: 1, label: "View Meetings", icon: <CalendarTodayIcon />, section: 'view-meetings' },
    { id: 2, label: "Submit Feedback", icon: <FeedbackIcon />, section: 'submit-feedback' }
  ];

  return (
    <Box 
      sx={{
        width: 240,
        bgcolor: '#1A2137',
        color: 'white',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3, pb: 2, bgcolor: '#2A3147' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FFFFFF' }}>
          Staff Dashboard
        </Typography>
      </Box>
      
      {/* Navigation Links */}
      <List sx={{ p: 0, flexGrow: 1 }}>
        {tabs.map((tab) => (
          <ListItem 
            key={tab.id}
            button 
            onClick={() => onSectionChange(tab.section)}
            sx={{ 
              py: 2, 
              pl: 3,
              bgcolor: activeSection === tab.section ? '#2A3147' : 'transparent',
              borderLeft: activeSection === tab.section ? '4px solid #FFD700' : '4px solid transparent',
              '&:hover': { 
                bgcolor: activeSection === tab.section ? '#2A3147' : 'rgba(42, 49, 71, 0.7)',
                borderLeft: activeSection === tab.section ? '4px solid #FFD700' : '4px solid rgba(255, 215, 0, 0.5)'
              },
              transition: 'background-color 0.2s, border-left 0.2s'
            }}
          >
            <ListItemIcon sx={{ color: activeSection === tab.section ? '#FFD700' : '#FFFFFF', minWidth: 35 }}>
              {tab.icon}
            </ListItemIcon>
            <ListItemText 
              primary={tab.label} 
              primaryTypographyProps={{ 
                color: activeSection === tab.section ? '#FFD700' : '#FFFFFF',
                fontWeight: activeSection === tab.section ? 'medium' : 'normal'
              }} 
            />
          </ListItem>
        ))}
      </List>
      
      {/* Divider */}
      <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
      
      {/* Logout Button */}
      <List sx={{ p: 0 }}>
        <ListItem 
          button 
          onClick={onLogout}
          sx={{ 
            py: 2, 
            pl: 3,
            '&:hover': { 
              bgcolor: 'rgba(42, 49, 71, 0.7)',
              borderLeft: '4px solid rgba(255, 0, 0, 0.5)'
            },
            transition: 'background-color 0.2s, border-left 0.2s',
            borderLeft: '4px solid transparent'
          }}
        >
          <ListItemIcon sx={{ color: '#FFFFFF', minWidth: 35 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );
};

export default Sidebar; 