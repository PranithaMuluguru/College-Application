import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';

const ClubDetailScreen = ({ route, navigation }) => {
  const { clubId } = route.params;
  const [club, setClub] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('events');
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    fetchClubDetails();
  }, []);

  const fetchClubDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/clubs/${clubId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setClub(data);
      setIsFollowing(data.is_following);
    } catch (error) {
      console.error('Error fetching club details:', error);
      Alert.alert('Error', 'Failed to load club details');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    setFollowing(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      
      const response = await fetch(`${API_URL}/clubs/${clubId}/${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        fetchClubDetails(); // Refresh to get updated follower count
      }
    } catch (error) {
      console.error('Error following club:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setFollowing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (!club) return null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: club.cover_url || 'https://via.placeholder.com/400' }}
          style={styles.coverImage}
        />
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: club.logo_url || 'https://via.placeholder.com/100' }}
              style={styles.logo}
            />
          </View>

          <Text style={styles.clubName}>{club.name}</Text>
          <Text style={styles.clubDescription}>{club.description}</Text>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Icon name="account-group" size={20} color="#6B7280" />
              <Text style={styles.statText}>
                {club.follower_count} followers
              </Text>
            </View>

            {club.club_head && (
              <View style={styles.stat}>
                <Icon name="email" size={20} color="#6B7280" />
                <Text style={styles.statText}>{club.club_head.email}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.followButtonLarge,
              isFollowing && styles.followingButtonLarge,
            ]}
            onPress={handleFollow}
            disabled={following}
          >
            <Icon
              name={isFollowing ? 'account-check' : 'account-plus'}
              size={20}
              color={isFollowing ? '#7C3AED' : '#FFF'}
            />
            <Text
              style={[
                styles.followButtonLargeText,
                isFollowing && styles.followingButtonLargeText,
              ]}
            >
              {following ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'events' && styles.activeTab]}
          onPress={() => setActiveTab('events')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'events' && styles.activeTabText,
            ]}
          >
            Events & Announcements
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'about' && styles.activeTab]}
          onPress={() => setActiveTab('about')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'about' && styles.activeTabText,
            ]}
          >
            About
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'events' ? (
        <View style={styles.content}>
          <View style={styles.contentHeader}>
            <Text style={styles.contentTitle}>Events & Announcements</Text>
            <TouchableOpacity
              style={styles.newPostButton}
              onPress={() =>
                navigation.navigate('CreateEvent', { clubId: club.id })
              }
            >
              <Icon name="plus" size={20} color="#FFF" />
              <Text style={styles.newPostButtonText}>New Post</Text>
            </TouchableOpacity>
          </View>

          {club.events && club.events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}

          {club.announcements && club.announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
            />
          ))}

          {(!club.events || club.events.length === 0) &&
           (!club.announcements || club.announcements.length === 0) && (
            <Text style={styles.emptyText}>No events or announcements yet</Text>
          )}
        </View>
      ) : (
        <View style={styles.content}>
          <AboutSection club={club} />
        </View>
      )}
    </ScrollView>
  );
};

const EventCard = ({ event }) => (
  <View style={styles.eventCard}>
    <View style={styles.eventBadge}>
      <Text style={styles.eventBadgeText}>Important</Text>
    </View>

    <View style={styles.eventLikes}>
      <Icon name="heart-outline" size={20} color="#6B7280" />
      <Text style={styles.eventLikesText}>{event.like_count || 0}</Text>
    </View>

    <Text style={styles.eventTitle}>{event.title}</Text>
    <Text style={styles.eventDescription} numberOfLines={3}>
      {event.description}
    </Text>

    <View style={styles.eventDate}>
      <Icon name="calendar" size={16} color="#6B7280" />
      <Text style={styles.eventDateText}>
        {new Date(event.event_date).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })}
      </Text>
    </View>
  </View>
);

const AnnouncementCard = ({ announcement }) => (
  <View style={styles.announcementCard}>
    <Text style={styles.announcementTitle}>{announcement.title}</Text>
    <Text style={styles.announcementContent} numberOfLines={4}>
      {announcement.content}
    </Text>
    <Text style={styles.announcementDate}>
      {new Date(announcement.created_at).toLocaleDateString()}
    </Text>
  </View>
);

const AboutSection = ({ club }) => (
  <View style={styles.aboutSection}>
    {club.club_head && (
      <View style={styles.aboutCard}>
        <Text style={styles.aboutCardTitle}>Club Admin</Text>
        <Text style={styles.aboutCardText}>{club.club_head.name}</Text>
        <Text style={styles.aboutCardSubtext}>{club.club_head.email}</Text>
      </View>
    )}

    <View style={styles.aboutCard}>
      <Text style={styles.aboutCardTitle}>Category</Text>
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryBadgeText}>{club.category}</Text>
      </View>
    </View>

    <View style={styles.aboutCard}>
      <Text style={styles.aboutCardTitle}>Community</Text>
      <Text style={styles.aboutCardText}>
        {club.follower_count} active members
      </Text>
    </View>
  </View>
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
    backgroundColor: '#EF4444',
    paddingBottom: 120,
  },
  coverImage: {
    width: '100%',
    height: 200,
    position: 'absolute',
    top: 0,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 220,
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  clubName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  clubDescription: {
    fontSize: 14,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  stats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 20,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#FFF',
  },
  followButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  followingButtonLarge: {
    backgroundColor: '#FFF',
  },
  followButtonLargeText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  followingButtonLargeText: {
    color: '#7C3AED',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#7C3AED',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#7C3AED',
  },
  content: {
    padding: 20,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  contentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  newPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  newPostButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  eventCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  eventBadge: {
    backgroundColor: '#7C3AED',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  eventBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  eventLikes: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventLikesText: {
    fontSize: 14,
    color: '#6B7280',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  eventDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventDateText: {
    fontSize: 14,
    color: '#6B7280',
  },
  announcementCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  announcementContent: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  announcementDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 40,
  },
  aboutSection: {
    gap: 16,
  },
  aboutCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  aboutCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  aboutCardText: {
    fontSize: 14,
    color: '#6B7280',
  },
  aboutCardSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  categoryBadge: {
    backgroundColor: '#7C3AED',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default ClubDetailScreen;