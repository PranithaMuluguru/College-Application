import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

import API_URL from '../../config';

const DiscussionDetailScreen = ({ navigation, route }) => {
  const { discussionId, userId, userInfo } = route.params;
  const [discussion, setDiscussion] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    fetchDiscussion();
    fetchReplies();
    fetchParticipants();
  }, []);

  const fetchDiscussion = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/discussions?user_id=${userId}`
      );
      const found = response.data.find((d) => d.id === discussionId);
      setDiscussion(found);
    } catch (error) {
      console.error('Error fetching discussion:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/discussions/${discussionId}/replies`
      );
      setReplies(response.data);
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/discussions/${discussionId}/participants`
      );
      setParticipants(response.data);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const handleLeave = () => {
    Alert.alert(
      'Leave Discussion',
      'Are you sure you want to leave this discussion?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(
                `${API_URL}/discussions/${discussionId}/leave/${userId}`
              );
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.detail || 'Could not leave');
            }
          },
        },
      ]
    );
  };

  const handleRemoveParticipant = (targetUserId, userName) => {
    Alert.alert(
      'Remove Participant',
      `Remove ${userName} from this discussion?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(
                `${API_URL}/discussions/${discussionId}/remove/${targetUserId}?admin_user_id=${userId}`
              );
              fetchParticipants();
              Alert.alert('Success', 'Participant removed');
            } catch (error) {
              Alert.alert(
                'Error',
                error.response?.data?.detail || 'Could not remove participant'
              );
            }
          },
        },
      ]
    );
  };

  const sendReply = async () => {
    if (!replyText.trim()) return;

    try {
      await axios.post(
        `${API_URL}/discussions/${discussionId}/reply/${userId}`,
        {
          content: replyText,
          parent_reply_id: replyingTo?.id || null,
        }
      );
      setReplyText('');
      setReplyingTo(null);
      fetchReplies();
      fetchDiscussion(); // Refresh to update is_participant status
    } catch (error) {
      Alert.alert('Error', 'Could not send reply');
    }
  };

  const findParentReply = (parentId) => {
    return replies.find((r) => r.id === parentId);
  };

  const renderQuotedMessage = (parentReply) => {
    if (!parentReply) return null;

    return (
      <View style={styles.quotedMessage}>
        <View style={styles.quotedHeader}>
          <Text style={styles.quotedAuthor}>
            {parentReply.author.full_name}
          </Text>
        </View>
        <Text style={styles.quotedContent} numberOfLines={1}>
          {parentReply.content}
        </Text>
      </View>
    );
  };

  const renderReply = (reply) => {
    const parentReply = reply.parent_reply_id
      ? findParentReply(reply.parent_reply_id)
      : null;

    return (
      <View key={reply.id} style={styles.replyContainer}>
        <View style={styles.replyHeader}>
          <View style={styles.replyAvatar}>
            <Text style={styles.avatarText}>
              {reply.author.full_name.charAt(0)}
            </Text>
          </View>
          <View style={styles.replyAuthorInfo}>
            <Text style={styles.replyAuthor}>{reply.author.full_name}</Text>
            <Text style={styles.replyTime}>
              {formatTimeAgo(reply.created_at)}
            </Text>
          </View>
        </View>

        {parentReply && renderQuotedMessage(parentReply)}

        <Text style={styles.replyContent}>{reply.content}</Text>

        <TouchableOpacity
          style={styles.replyButton}
          onPress={() => setReplyingTo(reply)}
        >
          <Ionicons name="arrow-undo-outline" size={12} color="#8b5cf6" />
          <Text style={styles.replyButtonText}>Reply</Text>
        </TouchableOpacity>
      </View>
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

  if (loading || !discussion) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const sortedReplies = [...replies].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discussion</Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowParticipants(true)}
        >
          <Ionicons name="people-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.discussionCard}>
            <View style={styles.topicBadge}>
              <Text style={styles.topicText}>{discussion.topic}</Text>
            </View>

            <Text style={styles.discussionTitle}>{discussion.title}</Text>
            <Text style={styles.discussionContent}>{discussion.content}</Text>

            <View style={styles.discussionFooter}>
              <View style={styles.authorAvatar}>
                <Text style={styles.avatarText}>
                  {discussion.author.full_name.charAt(0)}
                </Text>
              </View>
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>
                  {discussion.author.full_name}
                </Text>
                <Text style={styles.discussionTime}>
                  {formatTimeAgo(discussion.created_at)}
                </Text>
              </View>

              {discussion.is_participant &&
                !discussion.is_admin &&
                discussion.author.id !== userId && (
                  <TouchableOpacity
                    style={styles.leaveButton}
                    onPress={handleLeave}
                  >
                    <Ionicons name="exit-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                )}
            </View>
          </View>

          <View style={styles.repliesSection}>
            <Text style={styles.repliesTitle}>Replies ({replies.length})</Text>

            {sortedReplies.length > 0 ? (
              sortedReplies.map((reply) => renderReply(reply))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={40} color="#666" />
                <Text style={styles.emptyText}>No replies yet</Text>
              </View>
            )}
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>

        <View style={styles.inputContainer}>
          {replyingTo && (
            <View style={styles.replyingToBar}>
              <View style={styles.replyingToContent}>
                <Text style={styles.replyingToName}>
                  {replyingTo.author.full_name}
                </Text>
                <Text style={styles.replyingToText} numberOfLines={1}>
                  {replyingTo.content}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeReplyButton}
                onPress={() => setReplyingTo(null)}
              >
                <Ionicons name="close" size={18} color="#888" />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Write a reply..."
                placeholderTextColor="#666"
                value={replyText}
                onChangeText={setReplyText}
                multiline
                maxLength={500}
              />
            </View>
            <TouchableOpacity
              style={styles.sendButton}
              onPress={sendReply}
              disabled={!replyText.trim()}
            >
              <LinearGradient
                colors={
                  replyText.trim()
                    ? ['#8b5cf6', '#7c3aed']
                    : ['#2a2a2a', '#2a2a2a']
                }
                style={styles.sendButtonGradient}
              >
                <Ionicons
                  name="send"
                  size={18}
                  color={replyText.trim() ? '#fff' : '#666'}
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Participants Modal */}
      <Modal
        visible={showParticipants}
        transparent
        animationType="slide"
        onRequestClose={() => setShowParticipants(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Participants ({participants.length})
              </Text>
              <TouchableOpacity onPress={() => setShowParticipants(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.participantsList}>
              {participants.map((participant) => (
                <View key={participant.id} style={styles.participantItem}>
                  <View style={styles.participantAvatar}>
                    <Text style={styles.avatarText}>
                      {participant.full_name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>
                      {participant.full_name}
                    </Text>
                    {participant.is_admin && (
                      <Text style={styles.adminBadge}>Admin</Text>
                    )}
                  </View>

                  {discussion.is_admin &&
                    !participant.is_admin &&
                    participant.id !== userId && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() =>
                          handleRemoveParticipant(
                            participant.id,
                            participant.full_name
                          )
                        }
                      >
                        <Ionicons
                          name="person-remove-outline"
                          size={20}
                          color="#ef4444"
                        />
                      </TouchableOpacity>
                    )}
                </View>
              ))}
            </ScrollView>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  discussionCard: {
    backgroundColor: '#1a1a1a',
    margin: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  topicBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#8b5cf620',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  topicText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8b5cf6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  discussionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 24,
  },
  discussionContent: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 12,
  },
  discussionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  discussionTime: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  leaveButton: {
    padding: 8,
  },
  repliesSection: {
    marginHorizontal: 12,
    marginTop: 8,
  },
  repliesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  replyContainer: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 8,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  replyAuthorInfo: {
    flex: 1,
  },
  replyAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  replyTime: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  quotedMessage: {
    backgroundColor: '#0a0a0a',
    borderLeftWidth: 2,
    borderLeftColor: '#8b5cf6',
    paddingLeft: 8,
    paddingVertical: 6,
    paddingRight: 8,
    marginBottom: 8,
    borderRadius: 6,
  },
  quotedHeader: {
    marginBottom: 3,
  },
  quotedAuthor: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  quotedContent: {
    fontSize: 12,
    color: '#888',
    lineHeight: 16,
  },
  replyContent: {
    fontSize: 14,
    color: '#e0e0e0',
    lineHeight: 20,
    marginBottom: 8,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  replyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
  },
  inputContainer: {
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },
  replyingToBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderLeftWidth: 2,
    borderLeftColor: '#8b5cf6',
    paddingLeft: 10,
    paddingRight: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  replyingToContent: {
    flex: 1,
  },
  replyingToName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8b5cf6',
    marginBottom: 2,
  },
  replyingToText: {
    fontSize: 12,
    color: '#888',
  },
  closeReplyButton: {
    padding: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 80,
  },
  input: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
  },
  sendButton: {},
  sendButtonGradient: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSpace: {
    height: 80,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  participantsList: {
    padding: 16,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  adminBadge: {
    fontSize: 11,
    color: '#8b5cf6',
    fontWeight: '600',
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
});

export default DiscussionDetailScreen;
