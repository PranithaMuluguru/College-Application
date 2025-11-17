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

const MyClubsScreen = ({ navigation }) => {
  const [followedClubs, setFollowedClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowedClubs();
  }, []);

  const fetchFollowedClubs = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/clubs/user/following`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setFollowedClubs(data);
    } catch (error) {
      console.error('Error fetching followed clubs:', error);
      Alert.alert('Error', 'Failed to load your clubs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Clubs</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AllClubs')}
        >
          <Icon name="plus" size={24} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={followedClubs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ClubCard club={item} navigation={navigation} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="account-group-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No clubs yet</Text>
            <Text style={styles.emptyText}>
              Follow clubs to see their updates here
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('AllClubs')}
            >
              <Text style={styles.browseButtonText}>Browse Clubs</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const ClubCard = ({ club, navigation }) => (
  <TouchableOpacity
    style={styles.clubCard}
    onPress={() => navigation.navigate('ClubDetail', { clubId: club.id })}
  >
    <View style={styles.clubLogo}>
      <Text style={styles.clubLogoText}>{club.name.charAt(0)}</Text>
    </View>

    <View style={styles.clubInfo}>
      <Text style={styles.clubName}>{club.name}</Text>
      <View style={styles.clubMeta}>
        <View style={styles.clubCategory}>
          <Text style={styles.clubCategoryText}>{club.category}</Text>
        </View>
      </View>
    </View>

    <Icon name="chevron-right" size={24} color="#D1D5DB" />
  </TouchableOpacity>
);

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  listContent: {
    padding: 20,
    gap: 12,
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  clubLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubLogoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  clubMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clubCategory: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clubCategoryText: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default MyClubsScreen;