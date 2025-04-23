import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Box,Container,Paper,TextField,Button,Typography,Alert,Grid,InputAdornment,Checkbox,FormControlLabel,useMediaQuery,Link,Snackbar,CircularProgress
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { login } from '../../redux/slices/authSlice';
// Import images
import logoImage from '../../assets/sri shanmugha logo.jpg';
import graduationCapIcon from '../../assets/graduation-cap-icon.webp';
import axios from 'axios';

const Login = ({ setIsAuthenticated, setUserRole }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    username: false,
    password: false
  });
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Check for remembered credentials on component mount
  useEffect(() => {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
      try {
        const userData = JSON.parse(rememberedUser);
        setFormData({
          username: userData.username || '',
          password: userData.password || ''
        });
        setRememberMe(true);
      } catch (error) {
        console.error('Error parsing remembered user data:', error);
        // Clear invalid data
        localStorage.removeItem('rememberedUser');
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // Clear field error when user types
    if (attemptedSubmit) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: value.trim() === ''
      }));
    }
    
    // Clear error message when user types
    if (error) {
      setError('');
      setSnackbarOpen(false);
    }
  };

  const validateForm = () => {
    const errors = {
      username: formData.username.trim() === '',
      password: formData.password.trim() === ''
    };
    
    setFieldErrors(errors);
    setAttemptedSubmit(true);
    
    return !errors.username && !errors.password;
  };

  // Use useCallback to memoize the login function and prevent re-creation on re-renders
  const handleLogin = useCallback(async () => {
    // Don't proceed if already loading
    if (loading) return;
    
    // Validate form
    if (!validateForm()) {
      return; // Stop if validation fails
    }
    
    setLoading(true);
    setError('');

    // Store current values to use in callbacks to avoid closure issues
    const currentUsername = formData.username;
    const currentPassword = formData.password;
    const currentRememberMe = rememberMe;

    try {
      // Clone the credentials to avoid reference issues
      const credentials = {
        username: currentUsername,
        password: currentPassword
      };

      // Isolate the API call
      const response = await axios.post('http://localhost:8080/api/auth/signin', credentials);

      // Process response only if component is still mounted
      if (response.data && response.data.accessToken) {
        // Handle Remember Me functionality
        if (currentRememberMe) {
          localStorage.setItem('rememberedUser', JSON.stringify({
            username: currentUsername,
            password: currentPassword
          }));
        } else {
          localStorage.removeItem('rememberedUser');
        }
        
        localStorage.setItem('token', response.data.accessToken);
        
        // Store complete user data
        const userData = {
          id: response.data.id,
          username: response.data.username,
          email: response.data.email,
          fullName: response.data.fullName,
          roles: response.data.roles,
          department: response.data.department
        };
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Set authentication state
        if (setIsAuthenticated) {
          setIsAuthenticated(true);
        }
        
        // Determine user role and redirect
        const userRole = response.data.roles?.[0]?.replace('ROLE_', '').toLowerCase() || '';
        if (setUserRole) {
          setUserRole(userRole);
        }
        
        // Store role in localStorage for persistence
        localStorage.setItem('userRole', userRole);
        
        // Redirect based on role using timeout to break event chain
        setTimeout(() => {
          switch(userRole) {
            case 'academic_director':
            case 'academic':
              navigate('/academic-director-dashboard');
              break;
            case 'executive_director':
            case 'executive':
              navigate('/executive-director-dashboard');
              break;
            case 'hod':
            case 'head_of_department':
              navigate('/hod-dashboard');
              break;
            case 'staff':
              navigate('/staff-dashboard');
              break;
            case 'student':
              navigate('/student-dashboard');
              break;
            default:
              setError('Invalid user role');
              setSnackbarOpen(true);
          }
        }, 0);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Set a user-friendly error message
      let errorMessage = 'Login failed. Please check your credentials and try again.';
      
      // Check for specific error responses
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Invalid username or password. Please try again.';
        } else if (error.response.data?.message) {
          // Server provided a specific error message
          errorMessage = error.response.data.message;
          
          // Make messages more user-friendly
          if (errorMessage.includes('User Not found')) {
            errorMessage = 'Username not found. Please check your username and try again.';
          } else if (errorMessage.includes('Invalid Password')) {
            errorMessage = 'Incorrect password. Please try again.';
          }
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      // Set the error message to display in the UI - use a setTimeout to break event chain
      setTimeout(() => {
        setError(errorMessage);
        setSnackbarOpen(true);
        
        // Reset password field on error for security
        setFormData(prev => ({
          ...prev,
          password: ''
        }));
      }, 0);
    } finally {
      // Use setTimeout to ensure this happens after any React events are processed
      setTimeout(() => {
        setLoading(false);
      }, 0);
    }
  }, [loading, formData.username, formData.password, rememberMe, navigate, setIsAuthenticated, setUserRole, validateForm]); // Dependencies

  // Handle key press with useCallback to prevent recreation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      e.stopPropagation();
      // Use setTimeout to break the event chain
      setTimeout(() => {
        handleLogin();
      }, 0);
    }
  }, [handleLogin, loading]);

  const handleRememberMeChange = (e) => {
    const isChecked = e.target.checked;
    setRememberMe(isChecked);
    
    // If unchecked, remove stored credentials
    if (!isChecked) {
      localStorage.removeItem('rememberedUser');
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box 
      className="login-page"
      sx={{ 
        minHeight: '100vh', 
        display: 'flex',
        bgcolor: '#F5F8FD',
      }}
    >
      {/* Left side - Welcome message with logo (hidden on mobile) */}
      <Box 
        sx={{ 
          flex: { xs: 0, md: 1 }, 
          background: 'linear-gradient(135deg, #E6F0FF 0%, #B8D3FF 100%)', 
          color: 'white',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 4,
          position: 'relative'
        }}
      >
      <Box
        sx={{
            position: 'absolute', 
            top: 20, 
            left: 20,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Box 
            component="img" 
            src={logoImage} 
            alt="Sri Shanmugha Logo" 
            sx={{ 
              width: '35px',
              height: '35px',
              mr: 1.5
            }}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1A2137', lineHeight: 1.2, fontSize: '1rem' }}>
              SRI SHANMUGHA
            </Typography>
            <Typography variant="caption" sx={{ color: '#1A2137', lineHeight: 1.2, fontSize: '0.65rem', letterSpacing: '0.5px' }}>
              EDUCATIONAL INSTITUTIONS
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center', 
          maxWidth: '80%',
          mt: 6
        }}>
          <Box 
            component="div"
            sx={{ 
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box
              component="img"
              src={graduationCapIcon}
              alt="Graduation Cap"
              sx={{
                width: '70px',
                height: '70px',
                filter: 'brightness(0)',
                padding: 0,
                borderRadius: 0,
                border: 'none'
              }}
            />
          </Box>
          
          <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', color: '#1A2137' }}>
            Welcome to Our Feedback Portal
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', mb: 4, color: '#333333', fontWeight: 'normal' }}>
            Your feedback helps us improve and provide better educational services
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 2, 
            alignItems: 'flex-start', 
            width: '100%', 
            backgroundColor: '#E6F0FF', 
            padding: 2.5,
            borderRadius: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                bgcolor: 'rgba(26, 33, 55, 0.1)', 
                borderRadius: '50%', 
                width: 30, 
                height: 30, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#1A2137',
                fontWeight: 'medium',
                fontSize: '0.8rem'
              }}>
                01
              </Box>
              <Typography color="#1A2137" variant="body2">Login with your institutional credentials</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                bgcolor: 'rgba(26, 33, 55, 0.1)', 
                borderRadius: '50%', 
                width: 30, 
                height: 30, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#1A2137',
                fontWeight: 'medium',
                fontSize: '0.8rem'
              }}>
                02
              </Box>
              <Typography color="#1A2137" variant="body2">Navigate to your specific feedback forms</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                bgcolor: 'rgba(26, 33, 55, 0.1)', 
                borderRadius: '50%', 
                width: 30, 
                height: 30, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#1A2137',
                fontWeight: 'medium',
                fontSize: '0.8rem'
              }}>
                03
              </Box>
              <Typography color="#1A2137" variant="body2">Submit your valuable feedback</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Right side - Login form */}
      <Box 
        className="login-form-container"
        sx={{ 
          flex: { xs: 1, md: 1 }, 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: { xs: 2, sm: 4 }
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: { xs: 2, sm: 3 },
            width: '100%',
            maxWidth: '400px',
            backgroundColor: 'white',
            borderRadius: 2
          }}
        >
          {/* Logo for mobile view */}
          <Box 
            sx={{ 
              display: { xs: 'flex', md: 'none' }, 
              justifyContent: 'center', 
              mb: 2,
              alignItems: 'center'
            }}
          >
            <Box 
              component="img" 
              src={logoImage} 
              alt="Sri Shanmugha Logo" 
              sx={{ 
                width: '35px',
                height: '35px',
                mr: 1.5
              }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1A2137', lineHeight: 1.2, fontSize: '1rem' }}>
                SRI SHANMUGHA
              </Typography>
              <Typography variant="caption" sx={{ color: '#1A2137', lineHeight: 1.2, fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                EDUCATIONAL INSTITUTIONS
              </Typography>
            </Box>
          </Box>
          
          <Typography 
            variant="h6" 
            component="h1" 
            align="center" 
            gutterBottom 
            sx={{ 
              fontWeight: 'bold', 
              color: '#1A2137',
              mb: 0.5
            }}
          >
            Feedback Management System
          </Typography>
          
          <Typography 
            variant="body2" 
            align="center" 
            sx={{ mb: 3, color: 'text.secondary' }}
          >
            Login to your account
          </Typography>
          
          <Box
            component="div"
            sx={{
              mt: 4,
              width: '100%'
            }}
          >
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 'medium', display: 'block' }}>
              Username or Email
            </Typography>
            <TextField
              fullWidth
              id="username"
              name="username"
              placeholder="Enter your username or email"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              sx={{ mb: 2 }}
              size="small"
              error={fieldErrors.username}
              helperText={fieldErrors.username ? "Username is required" : ""}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: 'text.secondary', fontSize: '1.1rem' }} />
                  </InputAdornment>
                ),
              }}
            />
            
            <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 'medium', display: 'block' }}>
              Password
            </Typography>
            <TextField
              fullWidth
              name="password"
              placeholder="Enter your password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              sx={{ mb: 1.5 }}
              size="small"
              error={fieldErrors.password}
              helperText={fieldErrors.password ? "Password is required" : ""}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'text.secondary', fontSize: '1.1rem' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Box 
                      component="button"
                      type="button"
                      onClick={handleTogglePasswordVisibility}
                      sx={{ 
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      {showPassword ? 
                        <VisibilityOffIcon sx={{ color: 'text.secondary', fontSize: '1.1rem' }} /> : 
                        <VisibilityIcon sx={{ color: 'text.secondary', fontSize: '1.1rem' }} />
                      }
                    </Box>
                  </InputAdornment>
                ),
              }}
            />
            
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2,
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 0 }
              }}
            >
              <FormControlLabel 
                control={
                  <Checkbox 
                    checked={rememberMe} 
                    onChange={handleRememberMeChange}
                    size="small"
                    disabled={loading}
                    sx={{
                      color: '#1A2137',
                      '&.Mui-checked': {
                        color: '#1A2137',
                      },
                    }}
                  />
                } 
                label={<Typography variant="caption">Remember me</Typography>}
              />
              <Link 
                href="#" 
                variant="caption" 
                sx={{ 
                  color: '#1A2137', 
                  textDecoration: 'none', 
                  fontWeight: 'medium',
                  pointerEvents: loading ? 'none' : 'auto',
                  opacity: loading ? 0.7 : 1
                }}
              >
                Forgot Password?
              </Link>
            </Box>
            
            <Button
              type="button" 
              fullWidth
              variant="contained"
              disabled={loading}
              onClick={(e) => {
                // Prevent any possible default behavior and stop propagation
                e.preventDefault();
                e.stopPropagation();
                // Use setTimeout to break the event chain
                setTimeout(() => handleLogin(), 0);
              }}
              sx={{
                py: 1,
                backgroundColor: '#1A2137',
                '&:hover': {
                  backgroundColor: '#2A3147'
                },
                borderRadius: 1,
                fontWeight: 'medium',
                fontSize: '0.875rem',
                position: 'relative',
                minHeight: '36px'
              }}
            >
              {loading ? (
                <>
                  <CircularProgress 
                    size={24} 
                    sx={{ 
                      color: 'white',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      marginTop: '-12px',
                      marginLeft: '-12px'
                    }} 
                  />
                  <span style={{ visibility: 'hidden' }}>Login</span>
                </>
              ) : 'Login'}
            </Button>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Having trouble logging in? <Link href="#" sx={{ color: '#1A2137', textDecoration: 'none', fontWeight: 'medium' }}>Contact Support</Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
      
      {/* Snackbar for error messages */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Login;