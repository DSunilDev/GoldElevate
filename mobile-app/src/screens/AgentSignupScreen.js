import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'react-native-linear-gradient';
import { default as Icon } from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';
import { authAPI } from '../config/api';
import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendOTP as msg91SendOTP, verifyOTP as msg91VerifyOTP, retryOTP as msg91RetryOTP, initializeMsg91Widget } from '../utils/msg91SDK';

export default function AgentSignupScreen() {
  const navigation = useNavigation();
  const { setUser, setIsAuthenticated } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [msg91ReqId, setMsg91ReqId] = useState(null);

  // Initialize MSG91 Widget on component mount
  useEffect(() => {
    try {
      initializeMsg91Widget();
      console.log('[MSG91] Widget initialized for agent signup');
    } catch (error) {
      console.error('[MSG91] Failed to initialize widget:', error);
    }
  }, []);

  const handleSendOTP = async () => {
    // Validate phone number
    const phoneRegex = /^[6-9]\d{9}$/; // Indian phone number format
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Phone Number',
        text2: 'Please enter a valid 10-digit phone number',
      });
      return;
    }

    setLoading(true);
    setOtpCode(''); // Clear previous OTP
    setMsg91ReqId(null); // Clear previous request ID

    try {
      // Try MSG91 SDK first, fallback to backend if SDK fails
      console.log('[Agent Signup] Attempting to send OTP via MSG91 SDK for phone:', phoneNumber);
      const msg91Result = await msg91SendOTP(phoneNumber);
      
      if (msg91Result.success && msg91Result.reqId) {
        // MSG91 SDK succeeded - no need to call backend (which would generate a different OTP)
        setMsg91ReqId(msg91Result.reqId);
        setShowOtpModal(true);
        setOtpVerified(false);
        Toast.show({
          type: 'success',
          text1: 'OTP Sent',
          text2: 'Please enter the OTP sent to your phone',
        });
        console.log('✅ MSG91 SDK OTP sent for agent signup, reqId:', msg91Result.reqId);
      } else {
        // Fallback to backend MSG91 API if SDK fails
        // Backend will check if phone exists and generate OTP
        console.warn('[Agent Signup] MSG91 SDK failed, falling back to backend MSG91 API');
        try {
          const response = await authAPI.sendAgentOTP({ phone: phoneNumber });
          
          if (response.data.success) {
            setShowOtpModal(true);
            setOtpVerified(false);
            Toast.show({
              type: 'success',
              text1: 'OTP Sent',
              text2: 'Please enter the OTP sent to your phone',
            });
            console.log('✅ OTP sent via backend MSG91 API for agent signup');
          } else {
            throw new Error(response.data.message || 'Failed to send OTP');
          }
        } catch (backendError) {
          const errorMsg = backendError.response?.data?.message || backendError.response?.data?.error || backendError.message || '';
          
          if (errorMsg.includes('already registered') || errorMsg.includes('already exists') || errorMsg.includes('Phone number already')) {
            Toast.show({
              type: 'error',
              text1: 'Phone Already Registered',
              text2: 'This phone number is already registered. Please sign in instead.',
              visibilityTime: 5000,
            });
            setLoading(false);
            return;
          }
          throw backendError;
        }
      }
    } catch (error) {
      console.error('[MSG91 Agent Signup] Send OTP error:', error);
      let errorMsg = error.message || 'Failed to send OTP';

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP using MSG91 SDK
  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length < 4) {
      Toast.show({
        type: 'error',
        text1: 'Invalid OTP',
        text2: 'Please enter a valid OTP code (4-6 digits)',
      });
      return;
    }

    setLoading(true);
    try {
      let verified = false;
      let wasMsg91Verified = false; // Track if MSG91 SDK verified the OTP

      // Try MSG91 SDK verification first if reqId is available
      if (msg91ReqId) {
        console.log('[Agent Signup] Verifying OTP via MSG91 SDK with reqId:', msg91ReqId);
        const msg91VerifyResult = await msg91VerifyOTP(msg91ReqId, otpCode.trim());
        
        if (msg91VerifyResult.success) {
          verified = true;
          wasMsg91Verified = true; // Mark that MSG91 SDK verified successfully
          console.log('✅ MSG91 SDK OTP verified successfully for agent signup');
        } else {
          console.warn('[Agent Signup] MSG91 SDK verification failed, trying backend fallback');
        }
      }

      // Fallback to backend verification if MSG91 SDK not used or failed
      if (!verified) {
        console.log('[Agent Signup] Verifying OTP via backend MSG91 API');
        const verifyResponse = await authAPI.verifyAgentOTP({ 
          phone: phoneNumber,
          otp: otpCode.trim()
        });

        verified = verifyResponse.data.success;
        wasMsg91Verified = false; // Backend verified, not MSG91 SDK
        
        if (!verified) {
          throw new Error(verifyResponse.data.message || 'Invalid OTP');
        }
      }

      if (verified) {
        setOtpVerified(true);

        // Create agent account after OTP verification
        const signupData = {
          phone: phoneNumber,
        };
        
        // Pass msg91Verified flag if MSG91 SDK verified the OTP
        if (wasMsg91Verified) {
          signupData.msg91Verified = true;
          console.log('[MSG91 Agent Signup] Sending signup with msg91Verified=true (MSG91 SDK verified)');
        } else {
          console.log('[MSG91 Agent Signup] Sending signup - backend verified OTP');
        }
        
        console.log('[MSG91 Agent Signup] Calling agent signup with:', signupData);
        const result = await authAPI.agentSignup(signupData);

        if (result.data.success) {
          setShowOtpModal(false);

          // Store token and user data
          const { token, user } = result.data;
          await AsyncStorage.setItem('authToken', token);
          await AsyncStorage.setItem('userData', JSON.stringify(user));

          // Update auth context
          setUser(user);
          setIsAuthenticated(true);

          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Agent registration successful!',
          });

          // Redirect to MemberTabs after successful agent signup
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'MemberTabs' }],
            });
          }, 1000);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Registration Failed',
            text2: result.data.message || 'Failed to create agent account',
          });
        }
      }
    } catch (error) {
      console.error('[MSG91 Agent Signup] OTP verification error:', error);
      let errorMsg = error.message || 'Please try again';

      if (errorMsg.includes('expired') || errorMsg.includes('timeout')) {
        Toast.show({
          type: 'error',
          text1: 'OTP Expired',
          text2: 'Please request a new OTP',
        });
      } else if (errorMsg.includes('invalid') || errorMsg.includes('wrong')) {
        Toast.show({
          type: 'error',
          text1: 'Invalid OTP',
          text2: 'Please enter the correct OTP',
        });
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

  // Retry OTP using MSG91 SDK if reqId available, otherwise resend
  const handleRetryOTP = async () => {
    if (msg91ReqId) {
      console.log('[Agent Signup] Retrying OTP via MSG91 SDK for reqId:', msg91ReqId);
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
    } else {
      // If no reqId, just resend OTP
      await handleSendOTP();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
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
          <Text style={styles.headerIcon}>💼</Text>
          <Text style={styles.headerTitle}>Become an Agent</Text>
          <Text style={styles.headerSubtitle}>Earn commissions by referring members</Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          <View style={styles.infoCard}>
            <Icon name="info" size={24} color="#D4AF37" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Agent Benefits</Text>
              <Text style={styles.infoText}>
                • ₹1,000 commission per referral{'\n'}
                • No investment required{'\n'}
                • Auto-activated account{'\n'}
                • Start earning immediately
              </Text>
            </View>
          </View>

          <Text style={styles.formTitle}>Get Started</Text>
          <Text style={styles.formSubtitle}>Enter your phone number to register as an agent</Text>

          <View style={styles.inputGroup}>
            <Icon name="phone" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={phoneNumber}
              onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ''))}
              keyboardType="phone-pad"
              maxLength={10}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.button, (loading || phoneNumber.length !== 10) && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={loading || phoneNumber.length !== 10}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkTextBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* OTP Verification Modal */}
      <Modal
        visible={showOtpModal && !otpVerified}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (!loading) {
            setShowOtpModal(false);
          }
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                if (!loading) {
                  setShowOtpModal(false);
                }
              }}
              disabled={loading}
            >
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Verify OTP</Text>
            <Text style={styles.modalSubtitle}>
              Enter the OTP sent to {phoneNumber}
            </Text>

            {/* Manual OTP Input */}
            <View style={styles.manualOtpContainer}>
              <View style={styles.inputGroup}>
                <Icon name="lock" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit OTP"
                  value={otpCode}
                  onChangeText={(text) => setOtpCode(text.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  placeholderTextColor="#999"
                />
              </View>
              
              {/* Show OTP hint in development mode */}
              {__DEV__ && (
                <Text style={styles.otpHint}>
                  💡 Check backend terminal/console for OTP code
                </Text>
              )}

              <TouchableOpacity
                style={[styles.button, (loading || otpCode.length < 4) && styles.buttonDisabled]}
                onPress={handleVerifyOTP}
                disabled={loading || otpCode.length < 4}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Verifying...' : 'Verify OTP & Register'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleRetryOTP}
                disabled={loading}
              >
                <Text style={styles.resendText}>
                  Didn't receive? <Text style={styles.resendTextBold}>Resend OTP</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
    alignItems: 'center',
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
  formContainer: {
    flex: 1,
    padding: 24,
    marginTop: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 8,
    fontSize: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#D4AF37',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#666',
  },
  linkTextBold: {
    color: '#D4AF37',
    fontWeight: '700',
  },
  // Modal styles
  modalContainer: {
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
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  manualOtpContainer: {
    width: '100%',
    paddingVertical: 20,
  },
  otpHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  resendButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendTextBold: {
    color: '#D4AF37',
    fontWeight: '700',
  },
});
