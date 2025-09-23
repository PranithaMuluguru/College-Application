import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = 'http://10.32.9.125:8000';

const HomeScreen = ({ navigation, route }) => {
  // Properly extract user data from route.params
  const userData = route.params?.user || {};
  const userId = userData?.id || route.params?.userId;
  const userInfo = route.params?.userInfo || userData;
  
  console.log('HomeScreen - User Data:', { userId, userInfo });
  
  const firstLetter = userInfo?.full_name ? userInfo.full_name.charAt(0).toUpperCase() : 'U';

  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [greeting, setGreeting] = useState('');
  const [isDaytime, setIsDaytime] = useState(true);
  const [nextClass, setNextClass] = useState(null);
  const [todaysClasses, setTodaysClasses] = useState([]);

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

  useEffect(() => {
    if (userId) {
      console.log('Fetching timetable for user:', userId);
      fetchTodaysClasses();
    } else {
      console.log('User ID not available for fetching timetable');
    }
  }, [userId]);

  const fetchTodaysClasses = async () => {
    if (!userId) return;
    
    try {
      console.log('Fetching timetable from:', `${API_URL}/timetable/${userId}`);
      const response = await axios.get(`${API_URL}/timetable/${userId}`);
      const allClasses = response.data;
      
      // Get current day
      const today = new Date();
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const currentDay = dayNames[today.getDay()];
      
      // Filter classes for today
      const todaysClassesList = allClasses.filter(classItem => 
        classItem.day_of_week === currentDay
      );
      
      // Sort by start time
      todaysClassesList.sort((a, b) => a.start_time.localeCompare(b.start_time));
      
      setTodaysClasses(todaysClassesList);
      
      // Find next class
      const currentTimeStr = today.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
      
      const upcomingClass = todaysClassesList.find(classItem => {
        const classTime = convertTo24Hour(classItem.start_time);
        return classTime > currentTimeStr;
      });
      
      setNextClass(upcomingClass);
      
    } catch (error) {
      console.error('Error fetching today\'s classes:', error);
    }
  };

  const convertTo24Hour = (time12h) => {
    if (!time12h) return '00:00';
    
    // If already in 24-hour format, return as is
    if (time12h.match(/^\d{1,2}:\d{2}$/)) {
      return time12h.padStart(5, '0');
    }
    
    // Convert 12-hour to 24-hour format
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier && modifier.toUpperCase() === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  const calculateTimeUntil = (classTime) => {
    if (!classTime) return '';
    
    const now = new Date();
    const [hours, minutes] = classTime.split(':');
    const classDateTime = new Date();
    classDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const diff = classDateTime - now;
    if (diff <= 0) return 'Now';
    
    const diffMinutes = Math.floor(diff / (1000 * 60));
    if (diffMinutes < 60) return `In ${diffMinutes} mins`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;
    return `In ${diffHours}h ${remainingMinutes}m`;
  };

  const todaysMeals = [
    { type: 'Breakfast', time: '7:00-9:00 AM', menu: 'Omelette, Toast, Coffee' },
    { type: 'Lunch', time: '12:00-2:00 PM', menu: 'Rice, Dal, Chicken Curry' },
    { type: 'Dinner', time: '7:00-9:00 PM', menu: 'Chapati, Vegetables, Curd' }
  ];

  const navigateToAcademics = () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not available. Please login again.');
      return;
    }
    
    console.log('Navigating to Academics with:', { userId, userInfo });
    navigation.navigate('Academics', { 
      userId: userId, 
      userInfo: userInfo 
    });
  };

  const quickAccessItems = [
    { 
      name: 'Academics', 
      icon: 'calendar-outline',
      onPress: navigateToAcademics
    },
    { name: 'Mess Menu', icon: 'restaurant-outline', onPress: () => Alert.alert('Coming Soon', 'Mess Menu feature is under development') },
    { name: 'Bus Schedule', icon: 'bus-outline', onPress: () => Alert.alert('Coming Soon', 'Bus Schedule feature is under development') },
    { name: 'Rewards', icon: 'trophy-outline', onPress: () => Alert.alert('Coming Soon', 'Rewards feature is under development') }
  ];

  const navItems = [
    { 
      name: 'Home', 
      icon: 'home', 
      active: true,
      onPress: () => {} 
    },
    { 
      name: 'Academics', 
      icon: 'book-outline',
      onPress: navigateToAcademics
    },
    { name: 'Mess', icon: 'restaurant-outline', onPress: () => Alert.alert('Coming Soon', 'Mess feature is under development') },
    { name: 'Clubs', icon: 'people-outline', onPress: () => Alert.alert('Coming Soon', 'Clubs feature is under development') },
    { name: 'Map', icon: 'map-outline', onPress: () => Alert.alert('Coming Soon', 'Map feature is under development') }
  ];

  const renderNextClass = () => {
    if (!nextClass) {
      return (
        <View style={styles.card}>
          <View style={styles.classHeader}>
            <Ionicons name="time-outline" size={20} color="#3B82F6" />
            <Text style={styles.cardTitle}>Next Class</Text>
          </View>
          <View style={styles.emptyClassState}>
            <Text style={styles.noClassText}>No more classes today</Text>
            <Text style={styles.noClassSubtext}>Enjoy your free time!</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <View style={styles.classHeader}>
          <Ionicons name="time-outline" size={20} color="#3B82F6" />
          <Text style={styles.cardTitle}>Next Class</Text>
        </View>
        <View style={styles.classBody}>
          <View>
            <Text style={styles.className}>{nextClass.course_name}</Text>
            <Text style={styles.classDetails}>{nextClass.start_time} - {nextClass.end_time}</Text>
            <Text style={styles.classDetails}>{nextClass.teacher}</Text>
            <Text style={styles.classDetails}>Room: {nextClass.room_number}</Text>
          </View>
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>{calculateTimeUntil(nextClass.start_time)}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.viewTimetableBtn}
          onPress={navigateToAcademics}
        >
          <Text style={styles.viewTimetableText}>View Full Timetable</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Show error if user data is not available
  if (!userId) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
        <View style={styles.errorContent}>
          <Ionicons name="warning-outline" size={64} color="#FF6B6B" />
          <Text style={styles.errorTitle}>User Data Not Available</Text>
          <Text style={styles.errorMessage}>
            Please make sure you're properly logged in. The user ID is missing.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.retryButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, !isDaytime && styles.nightContainer]}>
      <StatusBar barStyle={isDaytime ? "dark-content" : "light-content"} backgroundColor={isDaytime ? "#F9FAFB" : "#1F2937"} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}, {userInfo?.full_name?.split(' ')[0] || 'Student'}!</Text>
          <Text style={styles.time}>{currentTime} · {currentDate}</Text>
        </View>
        <TouchableOpacity style={styles.profileCircle}>
          <Text style={styles.profileLetter}>{firstLetter}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Next Class */}
        {renderNextClass()}

        {/* Today's Schedule Overview */}
        {todaysClasses.length > 0 && (
          <View style={styles.card}>
            <View style={styles.classHeader}>
              <Ionicons name="list-outline" size={20} color="#3B82F6" />
              <Text style={styles.cardTitle}>Today's Schedule</Text>
            </View>
            {todaysClasses.slice(0, 3).map((classItem, index) => (
              <View key={index} style={styles.scheduleItem}>
                <Text style={styles.scheduleTime}>{classItem.start_time}</Text>
                <Text style={styles.scheduleCourse}>{classItem.course_name}</Text>
                <Text style={styles.scheduleRoom}>{classItem.room_number}</Text>
              </View>
            ))}
            {todaysClasses.length > 3 && (
              <TouchableOpacity 
                style={styles.viewMoreBtn}
                onPress={navigateToAcademics}
              >
                <Text style={styles.viewMoreText}>View {todaysClasses.length - 3} more classes</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Quick Access */}
        <View style={styles.card}>
          <View style={styles.classHeader}>
            <Ionicons name="flash-outline" size={20} color="#3B82F6" />
            <Text style={styles.cardTitle}>Quick Access</Text>
          </View>
          <View style={styles.quickAccessGrid}>
            {quickAccessItems.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.quickAccessItem} 
                onPress={item.onPress}
              >
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

        {/* Academic Info */}
        <View style={styles.card}>
          <View style={styles.classHeader}>
            <Ionicons name="school-outline" size={20} color="#3B82F6" />
            <Text style={styles.cardTitle}>Academic Info</Text>
          </View>
          <View style={styles.academicInfo}>
            <Text style={styles.academicInfoText}>Department: {userInfo?.department || 'N/A'}</Text>
            <Text style={styles.academicInfoText}>Year: {userInfo?.year || 'N/A'}</Text>
            <Text style={styles.academicInfoText}>College ID: {userInfo?.college_id || 'N/A'}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {navItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.navButton} 
            onPress={item.onPress}
          >
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
  nightContainer: { backgroundColor: '#1F2937' },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContent: {
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    paddingTop: 50 
  },
  greeting: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#111827' 
  },
  time: { 
    fontSize: 14, 
    color: '#6B7280', 
    marginTop: 4 
  },
  profileCircle: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#3B82F6', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  profileLetter: { 
    color: 'white', 
    fontWeight: '700', 
    fontSize: 18 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 16, 
    marginTop: 12 
  },
  card: { 
    backgroundColor: 'white', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2 
  },
  classHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  cardTitle: { 
    marginLeft: 8, 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#111827' 
  },
  classBody: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  className: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#111827' 
  },
  classDetails: { 
    fontSize: 14, 
    color: '#6B7280', 
    marginTop: 2 
  },
  timeBadge: { 
    backgroundColor: '#E5E7EB', 
    paddingVertical: 4, 
    paddingHorizontal: 8, 
    borderRadius: 12 
  },
  timeBadgeText: { 
    fontSize: 12, 
    color: '#111827' 
  },
  viewTimetableBtn: { 
    marginTop: 12, 
    paddingVertical: 8, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#3B82F6', 
    alignItems: 'center' 
  },
  viewTimetableText: { 
    color: '#3B82F6', 
    fontWeight: '600' 
  },
  emptyClassState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noClassText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  noClassSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  scheduleTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    width: 60,
  },
  scheduleCourse: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 12,
  },
  scheduleRoom: {
    fontSize: 12,
    color: '#6B7280',
  },
  viewMoreBtn: {
    marginTop: 8,
    alignItems: 'center',
  },
  viewMoreText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  quickAccessGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    flexWrap: 'wrap' 
  },
  quickAccessItem: { 
    width: '23%', 
    aspectRatio: 1, 
    backgroundColor: '#EFF6FF', 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  quickAccessLabel: { 
    marginTop: 6, 
    fontSize: 12, 
    color: '#111827', 
    fontWeight: '500', 
    textAlign: 'center' 
  },
  mealItem: { 
    marginBottom: 12, 
    padding: 12, 
    backgroundColor: '#F3F4F6', 
    borderRadius: 8 
  },
  mealType: { 
    fontWeight: '700', 
    color: '#111827' 
  },
  mealTimeRange: { 
    fontSize: 12, 
    color: '#6B7280', 
    marginTop: 2 
  },
  mealMenu: { 
    fontSize: 14, 
    color: '#111827', 
    marginTop: 2 
  },
  academicInfo: {
    paddingVertical: 8,
  },
  academicInfoText: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  bottomNav: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderTopWidth: 1, 
    borderTopColor: '#E5E7EB', 
    backgroundColor: 'white' 
  },
  navButton: { 
    alignItems: 'center', 
    flex: 1 
  },
  navText: { 
    fontSize: 12, 
    color: '#6B7280', 
    marginTop: 4 
  },
  navTextActive: { 
    color: '#3B82F6', 
    fontWeight: '600'
  }
});

export default HomeScreen;