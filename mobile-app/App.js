import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import Icon from './src/utils/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ErrorBoundary from './src/components/ErrorBoundary';
import Toast from 'react-native-toast-message';
import { initializeMsg91Widget } from './src/utils/msg91SDK';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import AdminLoginScreen from './src/screens/AdminLoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import AgentSignupScreen from './src/screens/AgentSignupScreen';
import AdminSignupScreen from './src/screens/AdminSignupScreen';
import TermsAndConditionsScreen from './src/screens/TermsAndConditionsScreen';
import HomeScreen from './src/screens/HomeScreen';
import TestLoginScreen from './src/screens/TestLoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import PackagesScreen from './src/screens/PackagesScreen';
import PackageDetailScreen from './src/screens/PackageDetailScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import ReferralsScreen from './src/screens/ReferralsScreen';
import IncomeScreen from './src/screens/IncomeScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import WithdrawScreen from './src/screens/WithdrawScreen';
import VerificationScreen from './src/screens/VerificationScreen';

// Admin Screens
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';
import AdminMembersScreen from './src/screens/admin/AdminMembersScreen';
import AdminMemberDetailScreen from './src/screens/admin/AdminMemberDetailScreen';
import AdminApplicationsScreen from './src/screens/admin/AdminApplicationsScreen';
import AdminPaymentsScreen from './src/screens/admin/AdminPaymentsScreen';
import AdminWithdrawsScreen from './src/screens/admin/AdminWithdrawsScreen';
import AdminPackagesScreen from './src/screens/admin/AdminPackagesScreen';
import AdminPaymentGatewayScreen from './src/screens/admin/AdminPaymentGatewayScreen';

// Context
import { AuthProvider, useAuth } from './src/context/AuthContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator (for authenticated members)
function MemberTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Packages') {
            iconName = 'card-giftcard';
          } else if (route.name === 'Referrals') {
            iconName = 'people';
          } else if (route.name === 'Income') {
            iconName = 'account-balance-wallet';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#D4AF37',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Packages" component={PackagesScreen} />
      <Tab.Screen name="Referrals" component={ReferralsScreen} />
      <Tab.Screen name="Income" component={IncomeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Admin Stack Navigator (for screens that need navigation)
function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen name="AdminPackages" component={AdminPackagesScreen} />
      <Stack.Screen name="AdminWithdraws" component={AdminWithdrawsScreen} />
      <Stack.Screen name="AdminPaymentGateway" component={AdminPaymentGatewayScreen} />
    </Stack.Navigator>
  );
}

// Admin Tab Navigator
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'AdminDashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'AdminMembers') {
            iconName = 'people';
          } else if (route.name === 'AdminApplications') {
            iconName = 'assignment';
          } else if (route.name === 'AdminPayments') {
            iconName = 'account-balance-wallet';
          } else if (route.name === 'AdminProfile') {
            iconName = 'person';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#D4AF37',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      })}
    >
      <Tab.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="AdminMembers" component={AdminMembersScreen} />
      <Tab.Screen name="AdminApplications" component={AdminApplicationsScreen} />
      <Tab.Screen name="AdminPayments" component={AdminPaymentsScreen} />
      <Tab.Screen name="AdminProfile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Auth Navigator
function AuthNavigator() {
  console.log('🧭 AuthNavigator rendering...');
  
  let isAuthenticated = false;
  let user = null;
  let isAdmin = false;
  
  try {
    const auth = useAuth();
    isAuthenticated = auth?.isAuthenticated || false;
    user = auth?.user || null;
    isAdmin = user?.role === 'admin';
    console.log('✅ AuthNavigator - Auth state:', { isAuthenticated, isAdmin, userId: user?.id });
  } catch (error) {
    console.error('❌ AuthNavigator - Error getting auth state:', error);
    // Fallback to unauthenticated state on error
    isAuthenticated = false;
    user = null;
    isAdmin = false;
  }

  // Always show Splash first, then navigate based on auth state
  // This prevents grey screen by ensuring something always renders
  console.log('🧭 AuthNavigator - Rendering navigator with isAuthenticated:', isAuthenticated);
  
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: '#1a1a1a' },
        animationEnabled: true,
        cardStyle: { backgroundColor: '#1a1a1a' },
      }}
      initialRouteName="Splash"
    >
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="TestLogin" component={TestLoginScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="AgentSignup" component={AgentSignupScreen} />
          <Stack.Screen name="AdminSignup" component={AdminSignupScreen} />
          <Stack.Screen name="Verification" component={VerificationScreen} />
          <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
        </>
      ) : isAdmin ? (
        <>
          <Stack.Screen name="AdminTabs" component={AdminTabs} />
          <Stack.Screen name="AdminMemberDetail" component={AdminMemberDetailScreen} />
          <Stack.Screen name="AdminWithdraws" component={AdminWithdrawsScreen} />
          <Stack.Screen name="AdminPackages" component={AdminPackagesScreen} />
          <Stack.Screen name="AdminPaymentGateway" component={AdminPaymentGatewayScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Verification" component={VerificationScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="MemberTabs" component={MemberTabs} />
          <Stack.Screen name="PackageDetail" component={PackageDetailScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="Transactions" component={TransactionsScreen} />
          <Stack.Screen name="Withdraw" component={WithdrawScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Verification" component={VerificationScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

// Main App Component
export default function App() {
  // Initialize MSG91 Widget on app start
  useEffect(() => {
    try {
      initializeMsg91Widget();
    } catch (error) {
      console.error('Failed to initialize MSG91 Widget:', error);
    }
  }, []);

  // Log app initialization
  console.log('🚀 App component rendering...');
  console.log('📱 API Base URL:', process.env.EXPO_PUBLIC_API_URL || 'Using config');
  
  try {
    return (
      <ErrorBoundary>
        <AuthProvider>
          <NavigationContainer
            theme={{
              dark: true,
              colors: {
                primary: '#FFD700',
                background: '#1a1a1a',
                card: '#1a1a1a',
                text: '#ffffff',
                border: '#2a2a2a',
                notification: '#FFD700',
              },
            }}
            onReady={() => {
              console.log('✅ NavigationContainer ready');
            }}
            onStateChange={(state) => {
              console.log('🔄 Navigation state changed:', state?.routes?.[state?.index]?.name);
            }}
            onError={(error) => {
              console.error('❌ Navigation error:', error);
            }}
          >
            <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
            <AuthNavigator />
            <Toast />
          </NavigationContainer>
        </AuthProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('❌ App render error:', error);
    throw error;
  }
}

