import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import axios from 'axios';
import API_URL from '../../config';

const { width, height } = Dimensions.get('window');
const RADAR_SIZE = Math.min(width, height) * 0.6; // Reduced to make room for list
const RADAR_RADIUS = RADAR_SIZE / 2;

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance * 1000; // Convert to meters
};

// Calculate angle between two points (for radar positioning)
const calculateAngle = (lat1, lon1, lat2, lon2) => {
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const angle = Math.atan2(y, x);
  return (angle * 180) / Math.PI;
};

const CampusMap = ({ route, navigation }) => {
  const { userId, userInfo } = route.params || {};

  const [location, setLocation] = useState(null);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [rangeFilter, setRangeFilter] = useState(500); // Default 500m

  const radarSweepAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animated radar sweep
  useEffect(() => {
    const sweepAnimation = Animated.loop(
      Animated.timing(radarSweepAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );
    sweepAnimation.start();

    return () => sweepAnimation.stop();
  }, []);

  // Pulse animation for user's position
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  // Request location permission and get current location
  const requestLocationPermission = async () => {
    try {
      setLoading(true);

      const { status: foregroundStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to see nearby users',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Location.enableNetworkProviderAsync(),
            },
          ]
        );
        setLoading(false);
        return false;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation(currentLocation.coords);
      return true;
    } catch (error) {
      console.error('Error getting location:', error);
      setErrorMsg('Failed to get location');
      setLoading(false);
      return false;
    }
  };

  // Update user location on backend
  const updateUserLocation = async (coords) => {
    try {
      const response = await axios.post(
        `${API_URL}/users/${userId}/location`,
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
          timestamp: new Date().toISOString(),
        }
      );
      console.log('Location updated:', response.data);
    } catch (error) {
      console.error(
        'Error updating location:',
        error.response?.data || error.message
      );
      // Don't throw error, just log it so the app continues working
    }
  };

  // Fetch nearby users from backend
  const fetchNearbyUsers = async (coords) => {
    try {
      const response = await axios.get(
        `${API_URL}/users/nearby/${userId}?latitude=${coords.latitude}&longitude=${coords.longitude}&radius=${rangeFilter}`
      );

      const users = response.data || [];

      // Calculate distances and angles for radar positioning
      const usersWithPosition = users.map((user) => {
        const distance = calculateDistance(
          coords.latitude,
          coords.longitude,
          user.latitude,
          user.longitude
        );

        const angle = calculateAngle(
          coords.latitude,
          coords.longitude,
          user.latitude,
          user.longitude
        );

        // Calculate radar position
        const normalizedDistance = Math.min(distance / rangeFilter, 1);
        const radarDistance = normalizedDistance * RADAR_RADIUS * 0.9;

        const angleRad = ((angle - 90) * Math.PI) / 180;
        const x = Math.cos(angleRad) * radarDistance;
        const y = Math.sin(angleRad) * radarDistance;

        return {
          ...user,
          distance,
          angle,
          radarX: x,
          radarY: y,
        };
      });

      setNearbyUsers(usersWithPosition);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching nearby users:', error);
      setNearbyUsers([]);
      setLoading(false);
    }
  };

  // Initialize location and fetch users
  useEffect(() => {
    const initialize = async () => {
      const granted = await requestLocationPermission();
      if (granted && location) {
        await updateUserLocation(location);
        await fetchNearbyUsers(location);
      }
    };
    initialize();
  }, [userId]);

  // Refresh nearby users
  const handleRefresh = async () => {
    if (!location) return;

    setRefreshing(true);
    const newLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    setLocation(newLocation.coords);

    await updateUserLocation(newLocation.coords);
    await fetchNearbyUsers(newLocation.coords);
    setRefreshing(false);
  };

  // Format distance
  const formatDistance = (distance) => {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(2)} km`;
    }
    return `${Math.round(distance)} m`;
  };

  // Get color based on distance
  const getDistanceColor = (distance) => {
    if (distance < 50) return '#22c55e';
    if (distance < 100) return '#3b82f6';
    return '#8b5cf6';
  };

  // Render radar circles
  const renderRadarCircles = () => {
    const circles = [0.25, 0.5, 0.75, 1].map((factor, index) => {
      const radius = RADAR_RADIUS * factor;
      const distance = rangeFilter * factor;

      return (
        <View key={index}>
          <View
            style={[
              styles.radarCircle,
              {
                width: radius * 2,
                height: radius * 2,
                borderRadius: radius,
              },
            ]}
          />
          <Text
            style={[
              styles.distanceLabel,
              {
                top: RADAR_RADIUS - radius - 15,
                left: RADAR_RADIUS + 5,
              },
            ]}
          >
            {distance >= 1000
              ? `${(distance / 1000).toFixed(1)}km`
              : `${Math.round(distance)}m`}
          </Text>
        </View>
      );
    });

    return circles;
  };

  // Render users on radar
  const renderNearbyUsers = () => {
    return nearbyUsers.map((user, index) => {
      const isVeryClose = user.distance < 50;
      const isClose = user.distance < 100;

      return (
        <TouchableOpacity
          key={user.id || index}
          style={[
            styles.userDot,
            {
              left: RADAR_RADIUS + user.radarX - 10,
              top: RADAR_RADIUS + user.radarY - 10,
              backgroundColor: isVeryClose
                ? '#22c55e'
                : isClose
                ? '#3b82f6'
                : '#8b5cf6',
            },
          ]}
          onPress={() => {
            Alert.alert(
              user.full_name || 'Unknown User',
              `Distance: ${formatDistance(user.distance)}\nDepartment: ${
                user.department || 'N/A'
              }\nYear: ${user.year || 'N/A'}`,
              [
                { text: 'Close', style: 'cancel' },
                {
                  text: 'View Profile',
                  onPress: () =>
                    navigation.navigate('UserProfile', { userId: user.id }),
                },
              ]
            );
          }}
        >
          <View style={styles.userDotInner} />
        </TouchableOpacity>
      );
    });
  };

  // Render user list item
  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() =>
        navigation.navigate('UserProfile', { userId: item.id })
      }
    >
      <View
        style={[
          styles.userCardDot,
          { backgroundColor: getDistanceColor(item.distance) },
        ]}
      />
      <View style={styles.userCardInfo}>
        <Text style={styles.userCardName}>{item.full_name}</Text>
        <View style={styles.userCardDetails}>
          <Text style={styles.userCardDetail}>
            {item.department || 'N/A'} • Year {item.year || 'N/A'}
          </Text>
        </View>
      </View>
      <View style={styles.userCardDistance}>
        <Text
          style={[
            styles.userCardDistanceText,
            { color: getDistanceColor(item.distance) },
          ]}
        >
          {formatDistance(item.distance)}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={20}
          color="#666"
          style={{ marginTop: 2 }}
        />
      </View>
    </TouchableOpacity>
  );

  if (loading && !location) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMsg) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="location-outline" size={64} color="#ef4444" />
          <Text style={styles.errorTitle}>Location Access Required</Text>
          <Text style={styles.errorMessage}>{errorMsg}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={requestLocationPermission}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nearby Users</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <Ionicons
              name="refresh"
              size={24}
              color="#fff"
              style={{
                transform: [{ rotate: refreshing ? '360deg' : '0deg' }],
              }}
            />
          </TouchableOpacity>
        </View>

        {/* Range Filter */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Search Radius:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {[100, 250, 500, 1000, 2000].map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.filterButton,
                  rangeFilter === range && styles.filterButtonActive,
                ]}
                onPress={() => {
                  setRangeFilter(range);
                  if (location) fetchNearbyUsers(location);
                }}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    rangeFilter === range && styles.filterButtonTextActive,
                  ]}
                >
                  {range >= 1000 ? `${range / 1000}km` : `${range}m`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Radar Container */}
        <View style={styles.radarContainer}>
          <View
            style={[
              styles.radar,
              {
                width: RADAR_SIZE,
                height: RADAR_SIZE,
                borderRadius: RADAR_RADIUS,
              },
            ]}
          >
            {/* Radar grid lines */}
            <View style={styles.radarGrid}>
              <View style={[styles.radarLine, styles.radarLineHorizontal]} />
              <View style={[styles.radarLine, styles.radarLineVertical]} />
            </View>

            {/* Radar circles */}
            {renderRadarCircles()}

            {/* Animated radar sweep */}
            <Animated.View
              style={[
                styles.radarSweep,
                {
                  transform: [
                    {
                      rotate: radarSweepAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            />

            {/* Current user position (center) */}
            <Animated.View
              style={[
                styles.currentUserDot,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <View style={styles.currentUserDotInner} />
            </Animated.View>

            {/* Nearby users */}
            {renderNearbyUsers()}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: '#22c55e' }]}
              />
              <Text style={styles.legendText}>{'< 50m'}</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: '#3b82f6' }]}
              />
              <Text style={styles.legendText}>{'< 100m'}</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: '#8b5cf6' }]}
              />
              <Text style={styles.legendText}>{'>100m'}</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="people-outline" size={24} color="#3b82f6" />
            <Text style={styles.statNumber}>{nearbyUsers.length}</Text>
            <Text style={styles.statLabel}>Users Nearby</Text>
          </View>

          {nearbyUsers.length > 0 && (
            <View style={styles.statCard}>
              <Ionicons name="location-outline" size={24} color="#22c55e" />
              <Text style={styles.statNumber}>
                {formatDistance(nearbyUsers[0].distance)}
              </Text>
              <Text style={styles.statLabel}>Closest User</Text>
            </View>
          )}
        </View>

        {/* Users List */}
        {nearbyUsers.length > 0 ? (
          <View style={styles.usersListContainer}>
            <View style={styles.usersListHeader}>
              <Text style={styles.usersListTitle}>
                People Nearby ({nearbyUsers.length})
              </Text>
              <Text style={styles.usersListSubtitle}>
                Tap to view profile
              </Text>
            </View>
            <View style={styles.usersList}>
              {nearbyUsers.map((item) => (
                <View key={item.id}>{renderUserItem({ item })}</View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="sad-outline" size={64} color="#666" />
            <Text style={styles.emptyStateTitle}>No Users Nearby</Text>
            <Text style={styles.emptyStateText}>
              Try increasing the search radius or check back later
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  refreshButton: {
    padding: 4,
  },
  filterContainer: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  filterLabel: {
    fontSize: 12,
    color: '#888',
    paddingHorizontal: 20,
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  radarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  radar: {
    backgroundColor: '#0f1419',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#1a2733',
  },
  radarGrid: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  radarLine: {
    position: 'absolute',
    backgroundColor: '#1a2733',
  },
  radarLineHorizontal: {
    width: '100%',
    height: 1,
    top: '50%',
  },
  radarLineVertical: {
    height: '100%',
    width: 1,
    left: '50%',
  },
  radarCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -1 }, { translateY: -1 }],
    borderWidth: 1,
    borderColor: '#1a2733',
  },
  distanceLabel: {
    position: 'absolute',
    fontSize: 10,
    color: '#4a5568',
    fontWeight: '600',
  },
  radarSweep: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: 2,
    height: '50%',
    backgroundColor: '#3b82f6',
    opacity: 0.3,
    transformOrigin: 'bottom',
  },
  currentUserDot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 24,
    height: 24,
    marginLeft: -12,
    marginTop: -12,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  currentUserDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  userDot: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  userDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  legend: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  usersListContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  usersListHeader: {
    marginBottom: 12,
  },
  usersListTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    marginTop: 12,
  },
  usersListSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  usersList: {
    gap: 8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  userCardDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  userCardInfo: {
    flex: 1,
  },
  userCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  userCardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userCardDetail: {
    fontSize: 13,
    color: '#888',
  },
  userCardDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userCardDistanceText: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#888',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default CampusMap;