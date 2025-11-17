import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar, 
  Alert, 
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import FloatingAI from './FloatingAI';
import UpcomingClassBanner from './UpcomingClassBanner';

import API_URL from '../config';

const HomeScreen = ({ navigation, route }) => {
  const userData = route.params?.user || {};
  const userId = userData?.id || route.params?.userId;
  const token = route.params?.token;
  
  // Changed to state so it can be updated on refresh
  const [userInfo, setUserInfo] = useState(route.params?.userInfo || userData);
  
  console.log('HomeScreen - User Data:', { userId, userInfo });
  
  const firstLetter = userInfo?.full_name ? userInfo.full_name.charAt(0).toUpperCase() : 'U';

  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [greeting, setGreeting] = useState('');
  const [isDaytime, setIsDaytime] = useState(true);

  const [nextClass, setNextClass] = useState(null);
  const [todaysClasses, setTodaysClasses] = useState([]);

  const [todos, setTodos] = useState([]);
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [newTodo, setNewTodo] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('medium');

  // Add refreshing state
  const [refreshing, setRefreshing] = useState(false);

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
      fetchTodos();
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
      
      const today = new Date();
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const currentDay = dayNames[today.getDay()];
      
      const todaysClassesList = allClasses.filter(classItem => 
        classItem.day_of_week === currentDay
      );
      
      todaysClassesList.sort((a, b) => a.start_time.localeCompare(b.start_time));
      
      setTodaysClasses(todaysClassesList);
      
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

  const fetchTodos = async () => {
    if (!userId) return;
    
    try {
      const response = await axios.get(`${API_URL}/todos/${userId}`);
      setTodos(response.data);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Fetch fresh user data
      const userResponse = await axios.get(`${API_URL}/users/${userId}`);
      setUserInfo(userResponse.data);
      
      // Refresh other data
      await fetchTodaysClasses();
      await fetchTodos();
      
      console.log('Data refreshed successfully');
    } catch (error) {
      console.error('Refresh error:', error);
      Alert.alert('Error', 'Could not refresh data');
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  const addTodo = async () => {
    if (!newTodo.trim()) {
      Alert.alert('Error', 'Please enter a task');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/todos/${userId}`, {
        task: newTodo,
        priority: selectedPriority
      });
      
      setTodos(prev => [response.data, ...prev]);
      setNewTodo('');
      setShowAddTodo(false);
      setSelectedPriority('medium');
    } catch (error) {
      console.error('Error adding todo:', error);
      Alert.alert('Error', 'Could not add task');
    }
  };

  const toggleTodo = async (todoId, currentStatus) => {
    try {
      await axios.put(`${API_URL}/todos/${todoId}`, {
        is_completed: !currentStatus
      });
      
      setTodos(prev => 
        prev.map(todo => 
          todo.id === todoId 
            ? { ...todo, is_completed: !currentStatus } 
            : todo
        )
      );
    } catch (error) {
      console.error('Error updating todo:', error);
      Alert.alert('Error', 'Could not update task');
    }
  };

  const deleteTodo = async (todoId) => {
    try {
      await axios.delete(`${API_URL}/todos/${todoId}`);
      setTodos(prev => prev.filter(todo => todo.id !== todoId));
    } catch (error) {
      console.error('Error deleting todo:', error);
      Alert.alert('Error', 'Could not delete task');
    }
  };

  const convertTo24Hour = (time12h) => {
    if (!time12h) return '00:00';
    
    if (time12h.match(/^\d{1,2}:\d{2}$/)) {
      return time12h.padStart(5, '0');
    }
    
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
    if (diffMinutes < 60) return `${diffMinutes}m`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;
    return `${diffHours}h ${remainingMinutes}m`;
  };

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

  const navigateToMessMenu = () => {
    navigation.navigate('MessMenuScreen');
  };

  const navigateToBusSchedule = () => {
    navigation.navigate('BusSchedule');
  };

  const navigateToMaps = () => {
    navigation.navigate('CampusMap', { userId, userInfo });
  };
  
  const quickAccessItems = [
    { 
      name: 'Nearby', 
      icon: 'location-outline',
      color: '#8b5cf6',
      onPress: navigateToMaps
    },
    { 
      name: 'Mess Menu', 
      icon: 'restaurant-outline',
      color: '#f59e0b',
      onPress: navigateToMessMenu
    },
    { 
      name: 'Bus', 
      icon: 'bus-outline',
      color: '#10b981',
      onPress: navigateToBusSchedule
    },
    { 
      name: 'Marketplace', 
      icon: 'storefront-outline',
      color: '#ec4899',
      onPress: () => navigation.navigate('Marketplace', { userId, userInfo })
    },
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
    { 
      name: 'Wellness',
      icon: 'heart-outline',
      onPress: () => navigation.navigate('WellnessHome', { userId })
    },
    { 
      name: 'Chat', 
      icon: 'chatbubble-outline',
      onPress: () => navigation.navigate('ChatList', { userId, userInfo })
    },
    { 
      name: 'Clubs', 
      icon: 'people-outline',
      onPress: () => navigation.navigate('ClubsHome', { userId, userInfo, token })
    },
  ];

  const renderNextClass = () => {
    if (!nextClass) {
      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="time-outline" size={20} color="#8b5cf6" />
              <Text style={styles.cardTitle}>Next Class</Text>
            </View>
          </View>
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#10b981" />
            <Text style={styles.emptyStateTitle}>All Done!</Text>
            <Text style={styles.emptyStateText}>No more classes today</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.card, styles.nextClassCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="time" size={18} color="#8b5cf6" />
            </View>
            <Text style={styles.cardTitle}>Next Class</Text>
          </View>
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>{calculateTimeUntil(nextClass.start_time)}</Text>
          </View>
        </View>
        <View style={styles.classContent}>
          <Text style={styles.className}>{nextClass.course_name}</Text>
          <View style={styles.classInfo}>
            <View style={styles.classInfoRow}>
              <Ionicons name="time-outline" size={14} color="#888" />
              <Text style={styles.classInfoText}>
                {nextClass.start_time} - {nextClass.end_time}
              </Text>
            </View>
            <View style={styles.classInfoRow}>
              <Ionicons name="person-outline" size={14} color="#888" />
              <Text style={styles.classInfoText}>{nextClass.teacher}</Text>
            </View>
            <View style={styles.classInfoRow}>
              <Ionicons name="location-outline" size={14} color="#888" />
              <Text style={styles.classInfoText}>{nextClass.room_number}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderTodoSection = () => {
    const pendingTodos = todos.filter(todo => !todo.is_completed);
    const completedTodos = todos.filter(todo => todo.is_completed);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-done" size={18} color="#10b981" />
            </View>
            <Text style={styles.cardTitle}>Tasks</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddTodo(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {pendingTodos.length > 0 && (
          <View style={styles.todoList}>
            {pendingTodos.slice(0, 5).map((todo) => (
              <View key={todo.id} style={styles.todoItem}>
                <TouchableOpacity 
                  style={styles.checkbox}
                  onPress={() => toggleTodo(todo.id, todo.is_completed)}
                  activeOpacity={0.8}
                >
                  <View style={styles.checkboxCircle} />
                </TouchableOpacity>
                <View style={styles.todoContent}>
                  <Text style={styles.todoText}>{todo.task}</Text>
                  <View style={[
                    styles.priorityDot,
                    todo.priority === 'high' && styles.priorityHigh,
                    todo.priority === 'medium' && styles.priorityMedium,
                    todo.priority === 'low' && styles.priorityLow,
                  ]} />
                </View>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => deleteTodo(todo.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {completedTodos.length > 0 && (
          <View style={styles.completedSection}>
            <Text style={styles.completedTitle}>Completed ({completedTodos.length})</Text>
            {completedTodos.slice(0, 3).map((todo) => (
              <View key={todo.id} style={styles.todoItem}>
                <TouchableOpacity 
                  style={styles.checkbox}
                  onPress={() => toggleTodo(todo.id, todo.is_completed)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                </TouchableOpacity>
                <View style={styles.todoContent}>
                  <Text style={[styles.todoText, styles.todoTextCompleted]}>
                    {todo.task}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => deleteTodo(todo.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {todos.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="checkbox-outline" size={48} color="#888" />
            <Text style={styles.emptyStateTitle}>No tasks yet</Text>
            <Text style={styles.emptyStateText}>Add your first task to get started</Text>
          </View>
        )}
      </View>
    );
  };

  const renderAddTodoModal = () => {
    return (
      <Modal
        visible={showAddTodo}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddTodo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Task</Text>
              <TouchableOpacity 
                onPress={() => setShowAddTodo(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="What needs to be done?"
              placeholderTextColor="#666"
              value={newTodo}
              onChangeText={setNewTodo}
              multiline
              maxLength={200}
            />
            
            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.priorityButtons}>
              {['low', 'medium', 'high'].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityButton,
                    selectedPriority === priority && styles.priorityButtonSelected
                  ]}
                  onPress={() => setSelectedPriority(priority)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.priorityButtonText,
                    selectedPriority === priority && styles.priorityButtonTextSelected
                  ]}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButtonCancel}
                onPress={() => setShowAddTodo(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonAdd}
                onPress={addTodo}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonAddText}>Add Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (!userId) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <Ionicons name="warning-outline" size={64} color="#ef4444" />
        <Text style={styles.errorTitle}>Access Denied</Text>
        <Text style={styles.errorMessage}>
          Please login to continue
        </Text>
        <TouchableOpacity 
          style={styles.errorButton}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
        >
          <Text style={styles.errorButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      {/* Updated Header with Settings Navigation */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.userName}>{userInfo?.full_name?.split(' ')[0] || 'Student'}</Text>
          <Text style={styles.dateTime}>{currentDate} • {currentTime}</Text>
        </View>
        <TouchableOpacity 
          style={styles.avatar} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Settings', { userId, userInfo })}
        >
          <Text style={styles.avatarText}>{firstLetter}</Text>
          <View style={styles.settingsBadge}>
            <Ionicons name="settings" size={10} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      {/* ScrollView with Pull-to-Refresh */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8b5cf6"
            colors={['#8b5cf6']}
          />
        }
      >
        
        {/* Upcoming Class Banner */}
        <UpcomingClassBanner userId={userId} />
        
        {renderNextClass()}

        {todaysClasses.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="calendar" size={18} color="#f59e0b" />
                </View>
                <Text style={styles.cardTitle}>Today's Schedule</Text>
              </View>
            </View>
            {todaysClasses.slice(0, 3).map((classItem, index) => (
              <View key={index} style={styles.scheduleItem}>
                <Text style={styles.scheduleTime}>{classItem.start_time}</Text>
                <View style={styles.scheduleDivider} />
                <View style={styles.scheduleDetails}>
                  <Text style={styles.scheduleCourse}>{classItem.course_name}</Text>
                  <Text style={styles.scheduleRoom}>{classItem.room_number}</Text>
                </View>
              </View>
            ))}
            {todaysClasses.length > 3 && (
              <TouchableOpacity 
                style={styles.viewMoreButton}
                onPress={navigateToAcademics}
                activeOpacity={0.8}
              >
                <Text style={styles.viewMoreText}>
                  +{todaysClasses.length - 3} more
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {renderTodoSection()}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="grid" size={18} color="#3b82f6" />
              </View>
              <Text style={styles.cardTitle}>Quick Access</Text>
            </View>
          </View>
          <View style={styles.quickGrid}>
            {quickAccessItems.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.quickItem}
                onPress={item.onPress}
                activeOpacity={0.8}
              >
                <View style={[styles.quickIcon, { backgroundColor: `${item.color}20` }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <Text style={styles.quickLabel}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {renderAddTodoModal()}

      <View style={styles.nav}>
        {navItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.navItem}
            onPress={item.onPress}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={item.icon} 
              size={22} 
              color={item.active ? '#8b5cf6' : '#666'} 
            />
            <Text style={[styles.navText, item.active && styles.navTextActive]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FloatingAI userId={userId} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  greeting: {
    fontSize: 13,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  dateTime: {
    fontSize: 13,
    color: '#666',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  settingsBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  nextClassCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  timeBadge: {
    backgroundColor: '#8b5cf620',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  classContent: {
    gap: 12,
  },
  className: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  classInfo: {
    gap: 8,
  },
  classInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  classInfoText: {
    fontSize: 13,
    color: '#888',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#666',
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  scheduleTime: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f59e0b',
    width: 60,
  },
  scheduleDivider: {
    width: 2,
    height: 24,
    backgroundColor: '#2a2a2a',
    marginHorizontal: 12,
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleCourse: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  scheduleRoom: {
    fontSize: 12,
    color: '#666',
  },
  viewMoreButton: {
    paddingTop: 12,
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: 13,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  todoList: {
    gap: 8,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#666',
  },
  todoContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todoText: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityHigh: {
    backgroundColor: '#ef4444',
  },
  priorityMedium: {
    backgroundColor: '#f59e0b',
  },
  priorityLow: {
    backgroundColor: '#10b981',
  },
  deleteButton: {
    padding: 4,
  },
  completedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  completedTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickItem: {
    width: '22%',
    alignItems: 'center',
    gap: 8,
  },
  quickIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
  },
  priorityButtonSelected: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  priorityButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  priorityButtonTextSelected: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888',
  },
  modalButtonAdd: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
  },
  modalButtonAddText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  bottomSpace: {
    height: 100,
  },
  nav: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  navTextActive: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
});

export default HomeScreen;