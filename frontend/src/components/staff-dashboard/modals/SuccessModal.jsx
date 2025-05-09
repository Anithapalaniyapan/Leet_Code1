import React from 'react';
import { Modal, Fade, Paper, Box, Typography, Button } from '@mui/material';

const SuccessModal = ({ open, onClose }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slotProps={{
        backdrop: {
          timeout: 500,
        },
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Fade in={open}>
        <Paper sx={{ 
          width: '500px',
          maxWidth: '90vw',
          minHeight: '300px',
          borderRadius: 4,
          overflow: 'hidden',
          outline: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
          px: 5,
          py: 4,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
        }}>
          <Box sx={{ 
            width: '140px', 
            height: '140px', 
            mb: 3, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #004777 0%, #1A2137 100%)',
            boxShadow: '0 10px 20px rgba(26, 33, 55, 0.2)',
            animation: 'fadeInScale 0.6s ease-out',
            '@keyframes fadeInScale': {
              '0%': {
                transform: 'scale(0.5)',
                opacity: 0
              },
              '100%': {
                transform: 'scale(1)',
                opacity: 1
              }
            }
          }}>
            <Typography variant="h1" sx={{ 
              color: 'white', 
              fontWeight: 'bold',
              fontSize: '5rem'
            }}>
              ✓
            </Typography>
          </Box>
          
          <Typography variant="h5" sx={{ 
            fontWeight: 'bold', 
            color: '#1A2137', 
            mb: 2,
            animation: 'fadeIn 0.6s ease-out 0.3s both',
            '@keyframes fadeIn': {
              '0%': {
                transform: 'translateY(20px)',
                opacity: 0
              },
              '100%': {
                transform: 'translateY(0)',
                opacity: 1
              }
            }
          }}>
            Feedback Submitted Successfully!
          </Typography>
          <Typography variant="body1" sx={{ 
            color: '#555', 
            maxWidth: '400px', 
            mx: 'auto',
            animation: 'fadeIn 0.6s ease-out 0.6s both'
          }}>
            Thank you for your participation. We value your input!
          </Typography>
          
          <Button 
            variant="contained"
            onClick={onClose}
            sx={{ 
              mt: 4,
              px: 4, 
              py: 1.5,
              borderRadius: 2,
              background: 'linear-gradient(45deg, #1A237E 30%, #283593 90%)',
              boxShadow: '0 4px 10px rgba(26,33,55,0.2)',
              transition: 'all 0.3s',
              animation: 'fadeIn 0.6s ease-out 0.9s both',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 15px rgba(26,33,55,0.3)'
              }
            }}
          >
            Close
          </Button>
        </Paper>
      </Fade>
    </Modal>
  );
};

export default SuccessModal;