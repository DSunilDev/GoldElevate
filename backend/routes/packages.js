const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { logger } = require('../config/database');

// Get all packages (including Elite and Ultimate)
router.get('/', async (req, res) => {
  try {
    // Get all packages including Elite (typeid 7) and Ultimate (typeid 8) if they exist
    // Otherwise return default 6 packages
    let packages = await query(
      'SELECT typeid, short, name, price, bv, daily_return, yes21, c_upper FROM def_type ORDER BY price'
    );
    
    // If Elite and Ultimate don't exist, add them dynamically
    const hasElite = packages.some(p => p.typeid === 7);
    const hasUltimate = packages.some(p => p.typeid === 8);
    
    if (!hasElite) {
      packages.push({
        typeid: 7,
        short: 'Elite',
        name: 'Elite Investment Package',
        price: 400000,
        bv: 400000,
        daily_return: 12000,
        yes21: 'Yes',
        c_upper: 10000
      });
    }
    
    if (!hasUltimate) {
      packages.push({
        typeid: 8,
        short: 'Ultimate',
        name: 'Ultimate Investment Package',
        price: 800000,
        bv: 800000,
        daily_return: 20000,
        yes21: 'Yes',
        c_upper: 10000
      });
    }
    
    // Calculate referral bonus (20% of price)
    packages = packages.map(pkg => ({
      ...pkg,
      referral_bonus: Math.round(pkg.price * 0.2),
      premium: pkg.typeid >= 7
    }));
    
    res.json({ success: true, data: packages.sort((a, b) => a.price - b.price) });
  } catch (error) {
    logger.error('Error fetching packages:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch packages' });
  }
});

// Get package by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const packages = await query(
      'SELECT typeid, short, name, price, bv, daily_return, yes21, c_upper FROM def_type WHERE typeid = ?',
      [id]
    );
    if (!packages || !Array.isArray(packages) || packages.length === 0) {
      return res.status(404).json({ success: false, error: 'Package not found' });
    }
    res.json({ success: true, data: packages[0] });
  } catch (error) {
    logger.error('Error fetching package:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch package' });
  }
});

// Admin: Update package (edit)
router.put('/:id', authenticate, requireAdmin, [
  body('name').optional().isString().withMessage('Name must be a string'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('bv').optional().isFloat({ min: 0 }).withMessage('BV must be a positive number'),
  body('daily_return').optional().isFloat({ min: 0 }).withMessage('Daily return must be a positive number'),
  body('c_upper').optional().isInt({ min: 0 }).withMessage('C upper must be a positive integer'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { name, price, bv, daily_return, c_upper, yes21 } = req.body;

    // Check if package exists
    const existing = await query('SELECT typeid FROM def_type WHERE typeid = ?', [id]);
    if (!existing || !Array.isArray(existing) || existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Package not found' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      values.push(price);
    }
    if (bv !== undefined) {
      updates.push('bv = ?');
      values.push(bv);
    }
    if (daily_return !== undefined) {
      updates.push('daily_return = ?');
      values.push(daily_return);
    }
    if (c_upper !== undefined) {
      updates.push('c_upper = ?');
      values.push(c_upper);
    }
    if (yes21 !== undefined) {
      updates.push('yes21 = ?');
      values.push(yes21);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    values.push(id);
    await query(
      `UPDATE def_type SET ${updates.join(', ')} WHERE typeid = ?`,
      values
    );

    logger.info(`Package ${id} updated by admin`);
    res.json({ success: true, message: 'Package updated successfully' });
  } catch (error) {
    logger.error('Error updating package:', error);
    res.status(500).json({ success: false, error: 'Failed to update package' });
  }
});

// Admin: Create new package
router.post('/', authenticate, requireAdmin, [
  body('short').isString().notEmpty().withMessage('Short name is required'),
  body('name').isString().notEmpty().withMessage('Name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('bv').isFloat({ min: 0 }).withMessage('BV must be a positive number'),
  body('daily_return').isFloat({ min: 0 }).withMessage('Daily return must be a positive number'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { short, name, price, bv, daily_return, c_upper = 0, yes21 = 'No' } = req.body;

    // Get next typeid
    const [maxId] = await query('SELECT MAX(typeid) as maxId FROM def_type');
    const nextId = (maxId[0]?.maxId || 0) + 1;

    await query(
      `INSERT INTO def_type (typeid, short, name, price, bv, daily_return, yes21, c_upper)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nextId, short, name, price, bv, daily_return, yes21, c_upper]
    );

    logger.info(`New package created by admin: ${name}`);
    res.json({ success: true, message: 'Package created successfully', data: { typeid: nextId } });
  } catch (error) {
    logger.error('Error creating package:', error);
    res.status(500).json({ success: false, error: 'Failed to create package' });
  }
});

module.exports = router;
