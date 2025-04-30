import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  Chip,
  Tabs,
  Tab,
  Card,
  CardContent,
  Avatar,
  Divider,
  Badge,
  Grid,
  Button,
  Container
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import BusinessIcon from '@mui/icons-material/Business';
import ForumIcon from '@mui/icons-material/Forum';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const MinutesOfMeetings = ({ departments = [] }) => {
  const navigate = useNavigate();
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [hodResponses, setHodResponses] = useState([]);
  const [academicDirectorQuestions, setAcademicDirectorQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  // Fetch Academic Director questions on component mount
  useEffect(() => {
    fetchAcademicDirectorQuestions();
  }, []);

  // Fetch Academic Director Questions
  const fetchAcademicDirectorQuestions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.get('http://localhost:8080/api/questions', {
        headers: { 'x-access-token': token }
      });
      
      if (response.data) {
        console.log('Fetched Academic Director questions:', response.data);
        setAcademicDirectorQuestions(response.data);
      }
    } catch (error) {
      console.error('Error fetching Academic Director questions:', error);
      setError('Failed to load Academic Director questions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch HOD responses for a specific department
  const fetchHodResponsesForDepartment = async (deptId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      const selectedDeptId = parseInt(deptId);
      console.log('Fetching HOD responses for department ID:', selectedDeptId);
      
      // Find department name for logging
      const selectedDeptName = departments.find(d => d.id === selectedDeptId)?.name;
      console.log('Selected department name:', selectedDeptName);
      
      // Using the API endpoint from hodResponse.routes.js
      const responsesResponse = await axios.get(`http://localhost:8080/api/responses/department/${selectedDeptId}`, {
        headers: { 'x-access-token': token }
      });
      
      if (responsesResponse.data) {
        console.log('HOD Responses data received:', responsesResponse.data);
        
        // Verify the responses match the selected department
        const filteredResponses = responsesResponse.data.filter(question => {
          const questionDeptId = parseInt(question.departmentId);
          const matches = questionDeptId === selectedDeptId;
          if (!matches) {
            console.warn(`Question ID ${question.id} has departmentId ${questionDeptId} which doesn't match selected department ${selectedDeptId}`);
          }
          return matches;
        });
        
        console.log(`Filtered to ${filteredResponses.length} responses for department ID ${selectedDeptId}`);
        
        // Update state with the filtered responses - this triggers a re-render without page refresh
        setHodResponses(filteredResponses);
      }
    } catch (error) {
      console.error('Error fetching HOD responses:', error);
      setError(`Failed to load responses for department ID ${deptId}`);
      setHodResponses([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get department name correctly
  const getCorrectDepartmentName = (question) => {
    // If department is an object with name property
    if (question.department && typeof question.department === 'object' && question.department.name) {
      return question.department.name;
    }
    
    // If departmentId exists, use it to find the department
    if (question.departmentId) {
      const dept = departments.find(d => d.id === parseInt(question.departmentId));
      return dept ? dept.name : getDepartmentName(question.departmentId);
    }
    
    // Fallback to string department or unknown
    return question.department || 'Unknown Department';
  };

  const getDepartmentName = (departmentId) => {
    const dept = departments.find(d => d.id === parseInt(departmentId));
    return dept ? dept.name : `Department ${departmentId}`;
  };

  // Helper function to format time with AM/PM
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

  // Helper function to format date or return null if invalid
  const formatDateOrNull = (dateString) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return null;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Handle department selection without page refresh
  const handleDepartmentChange = async (event) => {
    event.preventDefault(); // Prevent default form behavior
    const deptId = event.target.value;
    
    // Update local state immediately for responsive UI
    setSelectedDepartment(deptId);
    
    // Then trigger API call to get responses
    if (deptId) {
      await fetchHodResponsesForDepartment(deptId);
    } else {
      setHodResponses([]);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Render Academic Director Questions
  const renderAcademicDirectorQuestions = () => {
    // Group questions by role
    const studentQuestions = academicDirectorQuestions.filter(q => 
      q.role === 'student' || q.roleId === 1
    );
    
    const staffQuestions = academicDirectorQuestions.filter(q => 
      q.role === 'staff' || q.roleId === 2
    );
    
    // Further group student questions by year if needed
    const studentsByYear = {};
    studentQuestions.forEach(q => {
      const year = q.year || 'Unspecified';
      if (!studentsByYear[year]) {
        studentsByYear[year] = [];
      }
      studentsByYear[year].push(q);
    });
    
    return (
      <Box sx={{ mb: 3 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 0, 
            borderRadius: 1, 
            overflow: 'hidden' 
          }}
        >
          <Box sx={{ 
                    p: 1.5, 
            display: 'flex', 
            alignItems: 'center', 
            bgcolor: '#f5f5f7',
            borderBottom: '1px solid #e0e0e0'
                  }}>
            <AssignmentIcon sx={{ mr: 1.5, color: '#1976d2', fontSize: '1.2rem' }} />
            <Typography variant="subtitle1" fontWeight="bold">
              Today's Minutes of Meeting
                  </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button 
              startIcon={<FilterListIcon sx={{ fontSize: '0.9rem' }} />} 
              color="primary" 
              variant="outlined" 
              size="small"
              sx={{ borderRadius: 2, py: 0.5, px: 1, fontSize: '0.8rem' }}
            >
              Filter
            </Button>
          </Box>
          
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth" 
                            sx={{ 
              borderBottom: '1px solid #e0e0e0',
              minHeight: '40px',
              '& .MuiTab-root': {
                minHeight: '40px',
                py: 0.5
              }
            }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SchoolIcon sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                  <Typography variant="body2">Student Discussion</Typography>
                  {studentQuestions.length > 0 && (
                    <Badge 
                      badgeContent={studentQuestions.length} 
                      color="success" 
                      sx={{ ml: 2 }}
                      size="small"
                    />
                  )}
                </Box>
              } 
              id="student-tab"
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                  <Typography variant="body2">Staff Discussion</Typography>
                  {staffQuestions.length > 0 && (
                    <Badge 
                      badgeContent={staffQuestions.length} 
                      color="primary" 
                      sx={{ ml: 2 }}
                      size="small"
                    />
                  )}
                </Box>
              } 
              id="staff-tab"
            />
          </Tabs>
          
          <Box sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <LinearProgress sx={{ width: '50%' }} />
              </Box>
            ) : academicDirectorQuestions.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 1, py: 0.5 }}>
                <Typography variant="body2">No questions have been posted yet.</Typography>
              </Alert>
            ) : (
              <>
                {/* Student Questions Panel */}
                <Box hidden={activeTab !== 0} sx={{ mt: 1 }}>
                  {activeTab === 0 && (
                    <>
                      {/* Group by year */}
                      {Object.keys(studentsByYear).sort().map(year => (
                        <Box key={year} sx={{ mb: 2 }}>
                          {year !== 'Unspecified' && (
                            <Box 
                              sx={{ 
                                display: 'flex',
                                alignItems: 'center',
                                mb: 1,
                                pb: 0.5,
                                borderBottom: '1px dashed #e0e0e0'
                              }}
                            >
                              <SchoolIcon sx={{ mr: 0.5, color: '#4caf50', fontSize: '0.9rem' }} />
                              <Typography variant="subtitle2" color="#4caf50" fontWeight="medium">
                                Year {year} Students
                              </Typography>
                            </Box>
                          )}
                          
                          {studentsByYear[year].map((question, index) => {
                            const departmentName = getCorrectDepartmentName(question);
                            return (
                              <Card 
                                key={question.id} 
                                elevation={1} 
                                sx={{ 
                                  mb: 1.5, 
                                  borderRadius: 1,
                                  transition: 'transform 0.2s',
                                  '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: 2
                                  },
                                  borderLeft: '3px solid #4caf50'
                                }}
                              >
                                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                    <Avatar 
                                      sx={{ 
                                        bgcolor: '#4caf50', 
                                        mr: 1,
                                        width: 28, 
                                        height: 28,
                                        '& .MuiSvgIcon-root': {
                                          fontSize: '0.9rem'
                                        }
                                      }}
                                    >
                                      <SchoolIcon fontSize="small" />
                                    </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                                      <Typography variant="body1" fontWeight="medium">
                                {question.text}
                              </Typography>
                                      <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                <Chip 
                                          icon={<BusinessIcon sx={{ fontSize: '0.7rem' }} />}
                                          label={departmentName}
                                  size="small" 
                                          sx={{ mr: 0.5, height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }}
                                />
                                <Chip 
                                          icon={<SchoolIcon sx={{ fontSize: '0.7rem' }} />}
                                  label="Student" 
                                  size="small" 
                                          color="success"
                                          sx={{ mr: 0.5, height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }}
                                />
                                  <Chip 
                                          label={`Year ${question.year || 'N/A'}`}
                                    size="small" 
                                          color="primary"
                                    variant="outlined"
                                          sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }}
                                  />
                                      </Box>
                              </Box>
                            </Box>
                                </CardContent>
                              </Card>
                        );
                      })}
                    </Box>
                  ))}
                    </>
                  )}
                </Box>
                
                {/* Staff Questions Panel */}
                <Box hidden={activeTab !== 1} sx={{ mt: 1 }}>
                  {activeTab === 1 && (
                    <>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 1,
                          pb: 0.5,
                          borderBottom: '1px dashed #e0e0e0'
                        }}
                      >
                        <PersonIcon sx={{ mr: 0.5, color: '#1976d2', fontSize: '0.9rem' }} />
                        <Typography variant="subtitle2" color="#1976d2" fontWeight="medium">
                          Staff Members
                  </Typography>
                      </Box>
                      
                      {staffQuestions.map((question, index) => {
                        const departmentName = getCorrectDepartmentName(question);
                    return (
                          <Card 
                        key={question.id} 
                        elevation={1} 
                        sx={{ 
                              mb: 1.5, 
                              borderRadius: 1,
                              transition: 'transform 0.2s',
                          '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: 2
                              },
                              borderLeft: '3px solid #1976d2'
                            }}
                          >
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                <Avatar 
                          sx={{ 
                                    bgcolor: '#1976d2', 
                                    mr: 1,
                                    width: 28, 
                                    height: 28,
                                    '& .MuiSvgIcon-root': {
                                      fontSize: '0.9rem'
                                    }
                                  }}
                                >
                                  <PersonIcon fontSize="small" />
                                </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                                  <Typography variant="body1" fontWeight="medium">
                            {question.text}
                          </Typography>
                                  <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            <Chip 
                                      icon={<BusinessIcon sx={{ fontSize: '0.7rem' }} />}
                                      label={departmentName}
                              size="small" 
                                      sx={{ mr: 0.5, height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }}
                            />
                            <Chip 
                                      icon={<PersonIcon sx={{ fontSize: '0.7rem' }} />}
                              label="Staff" 
                              size="small" 
                                      color="primary"
                                      sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }}
                                    />
                                  </Box>
                          </Box>
                        </Box>
                            </CardContent>
                          </Card>
                    );
                  })}
                    </>
                  )}
                </Box>
              </>
              )}
            </Box>
        </Paper>
      </Box>
    );
  };

  // Render HOD Responses
  const renderHodResponses = () => {
    // Get the name of the selected department for display
    const selectedDeptName = selectedDepartment ? 
      departments.find(d => d.id === parseInt(selectedDepartment))?.name || 'Unknown Department' : 
      '';
    
    return (
      <Box sx={{ mt: 3 }}>
        <Paper elevation={3} sx={{ p: 0, borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={{ 
            p: 1.5, 
            display: 'flex', 
            alignItems: 'center', 
            bgcolor: '#f5f5f7',
            borderBottom: '1px solid #e0e0e0'
          }}>
            <ForumIcon sx={{ mr: 1.5, color: '#9c27b0', fontSize: '1.2rem' }} />
            <Typography variant="subtitle1" fontWeight="bold">
              HOD Responses
        </Typography>
          </Box>
          
          <Box sx={{ p: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="department-select-label" sx={{ fontSize: '0.9rem' }}>Select Department</InputLabel>
            <Select
              labelId="department-select-label"
              id="department-select"
              value={selectedDepartment}
              onChange={handleDepartmentChange}
              label="Select Department"
                sx={{ 
                  borderRadius: 1, 
                  height: 40,
                  fontSize: '0.9rem'
                }}
                size="small"
            >
              <MenuItem value="">
                <em>Select Department</em>
              </MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <LinearProgress sx={{ width: '50%' }} />
              </Box>
          ) : !selectedDepartment ? (
              <Alert severity="info" sx={{ borderRadius: 1, py: 0.5 }}>
                <Typography variant="body2">Please select a department to view HOD responses.</Typography>
            </Alert>
          ) : hodResponses.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 1, py: 0.5 }}>
                <Typography variant="body2">No responses found for {selectedDeptName}.</Typography>
            </Alert>
          ) : (
              <Grid container spacing={2}>
              {hodResponses.map((question) => {
                // Check if this question has an HOD response
                if (!question.hodResponse) return null;
                
                // Get department name
                const departmentName = selectedDeptName;
                  const responseDate = formatDateOrNull(question.hodResponse.createdAt);
                
                return (
                    <Grid item xs={12} md={6} key={question.id}>
                      <Card 
                        elevation={1} 
                    sx={{ 
                          height: '100%',
                          borderRadius: 1,
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 2
                          },
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <Box sx={{ 
                          p: 1.5, 
                          bgcolor: '#9c27b0', 
                          color: 'white' 
                        }}>
                          <Typography variant="body1" fontWeight="bold">
                      {question.text}
                    </Typography>
                        </Box>
                    
                        <CardContent sx={{ flexGrow: 1, p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                      <Chip 
                              icon={<BusinessIcon sx={{ fontSize: '0.7rem' }} />}
                              label={departmentName}
                        size="small" 
                        color="secondary" 
                              sx={{ mr: 0.5, height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }}
                      />
                        <Chip 
                              icon={question.role === 'staff' ? <PersonIcon sx={{ fontSize: '0.7rem' }} /> : <SchoolIcon sx={{ fontSize: '0.7rem' }} />}
                              label={question.role}
                          size="small" 
                              color={question.role === 'staff' ? "primary" : "success"}
                              sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }}
                        />
                    </Box>
                    
                          <Divider sx={{ my: 1 }} />
                          
                          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            <CheckCircleIcon sx={{ color: '#4caf50', mr: 1, mt: 0.5, fontSize: '1rem' }} />
                            <Box>
                              <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                                Action Taken by HOD:
                      </Typography>
                              <Typography variant="body2">
                        {question.hodResponse.response || 'No response provided'}
                      </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                        
                        {responseDate && (
                          <Box sx={{ 
                            p: 1, 
                            bgcolor: '#f5f5f7', 
                            borderTop: '1px solid #e0e0e0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end'
                          }}>
                            <CalendarTodayIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '0.8rem' }} />
                            <Typography variant="caption" color="text.secondary">
                              Submitted on {responseDate}
                      </Typography>
                    </Box>
                        )}
                      </Card>
                    </Grid>
                );
              })}
              </Grid>
            )}
            </Box>
        </Paper>
      </Box>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 1, px: 2, mb: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 2,
        pb: 1,
        borderBottom: '1px solid #e0e0e0'
      }}>
        <AssignmentIcon sx={{ fontSize: 24, mr: 1.5, color: '#1976d2' }} />
        <Typography variant="h5" fontWeight="bold">
        Minutes of Meetings
      </Typography>
      </Box>
      
      {/* Academic Director Questions Section */}
      <Box sx={{ mb: 2 }}>
      {renderAcademicDirectorQuestions()}
      </Box>
      
      {/* HOD Responses Section */}
      <Box sx={{ mt: 1 }}>
      {renderHodResponses()}
    </Box>
    </Container>
  );
};

export default MinutesOfMeetings; 