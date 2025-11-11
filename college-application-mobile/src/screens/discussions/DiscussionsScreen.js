import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

import API_URL from '../../config';

const DiscussionsScreen = ({ navigation, route }) => {
  const { userId, userInfo } = route.params;
  const [discussions, setDiscussions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({
    title: '',
    topic: '',
    content: '',
    visibility: 'public',
  });

  const topics = [
    { id: 'all', name: 'All', icon: 'globe-outline', color: '#8b5cf6' },
    { id: 'academic', name: 'Academic', icon: 'school-outline', color: '#3b82f6' },
    { id: 'tech', name: 'Tech', icon: 'code-slash-outline', color: '#10b981' },
    { id: 'campus', name: 'Campus', icon: 'business-outline', color: '#f59e0b' },
    { id: 'events', name: 'Events', icon: 'calendar-outline', color: '#ec4899' },
    { id: 'general', name: 'General', icon: 'chatbubbles-outline', color: '#6366f1' },
  ];

  useEffect(() => {
    fetchDiscussions();
  }, [selectedTopic]);

  const fetchDiscussions = async () => {
    try {
      const topicQuery =
        selectedTopic === 'all' ? '' : `&topic=${selectedTopic}`;
      const response = await axios.get(
        `${API_URL}/discussions?user_id=${userId}${topicQuery}`
      );
      setDiscussions(response.data);
    } catch (error) {
      console.error('Error fetching discussions:', error);
    }
  };

  const createDiscussion = async () => {
    if (!newDiscussion.title.trim() || !newDiscussion.content.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await axios.post(`${API_URL}/discussions/${userId}`, newDiscussion);
      setShowCreateModal(false);
      setNewDiscussion({
        title: '',
        topic: '',
        content: '',
        visibility: 'public',
      });
      fetchDiscussions();
    } catch (error) {
      Alert.alert('Error', 'Could not create discussion');
    }
  };

  const renderDiscussion = (discussion) => {
    const topic = topics.find((t) => t.id === discussion.topic) || topics[0];

    return (
      <TouchableOpacity
        key={discussion.id}
        style={styles.discussionCard}
        onPress={() =>
          navigation.navigate('DiscussionDetail', {
            discussionId: discussion.id,
            userId,
            userInfo,
          })
        }
      >
        <View style={styles.discussionHeader}>
          <View
            style={[
              styles.topicBadge,
              { backgroundColor: `${topic.color}20` },
            ]}
          >
            <Ionicons name={topic.icon} size={14} color={topic.color} />
            <Text style={[styles.topicText, { color: topic.color }]}>
              {topic.name}
            </Text>
          </View>
          <Text style={styles.discussionTime}>
            {formatTimeAgo(discussion.created_at)}
          </Text>
        </View>

        <Text style={styles.discussionTitle}>{discussion.title}</Text>
        <Text style={styles.discussionContent} numberOfLines={2}>
          {discussion.content}
        </Text>

        <View style={styles.discussionFooter}>
          <View style={styles.authorInfo}>
            <View style={styles.authorAvatar}>
              <Text style={styles.avatarText}>
                {discussion.author.full_name.charAt(0)}
              </Text>
            </View>
            <Text style={styles.authorName}>
              {discussion.author.full_name}
            </Text>
          </View>
          <View style={styles.discussionStats}>
            <View style={styles.statItem}>
              <Ionicons name="chatbubble-outline" size={16} color="#666" />
              <Text style={styles.statText}>{discussion.replies_count}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discussions</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search discussions..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.topicsScroll}
        contentContainerStyle={styles.topicsContent}
      >
        {topics.map((topic) => (
          <TouchableOpacity
            key={topic.id}
            style={[
              styles.topicChip,
              selectedTopic === topic.id && styles.topicChipActive,
            ]}
            onPress={() => setSelectedTopic(topic.id)}
          >
            <Ionicons
              name={topic.icon}
              size={18}
              color={selectedTopic === topic.id ? '#fff' : topic.color}
            />
            <Text
              style={[
                styles.topicChipText,
                selectedTopic === topic.id && styles.topicChipTextActive,
              ]}
            >
              {topic.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {discussions.map(renderDiscussion)}
        <View style={styles.bottomSpace} />
      </ScrollView>

      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Discussion</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Discussion title"
              placeholderTextColor="#666"
              value={newDiscussion.title}
              onChangeText={(text) =>
                setNewDiscussion({ ...newDiscussion, title: text })
              }
            />

            <View style={styles.topicSelector}>
              <Text style={styles.inputLabel}>Topic</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.topicOptions}
              >
                {topics.slice(1).map((topic) => (
                  <TouchableOpacity
                    key={topic.id}
                    style={[
                      styles.topicOption,
                      newDiscussion.topic === topic.id &&
                        styles.topicOptionActive,
                    ]}
                    onPress={() =>
                      setNewDiscussion({ ...newDiscussion, topic: topic.id })
                    }
                  >
                    <Ionicons
                      name={topic.icon}
                      size={16}
                      color={
                        newDiscussion.topic === topic.id ? '#fff' : topic.color
                      }
                    />
                    <Text
                      style={[
                        styles.topicOptionText,
                        newDiscussion.topic === topic.id &&
                          styles.topicOptionTextActive,
                      ]}
                    >
                      {topic.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What would you like to discuss?"
              placeholderTextColor="#666"
              value={newDiscussion.content}
              onChangeText={(text) =>
                setNewDiscussion({ ...newDiscussion, content: text })
              }
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={createDiscussion}
            >
              <LinearGradient
                colors={['#8b5cf6', '#7c3aed']}
                style={styles.submitButtonGradient}
              >
                <Text style={styles.submitButtonText}>Start Discussion</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Home', { userId, userInfo })}
        >
          <Ionicons name="home-outline" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Feed', { userId, userInfo })}
        >
          <Ionicons name="newspaper-outline" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Ionicons name="chatbubbles" size={24} color="#8b5cf6" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('ChatList', { userId, userInfo })}
        >
          <Ionicons name="mail-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
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
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    paddingVertical: 12,
    paddingLeft: 12,
  },
  topicsScroll: {
    marginTop: 16,
    maxHeight: 50,
  },
  topicsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  topicChipActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  topicChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  topicChipTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    marginTop: 16,
  },
  discussionCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  discussionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  topicText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  discussionTime: {
    fontSize: 12,
    color: '#666',
  },
  discussionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  discussionContent: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
    marginBottom: 12,
  },
  discussionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  authorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  discussionStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
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
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  topicSelector: {
    marginBottom: 16,
  },
  topicOptions: {
    flexDirection: 'row',
  },
  topicOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginRight: 8,
  },
  topicOptionActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  topicOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  topicOptionTextActive: {
    color: '#fff',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpace: {
    height: 100,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    backgroundColor: '#8b5cf620',
    borderRadius: 12,
  },
});

export default DiscussionsScreen;