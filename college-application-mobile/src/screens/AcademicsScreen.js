import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  Modal,
  TextInput,
  SafeAreaView,
  Dimensions,
  FlatList,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import ClockTimePicker from './ClockTimePicker';
import CalendarPicker from './CalendarPicker';
import API_URL from '../config';
const API_BASE_URL = API_URL;

const { width } = Dimensions.get('window');

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const AcademicsScreen = ({ route, navigation }) => {
  const { userId, userInfo } = route.params || {};
  const currentUserId = userId || userInfo?.id;
  
  const [activeTab, setActiveTab] = useState('Timetable');
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [timetableData, setTimetableData] = useState({});
  const [examData, setExamData] = useState([]);
  const [gradesData, setGradesData] = useState([]);
  const [cgpaInfo, setCgpaInfo] = useState({ cgpa: 0, total_credits: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState({});
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerType, setTimePickerType] = useState('start');
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  
  // Course-based attendance tracking
  const [coursesData, setCoursesData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [courseAttendanceStats, setCourseAttendanceStats] = useState({});
  const [courseAttendance, setCourseAttendance] = useState({});

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const tabs = ['Timetable', 'Exams', 'Grades'];

  // Get today's day in abbreviated format (Mon, Tue, etc.)
  const getTodayDay = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[new Date().getDay()];
  };

  // Set selected day to today on first load
  useEffect(() => {
    const today = getTodayDay();
    if (days.includes(today)) {
      setSelectedDay(today);
    }
  }, []);

  // Memoized fetch functions to prevent infinite loops
  const fetchTimetable = useCallback(async () => {
    if (!currentUserId || loading) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/timetable/${currentUserId}`);
      
      const organized = {};
      days.forEach(day => { organized[day] = []; });
      
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach(item => {
          if (organized[item.day_of_week]) {
            organized[item.day_of_week].push(item);
          }
        });
        
        Object.keys(organized).forEach(day => {
          organized[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
        });
      }
      
      setTimetableData(organized);
    } catch (error) {
      console.error('Error fetching timetable:', error);
      Alert.alert('Error', 'Failed to fetch timetable');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, loading]);

  const fetchAttendance = useCallback(async () => {
    if (!currentUserId || loading) return;

    try {
      const response = await axios.get(`${API_URL}/attendance/${currentUserId}`);
      
      const organized = {};
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach(item => {
          if (!organized[item.timetable_entry_id]) {
            organized[item.timetable_entry_id] = [];
          }
          organized[item.timetable_entry_id].push(item);
        });
      }
      
      setAttendanceData(organized);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendanceData({});
    }
  }, [currentUserId, loading]);

  const fetchCourses = useCallback(async () => {
    if (!currentUserId || loading) return;
    
    try {
      const response = await axios.get(`${API_URL}/courses/${currentUserId}`);
      setCoursesData(response.data || []);
      
      if (response.data && response.data.length > 0) {
        const statsPromises = response.data.map(course => 
          axios.get(`${API_URL}/attendance/course-stats/${currentUserId}/${course.id}`)
        );
        
        try {
          const statsResults = await Promise.all(statsPromises);
          const stats = {};
          statsResults.forEach((result, index) => {
            stats[response.data[index].id] = result.data;
          });
          setCourseAttendanceStats(stats);
        } catch (statsError) {
          console.error('Error fetching course stats:', statsError);
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCoursesData([]);
    }
  }, [currentUserId, loading]);

  const fetchCourseAttendance = useCallback(async () => {
    if (!currentUserId || loading) return;
    
    try {
      const response = await axios.get(`${API_URL}/attendance/course-stats/${currentUserId}`);
      
      if (response.data && typeof response.data === 'object') {
        setCourseAttendance(response.data);
      }
    } catch (error) {
      console.error('Error fetching course attendance:', error);
      setCourseAttendance({});
    }
  }, [currentUserId, loading]);

  const fetchExams = useCallback(async () => {
    if (!currentUserId || loading) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/exams/${currentUserId}`);
      setExamData(response.data || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
      Alert.alert('Error', 'Failed to fetch exams');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, loading]);

  const fetchGrades = useCallback(async () => {
    if (!currentUserId || loading) return;

    try {
      setLoading(true);
      const [gradesResponse, cgpaResponse] = await Promise.all([
        axios.get(`${API_URL}/grades/${currentUserId}`),
        axios.get(`${API_URL}/grades/cgpa/${currentUserId}`)
      ]);
      setGradesData(gradesResponse.data || []);
      setCgpaInfo(cgpaResponse.data || { cgpa: 0, total_credits: 0 });
    } catch (error) {
      console.error('Error fetching grades:', error);
      Alert.alert('Error', 'Failed to fetch grades');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, loading]);

  // Fixed useEffect to prevent infinite loops
  useEffect(() => {
    if (!currentUserId) {
      console.log('User ID not available');
      return;
    }

    const loadData = async () => {
      if (activeTab === 'Timetable') {
        await fetchTimetable();
        await fetchAttendance();
        await fetchCourses();
        await fetchCourseAttendance();
      } else if (activeTab === 'Exams') {
        await fetchExams();
      } else if (activeTab === 'Grades') {
        await fetchGrades();
      }
    };

    loadData();
  }, [activeTab, currentUserId]);

  const markAttendance = async (status) => {
    if (!currentUserId || !selectedClassForAttendance) {
      Alert.alert('Error', 'Could not mark attendance');
      return;
    }

    try {
      setLoading(true);
      
      const response = await axios.post(`${API_URL}/attendance/${currentUserId}`, {
        timetable_entry_id: selectedClassForAttendance.id,
        status: status,
        date: selectedDate
      });
      
      const newAttendanceData = { ...attendanceData };
      if (!newAttendanceData[selectedClassForAttendance.id]) {
        newAttendanceData[selectedClassForAttendance.id] = [];
      }
      
      const existingIndex = newAttendanceData[selectedClassForAttendance.id].findIndex(
        entry => entry.date === selectedDate
      );
      
      if (existingIndex >= 0) {
        newAttendanceData[selectedClassForAttendance.id][existingIndex] = response.data;
      } else {
        newAttendanceData[selectedClassForAttendance.id].push(response.data);
      }
      
      setAttendanceData(newAttendanceData);
      
      await fetchCourseAttendance();
      await fetchCourses();
      
      Alert.alert('Success', `Attendance marked as ${status} for ${new Date(selectedDate).toLocaleDateString()}`);
      setShowAttendanceModal(false);
      
    } catch (error) {
      console.error('Error marking attendance:', error);
      Alert.alert('Error', 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  // Updated attendance analytics - default to absent if not marked
  const getAttendanceAnalytics = (classItem) => {
    const courseStats = Object.values(courseAttendance).find(stat => 
      stat.course_name === classItem.course_name
    );
    
    if (courseStats) {
      return {
        total: courseStats.total_classes,
        present: courseStats.present,
        absent: courseStats.absent,
        canceled: courseStats.cancelled,
        percentage: courseStats.attendance_percentage
      };
    }
    
    const entries = attendanceData[classItem.id] || [];
    
    // Calculate total classes that should have happened (assuming semester started)
    const semesterStart = new Date('2024-08-01'); // Adjust based on your semester start
    const today = new Date();
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(classItem.day_of_week);
    
    let totalExpectedClasses = 0;
    for (let d = new Date(semesterStart); d <= today; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === dayOfWeek) {
        totalExpectedClasses++;
      }
    }
    
    const present = entries.filter(e => e.status === 'present').length;
    const absent = entries.filter(e => e.status === 'absent').length;
    const canceled = entries.filter(e => e.status === 'cancelled').length;
    
    // If no entry exists for expected classes, consider them absent
    const totalMarked = present + absent + canceled;
    const unmarkedClasses = Math.max(0, totalExpectedClasses - totalMarked);
    const totalAbsent = absent + unmarkedClasses;
    
    const attendancePercentage = totalExpectedClasses > 0 ? 
      Math.round((present / (present + totalAbsent || 1)) * 100) : 0;
    
    return { 
      total: totalExpectedClasses, 
      present, 
      absent: totalAbsent, 
      canceled, 
      percentage: attendancePercentage 
    };
  };

  const getAttendanceColorIndicator = (classItem) => {
    const analytics = getAttendanceAnalytics(classItem);
    
    if (analytics.total === 0) return '#888';
    if (analytics.percentage >= 80) return '#22c55e';
    if (analytics.percentage >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const saveItem = async () => {
    if (!currentUserId) {
      Alert.alert('Error', 'User ID not available');
      return;
    }

    // Validation logic for different tabs
    if (activeTab === 'Timetable') {
      const required = ['course_name', 'start_time', 'end_time', 'teacher', 'room_number'];
      const missing = required.filter(field => !formData[field] || formData[field].trim() === '');
      if (missing.length > 0) {
        Alert.alert('Error', `Please fill in all required fields: ${missing.join(', ')}`);
        return;
      }
    } else if (activeTab === 'Exams') {
      const required = ['exam_name', 'date', 'room_number'];
      const missing = required.filter(field => !formData[field] || formData[field].trim() === '');
      if (missing.length > 0) {
        Alert.alert('Error', `Please fill in all required fields: ${missing.join(', ')}`);
        return;
      }
    } else if (activeTab === 'Grades') {
      const required = ['course_name', 'credits', 'grade', 'semester'];
      const missing = required.filter(field => !formData[field] || formData[field].toString().trim() === '');
      if (missing.length > 0) {
        Alert.alert('Error', `Please fill in all required fields: ${missing.join(', ')}`);
        return;
      }
    }

    try {
      setLoading(true);
      let endpoint, data;
      
      if (activeTab === 'Timetable') {
        if (editingItem) {
          endpoint = `${API_URL}/timetable/${editingItem.id}`;
        } else {
          endpoint = `${API_URL}/timetable/${currentUserId}`;
        }
        data = formData;
      } else if (activeTab === 'Exams') {
        if (editingItem) {
          endpoint = `${API_URL}/exams/${editingItem.id}`;
        } else {
          endpoint = `${API_URL}/exams/${currentUserId}`;
        }
        data = formData;
      } else if (activeTab === 'Grades') {
        if (editingItem) {
          endpoint = `${API_URL}/grades/${editingItem.id}`;
        } else {
          endpoint = `${API_URL}/grades/${currentUserId}`;
        }
        data = { 
          ...formData, 
          credits: parseFloat(formData.credits) || 0 
        };
      }

      if (editingItem) {
        await axios.put(endpoint, data);
        Alert.alert('Success', `${activeTab.slice(0, -1)} updated successfully`);
      } else {
        await axios.post(endpoint, data);
        Alert.alert('Success', `${activeTab.slice(0, -1)} added successfully`);
      }

      setModalVisible(false);
      setEditingItem(null);
      setFormData({});
      
      if (activeTab === 'Timetable') {
        await fetchTimetable();
        await fetchCourses();
        await fetchCourseAttendance();
      } else if (activeTab === 'Exams') {
        await fetchExams();
      } else if (activeTab === 'Grades') {
        await fetchGrades();
      }
      
    } catch (error) {
      console.error('Error saving item:', error);
      const errorMsg = error.response?.data?.detail || 'Unknown error occurred';
      Alert.alert('Error', `Failed to save ${activeTab.slice(0, -1).toLowerCase()}: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (item) => {
    if (!currentUserId) {
      Alert.alert('Error', 'User ID not available');
      return;
    }

    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete this ${activeTab.slice(0, -1).toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              let endpoint;
              if (activeTab === 'Timetable') endpoint = `${API_URL}/timetable/${item.id}`;
              else if (activeTab === 'Exams') endpoint = `${API_URL}/exams/${item.id}`;
              else if (activeTab === 'Grades') endpoint = `${API_URL}/grades/${item.id}`;
              
              await axios.delete(endpoint);
              Alert.alert('Success', `${activeTab.slice(0, -1)} deleted successfully`);
              
              if (activeTab === 'Timetable') {
                await fetchTimetable();
                await fetchCourses();
                await fetchCourseAttendance();
              } else if (activeTab === 'Exams') {
                await fetchExams();
              } else if (activeTab === 'Grades') {
                await fetchGrades();
              }
              
            } catch (error) {
              console.error('Error deleting item:', error);
              const errorMsg = error.response?.data?.detail || 'Unknown error occurred';
              Alert.alert('Error', `Failed to delete item: ${errorMsg}`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const openModal = (item = null) => {
    if (!currentUserId) {
      Alert.alert('Error', 'User ID not available');
      return;
    }

    setEditingItem(item);
    if (activeTab === 'Timetable') {
      setFormData(item ? {
        day_of_week: item.day_of_week,
        course_name: item.course_name,
        start_time: item.start_time,
        end_time: item.end_time,
        teacher: item.teacher,
        room_number: item.room_number
      } : {
        day_of_week: selectedDay,
        course_name: '',
        start_time: '',
        end_time: '',
        teacher: '',
        room_number: ''
      });
    } else if (activeTab === 'Exams') {
      setFormData(item ? {
        exam_name: item.exam_name,
        date: item.date,
        room_number: item.room_number,
        additional_notes: item.additional_notes || ''
      } : {
        exam_name: '',
        date: '',
        room_number: '',
        additional_notes: ''
      });
    } else if (activeTab === 'Grades') {
      setFormData(item ? {
        course_name: item.course_name,
        credits: item.credits.toString(),
        grade: item.grade,
        semester: item.semester
      } : {
        course_name: '',
        credits: '',
        grade: '',
        semester: ''
      });
    }
    setModalVisible(true);
  };

  const showAttendanceOptions = (classItem) => {
    setSelectedClassForAttendance(classItem);
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setShowAttendanceModal(true);
  };

  const showClassAnalytics = (classItem) => {
    setSelectedClassForAttendance(classItem);
    setShowAnalyticsModal(true);
  };

  // Enhanced time picker functions
  const openTimePicker = (type) => {
    setTimePickerType(type);
    setShowTimePicker(true);
  };

  const handleTimeSelection = (time) => {
    if (timePickerType === 'start') {
      setFormData({...formData, start_time: time});
    } else {
      setFormData({...formData, end_time: time});
    }
    setShowTimePicker(false);
  };

  // Add date selection handler
  const handleDateSelection = (date) => {
    setFormData({...formData, date: date});
    setShowCalendarPicker(false);
  };

  // Render functions
  const renderTimetableContent = () => (
    <View style={styles.contentContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
        {days.map(day => (
          <TouchableOpacity
            key={day}
            style={[styles.dayButton, selectedDay === day && styles.selectedDayButton]}
            onPress={() => setSelectedDay(day)}
            activeOpacity={0.8}
          >
            <Text style={[styles.dayButtonText, selectedDay === day && styles.selectedDayText]}>
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      <View style={styles.scheduleContainer}>
        {!loading && timetableData[selectedDay]?.length > 0 ? (
          timetableData[selectedDay].map((classItem) => {
            const analytics = getAttendanceAnalytics(classItem);
            const attendanceColor = getAttendanceColorIndicator(classItem);
            
            return (
              <View key={classItem.id} style={styles.classCardContainer}>
                <TouchableOpacity
                  style={[styles.classCard, {borderLeftColor: attendanceColor}]}
                  onLongPress={() => deleteItem(classItem)}
                  onPress={() => openModal(classItem)}
                  activeOpacity={0.8}
                >
                  <View style={styles.timeIndicator}>
                    <Text style={styles.timeText}>{classItem.start_time}</Text>
                    <View style={styles.timeDivider} />
                    <Text style={styles.timeText}>{classItem.end_time}</Text>
                  </View>
                  <View style={styles.classDetails}>
                    <Text style={styles.className}>{classItem.course_name}</Text>
                    <View style={styles.classInfo}>
                      <Ionicons name="person-outline" size={14} color="#888" />
                      <Text style={styles.classInfoText}>{classItem.teacher}</Text>
                    </View>
                    <View style={styles.classInfo}>
                      <Ionicons name="location-outline" size={14} color="#888" />
                      <Text style={styles.classInfoText}>{classItem.room_number}</Text>
                    </View>
                    
                    {analytics.total > 0 && (
                      <View style={styles.attendancePreview}>
                        <Text style={[styles.attendancePercentage, {color: attendanceColor}]}>
                          {analytics.percentage}% Attendance
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                
                <View style={styles.classCardActions}>
                  <TouchableOpacity 
                    style={styles.classActionButton}
                    onPress={() => showAttendanceOptions(classItem)}
                  >
                    <Ionicons name="checkbox-outline" size={16} color="#3b82f6" />
                    <Text style={styles.classActionText}>Attendance</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.classActionButton}
                    onPress={() => showClassAnalytics(classItem)}
                  >
                    <Ionicons name="analytics-outline" size={16} color="#3b82f6" />
                    <Text style={styles.classActionText}>Analytics</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#666" />
            <Text style={styles.emptyStateText}>No classes scheduled</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => openModal()}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>Add Class</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderExamsContent = () => (
    <View style={styles.contentContainer}>
      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {!loading && examData.length > 0 ? (
        examData.map((exam) => (
          <TouchableOpacity
            key={exam.id}
            style={styles.examCard}
            onLongPress={() => deleteItem(exam)}
            onPress={() => openModal(exam)}
            activeOpacity={0.8}
          >
            <View style={styles.examHeader}>
              <Text style={styles.examName}>{exam.exam_name}</Text>
              <View style={styles.examBadge}>
                <Ionicons name="school-outline" size={16} color="#fff" />
              </View>
            </View>
            <Text style={styles.examDate}>
              {new Date(exam.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            <View style={styles.examInfo}>
              <Ionicons name="location-outline" size={14} color="#888" />
              <Text style={styles.examRoom}>Room: {exam.room_number}</Text>
            </View>
            {exam.additional_notes && (
              <Text style={styles.examNotes}>{exam.additional_notes}</Text>
            )}
          </TouchableOpacity>
        ))
      ) : !loading && (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color="#666" />
          <Text style={styles.emptyStateText}>No exams scheduled</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => openModal()}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>Add Exam</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderGradesContent = () => (
    <View style={styles.contentContainer}>
      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {!loading && (
        <>
          <View style={styles.cgpaCard}>
            <View style={styles.cgpaHeader}>
              <Ionicons name="trophy-outline" size={32} color="#f59e0b" />
              <View style={styles.cgpaInfo}>
                <Text style={styles.cgpaLabel}>Current CGPA</Text>
                <Text style={styles.cgpaValue}>{cgpaInfo.cgpa.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.creditsInfo}>
              <Text style={styles.creditsLabel}>Total Credits Completed</Text>
              <Text style={styles.creditsValue}>{cgpaInfo.total_credits}</Text>
            </View>
          </View>

          {gradesData.length > 0 ? (
            gradesData.map((grade) => (
              <TouchableOpacity
                key={grade.id}
                style={styles.gradeCard}
                onLongPress={() => deleteItem(grade)}
                onPress={() => openModal(grade)}
                activeOpacity={0.8}
              >
                <View style={styles.gradeHeader}>
                  <Text style={styles.courseName}>{grade.course_name}</Text>
                  <View style={styles.gradeBadge}>
                    <Text style={styles.gradeValue}>{grade.grade}</Text>
                  </View>
                </View>
                <View style={styles.gradeFooter}>
                  <Text style={styles.semesterText}>Semester {grade.semester}</Text>
                  <Text style={styles.creditsText}>{grade.credits} credits</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : !loading && (
            <View style={styles.emptyState}>
              <Ionicons name="school-outline" size={64} color="#666" />
              <Text style={styles.emptyStateText}>No grades recorded</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => openModal()}
                activeOpacity={0.8}
              >
                <Text style={styles.addButtonText}>Add Grade</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );

  const renderModalContent = () => (
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>
          {editingItem ? 'Edit' : 'Add'} {activeTab.slice(0, -1)}
        </Text>
        <TouchableOpacity
          onPress={() => setModalVisible(false)}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={24} color="#888" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'Timetable' && (
          <>
            <Text style={styles.inputLabel}>Day</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayPickerScroll}>
              {days.map(day => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayPickerButton,
                    formData.day_of_week === day && styles.selectedDayPickerButton
                  ]}
                  onPress={() => setFormData({...formData, day_of_week: day})}
                >
                  <Text style={[
                    styles.dayPickerText,
                    formData.day_of_week === day && styles.selectedDayPickerText
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Course Name</Text>
            <TextInput
              style={styles.input}
              value={formData.course_name}
              onChangeText={(text) => setFormData({...formData, course_name: text})}
              placeholder="Enter course name"
              placeholderTextColor="#666"
            />

            <Text style={styles.inputLabel}>Start Time</Text>
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => openTimePicker('start')}
            >
              <Text style={styles.timePickerButtonLabel}>Start Time</Text>
              <View style={styles.timePickerButtonContent}>
                <Text style={styles.timePickerButtonText}>
                  {formData.start_time || 'Select start time'}
                </Text>
                <Ionicons name="time-outline" size={20} color="#888" />
              </View>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>End Time</Text>
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => openTimePicker('end')}
            >
              <Text style={styles.timePickerButtonLabel}>End Time</Text>
              <View style={styles.timePickerButtonContent}>
                <Text style={styles.timePickerButtonText}>
                  {formData.end_time || 'Select end time'}
                </Text>
                <Ionicons name="time-outline" size={20} color="#888" />
              </View>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Teacher</Text>
            <TextInput
              style={styles.input}
              value={formData.teacher}
              onChangeText={(text) => setFormData({...formData, teacher: text})}
              placeholder="Enter teacher name"
              placeholderTextColor="#666"
            />

            <Text style={styles.inputLabel}>Room Number</Text>
            <TextInput
              style={styles.input}
              value={formData.room_number}
              onChangeText={(text) => setFormData({...formData, room_number: text})}
              placeholder="Enter room number"
              placeholderTextColor="#666"
            />
          </>
        )}

        {activeTab === 'Exams' && (
          <>
            <Text style={styles.inputLabel}>Exam Name</Text>
            <TextInput
              style={styles.input}
              value={formData.exam_name}
              onChangeText={(text) => setFormData({...formData, exam_name: text})}
              placeholder="Enter exam name"
              placeholderTextColor="#666"
            />

            <Text style={styles.inputLabel}>Date</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowCalendarPicker(true)}
            >
              <Text style={styles.datePickerButtonLabel}>Exam Date</Text>
              <View style={styles.datePickerButtonContent}>
                <Text style={styles.datePickerButtonText}>
                  {formData.date ? new Date(formData.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 'Select exam date'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#888" />
              </View>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Room Number</Text>
            <TextInput
              style={styles.input}
              value={formData.room_number}
              onChangeText={(text) => setFormData({...formData, room_number: text})}
              placeholder="Enter room number"
              placeholderTextColor="#666"
            />

            <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.additional_notes}
              onChangeText={(text) => setFormData({...formData, additional_notes: text})}
              placeholder="Enter any additional notes"
              placeholderTextColor="#666"
              multiline
            />
          </>
        )}

        {activeTab === 'Grades' && (
          <>
            <Text style={styles.inputLabel}>Course Name</Text>
            <TextInput
              style={styles.input}
              value={formData.course_name}
              onChangeText={(text) => setFormData({...formData, course_name: text})}
              placeholder="Enter course name"
              placeholderTextColor="#666"
            />

            <Text style={styles.inputLabel}>Credits</Text>
            <TextInput
              style={styles.input}
              value={formData.credits}
              onChangeText={(text) => setFormData({...formData, credits: text})}
              placeholder="Enter credits"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Grade</Text>
            <TextInput
              style={styles.input}
              value={formData.grade}
              onChangeText={(text) => setFormData({...formData, grade: text})}
              placeholder="Enter grade (A+, A, B+, etc.)"
              placeholderTextColor="#666"
            />

            <Text style={styles.inputLabel}>Semester</Text>
            <TextInput
              style={styles.input}
              value={formData.semester}
              onChangeText={(text) => setFormData({...formData, semester: text})}
              placeholder="Enter semester"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </>
        )}
      </ScrollView>

      <View style={styles.modalButtons}>
        <TouchableOpacity
          style={[styles.modalButton, styles.cancelButton]}
          onPress={() => setModalVisible(false)}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modalButton, styles.saveButton]}
          onPress={saveItem}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>
            {editingItem ? 'Update' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAttendanceModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showAttendanceModal}
      onRequestClose={() => setShowAttendanceModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.attendanceModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mark Attendance</Text>
            <TouchableOpacity
              onPress={() => setShowAttendanceModal(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>

          {selectedClassForAttendance && (
            <View style={styles.attendanceClassInfo}>
              <Text style={styles.attendanceClassName}>
                {selectedClassForAttendance.course_name}
              </Text>
              <Text style={styles.attendanceClassDetail}>
                Teacher: {selectedClassForAttendance.teacher}
              </Text>
              <Text style={styles.attendanceClassDetail}>
                Room: {selectedClassForAttendance.room_number}
              </Text>
            </View>
          )}

          <View style={styles.dateSelector}>
            <Ionicons name="calendar-outline" size={20} color="#888" />
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateSelectorText}>
                {new Date(selectedDate).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            <Ionicons name="chevron-down" size={20} color="#888" />
          </View>

          <View style={styles.attendanceOptions}>
            {[
              { status: 'present', icon: 'checkmark-circle-outline', label: 'Present', color: '#22c55e' },
              { status: 'absent', icon: 'close-circle-outline', label: 'Absent', color: '#ef4444' },
              { status: 'cancelled', icon: 'ban-outline', label: 'Cancelled', color: '#f59e0b' }
            ].map((option) => (
              <TouchableOpacity
                key={option.status}
                style={[
                  styles.attendanceOption,
                  attendanceStatus === option.status && styles.selectedAttendanceOption
                ]}
                onPress={() => setAttendanceStatus(option.status)}
                activeOpacity={0.8}
              >
                <Ionicons name={option.icon} size={24} color={option.color} />
                <View style={styles.attendanceOptionTextContainer}>
                  <Text style={styles.attendanceOptionText}>{option.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.markAttendanceButton}
            onPress={() => markAttendance(attendanceStatus)}
            activeOpacity={0.8}
          >
            <Text style={styles.markAttendanceButtonText}>
              Mark as {attendanceStatus.charAt(0).toUpperCase() + attendanceStatus.slice(1)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderAnalyticsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showAnalyticsModal}
      onRequestClose={() => setShowAnalyticsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.analyticsModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Attendance Analytics</Text>
            <TouchableOpacity
              onPress={() => setShowAnalyticsModal(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.analyticsScrollView} showsVerticalScrollIndicator={false}>
            {selectedClassForAttendance && (
              <>
                <View style={styles.analyticsHeader}>
                  <Text style={styles.analyticsSubtitle}>
                    {selectedClassForAttendance.course_name}
                  </Text>
                  <Text style={styles.analyticsInfo}>
                    {selectedClassForAttendance.teacher} • {selectedClassForAttendance.room_number}
                  </Text>
                </View>

                {(() => {
                  const analytics = getAttendanceAnalytics(selectedClassForAttendance);
                  
                  if (analytics.total === 0) {
                    return (
                      <View style={styles.noDataContainer}>
                        <Ionicons name="bar-chart-outline" size={64} color="#666" />
                        <Text style={styles.noDataText}>No attendance data yet</Text>
                        <Text style={styles.noDataSubtext}>
                          Start marking attendance to see analytics
                        </Text>
                      </View>
                    );
                  }

                  return (
                    <>
                      <View style={styles.attendanceOverview}>
                        <View style={styles.attendanceStatCard}>
                          <Text style={styles.attendanceStatValue}>{analytics.present}</Text>
                          <Text style={styles.attendanceStatLabel}>Present</Text>
                        </View>
                        <View style={styles.attendanceStatCard}>
                          <Text style={[styles.attendanceStatValue, { color: '#ef4444' }]}>
                            {analytics.absent}
                          </Text>
                          <Text style={styles.attendanceStatLabel}>Absent</Text>
                        </View>
                        <View style={styles.attendanceStatCard}>
                          <Text style={[styles.attendanceStatValue, { color: '#f59e0b' }]}>
                            {analytics.canceled}
                          </Text>
                          <Text style={styles.attendanceStatLabel}>Cancelled</Text>
                        </View>
                        <View style={styles.attendanceStatCard}>
                          <Text style={[styles.attendanceStatValue, { color: '#22c55e' }]}>
                            {analytics.percentage}%
                          </Text>
                          <Text style={styles.attendanceStatLabel}>Attendance</Text>
                        </View>
                      </View>

                      <View style={styles.pieChartContainer}>
                        <Text style={styles.chartTitle}>Attendance Distribution</Text>
                        <PieChart
                          data={[
                            {
                              name: 'Present',
                              population: analytics.present,
                              color: '#22c55e',
                              legendFontColor: '#888',
                              legendFontSize: 12,
                            },
                            {
                              name: 'Absent',
                              population: analytics.absent,
                              color: '#ef4444',
                              legendFontColor: '#888',
                              legendFontSize: 12,
                            },
                            {
                              name: 'Cancelled',
                              population: analytics.canceled,
                              color: '#f59e0b',
                              legendFontColor: '#888',
                              legendFontSize: 12,
                            },
                          ]}
                          width={width - 80}
                          height={200}
                          chartConfig={{
                            backgroundColor: '#1a1a1a',
                            backgroundGradientFrom: '#1a1a1a',
                            backgroundGradientTo: '#1a1a1a',
                            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                          }}
                          accessor="population"
                          backgroundColor="transparent"
                          paddingLeft="15"
                        />
                      </View>

                      <View style={styles.historyContainer}>
                        <Text style={styles.historyTitle}>Recent History</Text>
                        {attendanceData[selectedClassForAttendance.id]?.length > 0 ? (
                          attendanceData[selectedClassForAttendance.id]
                            .slice(-10)
                            .reverse()
                            .map((entry, index) => (
                              <View key={index} style={styles.historyItem}>
                                <View
                                  style={[
                                    styles.historyStatusIndicator,
                                    {
                                      backgroundColor:
                                        entry.status === 'present'
                                          ? '#22c55e'
                                          : entry.status === 'absent'
                                          ? '#ef4444'
                                          : '#f59e0b',
                                    },
                                  ]}
                                />
                                <Text style={styles.historyDate}>
                                  {new Date(entry.date).toLocaleDateString()}
                                </Text>
                                <Text style={styles.historyStatus}>
                                  {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                                </Text>
                              </View>
                            ))
                        ) : (
                          <Text style={styles.noHistoryText}>No attendance history available</Text>
                        )}
                      </View>
                    </>
                  );
                })()}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderDatePicker = () => {
    if (!showDatePicker) return null;
    
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDatePicker}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            
            <DateTimePicker
              value={new Date(selectedDate)}
              mode="date"
              display="spinner"
              onChange={(event, date) => {
                if (date) {
                  setSelectedDate(date.toISOString().split('T')[0]);
                }
                setShowDatePicker(Platform.OS === 'ios');
              }}
              style={{ backgroundColor: '#1a1a1a' }}
            />
            
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => {
                setSelectedDate(new Date().toISOString().split('T')[0]);
                setShowDatePicker(false);
              }}
            >
              <Text style={styles.datePickerButtonText}>Use Today</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (!currentUserId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={styles.errorTitle}>User Not Found</Text>
          <Text style={styles.errorMessage}>
            Unable to load user information. Please try logging in again.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Academics</Text>
        <TouchableOpacity style={styles.addHeaderButton} onPress={() => openModal()} activeOpacity={0.8}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Quick Access Navigation */}
      <View style={styles.quickAccessContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickAccessScroll}
        >
          <TouchableOpacity 
            style={styles.quickAccessButton}
            onPress={() => navigation.navigate('Courses', { userId: currentUserId, userInfo })}
            activeOpacity={0.8}
          >
            <View style={[styles.quickAccessIcon, { backgroundColor: '#3b82f620' }]}>
              <Ionicons name="book-outline" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.quickAccessText}>My Courses</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAccessButton}
            onPress={async () => {
              try {
                // Check if user has preferences set
                const response = await axios.get(`${API_URL}/ai/preferences/${currentUserId}`);
                
                if (!response.data.has_preferences) {
                  Alert.alert(
                    'Set Preferences First',
                    'Please set your study preferences to find better matches',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Set Preferences', 
                        onPress: () => navigation.navigate('StudyPreferences', { userId: currentUserId })
                      }
                    ]
                  );
                  return;
                }
                
                // If preferences exist, navigate to StudyBuddy
                if (coursesData.length > 0) {
                  const selectedCourse = coursesData[0];
                  
                  navigation.navigate('StudyBuddy', {
                    userId: currentUserId,
                    courseCode: selectedCourse.course_code || null,
                    courseName: selectedCourse.course_name || 'All Courses'
                  });
                } else {
                  Alert.alert('No Courses', 'Please enroll in courses first to find study buddies');
                }
              } catch (error) {
                console.error('Error checking preferences:', error);
                // If API fails, still allow navigation
                if (coursesData.length > 0) {
                  const selectedCourse = coursesData[0];
                  navigation.navigate('StudyBuddy', {
                    userId: currentUserId,
                    courseCode: selectedCourse.course_code || null,
                    courseName: selectedCourse.course_name || 'All Courses'
                  });
                } else {
                  Alert.alert('No Courses', 'Please enroll in courses first to find study buddies');
                }
              }
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.quickAccessIcon, { backgroundColor: '#10b98120' }]}>
              <Ionicons name="people-outline" size={20} color="#10b981" />
            </View>
            <Text style={styles.quickAccessText}>Find Buddies</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAccessButton}
            onPress={() => navigation.navigate('studyPreferences', { userId: currentUserId })}
            activeOpacity={0.8}
          >
            <View style={[styles.quickAccessIcon, { backgroundColor: '#8b5cf620' }]}>
              <Ionicons name="settings-outline" size={20} color="#8b5cf6" />
            </View>
            <Text style={styles.quickAccessText}>Preferences</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAccessButton}
            onPress={() => {
              if (coursesData.length > 0) {
                navigation.navigate('StudyGroups', {
                  userId: currentUserId,
                  courseCode: coursesData[0].course_code,
                  courseName: coursesData[0].course_name
                });
              } else {
                Alert.alert('No Courses', 'Please enroll in courses first to join study groups');
              }
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.quickAccessIcon, { backgroundColor: '#f59e0b20' }]}>
              <Ionicons name="chatbubbles-outline" size={20} color="#f59e0b" />
            </View>
            <Text style={styles.quickAccessText}>Study Groups</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAccessButton}
            onPress={() => {
              if (coursesData.length > 1) {
                Alert.alert(
                  'Select Course',
                  'Choose a course to view study resources',
                  coursesData.map(course => ({
                    text: course.course_code,
                    onPress: () => navigation.navigate('StudyGroups', {
                      userId: currentUserId,
                      courseCode: course.course_code,
                      courseName: course.course_name
                    })
                  })).concat([{ text: 'Cancel', style: 'cancel' }])
                );
              } else if (coursesData.length === 1) {
                navigation.navigate('StudyGroups', {
                  userId: currentUserId,
                  courseCode: coursesData[0].course_code,
                  courseName: coursesData[0].course_name
                });
              } else {
                Alert.alert('No Courses', 'Please enroll in courses first');
              }
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.quickAccessIcon, { backgroundColor: '#ec489920' }]}>
              <Ionicons name="library-outline" size={20} color="#ec4899" />
            </View>
            <Text style={styles.quickAccessText}>Resources</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAccessButton}
            onPress={() => {
              Alert.alert(
                'Analytics',
                'View your academic performance analytics',
                [{ text: 'OK' }]
              );
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.quickAccessIcon, { backgroundColor: '#8b5cf620' }]}>
              <Ionicons name="analytics-outline" size={20} color="#8b5cf6" />
            </View>
            <Text style={styles.quickAccessText}>Analytics</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {activeTab === 'Timetable' && renderTimetableContent()}
        {activeTab === 'Exams' && renderExamsContent()}
        {activeTab === 'Grades' && renderGradesContent()}
        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Modals */}
      {modalVisible && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            {renderModalContent()}
          </View>
        </Modal>
      )}

      {renderDatePicker()}
      {renderAttendanceModal()}
      {renderAnalyticsModal()}
      
      {/* Enhanced Time Picker */}
      <ClockTimePicker 
        visible={showTimePicker} 
        onClose={() => setShowTimePicker(false)} 
        initialTime={
          timePickerType === 'start' 
            ? formData.start_time 
            : formData.end_time
        } 
        onSelectTime={handleTimeSelection}
      />

      {/* Calendar Picker */}
      <CalendarPicker 
        visible={showCalendarPicker} 
        onClose={() => setShowCalendarPicker(false)} 
        initialDate={formData.date} 
        onSelectDate={handleDateSelection}
      />
    </SafeAreaView>
  );
};

// All your existing styles remain exactly the same...

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  addHeaderButton: {
    padding: 4,
  },
  quickAccessContainer: {
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    paddingVertical: 12,
  },
  quickAccessScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  quickAccessButton: {
    alignItems: 'center',
    marginRight: 4,
  },
  quickAccessIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickAccessText: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  activeTab: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  activeTabText: {
    color: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
  },
  daySelector: {
    marginBottom: 20,
    flexDirection: 'row',
  },
  dayButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  selectedDayButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  selectedDayText: {
    color: '#fff',
  },
  scheduleContainer: {
    gap: 16,
  },
  classCardContainer: {
    marginBottom: 16,
  },
  classCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  timeIndicator: {
    marginRight: 16,
    alignItems: 'center',
    minWidth: 60,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3b82f6',
  },
  timeDivider: {
    width: 2,
    height: 8,
    backgroundColor: '#3b82f6',
    marginVertical: 4,
  },
  classDetails: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  classInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  classInfoText: {
    fontSize: 13,
    color: '#888',
  },
  attendancePreview: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  attendancePercentage: {
    fontSize: 13,
    fontWeight: '600',
  },
  classCardActions: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  classActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  classActionText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  examCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  examName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  examBadge: {
    backgroundColor: '#3b82f6',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examDate: {
    fontSize: 14,
    color: '#3b82f6',
    marginBottom: 8,
    fontWeight: '600',
  },
  examInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  examRoom: {
    fontSize: 13,
    color: '#888',
  },
  examNotes: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  cgpaCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  cgpaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cgpaInfo: {
    marginLeft: 16,
  },
  cgpaLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cgpaValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  creditsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  creditsLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  creditsValue: {
    fontSize: 16,
    color: '#f59e0b',
    fontWeight: '700',
  },
  gradeCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  gradeBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  gradeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  gradeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  semesterText: {
    fontSize: 13,
    color: '#888',
  },
  creditsText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  bottomSpace: {
    height: 40,
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
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '90%',
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
  modalScrollView: {
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dayPickerScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dayPickerButton: {
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  selectedDayPickerButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  dayPickerText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  selectedDayPickerText: {
    color: '#fff',
  },
  timePickerButton: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 12,
    overflow: 'hidden',
  },
  timePickerButtonLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  timePickerButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  timePickerButtonText: {
    fontSize: 15,
    color: '#fff',
  },
  datePickerButton: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 12,
    overflow: 'hidden',
  },
  datePickerButtonLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  datePickerButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  datePickerButtonText: {
    fontSize: 15,
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
  },
  cancelButtonText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 15,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  attendanceModalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  attendanceClassInfo: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  attendanceClassName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  attendanceClassDetail: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  attendanceOptions: {
    marginBottom: 24,
  },
  attendanceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  selectedAttendanceOption: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  attendanceOptionTextContainer: {
    marginLeft: 12,
  },
  attendanceOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  markAttendanceButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  markAttendanceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  analyticsModalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  analyticsScrollView: {
    maxHeight: 500,
  },
  analyticsHeader: {
    marginBottom: 20,
  },
  analyticsSubtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  analyticsInfo: {
    fontSize: 14,
    color: '#888',
  },
  attendanceOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  attendanceStatCard: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  attendanceStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 4,
  },
  attendanceStatLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pieChartContainer: {
    marginBottom: 24,
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  historyContainer: {
    marginBottom: 24,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  historyStatusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  historyDate: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
  },
  historyStatus: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  noHistoryText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  datePickerContainer: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  dateSelectorText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
    marginLeft: 8,
  },
});

export default AcademicsScreen;