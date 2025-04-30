import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  LinearProgress,
  Alert,
  CircularProgress,
  DialogActions,
  DialogContentText
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import CreateMeetingForm from '../../meeting/CreateMeetingForm';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import EventNoteIcon from '@mui/icons-material/EventNote';

// Import Redux actions
import { fetchMeetings, updateMeeting, deleteMeeting, createMeeting } from '../../../redux/slices/meetingSlice';

/**
 * Meeting Management component for the Academic Director Dashboard
 */
const MeetingManagement = ({ getDepartmentName, isDataPreloaded }) => {
  const dispatch = useDispatch();
  
  // Get meetings data from Redux store
  const { meetings, loading } = useSelector(state => state.meetings);
  const { profile } = useSelector(state => state.user);
  
  // Extract meetings data from Redux format
  const getMeetingsData = () => {
    if (!meetings) return [];
    
    // Handle different possible data structures
    if (Array.isArray(meetings)) {
      return meetings;
    } 
    
    // If meetings is nested with categories (new API format)
    if (meetings.pastMeetings || meetings.currentMeetings || meetings.futureMeetings) {
      // Combine all meeting categories with proper null checks
      return [
        ...(Array.isArray(meetings.pastMeetings) ? meetings.pastMeetings : []),
        ...(Array.isArray(meetings.currentMeetings) ? meetings.currentMeetings : []),
        ...(Array.isArray(meetings.futureMeetings) ? meetings.futureMeetings : [])
      ];
    }
    
    return [];
  };
  
  // Use extracted meeting data
  const meetingsData = getMeetingsData();
  
  // Local component state
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [fallbackMeetings, setFallbackMeetings] = useState([]);
  const [error, setError] = useState(null);
  const [meetingsInitialized, setMeetingsInitialized] = useState(false);

  // Create demo meetings for testing
  const createDemoMeetings = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Next week
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    
    return [
      {
        id: "demo-1",
        title: "Department Review Meeting",
        date: today,
        meetingDate: today,
        startTime: "14:00",
        endTime: "15:30",
        departmentId: 1,
        department: {
          id: 1,
          name: "Computer Science"
        },
        role: 1, // 1 for student
        status: "Scheduled"
      },
      {
        id: "demo-2",
        title: "Faculty Feedback Session",
        date: tomorrowStr,
        meetingDate: tomorrowStr,
        startTime: "10:00",
        endTime: "11:30",
        departmentId: 2,
        department: {
          id: 2,
          name: "Information Technology"
        },
        role: 2, // 2 for staff
        status: "Scheduled"
      },
      {
        id: "demo-3",
        title: "Curriculum Planning",
        date: nextWeekStr,
        meetingDate: nextWeekStr,
        startTime: "09:00",
        endTime: "11:00",
        departmentId: 1,
        department: {
          id: 1,
          name: "Computer Science"
        },
        role: 1, // 1 for student
        status: "Scheduled"
      }
    ];
  };

  // Fetch meetings on component mount if none are available
  useEffect(() => {
    const initializeMeetings = async () => {
      // If data is already preloaded by parent or already initialized or loading, skip fetching
      if (isDataPreloaded || meetingsInitialized || loading) return;
      
      // If no meetings data is available, fetch it
      if (getMeetingsData().length === 0) {
        console.log('No meetings data found, fetching from server...');
        try {
          setError(null);
          setMeetingsInitialized(true);
          await dispatch(fetchMeetings()).unwrap();
        } catch (error) {
          console.error('Error fetching meetings:', error);
          setError(error?.message || 'Failed to fetch meetings');
          
          // Create fallback demo meetings
          const demoMeetings = createDemoMeetings();
          setFallbackMeetings(demoMeetings);
          
          // Save to localStorage for persistence
          localStorage.setItem('demoMeetings', JSON.stringify(demoMeetings));
          
          // Allow retry on error
          setMeetingsInitialized(false);
        }
      } else {
        // Meetings already loaded, just mark as initialized
        setMeetingsInitialized(true);
      }
    };
    
    initializeMeetings();
  }, [dispatch, meetingsInitialized, isDataPreloaded]);

  // Refresh meetings
  const handleRefreshMeetings = async () => {
    try {
      setError(null);
      setMeetingsInitialized(false); // Reset flag to allow refetching
      const result = await dispatch(fetchMeetings()).unwrap();
      console.log('Meetings refreshed successfully:', result);
      setMeetingsInitialized(true);
      
      // If we somehow still don't have meetings, use fallback
      if (!result || 
          (!result.pastMeetings?.length && 
           !result.currentMeetings?.length && 
           !result.futureMeetings?.length)) {
        console.log('No meetings returned from API, using fallback data');
        const demoMeetings = createDemoMeetings();
        setFallbackMeetings(demoMeetings);
      }
    } catch (error) {
      console.error('Error refreshing meetings:', error);
      setError(error?.message || 'Failed to refresh meetings data');
      setMeetingsInitialized(false); // Reset flag to allow retry
      
      // Create fallback demo meetings if none exist
      if (fallbackMeetings.length === 0) {
        const demoMeetings = createDemoMeetings();
        setFallbackMeetings(demoMeetings);
      }
    }
  };

  // Delete meeting 
  const handleDeleteMeeting = (meetingId) => {
    try {
      // Find the meeting in the data
      const meeting = meetingsData.find(m => m.id === meetingId);
      if (meeting) {
        setSelectedMeeting(meeting);
        setShowDeleteConfirm(true);
      }
    } catch (error) {
      console.error('Error preparing meeting deletion:', error);
      setError('Failed to prepare meeting for deletion');
    }
  };
  
  // Confirm deletion of meeting
  const confirmDeleteMeeting = async () => {
    try {
      if (selectedMeeting && selectedMeeting.id) {
        // Dispatch delete action
        await dispatch(deleteMeeting(selectedMeeting.id)).unwrap();
        
        // Refresh meetings after deletion
        await dispatch(fetchMeetings()).unwrap();
        
        // Close dialog
        setShowDeleteConfirm(false);
        setSelectedMeeting(null);
      }
    } catch (error) {
      console.error('Error deleting meeting:', error);
      setError('Failed to delete meeting: ' + (error.message || 'Unknown error'));
    }
  };

  // Edit meeting
  const handleEditMeeting = (meeting) => {
    setSelectedMeeting(meeting);
    setShowEditForm(true);
  };

  // Add/Update meeting
  const handleAddMeeting = async (meetingData) => {
    try {
      if (showEditForm && selectedMeeting) {
        // For editing, set status to Rescheduled
        const updatedMeetingData = {
          ...meetingData,
          status: 'Rescheduled'  // Set status to Rescheduled when editing
        };
        
        // Update meeting through Redux
        await dispatch(updateMeeting({ 
          meetingId: selectedMeeting.id, 
          meetingData: updatedMeetingData 
        })).unwrap();
      } else {
        // Handle add meeting logic with proper dispatch
        console.log('Add meeting:', meetingData);
        // Create new meeting through Redux
        await dispatch(createMeeting(meetingData)).unwrap();
      }
      
      // Refresh meetings
      await dispatch(fetchMeetings()).unwrap();
      
      // Close forms
      setShowAddForm(false);
      setShowEditForm(false);
      setSelectedMeeting(null);
    } catch (error) {
      console.error('Error adding/updating meeting:', error);
      setError('Failed to ' + (showEditForm ? 'update' : 'add') + ' meeting: ' + 
        (error.message || 'Unknown error'));
    }
  };

  // Format date and time for display
  const formatDateTime = (dateString, startTimeString, endTimeString) => {
    try {
      if (!dateString) {
        return 'No date specified';
      }
      
      // Try to create a valid date object
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      // Format date part
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Convert time to 12-hour format with AM/PM
      const formatTimeWithAMPM = (timeString) => {
        if (!timeString) return '';
        
        // If already includes AM/PM, return as is
        if (timeString.includes('AM') || timeString.includes('PM') || 
            timeString.includes('am') || timeString.includes('pm')) {
          return timeString;
        }
        
        // Parse the time string (expected format: "HH:MM")
        const [hours, minutes] = timeString.split(':').map(part => parseInt(part, 10));
        if (isNaN(hours) || isNaN(minutes)) return timeString;
        
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
        
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
      };
      
      // Format with both start and end time if available
      if (startTimeString && endTimeString) {
        const formattedStartTime = formatTimeWithAMPM(startTimeString);
        const formattedEndTime = formatTimeWithAMPM(endTimeString);
        return `${formattedDate} • ${formattedStartTime} - ${formattedEndTime}`;
      }
      
      // If we only have start time
      if (startTimeString) {
        const formattedStartTime = formatTimeWithAMPM(startTimeString);
        return `${formattedDate} at ${formattedStartTime}`;
      }
      
      return formattedDate;
    } catch (error) {
      console.error('Error formatting date:', error, { dateString, startTimeString, endTimeString });
      return 'Invalid date format';
    }
  };

  // Get department name function with fallback
  const getFormattedDepartmentName = (meeting) => {
    // Check if meeting has a department object with name
    if (meeting.department && meeting.department.name) {
      return meeting.department.name;
    }
    
    // Check if meeting has a departmentId and use the provided function
    if (meeting.departmentId && getDepartmentName) {
      return getDepartmentName(meeting.departmentId);
    }
    
    // If departmentName is directly available
    if (meeting.departmentName) {
      return meeting.departmentName;
    }
    
    // Fallback to a generic name or All Departments
    return 'Unknown Department';
  };

  // Combine Redux data with fallback data
  const combinedMeetingsData = getMeetingsData().length > 0 
    ? getMeetingsData() 
    : fallbackMeetings;

  // Get role display name
  const getRoleDisplayName = (meeting) => {
    // Enhanced debugging 
    console.log('Meeting role debug:', { 
      meetingId: meeting.id,
      role: meeting.role, 
      roleId: meeting.roleId,
      roleType: typeof meeting.role,
      meeting: meeting
    });
    
    // First check for numeric values - most reliable format (1=Student, 2=Staff)
    if (meeting.role === 1 || meeting.roleId === 1 || meeting.role === '1') {
      return (
        <Chip 
          label="Student"
          size="small"
          icon={<SchoolIcon sx={{ fontSize: 16 }} />}
          sx={{ 
            bgcolor: '#E3F2FD', 
            color: '#1565C0',
            '& .MuiChip-icon': {
              color: '#1565C0'
            }
          }}
        />
      );
    } else if (meeting.role === 2 || meeting.roleId === 2 || meeting.role === '2') {
      return (
        <Chip 
          label="Staff"
          size="small"
          icon={<PersonIcon sx={{ fontSize: 16 }} />}
          sx={{ 
            bgcolor: '#FFF3E0', 
            color: '#E65100',
            '& .MuiChip-icon': {
              color: '#E65100'
            }
          }}
        />
      );
    } 
    
    // Then check string values
    if (typeof meeting.role === 'string') {
      const roleStr = meeting.role.toLowerCase();
      if (roleStr === 'student' || roleStr.includes('student')) {
        return (
          <Chip 
            label="Student"
            size="small"
            icon={<SchoolIcon sx={{ fontSize: 16 }} />}
            sx={{ 
              bgcolor: '#E3F2FD', 
              color: '#1565C0',
              '& .MuiChip-icon': {
                color: '#1565C0'
              }
            }}
          />
        );
      } else if (roleStr === 'staff' || roleStr.includes('staff') || roleStr.includes('faculty')) {
        return (
          <Chip 
            label="Staff"
            size="small"
            icon={<PersonIcon sx={{ fontSize: 16 }} />}
            sx={{ 
              bgcolor: '#FFF3E0', 
              color: '#E65100',
              '& .MuiChip-icon': {
                color: '#E65100'
              }
            }}
          />
        );
      }
    }
    
    // If role is an object with a name/id property
    if (typeof meeting.role === 'object' && meeting.role !== null) {
      if (meeting.role.id === 1 || meeting.role.name?.toLowerCase()?.includes('student')) {
        return (
          <Chip 
            label="Student"
            size="small"
            icon={<SchoolIcon sx={{ fontSize: 16 }} />}
            sx={{ 
              bgcolor: '#E3F2FD', 
              color: '#1565C0',
              '& .MuiChip-icon': {
                color: '#1565C0'
              }
            }}
          />
        );
      } else if (meeting.role.id === 2 || meeting.role.name?.toLowerCase()?.includes('staff')) {
        return (
          <Chip 
            label="Staff"
            size="small"
            icon={<PersonIcon sx={{ fontSize: 16 }} />}
            sx={{ 
              bgcolor: '#FFF3E0', 
              color: '#E65100',
              '& .MuiChip-icon': {
                color: '#E65100'
              }
            }}
          />
        );
      }
    }
    
    // If we still have a value, try to make sense of it
    if (meeting.role) {
      const roleStr = String(meeting.role).toLowerCase();
      if (roleStr.includes('student') || roleStr === '1') {
        return (
          <Chip 
            label="Student"
            size="small"
            icon={<SchoolIcon sx={{ fontSize: 16 }} />}
            sx={{ 
              bgcolor: '#E3F2FD', 
              color: '#1565C0',
              '& .MuiChip-icon': {
                color: '#1565C0'
              }
            }}
          />
        );
      }
      if (roleStr.includes('staff') || roleStr.includes('faculty') || roleStr === '2') {
        return (
          <Chip 
            label="Staff"
            size="small"
            icon={<PersonIcon sx={{ fontSize: 16 }} />}
            sx={{ 
              bgcolor: '#FFF3E0', 
              color: '#E65100',
              '& .MuiChip-icon': {
                color: '#E65100'
              }
            }}
          />
        );
      }
      
      // If not student or staff but has a value
      return (
        <Chip 
          label={String(meeting.role)}
          size="small" 
          sx={{ bgcolor: '#ECEFF1', color: '#546E7A' }}
        />
      );
    }
    
    // Last resort: check for targetRole (sometimes used in API)
    if (meeting.targetRole) {
      const roleStr = meeting.targetRole.toLowerCase();
      const displayRole = meeting.targetRole.charAt(0).toUpperCase() + meeting.targetRole.slice(1);
      
      if (roleStr.includes('student')) {
        return (
          <Chip 
            label={displayRole}
            size="small"
            icon={<SchoolIcon sx={{ fontSize: 16 }} />}
            sx={{ 
              bgcolor: '#E3F2FD', 
              color: '#1565C0',
              '& .MuiChip-icon': {
                color: '#1565C0'
              }
            }}
          />
        );
      } else if (roleStr.includes('staff') || roleStr.includes('faculty')) {
        return (
          <Chip 
            label={displayRole}
            size="small"
            icon={<PersonIcon sx={{ fontSize: 16 }} />}
            sx={{ 
              bgcolor: '#FFF3E0', 
              color: '#E65100',
              '& .MuiChip-icon': {
                color: '#E65100'
              }
            }}
          />
        );
      }
      
      return (
        <Chip 
          label={displayRole}
          size="small" 
          sx={{ bgcolor: '#ECEFF1', color: '#546E7A' }}
        />
      );
    }
    
    // Default fallback
    return (
      <Chip 
        label="Unknown" 
        size="small" 
        sx={{ bgcolor: '#ECEFF1', color: '#546E7A' }}
      />
    );
  };

  // Add debugging for profile and departments
  useEffect(() => {
    console.log('MeetingManagement - Profile data:', profile);
    console.log('MeetingManagement - Departments:', profile?.departments);
  }, [profile]);

  // Helper function to determine if a meeting is for staff
  const isStaffRole = (meeting) => {
    if (!meeting) return false;
    
    // Try different ways to check if role is staff
    if (meeting.role === 'staff' || meeting.role === 2 || meeting.role === '2') {
      return true;
    }
    
    // Check roleId
    if (meeting.roleId === 2 || meeting.roleId === '2') {
      return true;
    }
    
    // Check string values with more complex logic
    if (typeof meeting.role === 'string' && 
       (meeting.role.toLowerCase() === 'staff' || 
        meeting.role.toLowerCase().includes('staff') || 
        meeting.role.toLowerCase().includes('faculty'))) {
      return true;
    }
    
    // Check if role is an object
    if (typeof meeting.role === 'object' && meeting.role !== null) {
      if (meeting.role.id === 2 || 
          (meeting.role.name && 
           (meeting.role.name.toLowerCase().includes('staff') || 
            meeting.role.name.toLowerCase().includes('faculty')))) {
        return true;
      }
    }
    
    return false;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Meeting Management
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddForm(true)}
            sx={{ mr: 1 }}
          >
            Add Meeting
          </Button>
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            onClick={handleRefreshMeetings}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="warning" 
          sx={{ mb: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => {
                setError(null);
                if (fallbackMeetings.length === 0) {
                  setFallbackMeetings(createDemoMeetings());
                }
              }}
            >
              Show Demo Data
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Loading Indicator */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Meeting List */}
      <Paper sx={{ mb: 3, overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Year</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date & Time</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {combinedMeetingsData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    {error || 'No meetings scheduled. Click \'Add Meeting\' to create one.'}
                  </TableCell>
                </TableRow>
              ) : (
                combinedMeetingsData.map((meeting) => (
                  <TableRow key={meeting.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EventNoteIcon sx={{ mr: 1, color: '#2196F3' }} />
                        <Typography sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                          {meeting.title}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {getFormattedDepartmentName(meeting)}
                    </TableCell>
                    <TableCell>
                      {isStaffRole(meeting) ? 'N/A' : (meeting.year ? meeting.year : 'All Years')}
                    </TableCell>
                    <TableCell>
                      {getRoleDisplayName(meeting)}
                    </TableCell>
                    <TableCell>
                      {formatDateTime(
                        meeting.scheduledDate || meeting.date || meeting.meetingDate, 
                        meeting.startTime || meeting.time,
                        meeting.endTime
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={meeting.status || 'Scheduled'}
                        size="small"
                        sx={{
                          bgcolor: 
                            (meeting.status && 
                              (meeting.status.toLowerCase() === 'completed' || 
                               meeting.status.toLowerCase() === 'complete')) ? '#E8F5E9' :
                            (meeting.status && 
                              (meeting.status.toLowerCase() === 'cancelled' || 
                               meeting.status.toLowerCase() === 'canceled')) ? '#FFEBEE' :
                            (meeting.status && 
                              (meeting.status.toLowerCase() === 'rescheduled' ||
                               meeting.status.toLowerCase() === 'reschedule' ||
                               meeting.status.toLowerCase().includes('reschedul'))) ? '#FFF8E1' :
                            '#E3F2FD', // Default for Scheduled
                          color: 
                            (meeting.status && 
                              (meeting.status.toLowerCase() === 'completed' || 
                               meeting.status.toLowerCase() === 'complete')) ? '#2E7D32' :
                            (meeting.status && 
                              (meeting.status.toLowerCase() === 'cancelled' || 
                               meeting.status.toLowerCase() === 'canceled')) ? '#C62828' :
                            (meeting.status && 
                              (meeting.status.toLowerCase() === 'rescheduled' ||
                               meeting.status.toLowerCase() === 'reschedule' ||
                               meeting.status.toLowerCase().includes('reschedul'))) ? '#F57F17' :
                            '#1565C0', // Default for Scheduled
                          border: 
                            (meeting.status && 
                              (meeting.status.toLowerCase() === 'completed' || 
                               meeting.status.toLowerCase() === 'complete')) ? '1px solid #C8E6C9' :
                            (meeting.status && 
                              (meeting.status.toLowerCase() === 'cancelled' || 
                               meeting.status.toLowerCase() === 'canceled')) ? '1px solid #FFCDD2' :
                            (meeting.status && 
                              (meeting.status.toLowerCase() === 'rescheduled' ||
                               meeting.status.toLowerCase() === 'reschedule' ||
                               meeting.status.toLowerCase().includes('reschedul'))) ? '1px solid #FFECB3' :
                            '1px solid #BBDEFB', // Default for Scheduled
                          borderRadius: '8px',
                          fontWeight: 'medium',
                          px: 1
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEditMeeting(meeting)}
                        size="small"
                        sx={{ 
                          bgcolor: 'rgba(33, 150, 243, 0.1)',
                          mr: 2,
                          '&:hover': {
                            bgcolor: 'rgba(33, 150, 243, 0.2)'
                          }
                        }}
                      >
                        <EditIcon fontSize="small" sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteMeeting(meeting.id)}
                        size="small"
                        sx={{ 
                          bgcolor: 'rgba(244, 67, 54, 0.1)',
                          '&:hover': {
                            bgcolor: 'rgba(244, 67, 54, 0.2)'
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add Meeting Dialog */}
      <Dialog open={showAddForm} onClose={() => setShowAddForm(false)} maxWidth="md">
        <DialogTitle>Add New Meeting</DialogTitle>
        <DialogContent>
          <CreateMeetingForm
            departments={profile?.departments || []}
            handleSubmit={handleAddMeeting}
            handleCancel={() => setShowAddForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Meeting Dialog */}
      {selectedMeeting && (
        <Dialog open={showEditForm} onClose={() => setShowEditForm(false)} maxWidth="md">
          <DialogTitle>Edit Meeting</DialogTitle>
          <DialogContent>
            <CreateMeetingForm
              departments={profile?.departments || []}
              handleSubmit={handleAddMeeting}
              handleCancel={() => setShowEditForm(false)}
              initialData={selectedMeeting}
              isEditing={true}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm || false} onClose={() => setShowDeleteConfirm(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the meeting "{selectedMeeting?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDeleteMeeting} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Default props
MeetingManagement.defaultProps = {
  isDataPreloaded: false
};

export default MeetingManagement; 