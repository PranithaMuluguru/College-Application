// AdminDashboardScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_URL from '../../config';

const AdminDashboardScreen = ({ navigation, route }) => {
  const { admin_user, user, token } = route.params;
  const [stats, setStats] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('admin_token');
            await AsyncStorage.removeItem('admin_data');
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  const adminFeatures = [
    {
      name: 'User Management',
      icon: 'people',
      color: '#3b82f6',
      screen: 'AdminUsers',
      description: 'Manage all users'
    },
    {
      name: 'Admin Management',
      icon: 'shield-checkmark',
      color: '#8b5cf6',
      screen: 'AdminManagement',
      description: 'Manage administrators',
      requiresSuperAdmin: true
    },
    {
      name: 'Posts Management',
      icon: 'newspaper',
      color: '#10b981',
      screen: 'AdminPosts',
      description: 'Moderate posts'
    },
    {
      name: 'Marketplace',
      icon: 'storefront',
      color: '#ec4899',
      screen: 'AdminMarketplace',
      description: 'Manage marketplace'
    },
    {
      name: 'Discussions',
      icon: 'chatbubbles',
      color: '#f59e0b',
      screen: 'AdminDiscussions',
      description: 'Moderate discussions'
    },
    {
      name: 'Analytics',
      icon: 'analytics',
      color: '#6366f1',
      screen: 'AdminAnalytics',
      description: 'View analytics'
    },
    {
      name: 'Activity Logs',
      icon: 'list',
      color: '#8b5cf6',
      screen: 'AdminLogs',
      description: 'View admin activities'
    },
    {
      name: 'System Health',
      icon: 'pulse',
      color: '#10b981',
      screen: 'AdminSystemHealth',
      description: 'System status'
    }
  ];

  const filteredFeatures = adminFeatures.filter(feature => {
    if (feature.requiresSuperAdmin) {
      return admin_user.admin_level === 'super_admin';
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Admin Portal</Text>
          <Text style={styles.userName}>{user.full_name}</Text>
          <View style={styles.badge}>
            <Ionicons name="shield-checkmark" size={12} color="#8b5cf6" />
            <Text style={styles.badgeText}>
              {admin_user.admin_level === 'super_admin' ? 'Super Admin' : 'Admin'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={24} color="#3b82f6" />
              <Text style={styles.statValue}>{stats.total_users}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="newspaper" size={24} color="#10b981" />
              <Text style={styles.statValue}>{stats.total_posts}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="storefront" size={24} color="#ec4899" />
              <Text style={styles.statValue}>{stats.total_marketplace_items}</Text>
              <Text style={styles.statLabel}>Marketplace</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="chatbubbles" size={24} color="#f59e0b" />
              <Text style={styles.statValue}>{stats.total_discussions}</Text>
              <Text style={styles.statLabel}>Discussions</Text>
            </View>
          </View>
        )}

        {/* Quick Stats */}
        {stats && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Today's Activity</Text>
            <View style={styles.quickStat}>
              <Ionicons name="person-add" size={16} color="#10b981" />
              <Text style={styles.quickStatText}>
                {stats.new_users_today} new users
              </Text>
            </View>
            <View style={styles.quickStat}>
              <Ionicons name="chatbox" size={16} color="#3b82f6" />
              <Text style={styles.quickStatText}>
                {stats.active_chats} active chats
              </Text>
            </View>
            <View style={styles.quickStat}>
              <Ionicons name="notifications" size={16} color="#f59e0b" />
              <Text style={styles.quickStatText}>
                {stats.pending_follow_requests} pending requests
              </Text>
            </View>
          </View>
        )}

        {/* Admin Features Grid */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Admin Tools</Text>
          <View style={styles.featuresGrid}>
            {filteredFeatures.map((feature, index) => (
              <TouchableOpacity
                key={index}
                style={styles.featureCard}
                onPress={() => navigation.navigate(feature.screen, { token, admin_user })}
              >
                <View style={[styles.featureIcon, { backgroundColor: `${feature.color}20` }]}>
                  <Ionicons name={feature.icon} size={24} color={feature.color} />
                </View>
                <Text style={styles.featureName}>{feature.name}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  greeting: {
    fontSize: 13,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf620',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    color: '#8b5cf6',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  quickStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  quickStatText: {
    fontSize: 14,
    color: '#888',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 11,
    color: '#666',
  },
  bottomSpace: {
    height: 40,
  },
});

export default AdminDashboardScreen;