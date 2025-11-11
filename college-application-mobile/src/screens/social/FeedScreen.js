import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  Modal,
  ActivityIndicator,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

import API_URL from '../../config';

const FeedScreen = ({ navigation, route }) => {
  const { userId, userInfo } = route.params;
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Search states
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchFeed();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length > 0) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchFeed = async () => {
    try {
      const response = await axios.get(`${API_URL}/posts/feed/${userId}`);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching feed:', error);
      Alert.alert('Error', 'Could not load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await axios.get(
        `${API_URL}/search/users?query=${searchQuery}`
      );
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const navigateToUserProfile = (user) => {
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
    navigation.navigate('Profile', {
      userId: user.id,
      viewerId: userId,
      userInfo,
    });
  };

  const handleLike = async (postId) => {
    try {
      await axios.post(`${API_URL}/posts/${postId}/like/${userId}`);
      fetchFeed();
    } catch (error) {
      console.error('Error liking post:', error);
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
              await axios.delete(
                `${API_URL}/posts/${postId}?user_id=${userId}`,
                { timeout: 10000 }
              );

              Alert.alert('Success', 'Post deleted successfully');
              await fetchFeed();
            } catch (error) {
              const errorMessage =
                error.response?.data?.detail ||
                error.message ||
                'Could not delete post';
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

  const openPostOptions = (post) => {
    setSelectedPost(post);
    setShowOptionsModal(true);
  };

  const navigateToComments = (post) => {
    navigation.navigate('PostComments', { postId: post.id, userId, userInfo });
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => navigateToUserProfile(item)}
    >
      <View style={styles.searchResultAvatar}>
        <Text style={styles.avatarText}>{item.full_name.charAt(0)}</Text>
      </View>
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultName}>{item.full_name}</Text>
        <Text style={styles.searchResultDetails}>
          {item.college_id} • {item.department} • Year {item.year}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  const renderPost = (post) => {
    const isOwnPost = post.author.id === userId;

    return (
      <View key={post.id} style={styles.postCard}>
        {post.is_announcement && (
          <LinearGradient
            colors={['#8b5cf6', '#ec4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.announcementBadge}
          >
            <Ionicons name="megaphone" size={12} color="#fff" />
            <Text style={styles.announcementText}>Announcement</Text>
          </LinearGradient>
        )}

        <View style={styles.postHeaderContainer}>
          <TouchableOpacity
            style={styles.postHeader}
            onPress={() =>
              navigation.navigate('Profile', {
                userId: post.author.id,
                viewerId: userId,
                userInfo,
              })
            }
          >
            <View style={styles.authorAvatar}>
              <Text style={styles.avatarText}>
                {post.author.full_name.charAt(0)}
              </Text>
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{post.author.full_name}</Text>
              <Text style={styles.authorDetails}>
                {post.author.department} • Year {post.author.year}
              </Text>
            </View>
            <Text style={styles.postTime}>
              {formatTimeAgo(post.created_at)}
            </Text>
          </TouchableOpacity>

          {isOwnPost && (
            <TouchableOpacity
              style={styles.optionsButton}
              onPress={() => openPostOptions(post)}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.postContent}>{post.content}</Text>

        {post.media_url && (
          <Image source={{ uri: post.media_url }} style={styles.postImage} />
        )}

        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(post.id)}
          >
            <Ionicons
              name={post.user_liked ? 'heart' : 'heart-outline'}
              size={22}
              color={post.user_liked ? '#ef4444' : '#888'}
            />
            <Text
              style={[
                styles.actionText,
                post.user_liked && styles.actionTextActive,
              ]}
            >
              {post.likes_count}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigateToComments(post)}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#888" />
            <Text style={styles.actionText}>{post.comments_count}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={20} color="#888" />
          </TouchableOpacity>
        </View>
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

  return (
    <View style={styles.container}>
      {deleting && (
        <View style={styles.deletingOverlay}>
          <View style={styles.deletingContainer}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={styles.deletingText}>Deleting post...</Text>
          </View>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
        <View style={styles.headerActions}>
          {/* Search Button */}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSearchModal(true)}
          >
            <Ionicons name="search-outline" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() =>
              navigation.navigate('Notifications', { userId, userInfo })
            }
          >
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() =>
              navigation.navigate('Profile', {
                userId: userId,
                viewerId: userId,
                userInfo,
              })
            }
          >
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>
                {userInfo?.full_name?.charAt(0) || 'U'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchFeed();
            }}
            tintColor="#8b5cf6"
          />
        }
      >
        <TouchableOpacity
          style={styles.createPostCard}
          onPress={() =>
            navigation.navigate('CreatePost', { userId, userInfo })
          }
        >
          <View style={styles.createPostAvatar}>
            <Text style={styles.avatarText}>
              {userInfo?.full_name?.charAt(0) || 'U'}
            </Text>
          </View>
          <Text style={styles.createPostPlaceholder}>
            What's on your mind?
          </Text>
          <Ionicons name="add-circle" size={28} color="#8b5cf6" />
        </TouchableOpacity>

        {posts.map(renderPost)}

        <View style={styles.bottomSpace} />
      </ScrollView>

      <View style={styles.fab}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() =>
            navigation.navigate('CreatePost', { userId, userInfo })
          }
        >
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Home', { userId, userInfo })}
        >
          <Ionicons name="home-outline" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Ionicons name="newspaper" size={24} color="#8b5cf6" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            navigation.navigate('Discussions', { userId, userInfo })
          }
        >
          <Ionicons name="chatbubbles-outline" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            navigation.navigate('ChatList', { userId, userInfo })
          }
        >
          <Ionicons name="mail-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.searchModalOverlay}>
          <View style={styles.searchModalContent}>
            <View style={styles.searchHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowSearchModal(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.searchTitle}>Search Users</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Name or roll number..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>

            {searching ? (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="large" color="#8b5cf6" />
              </View>
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item) => item.id.toString()}
                style={styles.searchResultsList}
              />
            ) : searchQuery.length > 0 ? (
              <View style={styles.noResultsContainer}>
                <Ionicons name="person-outline" size={48} color="#666" />
                <Text style={styles.noResultsText}>No users found</Text>
              </View>
            ) : (
              <View style={styles.searchEmptyState}>
                <Ionicons name="people-outline" size={48} color="#666" />
                <Text style={styles.emptyStateText}>
                  Search by name or roll number
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

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
    paddingBottom: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  headerButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  createPostCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  createPostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  createPostPlaceholder: {
    flex: 1,
    color: '#666',
    fontSize: 15,
  },
  postCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  announcementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  announcementText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  postHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  authorDetails: {
    fontSize: 12,
    color: '#666',
  },
  postTime: {
    fontSize: 12,
    color: '#666',
  },
  optionsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  postContent: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#2a2a2a',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  actionTextActive: {
    color: '#ef4444',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
  },
  fabButton: {
    borderRadius: 28,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
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
  // Search Modal Styles
  searchModalOverlay: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  searchModalContent: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  searchLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultsList: {
    flex: 1,
    marginTop: 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  searchResultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  searchResultDetails: {
    fontSize: 13,
    color: '#666',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  searchEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  // Post Options Modal
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

export default FeedScreen;