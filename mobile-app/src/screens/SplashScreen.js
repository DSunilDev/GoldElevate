import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function SplashScreen() {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const hasNavigated = useRef(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    console.log('🎬 SplashScreen mounting...');
    
    // Start animation after image is loaded
    if (imageLoaded) {
      try {
        // Animate splash screen
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(imageOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start(() => {
          console.log('✅ Splash animation completed');
        });
      } catch (error) {
        console.error('❌ Animation error:', error);
      }
    }
  }, [imageLoaded]);

  // Start navigation timer when animation completes
  useEffect(() => {
    if (imageLoaded) {
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
            navigation.replace('Home');
            console.log('✅ Navigation called');
          } else {
            console.error('❌ Navigation not available:', { navigation });
          }
        } catch (error) {
          console.error('❌ [SplashScreen] Navigation error:', error);
          console.error('Error stack:', error.stack);
          // Navigation error is non-critical - AuthNavigator will handle routing
        }
      }, 2500); // Wait 2.5 seconds total (800ms animation + buffer)

      return () => {
        clearTimeout(timer);
      };
    }
  }, [imageLoaded, navigation]);

  // Always render something - even if navigation fails
  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.Image 
          source={require('../../assets/goldpile.png')} 
          style={[
            styles.icon,
            {
              opacity: imageOpacity,
            }
          ]}
          resizeMode="contain"
          onLoad={() => {
            console.log('✅ Image loaded');
            setImageLoaded(true);
          }}
          onError={(error) => {
            console.error('❌ Image load error:', error);
            // Still proceed even if image fails to load
            setImageLoaded(true);
          }}
        />
        <Text style={styles.title}>
          GoldElevate
        </Text>
        <Text style={styles.subtitle}>
          Secure Your Financial Future
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  content: {
    alignItems: 'center',
  },
  icon: {
    width: 220,
    height: 220,
    marginBottom: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 8,
    letterSpacing: 1,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.85,
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
});

