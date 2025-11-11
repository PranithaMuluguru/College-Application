import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

import API_URL from '../../config';

const NotificationsScreen = ({ navigation, route }) => {
  const { userId, userInfo } = route.params;
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

const fetchNotifications = async () => {
  try {
    console.log(`Fetching notifications for user ${userId}`); // Debug
    const unreadOnly = filter === 'unread';
    const response = await axios.get(
      `${API_URL}/notifications/${userId}?unread_only=${unreadOnly}`
    );
    console.log('Notifications received:', response.data); // Debug
    setNotifications(response.data);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    Alert.alert('Error', 'Could not fetch notifications');
  } finally {
    setRefreshing(false);
  }
};

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${API_URL}/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_URL}/notifications/${userId}/read-all`);
      fetchNotifications();
    } catch (error) {
      Alert.alert('Error', 'Could not mark all as read');
    }
  };

  const handleAcceptFollow = async (notificationId, followerId) => {
    setActionLoading({ ...actionLoading, [`accept_${notificationId}`]: true });
    
    try {
      await axios.post(`${API_URL}/follow/${userId}/accept/${followerId}`);
      Alert.alert(
        'Success', 
        'Follow request accepted! You both can now chat with each other.'
      );
      fetchNotifications();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Could not accept follow request';
      Alert.alert('Error', errorMsg);
    } finally {
      setActionLoading({ ...actionLoading, [`accept_${notificationId}`]: false });
    }
  };

  const handleRejectFollow = async (notificationId, followerId) => {
    setActionLoading({ ...actionLoading, [`reject_${notificationId}`]: true });
    
    try {
      await axios.post(`${API_URL}/follow/${userId}/reject/${followerId}`);
      Alert.alert('Rejected', 'Follow request rejected');
      fetchNotifications();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Could not reject follow request';
      Alert.alert('Error', errorMsg);
    } finally {
      setActionLoading({ ...actionLoading, [`reject_${notificationId}`]: false });
    }
  };

  const handleNotificationPress = (notification) => {
    // Don't navigate if it's a follow request (let them use accept/reject buttons)
    if (notification.type !== 'follow_request') {
      markAsRead(notification.id);
    }

    switch (notification.type) {
      case 'follow_request':
        // Don't navigate, show accept/reject buttons
        break;
      case 'follow_accepted':
        navigation.navigate('Profile', {
          userId: notification.related_id,
          viewerId: userId,
          userInfo,
        });
        break;
      case 'new_message':
        navigation.navigate('Chat', {
          groupId: notification.related_id,
          userId,
          userInfo,
        });
        break;
      case 'post_like':
      case 'post_comment':
        navigation.navigate('PostComments', {
          postId: notification.related_id,
          userId,
          userInfo,
        });
        break;
      case 'discussion_reply':
        navigation.navigate('DiscussionDetail', {
          discussionId: notification.related_id,
          userId,
          userInfo,
        });
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      follow_request: {
        name: 'person-add',
        color: '#3b82f6',
        bg: '#3b82f620',
      },
      follow_accepted: { 
        name: 'checkmark-circle', 
        color: '#10b981', 
        bg: '#10b98120' 
      },
      new_message: { 
        name: 'mail', 
        color: '#8b5cf6', 
        bg: '#8b5cf620' 
      },
      post_like: { 
        name: 'heart', 
        color: '#ef4444', 
        bg: '#ef444420' 
      },
      post_comment: { 
        name: 'chatbubble', 
        color: '#f59e0b', 
        bg: '#f59e0b20' 
      },
      discussion_reply: {
        name: 'chatbubbles',
        color: '#ec4899',
        bg: '#ec489920',
      },
      event_reminder: { 
        name: 'calendar', 
        color: '#6366f1', 
        bg: '#6366f120' 
      },
      admin_broadcast: {
        name: 'megaphone',
        color: '#8b5cf6',
        bg: '#8b5cf620',
      },
    };
    return icons[type] || { 
      name: 'notifications', 
      color: '#888', 
      bg: '#88888820' 
    };
  };

  const renderNotification = (notification) => {
    const icon = getNotificationIcon(notification.type);
    const isFollowRequest = notification.type === 'follow_request';

    return (
      <View
        key={notification.id}
        style={[
          styles.notificationCard,
          !notification.is_read && styles.unreadNotification,
        ]}
      >
        <TouchableOpacity
          style={styles.notificationMain}
          onPress={() => handleNotificationPress(notification)}
          disabled={isFollowRequest}
          activeOpacity={isFollowRequest ? 1 : 0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: icon.bg }]}>
            <Ionicons name={icon.name} size={24} color={icon.color} />
          </View>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationMessage}>
              {notification.message}
            </Text>
            <Text style={styles.notificationTime}>
              {formatTimeAgo(notification.created_at)}
            </Text>
          </View>
          {!notification.is_read && !isFollowRequest && (
            <View style={styles.unreadDot} />
          )}
        </TouchableOpacity>

        {/* Follow Request Action Buttons */}
        {isFollowRequest && !notification.is_read && (
          <View style={styles.followActions}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() =>
                handleRejectFollow(notification.id, notification.related_id)
              }
              disabled={actionLoading[`reject_${notification.id}`]}
            >
              {actionLoading[`reject_${notification.id}`] ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() =>
                handleAcceptFollow(notification.id, notification.related_id)
              }
              disabled={actionLoading[`accept_${notification.id}`]}
            >
              {actionLoading[`accept_${notification.id}`] ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
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
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Ionicons name="checkmark-done" size={24} color="#8b5cf6" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton, 
            filter === 'all' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('all')}
        >
          {filter === 'all' && (
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              style={styles.filterGradient}
            >
              <Text style={styles.filterTextActive}>All</Text>
            </LinearGradient>
          )}
          {filter !== 'all' && <Text style={styles.filterText}>All</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'unread' && styles.filterButtonActive,
          ]}
          onPress={() => setFilter('unread')}
        >
          {filter === 'unread' && (
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              style={styles.filterGradient}
            >
              <Text style={styles.filterTextActive}>Unread</Text>
            </LinearGradient>
          )}
          {filter !== 'unread' && (
            <Text style={styles.filterText}>Unread</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchNotifications();
            }}
            tintColor="#8b5cf6"
          />
        }
      >
        {notifications.length > 0 ? (
          <>
            {notifications.map(renderNotification)}
            <View style={styles.bottomSpace} />
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="notifications-off-outline"
              size={64}
              color="#666"
            />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyText}>
              {filter === 'unread'
                ? "You're all caught up!"
                : "You'll see notifications here"}
            </Text>
          </View>
        )}
      </ScrollView>
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
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  markAllButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    borderColor: 'transparent',
  },
  filterGradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  filterText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  notificationCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  unreadNotification: {
    backgroundColor: '#1f1a2e',
    borderColor: '#8b5cf620',
  },
  notificationMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 11,
    color: '#666',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8b5cf6',
    marginLeft: 8,
  },
  followActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  rejectButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '700',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  bottomSpace: {
    height: 20,
  },
});

export default NotificationsScreen;