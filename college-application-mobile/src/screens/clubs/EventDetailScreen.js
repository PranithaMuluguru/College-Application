// src/screens/EventDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';

const EventDetailScreen = ({ route, navigation }) => {
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, []);

  const fetchEventDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      // You'll need to create this endpoint
      const response = await fetch(`${API_URL}/clubs/events/${eventId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setEvent(data);
        setIsRegistered(data.is_registered);
        setIsLiked(data.is_liked);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/clubs/events/${eventId}/register`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        setIsRegistered(true);
        Alert.alert('Success', 'Successfully registered for event!');
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to register');
      }
    } catch (error) {
      console.error('Error registering:', error);
      Alert.alert('Error', 'Failed to register for event');
    }
  };

  const handleLike = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/clubs/events/${eventId}/like`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        setIsLiked(!isLiked);
      }
    } catch (error) {
      console.error('Error liking event:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Event Image */}
        {event.image_url ? (
          <Image source={{ uri: event.image_url }} style={styles.eventImage} />
        ) : (
          <View style={[styles.eventImage, styles.defaultImage]}>
            <Ionicons name="calendar-outline" size={60} color="#666" />
          </View>
        )}

        {/* Event Content */}
        <View style={styles.content}>
          {/* Status Badge */}
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{event.status}</Text>
          </View>

          <Text style={styles.eventTitle}>{event.title}</Text>

          {/* Event Meta */}
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={20} color="#007AFF" />
              <Text style={styles.metaText}>{formatDate(event.event_date)}</Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={20} color="#007AFF" />
              <Text style={styles.metaText}>{event.location}</Text>
            </View>

            {event.max_participants && (
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={20} color="#007AFF" />
                <Text style={styles.metaText}>
                  {event.registration_count}/{event.max_participants} registered
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Ionicons name="people" size={24} color="#007AFF" />
              <Text style={styles.statNumber}>{event.registration_count}</Text>
              <Text style={styles.statLabel}>Registered</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="heart" size={24} color="#FF3B30" />
              <Text style={styles.statNumber}>{event.like_count}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.likeButton}
          onPress={handleLike}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={24}
            color={isLiked ? "#FF3B30" : "#666"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.registerButton,
            isRegistered && styles.registeredButton
          ]}
          onPress={handleRegister}
          disabled={isRegistered || event.status !== 'scheduled'}
        >
          <Text
            style={[
              styles.registerButtonText,
              isRegistered && styles.registeredButtonText
            ]}
          >
            {isRegistered ? 'Registered' : 'Register Now'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
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
    alignItems: 'center'
  },
  errorText: {
    fontSize: 16,
    color: '#999'
  },
  eventImage: {
    width: '100%',
    height: 250
  },
  defaultImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    padding: 16
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#34C75920',
    marginBottom: 12
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
    textTransform: 'capitalize'
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16
  },
  metaContainer: {
    marginBottom: 24
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  metaText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#333'
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 80
  },
  statBox: {
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#666'
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  likeButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 12
  },
  registerButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  registeredButton: {
    backgroundColor: '#34C759'
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  },
  registeredButtonText: {
    color: '#fff'
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default EventDetailScreen;