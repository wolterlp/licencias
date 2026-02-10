require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const licenseRoutes = require('./routes/licenseRoutes');
const authRoutes = require('./routes/authRoutes');
const { initScheduledJobs } = require('./services/notificationService');

const app = express();

// Connect to MongoDB
connectDB();

// Init Scheduled Jobs (Email Notifications)
initScheduledJobs();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Body parser
app.use(morgan('dev')); // Logging

// Routes
app.use('/api/licenses', licenseRoutes);
app.use('/api/auth', authRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('License Server is running...');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`License Server running on port ${PORT}`);
});
