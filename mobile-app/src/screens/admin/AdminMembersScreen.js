import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { adminAPI } from '../../config/api';
import Toast from 'react-native-toast-message';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { showErrorToast } from '../../utils/errorHandler';

export default function AdminMembersScreen({ navigation }) {
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await adminAPI.getMembers();
      // Handle response format - data might be nested
      const membersData = response.data?.data || response.data || [];
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (error) {
      console.error('Error loading members:', error);
      showErrorToast(error, 'Failed to load members');
      setMembers([]);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredMembers = members.filter(member =>
    member.login?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Members</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search members..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
      >
        <Text style={styles.countText}>
          {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
        </Text>

        {filteredMembers.map((member) => (
          <TouchableOpacity
            key={member.memberid}
            style={styles.memberCard}
            onPress={() => {
              console.log('[ADMIN MEMBERS] Navigating to member detail:', member.memberid);
              navigation.navigate('AdminMemberDetail', { member });
            }}
            activeOpacity={0.7}
          >
            <View style={styles.memberHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {member.firstname?.[0]?.toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {member.firstname} {member.lastname}
                </Text>
                <Text style={styles.memberId}>@{member.login || ''} • ID: {member.memberid || ''}</Text>
                <Text style={styles.memberEmail}>{member.email}</Text>
                {member.phone && (
                  <Text style={styles.memberPhone}>📱 {member.phone}</Text>
                )}
              </View>
              <View style={styles.headerRight}>
                <View style={[
                  styles.statusBadge,
                  member.active === 'Yes' ? styles.statusActive : styles.statusInactive
                ]}>
                  <Text style={[
                    styles.statusText,
                    member.active === 'Yes' ? styles.statusTextActive : styles.statusTextInactive
                  ]}>
                    {member.active === 'Yes' ? 'Active' : 'Inactive'}
                  </Text>
                </View>
                <Icon name="chevron-right" size={24} color="#D4AF37" style={styles.arrowIcon} />
              </View>
            </View>
            <View style={styles.memberDetails}>
              <View style={styles.detailItem}>
                <Icon name="card-giftcard" size={16} color="#666" />
                <Text style={styles.detailText}>{member.package_name || 'N/A'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="calendar-today" size={16} color="#666" />
                <Text style={styles.detailText}>{formatDate(member.signuptime)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filteredMembers.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No members found</Text>
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  countText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrowIcon: {
    marginLeft: 4,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  memberId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 12,
    color: '#999',
  },
  memberPhone: {
    fontSize: 12,
    color: '#D4AF37',
    marginTop: 4,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: 'rgba(40, 167, 69, 0.2)',
  },
  statusInactive: {
    backgroundColor: 'rgba(220, 53, 69, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#28a745',
  },
  statusTextInactive: {
    color: '#dc3545',
  },
  memberDetails: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});

