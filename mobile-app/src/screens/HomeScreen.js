import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'react-native-linear-gradient';
import { default as Icon } from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();

  const packages = [
    { id: 1, name: 'Starter', price: '₹5,000', daily: '₹200/day', bonus: '₹1,000' },
    { id: 2, name: 'Intermediate', price: '₹10,000', daily: '₹400/day', bonus: '₹2,000' },
    { id: 3, name: 'Expert', price: '₹20,000', daily: '₹800/day', bonus: '₹4,000' },
    { id: 4, name: 'Master', price: '₹40,000', daily: '₹1,600/day', bonus: '₹8,000' },
    { id: 5, name: 'Brahmastra', price: '₹50,000', daily: '₹2,000/day', bonus: '₹10,000' },
    { id: 6, name: 'Premium', price: '₹80,000', daily: '₹2,600/day', bonus: '₹16,000' },
    { id: 7, name: 'Elite', price: '₹4,00,000', daily: '₹12,000/day', bonus: '₹80,000', premium: true },
    { id: 8, name: 'Ultimate', price: '₹8,00,000', daily: '₹20,000/day', bonus: '₹1,60,000', premium: true },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <LinearGradient
        colors={['#D4AF37', '#B8941F']}
        style={styles.hero}
      >
        <Animatable.View animation="fadeInDown" duration={1000}>
          <Text style={styles.heroIcon}>🏦</Text>
          <Text style={styles.heroTitle}>GoldElevate</Text>
          <Text style={styles.heroSubtitle}>
            Secure your financial future with trusted gold-backed investments
          </Text>
        </Animatable.View>

        {/* Trust Badges */}
        <View style={styles.trustBadges}>
          <View style={styles.badge}>
            <Text style={styles.badgeNumber}>10,000+</Text>
            <Text style={styles.badgeLabel}>Investors</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeNumber}>₹50Cr+</Text>
            <Text style={styles.badgeLabel}>Invested</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeNumber}>100%</Text>
            <Text style={styles.badgeLabel}>Secure</Text>
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaButtons}>
          <TouchableOpacity
            style={styles.ctaPrimary}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.ctaPrimaryText}>Start Investing</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ctaSecondary}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.ctaSecondaryText}>User Login</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.adminLoginButton}
          onPress={() => navigation.navigate('AdminLogin')}
        >
          <Icon name="admin-panel-settings" size={20} color="#fff" />
          <Text style={styles.adminLoginText}>Admin Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.adminLoginButton, { backgroundColor: 'rgba(102, 102, 102, 0.8)', marginTop: 8 }]}
          onPress={() => navigation.navigate('TestLogin')}
        >
          <Text style={styles.adminLoginText}>🧪 Test Login Helper</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Why Invest Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Invest Now?</Text>
        <Text style={styles.sectionSubtitle}>Discover the benefits of investing with us</Text>
        
        <View style={styles.reasonsGrid}>
          {[
            { icon: '📈', title: 'Guaranteed Daily Returns', desc: 'Earn consistent daily returns' },
            { icon: '🔒', title: '100% Secure', desc: 'Your investment is safe' },
            { icon: '👥', title: 'Earn Through Referrals', desc: 'Get referral bonuses' },
            { icon: '⏰', title: 'Time is Money', desc: 'Start earning from day one' },
            { icon: '⭐', title: 'Reward Points', desc: 'Earn exclusive benefits' },
            { icon: '📊', title: 'Easy Management', desc: 'Manage investments easily' },
          ].map((reason, index) => (
            <Animatable.View
              key={index}
              animation="fadeInUp"
              delay={index * 100}
              style={styles.reasonCard}
            >
              <Text style={styles.reasonIcon}>{reason.icon}</Text>
              <Text style={styles.reasonTitle}>{reason.title}</Text>
              <Text style={styles.reasonDesc}>{reason.desc}</Text>
            </Animatable.View>
          ))}
        </View>
      </View>

      {/* Packages Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Investment Packages</Text>
        <Text style={styles.sectionSubtitle}>Choose the package that suits your goals</Text>
        
        {packages.map((pkg, index) => (
          <Animatable.View
            key={pkg.id}
            animation="fadeInUp"
            delay={index * 50}
          >
            <TouchableOpacity
              style={[
                styles.packageCard,
                pkg.premium && styles.premiumPackageCard,
              ]}
              onPress={() => navigation.navigate('Signup', { packageId: pkg.id })}
            >
              <View style={styles.packageHeader}>
                <View style={[
                  styles.packageBadge,
                  pkg.premium && styles.premiumBadge,
                ]}>
                  <Text style={styles.packageBadgeText}>{pkg.name}</Text>
                </View>
                <Icon name="arrow-forward" size={24} color={pkg.premium ? '#ff6b6b' : '#D4AF37'} />
              </View>
              <View style={styles.packagePrice}>
                <Text style={styles.priceLabel}>Investment Amount</Text>
                <Text style={[
                  styles.priceValue,
                  pkg.premium && styles.premiumPriceValue,
                ]}>{pkg.price}</Text>
              </View>
              <View style={styles.packageDetails}>
                <Text style={styles.detailItem}>📈 Daily Return: {pkg.daily}</Text>
                <Text style={styles.detailItem}>🎁 Referral Bonus: {pkg.bonus}</Text>
              </View>
            </TouchableOpacity>
          </Animatable.View>
        ))}
      </View>

      {/* Final CTA */}
      <LinearGradient
        colors={['#D4AF37', '#B8941F']}
        style={styles.finalCTA}
      >
        <Text style={styles.finalCTATitle}>Ready to Start Your Investment Journey?</Text>
        <Text style={styles.finalCTASubtitle}>
          Join thousands of investors earning daily returns
        </Text>
        <TouchableOpacity
          style={styles.finalCTAButton}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.finalCTAButtonText}>Get Started Now</Text>
        </TouchableOpacity>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  hero: {
    padding: 24,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  heroIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  badgeNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  badgeLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  ctaButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  ctaPrimary: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaPrimaryText: {
    color: '#D4AF37',
    fontWeight: '700',
    fontSize: 16,
  },
  ctaSecondary: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#fff',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaSecondaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  adminLoginButton: {
    marginTop: 12,
    backgroundColor: 'rgba(139, 69, 19, 0.8)',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  adminLoginText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  reasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  reasonCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reasonIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  reasonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  reasonDesc: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
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
  premiumPackageCard: {
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
    marginTop: 8,
  },
  detailItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  finalCTA: {
    margin: 20,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
  },
  finalCTATitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  finalCTASubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 24,
    textAlign: 'center',
  },
  finalCTAButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  finalCTAButtonText: {
    color: '#D4AF37',
    fontWeight: '700',
    fontSize: 16,
  },
});

