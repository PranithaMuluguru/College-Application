import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { clubCategories, clubs, userJoinedClubs, hasJoinedClub } from '../data/clubsData';

const ClubsScreen = ({ navigation }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [joinedClubs, setJoinedClubs] = useState(userJoinedClubs);

  const renderCategoryTabs = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
      <TouchableOpacity 
        style={[styles.categoryTab, activeCategory === 'all' && styles.activeCategoryTab]}
        onPress={() => setActiveCategory('all')}
      >
        <Text style={[styles.categoryText, activeCategory === 'all' && styles.activeCategoryText]}>
          All Clubs
        </Text>
      </TouchableOpacity>
      
      {clubCategories.map(category => (
        <TouchableOpacity 
          key={category.id}
          style={[styles.categoryTab, activeCategory === category.id && styles.activeCategoryTab]}
          onPress={() => setActiveCategory(category.id)}
        >
          <Text style={[styles.categoryText, activeCategory === category.id && styles.activeCategoryText]}>
            {category.icon} {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderClubs = () => {
    let clubsToShow = [];
    
    if (activeCategory === 'all') {
      Object.values(clubs).forEach(category => {
        clubsToShow = [...clubsToShow, ...category];
      });
    } else {
      clubsToShow = clubs[activeCategory] || [];
    }

    return clubsToShow.map(club => (
      <TouchableOpacity 
        key={club.id}
        style={styles.clubCard}
        onPress={() => navigation.navigate('ClubDetail', { club })}
      >
        <View style={styles.clubHeader}>
          <Text style={styles.clubName}>{club.name}</Text>
          {hasJoinedClub(club.id) && (
            <View style={styles.joinedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="white" />
              <Text style={styles.joinedText}>Joined</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.clubDescription}>{club.description}</Text>
        
        <View style={styles.clubDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="people" size={14} color="#666" />
            <Text style={styles.detailText}>{club.members} members</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="megaphone" size={14} color="#666" />
            <Text style={styles.detailText}>{club.announcements.length} announcements</Text>
          </View>
        </View>
        
        <View style={styles.clubFooter}>
          <Text style={styles.presidentText}>President: {club.president}</Text>
          <TouchableOpacity 
            style={[styles.joinButton, hasJoinedClub(club.id) && styles.joinedButton]}
            onPress={(e) => {
              e.stopPropagation();
              // Handle join/leave logic here
            }}
          >
            <Text style={styles.joinButtonText}>
              {hasJoinedClub(club.id) ? 'Joined' : 'Join Club'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>College Clubs & Groups</Text>
        <TouchableOpacity 
          style={styles.announcementsButton}
          onPress={() => navigation.navigate('ClubAnnouncements')}
        >
          <Ionicons name="notifications" size={24} color="#4a86e8" />
          {joinedClubs.length > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>{joinedClubs.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {renderCategoryTabs()}
      
      <ScrollView style={styles.scrollView}>
        {renderClubs()}
        
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#4a86e8" />
          <Text style={styles.infoText}>
            Join clubs to receive announcements and participate in events. Tap on a club to see details and announcements.
          </Text>
        </View>
      </ScrollView>
    </View>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  announcementsButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#e53e3e',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoriesScroll: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f7fafc',
  },
  activeCategoryTab: {
    backgroundColor: '#4a86e8',
  },
  categoryText: {
    color: '#718096',
    fontWeight: '500',
  },
  activeCategoryText: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  clubCard: {
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
  clubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clubName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    flex: 1,
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38a169',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  joinedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  clubDescription: {
    color: '#718096',
    marginBottom: 12,
    lineHeight: 20,
  },
  clubDetails: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
  clubFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  presidentText: {
    color: '#718096',
    fontSize: 12,
  },
  joinButton: {
    backgroundColor: '#4a86e8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  joinedButton: {
    backgroundColor: '#38a169',
  },
  joinButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#ebf4ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    color: '#4a5568',
    marginLeft: 12,
    flex: 1,
    fontSize: 14,
  },
});

export default ClubsScreen;