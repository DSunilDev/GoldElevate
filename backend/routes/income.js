const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, requireMember } = require('../middleware/auth');

// Get income history
router.get('/history', authenticate, requireMember, async (req, res) => {
  try {
    const memberId = req.user.memberid;
    const { classify, startDate, endDate } = req.query;

    let sql = `SELECT * FROM income WHERE memberid = ?`;
    const params = [memberId];

    if (classify) {
      sql += ` AND classify = ?`;
      params.push(classify);
    }

    if (startDate) {
      sql += ` AND created >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND created <= ?`;
      params.push(endDate);
    }

    sql += ` ORDER BY created DESC`;

    const income = await query(sql, params);

    res.json({
      success: true,
      data: income
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch income history',
      error: error.message
    });
  }
});

// Get income summary
router.get('/summary', authenticate, requireMember, async (req, res) => {
  try {
    const memberId = req.user.memberid;

    const summary = await query(
      `SELECT 
        classify,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as count
       FROM income 
       WHERE memberid = ?
       GROUP BY classify`,
      [memberId]
    );

    const [total] = await query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM income WHERE memberid = ?`,
      [memberId]
    );

    res.json({
      success: true,
      data: {
        byType: summary || [],
        total: total?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch income summary',
      error: error.message
    });
  }
});

module.exports = router;

