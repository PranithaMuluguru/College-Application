// src/screens/clubs/ClubDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';

const { width } = Dimensions.get('window');

const ClubDetailScreen = ({ route, navigation }) => {
  const { clubId } = route.params;
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    fetchClubDetails();
  }, [clubId]);

  const fetchClubDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/clubs/${clubId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setClub(data);
        setIsFollowing(data.is_following);
      }
    } catch (error) {
      console.error('Error fetching club:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/clubs/${clubId}/${isFollowing ? 'unfollow' : 'follow'}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        setIsFollowing(!isFollowing);
        fetchClubDetails();
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchClubDetails();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  if (!club) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color="#666" />
        <Text style={styles.errorText}>Club not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with Cover */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#8b5cf6', '#6366f1']}
            style={styles.coverGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {club.cover_url && (
              <Image source={{ uri: club.cover_url }} style={styles.coverImage} />
            )}
          </LinearGradient>

          <TouchableOpacity
  style={styles.backButton}
  onPress={() => {
    console.log('BACK PRESSED');
    try {
      navigation.pop();
    } catch (e) {
      console.log('Pop failed, trying goBack');
      navigation.goBack();
    }
  }}
>
  <Ionicons name="arrow-back" size={24} color="#fff" />
</TouchableOpacity>
        </View>

        {/* Club Info Card */}
        <View style={styles.clubInfoCard}>
          {club.logo_url ? (
            <Image source={{ uri: club.logo_url }} style={styles.clubLogo} />
          ) : (
            <View style={styles.clubLogoPlaceholder}>
              <Text style={styles.clubLogoText}>{club.name.charAt(0)}</Text>
            </View>
          )}

          <View style={styles.clubHeader}>
            <View style={styles.clubTitleSection}>
              <Text style={styles.clubName}>{club.name}</Text>
              <Text style={styles.clubCategory}>{club.category}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing && styles.followingButton
              ]}
              onPress={handleFollow}
              disabled={followLoading}
              activeOpacity={0.8}
            >
              {followLoading ? (
                <ActivityIndicator 
                  size="small" 
                  color={isFollowing ? '#8b5cf6' : '#fff'} 
                />
              ) : (
                <>
                  <Ionicons 
                    name={isFollowing ? "checkmark" : "add"} 
                    size={20} 
                    color={isFollowing ? '#8b5cf6' : '#fff'} 
                  />
                  <Text style={[
                    styles.followButtonText,
                    isFollowing && styles.followingButtonText
                  ]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{club.follower_count}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{club.events?.length || 0}</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {club.announcements?.length || 0}
              </Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{club.description}</Text>
          </View>

          {/* Club Head */}
          {club.club_head && (
            <View style={styles.clubHeadSection}>
              <Text style={styles.sectionTitle}>Club Head</Text>
              <View style={styles.clubHeadCard}>
                <View style={styles.clubHeadAvatar}>
                  <Text style={styles.clubHeadAvatarText}>
                    {club.club_head.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.clubHeadInfo}>
                  <Text style={styles.clubHeadName}>
                    {club.club_head.name}
                  </Text>
                  <Text style={styles.clubHeadEmail}>
                    {club.club_head.email}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Events Section */}
        {club.events && club.events.length > 0 && (
          <View style={styles.eventsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {club.events.slice(0, 3).map((event, index) => (
              <TouchableOpacity
                key={event.id || index}
                style={styles.eventCard}
                onPress={() => 
                  navigation.navigate('EventDetail', { eventId: event.id })
                }
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#2a2a2a', '#1a1a1a']}
                  style={styles.eventGradient}
                >
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventTitle} numberOfLines={1}>
                      {event.title}
                    </Text>
                    <View
                      style={[
                        styles.eventStatusBadge,
                        {
                          backgroundColor:
                            event.status === 'scheduled'
                              ? '#34C759'
                              : event.status === 'ongoing'
                              ? '#FF9500'
                              : '#007AFF'
                        }
                      ]}
                    >
                      <Text style={styles.eventStatusText}>
                        {event.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.eventDescription} numberOfLines={2}>
                    {event.description}
                  </Text>

                  <View style={styles.eventMeta}>
                    <View style={styles.eventMetaItem}>
                      <Ionicons 
                        name="calendar-outline" 
                        size={16} 
                        color="#8b5cf6" 
                      />
                      <Text style={styles.eventMetaText}>
                        {new Date(event.event_date).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.eventMetaItem}>
                      <Ionicons 
                        name="location-outline" 
                        size={16} 
                        color="#8b5cf6" 
                      />
                      <Text style={styles.eventMetaText}>
                        {event.location}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Announcements */}
        {club.announcements && club.announcements.length > 0 && (
          <View style={styles.announcementsSection}>
            <Text style={styles.sectionTitle}>Latest Announcements</Text>

            {club.announcements.slice(0, 3).map((announcement, index) => (
              <View key={announcement.id || index} style={styles.announcementCard}>
                <View style={styles.announcementHeader}>
                  <Text style={styles.announcementTitle}>
                    {announcement.title}
                  </Text>
                  <View
                    style={[
                      styles.priorityBadge,
                      {
                        backgroundColor:
                          announcement.priority === 'high'
                            ? '#FF3B30'
                            : announcement.priority === 'normal'
                            ? '#FF9500'
                            : '#8b5cf6'
                      }
                    ]}
                  >
                    <Text style={styles.priorityText}>
                      {announcement.priority}
                    </Text>
                  </View>
                </View>
                <Text style={styles.announcementContent}>
                  {announcement.content}
                </Text>
                <Text style={styles.announcementDate}>
                  {new Date(announcement.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a'
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#fff'
  },
  headerContainer: {
    height: 200,
    width: '100%',
    position: 'relative'
  },
  coverGradient: {
    height: 200,
    width: '100%'
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 5
  },
  clubInfoCard: {
    marginTop: -40,
    marginHorizontal: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  clubLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: 'center',
    marginTop: -60,
    borderWidth: 4,
    borderColor: '#1a1a1a'
  },
  clubLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: -60,
    borderWidth: 4,
    borderColor: '#1a1a1a'
  },
  clubLogoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff'
  },
  clubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20
  },
  clubTitleSection: {
    flex: 1
  },
  clubName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  clubCategory: {
    fontSize: 14,
    color: '#8b5cf6',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    gap: 6
  },
  followingButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#8b5cf6'
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff'
  },
  followingButtonText: {
    color: '#8b5cf6'
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2a2a2a'
  },
  statItem: {
    alignItems: 'center'
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#666'
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2a2a2a'
  },
  descriptionSection: {
    marginTop: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12
  },
  description: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 22
  },
  clubHeadSection: {
    marginTop: 24
  },
  clubHeadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 12
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
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4
  },
  clubHeadEmail: {
    fontSize: 14,
    color: '#8b5cf6'
  },
  eventsSection: {
    marginTop: 24,
    paddingHorizontal: 20
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  seeAllText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600'
  },
  eventCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden'
  },
  eventGradient: {
    padding: 16
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
    flex: 1
  },
  eventStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  eventStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase'
  },
  eventDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 12,
    lineHeight: 20
  },
  eventMeta: {
    flexDirection: 'row',
    gap: 16
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  eventMetaText: {
    fontSize: 12,
    color: '#888'
  },
  announcementsSection: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40
  },
  announcementCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase'
  },
  announcementContent: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 8
  },
  announcementDate: {
    fontSize: 12,
    color: '#666'
  }
});

export default ClubDetailScreen;