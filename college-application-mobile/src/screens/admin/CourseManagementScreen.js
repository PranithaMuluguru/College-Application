import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_URL from '../../config';

const CourseManagementScreen = ({ route, navigation }) => {
  const { token, admin_user } = route.params;

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    department: '',
    credits: '',
    year: '',
    semester: '',
    description: '',
    prerequisites: ''
  });

  const [filters, setFilters] = useState({
    department: '',
    year: '',
    semester: ''
  });

  useEffect(() => {
    fetchCourses();
  }, [filters]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.department) params.append('department', filters.department);
      if (filters.year) params.append('year', filters.year);
      if (filters.semester) params.append('semester', filters.semester);

      const response = await axios.get(
        `${API_URL}/courses/admin/courses?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCourses(response.data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      Alert.alert('Error', 'Failed to fetch courses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openModal = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        course_code: course.course_code,
        course_name: course.course_name,
        department: course.department,
        credits: course.credits.toString(),
        year: course.year.toString(),
        semester: course.semester.toString(),
        description: course.description || '',
        prerequisites: course.prerequisites || ''
      });
    } else {
      setEditingCourse(null);
      setFormData({
        course_code: '',
        course_name: '',
        department: '',
        credits: '',
        year: '',
        semester: '',
        description: '',
        prerequisites: ''
      });
    }
    setShowModal(true);
  };

  const saveCourse = async () => {
    const required = ['course_code', 'course_name', 'department', 'credits', 'year', 'semester'];
    const missing = required.filter(field => !formData[field]);

    if (missing.length > 0) {
      Alert.alert('Error', `Please fill in: ${missing.join(', ')}`);
      return;
    }

    try {
      setLoading(true);
      const data = {
        ...formData,
        credits: parseInt(formData.credits),
        year: parseInt(formData.year),
        semester: parseInt(formData.semester)
      };

      if (editingCourse) {
        await axios.put(
          `${API_URL}/courses/admin/courses/${editingCourse.id}`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Alert.alert('Success', 'Course updated successfully');
      } else {
        await axios.post(`${API_URL}/courses/admin/courses`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Success', 'Course created successfully');
      }

      setShowModal(false);
      await fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  const deleteCourse = async (courseId, courseName) => {
    Alert.alert(
      'Delete Course',
      `Are you sure you want to delete "${courseName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await axios.delete(`${API_URL}/courses/admin/courses/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Success', 'Course deleted successfully');
              await fetchCourses();
            } catch (error) {
              console.error('Error deleting course:', error);
              Alert.alert('Error', 'Failed to delete course');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => openModal()}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              !filters.department && !filters.year && !filters.semester &&
                styles.activeFilterChip
            ]}
            onPress={() => setFilters({ department: '', year: '', semester: '' })}
          >
            <Text style={styles.filterChipText}>All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filters.year === '1' && styles.activeFilterChip]}
            onPress={() => setFilters({ ...filters, year: filters.year === '1' ? '' : '1' })}
          >
            <Text style={styles.filterChipText}>Year 1</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filters.year === '2' && styles.activeFilterChip]}
            onPress={() => setFilters({ ...filters, year: filters.year === '2' ? '' : '2' })}
          >
            <Text style={styles.filterChipText}>Year 2</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filters.year === '3' && styles.activeFilterChip]}
            onPress={() => setFilters({ ...filters, year: filters.year === '3' ? '' : '3' })}
          >
            <Text style={styles.filterChipText}>Year 3</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filters.year === '4' && styles.activeFilterChip]}
            onPress={() => setFilters({ ...filters, year: filters.year === '4' ? '' : '4' })}
          >
            <Text style={styles.filterChipText}>Year 4</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filters.semester === '1' && styles.activeFilterChip]}
            onPress={() =>
              setFilters({ ...filters, semester: filters.semester === '1' ? '' : '1' })
            }
          >
            <Text style={styles.filterChipText}>Sem 1</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filters.semester === '2' && styles.activeFilterChip]}
            onPress={() =>
              setFilters({ ...filters, semester: filters.semester === '2' ? '' : '2' })
            }
          >
            <Text style={styles.filterChipText}>Sem 2</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator
            size="large"
            color="#8b5cf6"
            style={{ marginTop: 40 }}
          />
        ) : courses.length > 0 ? (
          <>
            <View style={styles.statsCard}>
              <Ionicons name="book-outline" size={20} color="#8b5cf6" />
              <Text style={styles.statsText}>
                Managing {courses.length} course{courses.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {courses.map(course => (
              <View key={course.id} style={styles.courseCard}>
                <View style={styles.courseHeader}>
                  <View style={styles.courseCodeBadge}>
                    <Text style={styles.courseCodeText}>{course.course_code}</Text>
                  </View>
                  <View style={styles.courseActions}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => openModal(course)}
                    >
                      <Ionicons name="pencil" size={18} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => deleteCourse(course.id, course.course_name)}
                    >
                      <Ionicons name="trash" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.courseName}>{course.course_name}</Text>

                <View style={styles.courseMetadata}>
                  <View style={styles.metaItem}>
                    <Ionicons name="business-outline" size={14} color="#888" />
                    <Text style={styles.metaText}>{course.department}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color="#888" />
                    <Text style={styles.metaText}>
                      Year {course.year}, Sem {course.semester}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="trophy-outline" size={14} color="#888" />
                    <Text style={styles.metaText}>{course.credits} Credits</Text>
                  </View>
                </View>

                {course.description && (
                  <Text style={styles.courseDescription} numberOfLines={2}>
                    {course.description}
                  </Text>
                )}

                {course.prerequisites && (
                  <View style={styles.prerequisitesBadge}>
                    <Ionicons name="link-outline" size={14} color="#f59e0b" />
                    <Text style={styles.prerequisitesText}>
                      Prerequisites: {course.prerequisites}
                    </Text>
                  </View>
                )}

                <View style={styles.enrollmentBadge}>
                  <Ionicons name="people" size={14} color="#10b981" />
                  <Text style={styles.enrollmentText}>
                    {course.total_enrolled || 0} enrolled
                  </Text>
                </View>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={64} color="#666" />
            <Text style={styles.emptyStateText}>No courses found</Text>
            <TouchableOpacity
              style={styles.addCourseButton}
              onPress={() => openModal()}
            >
              <Text style={styles.addCourseButtonText}>Add Course</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCourse ? 'Edit Course' : 'Add Course'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.inputLabel}>Course Code *</Text>
              <TextInput
                style={styles.input}
                value={formData.course_code}
                onChangeText={text =>
                  setFormData({ ...formData, course_code: text })
                }
                placeholder="e.g., CS101"
                placeholderTextColor="#666"
                editable={!editingCourse}
              />

              <Text style={styles.inputLabel}>Course Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.course_name}
                onChangeText={text =>
                  setFormData({ ...formData, course_name: text })
                }
                placeholder="e.g., Introduction to Programming"
                placeholderTextColor="#666"
              />

              <Text style={styles.inputLabel}>Department *</Text>
              <TextInput
                style={styles.input}
                value={formData.department}
                onChangeText={text =>
                  setFormData({ ...formData, department: text })
                }
                placeholder="e.g., Computer Science"
                placeholderTextColor="#666"
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Credits *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.credits}
                    onChangeText={text =>
                      setFormData({ ...formData, credits: text })
                    }
                    placeholder="3"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.inputLabel}>Year *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.year}
                    onChangeText={text => setFormData({ ...formData, year: text })}
                    placeholder="1"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.inputLabel}>Semester *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.semester}
                    onChangeText={text =>
                      setFormData({ ...formData, semester: text })
                    }
                    placeholder="1"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={text =>
                  setFormData({ ...formData, description: text })
                }
                placeholder="Course description..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Prerequisites</Text>
              <TextInput
                style={styles.input}
                value={formData.prerequisites}
                onChangeText={text =>
                  setFormData({ ...formData, prerequisites: text })
                }
                placeholder="e.g., CS100, MATH101"
                placeholderTextColor="#666"
              />
            </ScrollView>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveCourse}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a'
  },
  backButton: {
    padding: 4
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    marginLeft: 16
  },
  addButton: {
    padding: 4
  },
  filtersContainer: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a'
  },
  filterChip: {
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  activeFilterChip: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6'
  },
  filterChipText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600'
  },
  content: {
    flex: 1,
    padding: 20
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 12
  },
  statsText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600'
  },
  courseCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  courseCodeBadge: {
    backgroundColor: '#8b5cf620',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  courseCodeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8b5cf6',
    textTransform: 'uppercase'
  },
  courseActions: {
    flexDirection: 'row',
    gap: 8
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center'
  },
  courseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12
  },
  courseMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  metaText: {
    fontSize: 13,
    color: '#888'
  },
  courseDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
    lineHeight: 20
  },
  prerequisitesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#0a0a0a',
    borderRadius: 8
  },
  prerequisitesText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500'
  },
  enrollmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a'
  },
  enrollmentText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600'
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 20
  },
  addCourseButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12
  },
  addCourseButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff'
  },
  modalScrollView: {
    maxHeight: 400
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  rowInputs: {
    flexDirection: 'row'
  },
  saveButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600'
  },
  bottomSpace: {
    height: 40
  }
});

export default CourseManagementScreen;