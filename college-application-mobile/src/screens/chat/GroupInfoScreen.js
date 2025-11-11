import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

import API_URL from '../../config';

const GroupInfoScreen = ({ navigation, route }) => {
  const { groupId, userId, userInfo } = route.params;
  const [groupInfo, setGroupInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [mutualFollowers, setMutualFollowers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    console.log('GroupInfo loaded with:', { groupId, userId });
    fetchGroupInfo();
    fetchMembers();
  }, []);

  useEffect(() => {
    if (showAddMembersModal) {
      fetchMutualFollowers();
    }
  }, [showAddMembersModal, members]);

  const fetchGroupInfo = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/chat/groups/${groupId}/info?user_id=${userId}`
      );
      setGroupInfo(response.data);
    } catch (error) {
      console.error('Error fetching group info:', error);
      Alert.alert('Error', 'Could not load group info');
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/chat/groups/${groupId}/members`
      );
      setMembers(response.data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchMutualFollowers = async () => {
    try {
      const response = await axios.get(`${API_URL}/follow/${userId}/following`);
      const existingMemberIds = members.map((m) => m.user_id);
      const available = response.data.filter(
        (user) => !existingMemberIds.includes(user.id)
      );
      setMutualFollowers(available);
    } catch (error) {
      console.error('Error fetching followers:', error);
    }
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one member');
      return;
    }

    try {
      await axios.post(`${API_URL}/chat/groups/${groupId}/add-members`, {
        user_id: userId,
        member_ids: selectedUsers,
      });
      Alert.alert('Success', 'Members added successfully');
      setShowAddMembersModal(false);
      setSelectedUsers([]);
      fetchMembers();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Could not add members');
    }
  };

  const handleRemoveMember = (memberId, memberName) => {
    Alert.alert(
      'Remove Member',
      `Remove ${memberName} from group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(
                `${API_URL}/chat/groups/${groupId}/remove-member/${memberId}?admin_user_id=${userId}`
              );
              Alert.alert('Success', 'Member removed');
              fetchMembers();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.detail || 'Could not remove member');
            }
          },
        },
      ]
    );
  };

  const handleMakeAdmin = (memberId, memberName) => {
    Alert.alert(
      'Make Admin',
      `Make ${memberName} an admin?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await axios.put(
                `${API_URL}/chat/groups/${groupId}/make-admin/${memberId}?admin_user_id=${userId}`
              );
              Alert.alert('Success', `${memberName} is now an admin`);
              fetchMembers();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.detail || 'Could not make admin');
            }
          },
        },
      ]
    );
  };

  const handleLeaveGroup = () => {
    console.log('Leave group function called');
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Calling leave API:', `${API_URL}/chat/groups/${groupId}/leave/${userId}`);
              const response = await axios.post(
                `${API_URL}/chat/groups/${groupId}/leave/${userId}`
              );
              console.log('Leave response:', response.data);
              Alert.alert('Success', 'You have left the group', [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('ChatList', { userId, userInfo })
                }
              ]);
            } catch (error) {
              console.error('Leave error:', error.response?.data || error);
              Alert.alert(
                'Error',
                error.response?.data?.detail || 'Could not leave group'
              );
            }
          },
        },
      ]
    );
  };

  const renderMember = ({ item }) => (
    <View style={styles.memberItem}>
      <View style={styles.memberLeft}>
        <View style={styles.memberAvatar}>
          <Text style={styles.avatarText}>{item.full_name.charAt(0)}</Text>
        </View>
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName}>{item.full_name}</Text>
            {item.role === 'admin' && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminText}>Admin</Text>
              </View>
            )}
          </View>
          <Text style={styles.memberDetails}>
            {item.department} • Year {item.year}
          </Text>
        </View>
      </View>

      {groupInfo?.is_admin && item.user_id !== userId && (
        <View style={styles.memberActions}>
          {item.role !== 'admin' && item.user_id !== groupInfo.created_by && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleMakeAdmin(item.user_id, item.full_name)}
              >
                <Ionicons name="shield-checkmark-outline" size={20} color="#10b981" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleRemoveMember(item.user_id, item.full_name)}
              >
                <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );

  if (!groupInfo) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Info</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.groupHeader}>
          <View style={styles.groupAvatar}>
            <Ionicons name="people" size={48} color="#8b5cf6" />
          </View>
          <Text style={styles.groupName}>{groupInfo.name}</Text>
          {groupInfo.description && (
            <Text style={styles.groupDescription}>{groupInfo.description}</Text>
          )}
          <Text style={styles.groupMeta}>
            {members.length} members • Created by {groupInfo.creator_name}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Members</Text>
            {groupInfo.is_admin && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddMembersModal(true)}
              >
                <Ionicons name="person-add-outline" size={20} color="#8b5cf6" />
              </TouchableOpacity>
            )}
          </View>

          {members.map((member) => (
            <View key={member.id}>{renderMember({ item: member })}</View>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.leaveButton} 
          onPress={() => {
            console.log('Leave button pressed!');
            handleLeaveGroup();
          }}
        >
          <Text style={styles.leaveButtonText}>Leave Group</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Members Modal */}
      <Modal
        visible={showAddMembersModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddMembersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Members</Text>
              <TouchableOpacity onPress={() => setShowAddMembersModal(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Only mutual followers can be added
            </Text>

            <ScrollView style={styles.userList}>
              {mutualFollowers.length > 0 ? (
                mutualFollowers.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={styles.userItem}
                    onPress={() => {
                      if (selectedUsers.includes(user.id)) {
                        setSelectedUsers(selectedUsers.filter((id) => id !== user.id));
                      } else {
                        setSelectedUsers([...selectedUsers, user.id]);
                      }
                    }}
                  >
                    <View style={styles.userAvatar}>
                      <Text style={styles.avatarText}>{user.full_name.charAt(0)}</Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.full_name}</Text>
                      <Text style={styles.userDetails}>
                        {user.department} • Year {user.year}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        selectedUsers.includes(user.id) && styles.checkboxSelected,
                      ]}
                    >
                      {selectedUsers.includes(user.id) && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>No available users to add</Text>
              )}
            </ScrollView>

            {mutualFollowers.length > 0 && (
              <TouchableOpacity style={styles.addMembersButton} onPress={handleAddMembers}>
                <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.buttonGradient}>
                  <Text style={styles.buttonText}>Add Selected Members</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  groupHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  groupAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  groupDescription: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 8,
  },
  groupMeta: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addButton: {
    padding: 8,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  adminBadge: {
    backgroundColor: '#8b5cf620',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  adminText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8b5cf6',
    textTransform: 'uppercase',
  },
  memberDetails: {
    fontSize: 12,
    color: '#666',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  leaveButton: {
    margin: 16,
    marginTop: 24,
    padding: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
  },
  leaveButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 16,
  },
  userList: {
    maxHeight: 400,
    marginBottom: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  userDetails: {
    fontSize: 12,
    color: '#666',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  addMembersButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 40,
  },
});

export default GroupInfoScreen;