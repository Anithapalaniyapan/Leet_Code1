const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const cron = require('node-cron');

// Import database connection
const db = require('./models');

// Import meeting controller for status updates
const meetingController = require('./controllers/meeting.controller');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/feedback', require('./routes/feedback.routes'));
app.use('/api/questions', require('./routes/question.routes'));
app.use('/api/departments', require('./routes/department.routes'));
app.use('/api/responses', require('./routes/hodResponse.routes'));

// Meeting routes
require('./routes/meeting.routes')(app);
require('./routes/meetingMinutes.routes')(app);
require('./routes/meetingAttendee.routes')(app);

// Simple route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Feedback Management System API.' });
});

// Set port and start server
const PORT = process.env.PORT || 8080;

// Import seeders
const runSeeders = require('./seeders');

// Setup cron job to update meeting statuses every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running automated meeting status update check...');
  try {
    const result = await meetingController.updateMeetingStatuses();
    console.log(`Meeting status update completed: ${JSON.stringify(result)}`);
  } catch (error) {
    console.error('Error in meeting status update cron job:', error);
  }
});

// Sync database, run seeders, and start server
db.sequelize.sync()
  .then(async () => {
    console.log('Database synchronized successfully.');
    
    // Run database seeders
    await runSeeders();
    
    // Run initial meeting status update
    try {
      const result = await meetingController.updateMeetingStatuses();
      console.log(`Initial meeting status update completed: ${JSON.stringify(result)}`);
    } catch (error) {
      console.error('Error in initial meeting status update:', error);
    }
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}.`);
    });
  })
  .catch(err => {
    console.error('Failed to sync database:', err.message);
  });