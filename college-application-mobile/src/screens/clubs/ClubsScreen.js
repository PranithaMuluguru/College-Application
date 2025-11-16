// screens/ClubsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_URL from '../../config';

const ClubsScreen = ({ navigation }) => {
  const [clubs, setClubs] = useState([]);
  const [filteredClubs, setFilteredClubs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showTrendingOnly, setShowTrendingOnly] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchClubs();
    fetchUser();
  }, []);

  useEffect(() => {
    filterClubs();
  }, [clubs, selectedCategory, searchQuery, showTrendingOnly]);

  const fetchUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('user_token');
      
      let url = `${API_URL}/clubs/`;
      if (showTrendingOnly) {
        url = `${API_URL}/clubs/trending`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setClubs(response.data);
      
      // Extract unique categories
      const uniqueCategories = ['All', ...new Set(response.data.map(club => club.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      Alert.alert('Error', 'Failed to load clubs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterClubs = () => {
    let filtered = clubs;
    
    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(club => club.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(club => 
        club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredClubs(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchClubs();
  };

  const handleFollowClub = async (clubId) => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      
      // Check if already following
      const followResponse = await axios.get(`${API_URL}/clubs/${clubId}/is-following`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (followResponse.data.is_following) {
        // Unfollow
        await axios.delete(`${API_URL}/clubs/${clubId}/follow`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Success', 'Club unfollowed');
      } else {
        // Follow
        await axios.post(`${API_URL}/clubs/${clubId}/follow`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Success', 'Club followed');
      }
      
      // Refresh clubs to update follow status
      fetchClubs();
    } catch (error) {
      console.error('Error following club:', error);
      Alert.alert('Error', 'Failed to follow club');
    }
  };

  const renderClubItem = ({ item }) => (
    <TouchableOpacity
      style={styles.clubCard}
      onPress={() => navigation.navigate('ClubDetail', { clubId: item.id })}
    >
      <View style={styles.clubHeader}>
        {item.logo_url ? (
          <Image source={{ uri: item.logo_url }} style={styles.clubLogo} />
        ) : (
          <View style={styles.clubLogoPlaceholder}>
            <Ionicons name="business" size={24} color="#8b5cf6" />
          </View>
        )}
        <View style={styles.clubInfo}>
          <Text style={styles.clubName}>{item.name}</Text>
          <Text style={styles.clubCategory}>{item.category}</Text>
          <View style={styles.clubStats}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={14} color="#666" />
              <Text style={styles.statText}>{item.follower_count}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="calendar" size={14} color="#666" />
              <Text style={styles.statText}>{item.upcoming_events}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.followButton}
          onPress={() => handleFollowClub(item.id)}
        >
          <Ionicons name="add-circle" size={28} color="#8b5cf6" />
        </TouchableOpacity>
      </View>
      <Text style={styles.clubDescription} numberOfLines={2}>
        {item.description}
      </Text>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item && styles.selectedCategoryItem
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item && styles.selectedCategoryText
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clubs</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[
              styles.headerButton,
              showTrendingOnly && styles.activeHeaderButton
            ]}
            onPress={() => setShowTrendingOnly(!showTrendingOnly)}
          >
            <Ionicons
              name="trending-up"
              size={20}
              color={showTrendingOnly ? '#fff' : '#8b5cf6'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('UpcomingEvents')}
          >
            <Ionicons name="calendar" size={20} color="#8b5cf6" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search clubs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      <FlatList
        data={filteredClubs}
        renderItem={renderClubItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.clubsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business" size={50} color="#666" />
            <Text style={styles.emptyText}>No clubs found</Text>
          </View>
        }
      />
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  activeHeaderButton: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    height: 45,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  categoriesContainer: {
    marginBottom: 10,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  selectedCategoryItem: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  categoryText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  clubsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  clubCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  clubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  clubLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  clubLogoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  clubCategory: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  clubStats: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  followButton: {
    padding: 5,
  },
  clubDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
  },
});

export default ClubsScreen;