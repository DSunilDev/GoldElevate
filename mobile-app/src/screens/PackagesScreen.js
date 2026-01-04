import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { packagesAPI } from '../config/api';
import Toast from 'react-native-toast-message';
import { getCache, setCache, clearCache, CACHE_KEYS } from '../utils/cache';
import { showErrorToast, showInfoToast } from '../utils/errorHandler';

export default function PackagesScreen() {
  const navigation = useNavigation();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPackages();
  }, []);

  // Refresh packages when screen comes into focus - always clear cache and fetch fresh
  useFocusEffect(
    React.useCallback(() => {
      // Clear cache and fetch fresh data when screen is focused
      clearCache(CACHE_KEYS.PACKAGES).then(() => {
        loadPackages(false);
      });
    }, [])
  );

  const loadPackages = async (useCache = false) => {
    try {
      setLoading(true);
      setRefreshing(true);
      
      // Always fetch fresh data from server (no cache)
      console.log('Loading packages from server...');
      const response = await packagesAPI.getAll();
      console.log('Packages API response:', response);
      
      // Handle response format - data might be nested
      const data = response.data?.data || response.data || [];
      const packagesArray = Array.isArray(data) ? data : [];
      
      console.log('Parsed packages:', packagesArray);
      setPackages(packagesArray);
      
      // Cache the fresh data for offline use
      await setCache(CACHE_KEYS.PACKAGES, packagesArray);
    } catch (error) {
      // Try cache on error
      const cached = await getCache(CACHE_KEYS.PACKAGES);
      if (cached) {
        setPackages(cached);
        showInfoToast('Pull to refresh for latest', 'Using cached data');
      } else {
        console.error('Error loading packages:', error);
        showErrorToast(error, 'Failed to load packages');
        setPackages([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Clear cache on manual refresh to ensure fresh data
    await clearCache(CACHE_KEYS.PACKAGES);
    await loadPackages(false);
  };

  // Default packages if API fails
  const defaultPackages = [
    { id: 1, name: 'Starter', price: 5000, daily_return: 200, referral_bonus: 1000 },
    { id: 2, name: 'Intermediate', price: 10000, daily_return: 400, referral_bonus: 2000 },
    { id: 3, name: 'Expert', price: 20000, daily_return: 800, referral_bonus: 4000 },
    { id: 4, name: 'Master', price: 40000, daily_return: 1600, referral_bonus: 8000 },
    { id: 5, name: 'Brahmastra', price: 50000, daily_return: 2000, referral_bonus: 10000 },
    { id: 6, name: 'Premium', price: 80000, daily_return: 2600, referral_bonus: 16000 },
    { id: 7, name: 'Elite', price: 400000, daily_return: 12000, referral_bonus: 80000, premium: true },
    { id: 8, name: 'Ultimate', price: 800000, daily_return: 20000, referral_bonus: 160000, premium: true },
  ];

  const displayPackages = packages.length > 0 ? packages : defaultPackages;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient
        colors={['#D4AF37', '#B8941F']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Investment Packages</Text>
        <Text style={styles.headerSubtitle}>Choose your investment plan</Text>
      </LinearGradient>

      <View style={styles.content}>
        {displayPackages.map((pkg) => (
          <TouchableOpacity
            key={pkg.typeid || pkg.id}
            style={[
              styles.packageCard,
              pkg.premium && styles.premiumCard,
            ]}
            onPress={() => navigation.navigate('PackageDetail', { package: pkg })}
          >
            <View style={styles.packageHeader}>
              <View style={[
                styles.packageBadge,
                pkg.premium && styles.premiumBadge,
              ]}>
                <Text style={styles.packageBadgeText}>{pkg.name}</Text>
              </View>
              <Icon
                name="arrow-forward"
                size={24}
                color={pkg.premium ? '#ff6b6b' : '#D4AF37'}
              />
            </View>

            <View style={styles.packagePrice}>
              <Text style={styles.priceLabel}>Investment Amount</Text>
              <Text style={[
                styles.priceValue,
                pkg.premium && styles.premiumPriceValue,
              ]}>
                ₹{pkg.price?.toLocaleString() || pkg.price}
              </Text>
            </View>

            <View style={styles.packageDetails}>
              <Text style={styles.detailItem}>
                📈 Daily Return: ₹{pkg.daily_return?.toLocaleString() || pkg.daily_return}/day
              </Text>
              <Text style={styles.detailItem}>
                🎁 Referral Bonus: ₹{pkg.referral_bonus?.toLocaleString() || pkg.referral_bonus}
              </Text>
            </View>

            <View style={styles.actionButton}>
              <Text style={[
                styles.actionButtonText,
                pkg.premium && styles.premiumActionText,
              ]}>
                Get Started
              </Text>
            </View>
          </TouchableOpacity>
        ))}
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
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
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
    padding: 16,
  },
  packageCard: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#D4AF37',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  premiumCard: {
    borderColor: '#ff6b6b',
    backgroundColor: 'rgba(255,107,107,0.05)',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  packageBadge: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  premiumBadge: {
    backgroundColor: '#ff6b6b',
  },
  packageBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  packagePrice: {
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#D4AF37',
  },
  premiumPriceValue: {
    color: '#ff6b6b',
  },
  packageDetails: {
    marginBottom: 16,
  },
  detailItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#D4AF37',
    fontWeight: '700',
    fontSize: 16,
  },
  premiumActionText: {
    color: '#ff6b6b',
  },
});

