import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { packagesAPI, adminAPI } from '../../config/api';
import Toast from 'react-native-toast-message';
import { formatCurrency } from '../../utils/helpers';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';

export default function AdminPackagesScreen({ navigation }) {
  const [packages, setPackages] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    bv: '',
    daily_return: '',
    c_upper: '',
    yes21: 'No',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const response = await packagesAPI.getAll();
      if (response.data && Array.isArray(response.data.data)) {
        setPackages(response.data.data);
      } else if (Array.isArray(response.data)) {
        setPackages(response.data);
      } else {
        setPackages([]);
      }
    } catch (error) {
      console.error('Error loading packages:', error);
      showErrorToast(error, 'Failed to load packages');
      setPackages([]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name || '',
      price: pkg.price?.toString() || '',
      bv: pkg.bv?.toString() || '',
      daily_return: pkg.daily_return?.toString() || '',
      c_upper: pkg.c_upper?.toString() || '',
      yes21: pkg.yes21 || 'No',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!editingPackage) return;

    if (!formData.name || !formData.price || !formData.daily_return) {
      showErrorToast(null, 'Please fill all required fields (Name, Price, Daily Return)');
      return;
    }

    try {
      const updateData = {
        name: formData.name,
        price: parseFloat(formData.price),
        bv: parseFloat(formData.bv) || 0,
        daily_return: parseFloat(formData.daily_return),
        c_upper: parseInt(formData.c_upper) || 0,
        yes21: formData.yes21,
      };

      const response = await adminAPI.updatePackage(editingPackage.typeid, updateData);
      
      if (response.data?.success !== false) {
        showSuccessToast('Package updated successfully', 'Success');
      setModalVisible(false);
      setEditingPackage(null);
        await loadData();
      } else {
        showErrorToast(null, response.data?.error || response.data?.message || 'Failed to update package');
      }
    } catch (error) {
      console.error('Error updating package:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to update package';
      showErrorToast(error, errorMsg);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Packages</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
      >
        <Text style={styles.countText}>
          {packages.length} package{packages.length !== 1 ? 's' : ''}
        </Text>

        {packages.map((pkg) => (
          <View key={pkg.typeid} style={styles.packageCard}>
            <View style={styles.packageHeader}>
              <View style={styles.packageInfo}>
                <Text style={styles.packageName}>{pkg.name || pkg.short}</Text>
                <Text style={styles.packageId}>Package ID: {pkg.typeid}</Text>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEdit(pkg)}
              >
                <Icon name="edit" size={20} color="#D4AF37" />
              </TouchableOpacity>
            </View>

            <View style={styles.packageDetails}>
              <View style={styles.detailRow}>
                <Icon name="attach-money" size={16} color="#666" />
                <Text style={styles.detailLabel}>Price:</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(pkg.price || 0)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Icon name="account-balance-wallet" size={16} color="#666" />
                <Text style={styles.detailLabel}>BV:</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(pkg.bv || 0)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Icon name="trending-up" size={16} color="#666" />
                <Text style={styles.detailLabel}>Daily Return:</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(pkg.daily_return || 0)}
                </Text>
              </View>
              {pkg.c_upper && (
                <View style={styles.detailRow}>
                  <Icon name="arrow-upward" size={16} color="#666" />
                  <Text style={styles.detailLabel}>C Upper:</Text>
                  <Text style={styles.detailValue}>{pkg.c_upper}</Text>
                </View>
              )}
            </View>
          </View>
        ))}

        {packages.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="card-giftcard" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No packages found</Text>
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Package</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Package Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter package name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Price (₹) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  keyboardType="numeric"
                  placeholder="Enter price"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>BV (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.bv}
                  onChangeText={(text) => setFormData({ ...formData, bv: text })}
                  keyboardType="numeric"
                  placeholder="Enter BV"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Daily Return (₹) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.daily_return}
                  onChangeText={(text) => setFormData({ ...formData, daily_return: text })}
                  keyboardType="numeric"
                  placeholder="Enter daily return"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>C Upper</Text>
                <TextInput
                  style={styles.input}
                  value={formData.c_upper}
                  onChangeText={(text) => setFormData({ ...formData, c_upper: text })}
                  keyboardType="numeric"
                  placeholder="Enter C upper"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
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
  content: {
    flex: 1,
    padding: 16,
  },
  countText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  packageCard: {
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
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  packageInfo: {
    flex: 1,
  },
  packageName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  packageId: {
    fontSize: 12,
    color: '#666',
  },
  editButton: {
    padding: 8,
  },
  packageDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalBody: {
    padding: 20,
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
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#D4AF37',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

