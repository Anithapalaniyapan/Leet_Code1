import React from 'react';
import { 
  ListItem as MuiListItem, 
  ListItemIcon, 
  ListItemText 
} from '@mui/material';

// Wrap the MUI ListItem to handle button properly
const ListItem = ({ button, children, ...props }) => {
  // Convert string "true" to boolean true for the button prop if needed
  const buttonProp = button === "true" ? true : button === "false" ? false : button;
  
  return (
    <MuiListItem button={buttonProp} {...props}>
      {children}
    </MuiListItem>
  );
};

export default ListItem; 