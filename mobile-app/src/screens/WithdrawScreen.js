import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { withdrawAPI, dashboardAPI } from '../config/api';
import Toast from 'react-native-toast-message';
import { formatCurrency, formatDate } from '../utils/helpers';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';

export default function WithdrawScreen({ navigation }) {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank'); // 'Bank' or 'UPI'
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [memo, setMemo] = useState('');
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setError(null);
      setRefreshing(true);
      const [balanceResponse, historyResponse] = await Promise.all([
        dashboardAPI.getStats().catch(err => {
          console.error('Balance error:', err);
          return { data: { data: { stats: {} } } };
        }),
        withdrawAPI.getHistory().catch(err => {
          console.error('History error:', err);
          return { data: { data: [] } };
        }),
      ]);

      // Parse nested response structure: response.data.data.stats
      const responseData = balanceResponse.data?.data || balanceResponse.data || {};
      const stats = responseData.stats || {};
      
      console.log('WithdrawScreen - Full API Response:', JSON.stringify(balanceResponse.data, null, 2));
      console.log('WithdrawScreen - Response Data:', JSON.stringify(responseData, null, 2));
      console.log('WithdrawScreen - Stats Object:', JSON.stringify(stats, null, 2));
      console.log('WithdrawScreen - Current Balance:', stats.currentBalance);
      console.log('WithdrawScreen - Total Investment:', stats.totalInvestment);
      console.log('Withdrawable Balance (from API):', stats.withdrawableBalance);
      
      // Use withdrawableBalance (earnings only, excludes investment)
      // Fallback to calculating: currentBalance - totalInvestment
      let balanceValue = 0;
      if (stats.withdrawableBalance !== undefined && stats.withdrawableBalance !== null) {
        balanceValue = Number(stats.withdrawableBalance);
        console.log('WithdrawScreen - Using withdrawableBalance from API:', balanceValue);
      } else {
        // Calculate manually if not provided
        const currentBal = Number(stats.currentBalance || 0);
        const totalInv = Number(stats.totalInvestment || 0);
        balanceValue = Math.max(0, currentBal - totalInv);
        console.log('WithdrawScreen - Calculated withdrawableBalance:', balanceValue, '(currentBalance:', currentBal, '- totalInvestment:', totalInv, ')');
      }
      
      console.log('WithdrawScreen - Final balance value to display:', balanceValue, '(earnings only, excludes investment)');
      setBalance(balanceValue);
      
      // Handle different response formats
      let withdrawalsData = [];
      if (historyResponse?.data?.data && Array.isArray(historyResponse.data.data)) {
        withdrawalsData = historyResponse.data.data;
      } else if (historyResponse?.data && Array.isArray(historyResponse.data)) {
        withdrawalsData = historyResponse.data;
      } else if (Array.isArray(historyResponse)) {
        withdrawalsData = historyResponse;
      }
      
      setWithdrawals(Array.isArray(withdrawalsData) ? withdrawalsData : []);
    } catch (error) {
      console.error('Error loading withdraw data:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load data';
      setError(errorMsg);
      showErrorToast(error, errorMsg);
      setBalance(0);
      setWithdrawals([]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleWithdraw = async () => {
    console.log('[WITHDRAW] handleWithdraw called');
    console.log('[WITHDRAW] Form data:', {
      amount,
      paymentMethod,
      accountNumber,
      ifscCode,
      upiId,
      balance
    });

    const withdrawAmount = parseFloat(amount);
    console.log('[WITHDRAW] Parsed amount:', withdrawAmount);

    if (!amount || isNaN(withdrawAmount) || withdrawAmount < 100) {
      console.log('[WITHDRAW] Validation failed: Amount too low');
      showErrorToast(null, 'Minimum withdrawal amount is ₹100');
      return;
    }

    if (withdrawAmount > balance) {
      console.log('[WITHDRAW] Validation failed: Insufficient balance', { withdrawAmount, balance });
      showErrorToast(null, `Insufficient balance. Your current balance is ₹${balance.toLocaleString()}`);
      return;
    }

    // Validate payment method specific fields
    if (paymentMethod === 'Bank') {
      if (!accountNumber || !ifscCode) {
        console.log('[WITHDRAW] Validation failed: Missing bank details');
        showErrorToast(null, 'Please enter account number and IFSC code');
        return;
      }
    } else if (paymentMethod === 'UPI') {
      if (!upiId) {
        console.log('[WITHDRAW] Validation failed: Missing UPI ID');
        showErrorToast(null, 'Please enter UPI ID');
        return;
      }
    }

    console.log('[WITHDRAW] All validations passed, showing confirmation alert');
    
    // Use a simpler approach - call the submission directly after confirmation
    // For web compatibility, we'll use window.confirm if Alert doesn't work
    const isWeb = typeof window !== 'undefined' && window.confirm;
    
    if (isWeb) {
      // Web browser - use window.confirm
      const confirmed = window.confirm(
        `Are you sure you want to withdraw ₹${withdrawAmount.toLocaleString()} via ${paymentMethod}?`
      );
      
      if (confirmed) {
        console.log('[WITHDRAW] User confirmed via window.confirm');
        submitWithdrawalRequest(withdrawAmount);
      } else {
        console.log('[WITHDRAW] User cancelled via window.confirm');
      }
    } else {
      // React Native - use Alert.alert
      Alert.alert(
        'Confirm Withdrawal',
        `Are you sure you want to withdraw ₹${withdrawAmount.toLocaleString()} via ${paymentMethod}?`,
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => {
              console.log('[WITHDRAW] User cancelled');
            }
          },
          {
            text: 'Confirm',
            onPress: () => {
              console.log('[WITHDRAW] ===========================================');
              console.log('[WITHDRAW] ✅ User confirmed via Alert!');
              console.log('[WITHDRAW] About to call submitWithdrawalRequest');
              console.log('[WITHDRAW] Withdraw amount:', withdrawAmount);
              console.log('[WITHDRAW] ===========================================');
              
              // Call the submission function immediately
              // Don't await it - let it run asynchronously
              submitWithdrawalRequest(withdrawAmount).catch(err => {
                console.error('[WITHDRAW] Error in submitWithdrawalRequest:', err);
              });
            },
          },
        ],
        { cancelable: true }
      );
    }
  };

  // Separate function for submitting withdrawal request
  const submitWithdrawalRequest = async (withdrawAmount) => {
    console.log('[WITHDRAW] ===========================================');
    console.log('[WITHDRAW] submitWithdrawalRequest called');
    console.log('[WITHDRAW] Amount:', withdrawAmount);
    console.log('[WITHDRAW] ===========================================');
    
    setLoading(true);
    console.log('[WITHDRAW] Loading state set to true');
    
    try {
      const requestPayload = {
        amount: withdrawAmount,
        payment_method: paymentMethod,
        account_number: paymentMethod === 'Bank' ? accountNumber : undefined,
        ifsc_code: paymentMethod === 'Bank' ? ifscCode : undefined,
        upi_id: paymentMethod === 'UPI' ? upiId : undefined,
        bank_name: bankName || undefined,
        account_holder_name: accountHolderName || undefined,
        memo: memo.trim() || undefined,
      };
      
      console.log('[WITHDRAW] ===========================================');
      console.log('[WITHDRAW] Submitting withdrawal request');
      console.log('[WITHDRAW] Request payload:', JSON.stringify(requestPayload, null, 2));
      console.log('[WITHDRAW] Calling withdrawAPI.request...');
      
      const response = await withdrawAPI.request(requestPayload);
      
      console.log('[WITHDRAW] ===========================================');
      console.log('[WITHDRAW] ✅ API call successful!');
      console.log('[WITHDRAW] Response status:', response.status);
      console.log('[WITHDRAW] Response data:', JSON.stringify(response.data, null, 2));
      console.log('[WITHDRAW] ===========================================');

      // Show success toast - use both methods to ensure it shows
      const successMessage = response.data?.message || 'Withdrawal request submitted successfully';
      console.log('[WITHDRAW] About to show success toast...');
      console.log('[WITHDRAW] Toast message:', successMessage);
      
      // Primary toast
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: successMessage,
        visibilityTime: 5000,
        position: 'top',
        topOffset: 60,
      });
      
      // Backup toast using showSuccessToast
      showSuccessToast(successMessage, 'Success');
      
      console.log('[WITHDRAW] ✅ Success toast shown!');

      // Clear form
      setAmount('');
      setMemo('');
      setAccountNumber('');
      setIfscCode('');
      setUpiId('');
      setBankName('');
      setAccountHolderName('');
      console.log('[WITHDRAW] Form cleared');
      
      // Reload data to show new withdrawal
      console.log('[WITHDRAW] Reloading data...');
      await loadData();
      console.log('[WITHDRAW] Data reloaded');
      
      // Don't navigate automatically - user can stay on withdraw screen to see the new request
      // If you want to navigate, uncomment below and use 'goBack' instead of 'navigate'
      // setTimeout(() => {
      //   console.log('[WITHDRAW] Navigating back...');
      //   if (navigation.canGoBack()) {
      //     navigation.goBack();
      //   }
      // }, 2000);
      
    } catch (error) {
      console.error('[WITHDRAW] ===========================================');
      console.error('[WITHDRAW] ❌ Withdrawal error occurred');
      console.error('[WITHDRAW] Error object:', error);
      console.error('[WITHDRAW] Error response:', error.response?.data);
      console.error('[WITHDRAW] Error message:', error.message);
      console.error('[WITHDRAW] Error stack:', error.stack);
      console.error('[WITHDRAW] ===========================================');
      
      let errorMsg = 'Failed to submit withdrawal request';
      
      if (error.response) {
        // API returned an error response
        errorMsg = error.response.data?.message || 
                  error.response.data?.error || 
                  error.response.data?.errors?.[0]?.msg ||
                  `Error ${error.response.status}: ${error.response.statusText}`;
      } else if (error.message) {
        // Network or other error
        errorMsg = error.message;
      }
      
      console.error('[WITHDRAW] Final error message:', errorMsg);
      
      // Show error toast with proper message
      if (errorMsg && errorMsg !== 'null' && errorMsg !== 'undefined') {
        showErrorToast(error, errorMsg);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to submit withdrawal request. Please try again.',
          visibilityTime: 4000,
          position: 'top',
        });
      }
    } finally {
      setLoading(false);
      console.log('[WITHDRAW] Loading state set to false');
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
        <Text style={styles.headerTitle}>Withdraw</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <View style={styles.content}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Withdrawable Balance</Text>
          <Text style={styles.balanceValue}>
            {formatCurrency(balance)}
          </Text>
          <Text style={styles.balanceNote}>
            (Earnings only - Investment is locked)
          </Text>
        </View>

        {/* Withdraw Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Request Withdrawal</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount (min ₹100)"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            <Text style={styles.inputHint}>
              Minimum withdrawal: ₹100
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Payment Method *</Text>
            <View style={styles.paymentMethodContainer}>
              <TouchableOpacity
                style={[
                  styles.paymentMethodButton,
                  paymentMethod === 'Bank' && styles.paymentMethodButtonActive,
                ]}
                onPress={() => setPaymentMethod('Bank')}
              >
                <Icon 
                  name="account-balance" 
                  size={20} 
                  color={paymentMethod === 'Bank' ? '#fff' : '#666'} 
                />
                <Text
                  style={[
                    styles.paymentMethodText,
                    paymentMethod === 'Bank' && styles.paymentMethodTextActive,
                  ]}
                >
                  Bank Transfer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.paymentMethodButton,
                  paymentMethod === 'UPI' && styles.paymentMethodButtonActive,
                ]}
                onPress={() => setPaymentMethod('UPI')}
              >
                <Icon 
                  name="account-balance-wallet" 
                  size={20} 
                  color={paymentMethod === 'UPI' ? '#fff' : '#666'} 
                />
                <Text
                  style={[
                    styles.paymentMethodText,
                    paymentMethod === 'UPI' && styles.paymentMethodTextActive,
                  ]}
                >
                  UPI
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {paymentMethod === 'Bank' ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter account number"
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>IFSC Code *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter IFSC code"
                  value={ifscCode}
                  onChangeText={(text) => setIfscCode(text.toUpperCase())}
                  autoCapitalize="characters"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bank Name (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter bank name"
                  value={bankName}
                  onChangeText={setBankName}
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Holder Name (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter account holder name"
                  value={accountHolderName}
                  onChangeText={setAccountHolderName}
                  placeholderTextColor="#999"
                />
              </View>
            </>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>UPI ID *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter UPI ID (e.g., yourname@paytm)"
                value={upiId}
                onChangeText={setUpiId}
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Memo (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add a note (optional)"
              value={memo}
              onChangeText={setMemo}
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, (loading || !amount) && styles.submitButtonDisabled]}
            onPress={() => {
              console.log('[WITHDRAW] ===========================================');
              console.log('[WITHDRAW] Submit button pressed!');
              console.log('[WITHDRAW] Current state:', {
                amount,
                balance,
                paymentMethod,
                loading,
                accountNumber: paymentMethod === 'Bank' ? accountNumber : 'N/A',
                upiId: paymentMethod === 'UPI' ? upiId : 'N/A'
              });
              console.log('[WITHDRAW] ===========================================');
              if (!loading) {
                handleWithdraw();
              } else {
                console.log('[WITHDRAW] Already loading, ignoring press');
              }
            }}
            disabled={loading || !amount}
            activeOpacity={0.7}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Withdrawal History */}
        <View style={styles.historyCard}>
          <Text style={styles.sectionTitle}>Withdrawal History</Text>

          {!Array.isArray(withdrawals) || withdrawals.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="account-balance-wallet" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No withdrawal requests yet</Text>
            </View>
          ) : (
            withdrawals.map((withdrawal) => (
              <View key={withdrawal.id} style={styles.withdrawalItem}>
                <View style={styles.withdrawalHeader}>
                  <View>
                    <Text style={styles.withdrawalAmount}>
                      ₹{formatCurrency(withdrawal.amount)}
                    </Text>
                    <Text style={styles.withdrawalDate}>
                      {formatDate(withdrawal.created)}
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
                  <Text style={styles.detailLabel}>
                    Method: {withdrawal.payment_method || 'Bank'}
                  </Text>
                  {withdrawal.payment_method === 'Bank' && (
                    <>
                      {withdrawal.account_number && (
                        <Text style={styles.detailText}>
                          Account: {withdrawal.account_number}
                        </Text>
                      )}
                      {withdrawal.ifsc_code && (
                        <Text style={styles.detailText}>
                          IFSC: {withdrawal.ifsc_code}
                        </Text>
                      )}
                    </>
                  )}
                  {withdrawal.payment_method === 'UPI' && withdrawal.upi_id && (
                    <Text style={styles.detailText}>
                      UPI: {withdrawal.upi_id}
                    </Text>
                  )}
                  {withdrawal.transax_id && (
                    <Text style={styles.transactionId}>
                      Transaction ID: {withdrawal.transax_id}
                    </Text>
                  )}
                  {withdrawal.admin_transaction_id && (
                    <Text style={styles.adminTransactionId}>
                      Admin Txn ID: {withdrawal.admin_transaction_id}
                    </Text>
                  )}
                  {withdrawal.memo && (
                    <Text style={styles.memoText}>Note: {withdrawal.memo}</Text>
                  )}
                </View>
              </View>
            ))
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  placeholder: {
    width: 40,
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
  balanceNote: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  formCard: {
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
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  withdrawalItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 16,
  },
  withdrawalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  withdrawalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  withdrawalDate: {
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
  transactionId: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  memoText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentMethodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D4AF37',
    backgroundColor: '#fff',
    gap: 8,
  },
  paymentMethodButtonActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  paymentMethodTextActive: {
    color: '#fff',
  },
  withdrawalDetails: {
    marginTop: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  adminTransactionId: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
    marginTop: 4,
  },
});

