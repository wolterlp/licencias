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
const HTTPS_ENABLE = String(process.env.HTTPS_ENABLE || '').toLowerCase() === 'true';
const HTTPS_PORT = process.env.HTTPS_PORT || 5443;

const startServers = () => {
  app.listen(PORT, () => {
    console.log(`HTTP License Server running on port ${PORT}`);
  });

  if (HTTPS_ENABLE) {
    try {
      const fs = require('fs');
      const path = require('path');
      const https = require('https');
      const keyPath = process.env.SSL_KEY_PATH;
      const certPath = process.env.SSL_CERT_PATH;
      if (!keyPath || !certPath) {
        console.warn('HTTPS habilitado pero faltan SSL_KEY_PATH y/o SSL_CERT_PATH');
        return;
      }
      const key = fs.readFileSync(path.resolve(keyPath));
      const cert = fs.readFileSync(path.resolve(certPath));
      const server = https.createServer({ key, cert }, app);
      server.listen(HTTPS_PORT, () => {
        console.log(`HTTPS License Server running on port ${HTTPS_PORT}`);
      });
    } catch (e) {
      console.error('Error iniciando HTTPS:', e.message);
    }
  }
};

startServers();
