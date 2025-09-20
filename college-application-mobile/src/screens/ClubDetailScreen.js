import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { joinClub, leaveClub, hasJoinedClub } from '../data/clubsData';

const ClubDetailScreen = ({ route, navigation }) => {
  const { club } = route.params;
  const [isJoined, setIsJoined] = useState(hasJoinedClub(club.id));

  const handleJoinToggle = () => {
    if (isJoined) {
      leaveClub(club.id);
    } else {
      joinClub(club.id);
    }
    setIsJoined(!isJoined);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2d3748" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Club Details</Text>
        <View style={{ width: 24 }} /> // Spacer for balance
      </View>

      <View style={styles.clubHeader}>
        <Text style={styles.clubName}>{club.name}</Text>
        <Text style={styles.clubDescription}>{club.description}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="people" size={24} color="#4a86e8" />
          <Text style={styles.statNumber}>{club.members}</Text>
          <Text style={styles.statLabel}>Members</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="megaphone" size={24} color="#4a86e8" />
          <Text style={styles.statNumber}>{club.announcements.length}</Text>
          <Text style={styles.statLabel}>Announcements</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="person" size={24} color="#4a86e8" />
          <Text style={styles.statLabel}>President</Text>
          <Text style={styles.statText}>{club.president}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.joinButton, isJoined && styles.leaveButton]}
        onPress={handleJoinToggle}
      >
        <Ionicons name={isJoined ? "checkmark-circle" : "add-circle"} size={20} color="white" />
        <Text style={styles.joinButtonText}>
          {isJoined ? 'Joined' : 'Join Club'}
        </Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.contactItem}>
          <Ionicons name="mail" size={16} color="#666" />
          <Text style={styles.contactText}>{club.contact}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Announcements ({club.announcements.length})
        </Text>
        
        {club.announcements.length === 0 ? (
          <View style={styles.emptyAnnouncements}>
            <Ionicons name="megaphone-outline" size={40} color="#cbd5e0" />
            <Text style={styles.emptyText}>No announcements yet</Text>
          </View>
        ) : (
          club.announcements.map(announcement => (
            <View key={announcement.id} style={styles.announcementCard}>
              <Text style={styles.announcementTitle}>{announcement.title}</Text>
              <Text style={styles.announcementContent}>{announcement.content}</Text>
              <View style={styles.announcementFooter}>
                <Text style={styles.announcementAuthor}>By {announcement.author}</Text>
                <Text style={styles.announcementDate}>{announcement.date}</Text>
              </View>
            </View>
          ))
        )}
      </View>
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
  clubHeader: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 2,
  },
  clubName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
  },
  clubDescription: {
    color: '#718096',
    fontSize: 16,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginVertical: 4,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginTop: 4,
  },
  statLabel: {
    color: '#718096',
    fontSize: 12,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a86e8',
    padding: 16,
    margin: 20,
    borderRadius: 10,
  },
  leaveButton: {
    backgroundColor: '#38a169',
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    color: '#4a5568',
    marginLeft: 8,
  },
  emptyAnnouncements: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#a0aec0',
    marginTop: 8,
    fontStyle: 'italic',
  },
  announcementCard: {
    backgroundColor: '#f7fafc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4a86e8',
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  announcementContent: {
    color: '#4a5568',
    marginBottom: 12,
    lineHeight: 20,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  announcementAuthor: {
    color: '#718096',
    fontSize: 12,
  },
  announcementDate: {
    color: '#718096',
    fontSize: 12,
  },
});

export default ClubDetailScreen;