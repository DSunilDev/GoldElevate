require('dotenv').config();
const { query, transaction } = require('../config/database');
const { logger } = require('../config/database');

/**
 * Script to reconcile and update income_ledger for all users
 * Based on their sales (active packages) and withdrawals
 * 
 * This script:
 * 1. Gets all users with active packages
 * 2. Calculates daily returns that should have been credited based on activation dates
 * 3. Gets actual withdrawals from member_withdraw
 * 4. Rebuilds income_ledger entries to match the correct balance
 */

async function reconcileIncomeLedger() {
  let connection;
  
  try {
    console.log('🔄 Starting income ledger reconciliation...\n');
    
    // Get all members with active packages
    const membersWithPackages = await query(
      `SELECT DISTINCT s.memberid, m.login, m.phone, m.firstname, m.lastname
       FROM sale s
       INNER JOIN member m ON s.memberid = m.memberid
       WHERE s.paystatus = 'Delivered' 
         AND s.active = 'Yes'
         AND s.activated_at IS NOT NULL
       ORDER BY s.memberid`
    );

    if (!membersWithPackages || membersWithPackages.length === 0) {
      console.log('❌ No members with active packages found');
      return;
    }

    console.log(`📊 Found ${membersWithPackages.length} members with active packages\n`);

    let processedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const member of membersWithPackages) {
      try {
        const memberId = member.memberid;
        console.log(`\n👤 Processing Member ${memberId} (${member.login || member.phone || 'N/A'})...`);

        // Get all active packages for this member
        const activePackages = await query(
          `SELECT 
            s.saleid,
            s.typeid,
            s.activated_at,
            s.created as sale_created,
            dt.name as package_name,
            dt.daily_return
           FROM sale s
           INNER JOIN def_type dt ON s.typeid = dt.typeid
           WHERE s.memberid = ? 
             AND s.paystatus = 'Delivered' 
             AND s.active = 'Yes'
             AND s.activated_at IS NOT NULL
             AND dt.daily_return > 0
           ORDER BY s.activated_at ASC`,
          [memberId]
        );

        if (!activePackages || activePackages.length === 0) {
          console.log(`  ⚠️  No active packages found for member ${memberId}`);
          continue;
        }

        console.log(`  📦 Found ${activePackages.length} active package(s)`);

        // Get withdrawals for this member
        const withdrawals = await query(
          `SELECT id, amount, status, created
           FROM member_withdraw
           WHERE memberid = ? AND status = 'finished'
           ORDER BY created ASC`,
          [memberId]
        );

        const totalWithdrawals = withdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0);
        console.log(`  💸 Total withdrawals: ₹${totalWithdrawals.toLocaleString()}`);

        // Calculate expected daily returns credits
        const now = new Date();
        let totalExpectedCredits = 0;
        const dailyCredits = [];

        for (const pkg of activePackages) {
          const activatedAt = new Date(pkg.activated_at);
          const dailyReturn = Number(pkg.daily_return || 0);
          
          // Calculate days from activation to now
          // Daily returns are credited at the exact activation time each day
          // So we need to count full days since activation
          
          const activationDate = new Date(activatedAt);
          activationDate.setHours(0, 0, 0, 0); // Start of activation day
          
          const todayDate = new Date(now);
          todayDate.setHours(0, 0, 0, 0); // Start of today
          
          // Calculate difference in days
          const diffTime = todayDate - activationDate;
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          // Check if today's activation time has already passed
          const activationTimeToday = new Date(todayDate);
          activationTimeToday.setHours(activatedAt.getHours(), activatedAt.getMinutes(), activatedAt.getSeconds(), activatedAt.getMilliseconds());
          
          const todayHasPassed = now >= activationTimeToday;
          
          // If activation time today has passed, include today; otherwise exclude it
          const daysToCredit = todayHasPassed && diffDays >= 0 ? diffDays + 1 : Math.max(0, diffDays);
          
          const expectedCredits = daysToCredit * dailyReturn;
          totalExpectedCredits += expectedCredits;

          dailyCredits.push({
            saleid: pkg.saleid,
            packageName: pkg.package_name,
            dailyReturn: dailyReturn,
            activatedAt: activatedAt,
            daysToCredit: daysToCredit,
            totalCredits: expectedCredits
          });

          console.log(`    - ${pkg.package_name}: ₹${dailyReturn}/day × ${daysToCredit} days = ₹${expectedCredits.toLocaleString()}`);
        }

        console.log(`  💰 Total expected credits: ₹${totalExpectedCredits.toLocaleString()}`);

        // Get current income_ledger entries
        const currentEntries = await query(
          `SELECT * FROM income_ledger 
           WHERE memberid = ? 
           ORDER BY created ASC, ledgerid ASC`,
          [memberId]
        );

        // Calculate what the current balance should be
        const expectedBalance = Math.max(0, totalExpectedCredits - totalWithdrawals);
        
        // Get actual current balance
        const latestEntry = currentEntries && currentEntries.length > 0 
          ? currentEntries[currentEntries.length - 1] 
          : null;
        const actualBalance = latestEntry ? Number(latestEntry.balance || 0) : 0;

        console.log(`  📊 Expected balance: ₹${expectedBalance.toLocaleString()}`);
        console.log(`  📊 Actual balance: ₹${actualBalance.toLocaleString()}`);
        
        const difference = expectedBalance - actualBalance;
        if (Math.abs(difference) > 0.01) {
          console.log(`  ⚠️  Balance mismatch: ₹${difference.toLocaleString()}`);
        } else {
          console.log(`  ✅ Balance matches`);
        }

        // Ask user if they want to rebuild (for safety, we'll log first)
        // In production, you might want to add a dry-run mode
        
        // Option 1: Rebuild completely (delete old entries and create new)
        // Option 2: Just add missing credits (safer, incremental)
        
        // For now, let's use Option 2: Add missing credits
        // This is safer as it doesn't delete existing data
        
        let needsUpdate = false;
        
        // Check which daily credits are missing
        for (const credit of dailyCredits) {
          if (credit.daysToCredit <= 0) continue; // Package just activated today, no credits yet
          
          // Check if credits exist for this package
          const existingCredits = currentEntries.filter(entry => 
            entry.status === 'In' && 
            entry.remark && 
            entry.remark.includes(`Sale ID: ${credit.saleid}`)
          );
          
          const totalCredited = existingCredits.reduce((sum, e) => sum + Number(e.amount || 0), 0);
          
          if (totalCredited < credit.totalCredits) {
            needsUpdate = true;
            const missing = credit.totalCredits - totalCredited;
            console.log(`    ⚠️  Missing ₹${missing.toLocaleString()} for ${credit.packageName} (Sale ID: ${credit.saleid})`);
          }
        }
        
        if (!needsUpdate && Math.abs(difference) < 0.01) {
          console.log(`  ✅ Member ${memberId} is already up to date`);
          processedCount++;
          continue;
        }

        // Rebuild income_ledger for this member
        await transaction(async (conn) => {
          // Get initial balance (or 0)
          let runningBalance = 0;
          let weekid = 0;

          // Get existing balance to preserve any non-daily-return entries
          const existingBalance = await conn.execute(
            `SELECT balance, weekid FROM income_ledger 
             WHERE memberid = ? 
             ORDER BY ledgerid DESC LIMIT 1`,
            [memberId]
          );
          
          if (existingBalance[0] && existingBalance[0].length > 0) {
            runningBalance = Number(existingBalance[0][0].balance || 0);
            weekid = Number(existingBalance[0][0].weekid || 0);
          }

          // For now, let's just add missing daily return credits
          // This is safer than rebuilding everything
          
          // Calculate what should be the correct balance
          const correctBalance = Math.max(0, totalExpectedCredits - totalWithdrawals);
          
          // If there's a significant difference, add an adjustment entry
          if (Math.abs(correctBalance - runningBalance) > 0.01) {
            const adjustment = correctBalance - runningBalance;
            runningBalance = correctBalance;
            
            await conn.execute(
              `INSERT INTO income_ledger 
               (memberid, weekid, amount, balance, status, remark, created)
               VALUES (?, ?, ?, ?, 'Other', ?, NOW())`,
              [
                memberId,
                weekid,
                adjustment,
                runningBalance,
                `Balance reconciliation - Expected: ₹${totalExpectedCredits.toLocaleString()}, Withdrawals: ₹${totalWithdrawals.toLocaleString()}`
              ]
            );
            
            console.log(`  ✅ Added reconciliation entry: ₹${adjustment.toLocaleString()}`);
          }

          // Add missing daily return credits for each package
          for (const credit of dailyCredits) {
            if (credit.daysToCredit <= 0) continue;
            
            // Check existing credits for this package
            const existingCredits = currentEntries.filter(entry => 
              entry.status === 'In' && 
              entry.remark && 
              entry.remark.includes(`Sale ID: ${credit.saleid}`)
            );
            
            const totalCredited = existingCredits.reduce((sum, e) => sum + Number(e.amount || 0), 0);
            const missingCredits = credit.totalCredits - totalCredited;
            
            if (missingCredits > 0.01) {
              // Add missing credits as a single entry (simplified)
              runningBalance += missingCredits;
              
              await conn.execute(
                `INSERT INTO income_ledger 
                 (memberid, weekid, amount, balance, status, remark, created)
                 VALUES (?, ?, ?, ?, 'In', ?, NOW())`,
                [
                  memberId,
                  weekid,
                  missingCredits,
                  runningBalance,
                  `Daily return reconciliation - Package: ${credit.packageName} (Sale ID: ${credit.saleid}) - ${credit.daysToCredit} days`
                ]
              );
              
              console.log(`  ✅ Added missing credits: ₹${missingCredits.toLocaleString()} for ${credit.packageName}`);
            }
          }
        });

        updatedCount++;
        processedCount++;
        console.log(`  ✅ Member ${memberId} reconciled successfully`);

      } catch (error) {
        errorCount++;
        console.error(`  ❌ Error processing member ${member.memberid}:`, error.message);
        logger.error(`[RECONCILE] Error for member ${member.memberid}:`, error);
      }
    }

    console.log(`\n\n✅ Reconciliation completed!`);
    console.log(`   Processed: ${processedCount} members`);
    console.log(`   Updated: ${updatedCount} members`);
    console.log(`   Errors: ${errorCount} members`);

  } catch (error) {
    console.error('❌ Fatal error in reconciliation:', error);
    logger.error('[RECONCILE] Fatal error:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  reconcileIncomeLedger()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { reconcileIncomeLedger };
