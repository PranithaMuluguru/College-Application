import React from 'react';
import { View, Text, StyleSheet } from 'react-native';


const ClassItem = ({ item }) => {  // Change parameter name from 'class' to 'item'
  return (
    <View style={styles.container}>
      <View style={styles.timeBadge}>
        <Text style={styles.timeText}>{item.time}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.details}>{item.location} • {item.professor}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeBadge: {
    backgroundColor: '#ebf4ff',
    padding: 6,
    borderRadius: 6,
    marginRight: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  timeText: {
    color: '#4a86e8',
    fontWeight: '600',
    fontSize: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
    fontSize: 16,
    color: '#2d3748',
    marginBottom: 2,
  },
  details: {
    color: '#718096',
    fontSize: 12,
  },
});

export default ClassItem;