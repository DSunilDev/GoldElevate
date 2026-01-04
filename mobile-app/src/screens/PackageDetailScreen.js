import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';

export default function PackageDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { package: pkg } = route.params || {};

  if (!pkg) {
    return (
      <View style={styles.container}>
        <Text>Package not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
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
        <Text style={styles.headerTitle}>{pkg.name} Package</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>Investment Amount</Text>
          <Text style={styles.priceValue}>
            ₹{pkg.price?.toLocaleString() || pkg.price}
          </Text>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Package Details</Text>
          
          <View style={styles.detailRow}>
            <Icon name="trending-up" size={24} color="#D4AF37" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Daily Return</Text>
              <Text style={styles.detailValue}>
                ₹{pkg.daily_return?.toLocaleString() || pkg.daily_return}/day
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Icon name="card-giftcard" size={24} color="#D4AF37" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Referral Bonus</Text>
              <Text style={styles.detailValue}>
                ₹{pkg.referral_bonus?.toLocaleString() || pkg.referral_bonus}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.investButton}
          onPress={() => navigation.navigate('Payment', { package: pkg })}
        >
          <Text style={styles.investButtonText}>Invest Now</Text>
        </TouchableOpacity>
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
    padding: 24,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
    padding: 16,
  },
  priceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  priceValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#D4AF37',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  investButton: {
    backgroundColor: '#D4AF37',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  investButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

