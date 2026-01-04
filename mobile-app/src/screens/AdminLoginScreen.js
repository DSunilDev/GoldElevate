import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';
import { authAPI } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminLoginScreen() {
  const navigation = useNavigation();
  const { setUser, setIsAuthenticated } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  const handleSendOTP = async () => {
    // Validate phone number - accept any 10-digit number
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    if (!cleanedPhone || cleanedPhone.length !== 10) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Phone Number',
        text2: 'Please enter a valid 10-digit phone number',
      });
      return;
    }

    setLoading(true);
    setOtpCode('');
    try {
      const response = await authAPI.sendAdminLoginOTP({ phone: cleanedPhone });
      
      if (response.data.success) {
        setShowOtpModal(true);
        setOtpVerified(false);
        // Show OTP to user (for testing)
        if (response.data.otp) {
          Toast.show({
            type: 'info',
            text1: 'OTP Generated',
            text2: `Enter OTP: ${response.data.otp}`,
            visibilityTime: 10000,
          });
          console.log('🔑 Admin OTP:', response.data.otp);
        }
        Toast.show({
          type: 'success',
          text1: 'OTP Sent',
          text2: 'Please enter the OTP sent to your phone',
        });
      }
    } catch (error) {
      console.error('Admin login OTP error:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to send OTP';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      Toast.show({
        type: 'error',
        text1: 'Invalid OTP',
        text2: 'Please enter a valid 6-digit OTP',
      });
      return;
    }

    setLoading(true);
    try {
      const cleanedPhone = phoneNumber.replace(/\D/g, '');
      const response = await authAPI.verifyAdminLoginOTP({
        phone: cleanedPhone,
        otp: otpCode,
      });

      if (response.data.success) {
        setOtpVerified(true);
        const userData = response.data.user || response.data.data;
        
        // Store token and user data using the same keys as AuthContext expects
        if (response.data.token) {
          await AsyncStorage.setItem('authToken', response.data.token);
          await AsyncStorage.setItem('token', response.data.token); // Keep for backward compatibility
        }
        if (userData) {
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
          await AsyncStorage.setItem('user', JSON.stringify(userData)); // Keep for backward compatibility
          setUser(userData);
        }
        
        setIsAuthenticated(true);
        
        Toast.show({
          type: 'success',
          text1: 'Login Successful',
          text2: 'Welcome back, Admin!',
        });

        // Navigate to admin dashboard - use reset to clear navigation stack
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'AdminTabs' }],
          });
        }, 500);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Verification Failed',
          text2: response.data.message || 'Invalid OTP. Please try again.',
        });
      }
    } catch (error) {
      console.error('Admin OTP verification error:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to verify OTP';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    await handleSendOTP();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#D4AF37', '#B8941F']}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Icon name="admin-panel-settings" size={64} color="#fff" />
            </View>
            <Text style={styles.title}>Admin Login</Text>
            <Text style={styles.subtitle}>Access admin dashboard</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Icon name="phone" size={20} color="#D4AF37" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter Admin Phone Number"
                placeholderTextColor="#999"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={10}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.buttonText}>Sending OTP...</Text>
              ) : (
                <>
                  <Icon name="send" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Send OTP</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.linkText}>Back to User Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* OTP Modal */}
      <Modal
        visible={showOtpModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOtpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter OTP</Text>
            <Text style={styles.modalSubtitle}>
              Enter the 6-digit OTP sent to {phoneNumber}
            </Text>

            <TextInput
              style={styles.otpInput}
              placeholder="000000"
              placeholderTextColor="#999"
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowOtpModal(false);
                  setOtpCode('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm, loading && styles.buttonDisabled]}
                onPress={handleVerifyOTP}
                disabled={loading}
              >
                {loading ? (
                  <Text style={styles.modalButtonText}>Verifying...</Text>
                ) : (
                  <Text style={styles.modalButtonText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendOTP}
            >
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 60,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 14,
  },
  button: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  otpInput: {
    borderWidth: 2,
    borderColor: '#D4AF37',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f5f5f5',
  },
  modalButtonConfirm: {
    backgroundColor: '#D4AF37',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalButtonTextCancel: {
    color: '#666',
    fontSize: 16,
    fontWeight: '700',
  },
  resendButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '600',
  },
});

