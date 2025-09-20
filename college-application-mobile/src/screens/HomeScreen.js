import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const HomeScreen = ({ navigation, route }) => {
  const user = route.params?.user || { full_name: 'John Doe' };
  const firstLetter = user.full_name ? user.full_name.charAt(0).toUpperCase() : 'J';

  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [greeting, setGreeting] = useState('');
  const [isDaytime, setIsDaytime] = useState(true);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }));

      if (hours >= 5 && hours < 12) {
        setGreeting('Good Morning');
        setIsDaytime(true);
      } else if (hours >= 12 && hours < 17) {
        setGreeting('Good Afternoon');
        setIsDaytime(true);
      } else if (hours >= 17 && hours < 21) {
        setGreeting('Good Evening');
        setIsDaytime(false);
      } else {
        setGreeting('Good Night');
        setIsDaytime(false);
      }
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const nextClass = {
    title: 'Data Structures',
    time: '10:00 AM',
    code: 'CS-101',
    instructor: 'Dr. Smith',
    timeUntil: 'In 30 mins'
  };

  const todaysMeals = [
    { type: 'Breakfast', time: '7:00-9:00 AM', menu: 'Omelette, Toast, Coffee' },
    { type: 'Lunch', time: '12:00-2:00 PM', menu: 'Rice, Dal, Chicken Curry' }
  ];

  const quickAccessItems = [
    { name: 'Timetable', icon: 'calendar-outline' },
    { name: 'Mess Menu', icon: 'restaurant-outline' },
    { name: 'Bus Schedule', icon: 'bus-outline' },
    { name: 'Rewards', icon: 'trophy-outline' }
  ];

  const navItems = [
    { name: 'Home', icon: 'home', active: true },
    { name: 'Academics', icon: 'book-outline' },
    { name: 'Mess', icon: 'restaurant-outline' },
    { name: 'Clubs', icon: 'people-outline' },
    { name: 'Map', icon: 'map-outline' }
  ];

  return (
    <View style={[styles.container, !isDaytime && styles.nightContainer]}>
      <StatusBar barStyle={isDaytime ? "dark-content" : "light-content"} backgroundColor={isDaytime ? "#F9FAFB" : "#1F2937"} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}, {user.full_name.split(' ')[0]}!</Text>
          <Text style={styles.time}>{currentTime} · {currentDate}</Text>
        </View>
        <View style={styles.profileCircle}>
          <Text style={styles.profileLetter}>{firstLetter}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Next Class */}
        <View style={styles.card}>
          <View style={styles.classHeader}>
            <Ionicons name="time-outline" size={20} color="#3B82F6" />
            <Text style={styles.cardTitle}>Next Class</Text>
          </View>
          <View style={styles.classBody}>
            <View>
              <Text style={styles.className}>{nextClass.title}</Text>
              <Text style={styles.classDetails}>{nextClass.time} · {nextClass.code}</Text>
              <Text style={styles.classDetails}>{nextClass.instructor}</Text>
            </View>
            <View style={styles.timeBadge}>
              <Text style={styles.timeBadgeText}>{nextClass.timeUntil}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.viewTimetableBtn}>
            <Text style={styles.viewTimetableText}>View Full Timetable</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Access */}
        <View style={styles.card}>
          <View style={styles.classHeader}>
            <Ionicons name="flash-outline" size={20} color="#3B82F6" />
            <Text style={styles.cardTitle}>Quick Access</Text>
          </View>
          <View style={styles.quickAccessGrid}>
            {quickAccessItems.map((item, index) => (
              <TouchableOpacity key={index} style={styles.quickAccessItem} onPress={() => navigation.navigate(item.name)}>
                <Ionicons name={item.icon} size={24} color="#3B82F6" />
                <Text style={styles.quickAccessLabel}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Meals */}
        <View style={styles.card}>
          <View style={styles.classHeader}>
            <Ionicons name="restaurant-outline" size={20} color="#3B82F6" />
            <Text style={styles.cardTitle}>Today's Meals</Text>
          </View>
          {todaysMeals.map((meal, index) => (
            <View key={index} style={styles.mealItem}>
              <Text style={styles.mealType}>{meal.type}</Text>
              <Text style={styles.mealTimeRange}>{meal.time}</Text>
              <Text style={styles.mealMenu}>{meal.menu}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {navItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.navButton} onPress={() => navigation.navigate(item.name)}>
            <Ionicons name={item.icon} size={24} color={item.active ? '#3B82F6' : '#6B7280'} />
            <Text style={[styles.navText, item.active && styles.navTextActive]}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  nightContainer: { backgroundColor: '#8d9fa1' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50 },
  greeting: { fontSize: 20, fontWeight: '700', color: '#111827' },
  time: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  profileCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  profileLetter: { color: 'white', fontWeight: '700', fontSize: 18 },
  content: { flex: 1, paddingHorizontal: 16, marginTop: 12 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  classHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { marginLeft: 8, fontSize: 16, fontWeight: '600', color: '#111827' },
  classBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  className: { fontSize: 16, fontWeight: '700', color: '#111827' },
  classDetails: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  timeBadge: { backgroundColor: '#E5E7EB', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
  timeBadgeText: { fontSize: 12, color: '#111827' },
  viewTimetableBtn: { marginTop: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#3B82F6', alignItems: 'center' },
  viewTimetableText: { color: '#3B82F6', fontWeight: '600' },
  quickAccessGrid: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  quickAccessItem: { width: '23%', aspectRatio: 1, backgroundColor: '#EFF6FF', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  quickAccessLabel: { marginTop: 6, fontSize: 12, color: '#111827', fontWeight: '500', textAlign: 'center' },
  mealItem: { marginBottom: 12, padding: 12, backgroundColor: '#F3F4F6', borderRadius: 8 },
  mealType: { fontWeight: '700', color: '#111827' },
  mealTimeRange: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  mealMenu: { fontSize: 14, color: '#111827', marginTop: 2 },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: 'white' },
  navButton: { alignItems: 'center', flex: 1 },
  navText: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  navTextActive: { color: '#3B82F6', fontWeight: '600' }
});

export default HomeScreen;
