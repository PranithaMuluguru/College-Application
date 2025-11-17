import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';

const ClubsHomeScreen = ({ navigation }) => {
  const [featuredAnnouncements, setFeaturedAnnouncements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Fetch categories
      const catsResponse = await fetch(`${API_URL}/clubs/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const catsData = await catsResponse.json();
      setCategories(catsData);

      // Fetch all clubs for featured announcements simulation
      const clubsResponse = await fetch(`${API_URL}/clubs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const clubsData = await clubsResponse.json();
      
      // Simulate featured announcements from clubs
      const featured = clubsData.slice(0, 3).map((club, index) => ({
        id: club.id,
        club_id: club.id,
        club_name: club.name,
        title: `${club.name} Event`,
        description: club.description,
        date: new Date().toLocaleDateString(),
        likes: club.follower_count || 0
      }));
      setFeaturedAnnouncements(featured);

    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load clubs data');
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" />
      
      {/* Hero Section */}
      <LinearGradient
        colors={['#E9D5FF', '#DDD6FE', '#C4B5FD']}
        style={styles.heroSection}
      >
        <View style={styles.badge}>
          <Icon name="star-four-points" size={16} color="#7C3AED" />
          <Text style={styles.badgeText}>Your Campus, Your Community</Text>
        </View>

        <Text style={styles.heroTitle}>College Connect</Text>
        
        <Text style={styles.heroSubtitle}>
          Everything you need for campus life - from academics to bus schedules,
          mess menus to club activities
        </Text>

        <View style={styles.heroButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('AllClubs')}
          >
            <Icon name="account-group" size={20} color="#FFF" />
            <Text style={styles.primaryButtonText}>Explore Clubs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Schedule')}
          >
            <Icon name="calendar" size={20} color="#1F2937" />
            <Text style={styles.secondaryButtonText}>View Schedule</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Feature Cards */}
      <View style={styles.featuresSection}>
        <FeatureCard
          icon="account-group"
          iconBg="#F97316"
          title="Student Clubs"
          description="Join sports, cultural, and technical clubs. Connect with like-minded peers and grow together."
          linkText="Explore clubs"
          onPress={() => navigation.navigate('AllClubs')}
        />

        <FeatureCard
          icon="calendar-check"
          iconBg="#8B5CF6"
          title="Campus Life"
          description="Access bus timings, mess menus, and academic schedules all in one place."
          linkText="View more"
          onPress={() => {}}
        />

        <FeatureCard
          icon="chart-line"
          iconBg="#3B82F6"
          title="Stay Updated"
          description="Never miss important announcements, events, or opportunities from your favorite clubs."
          linkText="See updates"
          onPress={() => navigation.navigate('MyClubs')}
        />
      </View>

      {/* Featured Announcements */}
      {featuredAnnouncements.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="bullhorn" size={24} color="#1F2937" />
            <Text style={styles.sectionTitle}>Featured Announcements</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {featuredAnnouncements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onPress={() =>
                  navigation.navigate('ClubDetail', {
                    clubId: announcement.club_id,
                  })
                }
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Explore Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Explore Categories</Text>

        <View style={styles.categoriesGrid}>
          <CategoryCard
            emoji="⚽"
            title="Sports"
            description="Athletics, fitness, and competitive sports clubs"
            color="#EF4444"
            secretary="Sports Secretary"
            onPress={() =>
              navigation.navigate('CategoryClubs', { category: 'Sports' })
            }
          />

          <CategoryCard
            emoji="🎭"
            title="Cultural"
            description="Arts, music, dance, and cultural activities"
            color="#A855F7"
            secretary="Cultural Secretary"
            onPress={() =>
              navigation.navigate('CategoryClubs', { category: 'Cultural' })
            }
          />

          <CategoryCard
            emoji="💻"
            title="Technical"
            description="Technology, innovation, and finance clubs"
            color="#3B82F6"
            secretary="Technical Secretary"
            onPress={() =>
              navigation.navigate('CategoryClubs', { category: 'Technical' })
            }
          />
        </View>
      </View>
    </ScrollView>
  );
};

const FeatureCard = ({ icon, iconBg, title, description, linkText, onPress }) => (
  <View style={styles.featureCard}>
    <View style={[styles.featureIcon, { backgroundColor: iconBg }]}>
      <Icon name={icon} size={28} color="#FFF" />
    </View>

    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={styles.featureDescription}>{description}</Text>

    <TouchableOpacity onPress={onPress}>
      <Text style={styles.featureLink}>
        {linkText} <Icon name="arrow-right" size={16} />
      </Text>
    </TouchableOpacity>
  </View>
);

const AnnouncementCard = ({ announcement, onPress }) => (
  <TouchableOpacity style={styles.announcementCard} onPress={onPress}>
    <View style={styles.announcementBadge}>
      <Text style={styles.announcementBadgeText}>Important</Text>
    </View>

    <View style={styles.announcementLikes}>
      <Icon name="heart-outline" size={20} color="#6B7280" />
      <Text style={styles.announcementLikesText}>{announcement.likes}</Text>
    </View>

    <Text style={styles.announcementTitle}>{announcement.title}</Text>
    <Text style={styles.announcementClub}>{announcement.club_name}</Text>
    <Text style={styles.announcementDescription} numberOfLines={3}>
      {announcement.description}
    </Text>

    <View style={styles.announcementDate}>
      <Icon name="calendar" size={16} color="#6B7280" />
      <Text style={styles.announcementDateText}>{announcement.date}</Text>
    </View>
  </TouchableOpacity>
);

const CategoryCard = ({ emoji, title, description, color, secretary, onPress }) => (
  <TouchableOpacity
    style={[styles.categoryCard, { backgroundColor: color }]}
    onPress={onPress}
  >
    <Text style={styles.categoryEmoji}>{emoji}</Text>
    <Text style={styles.categoryTitle}>{title}</Text>
    <Text style={styles.categoryDescription}>{description}</Text>

    <View style={styles.categoryFooter}>
      <Text style={styles.categorySecretary}>{secretary}</Text>
      <Icon name="arrow-right" size={24} color="#FFF" />
    </View>
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
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  badgeText: {
    marginLeft: 8,
    color: '#7C3AED',
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#7C3AED',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  heroButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#1F2937',
    fontWeight: '600',
    fontSize: 16,
  },
  featuresSection: {
    padding: 20,
    gap: 20,
  },
  featureCard: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  featureLink: {
    color: '#7C3AED',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  announcementCard: {
    backgroundColor: '#FFF',
    width: 300,
    padding: 20,
    borderRadius: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  announcementBadge: {
    backgroundColor: '#7C3AED',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  announcementBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  announcementLikes: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  announcementLikesText: {
    fontSize: 14,
    color: '#6B7280',
  },
  announcementTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  announcementClub: {
    fontSize: 14,
    color: '#7C3AED',
    marginBottom: 12,
  },
  announcementDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  announcementDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  announcementDateText: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoriesGrid: {
    gap: 16,
    marginTop: 16,
  },
  categoryCard: {
    padding: 24,
    borderRadius: 16,
    minHeight: 200,
  },
  categoryEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
    lineHeight: 20,
    marginBottom: 24,
  },
  categoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  categorySecretary: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
});

export default ClubsHomeScreen;