import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, setAuthStateSetters } from '../config/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // Start as false for instant load

  useEffect(() => {
    console.log('🔐 AuthProvider initializing...');
    let isMounted = true;
    let loadingTimeout;
    
    try {
      // Immediately set loading to false for faster startup (check auth in background)
      setLoading(false);
      setAuthStateSetters({ setUser, setIsAuthenticated });
      console.log('✅ AuthProvider setters configured');
      
      const initializeAuth = async () => {
        try {
          console.log('🔍 Starting auth check...');
          // Quick check with very short timeout to prevent hanging
          const authPromise = checkAuth();
          const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => resolve(), 200); // Very short timeout - 200ms
          });
          
          await Promise.race([authPromise, timeoutPromise]);
          console.log('✅ Auth check completed');
        } catch (error) {
          console.error('❌ Auth initialization error:', error);
          // On error, just proceed without auth - user can login
        }
      };
      
      // Start initialization in background (don't block)
      initializeAuth().catch((err) => {
        console.error('❌ Auth initialization promise rejected:', err);
        // Ignore errors - already handled
      });
      
      // Safety timeout - ensure we never hang
      loadingTimeout = setTimeout(() => {
        if (isMounted) {
          console.log('⏱️ Auth timeout reached, setting loading to false');
          setLoading(false);
        }
      }, 500); // Max 500ms - very short
      
      return () => {
        isMounted = false;
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
        }
      };
    } catch (error) {
      console.error('❌ AuthProvider useEffect error:', error);
      setLoading(false);
    }
  }, []);

  const checkAuth = async () => {
    try {
      // Check both 'authToken'/'userData' (new format) and 'token'/'user' (legacy format)
      // Use Promise.race with very short timeout to prevent hanging
      const authCheckPromise = Promise.all([
        AsyncStorage.getItem('authToken').catch(() => null),
        AsyncStorage.getItem('userData').catch(() => null),
        AsyncStorage.getItem('token').catch(() => null),
        AsyncStorage.getItem('user').catch(() => null),
      ]);
      
      // Very quick timeout for web - AsyncStorage should be instant
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve([null, null, null, null]), 150); // Reduced to 150ms
      });
      
      const [authToken, userData, token, user] = await Promise.race([
        authCheckPromise,
        timeoutPromise,
      ]);
      
      // Use new format first, fallback to legacy
      const finalToken = authToken || token;
      const finalUserData = userData || user;
      
      if (finalToken && finalUserData) {
        try {
          const parsedUser = JSON.parse(finalUserData);
          setUser(parsedUser);
          setIsAuthenticated(true);
          // Sync to new format keys (async, don't wait)
          AsyncStorage.setItem('authToken', finalToken).catch(() => {});
          AsyncStorage.setItem('userData', finalUserData).catch(() => {});
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
          // Clear invalid data (async, don't wait)
          AsyncStorage.removeItem('authToken').catch(() => {});
          AsyncStorage.removeItem('userData').catch(() => {});
          AsyncStorage.removeItem('token').catch(() => {});
          AsyncStorage.removeItem('user').catch(() => {});
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // On error, just proceed without auth - user can login
      // Don't set loading here - it's already false
    }
  };

  const login = async (credentials) => {
    try {
      // For phone-based login, use login-verify-otp endpoint
      // This endpoint returns token and user directly after OTP verification
      if (credentials.phone && credentials.otp) {
        const response = await authAPI.verifyLoginOTP(credentials);
        const { token, user } = response.data;
        
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        
        setUser(user);
        setIsAuthenticated(true);
        
        return { success: true };
      }
      
      // Legacy username/password login (for admin/agent)
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;
      
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      setUser(user);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || 'Login failed',
      };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await authAPI.signup(userData);
      const { token, user } = response.data;
      
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      setUser(user);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Signup error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      // Better error handling - check for specific error messages
      let errorMessage = 'Signup failed';
      
      if (error.response?.data) {
        // Check for validation errors
        if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          errorMessage = error.response.data.errors.map(e => e.msg || e.message).join(', ');
        } else {
          errorMessage = error.response.data.message || error.response.data.error || errorMessage;
        }
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      // If phone already registered, provide clearer message
      if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
        return {
          success: false,
          error: 'This phone number is already registered. Please sign in instead.',
        };
      }
      
      // If OTP not verified
      if (errorMessage.includes('verify') || errorMessage.includes('OTP')) {
        return {
          success: false,
          error: 'Please verify your phone number first. Please request a new OTP.',
        };
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const adminSignup = async (adminData) => {
    try {
      const response = await authAPI.adminSignup(adminData);
      const { token, user } = response.data;
      
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      setUser(user);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Admin signup failed',
      };
    }
  };

  const logout = async () => {
    try {
      // Try to call logout endpoint (may not exist, that's okay)
      await authAPI.logout().catch(() => {
        // Ignore errors - logout endpoint may not exist
        console.log('Logout endpoint not available, clearing local state only');
      });
    } catch (error) {
      // Ignore errors - we'll clear local state anyway
      console.log('Logout API call failed, clearing local state');
    } finally {
      // Always clear local storage and state
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('token'); // Clear legacy token key
      await AsyncStorage.removeItem('user'); // Clear legacy user key
      setUser(null);
      setIsAuthenticated(false);
      
      // Note: Navigation will be handled by App.js AuthNavigator
      // which automatically switches to unauthenticated screens
      // when isAuthenticated becomes false
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        login,
        signup,
        adminSignup,
        logout,
        checkAuth,
        setUser,
        setIsAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

