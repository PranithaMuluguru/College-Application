import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, TouchableOpacity, 
  Alert, StatusBar, FlatList 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = 'http://10.32.9.125:8000';

const MessMenuScreen = ({ navigation }) => {
  const [selectedView, setSelectedView] = useState('today');
  const [selectedMeal, setSelectedMeal] = useState('Breakfast');
  const [selectedWeeklyDay, setSelectedWeeklyDay] = useState('Monday');
  const [menuData, setMenuData] = useState({});
  const [loading, setLoading] = useState(false);
  const [isDaytime, setIsDaytime] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealTypes = ['Breakfast', 'Lunch','Snacks', 'Dinner'];
  

  useEffect(() => {
    const currentDay = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    setSelectedWeeklyDay(currentDay);
    
    if (selectedView === 'today') {
      fetchTodayMenu();
    } else {
      fetchWeeklyMenu();
    }
    
    updateDayNightMode();
  }, [selectedView]);

  useEffect(() => {
    if (selectedView === 'weekly') {
      fetchDayMenu(selectedWeeklyDay);
    }
  }, [selectedWeeklyDay]);

  const updateDayNightMode = () => {
    const hours = new Date().getHours();
    setIsDaytime(hours >= 5 && hours < 17);
  };

  const fetchTodayMenu = async () => {
    try {
      setLoading(true);
      const currentDay = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
      const response = await axios.get(`${API_URL}/mess-menu/week/${currentDay}`);
      setMenuData({ [currentDay]: response.data.meals });
    } catch (error) {
      console.error('Error fetching today menu:', error);
      Alert.alert('Error', 'Failed to load menu. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDayMenu = async (day) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/mess-menu/week/${day}`);
      setMenuData({ [day]: response.data.meals });
    } catch (error) {
      console.error('Error fetching day menu:', error);
      Alert.alert('Error', 'Failed to load menu. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyMenu = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/mess-menu/weekly`);
      setMenuData(response.data.weekly_menu);
    } catch (error) {
      console.error('Error fetching weekly menu:', error);
      Alert.alert('Error', 'Failed to load weekly menu. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderMenuItem = ({ item }) => (
    <View style={styles.menuItem}>
      <View style={styles.itemRow}>
        <Text style={styles.itemName}>{item.item_name}</Text>
        <View style={styles.rating}>
          {Array(5).fill(0).map((_, i) => (
            <Text key={i} style={styles.star}>
              {i < Math.floor(item.rating || 0) ? '★' : '☆'}
            </Text>
          ))}
          <Text style={styles.ratingText}>
            {(item.rating || 0).toFixed(1)}
          </Text>
        </View>
      </View>
      {item.description && (
        <Text style={styles.description}>{item.description}</Text>
      )}
    </View>
  );

  const renderMealSection = (mealType, items) => (
    <View key={mealType} style={styles.mealSection}>
      <Text style={styles.mealTitle}>{mealType}</Text>
      <FlatList
        data={items}
        renderItem={renderMenuItem}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
      />
    </View>
  );

  const renderTodayView = () => {
    const currentDay = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    const dayMenu = menuData[currentDay] || {};
    
    return (
      <ScrollView style={styles.content}>
        <View style={styles.tabs}>
          {mealTypes.map(meal => (
            <TouchableOpacity
              key={meal}
              style={[styles.tab, selectedMeal === meal && styles.activeTab]}
              onPress={() => setSelectedMeal(meal)}
            >
              <Text style={[styles.tabText, selectedMeal === meal && styles.activeTabText]}>
                {meal}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.dayTitle}>Today - {currentDay}</Text>
        
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : (
          <View>
            {(() => {
              const mealItems = dayMenu[selectedMeal] || [];
              if (mealItems.length === 0) {
                return <Text style={styles.emptyText}>No {selectedMeal.toLowerCase()} items today</Text>;
              }
              return renderMealSection(selectedMeal, mealItems);
            })()}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderWeeklyView = () => {
    const dayMenu = menuData[selectedWeeklyDay] || {};
    
    return (
      <ScrollView style={styles.content}>
        <View style={styles.tabs}>
          {days.map(day => (
            <TouchableOpacity
              key={day}
              style={[styles.tab, selectedWeeklyDay === day && styles.activeTab]}
              onPress={() => setSelectedWeeklyDay(day)}
            >
              <Text style={[styles.tabText, selectedWeeklyDay === day && styles.activeTabText]}>
                {day.slice(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.dayTitle}>{selectedWeeklyDay}</Text>
        
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : (
          <View>
            {mealTypes.map(mealType => {
              const mealItems = dayMenu[mealType] || [];
              if (mealItems.length === 0) return null;
              return renderMealSection(mealType, mealItems);
            })}
            
            {Object.keys(dayMenu).length === 0 && (
              <Text style={styles.emptyText}>No menu for {selectedWeeklyDay}</Text>
            )}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mess Menu</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.mainTabs}>
        <TouchableOpacity
          style={[styles.mainTab, selectedView === 'today' && styles.activeMainTab]}
          onPress={() => setSelectedView('today')}
        >
          <Text style={[styles.mainTabText, selectedView === 'today' && styles.activeMainTabText]}>
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTab, selectedView === 'weekly' && styles.activeMainTab]}
          onPress={() => setSelectedView('weekly')}
        >
          <Text style={[styles.mainTabText, selectedView === 'weekly' && styles.activeMainTabText]}>
            Weekly
          </Text>
        </TouchableOpacity>
      </View>

      {selectedView === 'today' ? renderTodayView() : renderWeeklyView()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: StatusBar.currentHeight + 12 || 40,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  mainTabs: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    margin: 16,
    borderRadius: 8,
    padding: 2,
  },
  mainTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeMainTab: {
    backgroundColor: '#007AFF',
  },
  mainTabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeMainTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 6,
    backgroundColor: '#f8f8f8',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  activeTab: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '500',
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  mealSection: {
    marginBottom: 24,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    paddingBottom: 6,
  },
  menuItem: {
    backgroundColor: '#fafafa',
    padding: 12,
    marginBottom: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    color: '#FFD700',
    fontSize: 12,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#999',
    marginTop: 40,
    fontStyle: 'italic',
  },
});

export default MessMenuScreen;