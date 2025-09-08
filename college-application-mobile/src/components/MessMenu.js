import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTodaysMenu } from '../data/messMenu';

const MessMenu = () => {
  const menu = getTodaysMenu();
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="restaurant-outline" size={18} color="#6b46c1" />
        <Text style={styles.sectionTitle}>Mess Menu</Text>
      </View>
      
      <View style={styles.menuCard}>
        <View style={styles.menuItem}>
          <Text style={styles.mealType}>Breakfast</Text>
          <Text style={styles.mealName}>{menu.Breakfast}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.menuItem}>
          <Text style={styles.mealType}>Lunch</Text>
          <Text style={styles.mealName}>{menu.Lunch}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.menuItem}>
          <Text style={styles.mealType}>Dinner</Text>
          <Text style={styles.mealName}>{menu.Dinner}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    marginLeft: 6,
  },
  menuCard: {
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: '#6b46c1',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  mealType: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '600',
  },
  mealName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },
});

export default MessMenu;