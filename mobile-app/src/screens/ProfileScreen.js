import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'react-native-linear-gradient';
import { default as Icon } from 'react-native-vector-icons/MaterialIcons';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#D4AF37', '#B8941F']} style={styles.header}>
        <Text style={styles.headerIcon}>👤</Text>
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerSubtitle}>Your account information</Text>
      </LinearGradient>
      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstname?.[0] || user?.login?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.profileName}>
            {(() => {
              const firstName = (user?.firstname || '').trim();
              const lastName = (user?.lastname || '').trim();
              const fullName = `${firstName} ${lastName}`.trim();
              return fullName || user?.login || 'User';
            })()}
          </Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Account Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Member ID:</Text>
            <Text style={styles.detailValue}>{user?.memberid || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Username:</Text>
            <Text style={styles.detailValue}>{user?.login || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[styles.detailValue, styles.statusActive]}>Active</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 24, paddingTop: 50, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center' },
  headerIcon: { fontSize: 48, marginBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#fff', opacity: 0.9 },
  content: { padding: 16 },
  profileCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  avatar: { width: 80, height: 80, backgroundColor: '#D4AF37', borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  profileName: { fontSize: 24, fontWeight: '700', color: '#333', marginBottom: 4 },
  profileEmail: { fontSize: 14, color: '#666' },
  detailsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardTitle: { fontWeight: '700', marginBottom: 16, fontSize: 18, color: '#333' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#dee2e6' },
  detailLabel: { fontSize: 14, color: '#666' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#333' },
  statusActive: { color: '#28a745' },
  logoutButton: { backgroundColor: '#dc3545', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoutText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});

