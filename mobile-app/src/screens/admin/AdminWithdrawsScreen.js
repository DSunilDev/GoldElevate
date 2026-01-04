import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { adminAPI } from '../../config/api';
import Toast from 'react-native-toast-message';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';

export default function AdminWithdrawsScreen({ navigation }) {
  const [withdrawals, setWithdrawals] = useState([]);
  const [filter, setFilter] = useState('all'); // all, apply, pending, finished, reject
  const [refreshing, setRefreshing] = useState(false);
  const [approvingId, setApprovingId] = useState(null);

  useEffect(() => {
    console.log('[WITHDRAWALS] Filter changed to:', filter);
    loadData();
  }, [filter]);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const response = await adminAPI.getWithdraws(filter);
      if (response.data && Array.isArray(response.data.data)) {
        setWithdrawals(response.data.data);
      } else if (Array.isArray(response.data)) {
        setWithdrawals(response.data);
      } else {
        setWithdrawals([]);
      }
    } catch (error) {
      console.error('Error loading withdrawals:', error);
      showErrorToast(error, 'Failed to load withdrawal requests');
      setWithdrawals([]);
    } finally {
      setRefreshing(false);
    }
  };

  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedWithdrawId, setSelectedWithdrawId] = useState(null);
  const [tempTransactionId, setTempTransactionId] = useState('');

  const handleApprove = async (id) => {
    setSelectedWithdrawId(id);
    setTempTransactionId('');
    setShowTransactionModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedWithdrawId) return;
    
    setApprovingId(selectedWithdrawId);
    setShowTransactionModal(false);
    
    try {
      const response = await adminAPI.approveWithdraw(selectedWithdrawId, tempTransactionId || '');
      if (response.data?.success !== false) {
        showSuccessToast('Withdrawal approved successfully', 'Success');
        setTempTransactionId('');
        setSelectedWithdrawId(null);
        await loadData();
      } else {
        showErrorToast(null, response.data?.message || 'Failed to approve withdrawal');
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      showErrorToast(error, error.response?.data?.message || 'Failed to approve withdrawal');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id) => {
    // Use window.confirm for web compatibility (same as payments)
    const isWeb = typeof window !== 'undefined';
    
    if (isWeb) {
      // Web: Use native browser confirm
      const confirmed = window.confirm(`Are you sure you want to reject withdrawal ID ${id}?`);
      if (!confirmed) {
        console.log('[REJECT WITHDRAWAL] User cancelled rejection');
        return;
      }
      // Perform rejection directly for web
      performRejection(id);
    } else {
      // Mobile: Use React Native Alert
      Alert.alert(
        'Reject Withdrawal',
        `Are you sure you want to reject withdrawal ID ${id}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reject',
            style: 'destructive',
            onPress: () => {
              performRejection(id);
            },
          },
        ]
      );
    }
  };

  const performRejection = async (id) => {
    try {
      console.log('[REJECT WITHDRAWAL] Calling adminAPI.rejectWithdraw with ID:', id);
      const response = await adminAPI.rejectWithdraw(id, 'Rejected by admin');
      console.log('[REJECT WITHDRAWAL] Response:', response);
      
      if (response?.data?.success === true || (response?.data?.success !== false && response?.status === 200)) {
        const successMsg = response?.data?.message || 'Withdrawal rejected successfully';
        console.log('[REJECT WITHDRAWAL] ✅ SUCCESS');
        showSuccessToast(successMsg, 'Success');
        setTimeout(async () => {
          await loadData();
        }, 500);
      } else {
        const errorMsg = response?.data?.message || 'Failed to reject withdrawal';
        console.log('[REJECT WITHDRAWAL] ❌ FAILED:', errorMsg);
        showErrorToast(null, errorMsg);
      }
    } catch (error) {
      console.error('[REJECT WITHDRAWAL] ❌ EXCEPTION:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to reject withdrawal';
      showErrorToast(error, errorMsg);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'finished':
        return '#28a745';
      case 'reject':
        return '#dc3545';
      case 'apply':
      case 'pending':
      case 'processing':
        return '#FF9800';
      default:
        return '#666';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdrawal Requests</Text>
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
          style={[styles.filterButton, filter === 'apply' && styles.filterButtonActive]}
          onPress={() => setFilter('apply')}
        >
          <Text style={[styles.filterText, filter === 'apply' && styles.filterTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'finished' && styles.filterButtonActive]}
          onPress={() => setFilter('finished')}
        >
          <Text style={[styles.filterText, filter === 'finished' && styles.filterTextActive]}>
            Approved
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'reject' && styles.filterButtonActive]}
          onPress={() => setFilter('reject')}
        >
          <Text style={[styles.filterText, filter === 'reject' && styles.filterTextActive]}>
            Rejected
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
      >
        <Text style={styles.countText}>
          {withdrawals.length} withdrawal{withdrawals.length !== 1 ? 's' : ''}
        </Text>

        {withdrawals.map((withdrawal) => (
          <View key={withdrawal.id} style={styles.withdrawalCard}>
            <View style={styles.withdrawalHeader}>
              <View style={styles.withdrawalInfo}>
                <Text style={styles.withdrawalAmount}>
                  {formatCurrency(withdrawal.amount)}
                </Text>
                <Text style={styles.withdrawalMember}>
                  {withdrawal.firstname} {withdrawal.lastname}
                </Text>
                <Text style={styles.withdrawalId}>
                  ID: {withdrawal.memberid} • {withdrawal.member_name}
                  {withdrawal.phone && ` • 📱 ${withdrawal.phone}`}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(withdrawal.status) + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(withdrawal.status) },
                  ]}
                >
                  {withdrawal.status?.toUpperCase() || 'PENDING'}
                </Text>
              </View>
            </View>

            <View style={styles.withdrawalDetails}>
              <View style={styles.detailRow}>
                <Icon name="calendar-today" size={16} color="#666" />
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>{formatDate(withdrawal.created)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Icon name="payment" size={16} color="#666" />
                <Text style={styles.detailLabel}>Method:</Text>
                <Text style={styles.detailValue}>{withdrawal.payment_method || 'Bank'}</Text>
              </View>
              {withdrawal.payment_method === 'Bank' && (
                <>
                  {withdrawal.account_number && (
                    <View style={styles.detailRow}>
                      <Icon name="account-balance" size={16} color="#666" />
                      <Text style={styles.detailLabel}>Account:</Text>
                      <Text style={styles.detailValue}>{withdrawal.account_number}</Text>
                    </View>
                  )}
                  {withdrawal.ifsc_code && (
                    <View style={styles.detailRow}>
                      <Icon name="code" size={16} color="#666" />
                      <Text style={styles.detailLabel}>IFSC:</Text>
                      <Text style={styles.detailValue}>{withdrawal.ifsc_code}</Text>
                    </View>
                  )}
                  {withdrawal.bank_name && (
                    <View style={styles.detailRow}>
                      <Icon name="business" size={16} color="#666" />
                      <Text style={styles.detailLabel}>Bank:</Text>
                      <Text style={styles.detailValue}>{withdrawal.bank_name}</Text>
                    </View>
                  )}
                </>
              )}
              {withdrawal.payment_method === 'UPI' && withdrawal.upi_id && (
                <View style={styles.detailRow}>
                  <Icon name="account-balance-wallet" size={16} color="#666" />
                  <Text style={styles.detailLabel}>UPI ID:</Text>
                  <Text style={styles.detailValue}>{withdrawal.upi_id}</Text>
                </View>
              )}
              {withdrawal.transax_id && (
                <View style={styles.detailRow}>
                  <Icon name="receipt" size={16} color="#666" />
                  <Text style={styles.detailLabel}>Request ID:</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {withdrawal.transax_id}
                  </Text>
                </View>
              )}
              {withdrawal.admin_transaction_id && (
                <View style={styles.detailRow}>
                  <Icon name="check-circle" size={16} color="#28a745" />
                  <Text style={styles.detailLabel}>Txn ID:</Text>
                  <Text style={[styles.detailValue, { color: '#28a745', fontWeight: '700' }]}>
                    {withdrawal.admin_transaction_id}
                  </Text>
                </View>
              )}
              {withdrawal.memo && (
                <View style={styles.detailRow}>
                  <Icon name="note" size={16} color="#666" />
                  <Text style={styles.detailLabel}>Memo:</Text>
                  <Text style={styles.detailValue}>{withdrawal.memo}</Text>
                </View>
              )}
            </View>

            {(withdrawal.status === 'apply' || withdrawal.status === 'pending' || withdrawal.status === 'processing') && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.approveButton,
                    approvingId === withdrawal.id && styles.approveButtonDisabled,
                  ]}
                  onPress={() => handleApprove(withdrawal.id)}
                  disabled={approvingId === withdrawal.id}
                >
                  <Icon name="check-circle" size={20} color="#28a745" />
                  <Text style={styles.approveButtonText}>
                    {approvingId === withdrawal.id ? 'Approving...' : 'Approve'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => handleReject(withdrawal.id)}
                  disabled={approvingId === withdrawal.id}
                >
                  <Icon name="cancel" size={20} color="#dc3545" />
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {withdrawals.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="account-balance-wallet" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No withdrawal requests found</Text>
          </View>
        )}
      </ScrollView>

      {/* Transaction ID Modal */}
      <Modal
        visible={showTransactionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTransactionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Approve Withdrawal</Text>
            <Text style={styles.modalSubtitle}>
              Enter transaction ID (optional):
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Transaction ID (optional)"
              value={tempTransactionId}
              onChangeText={setTempTransactionId}
              placeholderTextColor="#999"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowTransactionModal(false);
                  setTempTransactionId('');
                  setSelectedWithdrawId(null);
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonApprove]}
                onPress={confirmApprove}
              >
                <Text style={styles.modalButtonApproveText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  withdrawalCard: {
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
  withdrawalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  withdrawalInfo: {
    flex: 1,
  },
  withdrawalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 4,
  },
  withdrawalMember: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  withdrawalId: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  withdrawalDetails: {
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
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  approveButtonText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f5f5f5',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  modalButtonApprove: {
    backgroundColor: '#28a745',
  },
  modalButtonApproveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

