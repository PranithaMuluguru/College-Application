import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  TextInput,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_URL from '../../config';

const CoursesScreen = ({ route, navigation }) => {
  const { userId, userInfo } = route.params || {};
  const currentUserId = userId || userInfo?.id;

  const [activeTab, setActiveTab] = useState('enrolled');
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const currentYear = new Date().getFullYear();
  const currentSemester = new Date().getMonth() < 6 ? 1 : 2;

  // Filter courses by search
  const filteredCourses = availableCourses.filter(course =>
    course.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'enrolled') {
        await fetchEnrolledCourses();
      } else {
        await fetchAvailableCourses();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/courses/my-courses/${currentUserId}`
      );
      setEnrolledCourses(response.data || []);
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      Alert.alert('Error', 'Failed to fetch enrolled courses');
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/courses/available/${currentUserId}`
      );
      setAvailableCourses(response.data || []);
    } catch (error) {
      console.error('Error fetching available courses:', error);
      Alert.alert('Error', 'Failed to fetch available courses');
    }
  };

  const toggleCourseSelection = (courseCode) => {
    setSelectedCourses(prev =>
      prev.includes(courseCode)
        ? prev.filter(c => c !== courseCode)
        : [...prev, courseCode]
    );
  };

  const handleEnrollment = async () => {
    if (selectedCourses.length === 0) {
      Alert.alert('Error', 'Please select at least one course');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/courses/enroll/${currentUserId}`,
        {
          course_codes: selectedCourses,
          year: currentYear,
          semester: currentSemester
        }
      );

      Alert.alert(
        'Success',
        `Enrolled in ${response.data.enrolled_courses.length} courses and added to study groups!`
      );
      setSelectedCourses([]);
      setActiveTab('enrolled');
      await fetchEnrolledCourses();
    } catch (error) {
      console.error('Error enrolling:', error);
      Alert.alert('Error', 'Failed to enroll in courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDropCourse = async (enrollmentId, courseName) => {
    Alert.alert(
      'Drop Course',
      `Are you sure you want to drop ${courseName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Drop',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await axios.delete(`${API_URL}/courses/enroll/${enrollmentId}`);
              Alert.alert('Success', 'Course dropped successfully');
              await fetchEnrolledCourses();
            } catch (error) {
              console.error('Error dropping course:', error);
              Alert.alert('Error', 'Failed to drop course');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const navigateToCourseGroup = async (courseId, courseName) => {
    try {
      setLoading(true);
      console.log('Fetching group for course:', courseId);
      
      const response = await axios.get(
        `${API_URL}/courses/${courseId}/group`,
        {
          params: { user_id: currentUserId }
        }
      );
      
      console.log('Group response:', response.data);
      
      if (response.data && response.data.group_id) {
        navigation.navigate('CourseGroup', {
          groupId: response.data.group_id,
          groupName: courseName,
          userId: currentUserId
        });
      } else {
        Alert.alert('Error', 'No group found for this course');
      }
      
    } catch (error) {
      console.error('Error accessing course group:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to access course group');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getCreditBadgeColor = (credits) => {
    if (credits >= 4) return '#10b981';
    if (credits >= 3) return '#3b82f6';
    return '#f59e0b';
  };

  const renderEnrolledCourses = () => (
    <ScrollView
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      ) : enrolledCourses.length > 0 ? (
        enrolledCourses.map((course, index) => (
          <View key={index} style={styles.courseCard}>
            <View style={styles.courseHeader}>
              <View style={styles.courseCodeBadge}>
                <Text style={styles.courseCodeText}>{course.course_code}</Text>
              </View>
              <View
                style={[
                  styles.creditBadge,
                  { backgroundColor: getCreditBadgeColor(course.credits) }
                ]}
              >
                <Text style={styles.creditText}>{course.credits} CR</Text>
              </View>
            </View>

            <Text style={styles.courseName}>{course.course_name}</Text>

            <View style={styles.courseInfo}>
              <Ionicons name="business-outline" size={14} color="#888" />
              <Text style={styles.courseInfoText}>{course.department}</Text>
            </View>

            {course.description && (
              <Text style={styles.courseDescription} numberOfLines={2}>
                {course.description}
              </Text>
            )}

            <View style={styles.courseFooter}>
              <Text style={styles.semesterText}>
                Semester {course.semester}, {course.year}
              </Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  navigation.navigate('StudyBuddy', {
                    userId: currentUserId,
                    courseCode: course.course_code,
                    courseName: course.course_name
                  })
                }
              >
                <Ionicons name="people-outline" size={16} color="#3b82f6" />
                <Text style={styles.actionButtonText}>Find Buddies</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.courseActions}>
              <TouchableOpacity
                style={styles.viewGroupButton}
                onPress={() => navigateToCourseGroup(course.course_id, course.course_name)}
              >
                <Ionicons name="chatbubbles" size={16} color="#10b981" />
                <Text style={styles.viewGroupButtonText}>View Group</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dropButton}
                onPress={() => handleDropCourse(course.enrollment_id, course.course_name)}
              >
                <Text style={styles.dropButtonText}>Drop Course</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="school-outline" size={64} color="#666" />
          <Text style={styles.emptyStateText}>No enrolled courses</Text>
          <TouchableOpacity
            style={styles.enrollButton}
            onPress={() => setActiveTab('available')}
          >
            <Text style={styles.enrollButtonText}>Browse Courses</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.bottomSpace} />
    </ScrollView>
  );

  const renderAvailableCourses = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search courses..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
        ) : filteredCourses.length > 0 ? (
          filteredCourses.map((course, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.courseCard,
                selectedCourses.includes(course.course_code) &&
                  styles.selectedCourseCard
              ]}
              onPress={() => toggleCourseSelection(course.course_code)}
            >
              <View style={styles.courseHeader}>
                <View style={styles.courseCodeBadge}>
                  <Text style={styles.courseCodeText}>{course.course_code}</Text>
                </View>
                <View
                  style={[
                    styles.creditBadge,
                    { backgroundColor: getCreditBadgeColor(course.credits) }
                  ]}
                >
                  <Text style={styles.creditText}>{course.credits} CR</Text>
                </View>
                {selectedCourses.includes(course.course_code) && (
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                )}
              </View>

              <Text style={styles.courseName}>{course.course_name}</Text>

              {course.description && (
                <Text style={styles.courseDescription} numberOfLines={3}>
                  {course.description}
                </Text>
              )}

              {course.prerequisites && (
                <View style={styles.prerequisitesContainer}>
                  <Ionicons name="alert-circle-outline" size={14} color="#f59e0b" />
                  <Text style={styles.prerequisitesText}>
                    Prerequisites: {course.prerequisites}
                  </Text>
                </View>
              )}

              <View style={styles.courseMetadata}>
                <Text style={styles.semesterBadge}>
                  Year {course.year} • Semester {course.semester}
                </Text>
                <Text style={styles.departmentBadge}>{course.department}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-outline" size={64} color="#666" />
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No courses match your search' : 'No available courses for enrollment'}
            </Text>
          </View>
        )}
        <View style={styles.bottomSpace} />
      </ScrollView>

      {selectedCourses.length > 0 && (
        <View style={styles.floatingActionBar}>
          <Text style={styles.selectedCountText}>
            {selectedCourses.length} course{selectedCourses.length > 1 ? 's' : ''}{' '}
            selected
          </Text>
          <TouchableOpacity
            style={styles.enrollNowButton}
            onPress={handleEnrollment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.enrollNowButtonText}>Enroll Now</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Courses</Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => setActiveTab(activeTab === 'enrolled' ? 'available' : 'enrolled')}
        >
          <Ionicons
            name={activeTab === 'enrolled' ? 'add-circle-outline' : 'book-outline'}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        {['enrolled', 'available'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'enrolled' ? 'Enrolled' : 'Available'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'enrolled'
        ? renderEnrolledCourses()
        : renderAvailableCourses()}
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
    letterSpacing: 0.5
  },
  searchButton: {
    padding: 4
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  activeTab: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6'
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  activeTabText: {
    color: '#fff'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20
  },
  courseCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  selectedCourseCard: {
    borderColor: '#10b981',
    borderWidth: 2,
    backgroundColor: '#10b98110'
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8
  },
  courseCodeBadge: {
    backgroundColor: '#3b82f620',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1
  },
  courseCodeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3b82f6',
    textTransform: 'uppercase'
  },
  creditBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  creditText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff'
  },
  courseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8
  },
  courseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8
  },
  courseInfoText: {
    fontSize: 13,
    color: '#888'
  },
  courseDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
    lineHeight: 20
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    marginBottom: 12
  },
  semesterText: {
    fontSize: 12,
    color: '#666'
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  actionButtonText: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '600'
  },
  courseActions: {
    flexDirection: 'row',
    gap: 8
  },
  viewGroupButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#10b98110',
    borderWidth: 1,
    borderColor: '#10b981'
  },
  viewGroupButtonText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600'
  },
  dropButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#ef444410',
    borderWidth: 1,
    borderColor: '#ef4444'
  },
  dropButtonText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '600'
  },
  prerequisitesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f59e0b10',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8
  },
  prerequisitesText: {
    fontSize: 12,
    color: '#f59e0b',
    flex: 1
  },
  courseMetadata: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap'
  },
  semesterBadge: {
    fontSize: 11,
    color: '#666',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  departmentBadge: {
    fontSize: 11,
    color: '#888',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  floatingActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a'
  },
  selectedCountText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600'
  },
  enrollNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8
  },
  enrollNowButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600'
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 20
  },
  enrollButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12
  },
  enrollButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  bottomSpace: {
    height: 40
  }
});

export default CoursesScreen;