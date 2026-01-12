// Test route to verify all routes are working
const express = require('express');
const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test route is working!',
    timestamp: new Date().toISOString()
  });
});

// List all available routes
router.get('/list', (req, res) => {
  res.json({
    success: true,
    routes: [
      '/api/health',
      '/api/auth/*',
      '/api/packages',
      '/api/dashboard/*',
      '/api/payment/*',
      '/api/withdraw/*',
      '/api/members/*',
      '/api/admin/*',
      '/api/payment-gateway',
      '/api/referrals/*',
      '/api/income/*'
    ]
  });
});

module.exports = router;

