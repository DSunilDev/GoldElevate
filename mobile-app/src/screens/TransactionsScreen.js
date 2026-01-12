import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'react-native-linear-gradient';
import { incomeAPI, paymentAPI } from '../config/api';
import Toast from 'react-native-toast-message';
import { default as Icon } from 'react-native-vector-icons/MaterialIcons';
import { formatCurrency, formatDateTime } from '../utils/helpers';
import { showErrorToast } from '../utils/errorHandler';

export default function TransactionsScreen() {
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ credits: 0, debits: 0 });
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setRefreshing(true);
      
      // Fetch both income transactions and payment submissions
      let incomeTxs = [];
      let payments = [];
      
      try {
        const incomeResponse = await incomeAPI.getTransactions();
        incomeTxs = incomeResponse?.data?.data || incomeResponse?.data || [];
        if (!Array.isArray(incomeTxs)) incomeTxs = [];
      } catch (incomeError) {
        console.error('Error loading income transactions:', incomeError);
        incomeTxs = [];
      }
      
      try {
        const paymentResponse = await paymentAPI.getHistory();
        payments = paymentResponse?.data?.data || paymentResponse?.data || [];
        if (!Array.isArray(payments)) payments = [];
      } catch (paymentError) {
        console.error('Error loading payment history:', paymentError);
        payments = [];
      }
      
      // Transform income data to transaction format
      const incomeTransactions = incomeTxs.map(tx => ({
        ...tx,
        type: tx.amount > 0 ? 'credit' : 'debit',
        description: tx.classify || 'Income',
        created: tx.created || tx.date,
        transactionType: 'income',
      }));
      
      // Transform payment data to transaction format
      const paymentTransactions = payments.map(payment => ({
        ...payment,
        type: 'debit', // Payment is a debit (money going out)
        description: `Payment Submission - ${payment.payment_method || 'UPI'}`,
        amount: -Math.abs(payment.amount || 0), // Negative for debit
        created: payment.created,
        transactionType: 'payment',
        status: payment.status || 'Pending',
        upi_reference: payment.upi_reference,
        transaction_id: payment.transaction_id,
        incomeid: payment.upipaymentid, // Use payment ID as unique identifier
      }));
      
      // Combine and sort by date (newest first)
      const allTransactions = [...incomeTransactions, ...paymentTransactions].sort((a, b) => {
        const dateA = new Date(a.created || 0);
        const dateB = new Date(b.created || 0);
        return dateB - dateA;
      });
      
      setTransactions(allTransactions);
      
      // Calculate stats
      const credits = allTransactions
        .filter(tx => tx.type === 'credit' || tx.amount > 0)
        .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
      
      const debits = allTransactions
        .filter(tx => tx.type === 'debit' || tx.amount < 0)
        .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
      
      setStats({ credits, debits });
    } catch (error) {
      console.error('Error loading transactions:', error);
      showErrorToast(error, 'Failed to load transactions');
      setTransactions([]);
      setStats({ credits: 0, debits: 0 });
    } finally {
      setRefreshing(false);
    }
  };

  const filteredTransactions = filter === 'all'
    ? transactions
    : transactions.filter(tx => {
        if (filter === 'credits') return tx.type === 'credit' || tx.amount > 0;
        if (filter === 'debits') return tx.type === 'debit' || tx.amount < 0;
        return true;
      });

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
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions</Text>
        <Text style={styles.headerSubtitle}>View your transaction history</Text>
      </LinearGradient>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Icon name="arrow-downward" size={24} color="#28a745" />
          <Text style={styles.statLabel}>Total Credits</Text>
          <Text style={styles.statValueGreen}>{formatCurrency(stats.credits)}</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="arrow-upward" size={24} color="#dc3545" />
          <Text style={styles.statLabel}>Total Debits</Text>
          <Text style={styles.statValueRed}>{formatCurrency(stats.debits)}</Text>
        </View>
      </View>

      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'credits' && styles.filterButtonActive]}
          onPress={() => setFilter('credits')}
        >
          <Text style={[styles.filterText, filter === 'credits' && styles.filterTextActive]}>Credits</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'debits' && styles.filterButtonActive]}
          onPress={() => setFilter('debits')}
        >
          <Text style={[styles.filterText, filter === 'debits' && styles.filterTextActive]}>Debits</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>
          Transactions ({filteredTransactions.length})
        </Text>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="receipt-long" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        ) : (
          filteredTransactions.map((tx) => {
            const isCredit = tx.type === 'credit' || tx.amount > 0;
            return (
              <View key={tx.incomeid || tx.ledgerid || tx.upipaymentid || tx.id || `tx-${tx.created}`} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <View style={[styles.iconContainer, isCredit ? styles.iconGreen : styles.iconRed]}>
                    <Icon
                      name={isCredit ? 'arrow-downward' : 'arrow-upward'}
                      size={24}
                      color="#fff"
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle}>
                      {tx.description || tx.classify || 'Transaction'}
                    </Text>
                    {tx.transactionType === 'payment' && tx.upi_reference && (
                      <Text style={styles.paymentRef}>
                        Ref: {tx.upi_reference}
                      </Text>
                    )}
                    <View style={styles.transactionMeta}>
                      <Text style={styles.transactionDate}>{formatDateTime(tx.created || tx.date)}</Text>
                      <View style={[
                        styles.statusBadge,
                        tx.status === 'Verified' ? styles.statusVerified : 
                        tx.status === 'Pending' ? styles.statusPending : 
                        styles.statusCompleted
                      ]}>
                        <Text style={[
                          styles.statusText,
                          tx.status === 'Verified' ? styles.statusTextVerified :
                          tx.status === 'Pending' ? styles.statusTextPending :
                          styles.statusTextCompleted
                        ]}>
                          {tx.status || 'Completed'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.transactionAmount, isCredit ? styles.amountGreen : styles.amountRed]}>
                    {isCredit ? '+' : '-'}{formatCurrency(Math.abs(tx.amount || 0))}
                  </Text>
                </View>
              </View>
            );
          })
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
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    padding: 8,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  statValueGreen: {
    fontSize: 20,
    fontWeight: '700',
    color: '#28a745',
    marginTop: 4,
  },
  statValueRed: {
    fontSize: 20,
    fontWeight: '700',
    color: '#dc3545',
    marginTop: 4,
  },
  filters: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
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
    marginTop: 16,
  },
  transactionCard: {
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
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconGreen: {
    backgroundColor: 'rgba(40, 167, 69, 0.2)',
  },
  iconRed: {
    backgroundColor: 'rgba(220, 53, 69, 0.2)',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontWeight: '700',
    color: '#333',
    fontSize: 16,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusVerified: {
    backgroundColor: 'rgba(40, 167, 69, 0.2)',
  },
  statusPending: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
  },
  statusCompleted: {
    backgroundColor: 'rgba(40, 167, 69, 0.2)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextVerified: {
    color: '#28a745',
  },
  statusTextPending: {
    color: '#FF9800',
  },
  statusTextCompleted: {
    color: '#28a745',
  },
  paymentRef: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
  },
  transactionAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  amountGreen: {
    color: '#28a745',
  },
  amountRed: {
    color: '#dc3545',
  },
});
