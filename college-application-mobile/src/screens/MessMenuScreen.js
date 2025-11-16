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
    Breakfast: 'sunny',
    Lunch: 'fast-food',
    Snacks: 'cafe',
    Dinner: 'moon',
  };

  const mealEmojis = {
    Breakfast: '🌅',
    Lunch: '🍛',
    Snacks: '☕',
    Dinner: '🌙',
  };

  const mealColors = {
    Breakfast: '#FF9800',
    Lunch: '#4CAF50',
    Snacks: '#E91E63',
    Dinner: '#2196F3',
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

  const renderMealSection = (mealType, items) => {
    const color = mealColors[mealType];

    return (
      <View key={mealType} style={styles.mealSection}>
        <View style={styles.mealCard}>
          <View style={styles.mealHeader}>
            <View
              style={[
                styles.mealIconWrapper,
                { backgroundColor: `${color}20` },
              ]}
            >
              <Text style={styles.mealEmoji}>{mealEmojis[mealType]}</Text>
            </View>
            <View style={styles.mealInfo}>
              <Text style={styles.mealTitle}>{mealType}</Text>
              <Text style={styles.itemCount}>{items.length} items</Text>
            </View>
          </View>

          <View style={styles.itemsList}>
            {items.map((item, index) => (
              <View key={item.id} style={styles.menuItem}>
                <View
                  style={[styles.itemBullet, { backgroundColor: color }]}
                />
                <Text style={styles.itemName}>{item.item_name}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

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
        <View style={styles.todayBanner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerEmoji}>🍽️</Text>
            <View>
              <Text style={styles.bannerTitle}>Today's Menu</Text>
              <Text style={styles.bannerSubtitle}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingEmoji}>🍳</Text>
            <Text style={styles.loadingText}>Cooking up the menu...</Text>
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
                <Text style={styles.emptyEmoji}>😕</Text>
                <Text style={styles.emptyText}>No menu today</Text>
                <Text style={styles.emptySubtext}>Check back later!</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderWeeklyView = () => {
    const dayMenu = menuData[selectedWeeklyDay] || {};
    const currentDay =
      days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

    return (
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.weekBanner}>
          <Text style={styles.weekBannerEmoji}>📅</Text>
          <Text style={styles.weekBannerText}>Weekly Menu</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.daySelector}
          contentContainerStyle={styles.daySelectorContent}
        >
          {days.map((day) => {
            const isSelected = selectedWeeklyDay === day;
            const isToday = day === currentDay;

            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  isSelected && styles.dayButtonSelected,
                ]}
                onPress={() => setSelectedWeeklyDay(day)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    isSelected && styles.dayButtonTextSelected,
                  ]}
                >
                  {day.substring(0, 3)}
                </Text>
                {isToday && <View style={styles.todayIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingEmoji}>🍳</Text>
            <Text style={styles.loadingText}>Cooking up the menu...</Text>
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
                <Text style={styles.emptyEmoji}>😕</Text>
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerEmoji}>🍽️</Text>
            <Text style={styles.headerTitle}>Mess Menu</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              selectedView === 'today' && styles.activeToggleButton,
            ]}
            onPress={() => setSelectedView('today')}
            activeOpacity={0.8}
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
            activeOpacity={0.8}
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
    backgroundColor: '#0f0f1e',
  },
  header: {
    paddingTop: StatusBar.currentHeight + 16 || 44,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerEmoji: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  placeholder: {
    width: 44,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeToggleButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  activeToggleText: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  todayBanner: {
    margin: 20,
    backgroundColor: '#1e1e30',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bannerEmoji: {
    fontSize: 36,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
  },
  weekBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  weekBannerEmoji: {
    fontSize: 28,
  },
  weekBannerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  daySelector: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  daySelectorContent: {
    gap: 10,
  },
  dayButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#1e1e30',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    position: 'relative',
  },
  dayButtonSelected: {
    backgroundColor: '#2a2a40',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dayButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  dayButtonTextSelected: {
    color: '#fff',
  },
  todayIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  menuContainer: {
    padding: 20,
    paddingTop: 0,
  },
  mealSection: {
    marginBottom: 20,
  },
  mealCard: {
    backgroundColor: '#1e1e30',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  mealIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  mealEmoji: {
    fontSize: 28,
  },
  mealInfo: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  itemCount: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
  },
  itemsList: {
    gap: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  loadingEmoji: {
    fontSize: 48,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
});

export default MessMenuScreen;