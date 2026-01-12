const mysql = require('mysql2/promise');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Create connection pool for better performance
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'gold_user',
  password: process.env.DB_PASSWORD || 'gold123',
  database: process.env.DB_NAME || 'gold_investment',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

const pool = mysql.createPool(dbConfig);

// Test database connection
pool.getConnection()
  .then(connection => {
    logger.info('✅ Database connected successfully');
    connection.release();
  })
  .catch(err => {
    logger.error('❌ Database connection failed:', err);
    logger.error('💡 Tip: Create a .env file in the backend directory with:');
    logger.error('   DB_HOST=localhost');
    logger.error('   DB_USER=gold_user');
    logger.error('   DB_PASSWORD=gold123');
    logger.error('   DB_NAME=gold_investment');
    logger.error('   Or set DB_PASSWORD environment variable when starting the server');
    // Don't exit immediately - allow server to start and retry
    // process.exit(1);
  });

// Helper function to execute queries with error handling
const query = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    logger.error('Database query error:', { sql, params, error: error.message });
    throw error;
  }
};

// Helper function for transactions
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    logger.error('Transaction error:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Data integrity check function
const checkDataIntegrity = async () => {
  try {
    // Check for orphaned records
    const orphanedMembers = await query(`
      SELECT m.memberid, m.sid, m.pid 
      FROM member m 
      LEFT JOIN member s ON m.sid = s.memberid 
      WHERE m.sid != 1 AND s.memberid IS NULL
    `);
    
    if (orphanedMembers.length > 0) {
      logger.warn(`Found ${orphanedMembers.length} orphaned member records`);
    }
    
    // Check for negative balances
    const negativeBalances = await query(`
      SELECT memberid, balance, shop_balance 
      FROM income_ledger 
      WHERE balance < 0 OR shop_balance < 0
      ORDER BY created DESC
      LIMIT 10
    `);
    
    if (negativeBalances.length > 0) {
      logger.warn(`Found ${negativeBalances.length} records with negative balances`);
    }
    
    // Check for missing package references
    const missingPackages = await query(`
      SELECT m.memberid, m.typeid 
      FROM member m 
      LEFT JOIN def_type dt ON m.typeid = dt.typeid 
      WHERE dt.typeid IS NULL
    `);
    
    if (missingPackages.length > 0) {
      logger.warn(`Found ${missingPackages.length} members with invalid package types`);
    }
    
    return {
      orphanedMembers: orphanedMembers.length,
      negativeBalances: negativeBalances.length,
      missingPackages: missingPackages.length,
      status: 'healthy'
    };
  } catch (error) {
    logger.error('Data integrity check failed:', error);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  transaction,
  checkDataIntegrity,
  logger
};




