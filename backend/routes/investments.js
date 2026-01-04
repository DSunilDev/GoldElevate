const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const { authenticate, requireMember } = require('../middleware/auth');

// Get investment history
router.get('/history', authenticate, requireMember, async (req, res) => {
  try {
    const memberId = req.user.memberid;
    
    const investments = await query(
      `SELECT s.*, dt.name as package_name, dt.price, dt.daily_return 
       FROM sale s
       LEFT JOIN def_type dt ON s.typeid = dt.typeid
       WHERE s.memberid = ?
       ORDER BY s.created DESC`,
      [memberId]
    );

    res.json({
      success: true,
      data: investments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch investment history',
      error: error.message
    });
  }
});

// Create new investment
router.post('/', authenticate, requireMember, async (req, res) => {
  try {
    const memberId = req.user.memberid;
    const { typeid, amount, paymentMethod, upiReference } = req.body;

    // Validate package exists
    const [package] = await query(
      `SELECT * FROM def_type WHERE typeid = ?`,
      [typeid]
    );

    if (!package) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    // Create investment record
    const result = await transaction(async (connection) => {
      const [saleResult] = await connection.execute(
        `INSERT INTO sale (memberid, typeid, amount, paystatus, created) 
         VALUES (?, ?, ?, 'new', NOW())`,
        [memberId, typeid, amount]
      );

      // If UPI payment, validate reference
      if (paymentMethod === 'UPI' && upiReference) {
        // Check if UPI reference already used
        const [existing] = await connection.execute(
          `SELECT * FROM sale WHERE upi_reference = ?`,
          [upiReference]
        );

        if (existing.length > 0) {
          throw new Error('UPI reference number already used');
        }

        await connection.execute(
          `UPDATE sale SET upi_reference = ? WHERE saleid = ?`,
          [upiReference, saleResult.insertId]
        );
      }

      return saleResult;
    });

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`member:${memberId}`).emit('investment_created', {
        saleid: result.insertId,
        amount,
        package: package.name
      });
    }

    res.json({
      success: true,
      message: 'Investment created successfully',
      data: { saleid: result.insertId }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create investment',
      error: error.message
    });
  }
});

module.exports = router;




