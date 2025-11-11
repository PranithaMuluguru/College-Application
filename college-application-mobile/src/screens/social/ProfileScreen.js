import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

import API_URL from '../../config';

const ProfileScreen = ({ navigation, route }) => {
  const { userId, viewerId, userInfo } = route.params;
  const isOwnProfile = userId === viewerId;
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/profile/${userId}?viewer_id=${viewerId}`
      );
      setProfileData(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Could not load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      await axios.post(`${API_URL}/follow/${viewerId}`, {
        following_id: userId,
      });
      fetchProfile();
    } catch (error) {
      Alert.alert('Error', 'Could not send follow request');
    }
  };

  const handleUnfollow = async () => {
    try {
      await axios.delete(`${API_URL}/follow/${viewerId}/unfollow/${userId}`);
      fetchProfile();
    } catch (error) {
      Alert.alert('Error', 'Could not unfollow');
    }
  };

  const handleDelete = async (postId) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            setShowOptionsModal(false);
            
            try {
              console.log('Deleting post:', postId);
              
              const response = await axios.delete(
                `${API_URL}/posts/${postId}?user_id=${viewerId}`,
                {
                  timeout: 10000,
                }
              );
              
              console.log('Delete response:', response.data);
              
              Alert.alert('Success', 'Post deleted successfully');
              
              // Refresh profile to update post count and grid
              await fetchProfile();
              
            } catch (error) {
              console.error('Delete error:', error);
              console.error('Error response:', error.response?.data);
              
              const errorMessage = error.response?.data?.detail 
                || error.message 
                || 'Could not delete post';
                
              Alert.alert('Error', errorMessage);
            } finally {
              setDeleting(false);
              setSelectedPost(null);
            }
          },
        },
      ]
    );
  };

  const openPostOptions = (post, event) => {
    event.stopPropagation();
    setSelectedPost(post);
    setShowOptionsModal(true);
  };

  if (loading || !profileData) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const { user, stats, is_following, recent_posts } = profileData;

  return (
    <View style={styles.container}>
      {/* Deleting Overlay */}
      {deleting && (
        <View style={styles.deletingOverlay}>
          <View style={styles.deletingContainer}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={styles.deletingText}>Deleting post...</Text>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        {isOwnProfile && (
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header with Gradient */}
        <LinearGradient
          colors={['#8b5cf6', '#7c3aed', '#6d28d9']}
          style={styles.profileHeader}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.full_name.charAt(0)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user.full_name}</Text>
          <Text style={styles.profileId}>@{user.college_id}</Text>
          
          {/* Department & Year */}
          <View style={styles.profileDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="school-outline" size={16} color="#8b5cf6" />
              <Text style={styles.detailText}>{user.department}</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color="#8b5cf6" />
              <Text style={styles.detailText}>Year {user.year}</Text>
            </View>
          </View>

          {/* Stats Container */}
          <View style={styles.statsContainer}>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statValue}>{stats.posts}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </TouchableOpacity>
            
            <View style={styles.statDivider} />
            
            <TouchableOpacity
              style={styles.statItem}
              onPress={() =>
                navigation.navigate('Followers', { userId, userInfo })
              }
            >
              <Text style={styles.statValue}>{stats.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            
            <View style={styles.statDivider} />
            
            <TouchableOpacity
              style={styles.statItem}
              onPress={() =>
                navigation.navigate('Following', { userId, userInfo })
              }
            >
              <Text style={styles.statValue}>{stats.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons - Only for other users' profiles */}
          {!isOwnProfile && (
            <View style={styles.actionButtons}>
              {is_following ? (
                <TouchableOpacity
                  style={[styles.button, styles.unfollowButton]}
                  onPress={handleUnfollow}
                >
                  <Text style={styles.unfollowButtonText}>Following</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleFollow}
                >
                  <LinearGradient
                    colors={['#8b5cf6', '#7c3aed']}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>Follow</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.messageButton}>
                <Ionicons name="mail-outline" size={20} color="#8b5cf6" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons
              name="grid-outline"
              size={20}
              color={activeTab === 'posts' ? '#8b5cf6' : '#666'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'posts' && styles.tabTextActive,
              ]}
            >
              Posts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'about' && styles.tabActive]}
            onPress={() => setActiveTab('about')}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={activeTab === 'about' ? '#8b5cf6' : '#666'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'about' && styles.tabTextActive,
              ]}
            >
              About
            </Text>
          </TouchableOpacity>
        </View>

        {/* Posts Tab Content */}
        {activeTab === 'posts' && (
          <View style={styles.postsGrid}>
            {recent_posts.map((post) => (
              <View key={post.id} style={styles.postItemWrapper}>
                <TouchableOpacity
                  style={styles.postItem}
                  onPress={() =>
                    navigation.navigate('PostDetail', {
                      postId: post.id,
                      userId: viewerId,
                      userInfo,
                    })
                  }
                >
                  {post.media_url ? (
                    <Image
                      source={{ uri: post.media_url }}
                      style={styles.postImage}
                    />
                  ) : (
                    <View style={styles.postPlaceholder}>
                      <Text style={styles.postContent} numberOfLines={4}>
                        {post.content}
                      </Text>
                    </View>
                  )}
                  <View style={styles.postOverlay}>
                    <View style={styles.postStats}>
                      <Ionicons name="heart" size={14} color="#fff" />
                      <Text style={styles.postStatText}>
                        {post.likes_count}
                      </Text>
                    </View>
                    <View style={styles.postStats}>
                      <Ionicons name="chatbubble" size={14} color="#fff" />
                      <Text style={styles.postStatText}>
                        {post.comments_count}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Three-dot menu - only for own profile */}
                {isOwnProfile && (
                  <TouchableOpacity
                    style={styles.postOptionsButton}
                    onPress={(e) => openPostOptions(post, e)}
                  >
                    <View style={styles.optionsButtonInner}>
                      <Ionicons
                        name="ellipsis-horizontal"
                        size={16}
                        color="#fff"
                      />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {recent_posts.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="images-outline" size={48} color="#666" />
                <Text style={styles.emptyText}>
                  {isOwnProfile ? 'No posts yet' : 'No posts to show'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* About Tab Content */}
        {activeTab === 'about' && (
          <View style={styles.aboutContainer}>
            <View style={styles.aboutCard}>
              <Text style={styles.aboutTitle}>Contact Information</Text>
              <View style={styles.aboutItem}>
                <Ionicons name="mail-outline" size={20} color="#8b5cf6" />
                <Text style={styles.aboutText}>{user.email}</Text>
              </View>
              {user.phone_number && (
                <View style={styles.aboutItem}>
                  <Ionicons name="call-outline" size={20} color="#8b5cf6" />
                  <Text style={styles.aboutText}>{user.phone_number}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Post Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setShowOptionsModal(false);
                Alert.alert('Edit', 'Edit functionality coming soon');
              }}
            >
              <Ionicons name="create-outline" size={24} color="#8b5cf6" />
              <Text style={styles.modalOptionText}>Edit Post</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, styles.modalOptionDanger]}
              onPress={() => handleDelete(selectedPost?.id)}
            >
              <Ionicons name="trash-outline" size={24} color="#ef4444" />
              <Text
                style={[styles.modalOptionText, styles.modalOptionTextDanger]}
              >
                Delete Post
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOptionCancel}
              onPress={() => setShowOptionsModal(false)}
            >
              <Text style={styles.modalOptionCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
    marginTop: 12,
  },
  deletingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  deletingContainer: {
    backgroundColor: '#1a1a1a',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
  },
  deletingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    height: 180,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 60,
  },
  avatarContainer: {
    position: 'absolute',
    bottom: -50,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#0a0a0a',
  },
  avatarText: {
    color: '#8b5cf6',
    fontSize: 40,
    fontWeight: '700',
  },
  profileInfo: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  profileDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  detailDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#2a2a2a',
    marginHorizontal: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2a2a2a',
    marginHorizontal: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  unfollowButton: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unfollowButtonText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '700',
    paddingVertical: 14,
  },
  messageButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    marginTop: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#8b5cf6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#8b5cf6',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  postItemWrapper: {
    width: '31.5%',
    aspectRatio: 1,
    position: 'relative',
  },
  postItem: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postPlaceholder: {
    width: '100%',
    height: '100%',
    padding: 12,
    backgroundColor: '#1a1a1a',
  },
  postContent: {
    fontSize: 11,
    color: '#888',
    lineHeight: 16,
  },
  postOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  postOptionsButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 10,
  },
  optionsButtonInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyState: {
    width: '100%',
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  aboutContainer: {
    padding: 20,
  },
  aboutCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  aboutText: {
    fontSize: 14,
    color: '#888',
  },
  bottomSpace: {
    height: 40,
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
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginBottom: 12,
  },
  modalOptionDanger: {
    backgroundColor: '#ef444420',
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalOptionTextDanger: {
    color: '#ef4444',
  },
  modalOptionCancel: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginTop: 8,
  },
  modalOptionCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
});

export default ProfileScreen;