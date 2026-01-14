import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
      <View style={styles.hero}>
        <Animatable.View animation="fadeInDown" duration={1000}>
          <Image 
            source={require('../../assets/goldpile.png')} 
            style={styles.heroIcon}
            resizeMode="contain"
          />
          <Text style={styles.heroTitleGold}>GoldElevate</Text>
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
            <Text style={styles.ctaPrimaryText}>Get Started</Text>
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
        {/* <TouchableOpacity
          style={[styles.adminLoginButton, { backgroundColor: 'rgba(102, 102, 102, 0.8)', marginTop: 8 }]}
          onPress={() => navigation.navigate('TestLogin')}
        >
          <Text style={styles.adminLoginText}>🧪 Test Login Helper</Text>
        </TouchableOpacity> */}
      </View>

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
                <Icon name="arrow-forward" size={24} color="#FFD700" />
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
      <View style={styles.finalCTA}>
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  hero: {
    padding: 24,
    paddingTop: 50,
    paddingBottom: 40,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  heroIcon: {
    width: 150,
    height: 150,
    marginBottom: 1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'System',
  },
  heroTitleGold: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'System',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.85,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 24,
    fontFamily: 'System',
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  badge: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    padding: 12,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  badgeNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
  },
  badgeLabel: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
    marginTop: 4,
  },
  ctaButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  ctaPrimary: {
    flex: 1,
    backgroundColor: '#FFD700',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  ctaPrimaryText: {
    color: '#1a1a1a',
    fontWeight: '700',
    fontSize: 16,
    fontFamily: 'System',
  },
  ctaSecondary: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFD700',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaSecondaryText: {
    color: '#FFD700',
    fontWeight: '700',
    fontSize: 16,
    fontFamily: 'System',
  },
  adminLoginButton: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  adminLoginText: {
    color: '#FFD700',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'System',
  },
  section: {
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    fontFamily: 'System',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.7,
    marginBottom: 20,
    fontFamily: 'System',
  },
  reasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  reasonCard: {
    width: (width - 60) / 2,
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
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
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'System',
  },
  reasonDesc: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.7,
    textAlign: 'center',
    fontFamily: 'System',
  },
  packageCard: {
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  premiumPackageCard: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  packageBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
  },
  packageBadgeText: {
    color: '#1a1a1a',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'System',
  },
  packagePrice: {
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.7,
    marginBottom: 4,
    fontFamily: 'System',
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFD700',
    fontFamily: 'System',
  },
  premiumPriceValue: {
    color: '#FFD700',
  },
  packageDetails: {
    marginTop: 8,
  },
  detailItem: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 8,
    fontFamily: 'System',
  },
  finalCTA: {
    margin: 20,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  finalCTATitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'System',
  },
  finalCTASubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'System',
  },
  finalCTAButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  finalCTAButtonText: {
    color: '#1a1a1a',
    fontWeight: '700',
    fontSize: 16,
    fontFamily: 'System',
  },
});

