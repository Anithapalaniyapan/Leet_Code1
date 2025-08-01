import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Alert, 
  Grid, 
  InputAdornment, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  CircularProgress,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import graduationCapIcon from '../../assets/graduation-cap-icon.webp';
import logoImage from '../../assets/sri shanmugha logo.jpg';

const roles = [
  { id: 1, name: 'Student' },
  { id: 2, name: 'Staff' },
  { id: 3, name: 'HOD' },
];

// Fallback departments in case API is not available
const fallbackDepartments = [
  { id: 1, name: 'Computer Science' },
  { id: 2, name: 'Information Technology' },
  { id: 3, name: 'Mechanical Engineering' },
  { id: 4, name: 'Electrical Engineering' },
  { id: 5, name: 'Civil Engineering' },
  { id: 6, name: 'Electronics & Communication' },
  { id: 7, name: 'Artificial Intelligence' },
  { id: 8, name: 'Data Science' },
];

const Register = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    year: '',
    departmentId: '',
    roles: '',
  });
  const [departments, setDepartments] = useState(fallbackDepartments);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsError, setDepartmentsError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      setDepartmentsLoading(true);
      setDepartmentsError('');
      try {
        const res = await fetch('http://localhost:8080/api/departments');
        if (!res.ok) throw new Error('Failed to fetch departments');
        const data = await res.json();
        if (data && data.length > 0) {
          setDepartments(data);
        } else {
          // If API returns empty array, keep fallback departments
          setDepartments(fallbackDepartments);
        }
      } catch (err) {
        console.log('Using fallback departments:', err.message);
        // Don't show error to user, just use fallback departments
        setDepartments(fallbackDepartments);
      } finally {
        setDepartmentsLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8080/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          year: Number(form.year),
          departmentId: Number(form.departmentId),
          roles: Number(form.roles),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Registration failed');
      }
      navigate('/login');
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error: Please check if the server is running');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
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
              width: '80px',
              height: '80px',
              mr: 1.5
            }}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1A2137', lineHeight: 1.2, fontSize: '1.2rem' }}>
              SRI SHANMUGHA
            </Typography>
            <Typography variant="caption" sx={{ color: '#1A2137', lineHeight: 1.2, fontSize: '0.80rem', letterSpacing: '0.5px' }}>
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
            Create your account to provide valuable feedback and help us improve educational services
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
              <Typography color="#1A2137" variant="body2">Fill in your personal details</Typography>
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
              <Typography color="#1A2137" variant="body2">Select your department and role</Typography>
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
              <Typography color="#1A2137" variant="body2">Register and start giving feedback</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Right side - Registration form */}
      <Box 
        sx={{ 
          flex: { xs: 1, md: 1 }, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: { xs: 2, md: 4 }
        }}
      >
        <Paper 
          elevation={3}
          sx={{ 
            width: '100%', 
            maxWidth: 500,
            padding: { xs: 3, md: 4 },
            borderRadius: 2,
            backgroundColor: 'white'
          }}
        >
          {/* Mobile logo and branding */}
          {isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
              <Box 
                component="img" 
                src={logoImage} 
                alt="Sri Shanmugha Logo" 
                sx={{ 
                  width: '60px',
                  height: '60px',
                  mr: 2
                }}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1A2137', lineHeight: 1.2, fontSize: '1rem' }}>
                  SRI SHANMUGHA
                </Typography>
                <Typography variant="caption" sx={{ color: '#1A2137', lineHeight: 1.2, fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                  EDUCATIONAL INSTITUTIONS
                </Typography>
              </Box>
            </Box>
          )}

          <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#1A2137', textAlign: 'center', mb: 1 }}>
            Register Account
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', mb: 3, color: '#666' }}>
            Create your account to get started
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: '#1A2137' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#E0E0E0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#1A2137',
                      },
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: '#1A2137' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#E0E0E0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#1A2137',
                      },
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: '#1A2137' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#E0E0E0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#1A2137',
                      },
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: '#1A2137' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          size="small"
                          onClick={() => setShowPassword(!showPassword)}
                          sx={{ minWidth: 'auto', p: 0.5 }}
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#E0E0E0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#1A2137',
                      },
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Year"
                  name="year"
                  type="number"
                  value={form.year}
                  onChange={handleChange}
                  required
                  inputProps={{ min: 1, max: 5 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarIcon sx={{ color: '#1A2137' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#E0E0E0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#1A2137',
                      },
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Role</InputLabel>
                  <Select
                    name="roles"
                    value={form.roles}
                    onChange={handleChange}
                    label="Role"
                    startAdornment={
                      <InputAdornment position="start">
                        <WorkIcon sx={{ color: '#1A2137' }} />
                      </InputAdornment>
                    }
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E0E0E0',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1A2137',
                      },
                    }}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Department</InputLabel>
                  <Select
                    name="departmentId"
                    value={form.departmentId}
                    onChange={handleChange}
                    label="Department"
                    startAdornment={
                      <InputAdornment position="start">
                        <SchoolIcon sx={{ color: '#1A2137' }} />
                      </InputAdornment>
                    }
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E0E0E0',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1A2137',
                      },
                    }}
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name || dept.departmentName || dept.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                backgroundColor: '#1A2137',
                '&:hover': {
                  backgroundColor: '#2A3147'
                },
                borderRadius: 1,
                fontWeight: 'medium',
                fontSize: '1rem',
                position: 'relative',
                minHeight: '48px'
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
                  <span style={{ visibility: 'hidden' }}>Register</span>
                </>
              ) : 'Register'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Already have an account?{' '}
                <Button
                  variant="text"
                  onClick={() => navigate('/login')}
                  sx={{ 
                    color: '#1A2137', 
                    textDecoration: 'none', 
                    fontWeight: 'medium',
                    p: 0,
                    minWidth: 'auto',
                    '&:hover': {
                      textDecoration: 'underline',
                      backgroundColor: 'transparent'
                    }
                  }}
                >
                  Login
                </Button>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Register; 