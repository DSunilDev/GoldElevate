import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { incomeAPI } from '../config/api';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { formatCurrency, formatDate } from '../utils/helpers';
import { showErrorToast } from '../utils/errorHandler';
import { useAuth } from '../context/AuthContext';

export default function IncomeScreen() {
  const { user } = useAuth();
  const isAgent = user?.role === 'agent' || user?.typeid === 7;
  const [income, setIncome] = useState({ total: 0, direct: 0, binary: 0, team: 0, affiliate: 0, daily: 0, referral: 0 });
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      loadData();
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [breakdownResponse, historyResponse] = await Promise.all([
        incomeAPI.getBreakdown().catch(err => ({ data: { byType: [], total: 0 } })),
        incomeAPI.getHistory().catch(err => ({ data: [] })),
      ]);
      
      // Handle different response formats
      let breakdown = [];
      let total = 0;
      
      if (breakdownResponse.data) {
        if (breakdownResponse.data.byType && Array.isArray(breakdownResponse.data.byType)) {
          breakdown = breakdownResponse.data.byType;
        } else if (Array.isArray(breakdownResponse.data)) {
          breakdown = breakdownResponse.data;
        }
        total = breakdownResponse.data.total || breakdownResponse.data.total_amount || 0;
      }
      
      // Calculate breakdown by type - handle both 'classify' and 'bonusType' fields
      const direct = breakdown.find(b => (b.classify === 'direct' || b.classify === 'Direct' || b.bonusType === 'Direct'))?.total_amount || 
                     breakdown.find(b => (b.classify === 'direct' || b.classify === 'Direct' || b.bonusType === 'Direct'))?.total || 0;
      const binary = breakdown.find(b => (b.classify === 'binary' || b.classify === 'Binary' || b.bonusType === 'Binary'))?.total_amount || 
                     breakdown.find(b => (b.classify === 'binary' || b.classify === 'Binary' || b.bonusType === 'Binary'))?.total || 0;
      const team = breakdown.find(b => (b.classify === 'match' || b.classify === 'team' || b.classify === 'Match' || b.classify === 'Team' || b.bonusType === 'Match' || b.bonusType === 'Team'))?.total_amount || 
                   breakdown.find(b => (b.classify === 'match' || b.classify === 'team' || b.classify === 'Match' || b.classify === 'Team' || b.bonusType === 'Match' || b.bonusType === 'Team'))?.total || 0;
      const affiliate = breakdown.find(b => (b.classify === 'affiliate' || b.classify === 'Affiliate' || b.bonusType === 'Affiliate'))?.total_amount || 
                        breakdown.find(b => (b.classify === 'affiliate' || b.classify === 'Affiliate' || b.bonusType === 'Affiliate'))?.total || 0;
      
      // For agents, only show referral earnings (Direct)
      // For regular users, show all earnings including daily
      // Note: 'direct' classify includes both daily earnings and referral bonuses
      // We'll show direct as referral earnings, and calculate daily separately if needed
      const referralEarnings = direct; // Direct includes referral bonuses
      const dailyEarnings = isAgent ? 0 : (total - direct - binary - team - affiliate); // Estimate daily as remainder
      
      setIncome({
        total: total,
        direct: direct,
        binary: isAgent ? 0 : binary,
        team: isAgent ? 0 : team,
        affiliate: isAgent ? 0 : affiliate,
        daily: dailyEarnings,
        referral: referralEarnings,
      });
      
      // Handle different response formats for history
      let historyData = [];
      if (historyResponse.data) {
        if (Array.isArray(historyResponse.data)) {
          historyData = historyResponse.data;
        } else if (historyResponse.data.data && Array.isArray(historyResponse.data.data)) {
          historyData = historyResponse.data.data;
        }
      }
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading income:', error);
      showErrorToast(error, 'Failed to load income data');
      setIncome({ total: 0, direct: 0, binary: 0, team: 0, affiliate: 0, daily: 0, referral: 0 });
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter history based on active tab
  const filteredHistory = Array.isArray(history) 
    ? (activeTab === 'all'
        ? history
        : history.filter(item => {
            const type = (item.classify || item.bonusType || '').toLowerCase();
            if (activeTab === 'direct') return type === 'direct';
            if (activeTab === 'binary') return type === 'binary';
            if (activeTab === 'team') return type === 'match' || type === 'team';
            return false;
          }))
    : [];

  if (loading && income.total === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
    >
      <LinearGradient
        colors={['#D4AF37', '#B8941F']}
        style={styles.header}
      >
        <Text style={styles.headerIcon}>💰</Text>
        <Text style={styles.headerTitle}>Income & Returns</Text>
        <Text style={styles.headerSubtitle}>Track your earnings</Text>
      </LinearGradient>

      <LinearGradient colors={['#D4AF37', '#B8941F']} style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Earnings</Text>
        <Text style={styles.totalValue}>{formatCurrency(income.total)}</Text>
        <View style={styles.breakdownRow}>
          {!isAgent && (
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Daily Earnings</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(income.daily)}</Text>
            </View>
          )}
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Referral Earnings</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(income.referral)}</Text>
          </View>
          {!isAgent && (
            <>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Binary</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(income.binary)}</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Team</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(income.team)}</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Affiliate</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(income.affiliate)}</Text>
          </View>
            </>
          )}
        </View>
      </LinearGradient>

      {!isAgent && (
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'direct' && styles.tabActive]}
          onPress={() => setActiveTab('direct')}
        >
            <Text style={[styles.tabText, activeTab === 'direct' && styles.tabTextActive]}>Referral</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'binary' && styles.tabActive]}
          onPress={() => setActiveTab('binary')}
        >
          <Text style={[styles.tabText, activeTab === 'binary' && styles.tabTextActive]}>Binary</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'team' && styles.tabActive]}
          onPress={() => setActiveTab('team')}
        >
          <Text style={[styles.tabText, activeTab === 'team' && styles.tabTextActive]}>Team</Text>
        </TouchableOpacity>
      </View>
      )}

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>
          {activeTab === 'all' ? 'All Income' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} History
        </Text>
        {filteredHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No income records found</Text>
          </View>
        ) : (
          filteredHistory.map((item) => (
            <View key={item.incomeid || item.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View>
                  <Text style={styles.historyAmount}>{formatCurrency(item.amount)}</Text>
                  <Text style={styles.historyType}>{item.bonusType || 'Direct Referral'}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status || 'Paid'}</Text>
                </View>
              </View>
              <Text style={styles.historyDate}>{formatDate(item.created)}</Text>
              {item.description && (
                <Text style={styles.historyDescription}>{item.description}</Text>
              )}
            </View>
          ))
        )}
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
  totalCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
  },
  totalLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  tabActive: {
    backgroundColor: '#D4AF37',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4AF37',
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4AF37',
  },
  historyType: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: 'rgba(40, 167, 69, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    height: 'fit-content',
  },
  statusText: {
    color: '#28a745',
    fontSize: 12,
    fontWeight: '700',
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
  },
  historyDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
