import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { adminAPI } from '../../config/api';
import Toast from 'react-native-toast-message';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { showErrorToast } from '../../utils/errorHandler';

export default function AdminMemberDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { member: initialMember } = route.params || {};
  const [member, setMember] = useState(initialMember || {});
  const [loading, setLoading] = useState(!initialMember);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (initialMember?.memberid) {
      loadMemberDetails();
    }
  }, [initialMember?.memberid]);

  const loadMemberDetails = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getMemberDetails(member.memberid || initialMember?.memberid);
      
      const memberData = response.data?.data || response.data || {};
      setMember(memberData);
      
      // Stats are already included in memberData from backend
      if (memberData.balance !== undefined) {
        setStats({
          balance: memberData.balance || 0,
          totalInvestment: memberData.total_investment || 0,
          totalEarnings: memberData.total_earnings || 0,
        });
      }
    } catch (error) {
      console.error('Error loading member details:', error);
      showErrorToast(error, 'Failed to load member details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMemberStats = async (memberId) => {
    try {
      // Get member's balance, investments, earnings, etc.
      const [balanceResponse, investmentResponse, earningsResponse] = await Promise.all([
        adminAPI.getMemberBalance(memberId).catch(() => ({ data: { balance: 0 } })),
        adminAPI.getMemberInvestments(memberId).catch(() => ({ data: { total: 0 } })),
        adminAPI.getMemberEarnings(memberId).catch(() => ({ data: { total: 0 } })),
      ]);

      setStats({
        balance: balanceResponse.data?.balance || 0,
        totalInvestment: investmentResponse.data?.total || 0,
        totalEarnings: earningsResponse.data?.total || 0,
      });
    } catch (error) {
      console.error('Error loading member stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMemberDetails();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Loading member details...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <LinearGradient
        colors={['#D4AF37', '#B8941F']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Member Details</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <View style={styles.content}>
        {/* Member Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {member.firstname?.[0]?.toUpperCase() || member.login?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={[
              styles.statusBadge,
              member.active === 'Yes' ? styles.statusActive : styles.statusInactive
            ]}>
              <Text style={[
                styles.statusText,
                member.active === 'Yes' ? styles.statusTextActive : styles.statusTextInactive
              ]}>
                {member.active === 'Yes' ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          <Text style={styles.memberName}>
            {member.firstname} {member.lastname}
          </Text>
          <Text style={styles.memberId}>@{member.login || 'N/A'} • ID: {member.memberid || 'N/A'}</Text>
        </View>

        {/* Personal Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.infoRow}>
            <Icon name="email" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{member.email || 'N/A'}</Text>
            </View>
          </View>

          {member.phone && (
            <View style={styles.infoRow}>
              <Icon name="phone" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{member.phone}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <Icon name="calendar-today" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Signup Date</Text>
              <Text style={styles.infoValue}>{formatDate(member.signuptime) || 'N/A'}</Text>
            </View>
          </View>

          {member.created && (
            <View style={styles.infoRow}>
              <Icon name="access-time" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Account Created</Text>
                <Text style={styles.infoValue}>{formatDate(member.created) || 'N/A'}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Package Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Package Information</Text>
          
          <View style={styles.infoRow}>
            <Icon name="card-giftcard" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Current Package</Text>
              <Text style={styles.infoValue}>{member.package_name || 'N/A'}</Text>
            </View>
          </View>

          {member.daily_return && (
            <View style={styles.infoRow}>
              <Icon name="trending-up" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Daily Return</Text>
                <Text style={styles.infoValue}>{formatCurrency(member.daily_return)}</Text>
              </View>
            </View>
          )}

          {member.price && (
            <View style={styles.infoRow}>
              <Icon name="attach-money" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Package Price</Text>
                <Text style={styles.infoValue}>{formatCurrency(member.price)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Financial Stats */}
        {stats && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Financial Statistics</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Current Balance</Text>
                <Text style={styles.statValue}>{formatCurrency(stats.balance)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Investment</Text>
                <Text style={styles.statValue}>{formatCurrency(stats.totalInvestment)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Earnings</Text>
                <Text style={styles.statValue}>{formatCurrency(stats.totalEarnings)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Additional Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          
          {member.sid && (
            <View style={styles.infoRow}>
              <Icon name="person" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Sponsor ID</Text>
                <Text style={styles.infoValue}>{member.sid}</Text>
              </View>
            </View>
          )}

          {member.reward_points !== undefined && (
            <View style={styles.infoRow}>
              <Icon name="stars" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Reward Points</Text>
                <Text style={styles.infoValue}>{member.reward_points || 0}</Text>
              </View>
            </View>
          )}
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginLeft: -40,
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 16,
  },
  profileCard: {
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: 'rgba(40, 167, 69, 0.2)',
  },
  statusInactive: {
    backgroundColor: 'rgba(220, 53, 69, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#28a745',
  },
  statusTextInactive: {
    color: '#dc3545',
  },
  memberName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  memberId: {
    fontSize: 14,
    color: '#666',
  },
  sectionCard: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D4AF37',
  },
});

