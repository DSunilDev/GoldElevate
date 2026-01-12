const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const { authenticate, requireMember, requireAdmin } = require('../middleware/auth');

// Get member dashboard data
router.get('/member', authenticate, requireMember, async (req, res) => {
  try {
    const memberId = req.user.memberid;

    // Get member details
    const memberResult = await query(
      `SELECT m.*, dt.name as package_name, dt.price, dt.daily_return 
       FROM member m 
       LEFT JOIN def_type dt ON m.typeid = dt.typeid 
       WHERE m.memberid = ?`,
      [memberId]
    );
    const member = Array.isArray(memberResult) && memberResult.length > 0 ? memberResult[0] : {};

    // Get total investment - only for this specific member
    const investmentResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_investment 
       FROM sale 
       WHERE memberid = ? AND paystatus = 'Delivered'`,
      [memberId]
    );
    const investment = Array.isArray(investmentResult) && investmentResult.length > 0 
      ? investmentResult[0] 
      : (investmentResult?.total_investment !== undefined ? investmentResult : { total_investment: 0 });
    
    // Debug: Log investment query result
    console.log(`[DASHBOARD] Investment query for member ${memberId}:`, {
      rawResult: investmentResult,
      parsedInvestment: investment,
      totalInvestment: investment?.total_investment || 0
    });
    
    // Also check all sales for this member to debug
    const allSalesResult = await query(
      `SELECT saleid, memberid, amount, paystatus, created 
       FROM sale 
       WHERE memberid = ? 
       ORDER BY created DESC`,
      [memberId]
    );
    console.log(`[DASHBOARD] All sales for member ${memberId}:`, allSalesResult);

    // Get total earnings wallet (accumulated daily returns and other earnings, excluding withdrawals)
    // This wallet accumulates all positive earnings including daily returns (status 'In'), weekly, monthly returns
    const earningsResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_earnings 
       FROM income_ledger 
       WHERE memberid = ? AND status IN ('In', 'Weekly', 'Monthly') AND amount > 0`,
      [memberId]
    );
    const earnings = Array.isArray(earningsResult) && earningsResult.length > 0 
      ? earningsResult[0] 
      : (earningsResult?.total_earnings !== undefined ? earningsResult : { total_earnings: 0 });

    // Get total returns received (legacy calculation - includes all positive entries)
    const returnsResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_returns 
       FROM income_ledger 
       WHERE memberid = ? AND status IN ('Weekly', 'Monthly', 'In') AND amount > 0`,
      [memberId]
    );
    const returns = Array.isArray(returnsResult) && returnsResult.length > 0 
      ? returnsResult[0] 
      : (returnsResult?.total_returns !== undefined ? returnsResult : { total_returns: 0 });

    // Get total referral bonuses (include 'direct' classify)
    const bonusesResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_bonuses 
       FROM income 
       WHERE memberid = ? AND classify = 'direct'`,
      [memberId]
    );
    const bonuses = Array.isArray(bonusesResult) && bonusesResult.length > 0 
      ? bonusesResult[0] 
      : (bonusesResult?.total_bonuses !== undefined ? bonusesResult : { total_bonuses: 0 });

    // Get current balance - get the latest ledger entry
    const balanceResult = await query(
      `SELECT ledgerid, balance, shop_balance, amount, status, remark, created
       FROM income_ledger 
       WHERE memberid = ? 
       ORDER BY ledgerid DESC LIMIT 1`,
      [memberId]
    );
    // Handle both array and object result formats
    const balance = Array.isArray(balanceResult) && balanceResult.length > 0 
      ? balanceResult[0] 
      : (balanceResult?.balance !== undefined ? balanceResult : { balance: 0, shop_balance: 0 });
    
    // If no balance entry exists, check if we need to initialize it
    if (!balance || (balance.balance === undefined && balance.balance === null)) {
      console.log(`[DASHBOARD] No balance entry found for member ${memberId}, balance will be 0`);
    }
    
    // Log the latest ledger entry for debugging
    console.log(`[DASHBOARD] Latest ledger entry for member ${memberId}:`, {
      ledgerId: balance?.ledgerid,
      balance: balance?.balance,
      amount: balance?.amount,
      status: balance?.status,
      remark: balance?.remark,
      created: balance?.created
    });

    // Calculate withdrawable balance (current balance - investment amount)
    // Only earnings can be withdrawn, not the investment
    const withdrawableBalance = Math.max(0, (balance?.balance || 0) - (investment?.total_investment || 0));

    // Get all active packages for this user (from sale table where paystatus = 'Delivered' and active = 'Yes')
    const activePackagesResult = await query(
      `SELECT s.typeid, dt.name, dt.short, dt.daily_return
       FROM sale s
       INNER JOIN def_type dt ON s.typeid = dt.typeid
       WHERE s.memberid = ? AND s.paystatus = 'Delivered' AND s.active = 'Yes'
       ORDER BY dt.price ASC`,
      [memberId]
    );
    const activePackages = Array.isArray(activePackagesResult) ? activePackagesResult : [];

    // Calculate total daily returns (sum of daily_return from all active packages)
    const totalDailyReturns = activePackages.reduce((sum, pkg) => {
      const dailyReturn = Number(pkg.daily_return) || 0;
      console.log(`[DASHBOARD] Active Package: ${pkg.name || pkg.short} (${pkg.typeid}), Daily Return: ${dailyReturn}`);
      return sum + dailyReturn;
    }, 0);
    
    console.log(`[DASHBOARD] Member ${memberId} - Active Packages: ${activePackages.length}, Total Daily Returns: ${totalDailyReturns}`);
    console.log(`[DASHBOARD] Active Packages Details:`, activePackages.map(pkg => ({
      name: pkg.name || pkg.short,
      typeid: pkg.typeid,
      daily_return: pkg.daily_return
    })));

    // Get active package names (comma-separated)
    const activePackageNames = activePackages.length > 0
      ? activePackages.map(pkg => pkg.name || pkg.short).join(', ')
      : 'No active package';

    // Get total withdrawals (only approved/finished withdrawals)
    const withdrawalsResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_withdrawals 
       FROM member_withdraw 
       WHERE memberid = ? AND status = 'finished'`,
      [memberId]
    );
    const withdrawals = Array.isArray(withdrawalsResult) && withdrawalsResult.length > 0 
      ? withdrawalsResult[0] 
      : (withdrawalsResult?.total_withdrawals !== undefined ? withdrawalsResult : { total_withdrawals: 0 });
    const totalWithdrawals = Number(withdrawals?.total_withdrawals || 0);

    // Get referral count (both active and inactive referrals)
    const referralsResult = await query(
      `SELECT COUNT(*) as count FROM member WHERE sid = ?`,
      [memberId]
    );
    const referrals = Array.isArray(referralsResult) && referralsResult.length > 0 
      ? referralsResult[0] 
      : (referralsResult?.count !== undefined ? referralsResult : { count: 0 });

    // Get recent transactions
    const transactions = await query(
      `SELECT * FROM income_ledger 
       WHERE memberid = ? 
       ORDER BY created DESC LIMIT 10`,
      [memberId]
    );

    // Get referral tree stats
    const treeStatsResult = await query(
      `SELECT 
        COUNT(CASE WHEN leg = 'L' THEN 1 END) as left_count,
        COUNT(CASE WHEN leg = 'R' THEN 1 END) as right_count,
        SUM(CASE WHEN leg = 'L' THEN 1 ELSE 0 END) as left_volume,
        SUM(CASE WHEN leg = 'R' THEN 1 ELSE 0 END) as right_volume
       FROM member WHERE sid = ?`,
      [memberId]
    );
    const treeStats = Array.isArray(treeStatsResult) && treeStatsResult.length > 0 ? treeStatsResult[0] : {};

    // Get recent income
    const recentIncome = await query(
      `SELECT * FROM income 
       WHERE memberid = ? 
       ORDER BY created DESC LIMIT 5`,
      [memberId]
    );

    // Get income breakdown
    const incomeBreakdown = await query(
      `SELECT bonusType, COALESCE(SUM(amount), 0) as total 
       FROM income_amount 
       WHERE memberid = ? AND status = 'Done'
       GROUP BY bonusType`,
      [memberId]
    );

    const breakdown = {
      direct: 0,
      binary: 0,
      team: 0,
      affiliate: 0
    };

    incomeBreakdown.forEach(item => {
      if (item.bonusType === 'Direct') breakdown.direct = item.total;
      else if (item.bonusType === 'Binary') breakdown.binary = item.total;
      else if (item.bonusType === 'Match' || item.bonusType === 'Team') breakdown.team = item.total;
      else if (item.bonusType === 'Affiliate') breakdown.affiliate = item.total;
    });

    // Calculate total balance: Total Earnings - Total Withdrawals
    const totalEarningsValue = Number(earnings?.total_earnings || 0);
    const totalWithdrawalsValue = Number(totalWithdrawals || 0);
    const totalBalance = Math.max(0, totalEarningsValue - totalWithdrawalsValue);
    
    // Calculate withdrawable balance (current balance - investment)
    // This is what's available to withdraw (earnings only, excludes investment)
    const currentBalanceValue = Number(balance?.balance || 0);
    let investmentValue = Number(investment?.total_investment || 0);
    const totalReturnsValue = Number(returns?.total_returns || 0);
    
    // Safety check: If investment is unreasonably high (greater than current balance),
    // it means the investment calculation is wrong. Use totalReturns as fallback.
    // The withdrawable balance should be approximately equal to totalReturns (earnings)
    if (investmentValue > currentBalanceValue && totalReturnsValue > 0) {
      console.warn(`[DASHBOARD] Investment (${investmentValue}) > Balance (${currentBalanceValue}), using returns-based calculation`);
      // If investment seems wrong, calculate it as: balance - returns
      // This gives us the actual investment amount
      investmentValue = Math.max(0, currentBalanceValue - totalReturnsValue);
    }
    
    const calculatedWithdrawable = Math.max(0, currentBalanceValue - investmentValue);
    
    // Log for debugging - detailed breakdown
    console.log(`[DASHBOARD API] Member ${memberId} Balance Calculation:`, {
      'Raw Balance from DB': balance?.balance,
      'Current Balance Value': currentBalanceValue,
      'Investment Value': investmentValue,
      'Withdrawable Balance (calculated)': calculatedWithdrawable,
      'Withdrawable Balance (from query)': withdrawableBalance,
      'Total Earnings (Wallet)': totalEarningsValue,
      'Total Withdrawals': totalWithdrawalsValue,
      'Total Balance (Earnings - Withdrawals)': totalBalance,
      'Shop Balance': balance?.shop_balance || 0,
      'Total Returns': returns?.total_returns || 0,
      'Total Bonuses': bonuses?.total_bonuses || 0,
      'Daily Returns (from active packages)': totalDailyReturns,
      'Active Packages': activePackageNames,
      'Active Package Count': activePackages.length,
      'Referral Count': referrals?.count || 0,
      'Package Name (legacy)': member?.package_name || 'N/A',
      'Member Active': member?.active || 'No',
      'Latest Ledger Entry': balance ? {
        balance: balance.balance,
        amount: balance.amount,
        status: balance.status,
        remark: balance.remark
      } : 'No entry found'
    });
    
    res.json({
      success: true,
      data: {
        member: member || {},
        stats: {
          // Total Balance = Total Earnings - Total Withdrawals (what's currently available after all withdrawals)
          totalBalance: Number(totalBalance),
          // Withdrawable Balance = Current Balance - Investment (earnings only, what can be withdrawn)
          withdrawableBalance: Number(calculatedWithdrawable),
          totalInvestment: Number(investmentValue),
          totalReturns: Number(returns?.total_returns || 0),
          totalBonuses: Number(bonuses?.total_bonuses || 0),
          dailyReturns: Number(totalDailyReturns), // Sum of daily returns from all active packages
          currentBalance: Number(currentBalanceValue), // Current balance from ledger (for reference)
          totalWithdrawals: Number(totalWithdrawalsValue), // Total withdrawals (for reference)
          shopBalance: Number(balance?.shop_balance || 0),
          referralCount: Number(referrals?.count || 0),
          rewardPoints: Number(member?.reward_points || 0),
          activePackageNames: activePackageNames, // All active package names comma-separated
          totalEarnings: Number(totalEarningsValue) // Total earnings wallet (accumulates daily returns + weekly + monthly earnings)
        },
        incomeBreakdown: breakdown,
        treeStats: treeStats || {},
        recentTransactions: transactions || [],
        recentIncome: recentIncome || []
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

// Get admin dashboard data
router.get('/admin', authenticate, requireAdmin, async (req, res) => {
  try {
    // Total members
    const [totalMembers] = await query(`SELECT COUNT(*) as count FROM member WHERE active = 'Yes'`);
    
    // Total investments
    const [totalInvestments] = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM sale WHERE paystatus = 'Delivered'`
    );
    
    // Total returns paid (total earnings credited to all members - daily returns + weekly + monthly)
    const [totalReturns] = await query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM income_ledger 
       WHERE status IN ('In', 'Weekly', 'Monthly') AND amount > 0`
    );
    
    // Pending approvals (member signups or payments waiting for approval)
    let pendingApprovals = 0;
    try {
      const pendingApprovalsResult = await query(
        `SELECT COUNT(*) as count FROM member WHERE active = 'No'`
      );
      pendingApprovals = pendingApprovalsResult && Array.isArray(pendingApprovalsResult) && pendingApprovalsResult.length > 0 
        ? (pendingApprovalsResult[0].count || pendingApprovalsResult[0].COUNT || 0)
        : 0;
    } catch (error) {
      // Fallback: use pending payments if member_signup doesn't exist
      const pendingPaymentsCheck = await query(
        `SELECT COUNT(*) as count FROM upi_payment WHERE status = 'Pending'`
      );
      pendingApprovals = pendingPaymentsCheck && Array.isArray(pendingPaymentsCheck) && pendingPaymentsCheck.length > 0 
        ? (pendingPaymentsCheck[0].count || pendingPaymentsCheck[0].COUNT || 0)
        : 0;
    }
    
    // Pending payments
    const pendingPaymentsResult = await query(
      `SELECT COUNT(*) as count FROM upi_payment WHERE status = 'Pending'`
    );
    const pendingPayments = Array.isArray(pendingPaymentsResult) && pendingPaymentsResult.length > 0
      ? (pendingPaymentsResult[0].count || pendingPaymentsResult[0].COUNT || 0)
      : (pendingPaymentsResult?.count || pendingPaymentsResult?.COUNT || 0);
    
    // Pending withdrawals
    const pendingWithdrawalsResult = await query(
      `SELECT COUNT(*) as count FROM member_withdraw WHERE status IN ('apply', 'pending', 'processing')`
    );
    const pendingWithdrawals = Array.isArray(pendingWithdrawalsResult) && pendingWithdrawalsResult.length > 0
      ? (pendingWithdrawalsResult[0].count || pendingWithdrawalsResult[0].COUNT || 0)
      : (pendingWithdrawalsResult?.count || pendingWithdrawalsResult?.COUNT || 0);
    
    // Recent signups
    const recentSignups = await query(
      `SELECT * FROM member ORDER BY created DESC LIMIT 10`
    );
    
    // Top earners (total earnings from income_ledger - daily returns + weekly + monthly)
    const topEarners = await query(
      `SELECT m.memberid, m.login, m.firstname, m.lastname, 
       COALESCE(SUM(il.amount), 0) as total_earnings
       FROM member m
       LEFT JOIN income_ledger il ON m.memberid = il.memberid
       WHERE il.status IN ('In', 'Weekly', 'Monthly') AND il.amount > 0
       GROUP BY m.memberid
       ORDER BY total_earnings DESC
       LIMIT 10`
    );

    res.json({
      success: true,
      data: {
        stats: {
          totalMembers: Array.isArray(totalMembers) ? (totalMembers[0]?.count || totalMembers[0]?.COUNT || 0) : (totalMembers?.count || totalMembers?.COUNT || 0),
          totalInvestments: Array.isArray(totalInvestments) ? (totalInvestments[0]?.total || 0) : (totalInvestments?.total || 0),
          totalReturns: Array.isArray(totalReturns) ? (totalReturns[0]?.total || 0) : (totalReturns?.total || 0),
          pendingApprovals: Number(pendingApprovals) || 0,
          pendingPayments: Number(pendingPayments) || 0,
          pendingWithdraws: Number(pendingWithdrawals) || 0
        },
        recentSignups,
        topEarners
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin dashboard data',
      error: error.message
    });
  }
});

module.exports = router;




