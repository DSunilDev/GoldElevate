const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const { authenticate, requireMember, requireAdmin } = require('../middleware/auth');

// Get member profile
router.get('/profile', authenticate, requireMember, async (req, res) => {
  try {
    const memberId = req.user.memberid;
    
    const [member] = await query(
      `SELECT m.*, dt.name as package_name, dt.price, dt.daily_return 
       FROM member m 
       LEFT JOIN def_type dt ON m.typeid = dt.typeid 
       WHERE m.memberid = ?`,
      [memberId]
    );

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    res.json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// Update member profile
router.put('/profile', authenticate, requireMember, async (req, res) => {
  try {
    const memberId = req.user.memberid;
    const { firstname, lastname, email, street, city, state, zip, country } = req.body;

    await query(
      `UPDATE member 
       SET firstname = ?, lastname = ?, email = ?, 
           street = ?, city = ?, state = ?, zip = ?, country = ?
       WHERE memberid = ?`,
      [firstname, lastname, email, street, city, state, zip, country, memberId]
    );

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// Get referral link
router.get('/referral-link', authenticate, requireMember, async (req, res) => {
  try {
    const memberId = req.user.memberid;
    
    // Get member details to create meaningful referral link
    const memberResult = await query(
      `SELECT memberid, login, firstname, lastname, phone 
       FROM member WHERE memberid = ?`,
      [memberId]
    );
    
    if (!memberResult || memberResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    
    const memberData = memberResult[0];
    
    // Create referral code using format: phone+memberid
    // Example: phone "9876543210" + memberid "5" = "98765432105"
    const phone = memberData.phone || '';
    const referralCode = phone ? `${phone}${memberId}` : `${memberId}`;
    
    // Use sponsorid parameter for referral tracking (backend uses this)
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:19006';
    
    // Create meaningful referral link with both code and sponsorid
    // Format: baseUrl/signup?ref={code}&sponsorid={memberId}
    const referralLink = `${baseUrl}/signup?ref=${encodeURIComponent(referralCode)}&sponsorid=${memberId}`;
    
    // Also create a shorter shareable link (frontend will extract sponsorid from ref if needed)
    const shortLink = `${baseUrl}/signup?ref=${referralCode}`;
    
    res.json({
      success: true,
      data: {
        referralLink,
        link: referralLink, // Full link with both ref and sponsorid
        shortLink: shortLink, // Shorter link
        referralCode: referralCode, // The referral code for display
        memberId,
        memberName: `${memberData.firstname || ''} ${memberData.lastname || ''}`.trim() || memberData.login,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralLink)}`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate referral link',
      error: error.message
    });
  }
});

// Verify referral code
// This endpoint extracts member ID from referral code (phone+memberid format)
// and returns member details for validation
router.get('/verify-referral-code', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Referral code is required',
        valid: false
      });
    }
    
    // Find member where CONCAT(phone, memberid) matches the code
    // Format: phone+memberid (e.g., "98765432105" where phone="9876543210" and memberid="5")
    const memberResult = await query(
      `SELECT memberid, firstname, lastname, phone 
       FROM member 
       WHERE CONCAT(phone, memberid) = ?`,
      [code]
    );
    
    if (!memberResult || memberResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid referral code',
        valid: false
      });
    }
    
    const member = memberResult[0];
    
    res.json({
      success: true,
      valid: true,
      data: {
        memberid: member.memberid,
        firstname: member.firstname || '',
        lastname: member.lastname || '',
        phone: member.phone || ''
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify referral code',
      error: error.message,
      valid: false
    });
  }
});

// Get all members (admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT m.*, dt.name as package_name 
               FROM member m 
               LEFT JOIN def_type dt ON m.typeid = dt.typeid 
               WHERE 1=1`;
    const params = [];

    if (search) {
      sql += ` AND (m.login LIKE ? OR m.email LIKE ? OR m.firstname LIKE ? OR m.lastname LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    sql += ` ORDER BY m.created DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const members = await query(sql, params);
    const [total] = await query(`SELECT COUNT(*) as count FROM member`);

    res.json({
      success: true,
      data: members,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total.count,
        pages: Math.ceil(total.count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch members',
      error: error.message
    });
  }
});

module.exports = router;




