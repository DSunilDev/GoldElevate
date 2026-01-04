// Mock Data Fallback Utility
// Provides fallback data when API calls fail

import {
  mockPackages,
  mockDashboard,
  mockReferrals,
  mockReferralStats,
  mockIncome,
  mockTransactions,
  mockAdminDashboard,
  mockAdminMembers,
  mockAdminApplications,
  mockAdminPayments,
} from '../data/mockData';

export const useMockData = {
  packages: () => mockPackages,
  dashboard: () => mockDashboard.data || mockDashboard,
  referrals: () => ({
    list: mockReferrals,
    stats: mockReferralStats,
    link: 'https://goldinvestment.com/signup?ref=12345',
  }),
  income: () => mockIncome,
  transactions: () => mockTransactions,
  adminDashboard: () => mockAdminDashboard,
  adminMembers: () => mockAdminMembers,
  adminApplications: () => mockAdminApplications,
  adminPayments: () => mockAdminPayments,
};

