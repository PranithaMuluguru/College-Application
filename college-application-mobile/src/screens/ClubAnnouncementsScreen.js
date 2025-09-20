import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMyAnnouncements } from '../data/clubsData';

const ClubAnnouncementsScreen = ({ navigation }) => {
  const announcements = getMyAnnouncements();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2d3748" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Club Announcements</Text>
        <View style={{ width: 24 }} /> // Spacer
      </View>

      {announcements.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off" size={60} color="#cbd5e0" />
          <Text style={styles.emptyTitle}>No Announcements</Text>
          <Text style={styles.emptyText}>
            Join clubs to receive announcements and updates from your groups.
          </Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => navigation.navigate('Clubs')}
          >
            <Text style={styles.browseButtonText}>Browse Clubs</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.announcementsList}>
          {announcements.map((announcement, index) => (
            <View key={index} style={styles.announcementCard}>
              <View style={styles.announcementHeader}>
                <Text style={styles.clubName}>{announcement.clubName}</Text>
                <Text style={styles.announcementDate}>{announcement.date}</Text>
              </View>
              
              <Text style={styles.announcementTitle}>{announcement.title}</Text>
              <Text style={styles.announcementContent}>{announcement.content}</Text>
              
              <View style={styles.announcementFooter}>
                <Text style={styles.announcementAuthor}>By {announcement.author}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#a0aec0',
    marginTop: 16,
  },
  emptyText: {
    color: '#a0aec0',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  browseButton: {
    backgroundColor: '#4a86e8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  announcementsList: {
    padding: 16,
  },
  announcementCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clubName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a86e8',
  },
  announcementDate: {
    color: '#718096',
    fontSize: 12,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
  },
  announcementContent: {
    color: '#4a5568',
    lineHeight: 20,
    marginBottom: 12,
  },
  announcementFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  announcementAuthor: {
    color: '#718096',
    fontSize: 12,
  },
});

export default ClubAnnouncementsScreen;