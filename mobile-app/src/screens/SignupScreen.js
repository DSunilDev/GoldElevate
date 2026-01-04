import React, { useState, useRef } from 'react';
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
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';
import { authAPI } from '../config/api';
import * as ImagePicker from 'expo-image-picker';

export default function SignupScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { signup } = useAuth();
  
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [idProof, setIdProof] = useState(null);
  const [userPhoto, setUserPhoto] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // UI state
  const [signupMethod, setSignupMethod] = useState('otp'); // 'otp' or 'password'
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  // Request permissions for image picker
  const requestImagePermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Permission Required',
        text2: 'Please grant camera roll permissions to upload images',
      });
      return false;
    }
    return true;
  };

  // Pick ID proof image
  const handlePickIdProof = async () => {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setIdProof({
          uri: result.assets[0].uri,
          base64: base64,
          type: 'id_proof',
        });
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'ID proof image selected',
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

  // Pick user photo
  const handlePickPhoto = async () => {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setUserPhoto({
          uri: result.assets[0].uri,
          base64: base64,
          type: 'user_photo',
        });
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Photo selected',
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

  // Validate form
  const validateForm = () => {
    if (!firstName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'First name is required',
      });
      return false;
    }

    if (!lastName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Last name is required',
      });
      return false;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Phone Number',
        text2: 'Please enter a valid 10-digit phone number',
      });
      return false;
    }

    if (signupMethod === 'password') {
      if (!password || password.length < 6) {
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: 'Password must be at least 6 characters',
        });
        return false;
      }

      if (password !== confirmPassword) {
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: 'Passwords do not match',
        });
        return false;
      }
    }

    if (!idProof) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please upload your ID proof',
      });
      return false;
    }

    if (!userPhoto) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please upload your photo',
      });
      return false;
    }

    if (!termsAccepted) {
      Toast.show({
        type: 'error',
        text1: 'Terms Required',
        text2: 'Please accept Terms & Conditions to continue',
      });
      return false;
    }

    return true;
  };

  // Send OTP for signup
  const handleSendOTP = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setOtpCode('');
    try {
      const response = await authAPI.sendOTP({ phone: phoneNumber });
      if (response.data.success) {
        setShowOtpModal(true);
        if (response.data.otp) {
          Toast.show({
            type: 'info',
            text1: 'OTP Generated',
            text2: `Enter OTP: ${response.data.otp}`,
            visibilityTime: 10000,
          });
          console.log('🔑 OTP for signup:', response.data.otp);
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
      
      if (errorMsg.includes('already registered') || errorMsg.includes('already exists')) {
        Toast.show({
          type: 'error',
          text1: 'Phone Already Registered',
          text2: 'This phone number is already registered. Please sign in instead.',
          visibilityTime: 5000,
        });
        setShowOtpModal(false);
      } else {
        setShowOtpModal(true);
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

  // Verify OTP and create account
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
      const verifyResponse = await authAPI.verifyOTP({ 
        phone: phoneNumber,
        otp: otpCode.trim()
      });

      if (verifyResponse.data.success) {
        setOtpVerified(true);
        setShowOtpModal(false);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Create account with all data
        await createAccount();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Invalid OTP',
          text2: verifyResponse.data.message || 'Please enter the correct OTP',
        });
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Please try again';
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  // Create account (for both OTP and password methods)
  const createAccount = async () => {
    setLoading(true);
    try {
      const signupData = {
        phone: phoneNumber,
        firstname: firstName.trim(),
        lastname: lastName.trim(),
        id_proof: idProof?.base64 || null,
        photo: userPhoto?.base64 || null,
      };

      if (signupMethod === 'password') {
        signupData.password = password;
      }

      if (route.params?.packageId) {
        signupData.packageid = route.params.packageId;
      }

      if (route.params?.sponsorid || route.params?.ref) {
        signupData.sponsorid = route.params.sponsorid || route.params.ref;
      }

      console.log('Calling signup with:', { ...signupData, id_proof: idProof ? 'present' : 'missing', photo: userPhoto ? 'present' : 'missing' });
      const result = await signup(signupData);

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Account created successfully!',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Signup Failed',
          text2: result.error || 'Please try again',
        });
        setOtpVerified(false);
      }
    } catch (error) {
      console.error('Signup error:', error);
      Toast.show({
        type: 'error',
        text1: 'Signup Failed',
        text2: error.message || 'Please try again',
      });
      setOtpVerified(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle password signup
  const handlePasswordSignup = async () => {
    if (!validateForm()) return;
    await createAccount();
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
          <Text style={styles.headerIcon}>👤</Text>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSubtitle}>Start your investment journey</Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Personal Information</Text>

          {/* First Name */}
          <View style={styles.inputGroup}>
            <Icon name="person" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Icon name="person" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>

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
            />
          </View>

          {/* Signup Method Selection */}
          <View style={styles.methodSelector}>
            <TouchableOpacity
              style={[styles.methodButton, signupMethod === 'otp' && styles.methodButtonActive]}
              onPress={() => setSignupMethod('otp')}
            >
              <Icon name="sms" size={20} color={signupMethod === 'otp' ? '#fff' : '#666'} />
              <Text style={[styles.methodButtonText, signupMethod === 'otp' && styles.methodButtonTextActive]}>
                Signup with OTP
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.methodButton, signupMethod === 'password' && styles.methodButtonActive]}
              onPress={() => setSignupMethod('password')}
            >
              <Icon name="lock" size={20} color={signupMethod === 'password' ? '#fff' : '#666'} />
              <Text style={[styles.methodButtonText, signupMethod === 'password' && styles.methodButtonTextActive]}>
                Signup with Password
              </Text>
            </TouchableOpacity>
          </View>

          {/* Password Fields (only for password method) */}
          {signupMethod === 'password' && (
            <>
              <View style={styles.inputGroup}>
                <Icon name="lock" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
              <View style={styles.inputGroup}>
                <Icon name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            </>
          )}

          {/* ID Proof Upload */}
          <View style={styles.uploadSection}>
            <Text style={styles.uploadLabel}>ID Proof *</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={handlePickIdProof}>
              {idProof ? (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: idProof.uri }} style={styles.previewImage} />
                  <View style={styles.imageOverlay}>
                    <Icon name="check-circle" size={24} color="#4CAF50" />
                    <Text style={styles.imageOverlayText}>ID Proof Selected</Text>
                  </View>
                </View>
              ) : (
                <>
                  <Icon name="upload-file" size={32} color="#D4AF37" />
                  <Text style={styles.uploadButtonText}>Upload ID Proof</Text>
                  <Text style={styles.uploadHint}>Aadhar, PAN, or Driving License</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* User Photo Upload */}
          <View style={styles.uploadSection}>
            <Text style={styles.uploadLabel}>Your Photo *</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={handlePickPhoto}>
              {userPhoto ? (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: userPhoto.uri }} style={styles.previewImage} />
                  <View style={styles.imageOverlay}>
                    <Icon name="check-circle" size={24} color="#4CAF50" />
                    <Text style={styles.imageOverlayText}>Photo Selected</Text>
                  </View>
                </View>
              ) : (
                <>
                  <Icon name="camera-alt" size={32} color="#D4AF37" />
                  <Text style={styles.uploadButtonText}>Upload Your Photo</Text>
                  <Text style={styles.uploadHint}>Clear face photo</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Terms & Conditions */}
          <View style={styles.termsSection}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setTermsAccepted(!termsAccepted)}
            >
              <View style={[styles.checkboxBox, termsAccepted && styles.checkboxBoxChecked]}>
                {termsAccepted && <Icon name="check" size={16} color="#fff" />}
              </View>
            </TouchableOpacity>
            <View style={styles.termsTextContainer}>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => navigation.navigate('TermsAndConditions')}
                >
                  Terms & Conditions
                </Text>
              </Text>
            </View>
          </View>

          {/* Signup Button */}
          <TouchableOpacity
            style={[styles.button, (loading || !termsAccepted) && styles.buttonDisabled]}
            onPress={signupMethod === 'otp' ? handleSendOTP : handlePasswordSignup}
            disabled={loading || !termsAccepted}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {signupMethod === 'otp' ? 'Send OTP & Continue' : 'Create Account'}
              </Text>
            )}
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
                  {loading ? 'Verifying...' : 'Verify OTP'}
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
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
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
  uploadSection: {
    marginBottom: 20,
  },
  uploadLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  uploadButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37',
    marginTop: 8,
  },
  uploadHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  imagePreview: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imageOverlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  termsSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  checkbox: {
    marginRight: 8,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#dee2e6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxBoxChecked: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  termsLink: {
    color: '#D4AF37',
    fontWeight: '700',
    textDecorationLine: 'underline',
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  modalTitle: {
    fontSize: 20,
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
