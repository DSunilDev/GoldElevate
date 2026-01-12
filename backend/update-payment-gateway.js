require('dotenv').config();
const { query } = require('./config/database');

async function updatePaymentGateway() {
  try {
    console.log('🔧 Updating payment gateway settings...\n');

    const upiId = 'joysreesinha03@oksbi';
    
    // Check if table exists and has any records
    let existing = [];
    try {
      existing = await query(
        'SELECT id FROM payment_gateway_settings ORDER BY id DESC LIMIT 1'
      );
    } catch (tableError) {
      // Table might not exist, create it first
      console.log('📦 Creating payment_gateway_settings table...');
      await query(`
        CREATE TABLE IF NOT EXISTS payment_gateway_settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          upi_id VARCHAR(255) NOT NULL DEFAULT 'joysreesinha03@oksbi',
          qr_code_url VARCHAR(500) DEFAULT '/images/upi-qr.jpg',
          qr_code_base64 TEXT,
          bank_account_number VARCHAR(50),
          bank_ifsc_code VARCHAR(20),
          bank_name VARCHAR(255),
          account_holder_name VARCHAR(255),
          gpay_merchant_id VARCHAR(255),
          phonepe_merchant_id VARCHAR(255),
          gpay_enabled ENUM('Yes', 'No') DEFAULT 'Yes',
          phonepe_enabled ENUM('Yes', 'No') DEFAULT 'Yes',
          updated_by VARCHAR(100),
          created DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8
      `);
      console.log('✅ Table created');
    }

    if (existing && existing.length > 0) {
      // Update existing record
      await query(
        'UPDATE payment_gateway_settings SET upi_id = ?, updated_by = ? WHERE id = ?',
        [upiId, 'admin', existing[0].id]
      );
      console.log('✅ Payment gateway settings updated!');
      console.log(`   UPI ID: ${upiId}`);
    } else {
      // Insert new record
      await query(
        `INSERT INTO payment_gateway_settings 
         (upi_id, gpay_enabled, phonepe_enabled, updated_by)
         VALUES (?, 'Yes', 'Yes', ?)`,
        [upiId, 'admin']
      );
      console.log('✅ Payment gateway settings created!');
      console.log(`   UPI ID: ${upiId}`);
    }

    // Verify the update
    const settings = await query(
      'SELECT upi_id, gpay_enabled, phonepe_enabled FROM payment_gateway_settings ORDER BY id DESC LIMIT 1'
    );
    
    if (settings && settings.length > 0) {
      console.log('\n📋 Current Settings:');
      console.log(`   UPI ID: ${settings[0].upi_id}`);
      console.log(`   GPay Enabled: ${settings[0].gpay_enabled}`);
      console.log(`   PhonePe Enabled: ${settings[0].phonepe_enabled}`);
    }

    console.log('\n✅ Payment gateway configured successfully!');
  } catch (error) {
    console.error('❌ Error updating payment gateway:', error);
    process.exit(1);
  }
}

updatePaymentGateway().then(() => {
  process.exit(0);
});

