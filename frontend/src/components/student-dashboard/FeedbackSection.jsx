import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Rating, Alert, CircularProgress, Modal, Fade, TextField, LinearProgress } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';

const FeedbackSection = ({ 
  questions, 
  ratings, 
  handleRatingChange, 
  handleSubmitFeedback, 
  loading, 
  questionsLoading, 
  questionsError, 
  activeMeeting,
  feedbackSubmitted,
  setFeedbackSubmitted,
  shouldShowQuestions = false
}) => {
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [countdownProgress, setCountdownProgress] = useState(100);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [timeToMeeting, setTimeToMeeting] = useState(null);
  const [questionsReady, setQuestionsReady] = useState(false);
  const [showThreeSecondCountdown, setShowThreeSecondCountdown] = useState(false);
  const [initialCountdownComplete, setInitialCountdownComplete] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [notes, setNotes] = useState({});

  // Audio cue for accessibility
  const playAudioCue = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 660;
      gainNode.gain.value = 0.1;
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      setTimeout(() => oscillator.stop(), 200);
    } catch (error) {
      console.log('Audio cue not supported');
    }
  };

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
    playAudioCue();
    setCountdownProgress(100);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Progress animation for 3
    for (let i = 100; i >= 0; i -= 5) {
      setCountdownProgress(i);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Count down to 2
    setCountdown(2);
    playAudioCue();
    setCountdownProgress(100);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Progress animation for 2
    for (let i = 100; i >= 0; i -= 5) {
      setCountdownProgress(i);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Count down to 1
    setCountdown(1);
    playAudioCue();
    setCountdownProgress(100);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Progress animation for 1
    for (let i = 100; i >= 0; i -= 5) {
      setCountdownProgress(i);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Complete the countdown
    playAudioCue();
    console.log('Countdown complete, showing questions');
    setShowThreeSecondCountdown(false);
    setInitialCountdownComplete(true);
  };

  // Handle form submission with success modal
  const onSubmitFeedback = async () => {
    setShowCountdown(true);
    
    // Animated countdown 3,2,1
    setCountdown(3);
    playAudioCue();
    setCountdownProgress(100);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Progress animation for 3
    for (let i = 100; i >= 0; i -= 5) {
      setCountdownProgress(i);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Count down to 2
    setCountdown(2);
    playAudioCue();
    setCountdownProgress(100);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Progress animation for 2
    for (let i = 100; i >= 0; i -= 5) {
      setCountdownProgress(i);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Count down to 1
    setCountdown(1);
    playAudioCue();
    setCountdownProgress(100);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Progress animation for 1
    for (let i = 100; i >= 0; i -= 5) {
      setCountdownProgress(i);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    playAudioCue();
    setShowCountdown(false);
    
    // Submit feedback with notes
    await handleSubmitFeedback(notes);
    
    // Show success modal
    setShowSuccessModal(true);
    setFeedbackSubmitted(true);
    
    // Auto-close modal after 3 seconds
    setTimeout(() => {
      setShowSuccessModal(false);
    }, 3000);
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

  // JSX for when feedback has been submitted for this meeting
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
        <Box sx={{ 
          width: 140, 
          height: 140, 
          mb: 3,
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #004777 0%, #1A2137 100%)',
          display: 'flex',
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: '0 10px 20px rgba(26, 33, 55, 0.2)',
        }}>
          <Typography variant="h2" sx={{ color: 'white', fontWeight: 'bold' }}>
            ✓
          </Typography>
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1A2137', mb: 2 }}>
          Feedback Submitted Successfully!
        </Typography>
        <Typography variant="body1" sx={{ color: '#555', maxWidth: '600px', mx: 'auto' }}>
          Thank you for your participation. We value your input!
        </Typography>
      </Paper>
    );
  }

  // Initial 3-second countdown
  if (showThreeSecondCountdown) {
    return (
      <Paper sx={{ 
        p: 4, 
        borderRadius: 0,
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
          backgroundColor: 'rgba(26, 33, 55, 0.85)',
          backgroundImage: 'radial-gradient(circle at center, rgba(41, 52, 92, 0.8) 0%, rgba(26, 33, 55, 0.95) 70%)',
          backdropFilter: 'blur(8px)',
          borderRadius: 0,
          zIndex: 10
        }}>
          <Typography variant="h1" sx={{ 
            fontWeight: 'bold', 
            color: '#fff', 
            mb: 4, 
            fontSize: '8rem',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
            transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            animation: `${countdown === 3 ? 'scaleIn 0.5s ease-out' : 
                        countdown === 2 ? 'scaleIn 0.5s ease-out' : 
                        countdown === 1 ? 'scaleIn 0.5s ease-out' : ''}`,
            '@keyframes scaleIn': {
              '0%': {
                transform: 'scale(0.8)',
                opacity: 0.5
              },
              '50%': {
                transform: 'scale(1.1)'
              },
              '100%': {
                transform: 'scale(1)',
                opacity: 1
              }
            }
          }}>
            {countdown}
          </Typography>
          <Typography variant="h5" sx={{ 
            color: '#fff', 
            mb: 4,
            textShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
          }}>
            Get ready to provide feedback
          </Typography>
          
          <Box sx={{ width: '250px', mb: 3 }}>
            <LinearProgress 
              variant="determinate" 
              value={countdownProgress} 
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  backgroundImage: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
                  boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
                  transition: 'transform 0.1s linear'
                }
              }}
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

  // When questions are loading
  if (questionsLoading) {
    return <Box sx={{ display: 'none' }}></Box>;
  }

  // When there's an error loading questions
  if (questionsError) {
    return (
      <Paper sx={{ p: 4, borderRadius: 0 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {questionsError}
          <Button size="small" onClick={() => window.location.reload()} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      </Paper>
    );
  }

  // When no questions available or meeting hasn't started yet
  if (!shouldShowQuestions || !questionsReady || questions.length === 0) {
    return (
      <Paper sx={{ 
        p: 4, 
        borderRadius: 0,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        textAlign: 'center'
      }}>
        <Box sx={{ 
          width: 160, 
          height: 100, 
          mb: 3, 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #004777 0%, #1A2137 100%)',
          boxShadow: '0 10px 20px rgba(26, 33, 55, 0.2)',
        }}>
          <Typography variant="h2" sx={{ color: 'white', fontWeight: 'bold' }}>
            {timeToMeeting !== null ? timeToMeeting : '?'}
          </Typography>
        </Box>
        
        {activeMeeting ? (
          <>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1A2137', mb: 2 }}>
              {timeToMeeting > 5
                ? `Meeting starts in ${timeToMeeting} minutes`
                : "Questions will be available 5 minutes before the meeting starts"}
            </Typography>
            <Typography variant="h6" sx={{ color: '#555' }}>
              {activeMeeting.title || "Upcoming Meeting"}
            </Typography>
            
            {timeToMeeting > 5 && (
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
                  • You have an upcoming meeting starting within 5 minutes
                </Typography>
              </Alert>
              <Alert severity="info" sx={{ textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  • The Academic Director has posted questions for your year/department
                </Typography>
              </Alert>
            </Box>
            <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
              You can also check your scheduled meetings in the "View Meetings" tab
            </Typography>
          </Box>
        )}
      </Paper>
    );
  }

  // Default view - questions available for answering
  return (
    <Paper sx={{ 
      p: 4, 
      borderRadius: 0,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      border: '1px solid #e0e0e0'
    }}>
     
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 'bold', 
          mb: 2, 
          color: '#1A2137',
          position: 'relative',
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
          Submit Feedback
        </Typography>
        
        {activeMeeting && (
          <Typography variant="h6" sx={{ mb: 3, color: '#666' }}>
            {activeMeeting.title || "Current Meeting"}
          </Typography>
        )}
        
        {questions.map((question) => (
          <Box key={question.id} sx={{ 
            mb: 4,
            p: 3,
            border: '1px solid #eaeaea',
            borderRadius: 2,
            backgroundColor: '#fafafa',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 6px 15px rgba(0,0,0,0.08)'
            }
          }}>
            <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 2 }}>
              {question.text}
            </Typography>
            <Rating
              name={`rating-${question.id}`}
              value={ratings[question.id] || 0}
              onChange={(event, newValue) => handleRatingChange(question.id, newValue)}
              size="large"
              sx={{ 
                color: '#FFD700', 
                mt: 1,
                mb: 2,
                '& .MuiRating-iconEmpty': {
                  color: '#dddddd'
                }
              }}
              emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              placeholder="Additional comments (optional)"
              value={notes[question.id] || ''}
              onChange={(e) => handleNotesChange(question.id, e.target.value)}
              sx={{
                mt: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  fontSize: '0.9rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)'
                }
              }}
            />
          </Box>
        ))}
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button 
            variant="contained" 
            onClick={onSubmitFeedback} 
            disabled={loading || showCountdown}
            sx={{ 
              bgcolor: '#1A2137', 
              '&:hover': { bgcolor: '#2A3147' },
              fontWeight: 'medium',
              px: 4,
              py: 1.5,
              borderRadius: 2,
              boxShadow: '0 4px 10px rgba(26,33,55,0.2)',
              transition: 'transform 0.2s',
              '&:hover:not(:disabled)': {
                transform: 'translateY(-3px)',
                boxShadow: '0 6px 15px rgba(26,33,55,0.3)'
              }
            }}
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </Box>
      </Box>
      
      {/* Countdown Modal - Clean design with just the number and progress bar */}
      <Modal
        open={showCountdown}
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
            background: 'rgba(26, 33, 55, 0.85)',
            backgroundImage: 'radial-gradient(circle at center, rgba(41, 52, 92, 0.8) 0%, rgba(26, 33, 55, 0.95) 70%)',
            backdropFilter: 'blur(10px)',
            outline: 'none',
            zIndex: 1000
          }}>
            <Typography variant="h1" sx={{ 
              fontWeight: 'bold', 
              color: '#FFFFFF', 
              textAlign: 'center',
              fontSize: { xs: '14rem', sm: '18rem' },
              lineHeight: 1,
              mb: 6,
              textShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
              transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              animation: `${countdown === 3 ? 'scaleIn 0.5s ease-out' : 
                         countdown === 2 ? 'scaleIn 0.5s ease-out' : 
                         countdown === 1 ? 'scaleIn 0.5s ease-out' : ''}`,
              '@keyframes scaleIn': {
                '0%': {
                  transform: 'scale(0.8)',
                  opacity: 0.5
                },
                '50%': {
                  transform: 'scale(1.1)'
                },
                '100%': {
                  transform: 'scale(1)',
                  opacity: 1
                }
              }
            }}>
              {countdown}
            </Typography>
            
            <Box sx={{ width: '300px' }}>
              <LinearProgress 
                variant="determinate" 
                value={countdownProgress} 
                sx={{
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 6,
                    backgroundImage: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
                    boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
                    transition: 'transform 0.1s linear'
                  }
                }}
              />
            </Box>
          </Box>
        </Fade>
      </Modal>
      
      {/* Success Modal */}
      <Modal
        open={showSuccessModal}
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
        <Fade in={showSuccessModal}>
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
              onClick={() => setShowSuccessModal(false)}
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
    </Paper>
  );
};

export default FeedbackSection; 