import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { timetable } from '../data/timetable';

const AcademicsScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Class Schedule</Text>
      
      {Object.entries(timetable).map(([day, classes]) => (
        <View key={day} style={styles.dayCard}>
          <Text style={styles.dayTitle}>{day}</Text>
          
          {classes.length > 0 ? (
            classes.map((cls, index) => (
              <View key={index} style={styles.classItem}>
                <Text style={styles.className}>{cls.name}</Text>
                <Text style={styles.classTime}>{cls.time}</Text>
                <Text style={styles.classLocation}>{cls.location}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noClass}>No classes scheduled</Text>
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
  dayCard: {
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
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4a86e8',
  },
  classItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  className: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
  },
  classTime: {
    color: '#555',
    marginBottom: 2,
  },
  classLocation: {
    color: '#777',
    fontSize: 12,
  },
  noClass: {
    fontStyle: 'italic',
    color: '#999',
    textAlign: 'center',
    marginVertical: 10,
  },
});

export default AcademicsScreen;