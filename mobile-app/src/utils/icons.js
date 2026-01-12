// Safe icon wrapper that works with or without Expo
import React from 'react';
import { View, Text } from 'react-native';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

let IconComponent = null;

try {
  // Use react-native-vector-icons
  IconComponent = MaterialIcons;
  console.log('✅ Using react-native-vector-icons');
} catch (e) {
  // Fallback: Create a simple placeholder component
  console.warn('⚠️ @expo/vector-icons not available, using placeholder');
  IconComponent = ({ name, size = 24, color = '#000', style, ...props }) => {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            backgroundColor: color,
            borderRadius: 2,
            justifyContent: 'center',
            alignItems: 'center',
          },
          style,
        ]}
        {...props}
      >
        <Text style={{ color: '#fff', fontSize: size * 0.6 }}>?</Text>
      </View>
    );
  };
}

export default IconComponent;

