import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getNextClass } from '../data/timetable';

const NextClass = () => {
  const nextClass = getNextClass();
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="time-outline" size={20} color="#6b46c1" />
        <Text style={styles.sectionTitle}>Next Class</Text>
      </View>
      
      {nextClass ? (
        <View style={styles.classCard}>
          <View style={styles.classHeader}>
            <Ionicons name="book-outline" size={24} color="#6b46c1" />
            <Text style={styles.className}>{nextClass.name}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#718096" />
            <Text style={styles.classTime}>{nextClass.time}</Text>
            <View style={styles.dot} />
            <Text style={styles.classDay}>{nextClass.day}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#718096" />
            <Text style={styles.classLocation}>{nextClass.location}</Text>
          </View>
          

        </View>
      ) : (
        <View style={styles.noClassContainer}>
          <Ionicons name="happy-outline" size={40} color="#a0aec0" />
          <Text style={styles.noClassTitle}>No more classes today!</Text>
          <Text style={styles.noClassSubtitle}>Time to relax 🎉</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginLeft: 8,
  },
  classCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#6b46c1',
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  className: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
    marginLeft: 12,
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  classTime: {
    fontSize: 14,
    color: '#4a5568',
    marginLeft: 8,
    fontWeight: '500',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e0',
    marginHorizontal: 8,
  },
  classDay: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '500',
  },
  classLocation: {
    fontSize: 14,
    color: '#4a5568',
    marginLeft: 8,
    fontWeight: '500',
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6b46c1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  reminderText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  noClassContainer: {
    backgroundColor: '#f7fafc',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
  },
  noClassTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5568',
    marginTop: 12,
    textAlign: 'center',
  },
  noClassSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default NextClass;