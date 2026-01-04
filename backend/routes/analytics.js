const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, requireMember } = require('../middleware/auth');

// Get analytics data
router.get('/', authenticate, requireMember, async (req, res) => {
  try {
    const memberId = req.user.memberid;
    const { period = '30' } = req.query; // days

    // Income over time
    const incomeOverTime = await query(
      `SELECT DATE(created) as date, SUM(amount) as total
       FROM income 
       WHERE memberid = ? AND created >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created)
       ORDER BY date ASC`,
      [memberId, period]
    );

    // Referral growth
    const referralGrowth = await query(
      `SELECT DATE(created) as date, COUNT(*) as count
       FROM member 
       WHERE sid = ? AND created >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created)
       ORDER BY date ASC`,
      [memberId, period]
    );

    // Income by type
    const incomeByType = await query(
      `SELECT classify, SUM(amount) as total, COUNT(*) as count
       FROM income 
       WHERE memberid = ? AND created >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY classify`,
      [memberId, period]
    );

    res.json({
      success: true,
      data: {
        incomeOverTime,
        referralGrowth,
        incomeByType
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

module.exports = router;




