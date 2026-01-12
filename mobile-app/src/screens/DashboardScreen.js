import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'react-native-linear-gradient';
import { default as Icon } from 'react-native-vector-icons/MaterialIcons';
import { dashboardAPI } from '../config/api';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';
import { getCache, setCache, clearCache, CACHE_KEYS } from '../utils/cache';
import { showErrorToast, showInfoToast } from '../utils/errorHandler';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasShownPaymentToast, setHasShownPaymentToast] = useState(false);

  useEffect(() => {
    // Don't load dashboard if user is not authenticated
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping dashboard load in useEffect');
      setLoading(false);
      return;
    }

    // Clear cache on mount and load fresh data
    // Force clear cache and reload to ensure latest balance is shown
    clearCache(CACHE_KEYS.DASHBOARD).then(() => {
      console.log('Dashboard cache cleared, loading fresh data...');
      // Double-check authentication before loading
      if (isAuthenticated) {
      loadDashboard(false); // Always fetch fresh, don't use cache
      }
    });
    
    // Check for payment success message from navigation
    const paymentSuccess = route.params?.paymentSuccess;
    const isAutoApproved = route.params?.isAutoApproved;
    const message = route.params?.message;
    
    if (paymentSuccess && !hasShownPaymentToast) {
      // Show success toast when arriving from successful payment
      setTimeout(() => {
        Toast.show({
          type: 'success',
          text1: isAutoApproved ? 'Payment Successful!' : 'Payment Submitted!',
          text2: message || (isAutoApproved 
            ? 'Your account has been activated!'
            : 'Admin will verify your payment within 24-48 hours.'),
          visibilityTime: 6000,
          position: 'top',
          topOffset: 60,
        });
        setHasShownPaymentToast(true);
      }, 500);
    }
  }, [route.params, hasShownPaymentToast, isAuthenticated]);

  // Refresh dashboard when screen comes into focus (e.g., when returning from packages)
  // This ensures package updates from admin are reflected immediately
  useFocusEffect(
    React.useCallback(() => {
      // Only reload if user is authenticated
      if (!isAuthenticated) {
        console.log('User not authenticated, skipping dashboard reload on focus');
        return;
      }
      
      // Clear cache and reload fresh data when screen is focused
      // This ensures package updates from admin are reflected and balance is updated
      console.log('Dashboard screen focused, clearing cache and reloading...');
      clearCache(CACHE_KEYS.DASHBOARD).then(() => {
        loadDashboard(false); // Always fetch fresh, don't use cache
      });
    }, [isAuthenticated])
  );

  const loadDashboard = async (useCache = true) => {
    // Don't load dashboard if user is not authenticated
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping dashboard load');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // Try cache first
      if (useCache) {
        const cached = await getCache(CACHE_KEYS.DASHBOARD);
        if (cached) {
          setStats(cached);
          setLoading(false);
          setRefreshing(false);
          // Still fetch fresh data in background (only if authenticated)
          if (isAuthenticated) {
          loadDashboard(false);
          }
          return;
        }
      }

      const response = await dashboardAPI.getStats();
      console.log('[DASHBOARD] Full API response:', JSON.stringify(response.data, null, 2));
      
      // Response structure: { success: true, data: { member: {...}, stats: {...} } }
      const responseData = response.data?.data || response.data;
      console.log('[DASHBOARD] Response data:', JSON.stringify(responseData, null, 2));
      
      // Map API response to expected format
      // Total Balance = Total Earnings - Total Withdrawals (what's currently available after all withdrawals)
      const withdrawableBalance = Number(responseData.stats?.withdrawableBalance || 0);
      const currentBalance = Number(responseData.stats?.currentBalance || 0);
      const totalInvestment = Number(responseData.stats?.totalInvestment || 0);
      const totalReturns = Number(responseData.stats?.totalReturns || 0);
      const totalEarnings = Number(responseData.stats?.totalEarnings || 0);
      const totalWithdrawals = Number(responseData.stats?.totalWithdrawals || 0);
      
      // Total Balance from API = Total Earnings - Total Withdrawals
      // This is what's currently available after all withdrawals
      const totalBalance = Number(responseData.stats?.totalBalance || 0);
      
      console.log('[DASHBOARD] Balance calculation:', {
        'API totalBalance': totalBalance,
        'API totalEarnings': totalEarnings,
        'API totalWithdrawals': totalWithdrawals,
        'API withdrawableBalance': withdrawableBalance,
        'API currentBalance': currentBalance,
        'API totalInvestment': totalInvestment,
        'Calculation': `${totalEarnings} - ${totalWithdrawals} = ${totalBalance}`
      });
      
      const mappedStats = {
        totalBalance: totalBalance, // Total Earnings - Total Withdrawals (currently available after all withdrawals)
        dailyReturns: responseData.stats?.dailyReturns || 0, // Sum of daily returns from all active packages
        totalEarnings: responseData.stats?.totalEarnings || responseData.stats?.totalReturns || 0, // Total earnings wallet (accumulated daily returns)
        referrals: responseData.stats?.referralCount || 0, // Total referrals count (active & inactive)
        activePackage: responseData.stats?.activePackageNames || responseData.member?.package_name || 'No active package', // All active packages comma-separated
        currentBalance: currentBalance, // Full balance (for reference)
        withdrawableBalance: withdrawableBalance, // Earnings only
        shopBalance: responseData.stats?.shopBalance || 0,
        totalInvestment: totalInvestment, // Package cost (not withdrawable)
        totalBonuses: responseData.stats?.totalBonuses || 0,
      };
      
      console.log('[DASHBOARD] Final mapped stats:', mappedStats);
      
      console.log('Mapped stats:', JSON.stringify(mappedStats, null, 2));
      setStats(mappedStats);
      
      // Cache the data
      await setCache(CACHE_KEYS.DASHBOARD, mappedStats);
    } catch (error) {
      console.error('Dashboard load error:', error);
      
      // Don't show error or try cache if user is not authenticated (likely logged out)
      if (!isAuthenticated || error.response?.status === 401) {
        console.log('User not authenticated or 401 error, skipping error handling');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Try cache on error
      const cached = await getCache(CACHE_KEYS.DASHBOARD);
      if (cached) {
        setStats(cached);
        showInfoToast('Connect to internet for latest data', 'Using cached data');
      } else {
        // Set default empty stats
        setStats({
          totalBalance: 0,
          dailyReturns: 0,
          totalEarnings: 0,
          referrals: 0,
          activePackage: 'No active package',
        });
        // Only show error if user is authenticated
        if (isAuthenticated) {
        showErrorToast(error, 'Unable to load dashboard data');
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    // Don't refresh if user is not authenticated
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping dashboard refresh');
      setRefreshing(false);
      return;
    }
    
    setRefreshing(true);
    // Clear cache on manual refresh to ensure fresh data
    await clearCache(CACHE_KEYS.DASHBOARD);
    await loadDashboard(false);
  };

  // Early return if not authenticated - don't render anything
  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient
        colors={['#D4AF37', '#B8941F']}
        style={styles.header}
      >
        <Text style={styles.headerIcon}>📊</Text>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Welcome back, {user?.firstname || user?.login || 'User'}!</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Total Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceValue}>
            ₹{stats?.totalBalance?.toLocaleString() || '0'}
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Quick Stats</Text>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Daily Returns:</Text>
            <Text style={[styles.statValue, styles.statValueGreen]}>
              ₹{stats?.dailyReturns?.toLocaleString() || '0'}
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Earnings:</Text>
            <Text style={[styles.statValue, styles.statValueGreen]}>
              ₹{stats?.totalEarnings?.toLocaleString() || '0'}
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Referrals:</Text>
            <Text style={styles.statValue}>{stats?.referrals || 0}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Active Package:</Text>
            <Text style={styles.statValue}>{stats?.activePackage || 'No active package'}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Packages')}
          >
            <Icon name="card-giftcard" size={24} color="#D4AF37" />
            <Text style={styles.actionText}>View Packages</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Referrals')}
          >
            <Icon name="people" size={24} color="#D4AF37" />
            <Text style={styles.actionText}>My Referrals</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Income')}
          >
            <Icon name="account-balance-wallet" size={24} color="#D4AF37" />
            <Text style={styles.actionText}>View Income</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Transactions')}
          >
            <Icon name="receipt" size={24} color="#D4AF37" />
            <Text style={styles.actionText}>Transactions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Withdraw')}
          >
            <Icon name="account-balance" size={24} color="#D4AF37" />
            <Text style={styles.actionText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#D4AF37',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statValueGreen: {
    color: '#28a745',
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    marginBottom: 12,
  },
  actionText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});

