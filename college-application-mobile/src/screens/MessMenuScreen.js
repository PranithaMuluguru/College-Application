import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  FlatList,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

import API_URL from '../config';
const API_BASE_URL = API_URL;

const MessMenuScreen = ({ navigation }) => {
  const [selectedView, setSelectedView] = useState('today');
  const [selectedMeal, setSelectedMeal] = useState('Breakfast');
  const [selectedWeeklyDay, setSelectedWeeklyDay] = useState('Monday');
  const [menuData, setMenuData] = useState({});
  const [loading, setLoading] = useState(false);
  const scrollY = new Animated.Value(0);

  const days = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  const mealTypes = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];

  const mealIcons = {
    Breakfast: 'sunny-outline',
    Lunch: 'restaurant-outline',
    Snacks: 'cafe-outline',
    Dinner: 'moon-outline',
  };

  useEffect(() => {
    const currentDay =
      days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    setSelectedWeeklyDay(currentDay);

    if (selectedView === 'today') {
      fetchTodayMenu();
    } else {
      fetchWeeklyMenu();
    }
  }, [selectedView]);

  useEffect(() => {
    if (selectedView === 'weekly') {
      fetchDayMenu(selectedWeeklyDay);
    }
  }, [selectedWeeklyDay]);

  const fetchTodayMenu = async () => {
    try {
      setLoading(true);
      const currentDay =
        days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
      const response = await axios.get(
        `${API_URL}/mess-menu/week/${currentDay}`
      );
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
    <View style={styles.menuCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.itemName}>{item.item_name}</Text>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={14} color="#FFB800" />
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
      <View style={styles.mealHeader}>
        <View style={styles.mealTitleContainer}>
          <View style={styles.iconCircle}>
            <Ionicons
              name={mealIcons[mealType]}
              size={20}
              color="#4F46E5"
            />
          </View>
          <Text style={styles.mealTitle}>{mealType}</Text>
        </View>
        <Text style={styles.itemCount}>{items.length} items</Text>
      </View>
      <FlatList
        data={items}
        renderItem={renderMenuItem}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
      />
    </View>
  );

  const renderTodayView = () => {
    const currentDay =
      days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    const dayMenu = menuData[currentDay] || {};

    return (
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Today's Menu</Text>
          <Text style={styles.heroSubtitle}>{currentDay}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.mealTabs}
          contentContainerStyle={styles.mealTabsContent}
        >
          {mealTypes.map((meal) => (
            <TouchableOpacity
              key={meal}
              style={[
                styles.mealTab,
                selectedMeal === meal && styles.activeMealTab,
              ]}
              onPress={() => setSelectedMeal(meal)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={mealIcons[meal]}
                size={20}
                color={selectedMeal === meal ? '#fff' : '#64748B'}
              />
              <Text
                style={[
                  styles.mealTabText,
                  selectedMeal === meal && styles.activeMealTabText,
                ]}
              >
                {meal}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading deliciousness...</Text>
          </View>
        ) : (
          <View style={styles.menuContainer}>
            {(() => {
              const mealItems = dayMenu[selectedMeal] || [];
              if (mealItems.length === 0) {
                return (
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="restaurant-outline"
                      size={64}
                      color="#CBD5E1"
                    />
                    <Text style={styles.emptyText}>
                      No {selectedMeal.toLowerCase()} items today
                    </Text>
                  </View>
                );
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
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Weekly Menu</Text>
          <Text style={styles.heroSubtitle}>Plan your week ahead</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dayTabs}
          contentContainerStyle={styles.dayTabsContent}
        >
          {days.map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayTab,
                selectedWeeklyDay === day && styles.activeDayTab,
              ]}
              onPress={() => setSelectedWeeklyDay(day)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayTabText,
                  selectedWeeklyDay === day && styles.activeDayTabText,
                ]}
              >
                {day.slice(0, 3)}
              </Text>
              <Text
                style={[
                  styles.dayTabSubtext,
                  selectedWeeklyDay === day && styles.activeDayTabSubtext,
                ]}
              >
                {day.slice(3)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading deliciousness...</Text>
          </View>
        ) : (
          <View style={styles.menuContainer}>
            {mealTypes.map((mealType) => {
              const mealItems = dayMenu[mealType] || [];
              if (mealItems.length === 0) return null;
              return renderMealSection(mealType, mealItems);
            })}

            {Object.keys(dayMenu).length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons
                  name="calendar-outline"
                  size={64}
                  color="#CBD5E1"
                />
                <Text style={styles.emptyText}>
                  No menu for {selectedWeeklyDay}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    );
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />

      <LinearGradient
        colors={['#1E293B', '#334155']}
        style={styles.header}
      >
        <Animated.View
          style={[styles.headerBackground, { opacity: headerOpacity }]}
        />
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mess Menu</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              selectedView === 'today' && styles.activeToggleButton,
            ]}
            onPress={() => setSelectedView('today')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.toggleText,
                selectedView === 'today' && styles.activeToggleText,
              ]}
            >
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              selectedView === 'weekly' && styles.activeToggleButton,
            ]}
            onPress={() => setSelectedView('weekly')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.toggleText,
                selectedView === 'weekly' && styles.activeToggleText,
              ]}
            >
              Weekly
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {selectedView === 'today' ? renderTodayView() : renderWeeklyView()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: StatusBar.currentHeight + 12 || 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1E293B',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeToggleButton: {
    backgroundColor: '#4F46E5',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  activeToggleText: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  mealTabs: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  mealTabsContent: {
    gap: 12,
  },
  mealTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activeMealTab: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  mealTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  activeMealTabText: {
    color: '#fff',
  },
  dayTabs: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  dayTabsContent: {
    gap: 10,
  },
  dayTab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    minWidth: 70,
    alignItems: 'center',
  },
  activeDayTab: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  dayTabText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  activeDayTabText: {
    color: '#fff',
  },
  dayTabSubtext: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  activeDayTabSubtext: {
    color: 'rgba(255,255,255,0.8)',
  },
  menuContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  mealSection: {
    marginBottom: 32,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  itemCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginRight: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 16,
    fontWeight: '500',
  },
});

export default MessMenuScreen;