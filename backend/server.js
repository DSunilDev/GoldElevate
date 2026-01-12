require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { logger } = require('./config/database');
const cron = require('node-cron');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

// ============================================
// AGGRESSIVE CORS CONFIGURATION - FIRST THING
// ============================================
// Custom CORS middleware - runs BEFORE everything else
app.use((req, res, next) => {
  // Set CORS headers for ALL requests (including test login)
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
  
  // Handle preflight OPTIONS requests immediately
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Also use cors library as additional layer
app.use(cors({
  origin: '*', // Explicitly allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Explicit OPTIONS handler for all routes
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.sendStatus(204);
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Note: multer handles multipart/form-data, so we don't need express middleware for it
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Rate limiting - increased limits for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Increased from 100 to 1000 for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to API routes (excluding health check and test login)
app.use('/api/', (req, res, next) => {
  // Always set CORS headers first (before rate limiting)
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle OPTIONS immediately
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  // Skip rate limiting for test login endpoints during development
  if (req.path.includes('/test-login-member') || req.path.includes('/test-login-admin')) {
    return next();
  }
  limiter(req, res, next);
});

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/members', require('./routes/members'));
app.use('/api/packages', require('./routes/packages'));
app.use('/api/investments', require('./routes/investments'));
app.use('/api/income', require('./routes/income'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/withdraw', require('./routes/withdraw'));
app.use('/api/payment-gateway', require('./routes/payment-gateway'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/backup', require('./routes/backup'));
app.use('/api/test', require('./routes/test-routes'));

// Root endpoint - Handle Expo update checks and other root requests
app.get('/', (req, res) => {
  // Check if this is an Expo update request (check multiple possible headers)
  const isExpoRequest = req.headers['expo-updates-environment'] || 
                        req.headers['expo-protocol-version'] || 
                        req.headers['expo-expect-signature'] ||
                        req.headers['expo-accept-signature'] ||
                        req.headers['exponent-platform'] ||
                        (req.headers['user-agent'] && req.headers['user-agent'].includes('okhttp'));
  
  if (isExpoRequest) {
    // Expo is checking for updates - return 404 to indicate no update server
    // This prevents Expo from trying to load assets from our backend
    // Expo will gracefully fall back to using Metro bundler for development
    // 404 is the standard way to indicate "no updates available"
    res.status(404).end();
    return;
  } else {
    // Regular browser/API request
    res.json({
      success: true,
      message: 'GoldElevate API Server',
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        packages: '/api/packages',
        dashboard: '/api/dashboard',
        payment: '/api/payment',
        admin: '/api/admin'
      }
    });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const { checkDataIntegrity } = require('./config/database');
    const integrity = await checkDataIntegrity();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      integrity
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler - Log the requested route for debugging
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  logger.warn(`Request headers:`, req.headers);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedRoute: `${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'GET /api/health',
      'POST /api/auth/*',
      'GET /api/packages',
      'GET /api/dashboard/*',
      'POST /api/payment/*',
      'POST /api/withdraw/*',
      'GET /api/members/*',
      'GET /api/admin/*',
      'GET /api/payment-gateway'
    ]
  });
});

// Start server
const PORT = process.env.PORT || 8081;
httpServer.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  
  // Database connection check
  const { pool } = require('./config/database');
  pool.getConnection((err, connection) => {
    if (err) {
      logger.error('❌ Database connection failed:', err.message);
    } else {
      logger.info('✅ Database connected successfully');
      connection.release();
    }
  });
});

// Daily returns calculation cron job (runs every minute to check for packages at their activation time)
// Each package gets daily returns at the exact time it was approved
cron.schedule('* * * * *', async () => {
  try {
    logger.info('Running daily returns calculation...');
    const { processDailyReturns } = require('./utils/incomeCalculator');
    await processDailyReturns();
    logger.info('Daily returns calculation completed');
  } catch (error) {
    logger.error('Error in daily returns calculation:', error);
  }
});

// Weekly income distribution cron job - REMOVED
// This was planned for weekly/monthly bonuses but is not implemented
// All earnings are currently handled through daily returns (status 'In')
// If you need weekly/monthly income distribution, implement distributeWeeklyIncome() in utils/incomeCalculator.js

module.exports = { app, httpServer, io };
