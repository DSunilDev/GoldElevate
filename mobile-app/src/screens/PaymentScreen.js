import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
} from 'react-native';
// Clipboard import removed - using native web clipboard API
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { paymentAPI } from '../config/api';
import Toast from 'react-native-toast-message';
import { validateUPIReference, formatCurrency, copyToClipboard } from '../utils/helpers';

export default function PaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { package: pkg } = route.params || {};
  const [upiReference, setUpiReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Other'); // 'GPay', 'PhonePe', 'Other'
  const [gatewaySettings, setGatewaySettings] = useState(null);
  const [qrError, setQrError] = useState(false);

  const [transactionId, setTransactionId] = useState('');
  const [amount, setAmount] = useState(pkg?.price || 0);
  
  // Generate initial transaction ID immediately to prevent empty state
  React.useEffect(() => {
    if (!transactionId && pkg?.id) {
      const initialTxId = `UPI${Date.now()}${Math.floor(Math.random() * 10000)}`;
      setTransactionId(initialTxId);
      console.log('Initial transaction ID generated:', initialTxId);
    }
  }, [pkg?.id]);

  // Fetch payment gateway settings directly (always fresh from database)
  const fetchGatewaySettings = async () => {
    try {
      const response = await paymentAPI.getGatewaySettings();
      if (response?.data?.success && response?.data?.data) {
        const settings = response.data.data;
        setGatewaySettings({
          upi_id: settings.upi_id || 'yourbusiness@upi',
          qr_code_url: settings.qr_code_url || '/images/upi-qr.jpg',
          qr_code_base64: settings.qr_code_base64 || null,
          bank_account_number: settings.bank_account_number || '',
          bank_ifsc_code: settings.bank_ifsc_code || '',
          bank_name: settings.bank_name || '',
          account_holder_name: settings.account_holder_name || '',
          gpay_enabled: settings.gpay_enabled === 'Yes' || settings.gpay_enabled === true,
          phonepe_enabled: settings.phonepe_enabled === 'Yes' || settings.phonepe_enabled === true,
        });
        console.log('✅ Payment gateway settings loaded:', settings.upi_id);
      }
    } catch (error) {
      console.error('Error fetching gateway settings:', error);
      // Fallback to defaults
      setGatewaySettings({
        upi_id: 'yourbusiness@upi',
        qr_code_url: '/images/upi-qr.jpg',
        bank_account_number: '',
        bank_ifsc_code: '',
        bank_name: '',
        account_holder_name: '',
        gpay_enabled: true,
        phonepe_enabled: true,
      });
    }
  };

  // Initialize payment and load gateway settings
  const initPayment = async () => {
    try {
      // Always fetch fresh gateway settings first
      await fetchGatewaySettings();
      
      // Generate transaction ID upfront (fallback)
      const txId = `UPI${Date.now()}${Math.floor(Math.random() * 10000)}`;
      
      // Set transaction ID immediately (will be updated if API returns one)
      setTransactionId(txId);
      console.log('Initial transaction ID set:', txId);
      
      const response = await paymentAPI.initiate({
        packageid: pkg?.id,
        amount: pkg?.price,
      });
      
      // Parse nested response structure: response.data.data
      const paymentData = response?.data?.data || response?.data || {};
      
      // Always set transaction ID - use from response or keep the generated one
      const finalTransactionId = paymentData.transaction_id || txId;
      setTransactionId(finalTransactionId);
      console.log('Final transaction ID:', finalTransactionId, 'from API:', paymentData.transaction_id);
      
      if (paymentData.amount || pkg?.price) {
        setAmount(paymentData.amount || pkg?.price);
        
        // Update gateway settings from payment init response if available
        // (but we already fetched fresh settings above)
        if (paymentData.upi_id) {
          setGatewaySettings(prev => ({
            ...prev,
            upi_id: paymentData.upi_id,
            qr_code_url: paymentData.qr_code_url || prev?.qr_code_url,
            bank_account_number: paymentData.bank_account_number || prev?.bank_account_number,
            bank_ifsc_code: paymentData.bank_ifsc_code || prev?.bank_ifsc_code,
            bank_name: paymentData.bank_name || prev?.bank_name,
            account_holder_name: paymentData.account_holder_name || prev?.account_holder_name,
            gpay_enabled: paymentData.gpay_enabled !== false,
            phonepe_enabled: paymentData.phonepe_enabled !== false,
          }));
        }
      }
    } catch (error) {
      console.error('Payment init error:', error);
      // Generate fallback transaction ID even if API fails
      const fallbackTxId = `UPI${Date.now()}${Math.floor(Math.random() * 10000)}`;
      setTransactionId(fallbackTxId);
      console.log('Fallback transaction ID set:', fallbackTxId);
      // Still try to fetch gateway settings even if payment init fails
      await fetchGatewaySettings();
    }
  };

  useEffect(() => {
    if (pkg?.id) {
      initPayment();
    }
  }, [pkg]);

  // Reload gateway settings when screen comes into focus to get latest admin updates
  useFocusEffect(
    React.useCallback(() => {
      // Always fetch fresh gateway settings when screen comes into focus
      // This ensures admin updates are immediately reflected
      fetchGatewaySettings();
      
      if (pkg?.id) {
        // Also re-initiate payment to get fresh transaction ID
        initPayment();
      }
    }, [pkg])
  );

  const handleCopyUPI = async () => {
    const upiId = gatewaySettings?.upi_id || 'yourbusiness@upi';
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(upiId);
      } else if (typeof document !== 'undefined') {
        const textArea = document.createElement('textarea');
        textArea.value = upiId;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      Toast.show({
        type: 'success',
        text1: 'Copied!',
        text2: 'UPI ID copied to clipboard',
      });
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleGPayPayment = async () => {
    setPaymentMethod('GPay');
    const upiId = gatewaySettings?.upi_id || 'yourbusiness@upi';
    // Use universal UPI link that opens Google Pay (preferred app) or any UPI app
    // Format: upi://pay?pa=<UPI_ID>&am=<amount>&tn=<note>&cu=INR
    const encodedNote = encodeURIComponent('GoldElevate Payment');
    const gpayUrl = `upi://pay?pa=${upiId}&am=${amount}&tn=${encodedNote}&cu=INR`;
    // Fallback to Google Pay specific scheme
    const googlePayUrl = `googlepay://pay?pa=${upiId}&am=${amount}&tn=${encodedNote}&cu=INR`;
    
    try {
      // Try universal UPI link first (opens default UPI app, usually Google Pay)
      const canOpenUPI = await Linking.canOpenURL(gpayUrl);
      if (canOpenUPI) {
        await Linking.openURL(gpayUrl);
        Toast.show({
          type: 'success',
          text1: 'Opening Payment App',
          text2: 'Complete payment and return to submit reference',
        });
      } else {
        // Try Google Pay specific URL
        const canOpenGPay = await Linking.canOpenURL(googlePayUrl);
        if (canOpenGPay) {
          await Linking.openURL(googlePayUrl);
          Toast.show({
            type: 'success',
            text1: 'Opening Google Pay',
            text2: 'Complete payment and return to submit reference',
          });
        } else {
          // Fallback: Copy UPI ID
          if (Clipboard.setStringAsync) {
            await Clipboard.setStringAsync(upiId);
          } else if (Clipboard.setString) {
            await Clipboard.setString(upiId);
          }
          Toast.show({
            type: 'info',
            text1: 'UPI ID Copied',
            text2: `UPI ID: ${upiId}. Please pay manually and submit reference below.`,
            visibilityTime: 5000,
          });
        }
      }
    } catch (error) {
      console.error('Error opening GPay:', error);
      // Fallback: Copy UPI ID
      if (Clipboard.setStringAsync) {
        await Clipboard.setStringAsync(upiId);
      } else if (Clipboard.setString) {
        await Clipboard.setString(upiId);
      }
      Toast.show({
        type: 'info',
        text1: 'UPI ID Copied',
        text2: `UPI ID: ${upiId}. Please pay via Google Pay and submit below.`,
        visibilityTime: 5000,
      });
    }
  };

  const handlePhonePePayment = async () => {
    setPaymentMethod('PhonePe');
    const upiId = gatewaySettings?.upi_id || 'yourbusiness@upi';
    // Use PhonePe specific deep link
    const encodedNote = encodeURIComponent('GoldElevate Payment');
    const phonepeUrl = `phonepe://pay?pa=${upiId}&am=${amount}&tn=${encodedNote}&cu=INR`;
    // Fallback to universal UPI link
    const upiUrl = `upi://pay?pa=${upiId}&am=${amount}&tn=${encodedNote}&cu=INR`;
    
    try {
      // Try PhonePe specific URL first
      const canOpenPhonePe = await Linking.canOpenURL(phonepeUrl);
      if (canOpenPhonePe) {
        await Linking.openURL(phonepeUrl);
        Toast.show({
          type: 'success',
          text1: 'Opening PhonePe',
          text2: 'Complete payment and return to submit reference',
        });
      } else {
        // Try universal UPI link as fallback
        const canOpenUPI = await Linking.canOpenURL(upiUrl);
        if (canOpenUPI) {
          await Linking.openURL(upiUrl);
          Toast.show({
            type: 'success',
            text1: 'Opening Payment App',
            text2: 'Complete payment and return to submit reference',
          });
        } else {
          // Fallback: Copy UPI ID
          if (Clipboard.setStringAsync) {
            await Clipboard.setStringAsync(upiId);
          } else if (Clipboard.setString) {
            await Clipboard.setString(upiId);
          }
          Toast.show({
            type: 'info',
            text1: 'UPI ID Copied',
            text2: `UPI ID: ${upiId}. Please pay manually and submit reference below.`,
            visibilityTime: 5000,
          });
        }
      }
    } catch (error) {
      console.error('Error opening PhonePe:', error);
      // Fallback: Copy UPI ID
      if (Clipboard.setStringAsync) {
        await Clipboard.setStringAsync(upiId);
      } else if (Clipboard.setString) {
        await Clipboard.setString(upiId);
      }
      Toast.show({
        type: 'info',
        text1: 'UPI ID Copied',
        text2: `UPI ID: ${upiId}. Please pay via PhonePe and submit below.`,
        visibilityTime: 5000,
      });
    }
  };

  const handleCopyTransactionId = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(transactionId);
      } else if (typeof document !== 'undefined') {
        const textArea = document.createElement('textarea');
        textArea.value = transactionId;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      Toast.show({
        type: 'success',
        text1: 'Copied!',
        text2: 'Transaction ID copied to clipboard',
      });
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleSubmit = async () => {
    // Show immediate feedback
    console.log('Submit button clicked - handleSubmit called');
    
    // For GPay/PhonePe, UPI reference is optional
    if (paymentMethod === 'Other' && (!upiReference || !validateUPIReference(upiReference))) {
      console.log('Validation failed - invalid reference');
      Toast.show({
        type: 'error',
        text1: 'Invalid Reference',
        text2: 'Please enter a valid UPI reference number (8-20 alphanumeric characters)',
        visibilityTime: 3000,
      });
      return;
    }

    console.log('Validation passed, showing confirmation...');
    
    const confirmMessage = paymentMethod === 'GPay' || paymentMethod === 'PhonePe'
      ? `Confirm ${paymentMethod} Payment\n\nAmount: ${formatCurrency(amount)}\n\nYour account will be activated immediately after payment.`
      : `Are you sure you want to submit this payment?\n\nAmount: ${formatCurrency(amount)}\nReference: ${upiReference && upiReference.length > 0 ? upiReference.toUpperCase() : transactionId}`;

    // For web, use window.confirm directly (Alert.alert doesn't work well on web)
    const isWeb = typeof window !== 'undefined' && typeof window.confirm === 'function';
    
    if (isWeb) {
      console.log('Using window.confirm for web...');
      // Use window.confirm directly for web
      const confirmed = window.confirm(confirmMessage);
      if (confirmed) {
        console.log('User confirmed via window.confirm, proceeding...');
        submitPayment();
      } else {
        console.log('User cancelled via window.confirm');
        Toast.show({
          type: 'info',
          text1: 'Cancelled',
          text2: 'Payment submission cancelled',
          visibilityTime: 2000,
        });
      }
    } else {
      console.log('Using Alert.alert for native...');
      // Native - use Alert normally
      Alert.alert(
        'Confirm Payment',
        confirmMessage,
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => {
              console.log('User cancelled payment');
              Toast.show({
                type: 'info',
                text1: 'Cancelled',
                text2: 'Payment submission cancelled',
                visibilityTime: 2000,
              });
            }
          },
          {
            text: 'Submit',
            onPress: () => {
              console.log('User confirmed, proceeding with submission...');
              submitPayment();
            },
          },
        ]
      );
    }
  };

  const submitPayment = async () => {
    console.log('submitPayment called - starting payment submission...');
    setLoading(true);
    
    // Show loading toast
    Toast.show({
      type: 'info',
      text1: 'Submitting...',
      text2: 'Please wait while we process your payment',
      visibilityTime: 2000,
    });
    
    try {
      // Ensure amount is a number
      const paymentAmount = typeof amount === 'string' ? parseFloat(amount) : (typeof amount === 'number' ? amount : 0);
      
      // Ensure transactionId is not empty - generate one if missing
      let finalTransactionId = transactionId;
      if (!finalTransactionId || finalTransactionId.trim().length === 0) {
        console.warn('Transaction ID is missing, generating new one...', { transactionId, amount, pkg });
        finalTransactionId = `UPI${Date.now()}${Math.floor(Math.random() * 10000)}`;
        setTransactionId(finalTransactionId);
        console.log('Generated new transaction ID:', finalTransactionId);
      } else {
        finalTransactionId = finalTransactionId.trim();
      }
      
      // For GPay/PhonePe, upi_reference is optional (can be empty)
      // For Other, we need upi_reference or use transaction_id
      let upiRef = '';
      if (paymentMethod === 'Other') {
        upiRef = upiReference && upiReference.trim().length > 0 ? upiReference.trim() : transactionId.trim();
      } else {
        // GPay/PhonePe - upi_reference is optional, can be empty
        upiRef = upiReference && upiReference.trim().length > 0 ? upiReference.trim() : '';
      }
      
      const submitData = {
        packageid: pkg?.id,
        amount: paymentAmount,
        upi_reference: upiRef,
        transaction_id: finalTransactionId, // Use the validated transaction ID
        saleid: pkg?.saleid,
        payment_method: paymentMethod,
      };
      
      console.log('Submitting payment:', submitData);
      console.log('Transaction ID:', transactionId, 'trimmed:', transactionId.trim());
      console.log('Payment amount type:', typeof paymentAmount, 'value:', paymentAmount);
      
      const response = await paymentAPI.submit(submitData);
      
      console.log('Payment response:', response);
      
      // Check if payment was successful
      if (response?.data?.success !== false && response?.data) {
        const isAutoApproved = response.data?.autoApproved || response.data?.data?.autoApproved;
        
        console.log('Payment successful, isAutoApproved:', isAutoApproved);
        
        // Show success toast with longer visibility
        Toast.show({
          type: 'success',
          text1: isAutoApproved ? 'Payment Successful!' : 'Payment Submitted!',
          text2: isAutoApproved 
            ? 'Your account has been activated. Redirecting to dashboard...'
            : 'Payment reference submitted! Admin will verify within 24-48 hours.',
          visibilityTime: 5000,
          position: 'top',
          topOffset: 60,
        });
        
        // Stop loading and navigate to dashboard
        setLoading(false);
        
        // Navigate immediately after success
        setTimeout(() => {
          try {
            // Get root navigator - Payment is in Stack, need to reset to MemberTabs
            const rootNavigation = navigation.getParent() || navigation;
            
            // Reset navigation stack to MemberTabs with Dashboard
            rootNavigation.reset({
              index: 0,
              routes: [{ 
                name: 'MemberTabs',
                params: {
                  screen: 'Dashboard',
                  params: {
                    paymentSuccess: true,
                    isAutoApproved: isAutoApproved,
                    message: isAutoApproved 
                      ? 'Your account has been activated!'
                      : 'Payment submitted successfully! Admin will verify within 24-48 hours.'
                  }
                }
              }],
            });
          } catch (navError) {
            console.error('Navigation error:', navError);
            // Fallback: try navigate
            try {
              navigation.navigate('MemberTabs', {
                screen: 'Dashboard',
                params: {
                  paymentSuccess: true,
                  isAutoApproved: isAutoApproved
                }
              });
            } catch (fallbackError) {
              console.error('Fallback navigation failed:', fallbackError);
            }
          }
        }, 500);
      } else {
        throw new Error(response?.data?.message || 'Payment submission failed');
      }
            } catch (error) {
              console.error('Payment submit error:', error);
              const errorMsg = error.response?.data?.message || 
                             error.response?.data?.error || 
                             error.message || 
                             'Failed to submit payment';
              
              // Check if error message suggests data was saved despite error
              const errorString = JSON.stringify(error.response?.data || error.message || '');
              const mightBeSaved = errorString.includes('duplicate') || 
                                 errorString.includes('already exists') ||
                                 errorString.includes('constraint');
              
              if (mightBeSaved) {
                // Data might have been saved, show success message
                Toast.show({
                  type: 'success',
                  text1: 'Payment Submitted!',
                  text2: 'Your payment reference has been recorded. Admin will verify within 24-48 hours.',
                  visibilityTime: 5000,
                });
                
                // Navigate to dashboard
                setTimeout(() => {
                  try {
                    navigation.reset({
                      index: 0,
                      routes: [{ 
                        name: 'MemberTabs', 
                        params: { 
                          screen: 'Dashboard',
                          params: {
                            paymentSuccess: true,
                            isAutoApproved: false,
                            message: 'Payment submitted successfully!'
                          }
                        } 
                      }],
                    });
                  } catch (navError) {
                    navigation.navigate('MemberTabs');
                  }
                }, 2000);
              } else {
                // Real error, show error message
                Toast.show({
                  type: 'error',
                  text1: 'Payment Failed',
                  text2: errorMsg,
                  visibilityTime: 5000,
                });
              }
            } finally {
              setLoading(false);
            }
  };

  return (
    <ScrollView style={styles.container}>
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
        <Text style={styles.headerIcon}>💳</Text>
        <Text style={styles.headerTitle}>Complete Payment</Text>
        <Text style={styles.headerSubtitle}>Scan QR code to pay via UPI</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Payment Amount</Text>
          <Text style={styles.amountValue}>
            {formatCurrency(amount)}
          </Text>
          {transactionId && (
            <TouchableOpacity
              style={styles.transactionIdRow}
              onPress={handleCopyTransactionId}
            >
              <Text style={styles.transactionIdLabel}>Transaction ID:</Text>
              <Text style={styles.transactionIdValue}>{transactionId}</Text>
              <Icon name="content-copy" size={16} color="#D4AF37" />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Payment Options */}
        {(gatewaySettings?.gpay_enabled || gatewaySettings?.phonepe_enabled) && (
          <View style={styles.quickPayCard}>
            <Text style={styles.quickPayTitle}>Quick Pay (Instant Activation)</Text>
            <View style={styles.quickPayButtons}>
              {gatewaySettings?.gpay_enabled && (
                <TouchableOpacity
                  style={styles.quickPayButton}
                  onPress={handleGPayPayment}
                >
                  <Icon name="account-balance-wallet" size={24} color="#4285F4" />
                  <Text style={styles.quickPayButtonText}>GPay</Text>
                </TouchableOpacity>
              )}
              {gatewaySettings?.phonepe_enabled && (
                <TouchableOpacity
                  style={styles.quickPayButton}
                  onPress={handlePhonePePayment}
                >
                  <Icon name="account-balance-wallet" size={24} color="#5F259F" />
                  <Text style={styles.quickPayButtonText}>PhonePe</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.quickPayNote}>
              Payments via GPay/PhonePe are auto-approved and your account will be activated instantly!
            </Text>
          </View>
        )}

        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>Scan QR Code to Pay</Text>
          <View style={styles.qrImageContainer}>
            {qrError ? (
              <View style={[styles.qrImage, styles.qrPlaceholder]}>
                <Icon name="error-outline" size={64} color="#ff9800" />
                <Text style={styles.qrPlaceholderText}>Failed to load QR code</Text>
                <Text style={styles.qrPlaceholderSubtext}>Please use UPI ID or bank details</Text>
              </View>
            ) : gatewaySettings?.qr_code_url ? (
              <Image
                source={{ 
                  uri: gatewaySettings.qr_code_url.startsWith('http') 
                    ? gatewaySettings.qr_code_url 
                    : gatewaySettings.qr_code_url.startsWith('/')
                    ? `http://172.28.37.188:8081${gatewaySettings.qr_code_url}`
                    : `http://172.28.37.188:8081/images/${gatewaySettings.qr_code_url}`,
                  cache: 'force-cache'
                }}
                style={styles.qrImage}
                resizeMode="contain"
                onError={(error) => {
                  console.log('QR Image error:', error);
                  setQrError(true);
                }}
                onLoadStart={() => setQrError(false)}
                onLoad={() => {
                  console.log('QR Image loaded successfully');
                  setQrError(false);
                }}
              />
            ) : gatewaySettings?.qr_code_base64 ? (
              <Image
                source={{ uri: `data:image/png;base64,${gatewaySettings.qr_code_base64}` }}
                style={styles.qrImage}
                resizeMode="contain"
                onError={(error) => {
                  console.log('QR Image error:', error);
                  setQrError(true);
                }}
                onLoadStart={() => setQrError(false)}
              />
            ) : (
              <View style={[styles.qrImage, styles.qrPlaceholder]}>
                <Icon name="qr-code" size={64} color="#ccc" />
                <Text style={styles.qrPlaceholderText}>QR Code not available</Text>
                <Text style={styles.qrPlaceholderSubtext}>Contact admin to upload QR code</Text>
              </View>
            )}
          </View>
          <Text style={styles.qrNote}>UPI QR Code</Text>
          <Text style={styles.qrInstructions}>
            Scan this QR code with your UPI app{'\n'}
            (PhonePe, Google Pay, Paytm, etc.)
          </Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopyUPI}
          >
            <Icon name="content-copy" size={16} color="#D4AF37" />
            <Text style={styles.copyButtonText}>
              Copy UPI ID: {gatewaySettings?.upi_id || 'yourbusiness@upi'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bank Account Details */}
        {gatewaySettings?.bank_account_number && (
          <View style={styles.bankCard}>
            <Text style={styles.bankTitle}>Bank Transfer Details</Text>
            <View style={styles.bankDetails}>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Account Number:</Text>
                <Text style={styles.bankValue}>{gatewaySettings.bank_account_number}</Text>
              </View>
              {gatewaySettings.bank_ifsc_code && (
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>IFSC Code:</Text>
                  <Text style={styles.bankValue}>{gatewaySettings.bank_ifsc_code}</Text>
                </View>
              )}
              {gatewaySettings.bank_name && (
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Bank Name:</Text>
                  <Text style={styles.bankValue}>{gatewaySettings.bank_name}</Text>
                </View>
              )}
              {gatewaySettings.account_holder_name && (
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Account Holder:</Text>
                  <Text style={styles.bankValue}>{gatewaySettings.account_holder_name}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Enter Payment Reference</Text>
          <Text style={styles.formSubtitle}>
            {paymentMethod === 'GPay' || paymentMethod === 'PhonePe'
              ? `After completing the payment via ${paymentMethod}, tap submit below (reference optional)`
              : 'After completing the payment, enter your UPI transaction reference number below'}
          </Text>

          <View style={styles.inputGroup}>
            <Icon name="receipt" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={paymentMethod === 'GPay' || paymentMethod === 'PhonePe' 
                ? "Transaction Reference (Optional)" 
                : "Enter UPI Transaction Reference"}
              value={upiReference}
              onChangeText={(text) => {
                // Only allow alphanumeric, auto uppercase
                const cleaned = text.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                setUpiReference(cleaned);
              }}
              maxLength={20}
              autoCapitalize="characters"
              placeholderTextColor="#999"
            />
          </View>
          {upiReference && !validateUPIReference(upiReference) && paymentMethod === 'Other' && (
            <Text style={styles.errorText}>
              Reference must be 8-20 alphanumeric characters
            </Text>
          )}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={() => {
              console.log('Submit button pressed, loading:', loading);
              if (!loading) {
                handleSubmit();
              } else {
                Toast.show({
                  type: 'info',
                  text1: 'Please wait',
                  text2: 'Payment is being processed...',
                  visibilityTime: 2000,
                });
              }
            }}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <>
                <Icon name="hourglass-empty" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Submitting...</Text>
              </>
            ) : (
              <>
                <Icon name="check" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>
                  {paymentMethod === 'GPay' || paymentMethod === 'PhonePe'
                    ? `Submit ${paymentMethod} Payment`
                    : 'Submit Payment Reference'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Icon name="info" size={24} color="#D4AF37" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Important Notes:</Text>
            <Text style={styles.infoText}>
              {paymentMethod === 'GPay' || paymentMethod === 'PhonePe'
                ? '• Payments via GPay/PhonePe are auto-approved\n• Your account will be activated immediately\n• Keep your transaction reference safe'
                : '• Your account will be activated after admin verifies the payment\n• Keep your transaction reference number safe\n• Payment verification usually takes 24-48 hours'}
            </Text>
          </View>
        </View>
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
  content: {
    padding: 16,
  },
  amountCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#D4AF37',
  },
  transactionIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  transactionIdLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  transactionIdValue: {
    flex: 1,
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
  qrCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  qrImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  qrImage: {
    width: 280,
    height: 280,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  qrPlaceholder: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholderText: {
    marginTop: 8,
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
  },
  qrPlaceholderSubtext: {
    marginTop: 4,
    color: '#999',
    fontSize: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  qrNote: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  qrInstructions: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
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
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
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
    color: '#333',
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 16,
  },
  submitButton: {
    backgroundColor: '#D4AF37',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    fontSize: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  quickPayCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#28a745',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickPayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  quickPayButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  quickPayButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  quickPayButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  quickPayNote: {
    fontSize: 12,
    color: '#28a745',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bankCard: {
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
  bankTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  bankDetails: {
    gap: 12,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  bankLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  bankValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '700',
  },
});

