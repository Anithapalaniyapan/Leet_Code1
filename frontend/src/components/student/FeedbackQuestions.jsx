import React, { useState } from 'react';
import axios from 'axios';
import {
  Typography,
  Box,
  Paper,
  Rating,
  Button,
  Snackbar,
  Alert
} from '@mui/material';

const FeedbackQuestions = ({ questions, ratings, onRatingChange }) => {
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await axios.post('http://localhost:8080/api/feedback', {
        responses: questions.map(question => ({
          questionId: question.id,
          rating: ratings[question.id]
        }))
      }, {
        headers: {
          'x-access-token': localStorage.getItem('token')
        }
      });

      setSnackbar({
        open: true,
        message: 'Feedback submitted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to submit feedback. Please try again.',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        {questions.map((question) => (
          <Box key={question.id} sx={{ mb: 3 }}>
            <Typography variant="body1" gutterBottom>
              {question.text}
                </Typography>
                <Rating
              value={ratings[question.id] || 0}
                  onChange={(event, newValue) => {
                onRatingChange(question.id, newValue);
                  }}
                />
              </Box>
        ))}
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={submitting}
        >
          Submit Feedback
        </Button>
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
        </Box>
  );
};

export default FeedbackQuestions;