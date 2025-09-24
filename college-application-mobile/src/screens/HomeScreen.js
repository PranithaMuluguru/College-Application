import React, { useState, useEffect } from 'react';
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
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = 'http://10.32.9.125:8000'; // Ensure this is the correct API URL

const HomeScreen = ({ navigation, route }) => {
  // Properly extract user data from route.params
  const userData = route.params?.user || {};
  const userId = userData?.id || route.params?.userId;
  const userInfo = route.params?.userInfo || userData;
  const token = route.params?.token; // Get the token for authenticated requests
  
  console.log('HomeScreen - User Data:', { userId, userInfo });
  
  // Determine the first letter for the profile circle
  const firstLetter = userInfo?.full_name ? userInfo.full_name.charAt(0).toUpperCase() : 'U';

  // State for time, date, greeting, and day/night mode
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [greeting, setGreeting] = useState('');
  const [isDaytime, setIsDaytime] = useState(true);

  // State for timetable data
  const [nextClass, setNextClass] = useState(null);
  const [todaysClasses, setTodaysClasses] = useState([]);

  // State for todos
  const [todos, setTodos] = useState([]);
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [newTodo, setNewTodo] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('medium');

  // Effect to update time, date, and greeting every minute
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      // Format time and date for display
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }));

      // Update greeting and day/night mode based on time
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
    
    updateDateTime(); // Initial call
    const interval = setInterval(updateDateTime, 60000); // Update every minute
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  // Effect to fetch today's classes when the component mounts or userId changes
  useEffect(() => {
    if (userId) {
      console.log('Fetching timetable for user:', userId);
      fetchTodaysClasses();
      fetchTodos();
    } else {
      console.log('User ID not available for fetching timetable');
    }
  }, [userId]);

  // Function to fetch today's classes from the API
  const fetchTodaysClasses = async () => {
    if (!userId) return; // Exit if userId is not available
    
    try {
      console.log('Fetching timetable from:', `${API_URL}/timetable/${userId}`);
      // Use axios to make a GET request to the timetable endpoint
      const response = await axios.get(`${API_URL}/timetable/${userId}`);
      const allClasses = response.data;
      
      // Get current day of the week
      const today = new Date();
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const currentDay = dayNames[today.getDay()];
      
      // Filter classes for the current day
      const todaysClassesList = allClasses.filter(classItem => 
        classItem.day_of_week === currentDay
      );
      
      // Sort classes by their start time
      todaysClassesList.sort((a, b) => a.start_time.localeCompare(b.start_time));
      
      setTodaysClasses(todaysClassesList); // Update state with today's classes
      
      // Determine the next upcoming class
      const currentTimeStr = today.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false // Use 24-hour format for comparison
      });
      
      const upcomingClass = todaysClassesList.find(classItem => {
        const classTime = convertTo24Hour(classItem.start_time); // Convert class start time to 24h format
        return classTime > currentTimeStr; // Find the first class that starts after the current time
      });
      
      setNextClass(upcomingClass); // Update state with the next class
      
    } catch (error) {
      console.error('Error fetching today\'s classes:', error);
      // Optionally show an alert to the user
      // Alert.alert('Error', 'Could not load today\'s classes.');
    }
  };

  // Function to fetch todos from the API
  const fetchTodos = async () => {
    if (!userId) return;
    
    try {
      const response = await axios.get(`${API_URL}/todos/${userId}`);
      setTodos(response.data);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  // Function to add a new todo
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

  // Function to toggle todo completion
  const toggleTodo = async (todoId, currentStatus) => {
    try {
      const response = await axios.put(`${API_URL}/todos/${todoId}`, {
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

  // Function to delete todo
  const deleteTodo = async (todoId) => {
    try {
      await axios.delete(`${API_URL}/todos/${todoId}`);
      setTodos(prev => prev.filter(todo => todo.id !== todoId));
    } catch (error) {
      console.error('Error deleting todo:', error);
      Alert.alert('Error', 'Could not delete task');
    }
  };

  // Helper function to convert 12-hour time format to 24-hour format
  const convertTo24Hour = (time12h) => {
    if (!time12h) return '00:00'; // Return midnight if time is invalid
    
    // Check if it's already in 24-hour format (e.g., "09:00" or "17:30")
    if (time12h.match(/^\d{1,2}:\d{2}$/)) {
      return time12h.padStart(5, '0'); // Ensure format like "09:00"
    }
    
    // Parse 12-hour time with AM/PM
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    // Handle the '12' hour case correctly
    if (hours === '12') hours = '00'; // 12 AM becomes 00 hours
    if (modifier && modifier.toUpperCase() === 'PM') {
      hours = parseInt(hours, 10) + 12; // Add 12 for PM hours (except 12 PM)
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`; // Format as HH:MM
  };

  // Helper function to calculate time remaining until a class
  const calculateTimeUntil = (classTime) => {
    if (!classTime) return '';
    
    const now = new Date();
    const [hours, minutes] = classTime.split(':');
    const classDateTime = new Date();
    classDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0); // Set class time
    
    const diff = classDateTime - now; // Difference in milliseconds
    
    if (diff <= 0) return 'Now'; // If class has already started or is current
    
    const diffMinutes = Math.floor(diff / (1000 * 60)); // Difference in minutes
    if (diffMinutes < 60) return `In ${diffMinutes} mins`; // If less than an hour
    
    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;
    return `In ${diffHours}h ${remainingMinutes}m`; // Format as hours and minutes
  };

  // Navigation handler for Academics screen
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

  // Navigation handler for Mess Menu screen
  const navigateToMessMenu = () => {
    navigation.navigate('MessMenuScreen'); // Assuming you have a MessMenu screen
  };

  const navigateToBusSchedule = () => {
    navigation.navigate('BusSchedule');
  };

  // Define items for the "Quick Access" section
  const quickAccessItems = [
    { 
      name: 'Academics', 
      icon: 'calendar-outline', // Ionicons name
      onPress: navigateToAcademics
    },
    { 
      name: 'Mess Menu', 
      icon: 'restaurant-outline',
      onPress: navigateToMessMenu // Navigate to the new Mess Menu screen
    },
    { 
      name: 'Bus Schedule', 
      icon: 'bus-outline', 
      onPress: navigateToBusSchedule
    },
    { 
      name: 'Rewards', 
      icon: 'trophy-outline', 
      onPress: () => Alert.alert('Coming Soon', 'Rewards feature is under development') 
    }
  ];

  // Define items for the bottom navigation bar
  const navItems = [
    { 
      name: 'Home', 
      icon: 'home', 
      active: true, // This is the active tab
      onPress: () => {} // Already on home
    },
    { 
      name: 'Academics', 
      icon: 'book-outline',
      onPress: navigateToAcademics
    },
    { 
      name: 'Mess', 
      icon: 'restaurant-outline', 
      onPress: navigateToMessMenu 
    },
    { 
      name: 'Clubs', 
      icon: 'people-outline', 
      onPress: () => Alert.alert('Coming Soon', 'Clubs feature is under development') 
    },
    { 
      name: 'Map', 
      icon: 'map-outline', 
      onPress: () => Alert.alert('Coming Soon', 'Map feature is under development') 
    }
  ];

  // Function to render the "Next Class" card
  const renderNextClass = () => {
    if (!nextClass) { // If there are no more classes today
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

    // Render details for the next class
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
        {/* Button to view the full timetable */}
        <TouchableOpacity 
          style={styles.viewTimetableBtn}
          onPress={navigateToAcademics}
        >
          <Text style={styles.viewTimetableText}>View Full Timetable</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Function to render Todo section
  const renderTodoSection = () => {
    const pendingTodos = todos.filter(todo => !todo.is_completed);
    const completedTodos = todos.filter(todo => todo.is_completed);

    return (
      <View style={styles.card}>
        <View style={styles.classHeader}>
          <Ionicons name="checkbox-outline" size={20} color="#3B82F6" />
          <Text style={styles.cardTitle}>My Todo List</Text>
          <TouchableOpacity 
            style={styles.addTodoBtn}
            onPress={() => setShowAddTodo(true)}
          >
            <Ionicons name="add-outline" size={16} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        
        {/* Pending Todos */}
        {pendingTodos.length > 0 && (
          <View style={styles.todoSection}>
            {pendingTodos.slice(0, 5).map((todo) => (
              <View key={todo.id} style={styles.todoItem}>
                <TouchableOpacity 
                  style={styles.checkbox}
                  onPress={() => toggleTodo(todo.id, todo.is_completed)}
                >
                  <Ionicons 
                    name={todo.is_completed ? "checkbox" : "square-outline"} 
                    size={20} 
                    color="#3B82F6" 
                  />
                </TouchableOpacity>
                <View style={styles.todoContent}>
                  <Text style={[
                    styles.todoText, 
                    todo.is_completed && styles.todoTextCompleted
                  ]}>
                    {todo.task}
                  </Text>
                  <View style={styles.todoPriorityContainer}>
                    <View style={[
                      styles.priorityBadge,
                      todo.priority === 'high' && styles.priorityHigh,
                      todo.priority === 'medium' && styles.priorityMedium,
                      todo.priority === 'low' && styles.priorityLow,
                    ]}>
                      <Text style={styles.priorityText}>{todo.priority}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.deleteBtn}
                  onPress={() => deleteTodo(todo.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Completed Todos */}
        {completedTodos.length > 0 && (
          <View style={styles.completedSection}>
            <Text style={styles.completedSectionTitle}>
              Completed ({completedTodos.length})
            </Text>
            {completedTodos.slice(0, 3).map((todo) => (
              <View key={todo.id} style={styles.todoItem}>
                <TouchableOpacity 
                  style={styles.checkbox}
                  onPress={() => toggleTodo(todo.id, todo.is_completed)}
                >
                  <Ionicons name="checkbox" size={20} color="#10B981" />
                </TouchableOpacity>
                <View style={styles.todoContent}>
                  <Text style={[styles.todoText, styles.todoTextCompleted]}>
                    {todo.task}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.deleteBtn}
                  onPress={() => deleteTodo(todo.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {todos.length === 0 && (
          <View style={styles.emptyTodoState}>
            <Text style={styles.noTodoText}>No tasks yet</Text>
            <Text style={styles.noTodoSubtext}>Add your first task to get started!</Text>
          </View>
        )}
      </View>
    );
  };

  // Add Todo Modal
  const renderAddTodoModal = () => {
    return (
      <Modal
        visible={showAddTodo}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddTodo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Task</Text>
              <TouchableOpacity onPress={() => setShowAddTodo(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.todoInput}
              placeholder="Enter your task..."
              value={newTodo}
              onChangeText={setNewTodo}
              multiline
              maxLength={200}
            />
            
            <Text style={styles.priorityLabel}>Priority</Text>
            <View style={styles.priorityContainer}>
              {['low', 'medium', 'high'].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityOption,
                    selectedPriority === priority && styles.priorityOptionSelected
                  ]}
                  onPress={() => setSelectedPriority(priority)}
                >
                  <Text style={[
                    styles.priorityOptionText,
                    selectedPriority === priority && styles.priorityOptionTextSelected
                  ]}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonCancel}
                onPress={() => setShowAddTodo(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonAdd}
                onPress={addTodo}
              >
                <Text style={styles.modalButtonAddText}>Add Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Handle case where user data is not available (e.g., not logged in properly)
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
            onPress={() => navigation.navigate('Login')} // Navigate back to Login screen
          >
            <Text style={styles.retryButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main screen layout
  return (
    <View style={[styles.container, !isDaytime && styles.nightContainer]}>
      {/* Status bar style based on day/night mode */}
      <StatusBar barStyle={isDaytime ? "dark-content" : "light-content"} backgroundColor={isDaytime ? "#F9FAFB" : "#1F2937"} />

      {/* Header Section */}
      <View style={styles.header}>
        <View>
          {/* Greeting and User's Name */}
          <Text style={styles.greeting}>{greeting}, {userInfo?.full_name?.split(' ')[0] || 'Student'}!</Text>
          {/* Current Time and Date */}
          <Text style={styles.time}>{currentTime} · {currentDate}</Text>
        </View>
        {/* Profile Circle */}
        <TouchableOpacity style={styles.profileCircle}>
          <Text style={styles.profileLetter}>{firstLetter}</Text>
        </TouchableOpacity>
      </View>

      {/* Content ScrollView */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Next Class Card */}
        {renderNextClass()}

        {/* Today's Schedule Overview Card */}
        {todaysClasses.length > 0 && (
          <View style={styles.card}>
            <View style={styles.classHeader}>
              <Ionicons name="list-outline" size={20} color="#3B82F6" />
              <Text style={styles.cardTitle}>Today's Schedule</Text>
            </View>
            {/* Display up to 3 classes */}
            {todaysClasses.slice(0, 3).map((classItem, index) => (
              <View key={index} style={styles.scheduleItem}>
                <Text style={styles.scheduleTime}>{classItem.start_time}</Text>
                <Text style={styles.scheduleCourse}>{classItem.course_name}</Text>
                <Text style={styles.scheduleRoom}>{classItem.room_number}</Text>
              </View>
            ))}
            {/* "View more" button if there are more than 3 classes */}
            {todaysClasses.length > 3 && (
              <TouchableOpacity 
                style={styles.viewMoreBtn}
                onPress={navigateToAcademics} // Link to full timetable
              >
                <Text style={styles.viewMoreText}>View {todaysClasses.length - 3} more classes</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Todo Section */}
        {renderTodoSection()}

        {/* Quick Access Section */}
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

        {/* Academic Info Section */}
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

      {/* Add Todo Modal */}
      {renderAddTodoModal()}

      {/* Bottom Navigation Bar */}
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

// Styles for the HomeScreen components
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  nightContainer: { backgroundColor: '#1F2937' }, // Dark background for night mode
  errorContainer: {
    flex: 1,
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
    color: '#FF6B6B', // Red color for error title
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
    backgroundColor: '#3B82F6', // Blue button color
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
    paddingTop: 50 // Ensure space for status bar
  },
  greeting: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#111827' // Dark text color
  },
  time: { 
    fontSize: 14, 
    color: '#6B7280', // Gray text color
    marginTop: 4 
  },
  profileCircle: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, // Make it circular
    backgroundColor: '#3B82F6', // Blue background
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
    // Subtle shadow for depth
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2 // for Android shadow
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
    color: '#111827', 
    flex: 1 
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
    backgroundColor: '#E5E7EB', // Light gray background
    paddingVertical: 4, 
    paddingHorizontal: 8, 
    borderRadius: 12 // Pill shape
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
    borderColor: '#3B82F6', // Blue border
    alignItems: 'center' 
  },
  viewTimetableText: { 
    color: '#3B82F6', 
    fontWeight: '600' 
  },
  emptyClassState: { // Style for when there are no more classes
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
  scheduleItem: { // Style for each item in the "Today's Schedule" list
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6', // Very light gray separator
  },
  scheduleTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6', // Blue time
    width: 60, // Fixed width for alignment
  },
  scheduleCourse: {
    flex: 1, // Take remaining space
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 12,
  },
  scheduleRoom: {
    fontSize: 12,
    color: '#6B7280',
  },
  viewMoreBtn: { // Button to view more schedule items
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
    justifyContent: 'space-between', // Distribute items evenly
    flexWrap: 'wrap' // Allow wrapping to next line
  },
  quickAccessItem: { 
    width: '23%', // Approx 4 items per row
    aspectRatio: 1, // Keep items square
    backgroundColor: '#EFF6FF', // Light blue background
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
  academicInfo: { // Container for academic details
    paddingVertical: 8,
  },
  academicInfoText: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  
  // Todo Section Styles
  addTodoBtn: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todoSection: {
    marginTop: 8,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  checkbox: {
    marginRight: 12,
  },
  todoContent: {
    flex: 1,
  },
  todoText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  todoPriorityContainer: {
    marginTop: 4,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  priorityHigh: {
    backgroundColor: '#FEE2E2',
  },
  priorityMedium: {
    backgroundColor: '#FEF3C7',
  },
  priorityLow: {
    backgroundColor: '#D1FAE5',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#374151',
  },
  deleteBtn: {
    padding: 4,
  },
  completedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  completedSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyTodoState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noTodoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  noTodoSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  todoInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  priorityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  priorityOptionSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  priorityOptionTextSelected: {
    color: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalButtonAdd: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  modalButtonAddText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  
  bottomNav: { // Bottom navigation bar styling
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderTopWidth: 1, 
    borderTopColor: '#E5E7EB', // Light gray border
    backgroundColor: 'white' 
  },
  navButton: { 
    alignItems: 'center', 
    flex: 1 // Distribute space equally
  },
  navText: { 
    fontSize: 12, 
    color: '#6B7280', 
    marginTop: 4 
  },
  navTextActive: { // Style for the active navigation item
    color: '#3B82F6', 
    fontWeight: '600'
  }
});

export default HomeScreen;