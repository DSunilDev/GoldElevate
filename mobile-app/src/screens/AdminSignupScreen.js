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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendOTP as msg91SendOTP, verifyOTP as msg91VerifyOTP, retryOTP as msg91RetryOTP, initializeMsg91Widget } from '../utils/msg91SDK';

export default function AdminSignupScreen() {
  const navigation = useNavigation();
  const { setUser, setIsAuthenticated } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [msg91ReqId, setMsg91ReqId] = useState(null);

  // Initialize MSG91 Widget on component mount
  useEffect(() => {
    try {
      initializeMsg91Widget();
      console.log('[MSG91] Widget initialized for admin signup');
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

    // Validate admin key
    if (!adminKey || adminKey.trim().length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Admin Key Required',
        text2: 'Please enter the admin key',
      });
      return;
    }

    setLoading(true);
    setOtpCode(''); // Clear previous OTP
    setMsg91ReqId(null); // Clear previous request ID

    try {
      // Try MSG91 SDK first, fallback to backend if SDK fails
      console.log('[Admin Signup] Attempting to send OTP via MSG91 SDK for phone:', phoneNumber);
      const msg91Result = await msg91SendOTP(phoneNumber);
      
      if (msg91Result.success && msg91Result.reqId) {
        // MSG91 SDK succeeded - admin key validation will happen on signup
        // Store admin key in backend store for signup (will be used when msg91Verified=true)
        // We need to pre-store the admin key so backend can validate it during signup
        // The backend /admin-signup endpoint will validate admin key before checking OTP
        setMsg91ReqId(msg91Result.reqId);
        setShowOtpModal(true);
        setOtpVerified(false);
        Toast.show({
          type: 'success',
          text1: 'OTP Sent',
          text2: 'Please enter the OTP sent to your phone',
        });
        console.log('✅ MSG91 SDK OTP sent for admin signup, reqId:', msg91Result.reqId);
      } else {
        // Fallback to backend MSG91 API if SDK fails
        // Backend will validate admin key, check phone exists, and generate OTP
        console.warn('[Admin Signup] MSG91 SDK failed, falling back to backend MSG91 API');
        try {
          const response = await authAPI.sendAdminOTP({ phone: phoneNumber, adminKey: adminKey.trim() });
          
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
              console.log('🔑 OTP for admin signup:', response.data.otp);
            }
            Toast.show({
              type: 'success',
              text1: 'OTP Generated',
              text2: 'Please enter the OTP',
            });
            console.log('✅ OTP sent via backend MSG91 API for admin signup');
          } else {
            throw new Error(response.data.message || 'Failed to send OTP');
          }
        } catch (backendError) {
          const errorMsg = backendError.response?.data?.message || backendError.response?.data?.error || backendError.message || '';
          
          // If admin key is invalid or phone already exists, show specific error
          if (errorMsg.includes('already registered') || errorMsg.includes('already exists') || errorMsg.includes('Phone number already')) {
            Toast.show({
              type: 'error',
              text1: 'Phone Already Registered',
              text2: 'This phone number is already registered. Please sign in instead.',
              visibilityTime: 5000,
            });
            setShowOtpModal(false);
          } else if (errorMsg.includes('Invalid admin key') || errorMsg.includes('admin key')) {
            Toast.show({
              type: 'error',
              text1: 'Invalid Admin Key',
              text2: 'The admin key you entered is incorrect.',
              visibilityTime: 5000,
            });
            setShowOtpModal(false);
          } else {
            throw backendError;
          }
        }
      }
    } catch (error) {
      console.error('[Admin Signup] Send OTP error:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to send OTP';
      
      // If phone already exists, show specific message
      if (errorMsg.includes('already registered') || errorMsg.includes('already exists') || errorMsg.includes('Phone number already')) {
        Toast.show({
          type: 'error',
          text1: 'Phone Already Registered',
          text2: 'This phone number is already registered. Please sign in instead.',
          visibilityTime: 5000,
        });
        setShowOtpModal(false);
      } else if (errorMsg.includes('Invalid admin key') || errorMsg.includes('admin key')) {
        Toast.show({
          type: 'error',
          text1: 'Invalid Admin Key',
          text2: 'The admin key you entered is incorrect.',
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

  // Verify OTP using MSG91 SDK or backend fallback
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
      let verified = false;
      let wasMsg91Verified = false; // Track if MSG91 SDK verified the OTP

      // Try MSG91 SDK verification first if reqId is available
      if (msg91ReqId) {
        console.log('[Admin Signup] Verifying OTP via MSG91 SDK with reqId:', msg91ReqId);
        const msg91VerifyResult = await msg91VerifyOTP(msg91ReqId, otpCode.trim());
        
        if (msg91VerifyResult.success) {
          verified = true;
          wasMsg91Verified = true; // Mark that MSG91 SDK verified successfully
          console.log('✅ MSG91 SDK OTP verified successfully for admin signup');
        } else {
          console.warn('[Admin Signup] MSG91 SDK verification failed, trying backend fallback');
        }
      }

      // Fallback to backend verification if MSG91 SDK not used or failed
      if (!verified) {
        console.log('[Admin Signup] Verifying OTP via backend MSG91 API');
        const verifyResponse = await authAPI.verifyAdminOTP({ 
          phone: phoneNumber,
          otp: otpCode.trim()
        });

        console.log('Admin OTP verify response:', verifyResponse.data);
        verified = verifyResponse.data.success;
        wasMsg91Verified = false; // Backend verified, not MSG91 SDK
      }

      if (verified) {
        setOtpVerified(true);
        
        // Small delay to ensure backend OTP store is updated (if backend verification was used)
        if (!wasMsg91Verified) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Create admin account after OTP verification
        const signupData = {
          phone: phoneNumber,
          adminKey: adminKey.trim(),
        };
        
        // Pass msg91Verified flag if MSG91 SDK verified the OTP
        if (wasMsg91Verified) {
          signupData.msg91Verified = true;
          console.log('[Admin Signup] Sending signup with msg91Verified=true (MSG91 SDK verified)');
        } else {
          console.log('[Admin Signup] Sending signup - backend verified OTP');
        }
        
        console.log('[Admin Signup] Calling admin signup with signupData:', JSON.stringify(signupData, null, 2));
        const result = await authAPI.adminSignup(signupData);
        
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
            text2: 'Admin account created successfully!',
          });
          
          // Redirect to AdminTabs after successful admin signup
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'AdminTabs' }],
            });
          }, 1000);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Registration Failed',
            text2: result.data.message || 'Failed to create admin account',
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

  // Retry OTP using MSG91 SDK if reqId available, otherwise resend
  const handleRetryOTP = async () => {
    if (msg91ReqId) {
      console.log('[Admin Signup] Retrying OTP via MSG91 SDK for reqId:', msg91ReqId);
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
          <Text style={styles.headerIcon}>👨‍💼</Text>
          <Text style={styles.headerTitle}>Admin Registration</Text>
          <Text style={styles.headerSubtitle}>Create admin account</Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          <View style={styles.infoCard}>
            <Icon name="security" size={24} color="#D4AF37" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Admin Access</Text>
              <Text style={styles.infoText}>
                • Full system access{'\n'}
                • Member management{'\n'}
                • Payment verification{'\n'}
                • Application approval{'\n'}
                • Dashboard analytics
              </Text>
            </View>
          </View>

          <Text style={styles.formTitle}>Get Started</Text>
          <Text style={styles.formSubtitle}>Enter your phone number and admin key to register</Text>

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

          <View style={styles.inputGroup}>
            <Icon name="vpn-key" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Admin Key (Required)"
              value={adminKey}
              onChangeText={setAdminKey}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, (loading || phoneNumber.length !== 10 || !adminKey.trim()) && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={loading || phoneNumber.length !== 10 || !adminKey.trim()}
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
