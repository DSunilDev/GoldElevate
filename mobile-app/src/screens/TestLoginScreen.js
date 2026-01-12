import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'react-native-linear-gradient';
import { default as Icon } from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, setAuthStateSetters } from '../config/api';
import { useAuth } from '../context/AuthContext';

export default function TestLoginScreen() {
  const navigation = useNavigation();
  const { setUser, setIsAuthenticated } = useAuth();
  const [memberLoading, setMemberLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  // Register auth setters for API interceptor
  useEffect(() => {
    setAuthStateSetters({ setUser, setIsAuthenticated });
  }, [setUser, setIsAuthenticated]);

  const testMemberLogin = async () => {
    if (memberLoading || adminLoading) return; // Prevent clicks if any button is loading
    setMemberLoading(true);
    try {
      console.log('Attempting test member login...');
      const response = await authAPI.testLoginMember();
      console.log('Test member login response:', response);
      
      if (response?.data?.success) {
        const { token, user } = response.data;
        
        // Store token and user data
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        
        // Update auth context
        setUser(user);
        setIsAuthenticated(true);
        
        Toast.show({
          type: 'success',
          text1: 'Logged in as Test Member!',
          text2: `Welcome, ${user.firstname || user.login}`,
        });
        
        // Navigate to member dashboard
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
          text2: response?.data?.message || 'Failed to login as test member',
        });
        setMemberLoading(false);
      }
    } catch (error) {
      console.error('Test member login error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Network error. Please check backend is running.';
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: errorMsg,
      });
      setMemberLoading(false);
    }
  };

  const testAdminLogin = async () => {
    if (memberLoading || adminLoading) return; // Prevent clicks if any button is loading
    setAdminLoading(true);
    try {
      console.log('Attempting test admin login...');
      const response = await authAPI.testLoginAdmin();
      console.log('Test admin login response:', response);
      
      if (response?.data?.success) {
        const { token, user } = response.data;
        
        // Store token and user data
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        
        // Update auth context
        setUser(user);
        setIsAuthenticated(true);
        
        Toast.show({
          type: 'success',
          text1: 'Logged in as Test Admin!',
          text2: 'Welcome, Admin',
        });
        
        // Navigate to admin dashboard
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'AdminTabs' }],
          });
        }, 500);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: response?.data?.message || 'Failed to login as test admin',
        });
        setAdminLoading(false);
      }
    } catch (error) {
      console.error('Test admin login error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Network error. Please check backend is running.';
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: errorMsg,
      });
      setAdminLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#D4AF37', '#B8941F']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🧪 Quick Test Login</Text>
        <Text style={styles.headerSubtitle}>Bypass OTP for quick testing</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.iconContainer}>
            <Icon name="person" size={48} color="#D4AF37" />
          </View>
          <Text style={styles.sectionTitle}>Test Member Login</Text>
          <Text style={styles.sectionDesc}>
            Instantly login as test member to access all member screens
          </Text>

          <TouchableOpacity
            style={[styles.button, styles.memberButton, (memberLoading || adminLoading) && styles.buttonDisabled]}
            onPress={testMemberLogin}
            disabled={memberLoading || adminLoading}
            activeOpacity={0.7}
          >
            {memberLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="login" size={24} color="#fff" />
                <Text style={styles.buttonText}>Login as Test Member</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Icon name="info" size={16} color="#666" />
            <Text style={styles.infoText}>
              Test Member:{'\n'}
              Phone: 9876543210{'\n'}
              Login: testuser
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <View style={styles.iconContainer}>
            <Icon name="admin-panel-settings" size={48} color="#D4AF37" />
          </View>
          <Text style={styles.sectionTitle}>Test Admin Login</Text>
          <Text style={styles.sectionDesc}>
            Instantly login as test admin to access all admin screens
          </Text>

          <TouchableOpacity
            style={[styles.button, styles.adminButton, (memberLoading || adminLoading) && styles.buttonDisabled]}
            onPress={testAdminLogin}
            disabled={memberLoading || adminLoading}
            activeOpacity={0.7}
          >
            {adminLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="admin-panel-settings" size={24} color="#fff" />
                <Text style={styles.buttonText}>Login as Test Admin</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Icon name="info" size={16} color="#666" />
            <Text style={styles.infoText}>
              Test Admin:{'\n'}
              Login: 9999999999 or admin
            </Text>
          </View>
        </View>

        <View style={styles.noteBox}>
          <Icon name="warning" size={20} color="#ff9800" />
          <Text style={styles.noteText}>
            This is a testing feature. These buttons bypass OTP and directly log you in for quick testing of all screens.
          </Text>
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
    padding: 30,
    paddingTop: 50,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginBottom: 16,
    minWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  memberButton: {
    backgroundColor: '#D4AF37',
  },
  adminButton: {
    backgroundColor: '#8B4513',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#D4AF37',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    marginLeft: 12,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 30,
  },
  noteBox: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    marginTop: 20,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#856404',
    marginLeft: 12,
    lineHeight: 18,
  },
});
