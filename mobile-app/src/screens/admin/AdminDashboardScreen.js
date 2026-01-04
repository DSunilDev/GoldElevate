import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { adminAPI } from '../../config/api';
import Toast from 'react-native-toast-message';
import { showErrorToast } from '../../utils/errorHandler';
import { formatCurrency } from '../../utils/helpers';

export default function AdminDashboardScreen({ navigation }) {
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalInvestments: 0,
    totalReturns: 0,
    pendingApprovals: 0,
    pendingPayments: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Refresh dashboard when screen comes into focus (e.g., after verifying payment)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('[ADMIN DASHBOARD] Screen focused, reloading data...');
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      setRefreshing(true);
      console.log('[ADMIN DASHBOARD] Loading dashboard data...');
      const response = await adminAPI.getDashboard();
      console.log('[ADMIN DASHBOARD] Response received:', response.data);
      
      // Handle response format - data might be nested
      const statsData = response.data?.data || response.data || {};
      console.log('[ADMIN DASHBOARD] Parsed stats data:', statsData);
      
      const newStats = {
        totalMembers: Number(statsData.totalMembers) || 0,
        totalInvestments: Number(statsData.totalInvestments) || 0,
        totalReturns: Number(statsData.totalReturns) || 0,
        pendingApprovals: Number(statsData.pendingApprovals) || 0,
        pendingPayments: Number(statsData.pendingPayments) || 0,
        pendingWithdraws: Number(statsData.pendingWithdraws) || 0,
      };
      
      console.log('[ADMIN DASHBOARD] Setting stats:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error('[ADMIN DASHBOARD] Error loading dashboard:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load dashboard';
      Toast.show({
        type: 'error',
        text1: 'Error Loading Dashboard',
        text2: errorMsg,
        visibilityTime: 4000,
      });
      // Set empty stats on error
      setStats({
        totalMembers: 0,
        totalInvestments: 0,
        totalReturns: 0,
        pendingApprovals: 0,
        pendingPayments: 0,
        pendingWithdraws: 0,
      });
    } finally {
      setRefreshing(false);
    }
  };

  const StatCard = ({ icon, label, value, color, onPress }) => (
    <TouchableOpacity
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={28} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
    >
      <LinearGradient
        colors={['#D4AF37', '#B8941F']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>Manage your platform</Text>
          </View>
          <View style={styles.adminBadge}>
            <Icon name="admin-panel-settings" size={24} color="#fff" />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Overview</Text>
        
        <StatCard
          icon="people"
          label="Total Members"
          value={stats.totalMembers || 0}
          color="#2196F3"
          onPress={() => navigation.navigate('AdminMembers')}
        />
        
        <StatCard
          icon="account-balance"
          label="Total Investments"
          value={formatCurrency(stats.totalInvestments || 0)}
          color="#4CAF50"
          onPress={() => navigation.navigate('AdminPayments')}
        />
        
        <StatCard
          icon="payments"
          label="Total Returns Paid"
          value={formatCurrency(stats.totalReturns || 0)}
          color="#FF9800"
        />
        
        <StatCard
          icon="pending-actions"
          label="Pending Approvals"
          value={stats.pendingApprovals || 0}
          color="#F44336"
          onPress={() => navigation.navigate('AdminApplications')}
        />
        
        <StatCard
          icon="payment"
          label="Pending Payments"
          value={stats.pendingPayments || 0}
          color="#9C27B0"
          onPress={() => navigation.navigate('AdminPayments')}
        />
        
        <StatCard
          icon="account-balance"
          label="Pending Withdrawals"
          value={stats.pendingWithdraws || 0}
          color="#FF5722"
          onPress={() => navigation.navigate('AdminWithdraws')}
        />

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminMembers')}
          >
            <Icon name="people" size={24} color="#2196F3" />
            <Text style={styles.actionText}>View All Members</Text>
            <Icon name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminApplications')}
          >
            <Icon name="assignment" size={24} color="#F44336" />
            <Text style={styles.actionText}>Review Applications</Text>
            <Icon name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminPayments')}
          >
            <Icon name="account-balance-wallet" size={24} color="#4CAF50" />
            <Text style={styles.actionText}>Manage Payments</Text>
            <Icon name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminWithdraws')}
          >
            <Icon name="account-balance" size={24} color="#FF5722" />
            <Text style={styles.actionText}>Manage Withdrawals</Text>
            <Icon name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminPackages')}
          >
            <Icon name="card-giftcard" size={24} color="#9C27B0" />
            <Text style={styles.actionText}>Edit Packages</Text>
            <Icon name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminPaymentGateway')}
          >
            <Icon name="payment" size={24} color="#2196F3" />
            <Text style={styles.actionText}>Payment Gateway</Text>
            <Icon name="chevron-right" size={24} color="#999" />
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
  header: {
    padding: 24,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  adminBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  quickActions: {
    marginTop: 24,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 16,
  },
});

