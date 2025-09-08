import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { announcements } from '../data/announcements';
import Card from './Card';

const Announcements = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Announcements</Text>
      
      {announcements.slice(0, 3).map(announcement => (
        <Card key={announcement.id} style={styles.announcementCard}>
          <Text style={styles.announcementTitle}>{announcement.title}</Text>
          <Text style={styles.announcementTime}>{announcement.time}</Text>
          <Text style={styles.announcementDesc}>{announcement.description}</Text>
        </Card>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  announcementCard: {
    marginBottom: 10,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  announcementTime: {
    fontSize: 14,
    color: '#4a86e8',
    marginBottom: 8,
  },
  announcementDesc: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
});

export default Announcements;