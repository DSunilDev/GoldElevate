const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, logger } = require('../config/database');
const { body, validationResult } = require('express-validator');
const { sendOTP: msg91SendOTP, verifyOTP: msg91VerifyOTP } = require('../utils/msg91');

// Login endpoint
router.post('/login', [
  body('login').notEmpty().withMessage('Login is required'),
  body('passwd').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { login, passwd } = req.body;

    // Check member login
    const members = await query(
      `SELECT memberid, login, passwd, signup_type, active, typeid, email, firstname, lastname, phone
       FROM member WHERE login = ? OR phone = ?`,
      [login, login]
    );

    if (members.length > 0) {
      const member = members[0];
      
      // Check signup type: OTP signup users cannot login with password
      if (member.signup_type === 'otp') {
        return res.status(403).json({
          success: false,
          message: 'This account was created using OTP. Please login using OTP instead.',
          error: 'OTP signup user cannot login with password'
        });
      }
      
      // Verify password (assuming SHA1 hash with login prefix)
      const crypto = require('crypto');
      const hashedPassword = crypto.createHash('sha1').update(member.login + passwd).digest('hex');
      
      if (member.passwd === hashedPassword) {
        const token = jwt.sign(
          {
            memberid: member.memberid,
            login: member.login,
            role: 'member'
          },
          process.env.JWT_SECRET || 'default-secret',
          { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        return res.json({
          success: true,
          token,
          user: {
            memberid: member.memberid,
            login: member.login,
            email: member.email,
            firstname: member.firstname,
            lastname: member.lastname,
            phone: member.phone,
            typeid: member.typeid,
            role: 'member'
          }
        });
      }
    }

    // Check admin login
    const admins = await query(
      `SELECT adminid, login FROM admin WHERE login = ? AND status = 'Yes'`,
      [login]
    );

    if (admins.length > 0) {
      const admin = admins[0];
      const crypto = require('crypto');
      const hashedPassword = crypto.createHash('sha1').update(login + passwd).digest('hex');
      
      const adminCheck = await query(
        `SELECT login FROM admin WHERE login = ? AND passwd = SHA1(CONCAT(login, ?)) AND status = 'Yes'`,
        [login, passwd]
      );

      if (adminCheck.length > 0) {
        const token = jwt.sign(
          {
            adminid: admin.adminid,
            login: admin.login,
            role: 'admin'
          },
          process.env.JWT_SECRET || 'default-secret',
          { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        return res.json({
          success: true,
          token,
          user: {
            adminid: admin.adminid,
            login: admin.login,
            role: 'admin'
          }
        });
      }
    }

    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Send OTP for login (phone-based)
router.post('/login-send-otp', [
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit phone number required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone } = req.body;

    // Check if phone exists in database
    const existing = await query(
      'SELECT memberid, login, phone, active FROM member WHERE phone = ?',
      [phone]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Phone number not registered. Please sign up first.',
        error: 'Phone not found'
      });
    }

    const member = existing[0];

    // Generate OTP for login
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in session/memory (for manual verification fallback)
    if (!global.otpStore) {
      global.otpStore = new Map();
    }
    
    const otpData = {
      otp: otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      phone: phone,
      memberid: member.memberid,
      createdAt: Date.now(),
      purpose: 'login' // Mark as login OTP
    };
    
    global.otpStore.set(phone, otpData);

    // Send OTP via MSG91 (with timeout to prevent hanging)
    // Use Promise.race to ensure we don't wait more than 8 seconds for MSG91
    const msg91Promise = msg91SendOTP(phone, otp).catch(err => ({
      success: false,
      message: err.message || 'MSG91 request failed',
      error: err
    }));
    
    const timeoutPromise = new Promise(resolve => {
      setTimeout(() => resolve({
        success: false,
        message: 'MSG91 request timed out',
        timeout: true
      }), 8000); // 8 second timeout
    });
    
    try {
      const msg91Result = await Promise.race([msg91Promise, timeoutPromise]);
      if (msg91Result.success) {
        logger.info(`Login OTP sent via MSG91 to ${phone} (memberid: ${member.memberid}), requestId: ${msg91Result.requestId}`);
        console.log(`[OTP] ✅ Login OTP sent via MSG91 to ${phone}: ${otp}, requestId: ${msg91Result.requestId}`);
      } else {
        logger.warn(`MSG91 OTP send failed for ${phone}: ${msg91Result.message || msg91Result.error || 'Unknown error'}`);
        console.log(`[OTP] ❌ MSG91 failed for ${phone}: ${msg91Result.message || msg91Result.error || 'Unknown error'}`);
        console.log(`[OTP] Full MSG91 error:`, JSON.stringify(msg91Result));
      }
    } catch (msg91Error) {
      logger.error(`MSG91 OTP send error for ${phone}:`, msg91Error);
      console.log(`[OTP] ❌ MSG91 exception for ${phone}:`, msg91Error.message);
    }

    // ALWAYS log OTP to console for development/testing
    console.log('═══════════════════════════════════════════════════');
    console.log(`[OTP] Login OTP for ${phone}: ${otp}`);
    console.log(`[OTP] Member ID: ${member.memberid}, Login: ${member.login}`);
    console.log('═══════════════════════════════════════════════════');
    logger.info(`[OTP] Login OTP generated for ${phone}: ${otp} (memberid: ${member.memberid})`);

    res.json({
      success: true,
      message: 'OTP sent successfully. Please check your phone and verify to login.',
      // For development/testing - show OTP in response if MSG91 not configured
      // Remove this in production!
      otp: process.env.MSG91_AUTH_KEY ? undefined : otp // Only show if MSG91 not configured
    });
  } catch (error) {
    logger.error('Login send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
});

// Verify OTP for login
router.post('/login-verify-otp', [
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit phone number required'),
  body('otp').optional().isLength({ min: 4, max: 6 }).withMessage('OTP code must be 4-6 digits'),
  body('msg91Verified').optional().isBoolean().withMessage('msg91Verified must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone, otp, msg91Verified } = req.body;

    logger.info(`Login OTP verification attempt for ${phone}, OTP: ${otp}, msg91Verified: ${msg91Verified}, type: ${typeof msg91Verified}`);
    logger.info(`Full request body: ${JSON.stringify({ phone, otp: otp ? '***' : undefined, msg91Verified })}`);
    
    // Check if MSG91 SDK verified the OTP
    const isMsg91Verified = msg91Verified === true || msg91Verified === 'true' || msg91Verified === 1;
    
    if (!isMsg91Verified) {
      // Standard OTP verification - verify against stored OTP
      if (!otp) {
        return res.status(400).json({
          success: false,
          message: 'OTP code is required when msg91Verified is not true.'
        });
      }
    
    // Verify against stored OTP
    if (!global.otpStore || !global.otpStore.has(phone)) {
      logger.warn(`OTP not found for phone: ${phone}`);
      return res.status(400).json({
        success: false,
        message: 'OTP not found. Please request a new OTP.'
      });
    }

    const storedData = global.otpStore.get(phone);
    
    // Check if OTP is for login
    if (storedData.purpose !== 'login') {
      logger.warn(`OTP purpose mismatch for phone: ${phone}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please request a new login OTP.'
      });
    }
    
    logger.info(`Stored OTP data: ${JSON.stringify({ otp: storedData.otp, expiresAt: storedData.expiresAt, now: Date.now() })}`);
    
    if (Date.now() > storedData.expiresAt) {
      global.otpStore.delete(phone);
      logger.warn(`OTP expired for phone: ${phone}`);
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new OTP.'
      });
    }

    // Compare OTP (as strings to handle any type issues)
    const providedOtp = String(otp).trim();
    const storedOtp = String(storedData.otp).trim();
    
    logger.info(`Comparing OTP: provided="${providedOtp}", stored="${storedOtp}", match=${providedOtp === storedOtp}`);
    
    if (providedOtp !== storedOtp) {
      logger.warn(`OTP mismatch for phone: ${phone}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please check and try again.'
      });
      }
      
      // Clear OTP from store after successful verification
      global.otpStore.delete(phone);
    } else {
      // MSG91 SDK verified the OTP - skip backend OTP comparison
      logger.info(`MSG91 SDK verified OTP for login, phone: ${phone} - bypassing backend OTP check`);
    }

    // OTP verified - get member details and generate login token
    const members = await query(
      `SELECT memberid, login, phone, active, typeid, email, firstname, lastname 
       FROM member WHERE phone = ?`,
      [phone]
    );

    if (members.length === 0) {
      global.otpStore.delete(phone);
      return res.status(404).json({
        success: false,
        message: 'Account not found.'
      });
    }

    const member = members[0];

    // Determine role based on typeid (typeid = 7 is for agents)
    const role = member.typeid === 7 ? 'agent' : 'member';

    // Generate login token
    const token = jwt.sign(
      {
        memberid: member.memberid,
        login: member.login,
        role: role,
        typeid: member.typeid
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    logger.info(`Login OTP verified successfully for phone: ${phone}, memberid: ${member.memberid}, role: ${role}, msg91Verified: ${isMsg91Verified}`);

    res.json({
      success: true,
      token,
      user: {
        memberid: member.memberid,
        login: member.login,
        email: member.email || '',
        firstname: member.firstname || '',
        lastname: member.lastname || '',
        phone: member.phone,
        typeid: member.typeid,
        role: role // Set role based on typeid (agent if typeid = 7, member otherwise)
      },
      message: 'Login successful'
    });
  } catch (error) {
    logger.error('Login verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed.',
      error: error.message
    });
  }
});

// Send OTP endpoint (MSG91 widget handles OTP sending client-side)
// This endpoint just validates phone and checks if it's already registered
router.post('/send-otp', [
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit phone number required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone } = req.body;

    // Check if phone already exists
    const existing = await query(
      'SELECT memberid FROM member WHERE phone = ?',
      [phone]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already registered'
      });
    }

    // Generate OTP for signup
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in session/memory (for manual verification fallback)
    if (!global.otpStore) {
      global.otpStore = new Map();
    }
    
    const otpData = {
      otp: otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      phone: phone,
      createdAt: Date.now(),
      purpose: 'signup'
    };
    
    global.otpStore.set(phone, otpData);

    // Send OTP via MSG91 (with timeout to prevent hanging)
    // Use Promise.race to ensure we don't wait more than 8 seconds for MSG91
    const msg91Promise = msg91SendOTP(phone, otp).catch(err => ({
      success: false,
      message: err.message || 'MSG91 request failed',
      error: err
    }));
    
    const timeoutPromise = new Promise(resolve => {
      setTimeout(() => resolve({
        success: false,
        message: 'MSG91 request timed out',
        timeout: true
      }), 8000); // 8 second timeout
    });
    
    try {
      const msg91Result = await Promise.race([msg91Promise, timeoutPromise]);
      if (msg91Result.success) {
        logger.info(`Signup OTP sent via MSG91 to ${phone}, requestId: ${msg91Result.requestId}`);
        console.log(`[OTP] ✅ Signup OTP sent via MSG91 to ${phone}: ${otp}, requestId: ${msg91Result.requestId}`);
      } else {
        logger.warn(`MSG91 OTP send failed for ${phone}: ${msg91Result.message || msg91Result.error || 'Unknown error'}`);
        console.log(`[OTP] ❌ MSG91 failed for ${phone}: ${msg91Result.message || msg91Result.error || 'Unknown error'}`);
        console.log(`[OTP] Full MSG91 error:`, JSON.stringify(msg91Result));
      }
    } catch (msg91Error) {
      logger.error(`MSG91 OTP send error for ${phone}:`, msg91Error);
      console.log(`[OTP] ❌ MSG91 exception for ${phone}:`, msg91Error.message);
    }

    // ALWAYS log OTP to console for development/testing (even when MSG91 is configured)
    console.log('═══════════════════════════════════════════════════');
    console.log(`[OTP] Signup OTP for ${phone}: ${otp}`);
    console.log(`[OTP] Purpose: Signup`);
    console.log('═══════════════════════════════════════════════════');
    logger.info(`[OTP] Signup OTP generated for ${phone}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully. Please check your phone and verify to continue.',
      // Always show OTP in response for testing/debugging (remove in production)
      otp: otp
    });
  } catch (error) {
    logger.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate phone number',
      error: error.message
    });
  }
});

// Verify MSG91 widget access token
router.post('/verify-msg91-token', [
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit phone number required'),
  body('accessToken').notEmpty().withMessage('MSG91 access token is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone, accessToken } = req.body;
    const authKey = process.env.MSG91_AUTH_KEY;

    if (!authKey) {
      logger.warn('MSG91_AUTH_KEY not configured, skipping token verification');
      // If MSG91 not configured, fall back to manual OTP verification
      return res.status(400).json({
        success: false,
        message: 'MSG91 not configured. Please use manual OTP verification.',
        error: 'MSG91 not configured'
      });
    }

    // Verify token with MSG91 API
    const https = require('https');
    const verifyData = JSON.stringify({
      authkey: authKey,
      'access-token': accessToken
    });

    const options = {
      hostname: 'control.msg91.com',
      path: '/api/v5/widget/verifyAccessToken',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(verifyData)
      }
    };

    return new Promise((resolve) => {
      const req = https.request(options, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          try {
            const result = JSON.parse(data);
            
            if (result.type === 'success' || result.status === 'success') {
              // Token verified - mark OTP as verified in store
              if (!global.otpStore) {
                global.otpStore = new Map();
              }
              
              const otpData = global.otpStore.get(phone) || {};
              global.otpStore.set(phone, {
                ...otpData,
                phone: phone,
                verified: true,
                verifiedAt: Date.now(),
                purpose: otpData.purpose || 'signup'
              });

              logger.info(`MSG91 token verified successfully for phone: ${phone}`);
              resolve(res.json({
                success: true,
                message: 'OTP verified successfully'
              }));
            } else {
              logger.warn(`MSG91 token verification failed for phone: ${phone}, response: ${JSON.stringify(result)}`);
              resolve(res.status(400).json({
                success: false,
                message: result.message || 'OTP verification failed',
                error: 'Token verification failed'
              }));
            }
          } catch (parseError) {
            logger.error(`Failed to parse MSG91 verification response: ${parseError.message}`);
            resolve(res.status(500).json({
              success: false,
              message: 'Failed to verify OTP token',
              error: parseError.message
            }));
          }
        });
      });

      req.on('error', (error) => {
        logger.error(`MSG91 token verification request failed: ${error.message}`);
        resolve(res.status(500).json({
          success: false,
          message: 'Failed to verify OTP token',
          error: error.message
        }));
      });

      req.write(verifyData);
      req.end();
    });
  } catch (error) {
    logger.error('Verify MSG91 token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP token',
      error: error.message
    });
  }
});

// Verify OTP endpoint (using MSG91 token or manual OTP code)
router.post('/verify-otp', [
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit phone number required'),
  body('token').optional().notEmpty().withMessage('OTP verification token required'),
  body('otp').optional().isLength({ min: 4, max: 6 }).withMessage('OTP code must be 4-6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone, token, otp } = req.body;

    // If manual OTP code is provided (fallback for IP blocking or widget issues)
    if (otp && !token) {
      logger.info(`Manual OTP verification attempt for ${phone}, OTP: ${otp}`);
      
      // Verify against stored OTP (from send-otp endpoint)
      if (!global.otpStore || !global.otpStore.has(phone)) {
        logger.warn(`OTP not found for phone: ${phone}`);
        return res.status(400).json({
          success: false,
          message: 'OTP not found. Please request a new OTP.'
        });
      }

      const storedData = global.otpStore.get(phone);
      logger.info(`Stored OTP data: ${JSON.stringify({ otp: storedData.otp, expiresAt: storedData.expiresAt, now: Date.now() })}`);
      
      if (Date.now() > storedData.expiresAt) {
        global.otpStore.delete(phone);
        logger.warn(`OTP expired for phone: ${phone}`);
        return res.status(400).json({
          success: false,
          message: 'OTP expired. Please request a new OTP.'
        });
      }

      // Compare OTP (as strings to handle any type issues)
      const providedOtp = String(otp).trim();
      const storedOtp = String(storedData.otp).trim();
      
      logger.info(`Comparing OTP: provided="${providedOtp}", stored="${storedOtp}", match=${providedOtp === storedOtp}`);
      
      if (providedOtp !== storedOtp) {
        logger.warn(`OTP mismatch for phone: ${phone}`);
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP code. Please check and try again.'
        });
      }

      // OTP verified - mark as verified (keep in store for signup)
      global.otpStore.set(phone, {
        ...storedData,
        phone: phone, // Ensure phone is stored
        verified: true,
        verifiedAt: Date.now()
      });

      logger.info(`OTP verified successfully for phone: ${phone}, verified flag set. Store now has: ${JSON.stringify(global.otpStore.get(phone))}`);
      return res.json({
        success: true,
        message: 'OTP verified successfully'
      });
    }

    // Original implementation: OTP verification is done against stored OTP
    // No widget-based verification needed - just verify the OTP code provided
    if (!token && !otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP code is required'
      });
    }

    // If token is provided (legacy support), treat it as OTP
    const otpToVerify = otp || token;
    
    // Verify against stored OTP (original method)
    if (!global.otpStore || !global.otpStore.has(phone)) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found. Please request a new OTP.'
      });
    }

    const storedData = global.otpStore.get(phone);
    
    if (Date.now() > storedData.expiresAt) {
      global.otpStore.delete(phone);
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new OTP.'
      });
    }

    const providedOtp = String(otpToVerify).trim();
    const storedOtp = String(storedData.otp).trim();
    
    if (providedOtp !== storedOtp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please check and try again.'
      });
    }

    // OTP verified successfully - mark as verified
    global.otpStore.set(phone, {
      ...storedData,
      verified: true,
      verifiedAt: Date.now()
    });

    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    logger.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message
    });
  }
});

// Signup endpoint (updated for phone-based registration)
router.post('/signup', [
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit phone number required'),
  body('packageid').optional({ nullable: true, checkFalsy: true }).customSanitizer((value) => {
    // Convert null, undefined, empty string, or "null" string to undefined
    if (value === null || value === undefined || value === '' || value === 'null') {
      return undefined;
    }
    return value;
  }).optional({ nullable: true }).isInt().withMessage('Invalid package ID'),
  body('sponsorid').optional({ nullable: true, checkFalsy: true }).customSanitizer((value) => {
    // Convert null, undefined, empty string, or "null" string to undefined
    if (value === null || value === undefined || value === '' || value === 'null') {
      return undefined;
    }
    return value;
  }).optional({ nullable: true }).isInt().withMessage('Invalid sponsor ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone, packageid, sponsorid, firstname, lastname, fathers_name, email, address, password: userPassword, id_proof, id_proof_front, id_proof_back, photo, msg91Verified } = req.body;

    logger.info(`Signup attempt for phone: ${phone}, method: ${userPassword ? 'password' : 'otp'}, msg91Verified: ${msg91Verified}`);
    logger.info(`Signup request body: ${JSON.stringify({ phone, msg91Verified, hasPassword: !!userPassword })}`);

    // Validate required fields
    if (!firstname || !firstname.trim()) {
      return res.status(400).json({
        success: false,
        message: 'First name is required',
        error: 'First name is required'
      });
    }

    if (!lastname || !lastname.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Last name is required',
        error: 'Last name is required'
      });
    }

    if (!fathers_name || !fathers_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Father's name is required",
        error: "Father's name is required"
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        error: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        error: 'Invalid email format'
      });
    }

    if (!address || !address.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Address is required',
        error: 'Address is required'
      });
    }

    // Check if phone already exists FIRST (before OTP check)
    const existing = await query(
      'SELECT memberid FROM member WHERE phone = ?',
      [phone]
    );

    if (existing.length > 0) {
      logger.warn(`Phone ${phone} already registered (memberid: ${existing[0].memberid})`);
      return res.status(400).json({
        success: false,
        message: 'Phone number already registered. Please sign in instead.',
        error: 'Phone number already registered'
      });
    }

    // Verify OTP was verified (only required if password is not provided)
    // If password is provided, skip OTP verification
    if (!userPassword) {
      // Check if msg91Verified flag is provided (from MSG91 SDK verification)
      // Handle both boolean true and string "true"
      const isMsg91Verified = msg91Verified === true || msg91Verified === 'true' || msg91Verified === 1;
      
      logger.info(`Checking OTP verification: msg91Verified=${msg91Verified}, isMsg91Verified=${isMsg91Verified}, type=${typeof msg91Verified}`);
      
      if (isMsg91Verified) {
        // MSG91 SDK verified the OTP, mark it as verified in backend store
        if (!global.otpStore) {
          global.otpStore = new Map();
        }
        
        const existingOtpData = global.otpStore.get(phone) || {};
        global.otpStore.set(phone, {
          ...existingOtpData,
          phone: phone,
          verified: true,
          verifiedAt: Date.now(),
          purpose: 'signup',
          msg91Verified: true
        });
        
        logger.info(`MSG91 SDK verified OTP for signup, phone: ${phone}`);
      } else {
        // Standard OTP verification check
      if (!global.otpStore || !global.otpStore.has(phone)) {
        logger.warn(`OTP store missing for phone: ${phone}. Store keys: ${global.otpStore ? Array.from(global.otpStore.keys()).join(', ') : 'null'}`);
        return res.status(400).json({
          success: false,
          message: 'Please verify your phone number first. Please request a new OTP.',
          error: 'OTP not verified'
        });
      }

      const otpData = global.otpStore.get(phone);
      logger.info(`OTP data for signup: ${JSON.stringify({ verified: otpData.verified, phone: otpData.phone, hasVerified: otpData.hasOwnProperty('verified') })}`);
      
      if (!otpData.verified) {
        logger.warn(`OTP not verified for phone: ${phone}. OTP data: ${JSON.stringify(otpData)}`);
        return res.status(400).json({
          success: false,
          message: 'Please verify your phone number first. Please request a new OTP.',
          error: 'OTP not verified'
        });
        }
      }
    }

    // Generate username from phone (or use phone as username)
    const username = `user${phone}`;
    // Use provided password or generate a random one
    const crypto = require('crypto');
    let finalPassword;
    if (userPassword) {
      // User provided password - hash it
      finalPassword = crypto.createHash('sha1').update(username + userPassword).digest('hex');
      logger.info(`Using user-provided password for phone: ${phone}`);
    } else {
      // Generate a random password (user can change later)
      const randomPassword = crypto.randomBytes(8).toString('hex');
      finalPassword = crypto.createHash('sha1').update(username + randomPassword).digest('hex');
      logger.info(`Generated random password for phone: ${phone}`);
    }

    // Get sponsor (default to existing member or 1)
    // First, try to find any existing member
    const [topMembers] = await query('SELECT memberid FROM member ORDER BY memberid LIMIT 1');
    const defaultSponsor = topMembers && topMembers.length > 0 ? topMembers[0].memberid : 1;
    
    const sponsor = sponsorid || defaultSponsor;
    
    // Validate sponsor exists, use 1 if not found
    const sponsorCheck = await query('SELECT memberid FROM member WHERE memberid = ?', [sponsor]);
    const finalSponsor = sponsorCheck.length > 0 ? sponsor : 1;

    // Create member with phone number
    // Note: memberid is not AUTO_INCREMENT, so we need to calculate the next ID
    const maxIdRows = await query('SELECT MAX(memberid) as maxId FROM member');
    let maxId = 0;
    if (maxIdRows && maxIdRows.length > 0 && maxIdRows[0] && maxIdRows[0].maxId !== null) {
      maxId = parseInt(maxIdRows[0].maxId) || 0;
    }
    const nextMemberId = maxId + 1;

    // Determine signup type: 'password' if user provided password, 'otp' otherwise
    const signupType = userPassword ? 'password' : 'otp';
    
    // Insert into member table WITHOUT typeid - typeid will be set when user purchases their first investment package
    // TODO: Store id_proof and photo in a separate table or file storage if needed
    const result = await query(
      `INSERT INTO member (memberid, login, passwd, signup_type, phone, firstname, lastname, fathers_name, email, address, sid, typeid, active, signuptime, created)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'No', NOW(), NOW())`,
      [nextMemberId, username, finalPassword, signupType, phone, firstname.trim(), lastname.trim(), fathers_name.trim(), email.trim(), address.trim(), finalSponsor]
    );
    
    // Log id_proof and photo if provided (for future implementation)
    // Support both old format (id_proof) and new format (id_proof_front, id_proof_back)
    const hasIdProof = id_proof || id_proof_front || id_proof_back;
    if (hasIdProof || photo) {
      logger.info(`Member ${nextMemberId} provided id_proof: ${id_proof ? 'yes (old format)' : 'no'}, id_proof_front: ${id_proof_front ? 'yes' : 'no'}, id_proof_back: ${id_proof_back ? 'yes' : 'no'}, photo: ${photo ? 'yes' : 'no'}`);
      // TODO: Store id_proof and photo in file storage or separate table
    }

    const memberId = nextMemberId; // Use calculated ID since memberid is not AUTO_INCREMENT

    // Clear OTP from store after successful signup
    if (global.otpStore && global.otpStore.has(phone)) {
      global.otpStore.delete(phone);
      logger.info(`OTP cleared from store after successful signup for phone: ${phone}`);
    }

    // Note: Referral bonuses will be credited when the user purchases their first investment package
    // (handled in payment approval logic in admin.js and payment.js)

    // Generate token
    const token = jwt.sign(
      { memberid: memberId, login: username, role: 'member' },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Clear OTP from store after successful signup (duplicate check - already cleared above)
    if (global.otpStore) {
      global.otpStore.delete(phone);
    }

    res.json({
      success: true,
      token,
      user: {
        memberid: memberId,
        login: username,
        phone,
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        email: email.trim(),
        typeid: null, // typeid will be set when user purchases their first investment package
        role: 'member'
      },
      message: 'Account created successfully. Please purchase an investment package to activate your account.'
    });
  } catch (error) {
    logger.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Signup failed',
      error: error.message
    });
  }
});

// Send OTP for agent signup
router.post('/agent-send-otp', [
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit phone number required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone } = req.body;

    // Check if phone already exists
    const existing = await query(
      'SELECT memberid FROM member WHERE phone = ?',
      [phone]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already registered. Please sign in instead.',
        error: 'Phone number already registered'
      });
    }

    // Generate OTP for agent signup
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in session/memory (for manual verification fallback)
    if (!global.otpStore) {
      global.otpStore = new Map();
    }
    
    const otpData = {
      otp: otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      phone: phone,
      createdAt: Date.now(),
      purpose: 'agent-signup' // Mark as agent signup OTP
    };
    
    global.otpStore.set(phone, otpData);

    // Send OTP via MSG91 (with timeout to prevent hanging)
    // Use Promise.race to ensure we don't wait more than 8 seconds for MSG91
    console.log(`[Agent Signup] About to call msg91SendOTP for phone: ${phone}, OTP: ${otp}`);
    const msg91Promise = msg91SendOTP(phone, otp).catch(err => {
      console.log(`[Agent Signup] msg91SendOTP catch block triggered:`, err.message);
      return {
      success: false,
      message: err.message || 'MSG91 request failed',
      error: err
    };
    });
    
    const timeoutPromise = new Promise(resolve => {
      setTimeout(() => resolve({
        success: false,
        message: 'MSG91 request timed out',
        timeout: true
      }), 8000); // 8 second timeout
    });
    
    try {
      const msg91Result = await Promise.race([msg91Promise, timeoutPromise]);
      console.log(`[MSG91] Agent signup response for ${phone}:`, JSON.stringify(msg91Result));
      logger.info(`[MSG91] Agent signup response for ${phone}:`, msg91Result);
      
      if (msg91Result.success) {
        logger.info(`Agent signup OTP sent via MSG91 to ${phone}, requestId: ${msg91Result.requestId}`);
        console.log(`[OTP] ✅ Agent signup OTP sent via MSG91 to ${phone}: ${otp}, requestId: ${msg91Result.requestId}`);
      } else {
        logger.warn(`MSG91 OTP send failed for ${phone}: ${msg91Result.message || msg91Result.error || 'Unknown error'}`);
        console.log(`[OTP] ❌ MSG91 failed for agent signup ${phone}: ${msg91Result.message || msg91Result.error || 'Unknown error'}`);
        console.log(`[OTP] Full MSG91 error response:`, JSON.stringify(msg91Result));
      }
    } catch (msg91Error) {
      logger.error(`MSG91 OTP send error for ${phone}:`, msg91Error);
      console.log(`[OTP] ❌ MSG91 exception for agent signup ${phone}:`, msg91Error.message);
      console.log(`[OTP] Full error:`, msg91Error);
    }

    // ALWAYS log OTP to console for development/testing (even when MSG91 is configured)
    console.log('═══════════════════════════════════════════════════');
    console.log(`[OTP] Agent Signup OTP for ${phone}: ${otp}`);
    console.log(`[OTP] Purpose: Agent Signup`);
    console.log('═══════════════════════════════════════════════════');
    logger.info(`[OTP] Agent signup OTP generated for ${phone}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully. Please verify to complete agent registration.',
      // Only show OTP in response if MSG91 not configured (for testing)
      otp: process.env.MSG91_AUTH_KEY ? undefined : otp
    });
  } catch (error) {
    logger.error('Agent send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
});

// Verify OTP for agent signup
router.post('/agent-verify-otp', [
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit phone number required'),
  body('otp').isLength({ min: 4, max: 6 }).withMessage('OTP code must be 4-6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone, otp } = req.body;

    logger.info(`Agent signup OTP verification attempt for ${phone}, OTP: ${otp}`);
    
    // Verify against stored OTP
    if (!global.otpStore || !global.otpStore.has(phone)) {
      logger.warn(`OTP not found for phone: ${phone}`);
      return res.status(400).json({
        success: false,
        message: 'OTP not found. Please request a new OTP.'
      });
    }

    const storedData = global.otpStore.get(phone);
    
    // Check if OTP is for agent signup
    if (storedData.purpose !== 'agent-signup') {
      logger.warn(`OTP purpose mismatch for phone: ${phone}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please request a new agent signup OTP.'
      });
    }
    
    logger.info(`Stored OTP data: ${JSON.stringify({ otp: storedData.otp, expiresAt: storedData.expiresAt, now: Date.now() })}`);
    
    if (Date.now() > storedData.expiresAt) {
      global.otpStore.delete(phone);
      logger.warn(`OTP expired for phone: ${phone}`);
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new OTP.'
      });
    }

    // Compare OTP (as strings to handle any type issues)
    const providedOtp = String(otp).trim();
    const storedOtp = String(storedData.otp).trim();
    
    logger.info(`Comparing OTP: provided="${providedOtp}", stored="${storedOtp}", match=${providedOtp === storedOtp}`);
    
    if (providedOtp !== storedOtp) {
      logger.warn(`OTP mismatch for phone: ${phone}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please check and try again.'
      });
    }

    // OTP verified - mark as verified in store
    storedData.verified = true;
    global.otpStore.set(phone, storedData);
    
    logger.info(`Agent signup OTP verified successfully for phone: ${phone}`);

    res.json({
      success: true,
      message: 'OTP verified successfully. You can now complete agent registration.'
    });
  } catch (error) {
    logger.error('Agent verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed.',
      error: error.message
    });
  }
});

// Agent signup endpoint (phone-based with OTP verification)
router.post('/agent-signup', [
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit phone number required'),
  body('msg91Verified').optional().isBoolean().withMessage('msg91Verified must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone, msg91Verified } = req.body;

    logger.info(`Agent signup attempt for phone: ${phone}, msg91Verified: ${msg91Verified}`);

    // Check if phone already exists FIRST (before OTP check)
    const existing = await query(
      'SELECT memberid FROM member WHERE phone = ?',
      [phone]
    );

    if (existing.length > 0) {
      logger.warn(`Phone ${phone} already registered (memberid: ${existing[0].memberid})`);
      return res.status(400).json({
        success: false,
        message: 'Phone number already registered. Please sign in instead.',
        error: 'Phone number already registered'
      });
    }

    // Check if msg91Verified flag is provided (from MSG91 SDK verification)
    const isMsg91Verified = msg91Verified === true || msg91Verified === 'true' || msg91Verified === 1;
    
    if (isMsg91Verified) {
      // MSG91 SDK verified the OTP, mark it as verified in backend store
      if (!global.otpStore) {
        global.otpStore = new Map();
      }
      
      const existingOtpData = global.otpStore.get(phone) || {};
      global.otpStore.set(phone, {
        ...existingOtpData,
        phone: phone,
        verified: true,
        verifiedAt: Date.now(),
        purpose: 'agent-signup',
        msg91Verified: true
      });
      
      logger.info(`MSG91 SDK verified OTP for agent signup, phone: ${phone}`);
    } else {
      // Standard OTP verification check
      if (!global.otpStore || !global.otpStore.has(phone)) {
        logger.warn(`OTP store missing for phone: ${phone}. Store keys: ${global.otpStore ? Array.from(global.otpStore.keys()).join(', ') : 'null'}`);
        return res.status(400).json({
          success: false,
          message: 'Please verify your phone number first. Please request a new OTP.',
          error: 'OTP not verified'
        });
      }

      const otpData = global.otpStore.get(phone);
      
      if (otpData.purpose !== 'agent-signup') {
        logger.warn(`OTP purpose mismatch for phone: ${phone}`);
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP. Please request a new agent signup OTP.'
        });
      }
      
      if (!otpData.verified) {
        logger.warn(`OTP not verified for phone: ${phone}. OTP data: ${JSON.stringify(otpData)}`);
        return res.status(400).json({
          success: false,
          message: 'Please verify your phone number first. Please request a new OTP.',
          error: 'OTP not verified'
        });
      }
    }
    
    logger.info(`Agent signup proceeding for phone: ${phone} (OTP verified${isMsg91Verified ? ' via MSG91 SDK' : ' via backend'})`);

    // Generate username from phone (or use phone as username)
    const username = `agent${phone}`;
    // Generate a random password (user can change later)
    const crypto = require('crypto');
    const randomPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = crypto.createHash('sha1').update(username + randomPassword).digest('hex');

    // Get sponsor (default to 1 for agents)
    const sponsor = 1;

    // Ensure agent typeid (7) exists in def_type table
    let agentTypeId = 7;
    const agentTypeCheck = await query('SELECT typeid FROM def_type WHERE typeid = ?', [agentTypeId]);
    
    if (agentTypeCheck.length === 0) {
      // Create agent type if it doesn't exist
      try {
        await query(
          'INSERT INTO def_type (typeid, short, name, price, bv, daily_return) VALUES (?, ?, ?, ?, ?, ?)',
          [agentTypeId, 'AGENT', 'Agent Package', 0, 0, 0]
        );
        logger.info(`Created agent type (typeid: ${agentTypeId}) in def_type table`);
      } catch (createError) {
        // If creation fails (e.g., already exists), try to use existing typeid
        if (createError.code === 'ER_DUP_ENTRY' || createError.code === 'ER_DUP_KEY') {
          logger.info(`Agent type ${agentTypeId} already exists`);
        } else {
          logger.error(`Failed to create agent type: ${createError.message}`);
          // Fallback to typeid 1 if agent type creation fails
          const defaultType = await query('SELECT typeid FROM def_type ORDER BY typeid LIMIT 1');
          if (defaultType && defaultType.length > 0) {
            agentTypeId = defaultType[0].typeid;
            logger.warn(`Using default typeid ${agentTypeId} for agent instead of 7`);
          } else {
            throw new Error('No package types available. Please contact administrator.');
          }
        }
      }
    }

    // Create agent member (typeid = 7 for agents)
    // Note: memberid is not AUTO_INCREMENT, so we need to calculate the next ID
    const maxIdResult = await query('SELECT MAX(memberid) as maxId FROM member');
    const maxId = maxIdResult && maxIdResult.length > 0 && maxIdResult[0].maxId !== null 
      ? maxIdResult[0].maxId 
      : 0;
    const nextMemberId = maxId + 1;
    
    const result = await query(
      `INSERT INTO member (memberid, login, passwd, phone, sid, typeid, active, signuptime, created)
       VALUES (?, ?, ?, ?, ?, ?, 'Yes', NOW(), NOW())`,
      [nextMemberId, username, hashedPassword, phone, sponsor, agentTypeId]
    );

    const memberId = nextMemberId; // Use calculated ID since memberid is not AUTO_INCREMENT

    // Clear OTP from store after successful signup
    if (global.otpStore && global.otpStore.has(phone)) {
      global.otpStore.delete(phone);
      logger.info(`OTP cleared from store after successful agent signup for phone: ${phone}`);
    }

    // Generate token with agent role
    const token = jwt.sign(
      { memberid: memberId, login: username, role: 'agent', typeid: agentTypeId },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        memberid: memberId,
        login: username,
        email: `${phone}@example.com`,
        firstname: 'Agent',
        lastname: 'User',
        phone: phone,
        typeid: agentTypeId,
        role: 'agent' // Mark as agent role for identification
      },
      message: 'Agent account created successfully!'
    });
  } catch (error) {
    logger.error('Agent signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Agent signup failed',
      error: error.message
    });
  }
});

// Send OTP for admin signup
router.post('/admin-send-otp', [
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit phone number required'),
  body('adminKey').notEmpty().withMessage('Admin key required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone, adminKey } = req.body;

    // Verify admin key first
    const validAdminKey = process.env.ADMIN_SIGNUP_KEY || 'ADMIN_SECRET_KEY_2024';
    if (adminKey !== validAdminKey) {
      return res.status(403).json({
        success: false,
        message: 'Invalid admin key',
        error: 'Invalid admin key'
      });
    }

    // Check if phone already exists in admin table (login is just the phone number)
    const existingAdmin = await query(
      'SELECT adminid FROM admin WHERE login = ?',
      [phone]
    );

    // Also check if phone exists in member table
    const existingMember = await query(
      'SELECT memberid FROM member WHERE phone = ?',
      [phone]
    );

    if (existingAdmin.length > 0 || existingMember.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already registered. Please sign in instead.',
        error: 'Phone number already registered'
      });
    }

    // Generate OTP for admin signup
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in session/memory (for manual verification fallback)
    if (!global.otpStore) {
      global.otpStore = new Map();
    }
    
    const otpData = {
      otp: otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      phone: phone,
      adminKey: adminKey, // Store admin key for later verification
      createdAt: Date.now(),
      purpose: 'admin-signup' // Mark as admin signup OTP
    };
    
    global.otpStore.set(phone, otpData);

    // Send OTP via MSG91 (with timeout to prevent hanging)
    // Use Promise.race to ensure we don't wait more than 8 seconds for MSG91
    console.log(`[Admin Signup] About to call msg91SendOTP for phone: ${phone}, OTP: ${otp}`);
    const msg91Promise = msg91SendOTP(phone, otp).catch(err => {
      console.log(`[Admin Signup] msg91SendOTP catch block triggered:`, err.message);
      return {
      success: false,
      message: err.message || 'MSG91 request failed',
      error: err
    };
    });
    
    const timeoutPromise = new Promise(resolve => {
      setTimeout(() => resolve({
        success: false,
        message: 'MSG91 request timed out',
        timeout: true
      }), 8000); // 8 second timeout
    });
    
    try {
      const msg91Result = await Promise.race([msg91Promise, timeoutPromise]);
      console.log(`[MSG91] Admin signup response for ${phone}:`, JSON.stringify(msg91Result));
      logger.info(`[MSG91] Admin signup response for ${phone}:`, msg91Result);
      
      if (msg91Result.success) {
        logger.info(`Admin signup OTP sent via MSG91 to ${phone}`);
        console.log(`[OTP] ✅ Admin signup OTP sent via MSG91 to ${phone}: ${otp}`);
      } else {
        logger.warn(`MSG91 OTP send failed for ${phone}: ${msg91Result.message || 'Unknown error'}`);
        console.log(`[OTP] ❌ MSG91 failed for admin signup ${phone}: ${msg91Result.message || 'Unknown error'}`);
        console.log(`[OTP] Full MSG91 error response:`, msg91Result);
      }
    } catch (msg91Error) {
      logger.error(`MSG91 OTP send error for ${phone}:`, msg91Error);
      console.log(`[OTP] ❌ MSG91 exception for admin signup ${phone}:`, msg91Error.message);
      console.log(`[OTP] Full error:`, msg91Error);
    }

    // ALWAYS log OTP to console for development/testing (even when MSG91 is configured)
    console.log('═══════════════════════════════════════════════════');
    console.log(`[OTP] Admin Signup OTP for ${phone}: ${otp}`);
    console.log(`[OTP] Purpose: Admin Signup`);
    console.log('═══════════════════════════════════════════════════');
    logger.info(`[OTP] Admin signup OTP generated for ${phone}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully. Please verify to complete admin registration.',
      // Only show OTP in response if MSG91 not configured (for testing)
      otp: process.env.MSG91_AUTH_KEY ? undefined : otp
    });
  } catch (error) {
    logger.error('Admin send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
});

// Verify OTP for admin signup
router.post('/admin-verify-otp', [
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit phone number required'),
  body('otp').isLength({ min: 4, max: 6 }).withMessage('OTP code must be 4-6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone, otp } = req.body;

    logger.info(`Admin signup OTP verification attempt for ${phone}, OTP: ${otp}`);
    
    // Verify against stored OTP
    if (!global.otpStore || !global.otpStore.has(phone)) {
      logger.warn(`OTP not found for phone: ${phone}`);
      return res.status(400).json({
        success: false,
        message: 'OTP not found. Please request a new OTP.'
      });
    }

    const storedData = global.otpStore.get(phone);
    
    // Check if OTP is for admin signup
    if (storedData.purpose !== 'admin-signup') {
      logger.warn(`OTP purpose mismatch for phone: ${phone}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please request a new admin signup OTP.'
      });
    }
    
    logger.info(`Stored OTP data: ${JSON.stringify({ otp: storedData.otp, expiresAt: storedData.expiresAt, now: Date.now() })}`);
    
    if (Date.now() > storedData.expiresAt) {
      global.otpStore.delete(phone);
      logger.warn(`OTP expired for phone: ${phone}`);
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new OTP.'
      });
    }

    // Compare OTP (as strings to handle any type issues)
    const providedOtp = String(otp).trim();
    const storedOtp = String(storedData.otp).trim();
    
    logger.info(`Comparing OTP: provided="${providedOtp}", stored="${storedOtp}", match=${providedOtp === storedOtp}`);
    
    if (providedOtp !== storedOtp) {
      logger.warn(`OTP mismatch for phone: ${phone}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please check and try again.'
      });
    }

    // OTP verified - mark as verified in store
    storedData.verified = true;
    global.otpStore.set(phone, storedData);
    
    logger.info(`Admin signup OTP verified successfully for phone: ${phone}`);

    res.json({
      success: true,
      message: 'OTP verified successfully. You can now complete admin registration.'
    });
  } catch (error) {
    logger.error('Admin verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed.',
      error: error.message
    });
  }
});

// Send OTP for admin login
router.post('/admin-login-send-otp', [
  body('phone').matches(/^\d{10}$/).withMessage('Valid 10-digit phone number required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone } = req.body;

    // Check if phone exists in admin table (login is just the phone number)
    const existing = await query(
      'SELECT adminid, login, status FROM admin WHERE login = ?',
      [phone]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found. Please sign up first.',
        error: 'Admin not found'
      });
    }

    const admin = existing[0];
    
    // Check if account is active
    if (admin.status !== 'Yes') {
      return res.status(403).json({
        success: false,
        message: 'Your admin account is not active. Please contact support.',
        error: 'Account not active'
      });
    }

    // Generate OTP for admin login
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in session/memory (for manual verification fallback)
    if (!global.otpStore) {
      global.otpStore = new Map();
    }
    
    const otpData = {
      otp: otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      phone: phone,
      adminid: admin.adminid,
      createdAt: Date.now(),
      purpose: 'admin-login' // Mark as admin login OTP
    };
    
    global.otpStore.set(phone, otpData);

    // Send OTP via MSG91
    try {
      const msg91Result = await msg91SendOTP(phone, otp);
      if (msg91Result.success) {
        logger.info(`Admin login OTP sent via MSG91 to ${phone} (adminid: ${admin.adminid})`);
        console.log(`[OTP] Admin login OTP sent via MSG91 to ${phone}: ${otp}`);
      } else {
        logger.warn(`MSG91 OTP send failed for ${phone}: ${msg91Result.message}`);
        console.log(`[OTP] MSG91 failed, Admin OTP for ${phone}: ${otp} (fallback)`);
      }
    } catch (msg91Error) {
      logger.error(`MSG91 OTP send error for ${phone}:`, msg91Error);
      console.log(`[OTP] MSG91 error, Admin OTP for ${phone}: ${otp} (fallback)`);
    }

    // ALWAYS log OTP to console for development/testing
    console.log('═══════════════════════════════════════════════════');
    console.log(`[OTP] Admin Login OTP for ${phone}: ${otp}`);
    console.log(`[OTP] Admin ID: ${admin.adminid}, Login: ${admin.login}`);
    console.log('═══════════════════════════════════════════════════');
    logger.info(`[OTP] Admin login OTP generated for ${phone}: ${otp} (adminid: ${admin.adminid})`);

    res.json({
      success: true,
      message: 'OTP sent successfully. Please check your phone and verify to login.',
      // Only show OTP if MSG91 not configured
      otp: process.env.MSG91_AUTH_KEY ? undefined : otp
    });
  } catch (error) {
    logger.error('Admin login send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
});

// Verify OTP for admin login
router.post('/admin-login-verify-otp', [
  body('phone').matches(/^\d{10}$/).withMessage('Valid 10-digit phone number required'),
  body('otp').optional().isLength({ min: 4, max: 6 }).withMessage('OTP code must be 4-6 digits'),
  body('msg91Verified').optional().isBoolean().withMessage('msg91Verified must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone, otp, msg91Verified } = req.body;

    logger.info(`Admin login OTP verification attempt for ${phone}, OTP: ${otp}, msg91Verified: ${msg91Verified}`);
    
    // Check if MSG91 SDK verified the OTP
    const isMsg91Verified = msg91Verified === true || msg91Verified === 'true' || msg91Verified === 1;
    
    if (!isMsg91Verified) {
      // Standard OTP verification - verify against stored OTP
      if (!otp) {
        return res.status(400).json({
          success: false,
          message: 'OTP code is required when msg91Verified is not true.'
        });
      }
    
    // Verify against stored OTP
    if (!global.otpStore || !global.otpStore.has(phone)) {
      logger.warn(`OTP not found for phone: ${phone}`);
      return res.status(400).json({
        success: false,
        message: 'OTP not found. Please request a new OTP.'
      });
    }

    const storedData = global.otpStore.get(phone);
    
    // Check if OTP is for admin login
    if (storedData.purpose !== 'admin-login') {
      logger.warn(`OTP purpose mismatch for phone: ${phone}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please request a new admin login OTP.'
      });
    }
    
    logger.info(`Stored OTP data: ${JSON.stringify({ otp: storedData.otp, expiresAt: storedData.expiresAt, now: Date.now() })}`);
    
    if (Date.now() > storedData.expiresAt) {
      global.otpStore.delete(phone);
      logger.warn(`OTP expired for phone: ${phone}`);
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new OTP.'
      });
    }

    // Compare OTP (as strings to handle any type issues)
    const providedOtp = String(otp).trim();
    const storedOtp = String(storedData.otp).trim();
    
    logger.info(`Comparing OTP: provided="${providedOtp}", stored="${storedOtp}", match=${providedOtp === storedOtp}`);
    
    if (providedOtp !== storedOtp) {
      logger.warn(`OTP mismatch for phone: ${phone}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please check and try again.'
      });
      }
      
      // Clear OTP from store after successful verification
      global.otpStore.delete(phone);
    } else {
      // MSG91 SDK verified the OTP - skip backend OTP comparison
      logger.info(`MSG91 SDK verified OTP for admin login, phone: ${phone} - bypassing backend OTP check`);
    }

    // OTP verified - get admin details and generate login token (login is just the phone number)
    const admins = await query(
      `SELECT adminid, login, status FROM admin WHERE login = ? AND status = 'Yes'`,
      [phone]
    );

    if (admins.length === 0) {
      global.otpStore.delete(phone);
      return res.status(404).json({
        success: false,
        message: 'Admin account not found or inactive.'
      });
    }

    const admin = admins[0];

    // Generate login token
    const token = jwt.sign(
      {
        adminid: admin.adminid,
        login: admin.login,
        role: 'admin'
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    logger.info(`Admin login OTP verified successfully for phone: ${phone}, adminid: ${admin.adminid}, msg91Verified: ${isMsg91Verified}`);

    res.json({
      success: true,
      token,
      user: {
        adminid: admin.adminid,
        login: admin.login,
        role: 'admin'
      },
      message: 'Login successful'
    });
  } catch (error) {
    logger.error('Admin login verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed.',
      error: error.message
    });
  }
});

// Admin signup endpoint (phone-based with OTP verification)
router.post('/admin-signup', [
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit phone number required'),
  body('adminKey').notEmpty().withMessage('Admin key required'),
  body('msg91Verified').optional().isBoolean().withMessage('msg91Verified must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone, adminKey, msg91Verified } = req.body;

    logger.info(`Admin signup attempt for phone: ${phone}, msg91Verified: ${msg91Verified}, type: ${typeof msg91Verified}`);
    console.log(`[Admin Signup] Request body:`, { phone, adminKey: adminKey ? '***' : 'missing', msg91Verified, msg91VerifiedType: typeof msg91Verified });

    // Verify admin key FIRST (before any other checks)
    const validAdminKey = process.env.ADMIN_SIGNUP_KEY || 'ADMIN_SECRET_KEY_2024';
    if (adminKey !== validAdminKey) {
      logger.warn(`Invalid admin key provided for phone: ${phone}`);
      return res.status(403).json({
        success: false,
        message: 'Invalid admin key',
        error: 'Invalid admin key'
      });
    }

    // Check if phone already exists FIRST (before OTP check)
    // Use phone directly as login since login column is varchar(10)
    const existingAdmin = await query(
      'SELECT adminid FROM admin WHERE login = ?',
      [phone]
    );

    const existingMember = await query(
      'SELECT memberid FROM member WHERE phone = ?',
      [phone]
    );

    if (existingAdmin.length > 0 || existingMember.length > 0) {
      logger.warn(`Phone ${phone} already registered`);
      return res.status(400).json({
        success: false,
        message: 'Phone number already registered. Please sign in instead.',
        error: 'Phone number already registered'
      });
    }

    // Check if msg91Verified flag is provided (from MSG91 SDK verification)
    const isMsg91Verified = msg91Verified === true || msg91Verified === 'true' || msg91Verified === 1 || msg91Verified === '1';
    
    logger.info(`[Admin Signup] isMsg91Verified: ${isMsg91Verified}, msg91Verified: ${msg91Verified}, type: ${typeof msg91Verified}`);
    console.log(`[Admin Signup] isMsg91Verified check: ${isMsg91Verified}, msg91Verified=${msg91Verified}, type=${typeof msg91Verified}`);
    
    if (isMsg91Verified) {
      // MSG91 SDK verified the OTP - create/update OTP entry in backend store
      // Admin key and phone were already validated above
      if (!global.otpStore) {
        global.otpStore = new Map();
      }
      
      // Store admin key and mark OTP as verified for MSG91 SDK flow
      global.otpStore.set(phone, {
        phone: phone,
        adminKey: adminKey, // Store admin key for validation
        verified: true,
        verifiedAt: Date.now(),
        purpose: 'admin-signup',
        msg91Verified: true
      });
      
      logger.info(`MSG91 SDK verified OTP for admin signup, phone: ${phone}, admin key validated`);
    } else {
      // Standard OTP verification check
      if (!global.otpStore || !global.otpStore.has(phone)) {
        logger.warn(`OTP store missing for phone: ${phone}. Store keys: ${global.otpStore ? Array.from(global.otpStore.keys()).join(', ') : 'null'}`);
        return res.status(400).json({
          success: false,
          message: 'Please verify your phone number first. Please request a new OTP.',
          error: 'OTP not verified'
        });
      }

      const otpData = global.otpStore.get(phone);
      logger.info(`OTP data for admin signup: ${JSON.stringify({ verified: otpData.verified, phone: otpData.phone, purpose: otpData.purpose, hasVerified: otpData.hasOwnProperty('verified') })}`);
      
      // Check if OTP was for admin signup
      if (otpData.purpose !== 'admin-signup') {
        logger.warn(`OTP purpose mismatch for phone: ${phone}. Expected: admin-signup, Got: ${otpData.purpose}`);
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP. Please request a new admin signup OTP.',
          error: 'OTP purpose mismatch'
        });
      }
      
      // Verify admin key matches the one used during OTP generation
      if (otpData.adminKey !== adminKey) {
        logger.warn(`Admin key mismatch for phone: ${phone}`);
        return res.status(403).json({
          success: false,
          message: 'Invalid admin key',
          error: 'Admin key mismatch'
        });
      }
      
      if (!otpData.verified) {
        logger.warn(`OTP not verified for phone: ${phone}`);
        return res.status(400).json({
          success: false,
          message: 'Please verify your phone number first. Please request a new OTP.',
          error: 'OTP not verified'
        });
      }
    }
    
    logger.info(`Admin signup proceeding for phone: ${phone} (OTP verified${isMsg91Verified ? ' via MSG91 SDK' : ' via backend'})`);

    // Generate username from phone (use phone directly since login column is varchar(10))
    const username = phone; // Use phone number directly as login (10 digits fits varchar(10))
    // Generate a random password (admin can change later if needed)
    const crypto = require('crypto');
    const randomPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = crypto.createHash('sha1').update(username + randomPassword).digest('hex');

    // Create admin account (admin table doesn't have email column)
    const result = await query(
      `INSERT INTO admin (login, passwd, status, created)
       VALUES (?, ?, 'Yes', NOW())`,
      [username, hashedPassword]
    );

    const adminId = result.insertId;

    // Clear OTP from store after successful signup
    if (global.otpStore && global.otpStore.has(phone)) {
      global.otpStore.delete(phone);
      logger.info(`OTP cleared from store after successful admin signup for phone: ${phone}`);
    }

    // Generate token
    const token = jwt.sign(
      { adminid: adminId, login: username, role: 'admin' },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        adminid: adminId,
        login: username,
        phone: phone,
        role: 'admin'
      },
      message: 'Admin account created successfully!'
    });
  } catch (error) {
    logger.error('Admin signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin signup failed',
      error: error.message
    });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  // In a stateless JWT system, logout is handled client-side by removing the token
  // But we can add token blacklisting here if needed
  res.json({ success: true, message: 'Logged out successfully' });
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    
    // Verify user still exists and is active
    if (decoded.role === 'member') {
      const member = await query(
        'SELECT memberid, login, active FROM member WHERE memberid = ?',
        [decoded.memberid]
      );
      if (!member || !Array.isArray(member) || member.length === 0 || member[0].active !== 'Yes') {
        return res.status(401).json({ success: false, message: 'User not found or inactive' });
      }
    }

    res.json({ success: true, user: decoded });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Quick test login endpoints (for development/testing only)
// These bypass OTP and directly generate tokens
router.post('/test-login-member', async (req, res) => {
  try {
    // Find test member
    let members = await query(
      'SELECT memberid, login, phone, active, typeid, email, firstname, lastname FROM member WHERE phone = ? OR login = ?',
      ['9876543210', 'testuser']
    );

    // If test member doesn't exist, try to create it
    if (members.length === 0) {
      try {
        // Get a valid typeid - try def_type first, then existing members
        let typeid = null;
        const defTypes = await query('SELECT typeid FROM def_type LIMIT 1');
        if (defTypes.length > 0) {
          typeid = defTypes[0].typeid;
        } else {
          const existingMembers = await query('SELECT typeid FROM member WHERE typeid IS NOT NULL LIMIT 1');
          if (existingMembers.length > 0) {
            typeid = existingMembers[0].typeid;
          }
        }
        
        // If we have a valid typeid, create the test member
        if (typeid) {
          const bcrypt = require('bcryptjs');
          const password = await bcrypt.hash('test123', 10);
          
          await query(
            `INSERT INTO member (login, passwd, phone, firstname, lastname, email, active, sid, pid, typeid, signuptime, created)
             VALUES (?, ?, ?, 'Test', 'User', 'testuser@goldelevate.com', 'Yes', 1, 1, ?, NOW(), NOW())`,
            ['testuser', password, '9876543210', typeid]
          );
          
          // Fetch the newly created member
          members = await query(
            'SELECT memberid, login, phone, active, typeid, email, firstname, lastname FROM member WHERE phone = ? OR login = ?',
            ['9876543210', 'testuser']
          );
          
          logger.info('Test member auto-created: testuser (9876543210)');
        } else {
          return res.status(404).json({
            success: false,
            message: 'Test member not found and cannot be auto-created. Database appears to be empty. Please run database setup first.'
          });
        }
      } catch (createError) {
        logger.error('Error auto-creating test member:', createError);
        return res.status(500).json({
          success: false,
          message: 'Test member not found and failed to auto-create.',
          error: createError.message
        });
      }
    }
    
    if (members.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Test member not found. Please create test user first.'
      });
    }

    const member = members[0];
    
    if (member.active !== 'Yes') {
      return res.status(403).json({
        success: false,
        message: 'Test member account is not active.'
      });
    }

    // Determine role based on typeid
    const role = member.typeid === 7 ? 'agent' : 'member';

    // Generate login token
    const token = jwt.sign(
      {
        memberid: member.memberid,
        login: member.login,
        role: role,
        typeid: member.typeid
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    logger.info(`Test member login: ${member.login} (memberid: ${member.memberid}, role: ${role})`);

    res.json({
      success: true,
      token,
      user: {
        memberid: member.memberid,
        login: member.login,
        email: member.email || '',
        firstname: member.firstname || '',
        lastname: member.lastname || '',
        phone: member.phone,
        typeid: member.typeid,
        role: role
      },
      message: 'Test member login successful'
    });
  } catch (error) {
    logger.error('Test member login error:', error);
    res.status(500).json({
      success: false,
      message: 'Test login failed',
      error: error.message
    });
  }
});

router.post('/test-login-admin', async (req, res) => {
  try {
    // Find test admin (try phone first, then login)
    const admins = await query(
      'SELECT adminid, login, status FROM admin WHERE login = ? OR login = ?',
      ['9999999999', 'admin']
    );

    if (admins.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Test admin not found. Please create test admin first.'
      });
    }

    const admin = admins[0];
    
    if (admin.status !== 'Yes') {
      return res.status(403).json({
        success: false,
        message: 'Test admin account is not active.'
      });
    }

    // Generate admin login token
    const token = jwt.sign(
      {
        adminid: admin.adminid,
        login: admin.login,
        role: 'admin'
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    logger.info(`Test admin login: ${admin.login} (adminid: ${admin.adminid})`);

    res.json({
      success: true,
      token,
      user: {
        adminid: admin.adminid,
        login: admin.login,
        role: 'admin'
      },
      message: 'Test admin login successful'
    });
  } catch (error) {
    logger.error('Test admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Test login failed',
      error: error.message
    });
  }
});

module.exports = router;




