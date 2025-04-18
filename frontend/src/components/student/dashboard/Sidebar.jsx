import { Box, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { Person, Event, Feedback, Description } from '@mui/icons-material';

const Sidebar = ({ activeView, onViewChange }) => {
  const menuItems = [
    { id: 'profile', label: 'Profile', icon: <Person /> },
    { id: 'meetings', label: 'Meetings', icon: <Event /> },
    { id: 'feedback', label: 'Feedback', icon: <Feedback /> },
    { id: 'minutes', label: 'Minutes', icon: <Description /> }
  ];

  return (
    <Box
      sx={{
        width: 250,
        bgcolor: '#1a237e',
        color: 'white',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        pt: 8
      }}
    >
      <Typography variant="h6" sx={{ px: 3, mb: 2, fontWeight: 'bold' }}>
        Student Dashboard
      </Typography>
      <List>
        {menuItems.map((item) => (
          <ListItem
            key={item.id}
            onClick={() => onViewChange(item.id)}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              },
              bgcolor: activeView === item.id ? 'rgba(255, 255, 255, 0.2)' : 'transparent'
            }}
          >
            <ListItemIcon sx={{ color: 'white' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Sidebar; 