import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

import API_URL from '../../config';

const UserSearchScreen = ({ route, navigation }) => {
  const { userId, userInfo } = route.params;
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [followLoading, setFollowLoading] = useState({});

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const delaySearch = setTimeout(() => {
        searchUsers();
      }, 500);
      return () => clearTimeout(delaySearch);
    } else {
      setUsers([]);
      setHasSearched(false);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const response = await axios.get(
        `${API_URL}/search/users?query=${searchQuery}&current_user_id=${userId}`
      );
      setUsers(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Could not search users');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUser = async (followingId) => {
  // Prevent multiple clicks
  if (followLoading[followingId]) return;
  
  setFollowLoading({ ...followLoading, [followingId]: true });
  
  try {
    const response = await axios.post(`${API_URL}/follow/${userId}`, {
      following_id: followingId,
    });
    
    console.log('Follow response:', response.data); // Debug log
    
    Alert.alert('Success', 'Follow request sent!');
    
    // Refresh the search results
    await searchUsers();
  } catch (error) {
    console.error('Follow error:', error.response?.data || error);
    Alert.alert('Error', error.response?.data?.detail || 'Could not send follow request');
  } finally {
    setFollowLoading({ ...followLoading, [followingId]: false });
  }
};

  const getFollowButtonContent = (user) => {
    if (followLoading[user.id]) {
      return <ActivityIndicator size="small" color="#8b5cf6" />;
    }

    if (!user.follow_status) {
      return (
        <>
          <Ionicons name="person-add-outline" size={18} color="#8b5cf6" />
          <Text style={styles.followButtonText}>Follow</Text>
        </>
      );
    }

    if (user.follow_status === 'pending') {
      return (
        <>
          <Ionicons name="time-outline" size={18} color="#f59e0b" />
          <Text style={[styles.followButtonText, { color: '#f59e0b' }]}>
            Pending
          </Text>
        </>
      );
    }

    if (user.follow_status === 'accepted') {
      return (
        <>
          <Ionicons name="checkmark-circle" size={18} color="#10b981" />
          <Text style={[styles.followButtonText, { color: '#10b981' }]}>
            Following
          </Text>
        </>
      );
    }

    return null;
  };

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <TouchableOpacity
        style={styles.userLeft}
        onPress={() =>
          navigation.navigate('Profile', {
            userId: item.id,
            viewerId: userId,
            userInfo: userInfo,
          })
        }
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.full_name.charAt(0)}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.full_name}</Text>
          <Text style={styles.userCollege}>@{item.college_id}</Text>
          <Text style={styles.userDetails}>
            {item.department} • Year {item.year}
          </Text>
        </View>
      </TouchableOpacity>
      
      {item.id !== userId && (
        <TouchableOpacity
          style={[
            styles.followButton,
            item.follow_status === 'pending' && styles.followButtonPending,
            item.follow_status === 'accepted' && styles.followButtonAccepted,
          ]}
          onPress={() => handleFollowUser(item.id)}
          disabled={followLoading[item.id] || item.follow_status === 'accepted'}
        >
          {getFollowButtonContent(item)}
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyState = () => {
    if (loading) return null;
    
    if (!hasSearched) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={64} color="#444" />
          <Text style={styles.emptyTitle}>Search for Users</Text>
          <Text style={styles.emptyText}>
            Search by name, college ID, department, or email
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="person-outline" size={64} color="#444" />
        <Text style={styles.emptyTitle}>No Users Found</Text>
        <Text style={styles.emptyText}>
          Try searching with a different query
        </Text>
      </View>
    );
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
        <Text style={styles.headerTitle}>Search Users</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#666"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, ID, or department..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {users.length > 0 && !loading && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {users.length} {users.length === 1 ? 'result' : 'results'} found
          </Text>
        </View>
      )}
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
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  userCollege: {
    fontSize: 14,
    color: '#8b5cf6',
    marginBottom: 2,
  },
  userDetails: {
    fontSize: 13,
    color: '#666',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#8b5cf620',
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  followButtonPending: {
    backgroundColor: '#f59e0b20',
    borderColor: '#f59e0b',
  },
  followButtonAccepted: {
    backgroundColor: '#10b98120',
    borderColor: '#10b981',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
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
    lineHeight: 20,
  },
  countBadge: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
});

export default UserSearchScreen;