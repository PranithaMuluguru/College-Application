import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';

const CampusScreen = () => {
  const facilities = [
    { id: 1, name: "Library", hours: "8 AM - 10 PM", status: "Open" },
    { id: 2, name: "Computer Lab", hours: "9 AM - 6 PM", status: "Open" },
    { id: 3, name: "Gym", hours: "6 AM - 9 PM", status: "Open" },
    { id: 4, name: "Cafeteria", hours: "8 AM - 8 PM", status: "Open" },
  ];

  const openMaps = (location) => {
    // This would open the location in maps app
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Campus Life</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Campus Facilities</Text>
        
        {facilities.map(facility => (
          <View key={facility.id} style={styles.facilityCard}>
            <Text style={styles.facilityName}>{facility.name}</Text>
            
            <View style={styles.facilityDetail}>
              <Text style={styles.detailLabel}>Hours:</Text>
              <Text style={styles.detailValue}>{facility.hours}</Text>
            </View>
            
            <View style={styles.facilityDetail}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={[styles.detailValue, 
                          {color: facility.status === 'Open' ? 'green' : 'red'}]}>
                {facility.status}
              </Text>
            </View>
          </View>
        ))}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Important Locations</Text>
        
        <TouchableOpacity 
          style={styles.locationCard}
          onPress={() => openMaps("College Admin Building")}
        >
          <Text style={styles.locationName}>Admin Building</Text>
          <Text style={styles.locationDesc}>Main administrative offices</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.locationCard}
          onPress={() => openMaps("College Library")}
        >
          <Text style={styles.locationName}>Central Library</Text>
          <Text style={styles.locationDesc}>Study resources and quiet zones</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.locationCard}
          onPress={() => openMaps("College Sports Complex")}
        >
          <Text style={styles.locationName}>Sports Complex</Text>
          <Text style={styles.locationDesc}>Indoor and outdoor sports facilities</Text>
        </TouchableOpacity>
      </View>
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
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  facilityCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  facilityName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4a86e8',
  },
  facilityDetail: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  detailLabel: {
    fontWeight: '600',
    width: '20%',
  },
  detailValue: {
    width: '75%',
  },
  locationCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#4a86e8',
  },
  locationDesc: {
    color: '#666',
  },
});

export default CampusScreen;