import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_URL from '../../config';

const StudyGroupsScreen = ({ route, navigation }) => {
  const { userId, courseCode, courseName } = route.params;

  const [activeTab, setActiveTab] = useState('groups');
  const [studyGroups, setStudyGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    group_name: '',
    description: '',
    max_size: 6,
    meeting_days: [],
    meeting_time: ''
  });

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'groups') {
        await fetchStudyGroups();
      } else {
        await fetchMyGroups();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStudyGroups = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/ai/study-groups/course/${courseCode}?user_id=${userId}`
      );
      setStudyGroups(response.data || []);
    } catch (error) {
      console.error('Error fetching study groups:', error);
      Alert.alert('Error', 'Failed to fetch study groups');
    }
  };

  const fetchMyGroups = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/ai/study-groups/my-groups/${userId}`
      );
      setMyGroups(response.data || []);
    } catch (error) {
      console.error('Error fetching my groups:', error);
      Alert.alert('Error', 'Failed to fetch your groups');
    }
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      meeting_days: prev.meeting_days.includes(day)
        ? prev.meeting_days.filter(d => d !== day)
        : [...prev.meeting_days, day]
    }));
  };

  const createStudyGroup = async () => {
    if (!formData.group_name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    try {
      setLoading(true);
      const meeting_schedule =
        formData.meeting_days.length > 0
          ? {
              days: formData.meeting_days,
              time: formData.meeting_time || 'TBD'
            }
          : null;

      await axios.post(`${API_URL}/ai/study-groups/create/${userId}`, {
        course_code: courseCode,
        group_name: formData.group_name,
        description: formData.description,
        max_size: parseInt(formData.max_size),
        meeting_schedule
      });

      Alert.alert('Success', 'Study group created successfully!');
      setShowCreateModal(false);
      setFormData({
        group_name: '',
        description: '',
        max_size: 6,
        meeting_days: [],
        meeting_time: ''
      });
      setActiveTab('my-groups');
      await fetchMyGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create study group');
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async (groupId, groupName) => {
    Alert.alert('Join Group', `Do you want to join "${groupName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Join',
        onPress: async () => {
          try {
            setLoading(true);
            await axios.post(
              `${API_URL}/ai/study-groups/${groupId}/join/${userId}`
            );
            Alert.alert('Success', 'Successfully joined the study group!');
            await fetchStudyGroups();
            await fetchMyGroups();
          } catch (error) {
            console.error('Error joining group:', error);
            const message =
              error.response?.data?.detail || 'Failed to join group';
            Alert.alert('Error', message);
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  const openGroupChat = (chatGroupId, groupName) => {
    navigation.navigate('GroupChat', {
      groupId: chatGroupId,
      groupName: groupName,
      userId: userId
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderGroupCard = (group, isMember = false) => (
    <View key={group.id} style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <View style={styles.groupIconContainer}>
          <Ionicons name="people" size={24} color="#3b82f6" />
        </View>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupCreator}>Created by {group.creator}</Text>
        </View>
        {group.is_full && (
          <View style={styles.fullBadge}>
            <Text style={styles.fullBadgeText}>FULL</Text>
          </View>
        )}
      </View>

      {group.description && (
        <Text style={styles.groupDescription} numberOfLines={2}>
          {group.description}
        </Text>
      )}

      <View style={styles.groupStats}>
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={16} color="#888" />
          <Text style={styles.statText}>
            {group.member_count}/{group.max_size}
          </Text>
        </View>

        {group.meeting_schedule && (
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={16} color="#888" />
            <Text style={styles.statText}>
              {group.meeting_schedule.days?.join(', ') || 'TBD'}
            </Text>
          </View>
        )}
      </View>

      {isMember ? (
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => openGroupChat(group.chat_group_id, group.name)}
        >
          <Ionicons name="chatbubbles-outline" size={16} color="#fff" />
          <Text style={styles.chatButtonText}>Open Chat</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.joinButton,
            (group.is_full || group.is_member) && styles.disabledButton
          ]}
          onPress={() => joinGroup(group.id, group.name)}
          disabled={group.is_full || group.is_member}
        >
          <Ionicons
            name={group.is_member ? 'checkmark-circle' : 'add-circle-outline'}
            size={16}
            color="#fff"
          />
          <Text style={styles.joinButtonText}>
            {group.is_member ? 'Joined' : 'Join Group'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAllGroups = () => (
    <ScrollView
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {loading && !refreshing ? (
        <ActivityIndicator
          size="large"
          color="#3b82f6"
          style={{ marginTop: 40 }}
        />
      ) : studyGroups.length > 0 ? (
        <>
          <View style={styles.statsCard}>
            <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
            <Text style={styles.statsText}>
              {studyGroups.length} study groups available for {courseName}
            </Text>
          </View>
          {studyGroups.map(group => renderGroupCard(group))}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color="#666" />
          <Text style={styles.emptyStateText}>No study groups yet</Text>
          <Text style={styles.emptyStateSubtext}>Be the first to create one!</Text>
        </View>
      )}
      <View style={styles.bottomSpace} />
    </ScrollView>
  );

  const renderMyGroups = () => (
    <ScrollView
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {loading && !refreshing ? (
        <ActivityIndicator
          size="large"
          color="#3b82f6"
          style={{ marginTop: 40 }}
        />
      ) : myGroups.length > 0 ? (
        <>
          <View style={styles.statsCard}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
            <Text style={styles.statsText}>
              You're a member of {myGroups.length} study{' '}
              {myGroups.length === 1 ? 'group' : 'groups'}
            </Text>
          </View>
          {myGroups.map(group => renderGroupCard(group, true))}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="folder-open-outline" size={64} color="#666" />
          <Text style={styles.emptyStateText}>No groups joined yet</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => setActiveTab('groups')}
          >
            <Text style={styles.browseButtonText}>Browse Groups</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.bottomSpace} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Study Groups</Text>
          <Text style={styles.headerSubtitle}>{courseName}</Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add-circle" size={28} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        {[
          { key: 'groups', label: 'All Groups' },
          { key: 'my-groups', label: 'My Groups' }
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'groups' ? renderAllGroups() : renderMyGroups()}

      {/* Create Group Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCreateModal}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Study Group</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.inputLabel}>Group Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.group_name}
                onChangeText={text =>
                  setFormData({ ...formData, group_name: text })
                }
                placeholder="e.g., CS101 Study Warriors"
                placeholderTextColor="#666"
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={text =>
                  setFormData({ ...formData, description: text })
                }
                placeholder="What's this group about?"
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Maximum Members</Text>
              <View style={styles.sizeSelector}>
                {[4, 5, 6, 8, 10].map(size => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeButton,
                      formData.max_size === size && styles.selectedSizeButton
                    ]}
                    onPress={() => setFormData({ ...formData, max_size: size })}
                  >
                    <Text
                      style={[
                        styles.sizeButtonText,
                        formData.max_size === size && styles.selectedSizeText
                      ]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Meeting Days (Optional)</Text>
              <View style={styles.daysSelector}>
                {days.map(day => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      formData.meeting_days.includes(day) &&
                        styles.selectedDayButton
                    ]}
                    onPress={() => toggleDay(day)}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        formData.meeting_days.includes(day) &&
                          styles.selectedDayText
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Meeting Time (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.meeting_time}
                onChangeText={text =>
                  setFormData({ ...formData, meeting_time: text })
                }
                placeholder="e.g., 6:00 PM - 8:00 PM"
                placeholderTextColor="#666"
              />
            </ScrollView>

            <TouchableOpacity
              style={styles.createGroupButton}
              onPress={createStudyGroup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <Text style={styles.createGroupButtonText}>Create Group</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a'
  },
  backButton: {
    padding: 4
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff'
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2
  },
  createButton: {
    padding: 4
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  activeTab: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6'
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  activeTabText: {
    color: '#fff'
  },
  content: {
    flex: 1,
    padding: 20
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 12
  },
  statsText: {
    flex: 1,
    fontSize: 13,
    color: '#888',
    lineHeight: 18
  },
  groupCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  groupIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f620',
    justifyContent: 'center',
    alignItems: 'center'
  },
  groupInfo: {
    flex: 1,
    marginLeft: 12
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4
  },
  groupCreator: {
    fontSize: 13,
    color: '#888'
  },
  fullBadge: {
    backgroundColor: '#ef444420',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444'
  },
  fullBadgeText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '700'
  },
  groupDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
    lineHeight: 20
  },
  groupStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a'
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  statText: {
    fontSize: 13,
    color: '#888'
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8
  },
  disabledButton: {
    backgroundColor: '#2a2a2a'
  },
  joinButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600'
  },
  chatButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600'
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20
  },
  browseButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12
  },
  browseButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff'
  },
  modalScrollView: {
    maxHeight: 400
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  sizeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },
  sizeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  selectedSizeButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6'
  },
  sizeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888'
  },
  selectedSizeText: {
    color: '#fff'
  },
  daysSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  selectedDayButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6'
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888'
  },
  selectedDayText: {
    color: '#fff'
  },
  createGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8
  },
  createGroupButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600'
  },
  bottomSpace: {
    height: 40
  }
});

export default StudyGroupsScreen;