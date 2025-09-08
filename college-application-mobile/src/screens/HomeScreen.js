import React from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NextClass from '../components/NextClass';
import MessMenu from '../components/MessMenu';
import Announcements from '../components/Announcements';

const HomeScreen = ({ navigation }) => {
  const sportsEvents = [
    "Inter-college Hackathon"
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Student Home Dashboard</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.scrollView}>
        {/* Today Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today</Text>
          
          {/* Use your NextClass component */}
          <NextClass />

          {/* Use your MessMenu component */}
          <MessMenu />

          {/* Use your Announcements component */}
          <Announcements />

          {/* Sports & Events Card */}
         </View>

        {/* Quick Access Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickAccessGrid}>
            <TouchableOpacity 
              style={styles.quickAccessButton}
              onPress={() => navigation.navigate('Academics')}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#4a86e8' }]}>
                <Ionicons name="book-outline" size={24} color="white" />
              </View>
              <Text style={styles.quickAccessText}>Academics</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAccessButton}
              onPress={() => navigation.navigate('Mess')}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#34a853' }]}>
                <Ionicons name="restaurant-outline" size={24} color="white" />
              </View>
              <Text style={styles.quickAccessText}>Mess</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAccessButton}
              onPress={() => navigation.navigate('Sports')}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#ea4335' }]}>
                <Ionicons name="basketball-outline" size={24} color="white" />
              </View>
              <Text style={styles.quickAccessText}>Sports</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAccessButton}
              onPress={() => navigation.navigate('Campus')}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#fbbc04' }]}>
                <Ionicons name="business-outline" size={24} color="white" />
              </View>
              <Text style={styles.quickAccessText}>Campus Life</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="home" size={24} color="#4a86e8" />
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Academics')}
        >
          <Ionicons name="book-outline" size={24} color="#666" />
          <Text style={styles.navText}>Academics</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Mess')}
        >
          <Ionicons name="restaurant-outline" size={24} color="#666" />
          <Text style={styles.navText}>Mess</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Sports')}
        >
          <Ionicons name="basketball-outline" size={24} color="#666" />
          <Text style={styles.navText}>Sports</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Campus')}
        >
          <Ionicons name="business-outline" size={24} color="#666" />
          <Text style={styles.navText}>Campus</Text>
        </TouchableOpacity>
      </View>
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
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
    marginBottom: 70,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  eventText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  registerButton: {
    backgroundColor: '#4a86e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAccessButton: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickAccessText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    height: 70,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    alignItems: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  navTextActive: {
    fontSize: 12,
    color: '#4a86e8',
    fontWeight: '600',
    marginTop: 4,
  },
});

export default HomeScreen;