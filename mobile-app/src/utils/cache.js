import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'cache_';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Cache data with expiry
export const setCache = async (key, data, expiry = CACHE_EXPIRY) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + expiry
    };
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Cache set error:', error);
  }
};

// Get cached data if not expired
export const getCache = async (key) => {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;

    const cacheData = JSON.parse(cached);
    
    if (Date.now() > cacheData.expiry) {
      // Cache expired
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return cacheData.data;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

// Clear specific cache
export const clearCache = async (key) => {
  try {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (error) {
    console.error('Cache clear error:', error);
  }
};

// Clear all cache
export const clearAllCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error('Clear all cache error:', error);
  }
};

// Cache keys
export const CACHE_KEYS = {
  PACKAGES: 'packages',
  DASHBOARD: 'dashboard',
  REFERRALS: 'referrals',
  INCOME: 'income',
  PROFILE: 'profile'
};

