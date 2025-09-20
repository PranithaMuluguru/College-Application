import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getWeeklyMenu, getTodaysMenu, setUserPreference, getUserPreferences } from '../data/messMenu';

const MessScreen = () => {
  const [weeklyMenu] = useState(getWeeklyMenu());
  const [todaysMenu] = useState(getTodaysMenu());
  const [activeTab, setActiveTab] = useState('weekly');
  const [preferences, setPreferences] = useState({});

  // In real app, you'd get userId from auth context
  const userId = 'current_user_id';

  const handlePreference = (day, meal, preference) => {
    setUserPreference(userId, day, meal, preference);
    setPreferences({...preferences, [day]: {...preferences[day], [meal]: preference}});
  };

  const getPreferenceIcon = (day, meal) => {
    const preference = preferences[day]?.[meal];
    switch (preference) {
      case 'like': return 'thumbs-up';
      case 'dislike': return 'thumbs-down';
      default: return 'help-circle';
    }
  };

  const getPreferenceColor = (day, meal) => {
    const preference = preferences[day]?.[meal];
    switch (preference) {
      case 'like': return '#38a169';
      case 'dislike': return '#e53e3e';
      default: return '#a0aec0';
    }
  };

  const renderWeeklyMenu = () => (
    <View>
      <Text style={styles.sectionTitle}>Weekly Menu</Text>
      {Object.entries(weeklyMenu).map(([day, meals]) => (
        <View key={day} style={styles.dayCard}>
          <Text style={styles.dayTitle}>{day}</Text>
          
          <View style={styles.mealRow}>
            <Text style={styles.mealType}>Breakfast:</Text>
            <Text style={styles.mealItem}>{meals.Breakfast}</Text>
            <TouchableOpacity onPress={() => handlePreference(day, 'Breakfast', 
              preferences[day]?.Breakfast === 'like' ? null : 'like')}>
              <Ionicons name={getPreferenceIcon(day, 'Breakfast')} size={20} color={getPreferenceColor(day, 'Breakfast')} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.mealRow}>
            <Text style={styles.mealType}>Lunch:</Text>
            <Text style={styles.mealItem}>{meals.Lunch}</Text>
            <TouchableOpacity onPress={() => handlePreference(day, 'Lunch', 
              preferences[day]?.Lunch === 'like' ? null : 'like')}>
              <Ionicons name={getPreferenceIcon(day, 'Lunch')} size={20} color={getPreferenceColor(day, 'Lunch')} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.mealRow}>
            <Text style={styles.mealType}>Dinner:</Text>
            <Text style={styles.mealItem}>{meals.Dinner}</Text>
            <TouchableOpacity onPress={() => handlePreference(day, 'Dinner', 
              preferences[day]?.Dinner === 'like' ? null : 'like')}>
              <Ionicons name={getPreferenceIcon(day, 'Dinner')} size={20} color={getPreferenceColor(day, 'Dinner')} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderTodaysMenu = () => (
    <View>
      <Text style={styles.sectionTitle}>Today's Menu</Text>
      <View style={[styles.dayCard, styles.todayCard]}>
        <Text style={[styles.dayTitle, styles.todayTitle]}>Today • {new Date().toLocaleDateString()}</Text>
        
        <View style={styles.mealRow}>
          <Ionicons name="sunny-outline" size={20} color="#f6ad55" />
          <Text style={styles.mealType}>Breakfast:</Text>
          <Text style={styles.mealItem}>{todaysMenu.Breakfast}</Text>
        </View>
        
        <View style={styles.mealRow}>
          <Ionicons name="restaurant-outline" size={20} color="#4299e1" />
          <Text style={styles.mealType}>Lunch:</Text>
          <Text style={styles.mealItem}>{todaysMenu.Lunch}</Text>
        </View>
        
        <View style={styles.mealRow}>
          <Ionicons name="moon-outline" size={20} color="#805ad5" />
          <Text style={styles.mealType}>Dinner:</Text>
          <Text style={styles.mealItem}>{todaysMenu.Dinner}</Text>
        </View>
      </View>
      
      <View style={styles.mealStats}>
        <Text style={styles.statsTitle}>Meal Preferences</Text>
        <Text style={styles.statsText}>Tap the thumbs-up icon to mark your favorite meals!</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'today' && styles.activeTab]}
          onPress={() => setActiveTab('today')}
        >
          <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'weekly' && styles.activeTab]}
          onPress={() => setActiveTab('weekly')}
        >
          <Text style={[styles.tabText, activeTab === 'weekly' && styles.activeTabText]}>Weekly</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {activeTab === 'today' ? renderTodaysMenu() : renderWeeklyMenu()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4a86e8',
  },
  tabText: {
    fontSize: 16,
    color: '#718096',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4a86e8',
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
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
  todayCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4a86e8',
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#4a86e8',
  },
  todayTitle: {
    color: '#2d3748',
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 5,
  },
  mealType: {
    fontWeight: '600',
    width: '25%',
    marginLeft: 8,
    color: '#4a5568',
  },
  mealItem: {
    flex: 1,
    color: '#2d3748',
    marginLeft: 8,
  },
  mealStats: {
    backgroundColor: '#ebf4ff',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  statsTitle: {
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
  },
  statsText: {
    color: '#4a5568',
    fontSize: 14,
  },
});

export default MessScreen;