// src/components/UpcomingClassBanner.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_URL from '../config';

const UpcomingClassBanner = ({ userId }) => {
  const [upcomingClass, setUpcomingClass] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkUpcomingClass();
    // Check every minute
    const interval = setInterval(checkUpcomingClass, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkUpcomingClass = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/notifications/upcoming-class/${userId}`
      );
      if (response.data.has_upcoming) {
        setUpcomingClass(response.data);
      } else {
        setUpcomingClass(null);
      }
    } catch (error) {
      console.error('Error checking upcoming class:', error);
    }
  };

  const quickMarkAttendance = async (status) => {
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/attendance/quick-mark/${userId}?timetable_entry_id=${upcomingClass.timetable_entry_id}&status=${status}`
      );
      
      Alert.alert('Success', `Marked as ${status}`);
      checkUpcomingClass(); // Refresh
    } catch (error) {
      console.error('Error marking attendance:', error);
      Alert.alert('Error', 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  if (!upcomingClass || upcomingClass.already_marked) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.header}>
        <Ionicons name="time-outline" size={24} color="#f59e0b" />
        <View style={styles.headerText}>
          <Text style={styles.title}>{upcomingClass.course_name}</Text>
          <Text style={styles.subtitle}>
            Starts in {upcomingClass.minutes_until} min • Room {upcomingClass.room_number}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.presentButton]}
          onPress={() => quickMarkAttendance('present')}
          disabled={loading}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.buttonText}>Present</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.absentButton]}
          onPress={() => quickMarkAttendance('absent')}
          disabled={loading}
        >
          <Ionicons name="close-circle" size={20} color="#fff" />
          <Text style={styles.buttonText}>Absent</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.cancelledButton]}
          onPress={() => quickMarkAttendance('cancelled')}
          disabled={loading}
        >
          <Ionicons name="ban" size={20} color="#fff" />
          <Text style={styles.buttonText}>No Class</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  presentButton: {
    backgroundColor: '#10b981',
  },
  absentButton: {
    backgroundColor: '#ef4444',
  },
  cancelledButton: {
    backgroundColor: '#6b7280',
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default UpcomingClassBanner;