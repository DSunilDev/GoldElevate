const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, requireMember } = require('../middleware/auth');

// Get referral list
router.get('/list', authenticate, requireMember, async (req, res) => {
  try {
    const memberId = req.user.memberid;
    
    const referrals = await query(
      `SELECT m.*, dt.name as package_name, dt.price,
       (SELECT COUNT(*) FROM member WHERE sid = m.memberid) as downline_count
       FROM member m
       LEFT JOIN def_type dt ON m.typeid = dt.typeid
       WHERE m.sid = ?
       ORDER BY m.created DESC`,
      [memberId]
    );

    res.json({
      success: true,
      data: referrals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch referrals',
      error: error.message
    });
  }
});

// Get referral tree
router.get('/tree', authenticate, requireMember, async (req, res) => {
  try {
    const memberId = req.user.memberid;
    const { depth = 3 } = req.query;

    const buildTree = async (id, currentDepth = 0) => {
      if (currentDepth >= depth) return null;

      const [member] = await query(
        `SELECT m.*, dt.name as package_name 
         FROM member m 
         LEFT JOIN def_type dt ON m.typeid = dt.typeid 
         WHERE m.memberid = ?`,
        [id]
      );

      if (!member) return null;

      const children = await query(
        `SELECT memberid FROM member WHERE sid = ?`,
        [id]
      );

      const childrenData = await Promise.all(
        children.map(child => buildTree(child.memberid, currentDepth + 1))
      );

      return {
        ...member,
        children: childrenData.filter(Boolean)
      };
    };

    const tree = await buildTree(memberId);

    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch referral tree',
      error: error.message
    });
  }
});

// Get referral statistics
router.get('/stats', authenticate, requireMember, async (req, res) => {
  try {
    const memberId = req.user.memberid;

    const [stats] = await query(
      `SELECT 
        COUNT(*) as total_referrals,
        COUNT(CASE WHEN active = 'Yes' THEN 1 END) as active_referrals,
        COUNT(CASE WHEN leg = 'L' THEN 1 END) as left_leg,
        COUNT(CASE WHEN leg = 'R' THEN 1 END) as right_leg,
        COALESCE(SUM(CASE WHEN active = 'Yes' THEN 1 ELSE 0 END), 0) as total_volume
       FROM member WHERE sid = ?`,
      [memberId]
    );

    const [bonuses] = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_bonuses 
       FROM income 
       WHERE memberid = ? AND classify = 'Direct'`,
      [memberId]
    );

    res.json({
      success: true,
      data: {
        ...stats,
        totalBonuses: bonuses.total_bonuses
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch referral statistics',
      error: error.message
    });
  }
});

module.exports = router;




