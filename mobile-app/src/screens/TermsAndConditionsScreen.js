import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function TermsAndConditionsScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#D4AF37', '#B8941F']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.sectionText}>
            By accessing and using this investment platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Investment Services</Text>
          <Text style={styles.sectionText}>
            Our platform provides investment opportunities in various packages. All investments are subject to market risks. Past performance is not indicative of future results. Please invest only what you can afford to lose.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Account</Text>
          <Text style={styles.sectionText}>
            You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. We reserve the right to suspend or terminate accounts that violate our terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Investment Packages</Text>
          <Text style={styles.sectionText}>
            Investment packages are subject to availability and may be modified or discontinued at any time. Package details, returns, and terms are provided for informational purposes and may change without prior notice.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Payments and Withdrawals</Text>
          <Text style={styles.sectionText}>
            All payments must be made through authorized payment gateways. Withdrawal requests are subject to verification and processing time. We reserve the right to verify identity and payment details before processing withdrawals.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Referral Program</Text>
          <Text style={styles.sectionText}>
            Our referral program allows you to earn bonuses by referring new members. Referral earnings are subject to terms and conditions and may be modified at our discretion. Fraudulent referrals will result in account termination.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Daily Returns</Text>
          <Text style={styles.sectionText}>
            Daily returns are calculated based on your active investment package. Returns are credited to your wallet and are subject to the terms of your selected package. Returns may vary based on market conditions.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Identity Verification</Text>
          <Text style={styles.sectionText}>
            You agree to provide accurate and complete information during registration, including valid ID proof and photo. We reserve the right to verify your identity at any time. Providing false information may result in account termination.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Prohibited Activities</Text>
          <Text style={styles.sectionText}>
            You agree not to engage in any fraudulent, illegal, or unauthorized activities. This includes but is not limited to: creating fake accounts, manipulating referral systems, money laundering, or any activity that violates applicable laws.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Limitation of Liability</Text>
          <Text style={styles.sectionText}>
            We are not liable for any losses or damages arising from your use of our platform, including but not limited to investment losses, technical failures, or unauthorized access to your account. You invest at your own risk.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Privacy Policy</Text>
          <Text style={styles.sectionText}>
            Your personal information, including ID proof and photos, will be stored securely and used only for verification and account management purposes. We do not share your information with third parties without your consent, except as required by law.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Modifications to Terms</Text>
          <Text style={styles.sectionText}>
            We reserve the right to modify these terms and conditions at any time. Changes will be effective immediately upon posting. Your continued use of the platform constitutes acceptance of modified terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Contact Information</Text>
          <Text style={styles.sectionText}>
            For questions or concerns regarding these terms, please contact our support team through the app or email us at support@investmentplatform.com.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Governing Law</Text>
          <Text style={styles.sectionText}>
            These terms and conditions are governed by the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in India.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Last Updated: {new Date().toLocaleDateString()}
          </Text>
          <Text style={styles.footerText}>
            By using this platform, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 24,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  footer: {
    marginTop: 20,
    marginBottom: 40,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 18,
  },
});

