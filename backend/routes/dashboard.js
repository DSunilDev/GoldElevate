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

    // Get total returns received (include all 'In' status entries for daily returns)
    const returnsResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_returns 
       FROM income_ledger 
       WHERE memberid = ? AND status IN ('Weekly', 'Monthly', 'Withdraw', 'In') AND amount > 0`,
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

    // Get referral count
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

    // Calculate total balance (earnings only, excluding investment)
    // Total Balance = Current Balance - Investment = Withdrawable Balance
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
      'Shop Balance': balance?.shop_balance || 0,
      'Total Returns': returns?.total_returns || 0,
      'Total Bonuses': bonuses?.total_bonuses || 0,
      'Package Name': member?.package_name || 'N/A',
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
          // Total Balance = Current Balance from ledger (actual balance that reduces on withdrawal)
          totalBalance: Number(currentBalanceValue),
          // Withdrawable Balance = Current Balance - Investment (earnings only, what can be withdrawn)
          withdrawableBalance: Number(calculatedWithdrawable),
          totalInvestment: Number(investmentValue),
          totalReturns: Number(returns?.total_returns || 0),
          totalBonuses: Number(bonuses?.total_bonuses || 0),
          dailyReturns: Number(member?.daily_return || 0),
          currentBalance: Number(currentBalanceValue), // Same as totalBalance for consistency
          shopBalance: Number(balance?.shop_balance || 0),
          referralCount: Number(referrals?.count || 0),
          rewardPoints: Number(member?.reward_points || 0)
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
    
    // Total returns paid
    const [totalReturns] = await query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM income_ledger WHERE status IN ('Weekly', 'Monthly', 'Withdraw')`
    );
    
    // Pending approvals
    const [pendingApprovals] = await query(
      `SELECT COUNT(*) as count FROM member_signup WHERE status = 'Wait'`
    );
    
    // Recent signups
    const recentSignups = await query(
      `SELECT * FROM member ORDER BY created DESC LIMIT 10`
    );
    
    // Top earners
    const topEarners = await query(
      `SELECT m.memberid, m.login, m.firstname, m.lastname, 
       COALESCE(SUM(il.amount), 0) as total_earnings
       FROM member m
       LEFT JOIN income_ledger il ON m.memberid = il.memberid
       WHERE il.status IN ('Weekly', 'Monthly', 'Withdraw')
       GROUP BY m.memberid
       ORDER BY total_earnings DESC
       LIMIT 10`
    );

    res.json({
      success: true,
      data: {
        stats: {
          totalMembers: totalMembers.count,
          totalInvestments: totalInvestments.total,
          totalReturns: totalReturns.total,
          pendingApprovals: pendingApprovals.count
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




