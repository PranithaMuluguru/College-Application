// screens/ClubDetailScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Share,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_URL from '../../config';

const ClubDetailScreen = ({ route, navigation }) => {
  const { clubId } = route.params;
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const [user, setUser] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchClubDetails();
    fetchUser();
  }, [clubId]);

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

  const fetchClubDetails = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('user_token');
      
      // Fetch club details
      const clubResponse = await axios.get(`${API_URL}/clubs/${clubId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClub(clubResponse.data);
      
      // Check if user is following
      const followResponse = await axios.get(`${API_URL}/clubs/${clubId}/is-following`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsFollowing(followResponse.data.is_following);
      
      // Fetch club events
      const eventsResponse = await axios.get(`${API_URL}/clubs/${clubId}/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(eventsResponse.data);
      
      // Fetch club announcements
      const announcementsResponse = await axios.get(`${API_URL}/clubs/${clubId}/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(announcementsResponse.data);
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

  const handleFollowClub = async () => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      
      if (isFollowing) {
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
      
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error following club:', error);
      Alert.alert('Error', 'Failed to follow club');
    }
  };

  const handleRegisterForEvent = async (eventId) => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      
      await axios.post(`${API_URL}/clubs/events/${eventId}/register`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      Alert.alert('Success', 'Successfully registered for event');
      fetchClubDetails(); // Refresh to update registration count
    } catch (error) {
      console.error('Error registering for event:', error);
      Alert.alert('Error', 'Failed to register for event');
    }
  };

  const handleLikeEvent = async (eventId) => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      
      await axios.post(`${API_URL}/clubs/events/${eventId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchClubDetails(); // Refresh to update like count
    } catch (error) {
      console.error('Error liking event:', error);
      Alert.alert('Error', 'Failed to like event');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${club.name} on CampusConnect! ${club.description}`,
        title: club.name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderAboutTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.description}>{club.description}</Text>
      
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Club Head</Text>
        <View style={styles.clubHeadInfo}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color="#8b5cf6" />
          </View>
          <View style={styles.clubHeadDetails}>
            <Text style={styles.clubHeadName}>{club.club_head.name}</Text>
            <Text style={styles.clubHeadEmail}>{club.club_head.email}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#3b82f6" />
            <Text style={styles.statValue}>{club.follower_count}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color="#10b981" />
            <Text style={styles.statValue}>{club.upcoming_events.length}</Text>
            <Text style={styles.statLabel}>Upcoming Events</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderEventsTab = () => (
    <View style={styles.tabContent}>
      {events.length > 0 ? (
        events.map(event => (
          <TouchableOpacity
            key={event.id}
            style={styles.eventCard}
            onPress={() => {
              setSelectedEvent(event);
              setShowEventModal(true);
            }}
          >
            {event.image_url ? (
              <Image source={{ uri: event.image_url }} style={styles.eventImage} />
            ) : (
              <View style={styles.eventImagePlaceholder}>
                <Ionicons name="calendar" size={30} color="#8b5cf6" />
              </View>
            )}
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDate}>{formatDate(event.event_date)}</Text>
              <Text style={styles.eventLocation}>{event.location}</Text>
              <View style={styles.eventStats}>
                <View style={styles.eventStat}>
                  <Ionicons name="people" size={14} color="#666" />
                  <Text style={styles.eventStatText}>
                    {event.registration_count}/{event.max_participants || '∞'}
                  </Text>
                </View>
                <View style={styles.eventStat}>
                  <Ionicons name="heart" size={14} color="#666" />
                  <Text style={styles.eventStatText}>{event.like_count}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.eventLikeButton}
              onPress={() => handleLikeEvent(event.id)}
            >
              <Ionicons name="heart" size={20} color="#ef4444" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar" size={50} color="#666" />
          <Text style={styles.emptyText}>No upcoming events</Text>
        </View>
      )}
    </View>
  );

  const renderAnnouncementsTab = () => (
    <View style={styles.tabContent}>
      {announcements.length > 0 ? (
        announcements.map(announcement => (
          <View key={announcement.id} style={styles.announcementCard}>
            <View style={[
              styles.announcementPriority,
              announcement.priority === 'high' && styles.highPriority,
              announcement.priority === 'normal' && styles.normalPriority,
              announcement.priority === 'low' && styles.lowPriority
            ]} />
            <View style={styles.announcementContent}>
              <Text style={styles.announcementTitle}>{announcement.title}</Text>
              <Text style={styles.announcementText}>{announcement.content}</Text>
              <Text style={styles.announcementDate}>
                {formatDate(announcement.created_at)}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="megaphone" size={50} color="#666" />
          <Text style={styles.emptyText}>No announcements</Text>
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
      {/* Header with cover and logo */}
      <View style={styles.header}>
        {club.cover_url ? (
          <Image source={{ uri: club.cover_url }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverPlaceholder} />
        )}
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.clubLogoContainer}>
            {club.logo_url ? (
              <Image source={{ uri: club.logo_url }} style={styles.clubLogo} />
            ) : (
              <View style={styles.clubLogoPlaceholder}>
                <Ionicons name="business" size={40} color="#8b5cf6" />
              </View>
            )}
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing && styles.followingButton
              ]}
              onPress={handleFollowClub}
            >
              <Text style={[
                styles.followButtonText,
                isFollowing && styles.followingButtonText
              ]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Club info */}
      <View style={styles.clubInfoContainer}>
        <Text style={styles.clubName}>{club.name}</Text>
        <Text style={styles.clubCategory}>{club.category}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'about' && styles.activeTab
          ]}
          onPress={() => setActiveTab('about')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'about' && styles.activeTabText
          ]}>
            About
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
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'announcements' && styles.activeTab
          ]}
          onPress={() => setActiveTab('announcements')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'announcements' && styles.activeTabText
          ]}>
            Announcements
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'about' && renderAboutTab()}
        {activeTab === 'events' && renderEventsTab()}
        {activeTab === 'announcements' && renderAnnouncementsTab()}
      </ScrollView>

      {/* Event Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showEventModal}
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Event Details</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowEventModal(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {selectedEvent && (
              <ScrollView style={styles.modalBody}>
                {selectedEvent.image_url ? (
                  <Image source={{ uri: selectedEvent.image_url }} style={styles.modalImage} />
                ) : (
                  <View style={styles.modalImagePlaceholder}>
                    <Ionicons name="calendar" size={50} color="#8b5cf6" />
                  </View>
                )}
                
                <Text style={styles.modalEventTitle}>{selectedEvent.title}</Text>
                <Text style={styles.modalEventDescription}>{selectedEvent.description}</Text>
                
                <View style={styles.modalEventInfo}>
                  <View style={styles.modalInfoItem}>
                    <Ionicons name="calendar" size={20} color="#8b5cf6" />
                    <Text style={styles.modalInfoText}>
                      {formatDate(selectedEvent.event_date)}
                    </Text>
                  </View>
                  <View style={styles.modalInfoItem}>
                    <Ionicons name="location" size={20} color="#8b5cf6" />
                    <Text style={styles.modalInfoText}>{selectedEvent.location}</Text>
                  </View>
                  <View style={styles.modalInfoItem}>
                    <Ionicons name="people" size={20} color="#8b5cf6" />
                    <Text style={styles.modalInfoText}>
                      {selectedEvent.registration_count}/{selectedEvent.max_participants || '∞'} registered
                    </Text>
                  </View>
                </View>
                
                {selectedEvent.registration_required && (
                  <TouchableOpacity
                    style={styles.registerButton}
                    onPress={() => {
                      handleRegisterForEvent(selectedEvent.id);
                      setShowEventModal(false);
                    }}
                  >
                    <Text style={styles.registerButtonText}>Register for Event</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  header: {
    position: 'relative',
    height: 200,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  headerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clubLogoContainer: {
    marginBottom: 20,
  },
  clubLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#0a0a0a',
  },
  clubLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0a0a0a',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
  },
  followingButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#8b5cf6',
  },
  clubInfoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1a1a1a',
  },
  clubName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 5,
  },
  clubCategory: {
    fontSize: 14,
    color: '#8b5cf6',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#8b5cf6',
  },
  tabText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    marginBottom: 20,
  },
  infoSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  clubHeadInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  clubHeadDetails: {
    flex: 1,
  },
  clubHeadName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  clubHeadEmail: {
    fontSize: 14,
    color: '#888',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  eventImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  eventImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  eventDate: {
    fontSize: 14,
    color: '#8b5cf6',
    marginBottom: 5,
  },
  eventLocation: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  eventStats: {
    flexDirection: 'row',
  },
  eventStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  eventStatText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  eventLikeButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  announcementCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  announcementPriority: {
    width: 4,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    marginRight: 15,
  },
  highPriority: {
    backgroundColor: '#ef4444',
  },
  normalPriority: {
    backgroundColor: '#f59e0b',
  },
  lowPriority: {
    backgroundColor: '#10b981',
  },
  announcementContent: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  announcementText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 5,
  },
  announcementDate: {
    fontSize: 12,
    color: '#666',
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    overflow: 'hidden',
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
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  modalImagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalEventTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  modalEventDescription: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    marginBottom: 20,
  },
  modalEventInfo: {
    marginBottom: 20,
  },
  modalInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalInfoText: {
    fontSize: 16,
    color: '#ccc',
    marginLeft: 10,
  },
  registerButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ClubDetailScreen;