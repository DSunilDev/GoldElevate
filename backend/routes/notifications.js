const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');
const { sendSMS } = require('../utils/sms');

// Get notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.memberid || req.user.adminid;
    const role = req.user.role;

    // Get notifications from database (you'll need to create a notifications table)
    const notifications = await query(
      `SELECT * FROM notifications 
       WHERE user_id = ? AND user_role = ?
       ORDER BY created DESC LIMIT 50`,
      [userId, role]
    );

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// Mark notification as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.memberid || req.user.adminid;

    await query(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message
    });
  }
});

// Send test email
router.post('/test-email', authenticate, async (req, res) => {
  try {
    const { email } = req.body;
    
    await sendEmail({
      to: email,
      subject: 'Test Email from GoldElevate',
      html: '<h1>This is a test email</h1><p>Your email notifications are working correctly!</p>'
    });

    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

module.exports = router;




