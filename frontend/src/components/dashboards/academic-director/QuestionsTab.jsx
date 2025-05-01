import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import EventIcon from '@mui/icons-material/Event';
import RefreshIcon from '@mui/icons-material/Refresh';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';

// Import Redux actions
import { createQuestion, updateQuestion, deleteQuestion, fetchAllQuestions } from '../../../redux/slices/questionSlice';
import { fetchMeetings } from '../../../redux/slices/meetingSlice';
import { fetchUserProfile } from '../../../redux/slices/userSlice';

/**
 * Questions Tab component for managing feedback questions
 */
const QuestionsTab = ({ isDataPreloaded }) => {
  const dispatch = useDispatch();
  
  // Get questions, meetings and departments from Redux store
  const { questions, loading: questionsLoading } = useSelector(state => state.questions);
  const { profile, loading: profileLoading } = useSelector(state => state.user);
  const { meetings, loading: meetingsLoading } = useSelector(state => state.meetings);
  
  // Combined loading state
  const loading = questionsLoading || profileLoading || meetingsLoading;
  
  // Local component state
  const [newQuestion, setNewQuestion] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [editQuestionId, setEditQuestionId] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState('');
  const [error, setError] = useState('');
  const [dataInitialized, setDataInitialized] = useState(false);
  const [showSubmitButton, setShowSubmitButton] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  
  // Departments from user profile
  const departments = profile?.departments || [];
  
  // Get available meetings from all categories
  const allMeetings = [
    ...(meetings?.pastMeetings || []),
    ...(meetings?.currentMeetings || []),
    ...(meetings?.futureMeetings || [])
  ];
  
  // If meetings is directly an array, use it (sometimes Redux may store it this way)
  const directMeetingsArray = Array.isArray(meetings) ? meetings : [];
  
  // Add debug logging for meetings
  console.log('QuestionsTab - Meetings data:', {
    meetingsObjectType: typeof meetings,
    meetingsObject: meetings,
    isDirectArray: Array.isArray(meetings),
    directArrayLength: directMeetingsArray.length,
    hasPastMeetings: Array.isArray(meetings?.pastMeetings),
    hasCurrentMeetings: Array.isArray(meetings?.currentMeetings),
    hasFutureMeetings: Array.isArray(meetings?.futureMeetings),
    pastMeetings: meetings?.pastMeetings,
    currentMeetings: meetings?.currentMeetings,
    futureMeetings: meetings?.futureMeetings,
    allMeetingsCount: allMeetings.length
  });
  
  // Combine all possible sources of meetings data
  const effectiveMeetings = [
    ...directMeetingsArray,
    ...allMeetings
  ].filter(meeting => meeting && meeting.id); // Ensure we only have valid meetings
  
  // Filter to show only scheduled/active meetings (not completed)
  const scheduledMeetings = effectiveMeetings.filter(m => {
    // Case insensitive status check
    const status = m.status ? m.status.toLowerCase() : '';
    
    // Log each meeting and its status for debugging
    console.log('Meeting status check:', {
      title: m.title,
      id: m.id,
      status: m.status,
      included: status === 'scheduled' || status === 'rescheduled' || !status
    });
    
    // Exclude meetings with completed status
    if (status === 'completed' || status === 'complete' || status.includes('complet')) {
      return false;
    }
    
    return (
      // Include meetings with status containing "scheduled" or "rescheduled" (case insensitive)
      status.includes('schedule') || 
      // Include meetings without status
      !status
    );
  });
  
  // Add debug logging for scheduled meetings
  console.log('QuestionsTab - Scheduled meetings for dropdown:', {
    scheduledMeetingsCount: scheduledMeetings.length,
    scheduledMeetings: scheduledMeetings
  });

  // Create a stable initialization function with useCallback
  const fetchInitialData = useCallback(async () => {
    // Skip if data is preloaded by parent or already initialized
    if (isDataPreloaded || dataInitialized) return;
    
    try {
      setError('');
      
      // Set to true immediately to prevent multiple calls
      setDataInitialized(true);
      
      // Load user profile to get departments
      if (!profile || !profile.departments || profile.departments.length === 0) {
        await dispatch(fetchUserProfile()).unwrap();
      }
      
      // Load questions
      await dispatch(fetchAllQuestions()).unwrap();
      
      // Always load meetings when navigating to Questions tab to ensure data synchronization
      console.log('Forcibly fetching meetings for Questions tab');
      await dispatch(fetchMeetings()).unwrap();
    } catch (err) {
      console.error('Error initializing questions tab:', err);
      setError('Failed to load initial data. Please refresh the page.');
      // Allow retry on error
      setDataInitialized(false);
    }
  }, [dispatch, isDataPreloaded, dataInitialized, profile]);

  // Initialize data on component mount with a stable dependency array
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Listen for route/tab changes to hide Submit button when on Meetings tab
  useEffect(() => {
    // Check for current tab - we can use URL or parent component props
    const currentPath = window.location.pathname;
    const isMeetingsTab = currentPath.includes('meetings') || 
                          currentPath.includes('manage-meetings');
    
    // Hide submit button if on meetings tab
    setShowSubmitButton(!isMeetingsTab);
    
    console.log("Current path:", currentPath, "Show submit button:", !isMeetingsTab);
  }, []);

  // Handle role change
  const handleRoleChange = (e) => {
    setTargetRole(e.target.value);
    if (e.target.value !== 'student' && year) {
      setYear('');
    }
  };

  // Handle department change
  const handleDepartmentChange = (e) => {
    setDepartment(e.target.value);
  };

  // Handle year change
  const handleYearChange = (e) => {
    console.log("Setting year to:", e.target.value);
    setYear(e.target.value);
  };
  
  // Handle meeting change
  const handleMeetingChange = (e) => {
    const meetingId = e.target.value;
    console.log(`Meeting selected: ID=${meetingId}`);
    
    // If a meeting was selected, try to find its details for verification
    if (meetingId) {
      const meetingObj = scheduledMeetings.find(m => String(m.id) === String(meetingId));
      if (meetingObj) {
        console.log(`Selected meeting verified: ${meetingObj.title}`);
      } else {
        console.warn(`Meeting with ID ${meetingId} not found in scheduled meetings`);
      }
    }
    
    setSelectedMeeting(meetingId);
  };

  // Handle question text change
  const handleQuestionChange = (value) => {
    setNewQuestion(value);
  };

  // Enhanced meeting lookup function with better debugging
  const getMeetingTitle = (meetingId) => {
    if (!meetingId) {
      console.log("No meetingId provided to getMeetingTitle");
      return null;
    }
    
    // Ensure meetingId is treated as a string for comparison
    const meetingIdStr = String(meetingId);
    console.log(`Looking for meeting ID: ${meetingIdStr} in meetings`);
    
    // First check the local Redux store for all questions
    // If the question has meeting data attached directly, use that
    const questionWithMeeting = questions.find(q => 
      String(q.meetingId) === meetingIdStr && q.meeting && q.meeting.title
    );
    
    if (questionWithMeeting && questionWithMeeting.meeting) {
      console.log(`Found meeting in questions cache: ${questionWithMeeting.meeting.title}`);
      return questionWithMeeting.meeting.title;
    }
    
    // Log all available meeting sources and their contents
    console.log("Available meeting sources:", {
      scheduledMeetings: scheduledMeetings.map(m => ({ id: m.id, title: m.title })),
      effectiveMeetings: effectiveMeetings.map(m => ({ id: m.id, title: m.title }))
    });
    
    // First try scheduledMeetings (most likely source)
    const scheduledMeeting = scheduledMeetings.find(m => String(m.id) === meetingIdStr);
    if (scheduledMeeting) {
      console.log(`Found meeting in scheduledMeetings: ${scheduledMeeting.title}`);
      
      // Save this meeting data to local storage in case we need it later
      try {
        const meetingsCache = JSON.parse(localStorage.getItem('meetingsCache') || '{}');
        meetingsCache[meetingIdStr] = {
          id: scheduledMeeting.id,
          title: scheduledMeeting.title,
          timestamp: Date.now()
        };
        localStorage.setItem('meetingsCache', JSON.stringify(meetingsCache));
      } catch (e) {
        console.error("Error caching meeting data:", e);
      }
      
      return scheduledMeeting.title;
    }
    
    // Then try effectiveMeetings
    const effectiveMeeting = effectiveMeetings.find(m => String(m.id) === meetingIdStr);
    if (effectiveMeeting) {
      console.log(`Found meeting in effectiveMeetings: ${effectiveMeeting.title}`);
      return effectiveMeeting.title;
    }
    
    // Try other sources as fallback
    const sources = [
      Array.isArray(meetings) ? meetings : [],
      meetings?.pastMeetings || [],
      meetings?.currentMeetings || [],
      meetings?.futureMeetings || []
    ];
    
    for (const source of sources) {
      const meeting = source.find(m => String(m.id) === meetingIdStr);
      if (meeting && meeting.title) {
        console.log(`Found meeting in secondary source: ${meeting.title}`);
        return meeting.title;
      }
    }
    
    // Try looking in localStorage cache as a last resort
    try {
      const meetingsCache = JSON.parse(localStorage.getItem('meetingsCache') || '{}');
      if (meetingsCache[meetingIdStr] && meetingsCache[meetingIdStr].title) {
        console.log(`Found meeting in localStorage cache: ${meetingsCache[meetingIdStr].title}`);
        return meetingsCache[meetingIdStr].title;
      }
    } catch (e) {
      console.error("Error reading meeting cache:", e);
    }
    
    console.log(`No meeting found with ID ${meetingIdStr} in any source`);
    return `Meeting ${meetingId}`;
  };

  // Add question with improved status and role handling
  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) return;
    
    try {
      // Validate that a role is selected
      if (!targetRole) {
        setError('Please select a target role (Student or Staff)');
        return;
      }
      
      // Store the selected meeting information before sending the request
      let selectedMeetingInfo = null;
      if (selectedMeeting) {
        const meetingObj = scheduledMeetings.find(m => String(m.id) === String(selectedMeeting));
        if (meetingObj) {
          selectedMeetingInfo = {
            id: meetingObj.id,
            title: meetingObj.title
          };
          console.log(`Selected meeting info for new question:`, selectedMeetingInfo);
        }
      }
      
      // Format data for API correctly
      const questionData = {
        text: newQuestion,
        role: targetRole,
        departmentId: department ? parseInt(department) : null,
        year: targetRole === 'student' ? year : null,
        meetingId: selectedMeeting ? parseInt(selectedMeeting) : null,
        status: 'Active'
      };
      
      console.log("Sending question data:", JSON.stringify(questionData, null, 2));
      
      // First clear form fields so UI is responsive
      setNewQuestion('');
      setTargetRole('');
      setDepartment('');
      setYear('');
      setSelectedMeeting('');
      
      // Then create the question
      const result = await dispatch(createQuestion(questionData)).unwrap();
      console.log("Question created successfully:", result);
      
      // If the response includes a question but no meeting information, manually add it
      if (result && result.question && result.question.meetingId && selectedMeetingInfo) {
        // Add meeting info directly to the question object in Redux
        result.question.meeting = selectedMeetingInfo;
        console.log("Enhanced question with meeting info:", result.question);
        
        // Also update the question in the existing questions array
        const updatedQuestions = [...questions];
        const newQuestionIndex = updatedQuestions.findIndex(q => q.id === result.question.id);
        if (newQuestionIndex !== -1) {
          updatedQuestions[newQuestionIndex] = {
            ...updatedQuestions[newQuestionIndex],
            meeting: selectedMeetingInfo
          };
        } else {
          // If not found, it might be a new question - add it with the meeting info
          updatedQuestions.push({
            ...result.question,
            meeting: selectedMeetingInfo
          });
        }
      }
      
      // Do a full refresh of data to ensure everything is up to date
      await Promise.all([
        dispatch(fetchAllQuestions()).unwrap(),
        dispatch(fetchMeetings()).unwrap()
      ]);
      
    } catch (error) {
      console.error('Error adding question:', error);
      setError(error?.message || 'Failed to add question');
    }
  };

  // Handle update question
  const handleUpdateQuestion = async () => {
    if (!newQuestion.trim() || !editQuestionId) return;
    
    try {
      // Store selected meeting info before update
      let selectedMeetingInfo = null;
      if (selectedMeeting) {
        const meetingObj = scheduledMeetings.find(m => String(m.id) === String(selectedMeeting));
        if (meetingObj) {
          selectedMeetingInfo = {
            id: meetingObj.id,
            title: meetingObj.title
          };
          console.log(`Selected meeting info for question update:`, selectedMeetingInfo);
        }
      }
      
      const questionData = {
        text: newQuestion,
        role: targetRole, // Make sure we're sending the correct role string 
        departmentId: department ? parseInt(department) : null,
        year: targetRole === 'student' ? year : null,
        meetingId: selectedMeeting ? parseInt(selectedMeeting) : null // Ensure meetingId is properly converted to integer
      };
      
      const result = await dispatch(updateQuestion({ questionId: editQuestionId, questionData })).unwrap();
      
      // Add meeting info to the updated question to ensure it's displayed in the UI
      if (result && result.id && selectedMeetingInfo) {
        // Update directly in the Redux state with the meeting relationship
        const updatedQuestions = [...questions];
        const questionIndex = updatedQuestions.findIndex(q => q.id === result.id);
        if (questionIndex !== -1) {
          updatedQuestions[questionIndex] = {
            ...result,
            meeting: selectedMeetingInfo
          };
          // Could dispatch a custom action to update the Redux state if needed
        }
      }
      
      // Reset form state
      setNewQuestion('');
      setEditQuestionId(null);
      setTargetRole('');
      setDepartment('');
      setYear('');
      setSelectedMeeting('');
      
      // Refresh questions to ensure data consistency
      await dispatch(fetchAllQuestions()).unwrap();
    } catch (error) {
      console.error('Error updating question:', error);
      setError(error?.message || 'Failed to update question');
    }
  };

  // Edit question
  const handleEditQuestion = (question) => {
    console.log("Editing question:", question);
    
    // Make sure to set correct values for editing
    setEditQuestionId(question.id);
    setNewQuestion(question.text);
    
    // Determine the correct role value
    let roleValue = 'student'; // Default
    
    if (question.role) {
      // Direct role field 
      roleValue = question.role;
    } else if (question.targetRole) {
      // Or targetRole field
      roleValue = question.targetRole;
    } else if (question.roleId) {
      // Or convert from numeric roleId
      roleValue = question.roleId === 2 ? 'staff' : 'student';
    }
    
    // Set role state
    setTargetRole(roleValue);
    
    // Set department
    if (question.departmentId) {
      setDepartment(String(question.departmentId));
    } else {
      setDepartment('');
    }
    
    // Set year for student questions
    if (roleValue === 'student' && question.year) {
      setYear(String(question.year));
    } else if (roleValue === 'student') {
      setYear('4'); // Default year for students
    } else {
      setYear(''); // Clear year for non-student roles
    }
    
    // Set meeting ID - ensure it's converted to string for the select component
    if (question.meetingId) {
      setSelectedMeeting(String(question.meetingId));
      
      // Cache the meeting data if it's available
      if (question.meeting && question.meeting.title) {
        try {
          const meetingsCache = JSON.parse(localStorage.getItem('meetingsCache') || '{}');
          meetingsCache[String(question.meetingId)] = {
            id: question.meetingId,
            title: question.meeting.title,
            timestamp: Date.now()
          };
          localStorage.setItem('meetingsCache', JSON.stringify(meetingsCache));
        } catch (e) {
          console.error("Error caching meeting data in edit:", e);
        }
      }
    } else {
      setSelectedMeeting('');
    }
  };

  // Initiate the delete question process - open confirmation dialog
  const handleDeleteQuestionClick = (question) => {
    setQuestionToDelete(question);
    setDeleteDialogOpen(true);
  };

  // Cancel delete operation
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setQuestionToDelete(null);
  };

  // Confirm and execute delete operation
  const handleDeleteConfirm = async () => {
    if (!questionToDelete) return;
    
    try {
      await dispatch(deleteQuestion(questionToDelete.id)).unwrap();
      
      if (editQuestionId === questionToDelete.id) {
        setEditQuestionId(null);
        setNewQuestion('');
      }
      
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    } catch (error) {
      console.error('Error deleting question:', error);
      setError(error?.message || 'Failed to delete question');
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    }
  };

  // Submit questions
  const handleSubmitQuestions = async () => {
    // TODO: Implement batch update using Redux
    // This would require a new action in the questionSlice
    console.log('Submit questions functionality would be implemented with Redux');
  };
  
  // Enhanced logging for questions to debug role issues
  useEffect(() => {
    if (questions.length > 0) {
      console.log("Current questions from Redux store:", 
        questions.map(q => ({
          id: q.id,
          text: q.text?.substring(0, 20),
          role: q.role,
          targetRole: q.targetRole,
          roleId: q.roleId
        }))
      );
    }
  }, [questions]);

  // Update localStorage meeting cache when we get fresh questions with meeting data
  useEffect(() => {
    if (questions.length > 0) {
      // Find all questions with meeting data
      const questionsWithMeetings = questions.filter(q => q.meetingId && q.meeting && q.meeting.title);
      
      if (questionsWithMeetings.length > 0) {
        try {
          // Get existing cache
          const meetingsCache = JSON.parse(localStorage.getItem('meetingsCache') || '{}');
          
          // Add all meeting data to cache
          questionsWithMeetings.forEach(q => {
            meetingsCache[String(q.meetingId)] = {
              id: q.meetingId,
              title: q.meeting.title,
              status: q.meeting.status || 'Scheduled',
              date: q.meeting.date,
              timestamp: Date.now()
            };
          });
          
          // Save updated cache
          localStorage.setItem('meetingsCache', JSON.stringify(meetingsCache));
          console.log(`Updated localStorage cache with ${questionsWithMeetings.length} meetings`);
        } catch (e) {
          console.error("Error updating meeting cache:", e);
        }
      }
    }
  }, [questions]);

  return (
    <Box sx={{ p: 3, bgcolor: '#f8f9fd' }}>
      {/* Page Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4
      }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1A2137' }}>
          Manage Feedback Questions
        </Typography>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={async () => {
            try {
              setDataInitialized(false);
              await fetchInitialData();
            } catch (error) {
              console.error('Error refreshing data:', error);
              setError('Failed to refresh data. Please try again.');
              setDataInitialized(true);
            }
          }}
          disabled={loading}
          sx={{ 
            borderColor: '#2196F3',
            color: '#2196F3',
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: 'rgba(33, 150, 243, 0.08)',
              borderColor: '#1976D2'
            }
          }}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </Box>
      
      {/* Error Message */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}
      
      {/* Loading Indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Create Questions Card */}
      <Card sx={{ 
        mb: 4, 
        borderRadius: 3, 
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        overflow: 'visible'
      }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ 
            mb: 3, 
            color: '#1A2137', 
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            '&:before': {
              content: '""',
              display: 'inline-block',
              width: '4px',
              height: '24px',
              backgroundColor: '#2196F3',
              borderRadius: '4px',
              marginRight: '12px'
            }
          }}>
            {editQuestionId ? 'Edit Question' : 'Add New Question'}
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#555' }}>
                Question Text *
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter your question here..."
                value={newQuestion}
                onChange={(e) => handleQuestionChange(e.target.value)}
                variant="outlined"
                multiline
                rows={2}
                required
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&:hover fieldset': {
                      borderColor: '#2196F3',
                      borderWidth: '2px'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2196F3',
                      borderWidth: '2px'
                    }
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#2196F3',
                    fontWeight: 600
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#555' }}>
                Target Role *
              </Typography>
              <FormControl fullWidth variant="outlined" sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  '&:hover fieldset': {
                    borderColor: '#2196F3',
                    borderWidth: '2px'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2196F3',
                    borderWidth: '2px'
                  }
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#2196F3',
                  fontWeight: 600
                }
              }}>
                <Select
                  value={targetRole}
                  onChange={handleRoleChange}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return "Select Role";
                    }
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {selected === 'student' ? (
                          <SchoolIcon sx={{ mr: 1, fontSize: 20, color: '#1565C0' }} />
                        ) : (
                          <PersonIcon sx={{ mr: 1, fontSize: 20, color: '#E65100' }} />
                        )}
                        {selected === 'student' ? 'Student' : 'Staff'}
                      </Box>
                    );
                  }}
                >
                  <MenuItem value="">
                    <em>Select Role</em>
                  </MenuItem>
                  <MenuItem value="student">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SchoolIcon sx={{ mr: 1, fontSize: 20, color: '#1565C0' }} />
                      Student
                    </Box>
                  </MenuItem>
                  <MenuItem value="staff">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon sx={{ mr: 1, fontSize: 20, color: '#E65100' }} />
                      Staff
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#555' }}>
                Department
              </Typography>
              <FormControl fullWidth variant="outlined" sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  '&:hover fieldset': {
                    borderColor: '#2196F3',
                    borderWidth: '2px'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2196F3',
                    borderWidth: '2px'
                  }
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#2196F3',
                  fontWeight: 600
                }
              }}>
                <Select
                  value={department}
                  onChange={handleDepartmentChange}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return "Select Department";
                    }
                    const dept = departments.find(d => d.id === parseInt(selected));
                    return dept ? dept.name : "Select Department";
                  }}
                >
                  <MenuItem value="">All Departments</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#555' }}>
                Year {targetRole === 'student' && '*'}
              </Typography>
              <FormControl 
                fullWidth 
                variant="outlined" 
                disabled={targetRole !== 'student'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&:hover fieldset': {
                      borderColor: '#2196F3',
                      borderWidth: '2px'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2196F3',
                      borderWidth: '2px'
                    }
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#2196F3',
                    fontWeight: 600
                  }
                }}
              >
                <Select
                  value={year}
                  onChange={handleYearChange}
                  displayEmpty
                  placeholder="Select Year"
                  renderValue={(selected) => {
                    if (!selected) return "Select Year";
                    return `Year ${selected}`;
                  }}
                >
                  <MenuItem value="">
                    <em>Select Year</em>
                  </MenuItem>
                  <MenuItem value="1">First Year</MenuItem>
                  <MenuItem value="2">Second Year</MenuItem>
                  <MenuItem value="3">Third Year</MenuItem>
                  <MenuItem value="4">Fourth Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#555' }}>
                Link to Meeting
              </Typography>
              <FormControl fullWidth variant="outlined" sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  '&:hover fieldset': {
                    borderColor: '#2196F3',
                    borderWidth: '2px'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2196F3',
                    borderWidth: '2px'
                  }
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#2196F3',
                  fontWeight: 600
                }
              }}>
                <Select
                  value={selectedMeeting}
                  onChange={handleMeetingChange}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return "Select Meeting";
                    }
                    
                    // First try to find meeting in scheduled meetings
                    const selectedMeetingObj = scheduledMeetings.find(m => String(m.id) === selected);
                    if (selectedMeetingObj) {
                      return selectedMeetingObj.title;
                    }
                    
                    // Second, check if it's in meeting cache
                    try {
                      const meetingsCache = JSON.parse(localStorage.getItem('meetingsCache') || '{}');
                      if (meetingsCache[selected] && meetingsCache[selected].title) {
                        return meetingsCache[selected].title;
                      }
                    } catch (e) {
                      console.error("Error reading meeting cache in dropdown:", e);
                    }
                    
                    // If not found in cache, try to get it from any question with the same meetingId
                    const questionWithMeeting = questions.find(q => 
                      String(q.meetingId) === selected && q.meeting && q.meeting.title
                    );
                    if (questionWithMeeting && questionWithMeeting.meeting) {
                      return questionWithMeeting.meeting.title;
                    }
                    
                    // Last resort fallback
                    return `Meeting ${selected}`;
                  }}
                >
                  <MenuItem value="">
                    <em>Meetings</em>
                  </MenuItem>
                  {scheduledMeetings.map((meeting) => (
                    <MenuItem key={meeting.id} value={String(meeting.id)}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EventIcon sx={{ mr: 1, fontSize: 20, color: '#2E7D32' }} />
                        <span>{meeting.title}</span>
                          </Box>
                        </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            {editQuestionId ? (
              <>
                <Button
                  variant="contained"
                  onClick={handleUpdateQuestion}
                  sx={{ 
                    mr: 1, 
                    bgcolor: '#2196F3',
                    borderRadius: '8px',
                    px: 3,
                    '&:hover': {
                      bgcolor: '#1976D2'
                    }
                  }}
                >
                  Update Question
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setNewQuestion('');
                    setEditQuestionId(null);
                    setSelectedMeeting('');
                  }}
                  sx={{ 
                    borderColor: '#757575',
                    color: '#757575',
                    borderRadius: '8px',
                    '&:hover': {
                      borderColor: '#424242',
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddQuestion}
                sx={{ 
                  bgcolor: '#4CAF50', 
                  borderRadius: '8px',
                  px: 3,
                  py: 1.2,
                  '&:hover': { bgcolor: '#388E3C' }
                }}
              >
                Add Question
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirm Delete Question"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this question? This action cannot be undone.
            {questionToDelete && (
              <Box component="div" sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  "{questionToDelete.text}"
                </Typography>
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Current Questions Table */}
      <Card sx={{ 
        borderRadius: 3, 
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        overflow: 'visible',
        width: '100%',
        maxWidth: '100%',
        mb: 5,
        background: 'linear-gradient(to right bottom, #ffffff, #fafafa)'
      }}>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            borderBottom: '2px solid #f0f0f0',
            pb: 2
          }}>
            <Typography variant="h6" sx={{ 
              color: '#1A2137', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              fontSize: '1.2rem',
              '&:before': {
                content: '""',
                display: 'inline-block',
                width: '5px',
                height: '28px',
                background: 'linear-gradient(45deg, #FF5722, #FF9800)',
                borderRadius: '4px',
                marginRight: '12px'
              }
            }}>
              Current Questions
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              {questions.length} {questions.length === 1 ? 'question' : 'questions'} found
            </Typography>
          </Box>

          {questions.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 8, 
              bgcolor: '#f9f9f9', 
              borderRadius: 2,
              border: '1px dashed #ccc'
            }}>
              <FolderOpenIcon sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No questions yet
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Use the form above to create your first question.
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ 
              boxShadow: 'none',
              borderRadius: 2,
              border: '1px solid #e8e8e8',
              overflow: 'visible'
            }}>
              <Table stickyHeader sx={{ width: '100%' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      bgcolor: '#f5f7fa',
                      color: '#1A2137',
                      width: '25%',
                      borderBottom: '2px solid #e0e0e0'
                    }}>
                      Question
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      bgcolor: '#f5f7fa',
                      color: '#1A2137',
                      width: '10%',
                      borderBottom: '2px solid #e0e0e0'
                    }}>
                      Role
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      bgcolor: '#f5f7fa',
                      color: '#1A2137',
                      width: '15%',
                      borderBottom: '2px solid #e0e0e0'
                    }}>
                      Department
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      bgcolor: '#f5f7fa',
                      color: '#1A2137',
                      width: '10%',
                      borderBottom: '2px solid #e0e0e0'
                    }}>
                      Year
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      bgcolor: '#f5f7fa',
                      color: '#1A2137',
                      width: '20%',
                      borderBottom: '2px solid #e0e0e0'
                    }}>
                      Meeting
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      bgcolor: '#f5f7fa',
                      color: '#1A2137',
                      width: '10%',
                      borderBottom: '2px solid #e0e0e0'
                    }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      bgcolor: '#f5f7fa',
                      color: '#1A2137',
                      width: '10%',
                      borderBottom: '2px solid #e0e0e0'
                    }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {questions.map((question) => {
                    // Improved logic for displaying meeting title in the table
                    let meetingTitle = "No Meeting";
                    let foundMeeting = false;
                    
                    // Get meeting title - FIXING MEETING DISPLAY
                    if (question.meetingId) {
                      console.log(`Looking for meeting ID: ${question.meetingId} in meetings for display`);
                      
                      // First check if the question has a meeting object directly attached
                      if (question.meeting && question.meeting.title) {
                        meetingTitle = question.meeting.title;
                        foundMeeting = true;
                        console.log(`Found meeting title from question.meeting: ${meetingTitle}`);
                        
                        // Save to localStorage for persistence between sessions
                        try {
                          const meetingsCache = JSON.parse(localStorage.getItem('meetingsCache') || '{}');
                          meetingsCache[String(question.meetingId)] = {
                            id: question.meetingId,
                            title: meetingTitle,
                            timestamp: Date.now()
                          };
                          localStorage.setItem('meetingsCache', JSON.stringify(meetingsCache));
                          console.log(`Saved meeting ${question.meetingId} to localStorage cache`);
                        } catch (e) {
                          console.error("Error caching meeting data from table:", e);
                        }
                      } 
                      // Then try to find the meeting through other means
                      else {
                        // Use the helper function that checks multiple sources including localStorage cache
                      meetingTitle = getMeetingTitle(question.meetingId) || "No Meeting";
                        console.log(`For question ${question.id}, meeting title resolved to: ${meetingTitle}`);
                      foundMeeting = meetingTitle !== "No Meeting" && !meetingTitle.startsWith("Meeting ");
                        
                        // If we found the meeting, update the question object for future reference
                        if (foundMeeting) {
                          question.meeting = {
                            id: question.meetingId,
                            title: meetingTitle
                          };
                        }
                      }
                    }
                    
                    // SIMPLIFIED AND IMPROVED ROLE DETECTION
                    let roleDisplay = 'Student'; // Default fallback
                    
                    // Log question for debugging
                    console.log(`[ROLE DEBUG] Question ${question.id}:`, {
                      id: question.id, 
                      text: question.text?.substring(0, 20),
                      role: question.role,
                      targetRole: question.targetRole,
                      roleId: question.roleId
                    });
                    
                    // 1. First try the specific 'role' or 'targetRole' fields
                    if (question.role === 'staff' || question.targetRole === 'staff') {
                      roleDisplay = 'Staff';
                      console.log(`Question ${question.id} set as STAFF from direct role field`);
                    } else if (question.role === 'student' || question.targetRole === 'student') {
                      roleDisplay = 'Student';
                      console.log(`Question ${question.id} set as STUDENT from direct role field`);
                    } 
                    // 2. Try numeric roleId values
                    else if (question.roleId === 2 || question.role === 2) {
                      roleDisplay = 'Staff';
                      console.log(`Question ${question.id} set as STAFF from roleId=2`);
                    } else if (question.roleId === 1 || question.role === 1) {
                      roleDisplay = 'Student';
                      console.log(`Question ${question.id} set as STUDENT from roleId=1`);
                    }
                    // 3. Use context clues if all else fails
                    else if (question.year) {
                      roleDisplay = 'Student';
                      console.log(`Question ${question.id} defaulted to STUDENT based on year=${question.year}`);
                    } else {
                      // Otherwise, just use our default
                      console.log(`Question ${question.id} using default role: ${roleDisplay}`);
                    }
                    
                    // Get department name
                    const departmentName = question.departmentId 
                      ? (departments.find(d => d.id === Number(question.departmentId))?.name || 'Unknown Department') 
                      : 'All Departments';
                    
                    // Default status to Active if not set
                    const status = question.status || 'Active';
                    
                    // Log for debugging
                    console.log(`Question ${question.id} final display: role=${question.role || 'undefined'} → ${roleDisplay}, meetingId=${question.meetingId}, title=${meetingTitle}`);
                    
                    return (
                      <TableRow key={question.id} 
                        sx={{ 
                          '&:nth-of-type(odd)': { backgroundColor: '#fcfcfc' },
                          transition: 'background-color 0.2s ease',
                          borderLeft: '4px solid transparent',
                          '&:hover': {
                            backgroundColor: '#f0f7ff',
                            borderLeft: `4px solid ${roleDisplay === 'Student' ? '#2196F3' : '#FF9800'}`
                          }
                        }}
                      >
                        <TableCell sx={{ 
                          maxWidth: 250, 
                          wordBreak: 'break-word',
                          pl: 3,
                          borderBottom: '1px solid #eeeeee',
                          fontSize: '0.9rem'
                        }}>
                          <Tooltip title={question.text} placement="top-start" arrow>
                            <Typography sx={{ 
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                          {question.text}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px solid #eeeeee' }}>
                          <Chip 
                            icon={roleDisplay === 'Student' ? <SchoolIcon /> : <PersonIcon />}
                            label={roleDisplay} 
                            size="small"
                            sx={{
                              bgcolor: roleDisplay === 'Student' ? '#E3F2FD' : '#FFF3E0',
                              color: roleDisplay === 'Student' ? '#1565C0' : '#E65100',
                              fontWeight: 'medium',
                              borderRadius: '8px',
                              py: 0.5,
                              '& .MuiChip-icon': {
                                color: roleDisplay === 'Student' ? '#1565C0' : '#E65100',
                              },
                              border: roleDisplay === 'Student' ? '1px solid #BBDEFB' : '1px solid #FFE0B2'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px solid #eeeeee', fontSize: '0.9rem' }}>
                          {departmentName}
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px solid #eeeeee' }}>
                          {question.year ? (
                            <Chip 
                              label={`Year ${question.year}`}
                              size="small"
                              sx={{
                                bgcolor: '#F3E5F5',
                                color: '#7B1FA2',
                                borderRadius: '8px',
                                fontWeight: 'medium',
                                border: '1px solid #E1BEE7'
                              }}
                            />
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px solid #eeeeee' }}>
                          {question.meetingId ? (
                            <Tooltip title={meetingTitle} placement="top" arrow>
                            <Chip 
                              icon={<EventIcon fontSize="small" />}
                              size="small"
                              label={meetingTitle}
                              sx={{
                                bgcolor: foundMeeting ? '#E8F5E9' : '#ECEFF1',
                                color: foundMeeting ? '#2E7D32' : '#546E7A',
                                  borderRadius: '8px',
                                  py: 0.5,
                                  maxWidth: 180,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  fontWeight: 'medium',
                                  border: foundMeeting ? '1px solid #C8E6C9' : '1px solid #CFD8DC',
                                '& .MuiChip-icon': {
                                  color: foundMeeting ? '#2E7D32' : '#546E7A'
                                }
                              }}
                            />
                            </Tooltip>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              No Meeting
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px solid #eeeeee' }}>
                          <Chip
                            label={status}
                            size="small"
                            sx={{
                              bgcolor: 
                                status === 'Published' ? '#E8F5E9' :
                                status === 'Archived' ? '#ECEFF1' :
                                status === 'Active' ? '#E8F5E9' :
                                '#FFF8E1',
                              color: 
                                status === 'Published' ? '#2E7D32' :
                                status === 'Archived' ? '#546E7A' :
                                status === 'Active' ? '#2E7D32' :
                                '#F57F17',
                              borderRadius: '8px',
                              fontWeight: 'medium',
                              border: 
                                status === 'Published' ? '1px solid #C8E6C9' :
                                status === 'Archived' ? '1px solid #CFD8DC' :
                                status === 'Active' ? '1px solid #C8E6C9' :
                                '1px solid #FFECB3'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px solid #eeeeee' }}>
                          <Box sx={{ display: 'flex' }}>
                            <IconButton
                              color="primary"
                              onClick={() => handleEditQuestion(question)}
                              size="small"
                              sx={{ 
                                mr: 1,
                                bgcolor: 'rgba(33, 150, 243, 0.1)',
                                '&:hover': {
                                  bgcolor: 'rgba(33, 150, 243, 0.2)',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 3px 10px rgba(33, 150, 243, 0.2)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteQuestionClick(question)}
                              size="small"
                              sx={{ 
                                bgcolor: 'rgba(244, 67, 54, 0.1)',
                                '&:hover': {
                                  bgcolor: 'rgba(244, 67, 54, 0.2)',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 3px 10px rgba(244, 67, 54, 0.2)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

// Default props
QuestionsTab.defaultProps = {
  isDataPreloaded: false
};

export default QuestionsTab; 