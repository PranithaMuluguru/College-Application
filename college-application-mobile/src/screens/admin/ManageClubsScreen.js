// src/screens/admin/ManageClubsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';

const ManageClubsScreen = ({ navigation }) => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const token = await AsyncStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/admin/clubs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setClubs(data);
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to fetch clubs');
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
      Alert.alert('Error', 'Failed to fetch clubs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchClubs();
  };

  const handleEditClub = (clubId) => {
    navigation.navigate('EditClub', { clubId });
  };

  const handleViewClub = (clubId) => {
    navigation.navigate('AdminClubDetail', { clubId });
  };

  const handleDeleteClub = (clubId, clubName) => {
    Alert.alert(
      'Delete Club',
      `Are you sure you want to delete "${clubName}"? This action can be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteClub(clubId)
        }
      ]
    );
  };

  const deleteClub = async (clubId) => {
    try {
      const token = await AsyncStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/admin/clubs/${clubId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setClubs(clubs.map(club => 
          club.id === clubId ? { ...club, is_active: false } : club
        ));
        Alert.alert('Success', 'Club deleted successfully');
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to delete club');
      }
    } catch (error) {
      console.error('Error deleting club:', error);
      Alert.alert('Error', 'Failed to delete club');
    }
  };

  const handleRestoreClub = async (clubId) => {
    try {
      const token = await AsyncStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/admin/clubs/${clubId}/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setClubs(clubs.map(club => 
          club.id === clubId ? { ...club, is_active: true } : club
        ));
        Alert.alert('Success', 'Club restored successfully');
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to restore club');
      }
    } catch (error) {
      console.error('Error restoring club:', error);
      Alert.alert('Error', 'Failed to restore club');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (isActive) => {
    return isActive ? '#34C759' : '#FF3B30';
  };

  const getStatusText = (isActive) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const renderClubItem = ({ item }) => (
    <View style={styles.clubCard}>
      <View style={styles.clubHeader}>
        <View style={styles.clubLogo}>
          <Text style={styles.clubLogoText}>
            {item.name.charAt(0)}
          </Text>
        </View>
        <View style={styles.clubInfo}>
          <Text style={styles.clubName}>{item.name}</Text>
          <Text style={styles.clubCategory}>{item.category}</Text>
          <View style={styles.clubMeta}>
            <Text style={styles.clubMetaText}>
              {formatDate(item.created_at)}
            </Text>
            <Text style={styles.clubMetaDivider}>•</Text>
            <Text style={styles.clubMetaText}>
              {item.follower_count} followers
            </Text>
          </View>
        </View>
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.is_active) }
          ]}>
            <Text style={styles.statusText}>
              {getStatusText(item.is_active)}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.clubDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.clubFooter}>
        <Text style={styles.clubHead}>
          Head: {item.club_head?.name || 'Not assigned'}
        </Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleViewClub(item.id)}
          >
            <Ionicons name="eye-outline" size={16} color="#8b5cf6" />
            <Text style={styles.viewButtonText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditClub(item.id)}
          >
            <Ionicons name="create-outline" size={16} color="#3b82f6" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          {item.is_active ? (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteClub(item.id, item.name)}
            >
              <Ionicons name="trash-outline" size={16} color="#FF3B30" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={() => handleRestoreClub(item.id)}
            >
              <Ionicons name="refresh-outline" size={16} color="#34C759" />
              <Text style={styles.restoreButtonText}>Restore</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Clubs</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateClub')}
        >
          <Ionicons name="add-circle-outline" size={24} color="#8b5cf6" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={clubs}
        renderItem={renderClubItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={60} color="#666" />
            <Text style={styles.emptyStateText}>No clubs found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff'
  },
  listContent: {
    padding: 16
  },
  clubCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  clubHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  clubLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  clubLogoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff'
  },
  clubInfo: {
    flex: 1
  },
  clubName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#fff'
  },
  clubCategory: {
    fontSize: 14,
    color: '#8b5cf6',
    marginBottom: 4
  },
  clubMeta: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  clubMetaText: {
    fontSize: 12,
    color: '#666'
  },
  clubMetaDivider: {
    marginHorizontal: 8,
    color: '#666'
  },
  statusContainer: {
    alignSelf: 'flex-start'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff'
  },
  clubDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 12
  },
  clubFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  clubHead: {
    fontSize: 12,
    color: '#666'
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#8b5cf6'
  },
  viewButtonText: {
    fontSize: 12,
    color: '#8b5cf6',
    marginLeft: 4
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3b82f6'
  },
  editButtonText: {
    fontSize: 12,
    color: '#3b82f6',
    marginLeft: 4
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF3B30'
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#FF3B30',
    marginLeft: 4
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#34C759'
  },
  restoreButtonText: {
    fontSize: 12,
    color: '#34C759',
    marginLeft: 4
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666'
  }
});

export default ManageClubsScreen;