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
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';
import { authAPI } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { setUser, setIsAuthenticated } = useAuth();
  
  // Form state
  const [loginMethod, setLoginMethod] = useState('otp'); // 'otp' or 'password'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // OTP state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);

  // Password login
  const handlePasswordLogin = async () => {
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    if (!cleanedPhone || cleanedPhone.length !== 10) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Phone Number',
        text2: 'Please enter a valid 10-digit phone number',
      });
      return;
    }

    if (!password) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter your password',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login({
        login: cleanedPhone,
        passwd: password,
      });

      if (response.data.success) {
        const { token, user } = response.data;
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        
        setUser(user);
        setIsAuthenticated(true);
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Login successful!',
        });
        
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MemberTabs' }],
          });
        }, 500);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: response.data.message || 'Invalid credentials',
        });
      }
    } catch (error) {
      console.error('Password login error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Login failed';
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  // Send OTP for login
  const handleSendOTP = async (adminMode = false) => {
    setIsAdminLogin(adminMode);
    
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
      let response;
      
      if (adminMode) {
        response = await authAPI.sendAdminLoginOTP({ phone: cleanedPhone });
      } else {
        try {
          response = await authAPI.sendLoginOTP({ phone: cleanedPhone });
        } catch (memberError) {
          if (memberError.response?.status === 404) {
            response = await authAPI.sendAdminLoginOTP({ phone: cleanedPhone });
            setIsAdminLogin(true);
          } else {
            throw memberError;
          }
        }
      }
      
      if (response.data.success) {
        setShowOtpModal(true);
        setOtpVerified(false);
        if (response.data.otp) {
          Toast.show({
            type: 'info',
            text1: 'OTP Generated',
            text2: `Enter OTP: ${response.data.otp}`,
            visibilityTime: 10000,
          });
          console.log('🔑 OTP for login:', response.data.otp);
        }
        Toast.show({
          type: 'success',
          text1: 'OTP Generated',
          text2: 'Please enter the OTP',
        });
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to send OTP';
      const errorStatus = error.response?.status;
      
      if (errorStatus === 404 || errorMsg.includes('not found') || errorMsg.includes('not registered')) {
        Toast.show({
          type: 'error',
          text1: adminMode ? 'Admin Not Found' : 'Phone Not Registered',
          text2: adminMode 
            ? 'This phone number is not registered as an admin. Please contact support.'
            : 'This phone number is not registered. Please sign up first.',
          visibilityTime: 5000,
        });
        setShowOtpModal(false);
        setIsAdminLogin(false);
      } else {
        Toast.show({
          type: 'error',
          text1: adminMode ? 'Admin OTP Error' : 'Error',
          text2: errorMsg,
          visibilityTime: 5000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP for login
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
      const cleanedPhoneForVerify = phoneNumber.replace(/\D/g, '');
      let verifyResponse;
      
      if (isAdminLogin) {
        verifyResponse = await authAPI.verifyAdminLoginOTP({
          phone: cleanedPhoneForVerify,
          otp: otpCode.trim()
        });
      } else {
        try {
          verifyResponse = await authAPI.verifyLoginOTP({ 
            phone: cleanedPhoneForVerify,
            otp: otpCode.trim()
          });
        } catch (memberError) {
          const errorStatus = memberError.response?.status;
          const errorMsg = memberError.response?.data?.error || memberError.response?.data?.message || '';
          const isPurposeMismatch = errorMsg.includes('purpose mismatch') || errorMsg.includes('Invalid OTP');
          const isNotFound = errorStatus === 404 || errorMsg.includes('not found');
          
          if (errorStatus === 404 || isPurposeMismatch || isNotFound) {
            verifyResponse = await authAPI.verifyAdminLoginOTP({
              phone: cleanedPhoneForVerify,
              otp: otpCode.trim()
            });
            setIsAdminLogin(true);
          } else {
            throw memberError;
          }
        }
      }

      if (verifyResponse.data.success) {
        setOtpVerified(true);
        setShowOtpModal(false);
        
        const { token, user } = verifyResponse.data;
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        
        setUser(user);
        setIsAuthenticated(true);
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Login successful!',
        });
        
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MemberTabs' }],
          });
        }, 500);
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
      
      if (errorMsg.includes('not found') || errorMsg.includes('expired')) {
        Toast.show({
          type: 'error',
          text1: 'OTP Expired',
          text2: 'Please request a new OTP',
        });
        setTimeout(() => {
          handleSendOTP(isAdminLogin);
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
          <Text style={styles.headerIcon}>🏦</Text>
          <Text style={styles.headerTitle}>GoldElevate</Text>
          <Text style={styles.headerSubtitle}>Secure your financial future</Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Welcome Back</Text>
          <Text style={styles.formSubtitle}>Sign in to continue</Text>

          {/* Phone Number */}
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

          {/* Login Method Selection */}
          <View style={styles.methodSelector}>
            <TouchableOpacity
              style={[styles.methodButton, loginMethod === 'otp' && styles.methodButtonActive]}
              onPress={() => setLoginMethod('otp')}
            >
              <Icon name="sms" size={20} color={loginMethod === 'otp' ? '#fff' : '#666'} />
              <Text style={[styles.methodButtonText, loginMethod === 'otp' && styles.methodButtonTextActive]}>
                Login with OTP
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.methodButton, loginMethod === 'password' && styles.methodButtonActive]}
              onPress={() => setLoginMethod('password')}
            >
              <Icon name="lock" size={20} color={loginMethod === 'password' ? '#fff' : '#666'} />
              <Text style={[styles.methodButtonText, loginMethod === 'password' && styles.methodButtonTextActive]}>
                Login with Password
              </Text>
            </TouchableOpacity>
          </View>

          {/* Password Field (only for password method) */}
          {loginMethod === 'password' && (
            <View style={styles.inputGroup}>
              <Icon name="lock" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          )}

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.button, (loading || phoneNumber.length !== 10 || (loginMethod === 'password' && !password)) && styles.buttonDisabled]}
            onPress={loginMethod === 'otp' ? () => handleSendOTP(false) : handlePasswordLogin}
            disabled={loading || phoneNumber.length !== 10 || (loginMethod === 'password' && !password)}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {loginMethod === 'otp' ? 'Send OTP' : 'Login'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Admin Login Button */}
          {loginMethod === 'otp' && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>
              
              <TouchableOpacity
                style={[styles.adminButton, (loading || phoneNumber.length !== 10) && styles.buttonDisabled]}
                onPress={() => handleSendOTP(true)}
                disabled={loading || phoneNumber.length !== 10}
              >
                <Icon name="admin-panel-settings" size={22} color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.adminButtonText}>
                  {loading ? 'Sending Admin OTP...' : 'Login as Admin'}
                </Text>
              </TouchableOpacity>
              
              <Text style={styles.adminHint}>
                Use this button if you're an administrator
              </Text>
            </>
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('AgentSignup')}
          >
            <Text style={styles.linkText}>
              Want to become an agent? <Text style={styles.linkTextBold}>Agent Signup</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('AdminSignup')}
          >
            <Text style={styles.linkText}>
              Admin? <Text style={styles.linkTextBold}>Admin Signup</Text>
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
              Enter the OTP sent to {phoneNumber.replace(/\D/g, '')}
            </Text>

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
                  {loading ? 'Verifying...' : 'Verify OTP & Login'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={() => handleSendOTP(isAdminLogin)}
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
  methodSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#dee2e6',
    gap: 8,
  },
  methodButtonActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  methodButtonTextActive: {
    color: '#fff',
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
  adminButton: {
    backgroundColor: '#8B4513',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  adminButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  adminHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#dee2e6',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
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
