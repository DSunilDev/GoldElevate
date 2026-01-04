import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { adminAPI } from '../../config/api';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

export default function AdminPaymentGatewayScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    upi_id: '',
    qr_code_url: '',
    qr_code_base64: '',
    bank_account_number: '',
    bank_ifsc_code: '',
    bank_name: '',
    account_holder_name: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await adminAPI.getPaymentGateway();
      console.log('Payment gateway response:', response);
      
      // Handle nested data structure
      const settings = response?.data?.data || response?.data || {};
      
      if (settings) {
        setFormData({
          upi_id: settings.upi_id || '',
          qr_code_url: settings.qr_code_url || '',
          qr_code_base64: settings.qr_code_base64 || '',
          bank_account_number: settings.bank_account_number || '',
          bank_ifsc_code: settings.bank_ifsc_code || '',
          bank_name: settings.bank_name || '',
          account_holder_name: settings.account_holder_name || '',
        });
      }
    } catch (error) {
      console.error('Error loading payment gateway settings:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load payment gateway settings',
      });
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload QR code');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setFormData({ ...formData, qr_code_base64: base64 });
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'QR code image selected',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to pick image',
      });
    }
  };

  const handleSave = async () => {
    if (!formData.upi_id) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'UPI ID is required',
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Updating payment gateway with data:', formData);
      const response = await adminAPI.updatePaymentGateway(formData);
      console.log('Update payment gateway response:', response);
      
      if (response?.data?.success !== false && (response?.data?.success === true || response?.status === 200)) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response?.data?.message || 'Payment gateway settings updated successfully',
        });
        await loadSettings();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response?.data?.message || 'Failed to update settings',
        });
      }
    } catch (error) {
      console.error('Error updating payment gateway:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || error.message || 'Failed to update settings',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Gateway</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>UPI Settings</Text>
        
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>UPI ID *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter UPI ID (e.g., yourbusiness@upi)"
              value={formData.upi_id}
              onChangeText={(text) => setFormData({ ...formData, upi_id: text })}
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>QR Code URL</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter QR code image URL"
              value={formData.qr_code_url}
              onChangeText={(text) => setFormData({ ...formData, qr_code_url: text })}
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity
            style={styles.imagePickerButton}
            onPress={handlePickImage}
          >
            <Icon name="image" size={20} color="#D4AF37" />
            <Text style={styles.imagePickerText}>Upload QR Code Image</Text>
          </TouchableOpacity>

          {formData.qr_code_url && (
            <Image
              source={{ uri: formData.qr_code_url }}
              style={styles.qrPreview}
              resizeMode="contain"
            />
          )}
        </View>

        <Text style={styles.sectionTitle}>Bank Account Details</Text>
        
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Account Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter bank account number"
              value={formData.bank_account_number}
              onChangeText={(text) => setFormData({ ...formData, bank_account_number: text })}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>IFSC Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter IFSC code"
              value={formData.bank_ifsc_code}
              onChangeText={(text) => setFormData({ ...formData, bank_ifsc_code: text.toUpperCase() })}
              autoCapitalize="characters"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bank Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter bank name"
              value={formData.bank_name}
              onChangeText={(text) => setFormData({ ...formData, bank_name: text })}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Account Holder Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter account holder name"
              value={formData.account_holder_name}
              onChangeText={(text) => setFormData({ ...formData, account_holder_name: text })}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Text>
        </TouchableOpacity>
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
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
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
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  imagePickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37',
  },
  qrPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
  },
  saveButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

