// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
// const { sequelize } = require('./models');
const { sequelize } = require('./src/models');


const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Booking System API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      bookings: '/api/bookings'
    }
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/bookings', require('./src/routes/booking.routes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;

// Database connection and server start
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync models
    // Use { force: true } only in development to reset tables
    // Use { alter: true } to alter tables to match models
    const syncOptions = process.env.NODE_ENV === 'development' 
      ? { alter: true } 
      : {};
    
    await sequelize.sync(syncOptions);
    console.log('✅ Database models synced.');
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📝 API Documentation:`);
      console.log(`   POST /api/auth/signup     - User registration`);
      console.log(`   POST /api/auth/login      - User login`);
      console.log(`   GET  /api/auth/verify/:token - Verify email`);
      console.log(`   POST /api/bookings        - Create booking`);
      console.log(`   POST /api/bookings/check-availability - Check availability`);
      console.log(`   GET  /api/bookings        - Get user's bookings`);
      console.log(`   DELETE /api/bookings/:id  - Cancel booking`);
      console.log(`\n🔍 Health check: http://localhost:${PORT}/health`);
      console.log(`📋 API info: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();