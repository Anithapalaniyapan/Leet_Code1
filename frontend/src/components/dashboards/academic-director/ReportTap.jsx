import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box, Typography, Grid, Paper, Card, CardContent, Button, Alert, CircularProgress
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { clearReportState } from '../../../redux/slices/reportSlice';

const ReportTap = ({ 
  departments,
  handleExportToExcel, 
  handleDownloadReport, 
  loading,
  selectedDepartmentForStats 
}) => {
  const dispatch = useDispatch();
  const { downloadSuccess, generationSuccess, error } = useSelector(state => state.reports);
  
  // Track individual loading states for each button
  const [loadingStates, setLoadingStates] = useState({
    'feedback-all': false,
    'department-stats': false,
    'overall-stats': false,
    'student': false,
    'staff': false
  });
  // Debug props
  useEffect(() => {
    console.log('Reports component received props:');
    console.log('- handleExportToExcel:', typeof handleExportToExcel);
    console.log('- handleDownloadReport:', typeof handleDownloadReport);
    console.log('- selectedDepartmentForStats:', selectedDepartmentForStats);
  }, [handleExportToExcel, handleDownloadReport, selectedDepartmentForStats]);
  // Clear report states when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearReportState());
    };
  }, [dispatch]);

  // Create safe handlers that check if functions exist before calling
  const handleExport = (reportType) => {
    console.log('Export requested for:', reportType);
    // Set only this button's loading state to true
    setLoadingStates(prev => ({
      ...prev,
      [reportType]: true
    }));
    
    if (typeof handleExportToExcel === 'function') {
      // Create a Promise to handle the loading state
      Promise.resolve()
        .then(() => handleExportToExcel(reportType))
        .catch(err => console.error(err))
        .finally(() => {
          // Always reset loading state in the component
          setTimeout(() => {
            setLoadingStates(prev => ({
              ...prev,
              [reportType]: false
            }));
          }, 500); // Small delay to ensure it completes
        });
    } else {
      console.error('handleExportToExcel is not a function', handleExportToExcel);
      alert('Export functionality is not available. Please try again later.');
      // Reset loading state if function doesn't exist
      setLoadingStates(prev => ({
        ...prev,
        [reportType]: false
      }));
    }
  };

  const handleDownload = (role, type) => {
    console.log('Download requested for role:', role, 'type:', type);
    // Set only this button's loading state to true
    setLoadingStates(prev => ({
      ...prev,
      [role]: true
    }));
    
    if (typeof handleDownloadReport === 'function') {
      // Create a Promise to handle the loading state
      Promise.resolve()
        .then(() => handleDownloadReport(role, type))
        .catch(err => console.error(err))
        .finally(() => {
          // Always reset loading state in the component
          setTimeout(() => {
            setLoadingStates(prev => ({
              ...prev,
              [role]: false
            }));
          }, 500); // Small delay to ensure it completes
        });
    } else {
      console.error('handleDownloadReport is not a function', handleDownloadReport);
      alert('Download functionality is not available. Please try again later.');
      // Reset loading state if function doesn't exist
      setLoadingStates(prev => ({
        ...prev,
        [role]: false
      }));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Reports
      </Typography>
      
      {downloadSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Report downloaded successfully!
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
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
                      startIcon={loadingStates['feedback-all'] ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                      onClick={() => handleExport('feedback-all')}
                      disabled={loadingStates['feedback-all']}
                      fullWidth
                      sx={{ 
                        bgcolor: '#4CAF50', 
                        '&:hover': { bgcolor: '#388E3C' }
                      }}
                    >
                      {loadingStates['feedback-all'] ? 'Downloading...' : 'Export All Feedback'}
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
                      startIcon={loadingStates['department-stats'] ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                      onClick={() => handleExport('department-stats')}
                      disabled={loadingStates['department-stats']}
                      fullWidth
                      sx={{ 
                        bgcolor: '#2196F3', 
                        '&:hover': { bgcolor: '#1565C0' }
                      }}
                    >
                      {loadingStates['department-stats'] ? 'Downloading...' : 'Export Department Stats'}
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
                      startIcon={loadingStates['overall-stats'] ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                      onClick={() => handleExport('overall-stats')}
                      disabled={loadingStates['overall-stats']}
                      fullWidth
                      sx={{ 
                        bgcolor: '#9C27B0', 
                        '&:hover': { bgcolor: '#7B1FA2' }
                      }}
                    >
                      {loadingStates['overall-stats'] ? 'Downloading...' : 'Export Summary Stats'}
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
      </Grid>
    </Box>
  );
};

export default ReportTap; 