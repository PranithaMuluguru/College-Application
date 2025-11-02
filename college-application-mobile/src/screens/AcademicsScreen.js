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

const API_URL = 'http://10.32.10.15:8000';

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

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const tabs = ['Timetable', 'Exams', 'Grades'];

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
          timetableData[selectedDay].map((classItem) => (
            <TouchableOpacity
              key={classItem.id}
              style={styles.classCard}
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
              </View>
            </TouchableOpacity>
          ))
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
            activeOpacity={0.8}
          >
            <View style={styles.examHeader}>
              <Text style={styles.examName}>{exam.exam_name}</Text>
              <View style={styles.examBadge}>
                <Ionicons name="calendar" size={12} color="#fff" />
              </View>
            </View>
            <Text style={styles.examDate}>{new Date(exam.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
            <View style={styles.examInfo}>
              <Ionicons name="location-outline" size={14} color="#888" />
              <Text style={styles.examRoom}>{exam.room_number}</Text>
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
          <Text style={styles.loadingText}>Loading grades...</Text>
        </View>
      )}

      {!loading && (
        <>
          <View style={styles.cgpaCard}>
            <View style={styles.cgpaHeader}>
              <Ionicons name="trophy" size={32} color="#f59e0b" />
              <View style={styles.cgpaInfo}>
                <Text style={styles.cgpaLabel}>CGPA</Text>
                <Text style={styles.cgpaValue}>{cgpaInfo.cgpa || '0.00'}</Text>
              </View>
            </View>
            <View style={styles.creditsInfo}>
              <Text style={styles.creditsLabel}>Total Credits</Text>
              <Text style={styles.creditsValue}>{cgpaInfo.total_credits || 0}</Text>
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
                  <Text style={styles.semesterText}>{grade.semester}</Text>
                  <Text style={styles.creditsText}>{grade.credits} credits</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
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
                  activeOpacity={0.8}
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
            placeholder="Course Name"
            placeholderTextColor="#666"
            value={formData.course_name}
            onChangeText={(text) => setFormData({...formData, course_name: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="Start Time (e.g., 9:00 AM)"
            placeholderTextColor="#666"
            value={formData.start_time}
            onChangeText={(text) => setFormData({...formData, start_time: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="End Time (e.g., 10:00 AM)"
            placeholderTextColor="#666"
            value={formData.end_time}
            onChangeText={(text) => setFormData({...formData, end_time: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="Teacher"
            placeholderTextColor="#666"
            value={formData.teacher}
            onChangeText={(text) => setFormData({...formData, teacher: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="Room Number"
            placeholderTextColor="#666"
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
            placeholder="Exam Name"
            placeholderTextColor="#666"
            value={formData.exam_name}
            onChangeText={(text) => setFormData({...formData, exam_name: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="Date (YYYY-MM-DD)"
            placeholderTextColor="#666"
            value={formData.date}
            onChangeText={(text) => setFormData({...formData, date: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="Room Number"
            placeholderTextColor="#666"
            value={formData.room_number}
            onChangeText={(text) => setFormData({...formData, room_number: text})}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Additional Notes"
            placeholderTextColor="#666"
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
            placeholder="Course Name"
            placeholderTextColor="#666"
            value={formData.course_name}
            onChangeText={(text) => setFormData({...formData, course_name: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="Credits"
            placeholderTextColor="#666"
            value={formData.credits}
            keyboardType="numeric"
            onChangeText={(text) => setFormData({...formData, credits: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="Grade (e.g., A, B+, C)"
            placeholderTextColor="#666"
            value={formData.grade}
            onChangeText={(text) => setFormData({...formData, grade: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="Semester (e.g., Fall 2024)"
            placeholderTextColor="#666"
            value={formData.semester}
            onChangeText={(text) => setFormData({...formData, semester: text})}
          />
        </>
      );
    }
  };

  if (!currentUserId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={64} color="#ef4444" />
          <Text style={styles.errorTitle}>User ID Not Available</Text>
          <Text style={styles.errorMessage}>
            Please make sure you're properly logged in and try again.
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

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit' : 'Add'} {activeTab.slice(0, -1)}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setEditingItem(null);
                  setFormData({});
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
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
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveItem}
                disabled={loading}
                activeOpacity={0.8}
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
    gap: 12,
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
  pickerContainer: {
    marginBottom: 12,
  },
  dayPickerScroll: {
    flexDirection: 'row',
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
});

export default AcademicsScreen;