import React, { useState, useEffect } from 'react';
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
import { LinearGradient } from 'react-native-linear-gradient';
import { default as Icon } from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';
import { authAPI } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendOTP as msg91SendOTP, verifyOTP as msg91VerifyOTP, retryOTP as msg91RetryOTP, initializeMsg91Widget } from '../utils/msg91SDK';

export default function AdminLoginScreen() {
  const navigation = useNavigation();
  const { setUser, setIsAuthenticated } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [msg91ReqId, setMsg91ReqId] = useState(null); // Store MSG91 request ID

  // Initialize MSG91 Widget on component mount
  useEffect(() => {
    try {
      initializeMsg91Widget();
      console.log('[MSG91] Widget initialized for admin login');
    } catch (error) {
      console.error('[MSG91] Failed to initialize widget:', error);
    }
  }, []);

  // Send OTP for admin login using MSG91 SDK
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
    setMsg91ReqId(null);

    try {
      // First, validate phone exists in backend (for admin check)
      let backendResponse;
      try {
        backendResponse = await authAPI.sendAdminLoginOTP({ phone: cleanedPhone });
      } catch (backendError) {
        const errorStatus = backendError.response?.status;
        const errorMsg = backendError.response?.data?.message || backendError.response?.data?.error || '';
      
        if (errorStatus === 404 || errorMsg.includes('not found') || errorMsg.includes('not registered')) {
          Toast.show({
            type: 'error',
            text1: 'Admin Not Found',
            text2: 'This phone number is not registered as an admin. Please contact support.',
            visibilityTime: 5000,
          });
          setShowOtpModal(false);
          setLoading(false);
          return;
        }
        throw backendError;
      }

      // Send OTP using MSG91 SDK
      const msg91Result = await msg91SendOTP(cleanedPhone);
      
      if (msg91Result.success && msg91Result.reqId) {
        setMsg91ReqId(msg91Result.reqId);
        setShowOtpModal(true);
        setOtpVerified(false);
        Toast.show({
          type: 'success',
          text1: 'OTP Sent',
          text2: 'Please check your phone for the OTP',
        });
        console.log('✅ MSG91 OTP sent for admin login, reqId:', msg91Result.reqId);
      } else {
        // Fallback: use backend OTP (already validated above)
        setShowOtpModal(true);
        setOtpVerified(false);
        // Show OTP to user (for testing)
        if (backendResponse?.data?.otp) {
          Toast.show({
            type: 'info',
            text1: 'OTP Generated',
            text2: `Enter OTP: ${backendResponse.data.otp}`,
            visibilityTime: 10000,
          });
          console.log('🔑 Admin OTP:', backendResponse.data.otp);
        }
        Toast.show({
          type: 'success',
          text1: 'OTP Sent',
          text2: 'Please check your phone for the OTP',
        });
      }
    } catch (error) {
      console.error('[Admin Login] Send OTP error:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to send OTP';
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMsg,
        visibilityTime: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP for admin login (uses MSG91 SDK if reqId available, otherwise backend fallback)
  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length < 4) {
      Toast.show({
        type: 'error',
        text1: 'Invalid OTP',
        text2: 'Please enter a valid OTP code',
      });
      return;
    }

    setLoading(true);
    try {
      const cleanedPhone = phoneNumber.replace(/\D/g, '');
      let verified = false;
      let verifyResponse = null;
      let isMsg91Verified = false; // Track if MSG91 SDK verified

      // Try MSG91 SDK verification first if reqId is available
      if (msg91ReqId) {
        console.log('[Admin Login] 🔍 Attempting MSG91 SDK verification with reqId:', msg91ReqId, 'OTP:', otpCode.trim());
        try {
          const msg91VerifyResult = await msg91VerifyOTP(msg91ReqId, otpCode.trim());
          console.log('[Admin Login] 📱 MSG91 SDK verification result:', msg91VerifyResult);
          
          if (msg91VerifyResult.success) {
            verified = true;
            isMsg91Verified = true; // Mark as MSG91 verified
            console.log('[Admin Login] ✅ MSG91 OTP verified successfully');
            
            // Now get login token from backend - send msg91Verified flag to bypass OTP comparison
            console.log('[Admin Login] 📤 Sending admin login verification with msg91Verified=true');
            verifyResponse = await authAPI.verifyAdminLoginOTP({
              phone: cleanedPhone,
              otp: otpCode.trim(),
              msg91Verified: true // Tell backend MSG91 SDK already verified
            });
          } else {
            console.warn('[Admin Login] ⚠️ MSG91 SDK verification failed:', msg91VerifyResult);
          }
        } catch (msg91Error) {
          console.error('[Admin Login] ❌ MSG91 SDK verification error:', msg91Error);
          // Continue to backend fallback
        }
      }

      // Fallback to backend verification if MSG91 not used or failed
      if (!verified || !verifyResponse) {
        console.log('[Admin Login] 🔄 Falling back to backend OTP verification (msg91Verified=false)');
        verifyResponse = await authAPI.verifyAdminLoginOTP({
          phone: cleanedPhone,
          otp: otpCode.trim()
        });
        verified = verifyResponse.data.success;
        isMsg91Verified = false; // Backend verified, not MSG91 SDK
      }

      if (verified && verifyResponse && verifyResponse.data.success) {
        setOtpVerified(true);
        setShowOtpModal(false);
        
        const userData = verifyResponse.data.user || verifyResponse.data.data;
        
        // Store token and user data using the same keys as AuthContext expects
        if (verifyResponse.data.token) {
          await AsyncStorage.setItem('authToken', verifyResponse.data.token);
          await AsyncStorage.setItem('token', verifyResponse.data.token); // Keep for backward compatibility
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
          text2: verifyResponse?.data?.message || 'Invalid OTP. Please try again.',
        });
      }
    } catch (error) {
      console.error('[Admin Login] OTP verification error:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Please try again';
      
      if (errorMsg.includes('not found') || errorMsg.includes('expired')) {
        Toast.show({
          type: 'error',
          text1: 'OTP Expired',
          text2: 'Please request a new OTP',
        });
        setTimeout(() => {
          handleSendOTP();
        }, 1000);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Verification Failed',
          text2: errorMsg,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Retry OTP using MSG91 SDK
  const handleResendOTP = async () => {
    if (!msg91ReqId) {
      // If no reqId, just resend OTP
      await handleSendOTP();
      return;
    }

    setLoading(true);
    try {
      const retryResult = await msg91RetryOTP(msg91ReqId);
      if (retryResult.success) {
        Toast.show({
          type: 'success',
          text1: 'OTP Resent',
          text2: 'Please check your phone for the new OTP',
        });
      } else {
        // Fallback to resend via backend
        await handleSendOTP();
      }
    } catch (error) {
      console.error('[Admin Login] Retry OTP error:', error);
      // Fallback to resend via backend
      await handleSendOTP();
    } finally {
      setLoading(false);
    }
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

