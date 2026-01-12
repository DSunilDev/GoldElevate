import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { default as Icon } from 'react-native-vector-icons/MaterialIcons';
import { adminAPI } from '../../config/api';
import Toast from 'react-native-toast-message';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';

export default function AdminApplicationsScreen({ navigation }) {
  const [applications, setApplications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const response = await adminAPI.getPendingSignups();
      if (response.data && Array.isArray(response.data.data)) {
        setApplications(response.data.data);
      } else if (Array.isArray(response.data)) {
        setApplications(response.data);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      showErrorToast(error, 'Failed to load applications');
      setApplications([]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleApprove = async (id) => {
    Alert.alert(
      'Approve Application',
      'Are you sure you want to approve this application?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              const response = await adminAPI.approveSignup(id);
              if (response.data?.success !== false) {
                showSuccessToast('Application approved successfully', 'Success');
                await loadData();
              } else {
                showErrorToast(null, response.data?.message || 'Failed to approve application');
              }
            } catch (error) {
              console.error('Error approving application:', error);
              showErrorToast(error, 'Failed to approve application');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pending Applications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
      >
        <Text style={styles.countText}>
          {applications.length} pending application{applications.length !== 1 ? 's' : ''}
        </Text>

        {applications.map((app) => (
          <View key={app.memberid} style={styles.applicationCard}>
            <View style={styles.applicationHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {app.firstname?.[0]?.toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.applicationInfo}>
                <Text style={styles.applicationName}>
                  {app.firstname || ''} {app.lastname || ''}
                </Text>
                <Text style={styles.applicationId}>@{app.login || ''} • ID: {app.memberid || ''}</Text>
                <Text style={styles.applicationEmail}>{app.email || app.phone || 'N/A'}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Pending</Text>
              </View>
            </View>

            <View style={styles.applicationDetails}>
              <View style={styles.detailRow}>
                <Icon name="card-giftcard" size={16} color="#666" />
                <Text style={styles.detailLabel}>Package:</Text>
                <Text style={styles.detailValue}>{app.package_name || 'N/A'}</Text>
              </View>
              {app.amount && (
                <View style={styles.detailRow}>
                  <Icon name="account-balance" size={16} color="#666" />
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(app.amount || 0)}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Icon name="calendar-today" size={16} color="#666" />
                <Text style={styles.detailLabel}>Applied:</Text>
                <Text style={styles.detailValue}>{formatDate(app.created)}</Text>
              </View>
              {app.transaction_id && (
                <View style={styles.detailRow}>
                  <Icon name="receipt" size={16} color="#666" />
                  <Text style={styles.detailLabel}>Transaction ID:</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>{app.transaction_id}</Text>
                </View>
              )}
              {app.phone && (
                <View style={styles.detailRow}>
                  <Icon name="phone" size={16} color="#666" />
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailValue}>{app.phone}</Text>
                </View>
              )}
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => {
                  Alert.alert('Reject Application', 'This feature is coming soon');
                }}
              >
                <Icon name="close" size={20} color="#dc3545" />
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.approveButton}
                onPress={() => handleApprove(app.memberid)}
              >
                <Icon name="check" size={20} color="#28a745" />
                <Text style={styles.approveButtonText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {applications.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="assignment" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No pending applications</Text>
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
  content: {
    flex: 1,
    padding: 16,
  },
  countText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  applicationCard: {
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
  applicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  applicationInfo: {
    flex: 1,
  },
  applicationName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  applicationId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  applicationEmail: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF9800',
  },
  applicationDetails: {
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

