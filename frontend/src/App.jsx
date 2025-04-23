import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from './theme'
import './App.css'
import Login from './components/auth/Login'
import StudentDashboard from './components/dashboards/StudentDashboard'
import StaffDashboard from './components/dashboards/StaffDashboard'
import AcademicDirectorDashboard from './components/dashboards/AcademicDirectorDashboard'
import ExecutiveDirectorDashboard from './components/dashboards/ExecutiveDirectorDashboard'
import { syncAuthState } from './redux/slices/authSlice'
import HODDashboard from './components/dashboards/HODDashboard'

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated: reduxIsAuthenticated, userRole: reduxUserRole } = useSelector(state => state.auth);
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('isAuthenticated') === 'true');
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || '');

  // Sync state with both localStorage and Redux
  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated') === 'true';
    const storedRole = localStorage.getItem('userRole');
    
    setIsAuthenticated(storedAuth || reduxIsAuthenticated);
    setUserRole(storedRole || reduxUserRole || '');
    
    // Sync Redux state with localStorage if needed
    dispatch(syncAuthState());
  }, [reduxIsAuthenticated, reduxUserRole, dispatch]);

  // Modified ProtectedRoute to handle case sensitivity in role comparison
  // and use both Redux and local state
  const ProtectedRoute = ({ element, allowedRole }) => {
    // Normalize user role and handle multiple formats
    const normalizedUserRole = userRole ? userRole.toLowerCase() : '';
    const reduxNormalizedRole = reduxUserRole ? reduxUserRole.toLowerCase() : '';
    
    // Check for each role with multiple formats
    const isAcademicDirector = (
      normalizedUserRole === 'academic_director' ||
      normalizedUserRole === 'academic-director' ||
      normalizedUserRole === 'academicdirector' ||
      reduxNormalizedRole === 'academic_director' ||
      reduxNormalizedRole === 'academic-director' ||
      reduxNormalizedRole === 'academicdirector'
    );
    
    const isStaff = (
      normalizedUserRole === 'staff' ||
      normalizedUserRole === 'faculty' ||
      normalizedUserRole === 'teacher' ||
      reduxNormalizedRole === 'staff' ||
      reduxNormalizedRole === 'faculty' ||
      reduxNormalizedRole === 'teacher'
    );
    
    const isExecutiveDirector = (
      normalizedUserRole === 'executive_director' ||
      normalizedUserRole === 'executive-director' ||
      normalizedUserRole === 'executivedirector' ||
      reduxNormalizedRole === 'executive_director' ||
      reduxNormalizedRole === 'executive-director' ||
      reduxNormalizedRole === 'executivedirector'
    );
    
    const isStudent = (
      normalizedUserRole === 'student' ||
      reduxNormalizedRole === 'student'
    );
    
    const isHOD = (
      normalizedUserRole === 'hod' ||
      normalizedUserRole.includes('hod') ||
      reduxNormalizedRole === 'hod' ||
      reduxNormalizedRole.includes('hod')
    );
    
    // Check if route is for specific role
    const allowedRoleLower = allowedRole.toLowerCase();
    if (allowedRoleLower === 'academic_director' && isAcademicDirector) {
      return element;
    }
    
    if (allowedRoleLower === 'staff' && isStaff) {
      return element;
    }
    
    if (allowedRoleLower === 'executive_director' && isExecutiveDirector) {
      return element;
    }
    
    if (allowedRoleLower === 'student' && isStudent) {
      return element;
    }

    if (allowedRoleLower === 'hod' && isHOD) {
      return element;
    }
    
    // For backward compatibility - handle other roles with simple equality check
    const hasAccess = normalizedUserRole === allowedRoleLower || 
                      reduxNormalizedRole === allowedRoleLower;
    
    // Add debugging logs
    console.log('ProtectedRoute check:', {
      userRole,
      reduxUserRole,
      normalizedUserRole,
      reduxNormalizedRole,
      allowedRole,
      allowedRoleLower,
      isAuthenticated: isAuthenticated || reduxIsAuthenticated,
      isAcademicDirector,
      isStaff,
      isExecutiveDirector,
      isStudent,
      isHOD,
      hasAccess
    });
    
    return (isAuthenticated || reduxIsAuthenticated) && 
      (hasAccess || isAcademicDirector || isStaff || isExecutiveDirector || isStudent || isHOD) ? 
      element : 
      <Navigate to="/login" />;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} setUserRole={setUserRole} />} />
          <Route path="/student-dashboard" element={<ProtectedRoute element={<StudentDashboard />} allowedRole="student" />} />
          <Route path="/staff-dashboard" element={<ProtectedRoute element={<StaffDashboard />} allowedRole="STAFF" />} />
          <Route path="/academic-director-dashboard" element={<ProtectedRoute element={<AcademicDirectorDashboard />} allowedRole="ACADEMIC_DIRECTOR" />} />
          <Route path="/executive-director-dashboard" element={<ProtectedRoute element={<ExecutiveDirectorDashboard />} allowedRole="EXECUTIVE_DIRECTOR" />} />
          <Route path="/hod-dashboard" element={<ProtectedRoute element={<HODDashboard />} allowedRole="HOD" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
