require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const User = require('./models/User');
const licenseRoutes = require('./routes/licenseRoutes');
const authRoutes = require('./routes/authRoutes');
const { initScheduledJobs } = require('./services/notificationService');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// Security prerequisites
if (!process.env.JWT_SECRET || !process.env.LICENSE_SECRET) {
  console.error('Faltan variables de entorno críticas: JWT_SECRET y/o LICENSE_SECRET');
  process.exit(1);
}

// Connect to MongoDB
connectDB();

// Bootstrap: crear admin por defecto si no hay usuarios
const ensureAdminBootstrap = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@local';
      const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin12345';
      const name = process.env.DEFAULT_ADMIN_NAME || 'Administrador';
      await User.create({ name, email, password, role: 'admin' });
      console.log(`✅ Admin inicial creado: ${email} / ${password}`);
    }
  } catch (err) {
    console.error('Error en bootstrap de admin:', err.message);
  }
};
ensureAdminBootstrap();

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
app.use('/api/payments', paymentRoutes);

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

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`License Server running on port ${PORT}`);
});
