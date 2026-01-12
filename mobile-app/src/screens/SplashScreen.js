import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'react-native-linear-gradient';

export default function SplashScreen() {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const hasNavigated = useRef(false);

  useEffect(() => {
    console.log('🎬 SplashScreen mounting...');
    
    try {
      // Animate splash screen
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: false,
        }),
      ]).start(() => {
        console.log('✅ Splash animation completed');
      });

      // Navigate to Home after animation completes
      // Home screen exists in the navigation stack for unauthenticated users
      const timer = setTimeout(() => {
        if (hasNavigated.current) {
          console.log('⚠️ Already navigated, skipping');
          return;
        }
        hasNavigated.current = true;
        
        try {
          // Check if navigation is ready and Home screen exists
          if (navigation && navigation.navigate) {
            console.log('🏠 [SplashScreen] Navigating to Home screen...');
            navigation.navigate('Home');
            console.log('✅ Navigation called');
          } else {
            console.error('❌ Navigation not available:', { navigation });
          }
        } catch (error) {
          console.error('❌ [SplashScreen] Navigation error:', error);
          console.error('Error stack:', error.stack);
          // Navigation error is non-critical - AuthNavigator will handle routing
        }
      }, 1000); // Increased to 1000ms to ensure navigation is ready

      return () => {
        clearTimeout(timer);
      };
    } catch (error) {
      console.error('❌ SplashScreen useEffect error:', error);
    }
  }, [navigation]);

  // Always render something - even if navigation fails
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#D4AF37', '#B8941F']}
        style={StyleSheet.absoluteFill}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.icon}>🏦</Text>
          <Text style={styles.title}>GoldElevate</Text>
          <Text style={styles.subtitle}>Secure Your Financial Future</Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D4AF37', // Fallback color if LinearGradient fails
  },
  content: {
    alignItems: 'center',
  },
  icon: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    letterSpacing: 0.5,
  },
});

