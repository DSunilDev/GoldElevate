const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../config/database');

const execAsync = promisify(exec);

const backupDatabase = async () => {
  try {
    const backupDir = path.join(__dirname, '../backups');
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'gold_user',
      password: process.env.DB_PASSWORD || 'gold123',
      database: process.env.DB_NAME || 'gold_investment'
    };

    const command = `mysqldump -h ${dbConfig.host} -u ${dbConfig.user} -p${dbConfig.password} ${dbConfig.database} > ${backupFile}`;

    await execAsync(command);

    // Clean old backups
    const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
    await cleanOldBackups(backupDir, retentionDays);

    logger.info(`Backup created: ${backupFile}`);
    return backupFile;
  } catch (error) {
    logger.error('Backup failed:', error);
    throw error;
  }
};

const cleanOldBackups = async (backupDir, retentionDays) => {
  try {
    const files = await fs.readdir(backupDir);
    const now = Date.now();
    const maxAge = retentionDays * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stats = await fs.stat(filePath);
      const age = now - stats.mtimeMs;

      if (age > maxAge) {
        await fs.unlink(filePath);
        logger.info(`Deleted old backup: ${file}`);
      }
    }
  } catch (error) {
    logger.error('Failed to clean old backups:', error);
  }
};

module.exports = {
  backupDatabase,
  cleanOldBackups
};




