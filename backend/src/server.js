require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { seedDemo } = require('./config/memstore');

const app = express();

// Required for Render / Reverse Proxy
app.set('trust proxy', 1);

// ===============================
// Security
// ===============================
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    }
  })
);

// ===============================
// CORS
// ===============================
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:4200',
  'http://localhost:3000'
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow Postman, curl, server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log('❌ Blocked Origin:', origin);

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true
  })
);

// ===============================
// Rate Limiter
// ===============================
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests'
    }
  })
);

// ===============================
// Middlewares
// ===============================
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// Static Uploads
// ===============================
app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'))
);

// ===============================
// Routes
// ===============================
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/departments', require('./routes/department.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));
app.use('/api/leaves', require('./routes/leave.routes'));
app.use('/api/kras', require('./routes/kra.routes'));
app.use('/api/goals', require('./routes/goal.routes'));
app.use('/api/performance', require('./routes/performance.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));

// ===============================
// Health Check
// ===============================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    mode: 'in-memory',
    timestamp: new Date().toISOString()
  });
});

// Optional Root Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Performance Management API is running 🚀'
  });
});

// ===============================
// 404
// ===============================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ===============================
// Error Handler
// ===============================
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

// ===============================
// Start Server
// ===============================
seedDemo()
  .then(() => {
    app.listen(PORT, () => {
      console.log('\n🚀 PMS API running');
      console.log(`🌐 Port: ${PORT}`);
      console.log(`🌍 Frontend: ${process.env.FRONTEND_URL}`);
      console.log('📦 Mode: In-Memory');

      console.log('\n📌 Demo Credentials');
      console.log('Admin    : admin@company.com / password123');
      console.log('Manager  : manager@company.com / password123');
      console.log('Employee : alice.smith@company.com / password123\n');
    });
  })
  .catch((err) => {
    console.error('❌ Startup failed:', err);
    process.exit(1);
  });

module.exports = app;