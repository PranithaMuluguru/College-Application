// AdminManagementScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

import API_URL from '../../config';

const AdminManagementScreen = ({ navigation, route }) => {
  const { token, admin_user } = route.params;
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdminUserId, setNewAdminUserId] = useState('');
  const [newAdminLevel, setNewAdminLevel] = useState('admin');

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/auth/admins`, {
        params: { token }
      });
      setAdmins(response.data);
    } catch (error) {
      console.error('Error loading admins:', error);
      Alert.alert('Error', 'Failed to load admins');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminUserId) {
      Alert.alert('Error', 'Please enter user ID');
      return;
    }

    try {
      await axios.post(
        `${API_URL}/admin/auth/create-admin`,
        {
          user_id: parseInt(newAdminUserId),
          admin_level: newAdminLevel
        },
        { params: { token } }
      );

      Alert.alert('Success', 'Admin created successfully');
      setShowAddModal(false);
      setNewAdminUserId('');
      setNewAdminLevel('admin');
      loadAdmins();
    } catch (error) {
      console.error('Error creating admin:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create admin');
    }
  };

  const handleRemoveAdmin = (adminId, adminName) => {
    Alert.alert(
      'Remove Admin',
      `Are you sure you want to remove ${adminName} as admin?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/admin/auth/admins/${adminId}`, {
                params: { token }
              });
              Alert.alert('Success', 'Admin removed successfully');
              loadAdmins();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove admin');
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Management</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Ionicons name="add-circle" size={24} color="#8b5cf6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {admins.map((admin) => (
          <View key={admin.id} style={styles.adminCard}>
            <View style={styles.adminInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {admin.user.full_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.adminDetails}>
                <Text style={styles.adminName}>{admin.user.full_name}</Text>
                <Text style={styles.adminEmail}>{admin.user.email}</Text>
                <View style={styles.adminMeta}>
                  <View style={[
                    styles.levelBadge,
                    admin.admin_level === 'super_admin' && styles.superAdminBadge
                  ]}>
                    <Text style={styles.levelText}>
                      {admin.admin_level === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </Text>
                  </View>
                  <Text style={styles.metaText}>
                    {admin.user.department} • Year {admin.user.year}
                  </Text>
                </View>
                <Text style={styles.lastLogin}>
                  Last login: {admin.last_login ? 
                    new Date(admin.last_login).toLocaleDateString() : 'Never'}
                </Text>
              </View>
            </View>
            {admin_user.admin_level === 'super_admin' && admin.id !== admin_user.id && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveAdmin(admin.id, admin.user.full_name)}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Add Admin Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Admin</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="User ID"
              placeholderTextColor="#666"
              value={newAdminUserId}
              onChangeText={setNewAdminUserId}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Admin Level</Text>
            <View style={styles.levelButtons}>
              <TouchableOpacity
                style={[
                  styles.levelButton,
                  newAdminLevel === 'admin' && styles.levelButtonActive
                ]}
                onPress={() => setNewAdminLevel('admin')}
              >
                <Text style={[
                  styles.levelButtonText,
                  newAdminLevel === 'admin' && styles.levelButtonTextActive
                ]}>
                  Admin
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.levelButton,
                  newAdminLevel === 'super_admin' && styles.levelButtonActive
                ]}
                onPress={() => setNewAdminLevel('super_admin')}
              >
                <Text style={[
                  styles.levelButtonText,
                  newAdminLevel === 'super_admin' && styles.levelButtonTextActive
                ]}>
                  Super Admin
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddAdmin}
            >
              <Text style={styles.addButtonText}>Add Admin</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  adminCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adminInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  adminDetails: {
    flex: 1,
  },
  adminName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  adminEmail: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  adminMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  levelBadge: {
    backgroundColor: '#3b82f620',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  superAdminBadge: {
    backgroundColor: '#8b5cf620',
  },
  levelText: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaText: {
    fontSize: 11,
    color: '#666',
  },
  lastLogin: {
    fontSize: 11,
    color: '#666',
  },
  removeButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  levelButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  levelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
  },
  levelButtonActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  levelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  levelButtonTextActive: {
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

export default AdminManagementScreen;