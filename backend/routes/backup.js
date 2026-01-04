const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { backupDatabase } = require('../utils/backup');

// Create manual backup
router.post('/create', authenticate, requireAdmin, async (req, res) => {
  try {
    const backupFile = await backupDatabase();
    res.json({
      success: true,
      message: 'Backup created successfully',
      file: backupFile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create backup',
      error: error.message
    });
  }
});

module.exports = router;




