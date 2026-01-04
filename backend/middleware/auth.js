const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Middleware to verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Middleware to check admin role
const requireAdmin = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// Middleware to check member role (allows both 'member' and 'agent' roles)
const requireMember = async (req, res, next) => {
  // Allow both 'member' and 'agent' roles to access member endpoints
  if (req.user.role !== 'member' && req.user.role !== 'agent') {
    return res.status(403).json({ success: false, message: 'Member or Agent access required' });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireMember };




