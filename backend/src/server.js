require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { seedDemo } = require('./config/memstore');

const app = express();

// Security middlewares
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
}));

// Rate limiting — 200 requests per 15 min per IP (relaxed for demo)
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'Too many requests' }));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'in-memory', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

// Seed in-memory data then start
seedDemo().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 PMS API running on http://localhost:${PORT} (in-memory mode)`);
    console.log('📌 Demo credentials:');
    console.log('   Admin:    admin@company.com    / password123');
    console.log('   Manager:  manager@company.com  / password123');
    console.log('   Employee: alice.smith@company.com / password123\n');
  });
}).catch(err => {
  console.error('❌ Startup failed:', err);
  process.exit(1);
});

module.exports = app;
