import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  Modal,
  TextInput,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = 'http://10.32.9.125:8000';

const AcademicsScreen = ({ route, navigation }) => {
  // Properly handle userId and userInfo with default values
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

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const tabs = ['Timetable', 'Exams', 'Grades'];

  // Check if userId is available before making API calls
  useEffect(() => {
    if (!currentUserId) {
      console.log('User ID not available');
      return;
    }

    if (activeTab === 'Timetable') {
      fetchTimetable();
    } else if (activeTab === 'Exams') {
      fetchExams();
    } else if (activeTab === 'Grades') {
      fetchGrades();
    }
  }, [activeTab, currentUserId]);

  const fetchTimetable = async () => {
    if (!currentUserId) {
      Alert.alert('Error', 'User ID not available');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching timetable for user:', currentUserId);
      const response = await axios.get(`${API_URL}/timetable/${currentUserId}`);
      
      // Initialize organized object with empty arrays for each day
      const organized = {};
      days.forEach(day => { organized[day] = []; });
      
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach(item => {
          if (organized[item.day_of_week]) {
            organized[item.day_of_week].push(item);
          }
        });
        
        // Sort by start time
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
  };

  const fetchExams = async () => {
    if (!currentUserId) {
      Alert.alert('Error', 'User ID not available');
      return;
    }

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
  };

  const fetchGrades = async () => {
    if (!currentUserId) {
      Alert.alert('Error', 'User ID not available');
      return;
    }

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
  };

  const saveItem = async () => {
    if (!currentUserId) {
      Alert.alert('Error', 'User ID not available');
      return;
    }

    // Validate form data
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

      let response;
      if (editingItem) {
        response = await axios.put(endpoint, data);
        Alert.alert('Success', `${activeTab.slice(0, -1)} updated successfully`);
      } else {
        response = await axios.post(endpoint, data);
        Alert.alert('Success', `${activeTab.slice(0, -1)} added successfully`);
      }

      setModalVisible(false);
      setEditingItem(null);
      setFormData({});
      
      // Refresh data
      if (activeTab === 'Timetable') fetchTimetable();
      else if (activeTab === 'Exams') fetchExams();
      else if (activeTab === 'Grades') fetchGrades();
      
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
              
              // Refresh data
              if (activeTab === 'Timetable') fetchTimetable();
              else if (activeTab === 'Exams') fetchExams();
              else if (activeTab === 'Grades') fetchGrades();
              
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

  const renderTimetableContent = () => (
    <View style={styles.contentContainer}>
      {/* Day Selection */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
        {days.map(day => (
          <TouchableOpacity
            key={day}
            style={[styles.dayButton, selectedDay === day && styles.selectedDayButton]}
            onPress={() => setSelectedDay(day)}
          >
            <Text style={[styles.dayButtonText, selectedDay === day && styles.selectedDayText]}>
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {/* Schedule for selected day */}
      <View style={styles.scheduleContainer}>
        <View style={styles.scheduleHeader}>
          <Ionicons name="time-outline" size={24} color="#666" />
          <Text style={styles.scheduleTitle}>
            {selectedDay === 'Mon' ? 'Monday' : 
             selectedDay === 'Tue' ? 'Tuesday' : 
             selectedDay === 'Wed' ? 'Wednesday' : 
             selectedDay === 'Thu' ? 'Thursday' : 'Friday'} Schedule
          </Text>
        </View>

        {!loading && timetableData[selectedDay]?.length > 0 ? (
          timetableData[selectedDay].map((classItem) => (
            <TouchableOpacity
              key={classItem.id}
              style={styles.classCard}
              onLongPress={() => deleteItem(classItem)}
              onPress={() => openModal(classItem)}
            >
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{classItem.start_time}-{classItem.end_time}</Text>
              </View>
              <View style={styles.classDetails}>
                <Text style={styles.className}>{classItem.course_name}</Text>
                <Text style={styles.classInfo}>{classItem.room_number} • {classItem.teacher}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No classes scheduled for {selectedDay === 'Mon' ? 'Monday' : 
              selectedDay === 'Tue' ? 'Tuesday' : 
              selectedDay === 'Wed' ? 'Wednesday' : 
              selectedDay === 'Thu' ? 'Thursday' : 'Friday'}
            </Text>
            <TouchableOpacity 
              style={styles.addFirstButton}
              onPress={() => openModal()}
            >
              <Ionicons name="add" size={20} color="#4285F4" />
              <Text style={styles.addFirstText}>Add your first class</Text>
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
          <Text style={styles.loadingText}>Loading exams...</Text>
        </View>
      )}

      {!loading && examData.length > 0 ? (
        examData.map((exam) => (
          <TouchableOpacity
            key={exam.id}
            style={styles.examCard}
            onLongPress={() => deleteItem(exam)}
            onPress={() => openModal(exam)}
          >
            <Text style={styles.examName}>{exam.exam_name}</Text>
            <Text style={styles.examDate}>{new Date(exam.date).toLocaleDateString()}</Text>
            <Text style={styles.examRoom}>Room: {exam.room_number}</Text>
            {exam.additional_notes && (
              <Text style={styles.examNotes}>{exam.additional_notes}</Text>
            )}
          </TouchableOpacity>
        ))
      ) : !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No exams scheduled</Text>
          <TouchableOpacity 
            style={styles.addFirstButton}
            onPress={() => openModal()}
          >
            <Ionicons name="add" size={20} color="#4285F4" />
            <Text style={styles.addFirstText}>Add your first exam</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderGradesContent = () => (
    <View style={styles.contentContainer}>
      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading grades...</Text>
        </View>
      )}

      {!loading && (
        <>
          <View style={styles.cgpaCard}>
            <Text style={styles.cgpaTitle}>Academic Performance</Text>
            <Text style={styles.cgpaValue}>CGPA: {cgpaInfo.cgpa || 0}</Text>
            <Text style={styles.creditsText}>Total Credits: {cgpaInfo.total_credits || 0}</Text>
          </View>

          {gradesData.length > 0 ? (
            gradesData.map((grade) => (
              <TouchableOpacity
                key={grade.id}
                style={styles.gradeCard}
                onLongPress={() => deleteItem(grade)}
                onPress={() => openModal(grade)}
              >
                <Text style={styles.courseName}>{grade.course_name}</Text>
                <View style={styles.gradeDetails}>
                  <Text style={styles.gradeText}>Grade: {grade.grade}</Text>
                  <Text style={styles.creditsText}>Credits: {grade.credits}</Text>
                </View>
                <Text style={styles.semesterText}>{grade.semester}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No grades recorded</Text>
              <TouchableOpacity 
                style={styles.addFirstButton}
                onPress={() => openModal()}
              >
                <Ionicons name="add" size={20} color="#4285F4" />
                <Text style={styles.addFirstText}>Add your first grade</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );

  const renderModalContent = () => {
    if (activeTab === 'Timetable') {
      return (
        <>
          <View style={styles.pickerContainer}>
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
          </View>
          <TextInput
            style={styles.input}
            placeholder="Course Name *"
            value={formData.course_name}
            onChangeText={(text) => setFormData({...formData, course_name: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="Start Time (e.g., 9:00 AM) *"
            value={formData.start_time}
            onChangeText={(text) => setFormData({...formData, start_time: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="End Time (e.g., 10:00 AM) *"
            value={formData.end_time}
            onChangeText={(text) => setFormData({...formData, end_time: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="Teacher *"
            value={formData.teacher}
            onChangeText={(text) => setFormData({...formData, teacher: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="Room Number *"
            value={formData.room_number}
            onChangeText={(text) => setFormData({...formData, room_number: text})}
          />
        </>
      );
    } else if (activeTab === 'Exams') {
      return (
        <>
          <TextInput
            style={styles.input}
            placeholder="Exam Name *"
            value={formData.exam_name}
            onChangeText={(text) => setFormData({...formData, exam_name: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="Date (YYYY-MM-DD) *"
            value={formData.date}
            onChangeText={(text) => setFormData({...formData, date: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="Room Number *"
            value={formData.room_number}
            onChangeText={(text) => setFormData({...formData, room_number: text})}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Additional Notes"
            value={formData.additional_notes}
            onChangeText={(text) => setFormData({...formData, additional_notes: text})}
            multiline
            numberOfLines={4}
          />
        </>
      );
    } else if (activeTab === 'Grades') {
      return (
        <>
          <TextInput
            style={styles.input}
            placeholder="Course Name *"
            value={formData.course_name}
            onChangeText={(text) => setFormData({...formData, course_name: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="Credits *"
            value={formData.credits}
            keyboardType="numeric"
            onChangeText={(text) => setFormData({...formData, credits: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="Grade (e.g., A, B+, C) *"
            value={formData.grade}
            onChangeText={(text) => setFormData({...formData, grade: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="Semester (e.g., Fall 2024) *"
            value={formData.semester}
            onChangeText={(text) => setFormData({...formData, semester: text})}
          />
        </>
      );
    }
  };

  // Show error if userId is not available
  if (!currentUserId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={64} color="#FF6B6B" />
          <Text style={styles.errorTitle}>User ID Not Available</Text>
          <Text style={styles.errorMessage}>
            Please make sure you're properly logged in and try again.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
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
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Academics</Text>
          <Text style={styles.headerSubtitle}>
            {userInfo?.department || 'Computer Science'} • {userInfo?.year || '3rd'} Year
          </Text>
        </View>
        <View style={styles.profileContainer}>
          <View style={styles.profileCircle}>
            <Text style={styles.profileText}>
              {userInfo?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'JD'}
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons 
              name={tab === 'Timetable' ? 'calendar-outline' : tab === 'Exams' ? 'document-text-outline' : 'school-outline'} 
              size={20} 
              color={activeTab === tab ? '#4285F4' : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollContainer}>
        {activeTab === 'Timetable' && renderTimetableContent()}
        {activeTab === 'Exams' && renderExamsContent()}
        {activeTab === 'Grades' && renderGradesContent()}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => openModal()}
        disabled={loading}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Edit' : 'Add'} {activeTab.slice(0, -1)}
            </Text>
            
            <ScrollView style={styles.modalScrollView}>
              {renderModalContent()}
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setEditingItem(null);
                  setFormData({});
                }}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveItem}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
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
    backgroundColor: '#4285F4',
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8E8E8',
    margin: 20,
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#4285F4',
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  daySelector: {
    marginBottom: 20,
  },
  dayButton: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 10,
  },
  selectedDayButton: {
    backgroundColor: '#4285F4',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectedDayText: {
    color: 'white',
    fontWeight: '600',
  },
  scheduleContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    color: '#000',
  },
  classCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4285F4',
  },
  timeContainer: {
    marginRight: 15,
    minWidth: 80,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4285F4',
  },
  classDetails: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  classInfo: {
    fontSize: 12,
    color: '#666',
  },
  examCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  examName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  examDate: {
    fontSize: 14,
    color: '#4285F4',
    marginBottom: 4,
  },
  examRoom: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  examNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  cgpaCard: {
    backgroundColor: '#4285F4',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  cgpaTitle: {
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
  },
  cgpaValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  creditsText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  gradeCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  gradeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  gradeText: {
    fontSize: 14,
    color: '#4285F4',
    fontWeight: '600',
  },
  semesterText: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addFirstText: {
    color: '#4285F4',
    fontWeight: '600',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    backgroundColor: '#4285F4',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#000',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginBottom: 15,
  },
  dayPickerScroll: {
    flexDirection: 'row',
  },
  dayPickerButton: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
    marginRight: 8,
  },
  selectedDayPickerButton: {
    backgroundColor: '#4285F4',
  },
  dayPickerText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedDayPickerText: {
    color: 'white',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#4285F4',
    marginLeft: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default AcademicsScreen;