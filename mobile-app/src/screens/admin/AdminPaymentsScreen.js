import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { adminAPI } from '../../config/api';
import Toast from 'react-native-toast-message';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';

export default function AdminPaymentsScreen({ navigation }) {
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, verified
  const [refreshing, setRefreshing] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null); // Track which payment is being verified
  const [rejectingId, setRejectingId] = useState(null); // Track which payment is being rejected

  useEffect(() => {
    console.log('[PAYMENTS] Filter changed to:', filter);
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setRefreshing(true);
      console.log('[PAYMENTS] Loading data with filter:', filter);
      const response = await adminAPI.getPayments(filter);
      console.log('[PAYMENTS] Full response:', response);
      console.log('[PAYMENTS] Response status:', response?.status);
      console.log('[PAYMENTS] Response data:', response?.data);
      
      // Handle different response formats
      let paymentsData = [];
      if (response?.data?.data && Array.isArray(response.data.data)) {
        paymentsData = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        paymentsData = response.data;
      } else if (Array.isArray(response)) {
        paymentsData = response;
      }
      
      console.log('[PAYMENTS] Filter:', filter);
      console.log('[PAYMENTS] Parsed payments data count:', paymentsData.length);
      console.log('[PAYMENTS] First payment status:', paymentsData[0]?.status);
      setPayments(paymentsData);
    } catch (error) {
      console.error('[PAYMENTS] Error loading payments:', error);
      console.error('[PAYMENTS] Error response:', error.response);
      showErrorToast(error, error.response?.data?.message || 'Failed to load payments');
      setPayments([]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleVerify = async (id) => {
    // Prevent multiple simultaneous verifications
    if (verifyingId !== null) {
      console.log('[VERIFY PAYMENT] Already verifying a payment, ignoring click');
      return;
    }

    // Check if this specific payment is already being verified
    if (verifyingId === id) {
      console.log('[VERIFY PAYMENT] This payment is already being verified');
      return;
    }

    console.log('[VERIFY PAYMENT] ===========================================');
    console.log('[VERIFY PAYMENT] Button clicked for payment ID:', id);
    console.log('[VERIFY PAYMENT] Showing confirmation...');

    // Use window.confirm for web compatibility (React Native Alert doesn't work well on web)
    const isWeb = typeof window !== 'undefined';
    let confirmed = false;

    if (isWeb) {
      // Web: Use native browser confirm
      confirmed = window.confirm(`Are you sure you want to verify payment ID ${id}?`);
      console.log('[VERIFY PAYMENT] Web confirm result:', confirmed);
      
      if (!confirmed) {
        console.log('[VERIFY PAYMENT] User cancelled verification');
        return;
      }
      
      // Perform verification directly for web
      performVerification(id);
    } else {
      // Mobile: Use React Native Alert
      Alert.alert(
        'Verify Payment',
        `Are you sure you want to verify payment ID ${id}?`,
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => {
              console.log('[VERIFY PAYMENT] User cancelled verification');
            }
          },
          {
            text: 'Verify',
            onPress: () => {
              console.log('[VERIFY PAYMENT] User confirmed verification (mobile)');
              performVerification(id);
            },
          },
        ]
      );
    }
  };

  const performVerification = async (id) => {
    console.log('[VERIFY PAYMENT] User confirmed verification');
    console.log('[VERIFY PAYMENT] Setting verifyingId to:', id);
    setVerifyingId(id); // Set loading state
    try {
      console.log('[VERIFY PAYMENT] Calling adminAPI.verifyPayment with ID:', id);
      const response = await adminAPI.verifyPayment(id);
      console.log('[VERIFY PAYMENT] ===========================================');
      console.log('[VERIFY PAYMENT] API Response received:');
      console.log('[VERIFY PAYMENT] Response status:', response?.status);
      console.log('[VERIFY PAYMENT] Response data:', JSON.stringify(response?.data, null, 2));
      console.log('[VERIFY PAYMENT] Full response:', response);
      
      // More robust success check
      const isSuccess = response?.data?.success === true || 
                       (response?.status >= 200 && response?.status < 300 && response?.data?.success !== false);
      
      console.log('[VERIFY PAYMENT] Success check result:', isSuccess);
      
      if (isSuccess) {
        const successMsg = response?.data?.message || 'Payment verified successfully';
        console.log('[VERIFY PAYMENT] ✅ SUCCESS - Payment verified!');
        console.log('[VERIFY PAYMENT] Success message:', successMsg);
        showSuccessToast(successMsg, 'Success');
        console.log('[VERIFY PAYMENT] Will reload data in 1000ms...');
        // Reload data to refresh the list after a short delay
        setTimeout(async () => {
          console.log('[VERIFY PAYMENT] Reloading payment list...');
          await loadData();
          console.log('[VERIFY PAYMENT] Data reloaded, clearing verifyingId');
          setVerifyingId(null); // Clear loading state
          console.log('[VERIFY PAYMENT] ===========================================');
        }, 1000); // Increased delay to ensure DB transaction completes
      } else {
        const errorMsg = response?.data?.message || response?.data?.error || 'Failed to verify payment';
        console.log('[VERIFY PAYMENT] ❌ FAILED - Payment verification failed');
        console.log('[VERIFY PAYMENT] Error message:', errorMsg);
        showErrorToast(null, errorMsg);
        setVerifyingId(null); // Clear loading state on error
        console.log('[VERIFY PAYMENT] ===========================================');
      }
    } catch (error) {
      console.log('[VERIFY PAYMENT] ===========================================');
      console.error('[VERIFY PAYMENT] ❌ EXCEPTION - Error verifying payment:', error);
      console.error('[VERIFY PAYMENT] Error response:', error.response);
      console.error('[VERIFY PAYMENT] Error message:', error.message);
      console.error('[VERIFY PAYMENT] Error stack:', error.stack);
      const errorMsg = error.response?.data?.message || 
                     error.response?.data?.error || 
                     error.message || 
                     'Failed to verify payment';
      console.log('[VERIFY PAYMENT] Showing error toast with message:', errorMsg);
      showErrorToast(error, errorMsg);
      setVerifyingId(null); // Clear loading state on error
      console.log('[VERIFY PAYMENT] ===========================================');
    }
  };

  const handleReject = async (id) => {
    // Prevent multiple simultaneous rejections
    if (rejectingId !== null) {
      console.log('[REJECT PAYMENT] Already rejecting a payment, ignoring click');
      return;
    }

    // Check if this specific payment is already being rejected
    if (rejectingId === id) {
      console.log('[REJECT PAYMENT] This payment is already being rejected');
      return;
    }

    console.log('[REJECT PAYMENT] ===========================================');
    console.log('[REJECT PAYMENT] Button clicked for payment ID:', id);
    console.log('[REJECT PAYMENT] Showing confirmation...');

    // Use window.confirm for web compatibility
    const isWeb = typeof window !== 'undefined';
    let confirmed = false;

    if (isWeb) {
      // Web: Use native browser confirm
      confirmed = window.confirm(`Are you sure you want to reject payment ID ${id}?`);
      console.log('[REJECT PAYMENT] Web confirm result:', confirmed);
      
      if (!confirmed) {
        console.log('[REJECT PAYMENT] User cancelled rejection');
        return;
      }
      
      // Perform rejection directly for web
      performRejection(id);
    } else {
      // Mobile: Use React Native Alert
      Alert.alert(
        'Reject Payment',
        `Are you sure you want to reject payment ID ${id}?`,
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => {
              console.log('[REJECT PAYMENT] User cancelled rejection');
            }
          },
          {
            text: 'Reject',
            style: 'destructive',
            onPress: () => {
              console.log('[REJECT PAYMENT] User confirmed rejection (mobile)');
              performRejection(id);
            },
          },
        ]
      );
    }
  };

  const performRejection = async (id) => {
    // Double-check: prevent if already rejecting
    if (rejectingId !== null) {
      console.log('[REJECT PAYMENT] Already rejecting another payment, aborting');
      return;
    }

    console.log('[REJECT PAYMENT] User confirmed rejection');
    console.log('[REJECT PAYMENT] Setting rejectingId to:', id);
    setRejectingId(id); // Set loading state IMMEDIATELY to prevent duplicate clicks
    
    try {
      console.log('[REJECT PAYMENT] Calling adminAPI.rejectPayment with ID:', id);
      const response = await adminAPI.rejectPayment(id, 'Payment rejected by admin');
      console.log('[REJECT PAYMENT] ===========================================');
      console.log('[REJECT PAYMENT] API Response received:');
      console.log('[REJECT PAYMENT] Response status:', response?.status);
      console.log('[REJECT PAYMENT] Response data:', JSON.stringify(response?.data, null, 2));
      
      const isSuccess = response?.data?.success === true || 
                       (response?.status >= 200 && response?.status < 300 && response?.data?.success !== false);
      
      console.log('[REJECT PAYMENT] Success check result:', isSuccess);
      
      if (isSuccess) {
        const successMsg = response?.data?.message || 'Payment rejected successfully';
        console.log('[REJECT PAYMENT] ✅ SUCCESS - Payment rejected!');
        console.log('[REJECT PAYMENT] Success message:', successMsg);
        showSuccessToast(successMsg, 'Success');
        setTimeout(async () => {
          console.log('[REJECT PAYMENT] Reloading payment list...');
          await loadData();
          console.log('[REJECT PAYMENT] Data reloaded, clearing rejectingId');
          setRejectingId(null);
          console.log('[REJECT PAYMENT] ===========================================');
        }, 1000);
      } else {
        const errorMsg = response?.data?.message || response?.data?.error || 'Failed to reject payment';
        console.log('[REJECT PAYMENT] ❌ FAILED - Payment rejection failed');
        console.log('[REJECT PAYMENT] Error message:', errorMsg);
        showErrorToast(null, errorMsg);
        setRejectingId(null);
        console.log('[REJECT PAYMENT] ===========================================');
      }
    } catch (error) {
      console.log('[REJECT PAYMENT] ===========================================');
      console.error('[REJECT PAYMENT] ❌ EXCEPTION - Error rejecting payment:', error);
      const errorMsg = error.response?.data?.message || 
                     error.response?.data?.error || 
                     error.message || 
                     'Failed to reject payment';
      console.log('[REJECT PAYMENT] Showing error toast with message:', errorMsg);
      showErrorToast(error, errorMsg);
      setRejectingId(null);
      console.log('[REJECT PAYMENT] ===========================================');
    }
  };

  // Filter payments based on current filter (backend already filters, but ensure frontend matches)
  const filteredPayments = payments.filter((payment) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return payment.status === 'Pending' || !payment.status;
    if (filter === 'verified') return payment.status === 'Verified';
    if (filter === 'rejected') return payment.status === 'Rejected';
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payments</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'verified' && styles.filterButtonActive]}
          onPress={() => setFilter('verified')}
        >
          <Text style={[styles.filterText, filter === 'verified' && styles.filterTextActive]}>
            Verified
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'rejected' && styles.filterButtonActive]}
          onPress={() => setFilter('rejected')}
        >
          <Text style={[styles.filterText, filter === 'rejected' && styles.filterTextActive]}>
            Rejected
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
      >
        <Text style={styles.countText}>
          {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''}
        </Text>

        {filteredPayments.map((payment) => (
          <View key={payment.upipaymentid} style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                <Text style={styles.paymentMember}>
                  Member ID: {payment.memberid} • {payment.member_name || 'N/A'}
                  {payment.phone && ` • 📱 ${payment.phone}`}
                </Text>
              </View>
              <View style={[
                styles.statusBadge,
                payment.status === 'Verified' ? styles.statusVerified : 
                payment.status === 'Rejected' ? styles.statusRejected : 
                styles.statusPending
              ]}>
                <Text style={[
                  styles.statusText,
                  payment.status === 'Verified' ? styles.statusTextVerified : 
                  payment.status === 'Rejected' ? styles.statusTextRejected : 
                  styles.statusTextPending
                ]}>
                  {payment.status || 'Pending'}
                </Text>
              </View>
            </View>

            <View style={styles.paymentDetails}>
              <View style={styles.detailRow}>
                <Icon name="receipt" size={16} color="#666" />
                <Text style={styles.detailLabel}>UPI Reference:</Text>
                <Text style={styles.detailValue}>{payment.upi_reference || 'N/A'}</Text>
              </View>
              {payment.transaction_id && (
                <View style={styles.detailRow}>
                  <Icon name="tag" size={16} color="#666" />
                  <Text style={styles.detailLabel}>Transaction ID:</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>{payment.transaction_id}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Icon name="calendar-today" size={16} color="#666" />
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>{formatDate(payment.created)}</Text>
              </View>
            </View>

            {(payment.status === 'Pending' || !payment.status) && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.verifyButton, 
                    (verifyingId !== null || rejectingId !== null) && styles.verifyButtonDisabled
                  ]}
                  onPress={() => {
                    if (verifyingId === null && rejectingId === null) {
                      handleVerify(payment.upipaymentid);
                    }
                  }}
                  disabled={verifyingId !== null || rejectingId !== null}
                >
                  {verifyingId === payment.upipaymentid ? (
                    <>
                      <ActivityIndicator size="small" color="#28a745" style={{ marginRight: 8 }} />
                      <Text style={styles.verifyButtonText}>Verifying...</Text>
                    </>
                  ) : (
                    <>
                      <Icon name="check-circle" size={20} color="#28a745" />
                      <Text style={styles.verifyButtonText}>Verify</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.rejectButton, 
                    (verifyingId !== null || rejectingId !== null) && styles.rejectButtonDisabled
                  ]}
                  onPress={() => {
                    if (verifyingId === null && rejectingId === null) {
                      handleReject(payment.upipaymentid);
                    }
                  }}
                  disabled={verifyingId !== null || rejectingId !== null}
                >
                  {rejectingId === payment.upipaymentid ? (
                    <>
                      <ActivityIndicator size="small" color="#dc3545" style={{ marginRight: 8 }} />
                      <Text style={styles.rejectButtonText}>Rejecting...</Text>
                    </>
                  ) : (
                    <>
                      <Icon name="cancel" size={20} color="#dc3545" />
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {filteredPayments.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="account-balance-wallet" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No payments found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  filters: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  filterButtonActive: {
    backgroundColor: '#D4AF37',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4AF37',
  },
  filterTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  countText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  paymentCard: {
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
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 4,
  },
  paymentMember: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusVerified: {
    backgroundColor: 'rgba(40, 167, 69, 0.2)',
  },
  statusPending: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextVerified: {
    color: '#28a745',
  },
  statusTextPending: {
    color: '#FF9800',
  },
  paymentDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    width: 120,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  verifyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#28a745',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  rejectButtonDisabled: {
    opacity: 0.5,
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc3545',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});

