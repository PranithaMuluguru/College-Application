// src/screens/ClubHeadDashboardScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';

const ClubHeadDashboardScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [club, setClub] = useState(null);
  const [stats, setStats] = useState({
    followers: 0,
    upcomingEvents: 0,
    announcements: 0,
    totalRegistrations: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Fetch club where user is head
      const response = await fetch(`${API_URL}/clubs/my-club`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setClub(data);
        
        // Fetch stats
        const statsResponse = await fetch(
          `${API_URL}/clubs/${data.id}/stats`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!club) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="business-outline" size={60} color="#ccc" />
        <Text style={styles.errorText}>You don't manage any club</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Club Dashboard</Text>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Club Info Card */}
        <View style={styles.clubCard}>
          <Text style={styles.clubName}>{club.name}</Text>
          <Text style={styles.clubCategory}>{club.category}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={32} color="#007AFF" />
            <Text style={styles.statNumber}>{stats.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={32} color="#34C759" />
            <Text style={styles.statNumber}>{stats.upcomingEvents}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="megaphone" size={32} color="#FF9500" />
            <Text style={styles.statNumber}>{stats.announcements}</Text>
            <Text style={styles.statLabel}>Updates</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={32} color="#FF3B30" />
            <Text style={styles.statNumber}>{stats.totalRegistrations}</Text>
            <Text style={styles.statLabel}>Registrations</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() =>
              navigation.navigate('CreateEvent', { clubId: club.id })
            }
          >
            <View style={styles.actionIcon}>
              <Ionicons name="add-circle" size={24} color="#007AFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Create Event</Text>
              <Text style={styles.actionDescription}>
                Organize a new event for your club
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() =>
              navigation.navigate('CreateAnnouncement', { clubId: club.id })
            }
          >
            <View style={styles.actionIcon}>
              <Ionicons name="megaphone" size={24} color="#34C759" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Post Announcement</Text>
              <Text style={styles.actionDescription}>
                Share updates with your followers
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() =>
              navigation.navigate('ManageEvents', { clubId: club.id })
            }
          >
            <View style={styles.actionIcon}>
              <Ionicons name="list" size={24} color="#FF9500" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Events</Text>
              <Text style={styles.actionDescription}>
                View and edit your events
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() =>
              navigation.navigate('ViewRegistrations', { clubId: club.id })
            }
          >
            <View style={styles.actionIcon}>
              <Ionicons name="clipboard" size={24} color="#FF3B30" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View Registrations</Text>
              <Text style={styles.actionDescription}>
                See who registered for events
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  clubCard: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center'
  },
  clubName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  clubCategory: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    margin: '1%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 8
  },
  statLabel: {
    fontSize: 12,
    color: '#666'
  },
  section: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  actionContent: {
    flex: 1
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  actionDescription: {
    fontSize: 14,
    color: '#666'
  }
});

export default ClubHeadDashboardScreen;