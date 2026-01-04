import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <TouchableOpacity style={styles.settingItem}>
            <Icon name="person" size={24} color="#666" />
            <Text style={styles.settingText}>Edit Profile</Text>
            <Icon name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Icon name="lock" size={24} color="#666" />
            <Text style={styles.settingText}>Change Password</Text>
            <Icon name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          <TouchableOpacity style={styles.settingItem}>
            <Icon name="info" size={24} color="#666" />
            <Text style={styles.settingText}>Help & Support</Text>
            <Icon name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#333' },
  content: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#666', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  settingItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  settingText: { flex: 1, marginLeft: 12, fontSize: 16, color: '#333', fontWeight: '500' },
});

