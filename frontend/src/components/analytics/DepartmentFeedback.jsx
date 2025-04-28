import React from 'react';
import { Box, Paper, Typography, Grid, Card, CardContent, CircularProgress, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button, LinearProgress } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StarRating from './StarRating';

const DepartmentFeedback = ({ departmentFeedback, departmentFeedbackLoading, departments, selectedDepartmentForStats, setSelectedQuestionId }) => {
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
                    <StarRating rating={parseFloat(departmentFeedback.averageRating) || 0} size="large" />
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
                            <StarRating rating={parseFloat(question.averageRating) || 0} />
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

export default DepartmentFeedback; 