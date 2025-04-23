import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Snackbar,
  Alert,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Tooltip,
  useTheme
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import LogoutIcon from '@mui/icons-material/Logout';
import SendIcon from '@mui/icons-material/Send';
import EventIcon from '@mui/icons-material/Event';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import InsightsIcon from '@mui/icons-material/Insights';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarHalfIcon from '@mui/icons-material/StarHalf';
import FeedbackIcon from '@mui/icons-material/Feedback';

const ExecutiveDirectorDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [userProfile, setUserProfile] = useState({
    name: 'Executive Director',
    position: 'Executive Director',
    email: 'executive.director@university.edu',
    department: 'Engineering'
  });
  const [meetings, setMeetings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [questions, setQuestions] = useState([]);
  const [studentQuestionPerformance, setStudentQuestionPerformance] = useState([
    { id: 1, question: 'Question 1', score: 92, color: '#1a73e8' },
    { id: 2, question: 'Question 2', score: 72, color: '#00c853' },
    { id: 3, question: 'Question 3', score: 54, color: '#ffca28' },
    { id: 4, question: 'Question 4', score: 63, color: '#f44336' },
  ]);
  const [staffQuestionPerformance, setStaffQuestionPerformance] = useState([
    { id: 1, question: 'Question 1', score: 85, color: '#1a73e8' },
    { id: 2, question: 'Question 2', score: 65, color: '#00c853' },
    { id: 3, question: 'Question 3', score: 70, color: '#ffca28' },
    { id: 4, question: 'Question 4', score: 50, color: '#f44336' },
  ]);
  const [performanceSummary, setPerformanceSummary] = useState({
    studentOverall: 78,
    staffOverall: 65
  });
  const [hodResponses, setHodResponses] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [academicDirectorQuestions, setAcademicDirectorQuestions] = useState([]);
  
  // New state variables for feedback data
  const [feedbackData, setFeedbackData] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState({
    totalResponses: 0,
    overallAverageRating: 0,
    overallRatingDistribution: {},
    departmentStats: []
  });
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // New state variables for question-specific feedback
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [questionFeedback, setQuestionFeedback] = useState({
    questionId: '',
    totalResponses: 0,
    averageRating: 0,
    ratingDistribution: {},
    feedback: []
  });
  const [questionFeedbackLoading, setQuestionFeedbackLoading] = useState(false);
  const [allQuestions, setAllQuestions] = useState([]);
  
  // New state variables for department-specific feedback
  const [selectedDepartmentForStats, setSelectedDepartmentForStats] = useState('');
  const [departmentFeedback, setDepartmentFeedback] = useState({
    departmentId: '',
    totalResponses: 0,
    averageRating: 0,
    ratingDistribution: {},
    questionStats: []
  });
  const [departmentFeedbackLoading, setDepartmentFeedbackLoading] = useState(false);

  const theme = useTheme();
  // Define rating colors for consistent styling across charts
  const ratingColors = {
    5: '#4CAF50', // Green
    4: '#8BC34A', // Light Green
    3: '#FFC107', // Amber
    2: '#FF9800', // Orange
    1: '#F44336'  // Red
  };

  // Define sidebar tabs
  const tabs = [
    { id: 'profile', label: "Profile", icon: <PersonIcon /> },
    { id: 'meetings', label: "Meetings", icon: <EventIcon /> },
    { id: 'analytics', label: "Analytics", icon: <BarChartIcon /> },
    { id: 'reports', label: "Reports", icon: <AssessmentIcon /> },
    { id: 'minutesOfMeetings', label: "Minutes of Meetings", icon: <DescriptionIcon /> }
  ];

  // Check authentication and role on component mount
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        const response = await axios.get('http://localhost:8080/api/auth/verify', {
          headers: {
            'x-access-token': token
          }
        });

        if (!response.data.valid) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        
        const userRoles = response.data.user.roles;
        if (!userRoles.includes('executive_director')) {
          setError('You do not have permission to access this dashboard');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
          return;
        }

        setUserProfile(response.data.user);
        await Promise.all([
          fetchMeetings(),
          fetchDepartments(),
          fetchAcademicDirectorQuestions(),
          fetchFeedbackData(),
          fetchFeedbackStats(),
          fetchAllQuestions()
        ]);
      } catch (error) {
        console.error('Authentication error:', error);
        setError(error.response?.data?.message || 'Authentication failed');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Effect to fetch question feedback when a question is selected
  useEffect(() => {
    if (selectedQuestionId) {
      fetchQuestionFeedback(selectedQuestionId);
    }
  }, [selectedQuestionId]);

  // Add useEffect to fetch department feedback when a department is selected
  useEffect(() => {
    if (selectedDepartmentForStats) {
      fetchDepartmentFeedback(selectedDepartmentForStats);
    }
  }, [selectedDepartmentForStats]);

  // New functions to fetch feedback data
  const fetchFeedbackData = async () => {
    setFeedbackLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.get('http://localhost:8080/api/feedback/all', {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        console.log('Received feedback data:', response.data);
        setFeedbackData(response.data);
      } else {
        console.error('Invalid feedback data format:', response.data);
      }
    } catch (error) {
      console.error('Error fetching feedback data:', error);
      setError(error.message);
      setSnackbar({
        open: true,
        message: 'Failed to load feedback data: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      });
    } finally {
      setFeedbackLoading(false);
    }
  };

  const fetchFeedbackStats = async () => {
    setFeedbackLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.get('http://localhost:8080/api/feedback/stats/overall', {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data) {
        console.log('Received feedback stats:', response.data);
        setFeedbackStats(response.data);
      } else {
        console.error('Invalid feedback stats format:', response.data);
      }
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
      setError(error.message);
      setSnackbar({
        open: true,
        message: 'Failed to load feedback statistics: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      });
    } finally {
      setFeedbackLoading(false);
    }
  };

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Fetching meetings for Executive Director dashboard');
      
      try {
        // Use the standard /meetings endpoint to get all meetings
        const response = await axios.get('http://localhost:8080/api/meetings', {
          headers: {
            'x-access-token': token,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data && Array.isArray(response.data)) {
          console.log(`Received ${response.data.length} meetings from API`);
          
          // Executive Director should see ALL meetings regardless of role/department/year
          const sortedMeetings = response.data.sort((a, b) => {
            const dateA = new Date(a.meetingDate || a.date || '');
            const dateB = new Date(b.meetingDate || b.date || '');
            return dateA - dateB;
          });
          
          // Store meetings in localStorage for offline access
          localStorage.setItem('allMeetings', JSON.stringify(sortedMeetings));
          setMeetings(sortedMeetings);
          console.log('Meetings set in state:', sortedMeetings.length);
        } else {
          console.error('Invalid meeting data format:', response.data);
        }
      } catch (apiError) {
        console.error('API fetch failed, trying localStorage:', apiError);
        
        // If API fails with 401, clear token and redirect to login
        if (apiError.response?.status === 401) {
          localStorage.removeItem('token');
          setSnackbar({
            open: true,
            message: 'Session expired. Please log in again.',
            severity: 'error'
          });
          navigate('/login');
          return;
        }
        
        // If API fails for other reasons, try to load from localStorage
        const storedMeetings = localStorage.getItem('allMeetings');
        if (storedMeetings) {
          try {
            const parsedMeetings = JSON.parse(storedMeetings);
            if (Array.isArray(parsedMeetings)) {
              console.log('Loaded meetings from localStorage:', parsedMeetings.length);
              setMeetings(parsedMeetings);
            }
          } catch (parseError) {
            console.error('Error parsing stored meetings:', parseError);
          }
        }
      }
    } catch (error) {
      console.error('Error in fetchMeetings:', error);
      setError(error.message);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to load meetings. Please try again later.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8080/api/users/profile', {
        headers: { 'x-access-token': token }
        });
        
        if (response.data) {
        setUserProfile(prev => ({
          ...prev,
          email: response.data.email || prev.email
        }));
        }
      } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  };

    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8080/api/departments', {
        headers: { 'x-access-token': token }
        });
        
        if (response.data) {
          setDepartments(response.data);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        throw error;
      }
    };

  // Fetch Academic Director questions - updated to get all questions
  const fetchAcademicDirectorQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Get all questions without filtering by creator
      const response = await axios.get('http://localhost:8080/api/questions', {
        headers: { 'x-access-token': token }
      });
      
      if (response.data) {
        console.log('All Questions loaded:', response.data);
        // Store all questions, we'll organize them in the UI
        setAcademicDirectorQuestions(response.data);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Failed to load questions');
      setSnackbar({
        open: true,
        message: 'Error loading questions: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      });
    }
  };

  const fetchQuestionsWithResponses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/questions/with-responses', {
        headers: { 'x-access-token': token }
      });
      
      if (response.data) {
        setQuestions(response.data);
      }
    } catch (error) {
      console.error('Error fetching questions with responses:', error);
      throw error;
    }
  };

  // Add function to export individual reports based on role
  const handleExportIndividualReport = async (roleType) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Get all feedback data using the /feedback/all endpoint
      const response = await axios.get('http://localhost:8080/api/feedback/all', {
        headers: { 'x-access-token': token }
      });
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid feedback data received');
      }
      
      // Define roleId based on roleType
      let roleId = null;
      let roleName = '';
      
      switch (roleType) {
        case 'student':
          roleId = 1;
          roleName = 'Student';
          break;
        case 'hod':
          roleId = 2;
          roleName = 'HOD';
          break;
        case 'staff':
          roleId = 3;
          roleName = 'Staff';
          break;
        case 'academic_director':
          roleId = 4;
          roleName = 'Academic Director';
          break;
        case 'executive_director':
          roleId = 5;
          roleName = 'Executive Director';
          break;
        default:
          throw new Error('Invalid role type');
      }
      
      // Group feedback by user's department and role
      const feedbackData = response.data;
      const departmentData = {};
      
      // Process each feedback entry
      feedbackData.forEach(feedback => {
        const user = feedback.user;
        // Skip if no user data
        if (!user) return;
        
        // Determine role from username pattern since API doesn't include roleId
        let userRoleId = null;
        
        // Simple pattern matching for username to determine role
        // Students typically have E followed by numbers or ST prefix
        if (user.username.match(/^E\d/) || user.username.startsWith('ST')) {
          userRoleId = 1; // student
        } 
        // Skip if not the target role
        if (userRoleId !== roleId) return;
        
        // Use the properties directly without redeclaring
        const userDepartmentId = user.departmentId;
        const userDepartmentName = user.department?.name || 'Unknown Department';
        
        // Initialize department if not exists
        if (!departmentData[userDepartmentId]) {
          departmentData[userDepartmentId] = {
            name: userDepartmentName,
            users: {}
          };
        }
        
        // Initialize user if not exists
        const userId = user.id;
        if (!departmentData[userDepartmentId].users[userId]) {
          departmentData[userDepartmentId].users[userId] = {
            id: userId,
            name: user.fullName || user.username || 'Anonymous',
            year: user.year,
            feedback: []
          };
        }
        
        // Add feedback to user
        departmentData[userDepartmentId].users[userId].feedback.push({
          id: feedback.id,
          questionId: feedback.questionId,
          questionText: feedback.question?.text || 'Unknown Question',
          rating: feedback.rating,
          notes: feedback.notes,
          submittedAt: feedback.submittedAt
        });
      });
      
      // Generate CSV content
      let csvContent = `${roleName} Individual Feedback Report\n\n`;
      
      // For each department
      Object.entries(departmentData).forEach(([deptId, dept]) => {
        csvContent += `Department: ${dept.name}\n\n`;
        
        // For each user in the department
        Object.values(dept.users).forEach(user => {
          csvContent += `User: ${user.name}\n`;
          if (roleType === 'student' && user.year) {
            csvContent += `Year: ${user.year}\n`;
          }
          csvContent += `User ID: ${user.id}\n\n`;
          
          // Add feedback headers
          csvContent += 'Question ID,Question,Rating,Notes,Submitted Date\n';
          
          // Add feedback rows
          user.feedback.forEach(item => {
            const row = [
              item.questionId,
              `"${(item.questionText || '').replace(/"/g, '""')}"`,
              item.rating,
              `"${(item.notes || '').replace(/"/g, '""')}"`,
              new Date(item.submittedAt).toLocaleString()
            ];
            csvContent += row.join(',') + '\n';
          });
          
          // Calculate average rating for this user
          const totalRating = user.feedback.reduce((sum, item) => sum + item.rating, 0);
          const averageRating = user.feedback.length > 0 ? (totalRating / user.feedback.length).toFixed(2) : 'N/A';
          csvContent += `\nAverage Rating: ${averageRating}\n\n`;
          
          // Add separator between users
          csvContent += '-------------------------\n\n';
        });
        
        // Add separator between departments
        csvContent += '=========================\n\n';
      });
      
      // Create file for download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `${roleName.toLowerCase()}_individual_report.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setSnackbar({
        open: true,
        message: `Successfully exported ${roleName} individual report`,
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Export failed:', error);
      setSnackbar({
        open: true,
        message: `Failed to export individual report: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Update the existing handleDownloadReport function to use our new function
  const handleDownloadReport = async (role, type) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      if (type === 'individual') {
        // Use the new backend API for individual reports
        const response = await axios({
          url: `http://localhost:8080/api/feedback/excel/individual/${role}`,
          method: 'GET',
          responseType: 'blob',
          headers: { 'x-access-token': token }
        });
        
        // Create a download link
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', `${role}_individual_report.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
        
        setSnackbar({
          open: true,
          message: `Successfully exported ${role} individual report`,
          severity: 'success'
        });
      } else {
        // Original functionality for overall reports
      const response = await axios.get(
        `http://localhost:8080/api/reports/download?role=${role}&type=${type}`,
        {
          headers: { 'x-access-token': token },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${role}_${type}_report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: 'Report downloaded successfully',
        severity: 'success'
      });
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      setSnackbar({
        open: true,
        message: 'Error downloading report',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Render star rating component
  const renderStarRating = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {[...Array(fullStars)].map((_, i) => (
          <StarIcon key={`full-${i}`} sx={{ color: '#FFC107' }} />
        ))}
        {hasHalfStar && <StarHalfIcon sx={{ color: '#FFC107' }} />}
        {[...Array(emptyStars)].map((_, i) => (
          <StarBorderIcon key={`empty-${i}`} sx={{ color: '#FFC107' }} />
        ))}
        <Typography variant="body2" sx={{ ml: 1 }}>({rating.toFixed(1)})</Typography>
            </Box>
    );
  };

  // Function to render a pie chart for rating distribution
  const renderRatingPieChart = (ratingDistribution = {}, totalResponses = 0, size = 180) => {
    if (!totalResponses) return null;
    
    const pieData = Object.entries(ratingDistribution).map(([rating, count]) => ({
      rating: parseInt(rating),
      count,
      percentage: (count / totalResponses) * 100
    })).filter(item => item.count > 0);
    
    // Sort by rating in descending order
    pieData.sort((a, b) => b.rating - a.rating);
    
    // Calculate stroke dasharray and offset for each segment
    let cumulativePercentage = 0;
    const circumference = 2 * Math.PI * 70; // Radius is 70
    
    pieData.forEach(item => {
      item.dashArray = (item.percentage / 100) * circumference;
      item.dashOffset = ((100 - cumulativePercentage) / 100) * circumference;
      cumulativePercentage += item.percentage;
    });
    
    return (
      <Box sx={{ position: 'relative', width: size, height: size, mx: 'auto' }}>
        {/* Background circle */}
        <Box 
          component="svg" 
          viewBox="0 0 180 180" 
          sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
        >
          <circle 
            cx="90" 
            cy="90" 
            r="70" 
            fill="none" 
            stroke="#f0f0f0" 
            strokeWidth="20" 
          />
                </Box>
        
        {/* Pie segments */}
        <Box 
          component="svg" 
          viewBox="0 0 180 180" 
          sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
        >
          {pieData.map((item, index) => (
            <circle 
              key={`pie-${item.rating}`}
              cx="90" 
              cy="90" 
              r="70" 
              fill="none" 
              stroke={ratingColors[item.rating]} 
              strokeWidth="20" 
              strokeDasharray={`${item.dashArray} ${circumference}`}
              strokeDashoffset={item.dashOffset}
              style={{ transition: 'all 0.5s ease-in-out' }}
            />
              ))}
            </Box>
            
        {/* Center text */}
            <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
              width: '100%', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {totalResponses}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Responses
          </Typography>
        </Box>
        
        {/* Legend */}
        <Box sx={{ 
          position: 'absolute', 
          top: '100%', 
          left: 0, 
          width: '100%', 
          mt: 2,
          display: 'flex', 
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 1
        }}>
          {pieData.map(item => (
            <Box key={`legend-${item.rating}`} sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
              <Box sx={{ 
                width: 12, 
                height: 12, 
                bgcolor: ratingColors[item.rating], 
                mr: 0.5, 
                borderRadius: '50%' 
              }} />
              <Typography variant="caption">
                {item.rating}★: {item.count} ({item.percentage.toFixed(1)}%)
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };
  
  // Function to render a horizontal stacked bar chart for department comparison
  const renderDepartmentStackedBarChart = () => {
    const departmentsWithData = feedbackStats.departmentStats?.filter(dept => dept.responses > 0) || [];
    
    if (departmentsWithData.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">No department data available</Typography>
        </Box>
      );
    }
    
    // Sort departments by average rating
    const sortedDepartments = [...departmentsWithData].sort((a, b) => 
      parseFloat(b.averageRating) - parseFloat(a.averageRating)
    );
    
    return (
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Department Rating Distribution
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          {sortedDepartments.map(dept => {
            // Calculate percentages for each rating
            const totalResponses = dept.responses;
            const distribution = dept.ratingDistribution || {};
            
            // Create array of rating segments
            const ratingSegments = [5, 4, 3, 2, 1].map(rating => {
              const count = distribution[rating] || 0;
              const percentage = totalResponses > 0 ? (count / totalResponses) * 100 : 0;
              return { rating, count, percentage };
            }).filter(segment => segment.count > 0);
            
            return (
              <Box key={dept.departmentId} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Typography sx={{ minWidth: 150, mr: 2 }} noWrap>
                    {dept.departmentName}
                  </Typography>
                  <Typography variant="body2" sx={{ mr: 2, color: theme.palette.text.secondary }}>
                    {parseFloat(dept.averageRating).toFixed(1)}★
                  </Typography>
                  <Box sx={{ display: 'flex', flexGrow: 1, height: 30, borderRadius: 1, overflow: 'hidden' }}>
                    {ratingSegments.map(segment => (
                      <Tooltip 
                        key={`segment-${dept.departmentId}-${segment.rating}`}
                        title={`${segment.rating}★: ${segment.count} (${segment.percentage.toFixed(1)}%)`}
                      >
                        <Box 
                          sx={{ 
                            width: `${segment.percentage}%`, 
                            bgcolor: ratingColors[segment.rating],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s',
                            '&:hover': {
                              opacity: 0.8,
                              transform: 'scaleY(1.1)'
                            }
                          }} 
                        >
                          {segment.percentage > 10 && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: '#fff',
                                textShadow: '0px 1px 2px rgba(0,0,0,0.5)',
                                fontWeight: 'bold' 
                              }}
                            >
                              {segment.percentage > 20 ? `${segment.rating}★` : ''}
                            </Typography>
                          )}
                        </Box>
                      </Tooltip>
                    ))}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', ml: 'auto', width: 'calc(100% - 190px)' }}>
                  <Typography variant="caption" sx={{ width: '100%', textAlign: 'left' }}>
                    0%
                  </Typography>
                  <Typography variant="caption" sx={{ width: '100%', textAlign: 'right' }}>
                    100%
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
        
        {/* Legend */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, mt: 2 }}>
          {[5, 4, 3, 2, 1].map(rating => (
            <Box key={`legend-${rating}`} sx={{ display: 'flex', alignItems: 'center', mx: 1 }}>
              <Box sx={{ 
                width: 12, 
                height: 12, 
                bgcolor: ratingColors[rating], 
                mr: 0.5, 
                borderRadius: 1 
              }} />
              <Typography variant="caption">
                {rating}★
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  // Function to render radial progress charts for department metrics
  const renderRadialProgress = (value, maxValue, color, size = 80, thickness = 8) => {
    const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
    const circumference = 2 * Math.PI * ((size - thickness) / 2);
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference * (1 - percentage / 100);
    
    return (
      <Box sx={{ position: 'relative', width: size, height: size, mx: 'auto' }}>
        {/* Background circle */}
        <Box 
          component="svg" 
          viewBox={`0 0 ${size} ${size}`}
          sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
        >
          <circle 
            cx={size / 2} 
            cy={size / 2} 
            r={(size - thickness) / 2} 
            fill="none" 
            stroke="#f0f0f0" 
            strokeWidth={thickness} 
          />
        </Box>
        
        {/* Progress circle */}
        <Box 
          component="svg" 
          viewBox={`0 0 ${size} ${size}`}
          sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
        >
          <circle 
            cx={size / 2} 
            cy={size / 2} 
            r={(size - thickness) / 2} 
            fill="none" 
            stroke={color} 
            strokeWidth={thickness} 
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
        </Box>
        
        {/* Content */}
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Typography 
            variant={size > 70 ? "h6" : "body1"} 
            component="div" 
            sx={{ fontWeight: 'bold' }}
          >
            {value}
          </Typography>
        </Box>
      </Box>
    );
  };

  // Function to render a comprehensive dashboard card for department
  const renderDepartmentDashboardCard = (dept) => {
    if (!dept) return null;
    
    const averageRating = parseFloat(dept.averageRating) || 0;
    const ratingColor = 
      averageRating >= 4.5 ? ratingColors[5] : 
      averageRating >= 3.5 ? ratingColors[4] : 
      averageRating >= 2.5 ? ratingColors[3] : 
      averageRating >= 1.5 ? ratingColors[2] : 
      ratingColors[1];
    
    return (
      <Card sx={{ mb: 2, borderRadius: 2, boxShadow: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom noWrap sx={{ fontWeight: 'bold' }}>
                {dept.departmentName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ mr: 1 }}>Average Rating:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {renderStarRating(averageRating)}
                </Box>
              </Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Total Responses: <strong>{dept.responses}</strong>
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {Object.entries(dept.ratingDistribution || {}).map(([rating, count]) => (
                  count > 0 && (
                    <Chip 
                      key={`chip-${dept.departmentId}-${rating}`}
                      label={`${rating}★: ${count}`}
                      size="small"
                      sx={{ 
                        bgcolor: `${ratingColors[rating]}20`, 
                        color: ratingColors[rating],
                        fontWeight: 'bold',
                        border: `1px solid ${ratingColors[rating]}`
                      }}
                    />
                  )
                ))}
              </Box>
          </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {dept.responses > 0 ? (
                <Box sx={{ position: 'relative', height: 120, width: 120 }}>
                  {renderRadialProgress(
                    parseFloat(dept.averageRating).toFixed(1), 
                    5, 
                    ratingColor, 
                    120, 
                    12
                  )}
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      position: 'absolute', 
                      bottom: -20, 
                      left: 0, 
                      width: '100%', 
                      textAlign: 'center',
                      color: 'text.secondary'
                    }}
                  >
                    out of 5 stars
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No data available
                </Typography>
              )}
        </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // Enhance feedback overview with pie chart
  const renderFeedbackOverview = () => (
    <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Feedback Overview</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, bgcolor: '#f5f5f7' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1A2137' }}>Total Responses</Typography>
            {/* Replace CircularProgress with rendered pie chart for rating distribution */}
            {renderRatingPieChart(feedbackStats.overallRatingDistribution, feedbackStats.totalResponses)}
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 3, bgcolor: '#f5f5f7' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1A2137' }}>Overall Rating</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Replace simple text with radial progress */}
              {renderRadialProgress(
                parseFloat(feedbackStats.overallAverageRating).toFixed(1), 
                5, 
                parseFloat(feedbackStats.overallAverageRating) >= 4 ? '#4CAF50' : 
                parseFloat(feedbackStats.overallAverageRating) >= 3 ? '#FFC107' : '#F44336',
                150,
                15
              )}
              <Box sx={{ mt: 2 }}>
                {renderStarRating(parseFloat(feedbackStats.overallAverageRating))}
      </Box>
    </Box>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', p: 3, bgcolor: '#f5f5f7' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1A2137', textAlign: 'center' }}>Rating Distribution</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {Object.entries(feedbackStats.overallRatingDistribution || {}).map(([rating, count]) => (
                <Box key={rating} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ width: 30 }}>{rating}★</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(count / feedbackStats.totalResponses || 0) * 100}
                    sx={{ 
                      flexGrow: 1, 
                      mx: 1, 
                      height: 10, 
                      borderRadius: 5,
                      bgcolor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: rating === '5' ? ratingColors[5] : 
                                rating === '4' ? ratingColors[4] : 
                                rating === '3' ? ratingColors[3] : 
                                rating === '2' ? ratingColors[2] : ratingColors[1]
                      }
                    }} 
                  />
                  <Typography>{count}</Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );

  // Replace the department comparison with enhanced cards
  const renderDepartmentComparison = () => (
    <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" sx={{ mb: 4, fontWeight: 'bold' }}>Department Performance</Typography>
      
      {/* Enhanced visualization with stacked bar charts */}
      {renderDepartmentStackedBarChart()}
      
      <Divider sx={{ my: 4 }} />
      
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>Department Details</Typography>
      
      <Grid container spacing={3}>
        {feedbackStats.departmentStats?.map((dept) => (
          <Grid item xs={12} md={6} key={dept.departmentId}>
            {renderDepartmentDashboardCard(dept)}
          </Grid>
        ))}
      </Grid>
    </Paper>
  );

  // Enhance the department bar chart for better visualization
  const renderDepartmentBarChart = () => {
    // Filter out departments with no responses
    const departmentsWithData = feedbackStats.departmentStats?.filter(dept => dept.responses > 0) || [];
    
    return (
      <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" sx={{ mb: 4, fontWeight: 'bold' }}>Department Rating Comparison</Typography>
        
        {departmentsWithData.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">No department data available</Typography>
          </Box>
        ) : (
          <Box sx={{ height: 400, position: 'relative' }}>
          {/* Y-axis labels */}
            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 40, width: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', pr: 1 }}>
              <Typography variant="body2">5.0</Typography>
              <Typography variant="body2">4.0</Typography>
              <Typography variant="body2">3.0</Typography>
              <Typography variant="body2">2.0</Typography>
              <Typography variant="body2">1.0</Typography>
              <Typography variant="body2">0</Typography>
            </Box>
            
            {/* Horizontal grid lines */}
            <Box sx={{ position: 'absolute', left: 40, right: 0, top: 0, bottom: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {[0, 1, 2, 3, 4, 5].map((value) => (
                <Box key={value} sx={{ borderBottom: '1px dashed #e0e0e0', height: 1 }} />
              ))}
            </Box>
            
            {/* Bars */}
            <Box sx={{ position: 'absolute', left: 40, right: 0, top: 0, bottom: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', pt: 2 }}>
              {departmentsWithData.map((dept) => {
                const rating = parseFloat(dept.averageRating);
                const ratingColor = 
                  rating >= 4.5 ? ratingColors[5] : 
                  rating >= 3.5 ? ratingColors[4] : 
                  rating >= 2.5 ? ratingColors[3] : 
                  rating >= 1.5 ? ratingColors[2] : 
                  ratingColors[1];
                
                return (
                  <Box key={dept.departmentId} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: `${100 / departmentsWithData.length}%` }}>
                  <Box 
                    sx={{ 
                        width: '70%', 
                        height: `${(rating / 5) * 100}%`, 
                        bgcolor: ratingColor,
                        transition: 'height 0.5s ease-in-out, transform 0.2s ease-in-out',
                      borderTopLeftRadius: 4,
                      borderTopRightRadius: 4,
                        position: 'relative',
                        '&:hover': { 
                          opacity: 0.8,
                          transform: 'scaleX(1.1)'
                        },
                        minHeight: '5px',
                        // Add gradient overlay for 3D effect
                        backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.2), rgba(255,255,255,0), rgba(0,0,0,0.1))',
                        // Add box shadow for depth
                        boxShadow: '0 3px 5px rgba(0,0,0,0.1)'
                      }}
                    >
                      <Tooltip title={`${dept.departmentName}: ${rating.toFixed(2)}`}>
                        <Typography 
                          sx={{ 
                            position: 'absolute', 
                            top: -25,
                            left: 0,
                            right: 0,
                            textAlign: 'center',
                            fontWeight: 'bold',
                            fontSize: '0.8rem'
                          }}
                        >
                          {rating.toFixed(1)}
                        </Typography>
                      </Tooltip>
                    </Box>
                    
                    {/* Add small radial chart showing response count */}
                    <Box sx={{ mt: 2, position: 'relative', height: 30, width: 30 }}>
                      {renderRadialProgress(
                        dept.responses,
                        Math.max(...departmentsWithData.map(d => d.responses)),
                        ratingColor,
                        30,
                        4
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
            
            {/* X-axis labels */}
            <Box sx={{ position: 'absolute', left: 40, right: 0, bottom: 0, height: 40, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start' }}>
              {departmentsWithData.map((dept) => (
                <Typography 
                  key={dept.departmentId} 
                  variant="body2" 
                  sx={{ 
                    width: `${100 / departmentsWithData.length}%`, 
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    pt: 1,
                    px: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  <Tooltip title={`${dept.departmentName} (${dept.responses} responses)`}>
                    <span>{dept.departmentName}</span>
                  </Tooltip>
                </Typography>
              ))}
            </Box>
          </Box>
        )}
      </Paper>
    );
  };

  // Render recent feedback
  const renderRecentFeedback = () => (
    <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Recent Feedback</Typography>
      
      {feedbackData.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">No feedback data available</Typography>
        </Box>
      ) : (
        <Box>
          {feedbackData.slice(0, 5).map((feedback) => (
            <Paper 
              key={feedback.id} 
              elevation={1} 
              sx={{ 
                p: 2.5, 
                mb: 2, 
                borderLeft: `4px solid ${feedback.rating >= 4 ? '#4CAF50' : feedback.rating >= 3 ? '#FFC107' : '#F44336'}`,
                '&:hover': { boxShadow: 3 }
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                    Question: {feedback.question?.text || 'N/A'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    <Chip 
                      label={`${feedback.user?.department?.name || 'Unknown Department'}`} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                    {feedback.user?.year && (
                      <Chip 
                        label={`Year ${feedback.user.year}`}
                        size="small"
                        color="info"
                      />
                    )}
                </Box>
                  
                  {feedback.notes && (
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                      Comment: {feedback.notes}
                    </Typography>
                  )}
                </Grid>
                
                <Grid item xs={12} sm={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {renderStarRating(feedback.rating)}
                  </Box>
                  
                  <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
                    Submitted: {new Date(feedback.submittedAt).toLocaleDateString()} {new Date(feedback.submittedAt).toLocaleTimeString()}
                  </Typography>
                  
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    By: {feedback.user?.fullName || feedback.user?.username || 'Anonymous'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          ))}
          
          {feedbackData.length > 5 && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button 
                variant="outlined" 
                color="primary"
                onClick={() => {/* Could implement pagination or "View More" functionality */}}
              >
                View More Feedback
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );

  // Add function to fetch feedback for a specific question
  const fetchQuestionFeedback = async (questionId) => {
    if (!questionId) return;
    
    setQuestionFeedbackLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.get(`http://localhost:8080/api/feedback/question/${questionId}`, {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data) {
        console.log('Received question feedback:', response.data);
        setQuestionFeedback(response.data);
      } else {
        console.error('Invalid question feedback format:', response.data);
      }
    } catch (error) {
      console.error(`Error fetching feedback for question ${questionId}:`, error);
      setError(error.message);
      setSnackbar({
        open: true,
        message: `Failed to load feedback for question: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    } finally {
      setQuestionFeedbackLoading(false);
    }
  };

  // Fetch all questions for the dropdown
  const fetchAllQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.get('http://localhost:8080/api/questions', {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        console.log('Received all questions:', response.data);
        setAllQuestions(response.data);
      } else {
        console.error('Invalid questions data format:', response.data);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  // Add function to fetch feedback for a specific department
  const fetchDepartmentFeedback = async (departmentId) => {
    if (!departmentId) return;
    
    setDepartmentFeedbackLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.get(`http://localhost:8080/api/feedback/stats/department/${departmentId}`, {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data) {
        console.log('Received department feedback:', response.data);
        setDepartmentFeedback(response.data);
      } else {
        console.error('Invalid department feedback format:', response.data);
      }
    } catch (error) {
      console.error(`Error fetching feedback for department ${departmentId}:`, error);
      setError(error.message);
      setSnackbar({
        open: true,
        message: `Failed to load feedback for department: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    } finally {
      setDepartmentFeedbackLoading(false);
    }
  };

  // Add this function to render time-based trend analysis
  const renderFeedbackTrendAnalysis = () => {
    // Process real data from feedbackData to get trend data by month
    const trendData = [];
    
    if (!feedbackData || feedbackData.length === 0) {
      return (
        <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Feedback Trends Over Time</Typography>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">No feedback data available to generate trends</Typography>
          </Box>
        </Paper>
      );
    }
    
    // Process feedbackData to get trend data
    const monthData = {};
    
    // Group feedback by month
    feedbackData.forEach(feedback => {
      if (!feedback.submittedAt) return;
      
      const date = new Date(feedback.submittedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleString('default', { month: 'short' });
      
      if (!monthData[monthKey]) {
        monthData[monthKey] = {
          month: monthLabel,
          totalRating: 0,
          count: 0,
          monthKey: monthKey
        };
      }
      
      monthData[monthKey].totalRating += feedback.rating;
      monthData[monthKey].count += 1;
    });
    
    // Calculate averages and convert to array
    Object.values(monthData).forEach(data => {
      data.average = data.count > 0 ? data.totalRating / data.count : 0;
      trendData.push(data);
    });
    
    // Sort by month
    trendData.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    
    // Limit to last 6 months if we have more data
    const displayData = trendData.slice(-6);
    
    const maxResponses = Math.max(...displayData.map(item => item.count), 1);
    
    return (
      <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Feedback Trends Over Time</Typography>
        
        <Box sx={{ height: 350, position: 'relative', mt: 4 }}>
          {/* Y-axis labels for average rating */}
          <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 40, width: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', pr: 1 }}>
            <Typography variant="body2" color="primary">5.0</Typography>
            <Typography variant="body2" color="primary">4.0</Typography>
            <Typography variant="body2" color="primary">3.0</Typography>
            <Typography variant="body2" color="primary">2.0</Typography>
            <Typography variant="body2" color="primary">1.0</Typography>
            <Typography variant="body2" color="primary">0</Typography>
          </Box>
          
          {/* Y-axis labels for response count */}
          <Box sx={{ position: 'absolute', right: 0, top: 0, bottom: 40, width: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start', pl: 1 }}>
            <Typography variant="body2" color="secondary">{maxResponses}</Typography>
            <Typography variant="body2" color="secondary">{Math.round(maxResponses * 0.8)}</Typography>
            <Typography variant="body2" color="secondary">{Math.round(maxResponses * 0.6)}</Typography>
            <Typography variant="body2" color="secondary">{Math.round(maxResponses * 0.4)}</Typography>
            <Typography variant="body2" color="secondary">{Math.round(maxResponses * 0.2)}</Typography>
            <Typography variant="body2" color="secondary">0</Typography>
          </Box>
          
          {/* Horizontal grid lines */}
          <Box sx={{ position: 'absolute', left: 40, right: 40, top: 0, bottom: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {[0, 1, 2, 3, 4, 5].map((value) => (
              <Box key={value} sx={{ borderBottom: '1px dashed #e0e0e0', height: 1 }} />
            ))}
          </Box>
          
          {/* Line chart for average rating */}
          <Box sx={{ position: 'absolute', left: 40, right: 40, top: 0, bottom: 40, display: 'flex', alignItems: 'flex-end' }}>
            <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
              {displayData.length > 1 && (
                <>
                  {/* Line for average rating */}
                  <path
                    d={`M ${100 / displayData.length / 2}% ${100 - (displayData[0].average / 5) * 100}% ${displayData.map((item, index) => 
                      `L ${(index + 0.5) * (100 / displayData.length)}% ${100 - (item.average / 5) * 100}%`
                    ).join(' ')}`}
                    fill="none"
                    stroke="#1976d2"
                    strokeWidth="3"
                  />
                  
                  {/* Line for response count */}
                  <path
                    d={`M ${100 / displayData.length / 2}% ${100 - (displayData[0].count / maxResponses) * 100}% ${displayData.map((item, index) => 
                      `L ${(index + 0.5) * (100 / displayData.length)}% ${100 - (item.count / maxResponses) * 100}%`
                    ).join(' ')}`}
                    fill="none"
                    stroke="#9c27b0"
                    strokeWidth="3"
                    strokeDasharray="5,5"
                  />
                </>
              )}
              
              {/* Dots for average rating */}
              {displayData.map((item, index) => (
                <circle
                  key={`avg-${index}`}
                  cx={`${(index + 0.5) * (100 / displayData.length)}%`}
                  cy={`${100 - (item.average / 5) * 100}%`}
                  r="5"
                  fill="#1976d2"
                />
              ))}
              
              {/* Dots for response count */}
              {displayData.map((item, index) => (
                <circle
                  key={`resp-${index}`}
                  cx={`${(index + 0.5) * (100 / displayData.length)}%`}
                  cy={`${100 - (item.count / maxResponses) * 100}%`}
                  r="5"
                  fill="#9c27b0"
                />
              ))}
            </svg>
          </Box>
          
          {/* X-axis labels */}
          <Box sx={{ position: 'absolute', left: 40, right: 40, bottom: 0, height: 40, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start' }}>
            {displayData.map((item, index) => (
              <Typography key={index} variant="body2" sx={{ textAlign: 'center', pt: 1 }}>
                {item.month}
              </Typography>
            ))}
          </Box>
        </Box>
        
        {/* Legend */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 12, height: 12, bgcolor: '#1976d2', borderRadius: '50%', mr: 1 }} />
            <Typography variant="body2">Average Rating</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 12, height: 12, bgcolor: '#9c27b0', borderRadius: '50%', mr: 1 }} />
            <Typography variant="body2">Response Count</Typography>
          </Box>
        </Box>
      </Paper>
    );
  };

  // Add this function to render comparative analysis by user types
  const renderUserTypeComparison = () => {
    // Process real data from feedbackData to get user type statistics
    if (!feedbackData || feedbackData.length === 0) {
      return (
        <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>User Type Comparison</Typography>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">No feedback data available for user comparison</Typography>
          </Box>
        </Paper>
      );
    }
    
    // Initialize user type data
    const userTypeStats = {
      student: { type: 'Students', totalRating: 0, totalResponses: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
      staff: { type: 'Staff', totalRating: 0, totalResponses: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
      hod: { type: 'HOD', totalRating: 0, totalResponses: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
    };
    
    // Process feedback data to categorize by user type
    feedbackData.forEach(feedback => {
      const user = feedback.user;
      if (!user) return;
      
      // Determine user type based on username pattern
      let userType = 'other';
      
      // Students typically have E followed by numbers or ST prefix
      if (user.username?.match(/^E\d/) || user.username?.startsWith('ST')) {
        userType = 'student';
      } 
      // HODs typically have HOD in their username
      else if (user.username?.includes('HOD')) {
        userType = 'hod';
      }
      // Staff members typically have STAFF or don't match other patterns
      else {
        userType = 'staff';
      }
      
      // Only process the main user types we're tracking
      if (!userTypeStats[userType]) return;
      
      userTypeStats[userType].totalRating += feedback.rating;
      userTypeStats[userType].totalResponses += 1;
      userTypeStats[userType].distribution[feedback.rating] += 1;
    });
    
    // Calculate averages and convert to array
    const userTypeData = Object.values(userTypeStats).map(stats => ({
      ...stats,
      averageRating: stats.totalResponses > 0 ? stats.totalRating / stats.totalResponses : 0
    }));
    
    // Filter out user types with no responses
    const filteredUserTypeData = userTypeData.filter(data => data.totalResponses > 0);
    
    if (filteredUserTypeData.length === 0) {
      return (
        <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>User Type Comparison</Typography>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">No feedback data available for user comparison</Typography>
          </Box>
        </Paper>
      );
    }
    
    return (
      <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>User Type Comparison</Typography>
        
        <Grid container spacing={3}>
          {filteredUserTypeData.map((userData, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ bgcolor: '#f5f5f7', p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
                  {userData.type}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  {renderRadialProgress(
                    userData.averageRating,
                    5,
                    userData.averageRating >= 4 ? '#4CAF50' : 
                    userData.averageRating >= 3 ? '#FFC107' : '#F44336',
                    100,
                    12
                  )}
                </Box>
                
                <Typography variant="body1" sx={{ textAlign: 'center', mb: 1 }}>
                  <span style={{ fontWeight: 'bold' }}>{userData.totalResponses}</span> Responses
                </Typography>
                
                {/* Mini rating distribution */}
                <Box sx={{ display: 'flex', mt: 2, height: 30 }}>
                  {[5, 4, 3, 2, 1].map(rating => {
                    const count = userData.distribution[rating] || 0;
                    const percentage = (count / userData.totalResponses) * 100;
                    
                    return (
                      <Tooltip 
                        key={rating} 
                        title={`${rating}★: ${count} (${percentage.toFixed(1)}%)`}
                        placement="top"
                      >
                        <Box 
                          sx={{ 
                            flexGrow: percentage || 1,
                            bgcolor: ratingColors[rating],
                            height: '100%',
                            mr: rating > 1 ? 0.5 : 0,
                            borderRadius: 1,
                            minWidth: 1
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                </Box>
              </Card>
          </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  // Add this function to render feedback heatmap by department and question
  const renderFeedbackHeatmap = () => {
    // Use real departments and questions data
    if (!departments || departments.length === 0 || !allQuestions || allQuestions.length === 0 || !feedbackData || feedbackData.length === 0) {
      return (
        <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Feedback Heatmap</Typography>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">Insufficient data to generate heatmap</Typography>
      </Box>
        </Paper>
      );
    }
    
    // Get active departments
    const activeDepartments = departments.filter(dept => dept.active !== false).slice(0, 5);
    
    // Get the most common question categories
    const questionCategories = {};
    allQuestions.forEach(question => {
      // Create a simplified category from the question text (use first few words)
      const category = question.text.split(' ').slice(0, 2).join(' ');
      
      if (!questionCategories[category]) {
        questionCategories[category] = {
          category: category,
          questions: [],
          count: 0
        };
      }
      
      questionCategories[category].questions.push(question);
      questionCategories[category].count += 1;
    });
    
    // Sort categories by frequency and take top 5
    const topCategories = Object.values(questionCategories)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(cat => cat.category);
    
    // Prepare heatmap data structure
    const heatmapData = activeDepartments.map(dept => {
      // Filter feedback for this department
      const deptFeedback = feedbackData.filter(feedback => 
        feedback.user?.departmentId === dept.id || 
        feedback.question?.department?.id === dept.id
      );
      
      // Calculate ratings for each category
      const categoryRatings = topCategories.map(category => {
        // Find questions in this category
        const categoryQuestions = allQuestions.filter(q => 
          q.text.startsWith(category) || q.text.includes(category)
        ).map(q => q.id);
        
        // Filter feedback for these questions
        const categoryFeedback = deptFeedback.filter(feedback => 
          categoryQuestions.includes(feedback.questionId)
        );
        
        // Calculate average rating
        let totalRating = 0;
        let count = 0;
        
        categoryFeedback.forEach(feedback => {
          totalRating += feedback.rating;
          count += 1;
        });
        
        return {
          question: category,
          rating: count > 0 ? (totalRating / count) : 0
        };
      });
      
      return {
        department: dept.name,
        ratings: categoryRatings
      };
    });
    
    // Filter out departments with no ratings
    const filteredHeatmapData = heatmapData.filter(dept => 
      dept.ratings.some(r => r.rating > 0)
    );
    
    const getColorForRating = (rating) => {
      if (rating === 0) return '#f5f5f5'; // No data
      if (rating >= 4.5) return '#1b5e20'; // Dark green
      if (rating >= 4.0) return '#388e3c'; // Green
      if (rating >= 3.5) return '#7cb342'; // Light green
      if (rating >= 3.0) return '#fdd835'; // Yellow
      if (rating >= 2.5) return '#fb8c00'; // Orange
      return '#e53935'; // Red
    };
    
    if (filteredHeatmapData.length === 0) {
      return (
        <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Feedback Heatmap</Typography>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">Insufficient feedback data to generate heatmap</Typography>
    </Box>
        </Paper>
      );
    }
    
    return (
      <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Feedback Heatmap</Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Average rating by department and question category
        </Typography>
        
        <Box sx={{ overflowX: 'auto' }}>
          <Box sx={{ minWidth: 600, display: 'grid', gridTemplateColumns: `auto repeat(${topCategories.length}, 1fr)`, gap: 1 }}>
            {/* Header row with question names */}
            <Box sx={{ gridColumn: '1', p: 1 }}></Box>
            {topCategories.map((category, index) => (
              <Box 
                key={index} 
                sx={{ 
                  p: 1, 
                  textAlign: 'center', 
                  fontWeight: 'bold',
                  bgcolor: '#f5f5f7',
                  borderRadius: 1
                }}
              >
                {category}
              </Box>
            ))}
            
            {/* Data rows with department names and ratings */}
            {filteredHeatmapData.map((dept, deptIndex) => (
              <React.Fragment key={deptIndex}>
                <Box 
                  sx={{ 
                    p: 1, 
                    fontWeight: 'bold',
                    bgcolor: '#f5f5f7',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {dept.department}
                </Box>
                
                {dept.ratings.map((item, ratingIndex) => (
                  <Box 
                    key={ratingIndex} 
                    sx={{ 
                      p: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: getColorForRating(item.rating),
                      color: item.rating === 0 ? '#999' : 'white',
                      borderRadius: 1,
                      height: '100%',
                      fontWeight: 'bold',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        cursor: 'pointer'
                      }
                    }}
                  >
                    {item.rating > 0 ? item.rating.toFixed(1) : 'N/A'}
                  </Box>
                ))}
              </React.Fragment>
            ))}
          </Box>
        </Box>
        
        {/* Legend */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, flexWrap: 'wrap', gap: 2 }}>
          {[4.5, 4.0, 3.5, 3.0, 2.5, 2.0].map((rating, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                sx={{ 
                  width: 16, 
                  height: 16, 
                  bgcolor: getColorForRating(rating),
                  mr: 1,
                  borderRadius: '2px'
                }} 
              />
              <Typography variant="body2">
                {index === 0 ? `≥ ${rating}` : index === 5 ? `< ${rating}` : `${rating} - ${4.5 - index * 0.5}`}
              </Typography>
            </Box>
          ))}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                width: 16, 
                height: 16, 
                bgcolor: '#f5f5f5',
                mr: 1,
                borderRadius: '2px',
                border: '1px solid #ddd'
              }} 
            />
            <Typography variant="body2">No data</Typography>
          </Box>
        </Box>
      </Paper>
    );
  };

  // Update the renderAnalytics function to include the new visualization components
  const renderAnalytics = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Feedback Analysis Dashboard
      </Typography>
      
      {feedbackLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Department selector */}
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              Department Analysis
            </Typography>
            <FormControl fullWidth>
              <InputLabel id="department-select-label">Select Department</InputLabel>
              <Select
                labelId="department-select-label"
                id="department-select"
                value={selectedDepartmentForStats}
                onChange={(e) => setSelectedDepartmentForStats(e.target.value)}
                label="Select Department"
              >
                <MenuItem value="">
                  <em>Select a department</em>
                </MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
          
          {/* Overall feedback overview */}
          {renderFeedbackOverview()}
          
          {/* New time-based trend analysis */}
          {renderFeedbackTrendAnalysis()}
          
          {/* New user type comparison */}
          {renderUserTypeComparison()}
          
          {/* New feedback heatmap */}
          {renderFeedbackHeatmap()}
          
          {/* Department-specific feedback */}
          {renderDepartmentFeedback()}
          
          {/* Department comparisons */}
          {renderDepartmentComparison()}
          {renderDepartmentBarChart()}
          
          {/* Question selector */}
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              Question-Specific Analysis
            </Typography>
            <FormControl fullWidth>
              <InputLabel id="question-select-label">Select Question</InputLabel>
              <Select
                labelId="question-select-label"
                id="question-select"
                value={selectedQuestionId}
                onChange={(e) => setSelectedQuestionId(e.target.value)}
                label="Select Question"
              >
                <MenuItem value="">
                  <em>Select a question</em>
                </MenuItem>
                {allQuestions.map((question) => (
                  <MenuItem key={question.id} value={question.id}>
                    {question.text} {question.department?.name ? `(${question.department.name})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
          
          {/* Question-specific feedback */}
          <div id="question-feedback-section">
            {renderQuestionFeedback()}
          </div>
          
          {/* Recent feedback */}
          {renderRecentFeedback()}
        </>
      )}
    </Box>
  );

  // Render profile section
  const renderProfile = () => (
    <Paper sx={{ p: 4, borderRadius: 0 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 4 }}>Executive Director Profile</Typography>
      
      <Box sx={{ 
        display: 'flex',
        alignItems: 'flex-start',
        mb: 0
      }}>
        <Avatar sx={{ width: 76, height: 76, bgcolor: '#1A2137', mr: 4 }}>
          {userProfile.name ? userProfile.name.charAt(0) : 'E'}
        </Avatar>
        
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#666' }}>Name</Typography>
              <Typography variant="body1">{userProfile.fullName || userProfile.name || 'Not specified'}</Typography>
            </Box>
            
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#666' }}>Position</Typography>
              <Typography variant="body1">Executive Director</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6}>
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#666' }}>Email</Typography>
              <Typography variant="body1">{userProfile.email || 'Not specified'}</Typography>
            </Box>
            
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#666' }}>Department</Typography>
              <Typography variant="body1">{userProfile.department?.name || 'All Departments'}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );

  // Render dashboard overview
  const renderDashboard = () => (
    <Paper sx={{ p: 4, borderRadius: 0 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 4 }}>Dashboard Overview</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Card sx={{ borderRadius: 0, bgcolor: '#f8f9fa' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Total Meetings</Typography>
              <Typography variant="h4" sx={{ color: '#1A2137' }}>{meetings.length}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Across all departments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Card sx={{ borderRadius: 0, bgcolor: '#f8f9fa' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Total Departments</Typography>
              <Typography variant="h4" sx={{ color: '#1A2137' }}>{departments.length}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Active in the system
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
                <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => handleDownloadReport('student', 'overall')}
              sx={{ 
                bgcolor: '#1A2137', 
                '&:hover': { bgcolor: '#2A3147' },
                fontWeight: 'medium',
                px: 3,
                py: 1
              }}
            >
              Download Complete Report
                  </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );

  // Helper function to get department name from id
  const getDepartmentName = (departmentId) => {
    // If departmentId is an object, try to extract the name or id
    if (departmentId && typeof departmentId === 'object') {
      return departmentId.name || departmentId.id || 'Unknown Department';
    }
    
    // Handle string department IDs
    switch(String(departmentId)) {
      case '1':
        return 'Computer Science';
      case '2':
        return 'Information Technology';
      case '3':
        return 'Electronics and Communication';
      case '4':
        return 'Electrical Engineering';
      case '5':
        return 'Mechanical Engineering';
      default:
        return departmentId || 'Unknown Department';
    }
  };
  
  // Render meeting list with formatted data
  const renderMeetingCard = (meeting) => {
    const dateValue = meeting.date || meeting.meetingDate;
    const formattedDate = dateValue ? new Date(dateValue).toLocaleDateString() : '';
    // Map roleId to readable role name
    const roleDisplay = meeting.roleId 
      ? (meeting.roleId === 1 ? 'Student' : meeting.roleId === 2 ? 'Staff' : 'Not specified')
      : (meeting.role || 'Not specified');
    const timeDisplay = meeting.startTime && meeting.endTime
      ? `${meeting.startTime} - ${meeting.endTime}`
      : '';
    const departmentName = getDepartmentName(meeting.department || meeting.departmentId);
    const yearDisplay = (roleDisplay.toLowerCase().trim() === 'student' || meeting.roleId === 1) ? (meeting.year || '-') : '-';

    return (
      <Card key={meeting.id} sx={{ mb: 2, borderRadius: 1 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {meeting.title}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">
                <strong>Date:</strong> {formattedDate}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Time:</strong> {timeDisplay}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">
                <strong>Role:</strong> {roleDisplay}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Department:</strong> {departmentName}
              </Typography>
              {roleDisplay.toLowerCase().trim() === 'student' && (
                <Typography variant="body2" color="textSecondary">
                  <strong>Year:</strong> {yearDisplay}
                </Typography>
              )}
            </Grid>
                </Grid>
        </CardContent>
      </Card>
    );
  };

  // Render meetings section
  const renderMeetings = () => {
    // Filter out past meetings
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of day for date comparison

    const upcomingMeetings = meetings.filter(meeting => {
      const meetingDate = new Date(meeting.date || meeting.meetingDate);
      meetingDate.setHours(0, 0, 0, 0);
      return meetingDate >= now;
    });

    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          Upcoming Meetings
        </Typography>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && upcomingMeetings.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#f5f5f7' }}>
            <Typography>No upcoming meetings scheduled.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
                <Grid item xs={12}>
              {upcomingMeetings.map(meeting => renderMeetingCard(meeting))}
            </Grid>
                </Grid>
        )}
      </Box>
    );
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
      setSnackbar({
        open: true,
        message: 'Error loading HOD responses: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      });
      setHodResponses([]);
    } finally {
      setLoading(false);
    }
  };

  // Render Academic Director Questions - updated with better organization
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

    // Helper function to get department name correctly
    const getCorrectDepartmentName = (question) => {
      // If department is an object with name property
      if (question.department && typeof question.department === 'object' && question.department.name) {
        return question.department.name;
      }
      
      // If departmentId exists, use it with the helper function
      if (question.departmentId) {
        const dept = departments.find(d => d.id === parseInt(question.departmentId));
        return dept ? dept.name : getDepartmentName(question.departmentId);
      }
      
      // Fallback to string department or unknown
      return question.department || 'Unknown Department';
    };

    // Helper function to format date or return null if invalid
    const formatDateOrNull = (dateString) => {
      if (!dateString) return null;
      
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return null;
      
      return date.toLocaleDateString();
    };
    
    return (
      <Box sx={{ mb: 5 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3, color: '#1A2137', fontWeight: 'bold' }}>
          Today's MOM
        </Typography>
        
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
          {loading ? (
            <LinearProgress sx={{ my: 4 }} />
          ) : academicDirectorQuestions.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              No questions have been posted yet.
            </Alert>
          ) : (
            <Box>
              {/* Student Questions Section */}
              {studentQuestions.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ 
                    mb: 2, 
                    bgcolor: '#1976d2', 
                    color: 'white', 
                    p: 1.5, 
                    borderRadius: 1 
                  }}>
                    Discussion of Student
                  </Typography>
                  
                  {/* Group by year */}
                  {Object.keys(studentsByYear).sort().map(year => (
                    <Box key={year} sx={{ mb: 3 }}>
                      {year !== 'Unspecified' && (
                        <Typography variant="subtitle1" sx={{ 
                          mb: 1, 
                          fontWeight: 'bold',
                          borderBottom: '2px solid #1976d2',
                          pb: 0.5
                        }}>
                          Year {year}
                        </Typography>
                      )}
                      
                      {studentsByYear[year].map((question, index) => {
                        // Get department name correctly
                        const departmentName = getCorrectDepartmentName(question);
                        // Get formatted date or null if invalid
                        const formattedDate = formatDateOrNull(question.createdAt);
                          
                        return (
                          <Paper 
                            key={question.id} 
                            elevation={1} 
                            sx={{ 
                              p: 2, 
                              mb: 2, 
                              borderLeft: '4px solid #1976d2',
                              display: 'flex',
                              transition: 'all 0.2s',
                              '&:hover': {
                                boxShadow: 3,
                                bgcolor: '#f9f9f9'
                              }
                            }}
                          >
                            <Box 
                              sx={{ 
                                mr: 2, 
                                minWidth: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                bgcolor: '#1976d2',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold'
                              }}
                            >
                              {index + 1}
                            </Box>
                            
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                {question.text}
                              </Typography>
                              
                              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                <Chip 
                                  label={`Department: ${departmentName}`} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                />
                                <Chip 
                                  label="Student" 
                                  size="small" 
                                  color="secondary" 
                                />
                                {question.year && (
                                  <Chip 
                                    label={`Year: ${question.year}`} 
                                    size="small" 
                                    color="info" 
                                  />
                                )}
                                {formattedDate && (
                                  <Chip 
                                    label={`Posted: ${formattedDate}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ bgcolor: 'rgba(0,0,0,0.05)' }}
                                  />
                                )}
                              </Box>
                            </Box>
                          </Paper>
                        );
                      })}
                    </Box>
                  ))}
                </Box>
              )}
              
              {/* Staff Questions Section */}
              {staffQuestions.length > 0 && (
                <Box>
                  <Typography variant="h6" sx={{ 
                    mb: 2, 
                    bgcolor: '#9c27b0', 
                    color: 'white', 
                    p: 1.5, 
                    borderRadius: 1 
                  }}>
                    Discussion of staff
                  </Typography>
                  
                  {staffQuestions.map((question, index) => {
                    // Get department name correctly
                    const departmentName = getCorrectDepartmentName(question);
                    // Get formatted date or null if invalid
                    const formattedDate = formatDateOrNull(question.createdAt);
                      
                    return (
                      <Paper 
                        key={question.id} 
                        elevation={1} 
                        sx={{ 
                          p: 2, 
                          mb: 2, 
                          borderLeft: '4px solid #9c27b0',
                          display: 'flex',
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: 3,
                            bgcolor: '#f9f9f9'
                          }
                        }}
                      >
                        <Box 
                          sx={{ 
                            mr: 2, 
                            minWidth: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            bgcolor: '#9c27b0',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold'
                          }}
                        >
                          {index + 1}
                        </Box>
                        
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            {question.text}
                          </Typography>
                          
                          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            <Chip 
                              label={`Department: ${departmentName}`} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                            <Chip 
                              label="Staff" 
                              size="small" 
                              color="secondary" 
                            />
                            {formattedDate && (
                              <Chip 
                                label={`Posted: ${formattedDate}`}
                                size="small"
                                variant="outlined"
                                sx={{ bgcolor: 'rgba(0,0,0,0.05)' }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
              )}
              
              {/* Show message if no questions found for either category */}
              {studentQuestions.length === 0 && staffQuestions.length === 0 && (
                <Alert severity="info">
                  No questions have been posted for either students or staff.
                </Alert>
              )}
            </Box>
          )}
        </Paper>
      </Box>
    );
  };

  // Render Minutes of Meetings section
  const renderMinutesOfMeetings = () => {
    // Get the name of the selected department for display
    const selectedDeptName = selectedDepartment ? 
      departments.find(d => d.id === parseInt(selectedDepartment))?.name || 'Unknown Department' : 
      '';
      
    // Handle department selection without page refresh
    const handleDepartmentChange = (event) => {
      event.preventDefault(); // Prevent default form behavior
      const deptId = event.target.value;
      
      // Update local state immediately for responsive UI
      setSelectedDepartment(deptId);
      
      // Then trigger API call to get responses
      if (deptId) {
        fetchHodResponsesForDepartment(deptId);
      } else {
        setHodResponses([]);
      }
    };
      
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3, color: '#1A2137' }}>
          Minutes of Meetings - HOD Responses
        </Typography>
        
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="department-select-label">Select Department</InputLabel>
            <Select
              labelId="department-select-label"
              id="department-select"
              value={selectedDepartment}
              onChange={handleDepartmentChange}
              label="Select Department"
              displayEmpty
              renderValue={(selected) => {
                if (!selected) {
                  return <em>Select Department</em>;
                }
                
                const dept = departments.find(d => d.id === parseInt(selected));
                return dept ? dept.name : 'Select Department';
              }}
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
            <LinearProgress sx={{ my: 4 }} />
          ) : !selectedDepartment ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Please select a department to view HOD responses.
            </Alert>
          ) : hodResponses.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              No responses found for {selectedDeptName}.
            </Alert>
          ) : (
            <Box>
              {hodResponses.map((question) => {
                // Check if this question has an HOD response
                if (!question.hodResponse) return null;
                
                // Get department name
                const departmentName = selectedDeptName;
                
                return (
                  <Paper 
                    key={question.id} 
                    elevation={2} 
                    sx={{ 
                      p: 3, 
                      mb: 3, 
                      borderLeft: '4px solid #1976d2',
                      transition: 'all 0.3s',
                      '&:hover': { boxShadow: 6 }
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 1, color: '#1976d2' }}>
                      {question.text}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Chip 
                        label={`Department: ${departmentName}`} 
                        size="small" 
                        color="primary" 
                        sx={{ mr: 1, mb: 1 }} 
                      />
                      <Chip 
                        label={`Role: ${question.role}`} 
                        size="small" 
                        color="secondary" 
                        sx={{ mr: 1, mb: 1 }} 
                      />
                      {question.year && (
                        <Chip 
                          label={`Year: ${question.year}`} 
                          size="small" 
                          color="info" 
                          sx={{ mr: 1, mb: 1 }} 
                        />
                      )}
                    </Box>
                    
                    <Box sx={{ 
                      bgcolor: '#f5f5f5', 
                      p: 2, 
                      borderRadius: 1,
                      border: '1px solid #e0e0e0'
                    }}>
                      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Action Taken from HOD of {departmentName}:
                      </Typography>
                      <Typography variant="body1">
                        {question.hodResponse.response || 'No response provided'}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                        {question.hodResponse.createdAt ? 
                          `Submitted on: ${new Date(question.hodResponse.createdAt).toLocaleString()}` : 
                          ''}
                      </Typography>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Paper>
      </Box>
    );
  };

  // Update the export function to only use the documented APIs from README.md
  const handleExportToExcel = async (reportType) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      let url = '';
      let filename = '';
      
      switch (reportType) {
        case 'feedback-all':
          url = 'http://localhost:8080/api/feedback/excel/all';
          filename = 'all_feedback_data.xlsx';
          break;
          
        case 'department-stats':
          // Ask user to select a department first
          if (!selectedDepartmentForStats) {
            setSnackbar({
              open: true,
              message: "Please select a department in the Analytics section first",
              severity: 'warning'
            });
            setLoading(false);
            return;
          }
          
          url = `http://localhost:8080/api/feedback/excel/department/${selectedDepartmentForStats}`;
          filename = `department_${selectedDepartmentForStats}_feedback_stats.xlsx`;
          break;
          
        case 'overall-stats':
          url = 'http://localhost:8080/api/feedback/excel/overall';
          filename = 'overall_feedback_stats.xlsx';
          break;
          
        default:
          throw new Error('Invalid report type');
      }
      
      // Execute the API request with proper headers for file download
      const response = await axios({
        url: url,
        method: 'GET',
        responseType: 'blob',
        headers: { 'x-access-token': token }
      });
      
      // Create a download link
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      setSnackbar({
        open: true,
        message: `Successfully exported ${filename}`,
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Export failed:', error);
      setSnackbar({
        open: true,
        message: `Failed to export: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Update the reports section to include Excel export options
  const renderReports = () => {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
          Reports
        </Typography>
        
        <Grid container spacing={4}>
          {/* Analytics Data Export Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3, color: '#1A2137' }}>
                Export Analytics Data (Excel)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Export feedback data and statistics from the Analytics section to Excel files for further analysis.
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ p: 2, bgcolor: '#f8f9fa', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                        All Feedback
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Export all raw feedback responses with user information to Excel
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleExportToExcel('feedback-all')}
                        fullWidth
                        sx={{ 
                          bgcolor: '#4CAF50', 
                          '&:hover': { bgcolor: '#388E3C' }
                        }}
                      >
                        Export All Feedback
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ p: 2, bgcolor: '#f8f9fa', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Department Stats
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Export department-by-department performance statistics to Excel
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleExportToExcel('department-stats')}
                        fullWidth
                        sx={{ 
                          bgcolor: '#2196F3', 
                          '&:hover': { bgcolor: '#1565C0' }
                        }}
                      >
                        Export Department Stats
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ p: 2, bgcolor: '#f8f9fa', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Overall Summary
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Export overall feedback statistics and trends to Excel
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleExportToExcel('overall-stats')}
                        fullWidth
                        sx={{ 
                          bgcolor: '#9C27B0', 
                          '&:hover': { bgcolor: '#7B1FA2' }
                        }}
                      >
                        Export Summary Stats
                      </Button>
                    </CardContent>
                  </Card>
              </Grid>
              </Grid>

              <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f7', borderRadius: 1, borderLeft: '4px solid #1976d2' }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Note:</strong> These reports are generated in Excel format for easy analysis and can be opened in Microsoft Excel, Google Sheets, or any compatible spreadsheet software.
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Individual Reports Section (Excel) */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3, color: '#1A2137' }}>
                Individual Excel Reports
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Generate detailed individual reports by role type in Excel format.
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ p: 2, bgcolor: '#f8f9fa', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Student Reports
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Individual student feedback organized by department
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadReport('student', 'individual')}
                        fullWidth
                        sx={{ 
                          bgcolor: '#FF9800', 
                          '&:hover': { bgcolor: '#F57C00' }
                        }}
                      >
                        Export Student Reports
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ p: 2, bgcolor: '#f8f9fa', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Staff Reports
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Individual staff feedback organized by department
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadReport('staff', 'individual')}
                        fullWidth
                        sx={{ 
                          bgcolor: '#607D8B', 
                          '&:hover': { bgcolor: '#455A64' }
                        }}
                      >
                        Export Staff Reports
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ p: 2, bgcolor: '#f8f9fa', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                        HOD Reports
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Individual HOD feedback organized by department
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadReport('hod', 'individual')}
                        fullWidth
                        sx={{ 
                          bgcolor: '#795548', 
                          '&:hover': { bgcolor: '#5D4037' }
                        }}
                      >
                        Export HOD Reports
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ p: 2, bgcolor: '#f8f9fa', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Academic Director Reports
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Individual Academic Director feedback
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadReport('academic_director', 'individual')}
                        fullWidth
                        sx={{ 
                          bgcolor: '#009688', 
                          '&:hover': { bgcolor: '#00796B' }
                        }}
                      >
                        Export Director Reports
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // New component to render the question-specific feedback
  const renderQuestionFeedback = () => {
    if (!selectedQuestionId) {
      return (
        <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Question-Specific Feedback</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            Select a question from the dropdown above to view its feedback details.
          </Typography>
        </Paper>
      );
    }

    const selectedQuestion = allQuestions.find(q => q.id === parseInt(selectedQuestionId));
    const questionText = selectedQuestion ? selectedQuestion.text : `Question ${selectedQuestionId}`;

    return (
      <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Feedback for Question</Typography>
        
        <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f7', borderRadius: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {questionText}
          </Typography>
          {selectedQuestion && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              <Chip 
                label={selectedQuestion.department?.name || 'Unknown Department'} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
              {selectedQuestion.year && (
                <Chip 
                  label={`Year ${selectedQuestion.year}`} 
                  size="small" 
                  color="secondary"
                />
              )}
              <Chip 
                label={selectedQuestion.role || 'Not specified'} 
                size="small" 
                color="info"
              />
            </Box>
          )}
        </Box>
        
        {questionFeedbackLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
            <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Total Responses
              </Typography>
                    <Typography variant="h3" sx={{ color: '#1976d2' }}>
                      {questionFeedback.totalResponses}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Average Rating
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      {renderStarRating(parseFloat(questionFeedback.averageRating) || 0)}
                    </Box>
                  </CardContent>
                </Card>
        </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', p: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}>
                      Rating Distribution
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {Object.entries(questionFeedback.ratingDistribution || {}).map(([rating, count]) => (
                        <Box key={rating} sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography sx={{ width: 30 }}>{rating}★</Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={(count / questionFeedback.totalResponses || 0) * 100}
                            sx={{ 
                              flexGrow: 1, 
                              mx: 1, 
                              height: 8, 
                              borderRadius: 5,
                              bgcolor: '#e0e0e0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: rating === '5' ? '#4CAF50' : 
                                        rating === '4' ? '#8BC34A' : 
                                        rating === '3' ? '#FFC107' : 
                                        rating === '2' ? '#FF9800' : '#F44336'
                              }
                            }} 
                          />
                          <Typography>{count}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
          </Grid>
        
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Individual Responses
            </Typography>
            
            {questionFeedback.feedback && questionFeedback.feedback.length > 0 ? (
              <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f7' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Rating</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Notes</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Submitted At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {questionFeedback.feedback.map((response) => (
                      <TableRow key={response.id} sx={{ '&:hover': { bgcolor: '#f5f5f7' } }}>
                        <TableCell>
                          {response.user?.fullName || response.user?.username || 'Anonymous'}
                          {response.user?.year && <Typography variant="caption" sx={{ ml: 1 }}>(Year {response.user.year})</Typography>}
                        </TableCell>
                        <TableCell>{response.user?.department?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex' }}>
                            {[...Array(response.rating)].map((_, i) => (
                              <StarIcon key={i} sx={{ color: '#FFC107', fontSize: '1.1rem' }} />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>{response.notes || 'No comments'}</TableCell>
                        <TableCell>{new Date(response.submittedAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3, bgcolor: '#f5f5f7', borderRadius: 1 }}>
                <Typography variant="body1" color="text.secondary">
                  No individual responses available for this question.
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>
    );
  };

  // New component to render the department-specific feedback
  const renderDepartmentFeedback = () => {
    if (!selectedDepartmentForStats) {
      return (
        <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Department-Specific Feedback</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            Select a department from the dropdown above to view its feedback details.
          </Typography>
        </Paper>
      );
    }

    const selectedDept = departments.find(d => d.id === parseInt(selectedDepartmentForStats));
    const departmentName = selectedDept ? selectedDept.name : `Department ${selectedDepartmentForStats}`;

    return (
      <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Feedback for {departmentName}
        </Typography>
        
        {departmentFeedbackLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
            <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Total Responses
              </Typography>
                    <Typography variant="h3" sx={{ color: '#1976d2' }}>
                      {departmentFeedback.totalResponses}
              </Typography>
            </CardContent>
          </Card>
          </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Average Rating
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      {renderStarRating(parseFloat(departmentFeedback.averageRating) || 0)}
                    </Box>
                  </CardContent>
                </Card>
        </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', p: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}>
                      Rating Distribution
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {Object.entries(departmentFeedback.ratingDistribution || {}).map(([rating, count]) => (
                        <Box key={rating} sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography sx={{ width: 30 }}>{rating}★</Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={(count / departmentFeedback.totalResponses || 0) * 100}
                            sx={{ 
                              flexGrow: 1, 
                              mx: 1, 
                              height: 8, 
                              borderRadius: 5,
                              bgcolor: '#e0e0e0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: rating === '5' ? '#4CAF50' : 
                                        rating === '4' ? '#8BC34A' : 
                                        rating === '3' ? '#FFC107' : 
                                        rating === '2' ? '#FF9800' : '#F44336'
                              }
                            }} 
                          />
                          <Typography>{count}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
      </Grid>
            </Grid>
            
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Question Performance
            </Typography>
            
            {departmentFeedback.questionStats && departmentFeedback.questionStats.length > 0 ? (
              <>
                <TableContainer component={Paper} sx={{ boxShadow: 1, mb: 4 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f5f7' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Question</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Responses</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Average Rating</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {departmentFeedback.questionStats.map((question) => (
                        <TableRow key={question.questionId} sx={{ '&:hover': { bgcolor: '#f5f5f7' } }}>
                          <TableCell>{question.questionText}</TableCell>
                          <TableCell>{question.responses}</TableCell>
                          <TableCell>
                            {question.responses > 0 ? (
                              renderStarRating(parseFloat(question.averageRating) || 0)
                            ) : (
                              <Typography variant="body2" color="text.secondary">No data</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              startIcon={<VisibilityIcon />}
                              disabled={question.responses === 0}
                              onClick={() => {
                                setSelectedQuestionId(question.questionId.toString());
                                // Scroll to question feedback section
                                document.getElementById('question-feedback-section')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {/* Visualization of question performance */}
                <Box sx={{ height: 300, position: 'relative', mt: 4 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Question Rating Comparison
                  </Typography>
                  
                  {/* Questions with responses */}
                  {departmentFeedback.questionStats.filter(q => q.responses > 0).length > 0 ? (
                    <Box sx={{ height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around' }}>
                      {departmentFeedback.questionStats
                        .filter(q => q.responses > 0)
                        .map((question) => (
                          <Box key={question.questionId} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 120 }}>
                            <Tooltip title={question.questionText}>
                              <Box 
                                sx={{ 
                                  width: '70%', 
                                  height: `${(parseFloat(question.averageRating) / 5) * 200}px`, 
                                  bgcolor: question.averageRating >= 4.5 ? '#4CAF50' : 
                                          question.averageRating >= 3.5 ? '#8BC34A' : 
                                          question.averageRating >= 2.5 ? '#FFC107' : 
                                          question.averageRating >= 1.5 ? '#FF9800' : '#F44336',
                                  borderTopLeftRadius: 4,
                                  borderTopRightRadius: 4,
                                  position: 'relative',
                                  '&:hover': { opacity: 0.8, cursor: 'pointer' },
                                  transition: 'all 0.3s',
                                  minHeight: '10px'
                                }}
                                onClick={() => {
                                  setSelectedQuestionId(question.questionId.toString());
                                  document.getElementById('question-feedback-section')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                              >
                                <Typography 
                                  sx={{ 
                                    position: 'absolute', 
                                    top: -25, 
                                    left: 0, 
                                    right: 0, 
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  {parseFloat(question.averageRating).toFixed(1)}
                                </Typography>
                              </Box>
                            </Tooltip>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                mt: 1, 
                                maxWidth: '100%', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                textAlign: 'center'
                              }}
                            >
                              Q{question.questionId}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ fontSize: '0.7rem' }}
                            >
                              ({question.responses} resp.)
                            </Typography>
                          </Box>
                        ))}
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', bgcolor: '#f5f5f7', borderRadius: 1 }}>
                      <Typography variant="body1" color="text.secondary">
                        No question response data available
                      </Typography>
                    </Box>
                  )}
                </Box>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3, bgcolor: '#f5f5f7', borderRadius: 1 }}>
                <Typography variant="body1" color="text.secondary">
                  No question statistics available for this department.
                </Typography>
              </Box>
            )}
          </>
        )}
    </Paper>
  );
  };

  // Sidebar component
  const Sidebar = () => (
    <Box 
      sx={{
        width: 240,
        bgcolor: '#1A2137', // Dark navy blue
        color: 'white',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1
      }}
    >
      <Box sx={{ p: 3, pb: 2, bgcolor: '#2A3147' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FFFFFF' }}>
          Executive Director
        </Typography>
      </Box>
      
      <List sx={{ p: 0 }}>
        {tabs.map(tab => (
          <ListItem
            key={tab.id}
            button 
            onClick={() => setActiveSection(tab.id)}
            sx={{
              py: 2, 
              pl: 3,
              bgcolor: activeSection === tab.id ? '#2A3147' : 'transparent',
              '&:hover': { bgcolor: '#2A3147' }
            }}
          >
            <ListItemIcon sx={{ color: '#FFFFFF', minWidth: 30 }}>
              {tab.icon}
            </ListItemIcon>
            <ListItemText primary={tab.label} sx={{ color: '#FFFFFF' }} />
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ position: 'absolute', bottom: 0, width: '100%' }}>
        <ListItem 
          button 
          onClick={handleLogout}
          sx={{
            py: 2, 
            pl: 3,
            '&:hover': { bgcolor: '#2A3147' }
          }}
        >
          <ListItemIcon sx={{ color: '#FFFFFF', minWidth: 30 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" sx={{ color: '#FFFFFF' }} />
        </ListItem>
      </Box>
    </Box>
  );

  // Main content render switch
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f7' }}>
      {/* Sidebar */}
      <Box
        component="nav"
        sx={{
          width: 240,
          flexShrink: 0,
          position: 'fixed',
          height: '100vh',
          zIndex: 1200
        }}
      >
      <Sidebar />
      </Box>
      
      {/* Main content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3,
          ml: '240px', // Offset for fixed sidebar
          minHeight: '100vh',
          bgcolor: '#f5f5f7'
        }}
      >
        {loading && <LinearProgress />}
        
        <Box sx={{ maxWidth: 1200, mx: 'auto', py: 3 }}>
          {activeSection === 'profile' && renderProfile()}
          {activeSection === 'meetings' && renderMeetings()}
          {activeSection === 'analytics' && renderAnalytics()}
          {activeSection === 'reports' && renderReports()}
          {activeSection === 'minutesOfMeetings' && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
                Minutes of Meetings
              </Typography>
              
              {/* Academic Director Questions Section */}
              {renderAcademicDirectorQuestions()}
              
              {/* HOD Responses Section */}
              {renderMinutesOfMeetings()}
            </Box>
          )}
        </Box>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Box>
    </Box>
  );
};

export default ExecutiveDirectorDashboard;