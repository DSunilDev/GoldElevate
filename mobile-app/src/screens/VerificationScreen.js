import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function VerificationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { isAuthenticated, user } = useAuth();
  const isError = route.params?.error === true || route.params?.error === 'true';
  const [stage, setStage] = useState('loading'); // 'loading', 'success', or 'error'
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0));
  const hasNavigated = useRef(false);

  useEffect(() => {
    // Show loading stage first (2.5 seconds)
    const loadingTimer = setTimeout(() => {
      // Determine final stage based on error state
      const finalStage = isError ? 'error' : 'success';
      setStage(finalStage);
      // Animate final screen
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }, 2500);

    // Navigate after total 5 seconds
    const navigateTimer = setTimeout(() => {
      if (hasNavigated.current) return;
      hasNavigated.current = true;

      // Wait a bit for auth state to be fully updated, then navigate
      setTimeout(() => {
        try {
          // If error state, always navigate to Login
          if (isError) {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              })
            );
            return;
          }

          // After successful signup, user should be authenticated
          // Determine target route based on auth state and user role
          const targetRoute = isAuthenticated && user?.role === 'admin' 
            ? 'AdminTabs' 
            : isAuthenticated 
            ? 'MemberTabs' 
            : 'Login';
          
          // Use CommonActions.reset to reset the entire navigation state
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: targetRoute }],
            })
          );
        } catch (error) {
          console.error('Navigation error in VerificationScreen:', error);
          // Fallback: try simple navigation
          try {
            const targetRoute = isError 
              ? 'Login' 
              : isAuthenticated && user?.role === 'admin' 
              ? 'AdminTabs' 
              : isAuthenticated 
              ? 'MemberTabs' 
              : 'Login';
            navigation.navigate(targetRoute);
          } catch (navError) {
            console.error('Fallback navigation also failed:', navError);
          }
        }
      }, 100); // Small delay to ensure auth state is updated
    }, 5000);

    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(navigateTimer);
    };
  }, [navigation, isAuthenticated, user, fadeAnim, scaleAnim, isError]);

  if (stage === 'loading') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>Verifying user</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (stage === 'error') {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.crossContainer}>
            <Icon name="cancel" size={100} color="#fff" />
          </View>
          <Text style={styles.errorText}>Could not verify user</Text>
        </Animated.View>
      </View>
    );
  }

  // Success state
  return (
    <View style={[styles.container, styles.successContainer]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.checkmarkContainer}>
          <Icon name="check-circle" size={100} color="#fff" />
        </View>
        <Text style={styles.successText}>User verified</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContainer: {
    backgroundColor: '#4CAF50',
  },
  errorContainer: {
    backgroundColor: '#F44336',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkContainer: {
    marginBottom: 24,
  },
  crossContainer: {
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 24,
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  successText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  errorText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
});
