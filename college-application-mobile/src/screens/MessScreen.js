import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { getWeeklyMenu } from '../data/messMenu';

const MessScreen = () => {
  const weeklyMenu = getWeeklyMenu();
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Weekly Mess Menu</Text>
      
      {Object.entries(weeklyMenu).map(([day, meals]) => (
        <View key={day} style={styles.dayCard}>
          <Text style={styles.dayTitle}>{day}</Text>
          
          <View style={styles.mealRow}>
            <Text style={styles.mealType}>Breakfast:</Text>
            <Text style={styles.mealItem}>{meals.Breakfast}</Text>
          </View>
          
          <View style={styles.mealRow}>
            <Text style={styles.mealType}>Lunch:</Text>
            <Text style={styles.mealItem}>{meals.Lunch}</Text>
          </View>
          
          <View style={styles.mealRow}>
            <Text style={styles.mealType}>Dinner:</Text>
            <Text style={styles.mealItem}>{meals.Dinner}</Text>
          </View>
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
  mealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mealType: {
    fontWeight: '600',
    width: '30%',
  },
  mealItem: {
    width: '65%',
    color: '#555',
  },
});

export default MessScreen;