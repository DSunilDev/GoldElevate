import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { referralsAPI } from '../config/api';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'react-native-linear-gradient';
import { formatDate, copyToClipboard } from '../utils/helpers';
// Clipboard import removed - using native web APIs directly
import Share from 'react-native-share';
import { useAuth } from '../context/AuthContext';
import { showErrorToast, showSuccessToast, showInfoToast } from '../utils/errorHandler';

export default function ReferralsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, earnings: 0 });
  const [referralLink, setReferralLink] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

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
      setRefreshing(true);
      setError(null);
      console.log('Loading referrals data...');
      
      const [refsResponse, linkResponse] = await Promise.all([
        referralsAPI.getList().catch(err => {
          console.error('Referrals list error:', err);
          setError('Failed to load referrals');
          return { data: { success: false, data: [] } };
        }),
        referralsAPI.getLink().catch(err => {
          console.error('Referral link error:', err);
          return { data: null };
        }),
      ]);
      
      console.log('Referrals response:', refsResponse);
      console.log('Link response:', linkResponse);
      
      // Handle API response - data might be wrapped
      let refs = [];
      if (refsResponse && refsResponse.data) {
        if (Array.isArray(refsResponse.data)) {
          refs = refsResponse.data;
        } else if (refsResponse.data.data && Array.isArray(refsResponse.data.data)) {
          refs = refsResponse.data.data;
        } else if (refsResponse.data.success && Array.isArray(refsResponse.data.data)) {
          refs = refsResponse.data.data;
        } else if (refsResponse.data.success === false) {
          refs = [];
        }
      }
      
      // Ensure refs is always an array
      if (!Array.isArray(refs)) {
        console.warn('Referrals data is not an array:', refs);
        refs = [];
      }
      
      console.log('Processed referrals:', refs.length);
      setReferrals(refs);
      
      // Calculate stats safely
      setStats({
        total: refs.length || 0,
        active: Array.isArray(refs) ? refs.filter(r => r && r.active === 'Yes').length : 0,
        earnings: Array.isArray(refs) ? refs.reduce((sum, r) => sum + (parseFloat(r?.bonus) || 0), 0) : 0,
      });
      
      // Get referral link - handle different response formats
      let link = '';
      if (linkResponse && linkResponse.data) {
        const linkData = linkResponse.data;
        if (typeof linkData === 'string') {
          link = linkData;
        } else if (linkData.link) {
          link = linkData.link;
        } else if (linkData.referralLink) {
          link = linkData.referralLink;
        } else if (linkData.data && linkData.data.link) {
          link = linkData.data.link;
        }
      }
      
      // Generate meaningful referral link from user data if API doesn't provide it
      if (!link && user?.memberid) {
        // Detect if running on web or mobile
        const isWeb = typeof window !== 'undefined' && window.location;
        const baseUrl = isWeb 
          ? `${window.location.protocol}//${window.location.host}` 
          : 'http://localhost:19006';
        
        // Create meaningful referral code
        const referralCode = user.login 
          ? (user.login.length === 10 && /^\d+$/.test(user.login) 
              ? `ref${user.login.slice(-4)}${user.memberid}` 
              : `ref-${user.login}`)
          : `ref${user.memberid}`;
        
        link = `${baseUrl}/signup?ref=${encodeURIComponent(referralCode)}&sponsorid=${user.memberid}`;
      }
      
      setReferralLink(link);
      console.log('Referral link set:', link);
    } catch (error) {
      console.error('Error loading referrals:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load referrals';
      setError(errorMsg);
      showErrorToast(error, errorMsg);
      // Set empty state on error
      setReferrals([]);
      setStats({ total: 0, active: 0, earnings: 0 });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopyLink = async () => {
    if (referralLink) {
      const success = await copyToClipboard(referralLink, (toastData) => {
        Toast.show(toastData);
      });
      if (success) {
        showSuccessToast('Referral link copied to clipboard', 'Copied!');
      } else {
        showErrorToast(new Error('Failed to copy'), 'Failed to copy link');
      }
    }
  };

  const handleShareLink = async () => {
    if (referralLink) {
      try {
        await Share.open({
            message: `Join GoldElevate and start earning! Use my referral link: ${referralLink}`,
          title: 'Share Referral Link',
          });
      } catch (error) {
        showErrorToast(error, 'Failed to share link');
      }
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
    >
      <LinearGradient
        colors={['#D4AF37', '#B8941F']}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>👥</Text>
          <Text style={styles.headerTitle}>My Referrals</Text>
          <Text style={styles.headerSubtitle}>Track your referral network</Text>
        </View>
        <View style={styles.placeholder} />
      </LinearGradient>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Referrals</Text>
        </View>
        <View style={[styles.statCard, styles.statCardGreen]}>
          <Text style={styles.statNumber}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={[styles.statCard, styles.statCardYellow]}>
          <Text style={styles.statNumber}>₹{(stats.earnings || 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Earnings</Text>
        </View>
      </View>

      {referralLink && (
        <View style={styles.linkCard}>
          <Text style={styles.linkTitle}>Your Referral Link</Text>
          <View style={styles.linkContainer}>
            <Text style={styles.linkText} numberOfLines={1}>
              {referralLink}
            </Text>
          </View>
          <View style={styles.linkButtons}>
            <TouchableOpacity style={styles.linkButton} onPress={handleCopyLink}>
              <Icon name="content-copy" size={20} color="#D4AF37" />
              <Text style={styles.linkButtonText}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkButton} onPress={handleShareLink}>
              <Icon name="share" size={20} color="#D4AF37" />
              <Text style={styles.linkButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.content}>
        {error ? (
          <View style={styles.emptyState}>
            <Icon name="error-outline" size={64} color="#ff9800" />
            <Text style={styles.emptyText}>{error}</Text>
            <Text style={styles.emptySubtext}>Please check your connection and try again.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>My Referrals ({referrals.length})</Text>
            {referrals.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="people-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No referrals yet</Text>
                <Text style={styles.emptySubtext}>Share your referral link to start earning!</Text>
              </View>
            ) : (
              referrals.map((ref) => (
                <View key={ref.memberid} style={styles.referralCard}>
                  <View style={styles.referralHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {ref.firstname?.[0]?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View style={styles.referralInfo}>
                      <Text style={styles.referralName}>
                        {ref.firstname} {ref.lastname}
                      </Text>
                      <Text style={styles.referralId}>
                        @{ref.login || ''} • MEM{ref.memberid || ''}
                      </Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>
                        {ref.active === 'Yes' ? 'Active' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.referralDetails}>
                    <Text style={styles.detailText}>
                      📅 Joined: {formatDate(ref.signuptime)}
                    </Text>
                    <Text style={styles.detailText}>
                      🎁 Package: {ref.package_name || 'N/A'}
                    </Text>
                    {(ref.bonus || 0) > 0 && (
                      <Text style={styles.bonusText}>
                        💰 Bonus: ₹{(ref.bonus || 0).toLocaleString()}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </>
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
  header: {
    padding: 24,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    zIndex: 10,
  },
  headerContent: {
    flex: 1,
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
  placeholder: {
    width: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#D4AF37',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statCardGreen: {
    backgroundColor: '#28a745',
  },
  statCardYellow: {
    backgroundColor: '#ffc107',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  linkCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  linkTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  linkContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  linkText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },
  linkButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  linkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  linkButtonText: {
    color: '#D4AF37',
    fontWeight: '700',
    fontSize: 14,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  referralCard: {
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
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: '#D4AF37',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 20,
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    fontWeight: '700',
    color: '#333',
    fontSize: 16,
  },
  referralId: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: 'rgba(40, 167, 69, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#28a745',
    fontSize: 12,
    fontWeight: '700',
  },
  referralDetails: {
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
    paddingTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  bonusText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '700',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
