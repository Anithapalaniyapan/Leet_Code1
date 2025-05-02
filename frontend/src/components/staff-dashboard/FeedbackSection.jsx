import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, Button, Rating, Alert, CircularProgress, Modal, Fade, TextField } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import { Player } from '@lottiefiles/react-lottie-player';
import ratingAnimation from '../../assets/animations/rating-animation.json';
import countdownAnimation from '../../assets/animations/countdown.json';
import successAnimation from '../../assets/animations/success-confetti.json';
import RefreshIcon from '@mui/icons-material/Refresh';

const FeedbackSection = ({ 
  questions, 
  localRatings, 
  handleRatingChange, 
  handleSubmitFeedback, 
  loading, 
  questionsLoading, 
  questionsError, 
  activeMeeting,
  feedbackSubmitted,
  setFeedbackSubmitted,
  shouldShowQuestions = false,
  setQuestionsLoading,
  setQuestionsError
}) => {
  // State for notes
  const [notes, setNotes] = useState({});
  
  // State for displaying UI elements
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [showThreeSecondCountdown, setShowThreeSecondCountdown] = useState(false);
  const [initialCountdownComplete, setInitialCountdownComplete] = useState(false);
  const [questionsReady, setQuestionsReady] = useState(false);
  const [timeToMeeting, setTimeToMeeting] = useState(null);
  
  // Track if an API request is in progress to prevent duplicates
  const [apiRequestInProgress, setApiRequestInProgress] = useState(false);
  const [requestInitiated, setRequestInitiated] = useState(false);
  
  // Reference to store polling interval
  const [pollingInterval, setPollingInterval] = useState(null);
  const initialLoadRef = useRef(false);

  // Effect for polling to check if we're within 5 minutes of the meeting
  useEffect(() => {
    if (activeMeeting) {
      // Start checking every 10 seconds if we're within 5 minutes of the meeting
      const interval = setInterval(() => {
        // Handle different date formats - regular date or ISO string
        let meetingDate = activeMeeting.date || activeMeeting.meetingDate;
        const meetingTime = activeMeeting.startTime || '00:00';
        
        // Only proceed if we have valid date and time
        if (!meetingDate || !meetingTime) {
          console.log("Missing meeting date or time information");
          return;
        }
        
        // If meetingDate is an ISO string (contains 'T' and 'Z'), extract just the date part
        if (typeof meetingDate === 'string' && meetingDate.includes('T')) {
          meetingDate = meetingDate.split('T')[0]; // Extract just the YYYY-MM-DD part
        }
        
        // Create date object with extracted date and time
        const meetingDateTime = new Date(`${meetingDate}T${meetingTime}`);
        const now = new Date();
        
        // Check if the date is valid before calculating
        if (isNaN(meetingDateTime.getTime())) {
          console.log(`Invalid meeting date/time: ${meetingDate}T${meetingTime}`);
          return;
        }
        
        // Calculate minutes until meeting starts
        const diffMs = meetingDateTime - now;
        const minsUntilMeeting = Math.floor(diffMs / 60000);
        
        console.log(`Checking meeting time: ${minsUntilMeeting} minutes until meeting starts`);
        
        if (minsUntilMeeting <= 5 && minsUntilMeeting >= 0) {
          // We're within 5 minutes of the meeting
          setQuestionsReady(true);
          setTimeToMeeting(minsUntilMeeting);
          
          // If questions are ready and we haven't shown the countdown yet, start it
          if (!initialCountdownComplete && !showThreeSecondCountdown && shouldShowQuestions) {
            startThreeSecondCountdown();
          }
        } else if (minsUntilMeeting < 0) {
          // Meeting has started (negative minutes means past start time)
          setQuestionsReady(true);
          setTimeToMeeting(0);
          
          // If questions are ready and we haven't shown the countdown yet, start it
          if (!initialCountdownComplete && !showThreeSecondCountdown && shouldShowQuestions) {
            startThreeSecondCountdown();
          }
        } else {
          // Meeting is more than 5 minutes away
          setQuestionsReady(false);
          setTimeToMeeting(minsUntilMeeting);
        }
      }, 10000); // Check every 10 seconds
      
      setPollingInterval(interval);
      
      // Initial check
      let meetingDate = activeMeeting.date || activeMeeting.meetingDate;
      const meetingTime = activeMeeting.startTime || '00:00';
      
      // Only proceed if we have valid date and time
      if (!meetingDate || !meetingTime) {
        console.log("Missing meeting date or time information for initial check");
        return;
      }
      
      // If meetingDate is an ISO string (contains 'T' and 'Z'), extract just the date part
      if (typeof meetingDate === 'string' && meetingDate.includes('T')) {
        meetingDate = meetingDate.split('T')[0]; // Extract just the YYYY-MM-DD part
      }
      
      // Create date object with extracted date and time
      const meetingDateTime = new Date(`${meetingDate}T${meetingTime}`);
      const now = new Date();
      
      // Check if the date is valid before calculating
      if (isNaN(meetingDateTime.getTime())) {
        console.log(`Invalid meeting date/time for initial check: ${meetingDate}T${meetingTime}`);
        return;
      }
      
      const diffMs = meetingDateTime - now;
      const minsUntilMeeting = Math.floor(diffMs / 60000);
      
      console.log(`Initial meeting time check: ${minsUntilMeeting} minutes until meeting starts`);
      
      if (minsUntilMeeting <= 5 && minsUntilMeeting >= 0) {
        // We're within 5 minutes of the meeting
        setQuestionsReady(true);
        setTimeToMeeting(minsUntilMeeting);
        
        // If we haven't shown the countdown yet and questions are available, start it
        if (!initialCountdownComplete && !showThreeSecondCountdown && shouldShowQuestions) {
          startThreeSecondCountdown();
        }
      } else if (minsUntilMeeting < 0) {
        // Meeting has started
        setQuestionsReady(true);
        setTimeToMeeting(0);
        
        // If we haven't shown the countdown yet and questions are available, start it
        if (!initialCountdownComplete && !showThreeSecondCountdown && shouldShowQuestions) {
          startThreeSecondCountdown();
        }
      } else {
        // Meeting is more than 5 minutes away
        setQuestionsReady(false);
        setTimeToMeeting(minsUntilMeeting);
      }
      
      // Cleanup interval on unmount
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [activeMeeting, shouldShowQuestions, initialCountdownComplete, showThreeSecondCountdown]);

  // Effect to start countdown when questions should be shown initially
  useEffect(() => {
    if (shouldShowQuestions && questions.length > 0 && !feedbackSubmitted && !initialCountdownComplete && questionsReady) {
      startThreeSecondCountdown();
    }
  }, [shouldShowQuestions, questions, feedbackSubmitted, questionsReady]);

  // Function to start the 3-second countdown before showing questions
  const startThreeSecondCountdown = async () => {
    console.log('Starting 3-second countdown before showing questions');
    setShowThreeSecondCountdown(true);
    
    // Start at 3
    setCountdown(3);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Count down to 2
    setCountdown(2);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Count down to 1
    setCountdown(1);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Complete the countdown
    console.log('Countdown complete, showing questions');
    setShowThreeSecondCountdown(false);
    setInitialCountdownComplete(true);
  };

  // Handle form submission with success modal
  const onSubmitFeedback = async () => {
    // Prevent multiple submission attempts
    if (apiRequestInProgress) {
      console.log('Submit feedback request already in progress, ignoring duplicate');
      return;
    }
    
    setApiRequestInProgress(true);
    setShowCountdown(true);
    
    // Animated countdown 3,2,1
    setCountdown(3);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCountdown(2);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCountdown(1);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setShowCountdown(false);
    
    // Submit feedback with notes
    try {
      await handleSubmitFeedback(notes);
      
      // Show success modal
      setShowSuccessModal(true);
      setFeedbackSubmitted(true);
      
      // Auto-close modal after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setApiRequestInProgress(false);
    }
  };

  // Handle notes change
  const handleNotesChange = (questionId, value) => {
    setNotes(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Log state for debugging
  useEffect(() => {
    console.log('FeedbackSection render state:', {
      isLoading: questionsLoading,
      hasError: !!questionsError,
      questionsCount: questions?.length || 0,
      shouldShowQuestions,
      feedbackSubmitted,
      questionsReady,
      apiRequestInProgress
    });
  }, [questionsLoading, questionsError, questions, shouldShowQuestions, feedbackSubmitted, questionsReady, apiRequestInProgress]);

  // Break the loading state after a reasonable time if questions are still empty
  useEffect(() => {
    if (questionsLoading && !questionsError && !apiRequestInProgress) {
      // Set a timeout to stop loading after 10 seconds if no questions are found
      const timeoutId = setTimeout(() => {
        console.log('Question loading timeout reached. Breaking loading state.');
        // Check if the function exists before calling it
        // This fixes the "setQuestionsLoading is not defined" error
        if (typeof setQuestionsLoading === 'function') {
          setQuestionsLoading(false);
          if (typeof setQuestionsError === 'function') {
            setQuestionsError('Loading timed out. Please refresh or try again later.');
          }
        }
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [questionsLoading, questionsError, apiRequestInProgress]);

  // Load questions only once when the component mounts or when shouldShowQuestions changes
  useEffect(() => {
    // Only proceed if we should show questions and they're not already loading or loaded
    if (shouldShowQuestions && !questionsLoading && !questions.length && !apiRequestInProgress && !requestInitiated) {
      console.log('Initiating questions load for meeting:', activeMeeting?.id);
      setRequestInitiated(true);
      
      if (typeof setQuestionsLoading === 'function') {
        setQuestionsLoading(true);
        setApiRequestInProgress(true);
        
        // Set a timeout to ensure we exit the loading state even if the parent component's
        // loading callback never completes
        setTimeout(() => {
          setApiRequestInProgress(false);
          if (typeof setQuestionsLoading === 'function') {
            setQuestionsLoading(false);
          }
        }, 15000);
      }
    }
  }, [shouldShowQuestions, questionsLoading, questions, activeMeeting, apiRequestInProgress, requestInitiated]);

  // Reset request initiated flag when questions change
  useEffect(() => {
    if (questions && questions.length > 0) {
      setApiRequestInProgress(false);
      setRequestInitiated(false);
    }
  }, [questions]);

  // When questions are loading
  if (questionsLoading) {
    return (
      <Paper sx={{ 
        p: 4, 
        borderRadius: 2, 
        minHeight: '400px', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)'
      }}>
        <CircularProgress size={60} thickness={4} sx={{ color: '#1A2137', mb: 3 }} />
        <Typography variant="h6" sx={{ color: '#1A2137', mb: 1 }}>Loading questions...</Typography>
        <Typography variant="body2" sx={{ color: '#555' }}>This will take just a moment</Typography>
      </Paper>
    );
  }

  // When there's an error loading questions
  if (questionsError) {
    return (
      <Paper sx={{ 
        p: 4, 
        borderRadius: 2,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        textAlign: 'center'
      }}>
        <Box sx={{ width: '200px', height: '200px', mb: 3 }}>
          <Player
            autoplay
            loop
            src={ratingAnimation}
            style={{ width: '100%', height: '100%' }}
            rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
          />
        </Box>
        
        <Box sx={{ maxWidth: '500px' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#d32f2f', mb: 2 }}>
            {questionsError.includes("No questions found") || questionsError.includes("No questions available") ? 
              "No questions found for this meeting or department" : 
              questionsError}
          </Typography>
          <Typography variant="body1" sx={{ color: '#555', mb: 3 }}>
            Questions become available when the Academic Director posts them for your department or when you have an upcoming meeting.
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3, width: '100%' }}>
            <Alert severity="info" sx={{ textAlign: 'left' }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                • Check "View Meetings" to see your scheduled meetings
              </Typography>
            </Alert>
            <Alert severity="info" sx={{ textAlign: 'left' }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                • Questions appear 5 minutes before each meeting starts
              </Typography>
        </Alert>
          </Box>
          
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => window.location.reload()} 
            startIcon={<RefreshIcon />}
            sx={{ mt: 1, textTransform: 'none', fontWeight: 'medium' }}
          >
            Refresh Page
          </Button>
        </Box>
      </Paper>
    );
  }

  // When feedback has been submitted for this meeting
  if (feedbackSubmitted) {
    return (
      <Paper sx={{ 
        p: 4, 
        borderRadius: 2,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        textAlign: 'center'
      }}>
        <Box sx={{ width: '200px', height: '200px', mb: 3 }}>
          <Player
            autoplay
            loop
            src={ratingAnimation}
            style={{ width: '100%', height: '100%' }}
            rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
          />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1A2137', mb: 2 }}>
        Thank you for your valuable feedback. Future meetings will be updated soon. ✅
        </Typography>
        <Typography variant="body1" sx={{ color: '#555', maxWidth: '600px', mx: 'auto' }}>
          Your feedback has been submitted successfully. Thank you for your participation. We'll notify you when a new meeting is scheduled with questions for your review.
        </Typography>
      </Paper>
    );
  }

  // Initial 3-second countdown
  if (showThreeSecondCountdown) {
    return (
      <Paper sx={{ 
        p: 4, 
        borderRadius: 2,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        textAlign: 'center',
        position: 'relative'
      }}>
        <Box sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(26, 33, 55, 0.7)',
          backdropFilter: 'blur(8px)',
          borderRadius: 2,
          zIndex: 10
        }}>
          <Typography variant="h1" sx={{ 
            fontWeight: 'bold', 
            color: '#fff', 
            mb: 3, 
            fontSize: '8rem',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.5)'
          }}>
            {countdown}
          </Typography>
          <Typography variant="h5" sx={{ 
            color: '#fff', 
            mb: 3,
            textShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
          }}>
            Get ready to provide feedback
          </Typography>
          <Box sx={{ width: 150, height: 150 }}>
            <Player
              autoplay
              loop={false}
              src={countdownAnimation}
              style={{ width: '100%', height: '100%' }}
              rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
            />
          </Box>
        </Box>
        
        {/* Background content (questions form) */}
        <Box sx={{ opacity: 0.3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1A2137' }}>
            Submit Feedback
          </Typography>
          
          {activeMeeting && (
            <Typography variant="h6" sx={{ mb: 3, color: '#666' }}>
              {activeMeeting.title || "Current Meeting"}
            </Typography>
          )}
        </Box>
      </Paper>
    );
  }

  // When no questions available or meeting hasn't started yet
  if (!shouldShowQuestions || !questionsReady || questions.length === 0) {
    return (
      <Paper sx={{ 
        p: 4, 
        borderRadius: 2,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        textAlign: 'center'
      }}>
        <Box sx={{ width: '200px', height: '200px', mb: 3 }}>
          <Player
            autoplay
            loop
            src={ratingAnimation}
            style={{ width: '100%', height: '100%' }}
            rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
          />
        </Box>
        
        {questionsLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress size={40} thickness={4} sx={{ mb: 2, color: '#1A2137' }} />
            <Typography variant="h6" sx={{ color: '#555' }}>
              Loading questions...
            </Typography>
          </Box>
        ) : (
          <>
        {activeMeeting ? (
          <>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1A2137', mb: 2 }}>
                  {(timeToMeeting !== null && timeToMeeting > 5)
                ? `Meeting starts in ${timeToMeeting} minutes`
                : "Questions will be available 5 minutes before the meeting starts"}
            </Typography>
            <Typography variant="h6" sx={{ color: '#555' }}>
              {activeMeeting.title || "Upcoming Meeting"}
            </Typography>
            
                {(timeToMeeting !== null && timeToMeeting > 5) && (
              <Typography variant="body2" sx={{ mt: 3, color: '#666', fontStyle: 'italic' }}>
                Questions will be automatically shown {timeToMeeting-5} minutes from now
              </Typography>
            )}
          </>
            ) : questionsError ? (
              <Box sx={{ maxWidth: '500px' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#d32f2f', mb: 2 }}>
                  {questionsError}
                </Typography>
                <Typography variant="body1" sx={{ color: '#555', mb: 3 }}>
                  Please try again later or select a meeting from the "View Meetings" tab.
                </Typography>
                <Alert severity="info" sx={{ textAlign: 'left', mb: 2 }}>
                  Questions will automatically appear here 5 minutes before your scheduled meetings.
                </Alert>
              </Box>
            ) : (
              <Box sx={{ maxWidth: '500px' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1A2137', mb: 2 }}>
                  No feedback questions available yet
                </Typography>
                <Typography variant="body1" sx={{ color: '#555', mb: 3 }}>
                  Questions will appear here automatically when:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3, width: '100%' }}>
                  <Alert severity="info" sx={{ textAlign: 'left' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      • You have an upcoming meeting (within 5 minutes of start time)
                    </Typography>
                  </Alert>
                  <Alert severity="info" sx={{ textAlign: 'left' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      • The Academic Director has posted feedback questions for your department
                    </Typography>
                  </Alert>
                </Box>
                <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                  You can also check your scheduled meetings in the "View Meetings" tab
          </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>
    );
  }

  // Default view - questions available for answering
  return (
    <Paper sx={{ 
      p: 4, 
      borderRadius: 2,
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
    }}>
      {/* Animated stars background */}
      <Box sx={{ 
        position: 'absolute', 
        right: 20, 
        top: 20, 
        width: '180px',    // Increased from 120px 
        height: '180px',   // Increased from 120px
        opacity: 0.2,      // Increased from 0.08
        zIndex: 0
      }}>
        <Player
          autoplay
          loop
          src={ratingAnimation}
          style={{ width: '100%', height: '100%' }}
          rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
        />
      </Box>
      
      <Typography variant="h5" sx={{ 
        fontWeight: 'bold', 
        mb: 3, 
        color: '#1A2137',
        position: 'relative',
        zIndex: 1,
        '&:after': {
          content: '""',
          position: 'absolute',
          bottom: -8,
          left: 0,
          width: 40,
          height: 3,
          backgroundColor: '#FFD700',
          borderRadius: 1.5
        }
      }}>
        Submit Feedback
      </Typography>
      
      {activeMeeting && (
        <Box sx={{ mb: 4, position: 'relative', zIndex: 1 }}>
          <Typography variant="h6" sx={{ mb: 1, color: '#444', fontWeight: 'medium' }}>
            {activeMeeting.title || "Current Meeting"}
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            Please rate each aspect of the meeting and provide your valuable feedback
          </Typography>
        </Box>
      )}
      
      {questions.map((question, index) => (
        <Box 
          key={question.id} 
          sx={{ 
            mb: 4, 
            pb: 3, 
            borderBottom: index < questions.length - 1 ? '1px solid rgba(0,0,0,0.08)' : 'none',
            position: 'relative',
            zIndex: 1
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, color: '#333' }}>
            {index + 1}. {question.question || question.text}
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            flexWrap: 'wrap',
            mb: 2 
          }}>
            <Rating
              name={`rating-${question.id}`}
              value={localRatings[question.id] || 0}
              onChange={(event, newValue) => handleRatingChange(question.id, newValue)}
              precision={0.5}
              size="large"
              emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
              sx={{ 
                fontSize: '2rem',
                '& .MuiRating-iconFilled': {
                  color: '#FFD700',
                },
                '& .MuiRating-iconHover': {
                  color: '#FFED8A',
                }
              }}
            />
            
            <Typography variant="body2" sx={{ ml: 2, color: '#666', minWidth: 80 }}>
              {localRatings[question.id] ? `${localRatings[question.id]} / 5` : 'Not rated'}
            </Typography>
          </Box>
          
          <TextField
            fullWidth
            variant="outlined"
            label="Additional comments (optional)"
            multiline
            rows={2}
            onChange={(e) => handleNotesChange(question.id, e.target.value)}
            value={notes[question.id] || ''}
            sx={{ 
              mt: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.8)'
              }
            }}
          />
        </Box>
      ))}
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        mt: 4,
        position: 'relative',
        zIndex: 1
      }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={onSubmitFeedback}
          disabled={loading || Object.values(localRatings).every(rating => rating === 0)}
          sx={{ 
            px: 4, 
            py: 1.5, 
            borderRadius: 2,
            fontSize: '1rem',
            fontWeight: 'bold',
            textTransform: 'none',
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
            }
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
              Submitting...
            </>
          ) : 'Submit Feedback'}
        </Button>
      </Box>
      
      {/* Countdown Modal - Clean design with just the number */}
      <Modal
        open={showCountdown}
        aria-labelledby="countdown-modal-title"
        closeAfterTransition
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Fade in={showCountdown}>
          <Box sx={{ 
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            outline: 'none',
            zIndex: 1000
          }}>
            <Typography variant="h1" sx={{ 
              fontWeight: 'bold', 
              color: '#1A2137', 
              textAlign: 'center',
              fontSize: { xs: '16rem', sm: '20rem' },
              lineHeight: 1,
              opacity: 0.9
            }}>
              {countdown}
            </Typography>
          </Box>
        </Fade>
      </Modal>
      
      {/* Success Modal */}
      <Modal 
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        closeAfterTransition
      >
        <Fade in={showSuccessModal}>
          <Box sx={{ 
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)'
          }}>
            <Box sx={{ width: 150, height: 150, mx: 'auto', mb: 2 }}>
              <Player
                autoplay
                loop
                src={successAnimation}
                style={{ width: '100%', height: '100%' }}
                rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
              />
            </Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: '#1A2137' }}>
              Thank You!
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#555' }}>
              Your feedback has been submitted successfully.
            </Typography>
          </Box>
        </Fade>
      </Modal>
    </Paper>
  );
};

export default FeedbackSection; 