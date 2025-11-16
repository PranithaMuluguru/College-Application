// src/screens/admin/AdminClubDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';

const AdminClubDetailScreen = ({ route, navigation }) => {
  const { clubId } = route.params;
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    fetchClubDetails();
  }, [clubId]);

  const fetchClubDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/admin/clubs/${clubId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setClub(data);
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to load club details');
      }
    } catch (error) {
      console.error('Error fetching club details:', error);
      Alert.alert('Error', 'Failed to load club details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchClubDetails();
  };

  const handleEditClub = () => {
    navigation.navigate('EditClub', { clubId });
  };

  const handleUpdateClubHead = () => {
    navigation.navigate('UpdateClubHead', { clubId, currentHead: club.club_head });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderInfoTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Club Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name</Text>
          <Text style={styles.infoValue}>{club.name}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Category</Text>
          <Text style={styles.infoValue}>{club.category}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: club.is_active ? '#34C759' : '#FF3B30' }
          ]}>
            <Text style={styles.statusText}>
              {club.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Created</Text>
          <Text style={styles.infoValue}>{formatDate(club.created_at)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Last Updated</Text>
          <Text style={styles.infoValue}>{formatDate(club.updated_at)}</Text>
        </View>
      </View>
      
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Club Head</Text>
        
        {club.club_head ? (
          <View style={styles.clubHeadCard}>
            <View style={styles.clubHeadAvatar}>
              <Text style={styles.clubHeadAvatarText}>
                {club.club_head.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.clubHeadInfo}>
              <Text style={styles.clubHeadName}>{club.club_head.name}</Text>
              <Text style={styles.clubHeadEmail}>{club.club_head.email}</Text>
              <Text style={styles.clubHeadDetails}>
                {club.club_head.department} • Year {club.club_head.year}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.updateHeadButton}
              onPress={handleUpdateClubHead}
            >
              <Ionicons name="create-outline" size={18} color="#8b5cf6" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noClubHead}>
            <Text style={styles.noClubHeadText}>No club head assigned</Text>
            <TouchableOpacity
              style={styles.assignHeadButton}
              onPress={handleUpdateClubHead}
            >
              <Text style={styles.assignHeadButtonText}>Assign Club Head</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{club.description}</Text>
      </View>
    </View>
  );

  const renderFollowersTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Followers ({club.followers.length})</Text>
      
      {club.followers.length > 0 ? (
        club.followers.map((follower, index) => (
          <View key={index} style={styles.followerCard}>
            <View style={styles.followerAvatar}>
              <Text style={styles.followerAvatarText}>
                {follower.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.followerInfo}>
              <Text style={styles.followerName}>{follower.name}</Text>
              <Text style={styles.followerEmail}>{follower.email}</Text>
              <Text style={styles.followerDetails}>
                {follower.department} • Year {follower.year}
              </Text>
              <Text style={styles.followerJoined}>
                Joined {formatDate(follower.joined_at)}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={50} color="#666" />
          <Text style={styles.emptyStateText}>No followers yet</Text>
        </View>
      )}
    </View>
  );

  const renderEventsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Events ({club.events.length})</Text>
      
      {club.events.length > 0 ? (
        club.events.map((event, index) => (
          <View key={index} style={styles.eventCard}>
            <View style={styles.eventHeader}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <View style={[
                styles.eventStatusBadge,
                { backgroundColor: 
                  event.status === 'scheduled' ? '#34C759' :
                  event.status === 'ongoing' ? '#FF9500' :
                  event.status === 'completed' ? '#007AFF' : '#FF3B30'
                }
              ]}>
                <Text style={styles.eventStatusText}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </Text>
              </View>
            </View>
            
            <Text style={styles.eventDate}>
              {formatDateTime(event.event_date)}
            </Text>
            <Text style={styles.eventLocation}>{event.location}</Text>
            
            <View style={styles.eventStats}>
              <View style={styles.eventStat}>
                <Ionicons name="people" size={14} color="#666" />
                <Text style={styles.eventStatText}>
                  {event.registration_count}/{event.max_participants || '∞'} registered
                </Text>
              </View>
              <View style={styles.eventStat}>
                <Ionicons name="heart" size={14} color="#666" />
                <Text style={styles.eventStatText}>{event.like_count} likes</Text>
              </View>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={50} color="#666" />
          <Text style={styles.emptyStateText}>No events yet</Text>
        </View>
      )}
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
        <Text style={styles.headerTitle}>Club Details</Text>
        <TouchableOpacity onPress={handleEditClub}>
          <Ionicons name="create-outline" size={24} color="#8b5cf6" />
        </TouchableOpacity>
      </View>

      {club && (
        <>
          <View style={styles.clubHeader}>
            {club.logo_url ? (
              <Image source={{ uri: club.logo_url }} style={styles.clubLogo} />
            ) : (
              <View style={styles.clubLogoPlaceholder}>
                <Text style={styles.clubLogoText}>{club.name.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.clubInfo}>
              <Text style={styles.clubName}>{club.name}</Text>
              <Text style={styles.clubCategory}>{club.category}</Text>
            </View>
          </View>

          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'info' && styles.activeTab
              ]}
              onPress={() => setActiveTab('info')}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'info' && styles.activeTabText
              ]}>
                Info
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'followers' && styles.activeTab
              ]}
              onPress={() => setActiveTab('followers')}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'followers' && styles.activeTabText
              ]}>
                Followers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'events' && styles.activeTab
              ]}
              onPress={() => setActiveTab('events')}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'events' && styles.activeTabText
              ]}>
                Events
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {activeTab === 'info' && renderInfoTab()}
            {activeTab === 'followers' && renderFollowersTab()}
            {activeTab === 'events' && renderEventsTab()}
          </ScrollView>
        </>
      )}
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
  clubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a'
  },
  clubLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16
  },
  clubLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  clubLogoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  clubInfo: {
    flex: 1
  },
  clubName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  clubCategory: {
    fontSize: 14,
    color: '#8b5cf6'
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a'
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center'
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#8b5cf6'
  },
  tabText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500'
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600'
  },
  content: {
    flex: 1
  },
  tabContent: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16
  },
  infoSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  infoLabel: {
    fontSize: 16,
    color: '#888'
  },
  infoValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff'
  },
  clubHeadCard: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  clubHeadAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  clubHeadAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff'
  },
  clubHeadInfo: {
    flex: 1
  },
  clubHeadName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2
  },
  clubHeadEmail: {
    fontSize: 14,
    color: '#8b5cf6',
    marginBottom: 2
  },
  clubHeadDetails: {
    fontSize: 12,
    color: '#666'
  },
  updateHeadButton: {
    padding: 8
  },
  noClubHead: {
    alignItems: 'center',
    paddingVertical: 20
  },
  noClubHeadText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 16
  },
  assignHeadButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#8b5cf6',
    borderRadius: 8
  },
  assignHeadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff'
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24
  },
  followerCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  followerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  followerAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  },
  followerInfo: {
    flex: 1
  },
  followerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2
  },
  followerEmail: {
    fontSize: 14,
    color: '#8b5cf6',
    marginBottom: 2
  },
  followerDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2
  },
  followerJoined: {
    fontSize: 12,
    color: '#666'
  },
  eventCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 8
  },
  eventStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  eventStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff'
  },
  eventDate: {
    fontSize: 14,
    color: '#8b5cf6',
    marginBottom: 4
  },
  eventLocation: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8
  },
  eventStats: {
    flexDirection: 'row',
    gap: 16
  },
  eventStat: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  eventStatText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666'
  }
});

export default AdminClubDetailScreen;