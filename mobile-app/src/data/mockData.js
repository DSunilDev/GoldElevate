// Mock Data for Testing and Development

export const mockPackages = [
  {
    id: 1,
    name: 'Starter',
    price: 5000,
    daily_return: 200,
    referral_bonus: 1000,
    description: 'Perfect for beginners',
  },
  {
    id: 2,
    name: 'Intermediate',
    price: 10000,
    daily_return: 400,
    referral_bonus: 2000,
    description: 'For growing investors',
  },
  {
    id: 3,
    name: 'Expert',
    price: 20000,
    daily_return: 800,
    referral_bonus: 4000,
    description: 'For experienced investors',
  },
  {
    id: 4,
    name: 'Master',
    price: 40000,
    daily_return: 1600,
    referral_bonus: 8000,
    description: 'Premium investment plan',
  },
  {
    id: 5,
    name: 'Brahmastra',
    price: 50000,
    daily_return: 2000,
    referral_bonus: 10000,
    description: 'Powerful investment option',
  },
  {
    id: 6,
    name: 'Premium',
    price: 80000,
    daily_return: 2600,
    referral_bonus: 16000,
    description: 'Elite investment plan',
  },
  {
    id: 7,
    name: 'Elite',
    price: 400000,
    daily_return: 12000,
    referral_bonus: 80000,
    description: 'Premium elite package',
    premium: true,
  },
  {
    id: 8,
    name: 'Ultimate',
    price: 800000,
    daily_return: 20000,
    referral_bonus: 160000,
    description: 'Ultimate investment package',
    premium: true,
  },
];

export const mockDashboard = {
  stats: {
    totalBalance: 12500,
    totalInvestment: 5000,
    totalReturns: 7500,
    totalBonuses: 3000,
    dailyReturns: 200,
    currentBalance: 10000,
    shopBalance: 2500,
    referralCount: 5,
    rewardPoints: 150,
  },
  incomeBreakdown: {
    direct: 7000,
    binary: 1250,
    team: 300,
    affiliate: 1950,
  },
  treeStats: {
    left_count: 3,
    right_count: 2,
    left_volume: 15000,
    right_volume: 10000,
  },
  recentTransactions: [
    {
      ledgerid: 1,
      amount: 200,
      balance: 10200,
      status: 'Weekly',
      created: '2024-12-20',
      remark: 'Daily return',
    },
    {
      ledgerid: 2,
      amount: 1000,
      balance: 11200,
      status: 'Weekly',
      created: '2024-12-19',
      remark: 'Referral bonus',
    },
  ],
  recentIncome: [
    {
      incomeid: 1,
      amount: 1000,
      classify: 'direct',
      created: '2024-12-19',
      refid: 2,
    },
    {
      incomeid: 2,
      amount: 200,
      classify: 'binary',
      created: '2024-12-18',
      refid: 0,
    },
  ],
};

export const mockReferrals = [
  {
    memberid: 2,
    login: 'rajesh123',
    firstname: 'Rajesh',
    lastname: 'Kumar',
    email: 'rajesh@example.com',
    typeid: 1,
    package_name: 'Starter',
    price: 5000,
    active: 'Yes',
    signuptime: '2024-01-15',
    downline_count: 2,
  },
  {
    memberid: 3,
    login: 'priya456',
    firstname: 'Priya',
    lastname: 'Sharma',
    email: 'priya@example.com',
    typeid: 2,
    package_name: 'Intermediate',
    price: 10000,
    active: 'Yes',
    signuptime: '2024-01-20',
    downline_count: 1,
  },
  {
    memberid: 4,
    login: 'amit789',
    firstname: 'Amit',
    lastname: 'Singh',
    email: 'amit@example.com',
    typeid: 1,
    package_name: 'Starter',
    price: 5000,
    active: 'Yes',
    signuptime: '2024-01-25',
    downline_count: 0,
  },
];

export const mockReferralStats = {
  total_referrals: 3,
  active_referrals: 3,
  left_leg: 2,
  right_leg: 1,
  total_volume: 20000,
  totalBonuses: 3000,
};

export const mockIncome = [
  {
    incomeid: 1,
    memberid: 1,
    classify: 'direct',
    amount: 1000,
    weekid: 1,
    refid: 2,
    created: '2024-12-19',
    paystatus: 'paid',
  },
  {
    incomeid: 2,
    memberid: 1,
    classify: 'binary',
    amount: 500,
    weekid: 1,
    refid: 0,
    created: '2024-12-18',
    paystatus: 'paid',
  },
  {
    incomeid: 3,
    memberid: 1,
    classify: 'affiliate',
    amount: 750,
    weekid: 1,
    refid: 2,
    created: '2024-12-17',
    paystatus: 'paid',
  },
];

export const mockTransactions = [
  {
    ledgerid: 1,
    memberid: 1,
    amount: 200,
    balance: 10200,
    shop_balance: 2500,
    status: 'Weekly',
    created: '2024-12-20',
    remark: 'Daily return',
  },
  {
    ledgerid: 2,
    memberid: 1,
    amount: 1000,
    balance: 11200,
    shop_balance: 2500,
    status: 'Weekly',
    created: '2024-12-19',
    remark: 'Referral bonus from Rajesh',
  },
  {
    ledgerid: 3,
    memberid: 1,
    amount: -5000,
    balance: 6200,
    shop_balance: 2500,
    status: 'In',
    created: '2024-12-15',
    remark: 'Investment - Starter Package',
  },
];

export const mockPayments = [
  {
    upipaymentid: 1,
    saleid: 1,
    memberid: 1,
    amount: 5000,
    upi_reference: 'UPI123456789',
    transaction_id: 'UPI1702123456789',
    status: 'Verified',
    created: '2024-12-15',
    verified_at: '2024-12-15',
    verified_by: 'admin',
  },
];

export const mockAdminDashboard = {
  stats: {
    totalMembers: 150,
    totalInvestments: 5000000,
    totalReturns: 2500000,
    pendingApprovals: 5,
    pendingPayments: 8,
  },
  recentSignups: [
    {
      memberid: 10,
      login: 'newuser1',
      firstname: 'New',
      lastname: 'User',
      email: 'newuser1@example.com',
      created: '2024-12-22',
      active: 'Wait',
    },
  ],
  topEarners: [
    {
      memberid: 1,
      login: 'user1',
      firstname: 'Top',
      lastname: 'Earner',
      total_earnings: 50000,
    },
  ],
};

export const mockAdminMembers = [
  {
    memberid: 1,
    login: 'user1',
    email: 'user1@example.com',
    firstname: 'John',
    lastname: 'Doe',
    typeid: 1,
    package_name: 'Starter',
    active: 'Yes',
    created: '2024-01-10',
  },
  {
    memberid: 2,
    login: 'rajesh123',
    email: 'rajesh@example.com',
    firstname: 'Rajesh',
    lastname: 'Kumar',
    typeid: 1,
    package_name: 'Starter',
    active: 'Yes',
    created: '2024-01-15',
  },
];

export const mockAdminApplications = [
  {
    signupid: 1,
    memberid: 10,
    login: 'newuser1',
    firstname: 'New',
    lastname: 'User',
    email: 'newuser1@example.com',
    package_name: 'Starter',
    amount: 5000,
    transaction_id: 'UPI1702123456789',
    status: 'Wait',
    created: '2024-12-22',
  },
  {
    signupid: 2,
    memberid: 11,
    login: 'newuser2',
    firstname: 'Another',
    lastname: 'User',
    email: 'newuser2@example.com',
    package_name: 'Intermediate',
    amount: 10000,
    transaction_id: 'UPI1702123456790',
    status: 'Wait',
    created: '2024-12-21',
  },
];

export const mockAdminPayments = [
  {
    upipaymentid: 1,
    memberid: 10,
    member_name: 'newuser1',
    amount: 5000,
    upi_reference: 'UPI123456789',
    transaction_id: 'UPI1702123456789',
    status: 'Pending',
    created: '2024-12-22',
  },
  {
    upipaymentid: 2,
    memberid: 11,
    member_name: 'newuser2',
    amount: 10000,
    upi_reference: 'UPI987654321',
    transaction_id: 'UPI1702123456790',
    status: 'Verified',
    created: '2024-12-21',
    verified_at: '2024-12-21',
  },
];

export const mockUser = {
  memberid: 1,
  login: 'user1',
  email: 'user1@example.com',
  firstname: 'John',
  lastname: 'Doe',
  typeid: 1,
  package_name: 'Starter',
  price: 5000,
  daily_return: 200,
  active: 'Yes',
  role: 'member',
};

export const mockAdmin = {
  adminid: 1,
  login: 'admin',
  email: 'admin@example.com',
  role: 'admin',
};

