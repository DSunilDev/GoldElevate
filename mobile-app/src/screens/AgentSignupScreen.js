import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';
import { authAPI } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AgentSignupScreen() {
  const navigation = useNavigation();
  const { setUser, setIsAuthenticated } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');

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
    try {
      console.log('Sending OTP request for phone:', phoneNumber);
      console.log('API Base URL:', require('../config/api').default?.defaults?.baseURL || 'Not available');
      
      // Send OTP for agent signup with extended timeout
      const response = await authAPI.sendAgentOTP({ phone: phoneNumber });
      
      if (response.data.success) {
        setShowOtpModal(true);
        setOtpVerified(false);
        // Show OTP to user (for testing - remove in production)
        if (response.data.otp) {
          Toast.show({
            type: 'info',
            text1: 'OTP Generated',
            text2: `Enter OTP: ${response.data.otp}`,
            visibilityTime: 10000,
          });
          console.log('🔑 OTP for agent signup:', response.data.otp);
        }
        Toast.show({
          type: 'success',
          text1: 'OTP Generated',
          text2: 'Please enter the OTP',
        });
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      let errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to send OTP';
      
      // Handle timeout errors specifically
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMsg = 'Request timed out. Please check your internet connection and try again.';
        Toast.show({
          type: 'error',
          text1: 'Connection Timeout',
          text2: errorMsg,
          visibilityTime: 5000,
        });
      }
      // If phone already exists, show specific message
      else if (errorMsg.includes('already registered') || errorMsg.includes('already exists') || errorMsg.includes('Phone number already')) {
        Toast.show({
          type: 'error',
          text1: 'Phone Already Registered',
          text2: 'This phone number is already registered. Please sign in instead.',
          visibilityTime: 5000,
        });
        setShowOtpModal(false);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMsg,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Manual OTP verification for agent signup
  const handleManualOTPVerify = async () => {
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
      console.log('Verifying OTP for agent signup:', { phone: phoneNumber, otp: otpCode });
      
      // Verify OTP
      const verifyResponse = await authAPI.verifyAgentOTP({ 
        phone: phoneNumber,
        otp: otpCode.trim()
      });

      console.log('Agent OTP verify response:', verifyResponse.data);

      if (verifyResponse.data.success) {
        setOtpVerified(true);
        
        // Small delay to ensure backend OTP store is updated
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Create agent account after OTP verification
        const signupData = {
          phone: phoneNumber,
        };
        console.log('Calling agent signup with:', signupData);
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
      } else {
        Toast.show({
          type: 'error',
          text1: 'Invalid OTP',
          text2: verifyResponse.data.message || 'Please enter the correct OTP',
        });
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Please try again';
      
      if (errorMsg.includes('expired')) {
        Toast.show({
          type: 'error',
          text1: 'OTP Expired',
          text2: 'Please request a new OTP',
        });
        // Auto-resend OTP
        setTimeout(() => {
          handleSendOTP();
        }, 1000);
      } else if (errorMsg.includes('already registered') || errorMsg.includes('already exists')) {
        Toast.show({
          type: 'error',
          text1: 'Phone Already Registered',
          text2: 'This phone number is already registered. Please sign in instead.',
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
                onPress={handleManualOTPVerify}
                disabled={loading || otpCode.length < 4}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Verifying...' : 'Verify OTP & Register'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleSendOTP}
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
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
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
