import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_URL from '../../config';

const AdminDashboardScreen = ({ navigation, route }) => {
  const { admin_user, user, token } = route.params;
  const [stats, setStats] = useState({
    totalClubs: 0,
    totalEvents: 0,
    totalUsers: 0,
    activeAdmins: 0,
    total_users: 0,
    total_posts: 0,
    total_marketplace_items: 0,
    total_discussions: 0,
    total_courses: 0,
    new_users_today: 0,
    active_chats: 0,
    pending_follow_requests: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
      if (response.data.recentActivity) {
        setRecentActivity(response.data.recentActivity);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
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

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
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
      name: 'Clubs Management',
      icon: 'business',
      color: '#10b981',
      screen: 'ManageClubs',
      description: 'Manage clubs'
    },
    {
      name: 'Course Management',
      icon: 'book',
      color: '#f59e0b',
      screen: 'CourseManagement',
      description: 'Manage courses'
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

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
              {admin_user.admin_level === 'super_admin'
                ? 'Super Admin'
                : 'Admin'}
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#3b82f6" />
            <Text style={styles.statValue}>{stats.total_users}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="book" size={24} color="#f59e0b" />
            <Text style={styles.statValue}>{stats.total_courses || 0}</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="newspaper" size={24} color="#10b981" />
            <Text style={styles.statValue}>{stats.total_posts}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="storefront" size={24} color="#ec4899" />
            <Text style={styles.statValue}>
              {stats.total_marketplace_items}
            </Text>
            <Text style={styles.statLabel}>Marketplace</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="chatbubbles" size={24} color="#8b5cf6" />
            <Text style={styles.statValue}>{stats.total_discussions}</Text>
            <Text style={styles.statLabel}>Discussions</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="business" size={24} color="#06b6d4" />
            <Text style={styles.statValue}>{stats.totalClubs || 0}</Text>
            <Text style={styles.statLabel}>Clubs</Text>
          </View>
        </View>

        {/* Quick Stats */}
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

        {/* Admin Features Grid */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Admin Tools</Text>
          <View style={styles.featuresGrid}>
            {filteredFeatures.map((feature, index) => (
              <TouchableOpacity
                key={index}
                style={styles.featureCard}
                onPress={() =>
                  navigation.navigate(feature.screen, { token, admin_user })
                }
              >
                <View
                  style={[
                    styles.featureIcon,
                    { backgroundColor: `${feature.color}20` }
                  ]}
                >
                  <Ionicons
                    name={feature.icon}
                    size={24}
                    color={feature.color}
                  />
                </View>
                <Text style={styles.featureName}>{feature.name}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Activity</Text>

          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <View key={index} style={styles.activityCard}>
                <View style={styles.activityIcon}>
                  <Ionicons
                    name="shield-outline"
                    size={16}
                    color="#007AFF"
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>
                    {activity.action.replace('_', ' ').toUpperCase()}
                  </Text>
                  <Text style={styles.activityDescription}>
                    by {activity.admin?.name}
                  </Text>
                  <Text style={styles.activityTime}>
                    {formatTimeAgo(activity.created_at)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="shield-outline" size={50} color="#666" />
              <Text style={styles.emptyStateText}>No recent activity</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpace} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a'
  },
  greeting: {
    fontSize: 13,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf620',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4
  },
  badgeText: {
    fontSize: 11,
    color: '#8b5cf6',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  logoutButton: {
    padding: 8
  },
  content: {
    flex: 1,
    padding: 20
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16
  },
  quickStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8
  },
  quickStatText: {
    fontSize: 14,
    color: '#888'
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  featureName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4
  },
  featureDescription: {
    fontSize: 11,
    color: '#666'
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#0a0a0a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  activityContent: {
    flex: 1
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    color: '#fff'
  },
  activityDescription: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4
  },
  activityTime: {
    fontSize: 11,
    color: '#666'
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
  },
  bottomSpace: {
    height: 40
  }
});

export default AdminDashboardScreen;