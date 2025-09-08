import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

const SportsScreen = () => {
  const events = [
    {
      id: 1,
      title: "Inter-college Football Tournament",
      date: "October 15-20, 2023",
      location: "Main Ground",
      status: "Upcoming"
    },
    {
      id: 2,
      title: "Basketball League",
      date: "October 25-30, 2023",
      location: "Basketball Court",
      status: "Registration Open"
    },
    {
      id: 3,
      title: "Annual Sports Day",
      date: "November 10, 2023",
      location: "College Stadium",
      status: "Upcoming"
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Sports Events</Text>
      
      {events.map(event => (
        <View key={event.id} style={styles.eventCard}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          
          <View style={styles.eventDetail}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{event.date}</Text>
          </View>
          
          <View style={styles.eventDetail}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{event.location}</Text>
          </View>
          
          <View style={styles.eventDetail}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[styles.detailValue, 
                         {color: event.status === 'Registration Open' ? 'green' : '#4a86e8'}]}>
              {event.status}
            </Text>
          </View>
          
          {event.status === 'Registration Open' && (
            <TouchableOpacity style={styles.registerButton}>
              <Text style={styles.registerButtonText}>Register</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  eventDetail: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: '600',
    width: '25%',
  },
  detailValue: {
    width: '70%',
  },
  registerButton: {
    backgroundColor: '#4a86e8',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default SportsScreen;