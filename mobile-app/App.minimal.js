// MINIMAL TEST APP - Just to verify JavaScript execution
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

console.log('✅ App.minimal.js: Component loaded');

export default function MinimalApp() {
  console.log('✅ MinimalApp: Component rendering');
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Minimal Test App</Text>
      <Text style={styles.subtext}>If you see this, JavaScript is working!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
});

