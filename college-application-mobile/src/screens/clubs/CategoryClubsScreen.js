import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';

const CategoryClubsScreen = ({ route, navigation }) => {
  const { category } = route.params;
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/clubs?category=${encodeURIComponent(category)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      setClubs(data);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      Alert.alert('Error', 'Failed to load clubs');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = () => {
    switch (category) {
      case 'Sports': return '#EF4444';
      case 'Cultural': return '#A855F7';
      case 'Technical': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getCategoryEmoji = () => {
    switch (category) {
      case 'Sports': return '⚽';
      case 'Cultural': return '🎭';
      case 'Technical': return '💻';
      default: return '🎯';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={getCategoryColor()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: getCategoryColor() }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.headerEmoji}>{getCategoryEmoji()}</Text>
        <Text style={styles.headerTitle}>{category} Clubs</Text>
        <Text style={styles.headerSubtitle}>
          {category === 'Sports' && 'Athletics, fitness, and competitive sports clubs'}
          {category === 'Cultural' && 'Arts, music, dance, and cultural activities'}
          {category === 'Technical' && 'Technology, innovation, and finance clubs'}
        </Text>
        <Text style={styles.headerSecretary}>
          Secretary: {category} Secretary
        </Text>
      </View>

      {/* Clubs List */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>{clubs.length} {category} Clubs</Text>

        <FlatList
          data={clubs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ClubCard club={item} navigation={navigation} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

const ClubCard = ({ club, navigation }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [following, setFollowing] = useState(false);

  const handleFollow = async () => {
    setFollowing(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      
      const response = await fetch(`${API_URL}/clubs/${club.id}/${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
      } else {
        Alert.alert('Error', 'Failed to update follow status');
      }
    } catch (error) {
      console.error('Error following club:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setFollowing(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.clubCard}
      onPress={() => navigation.navigate('ClubDetail', { clubId: club.id })}
    >
      <View style={styles.clubHeader}>
        <Text style={styles.clubName}>{club.name}</Text>
        <TouchableOpacity
          style={[styles.followButton, isFollowing && styles.followingButton]}
          onPress={handleFollow}
          disabled={following}
        >
          <Icon
            name={isFollowing ? 'account-check' : 'account-plus'}
            size={16}
            color={isFollowing ? '#7C3AED' : '#FFF'}
          />
          <Text
            style={[
              styles.followButtonText,
              isFollowing && styles.followingButtonText,
            ]}
          >
            {following ? '...' : isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.clubDescription} numberOfLines={2}>
        {club.description}
      </Text>

      <View style={styles.clubFooter}>
        <View style={styles.clubStat}>
          <Icon name="account-group" size={16} color="#6B7280" />
          <Text style={styles.clubStatText}>
            {club.follower_count} followers
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    marginBottom: 16,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
    marginBottom: 16,
  },
  headerSecretary: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    padding: 20,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  listContent: {
    gap: 16,
  },
  clubCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  clubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clubName: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  followingButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  followButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  followingButtonText: {
    color: '#7C3AED',
  },
  clubDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  clubFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clubStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clubStatText: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default CategoryClubsScreen;