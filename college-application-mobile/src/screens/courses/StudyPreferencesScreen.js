import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_URL from '../../config';

const StudyBuddyScreen = ({ route, navigation }) => {
  const { userId, courseCode, courseName } = route.params || {};
  
  // Debug log to see what's being passed
  console.log('StudyBuddyScreen params:', { userId, courseCode, courseName });
  
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBuddy, setSelectedBuddy] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [courseFilter, setCourseFilter] = useState(null);
  const [availableCourses, setAvailableCourses] = useState([]);

  useEffect(() => {
    loadAvailableCourses();
  }, []);

  useEffect(() => {
    findStudyBuddies();
  }, [courseFilter]);

  const loadAvailableCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/courses/my-courses/${userId}`);
      setAvailableCourses(response.data || []);
      
      // If no courseCode was passed, set to first available course
      const validCourseCode = courseCode && courseCode !== 'undefined' ? courseCode : null;
      if (validCourseCode) {
        setCourseFilter(validCourseCode);
      } else if (response.data && response.data.length > 0) {
        setCourseFilter(response.data[0].course_code);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setAvailableCourses([]);
    }
  };

  const findStudyBuddies = async () => {
    try {
      setLoading(true);
      
      // Build URL properly
      let url = `${API_URL}/ai/study-buddies/${userId}?max_results=20`;
      
      // Only add course_code if it's valid
      if (courseFilter && courseFilter !== 'undefined' && courseFilter.trim()) {
        url += `&course_code=${courseFilter}`;
      }
      
      console.log('Fetching study buddies:', url);
      
      const response = await axios.get(url);
      console.log('Response:', response.data);
      
      setMatches(response.data || []);
    } catch (error) {
      console.error('Error finding study buddies:', error);
      console.error('Error details:', error.response?.data);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to find study buddies');
    } finally {
      setLoading(false);
    }
  };

  const sendBuddyRequest = async () => {
    if (!selectedBuddy) return;

    try {
      setLoading(true);
      await axios.post(`${API_URL}/ai/study-buddies/request/${userId}`, {
        target_user_id: selectedBuddy.user_id,
        course_code: courseFilter || '',
        message: requestMessage
      });

      Alert.alert('Success', 'Study buddy request sent!');
      setShowMessageModal(false);
      setRequestMessage('');
      setSelectedBuddy(null);
    } catch (error) {
      console.error('Error sending request:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const renderMatchCard = (match, index) => (
    <View key={index} style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {match.full_name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.matchInfo}>
          <Text style={styles.matchName}>{match.full_name}</Text>
          <Text style={styles.matchMeta}>
            {match.department} • Year {match.year}
          </Text>
        </View>
        <View
          style={[
            styles.matchScoreBadge,
            { backgroundColor: getMatchScoreColor(match.match_score) }
          ]}
        >
          <Text style={styles.matchScoreText}>{Math.round(match.match_score)}%</Text>
        </View>
      </View>

      {match.complementary_skills.length > 0 && (
        <View style={styles.skillsContainer}>
          <Text style={styles.sectionLabel}>
            <Ionicons name="bulb-outline" size={14} color="#f59e0b" /> Complementary
            Skills
          </Text>
          <View style={styles.skillsList}>
            {match.complementary_skills.map((skill, idx) => (
              <View key={idx} style={styles.skillBadge}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {match.common_availability.length > 0 && (
        <View style={styles.availabilityContainer}>
          <Text style={styles.sectionLabel}>
            <Ionicons name="time-outline" size={14} color="#3b82f6" /> Common Free Time
          </Text>
          <View style={styles.availabilityList}>
            {match.common_availability.map((day, idx) => (
              <View key={idx} style={styles.dayBadge}>
                <Text style={styles.dayText}>{day}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.compatibilityBar}>
        <Text style={styles.compatibilityLabel}>Study Style Compatibility</Text>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${match.study_style_compatibility}%` }
            ]}
          />
        </View>
        <Text style={styles.compatibilityValue}>
          {Math.round(match.study_style_compatibility)}%
        </Text>
      </View>

      <TouchableOpacity
        style={styles.sendRequestButton}
        onPress={() => {
          setSelectedBuddy(match);
          setShowMessageModal(true);
        }}
      >
        <Ionicons name="paper-plane-outline" size={16} color="#fff" />
        <Text style={styles.sendRequestText}>Send Request</Text>
      </TouchableOpacity>
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
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Study Buddies</Text>
          <Text style={styles.headerSubtitle}>
            {courseName || (courseFilter ? `Course: ${courseFilter}` : 'All Courses')}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('StudyPreferences', { userId })}
        >
          <Ionicons name="settings" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Course Filter */}
      {availableCourses.length > 0 && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by Course:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.courseFilterScroll}>
            <TouchableOpacity
              style={[
                styles.courseFilterButton,
                !courseFilter && styles.courseFilterButtonActive
              ]}
              onPress={() => setCourseFilter(null)}
            >
              <Text style={[
                styles.courseFilterText,
                !courseFilter && styles.courseFilterTextActive
              ]}>
                All Courses
              </Text>
            </TouchableOpacity>
            {availableCourses.map(course => (
              <TouchableOpacity
                key={course.id}
                style={[
                  styles.courseFilterButton,
                  courseFilter === course.course_code && styles.courseFilterButtonActive
                ]}
                onPress={() => setCourseFilter(course.course_code)}
              >
                <Text style={[
                  styles.courseFilterText,
                  courseFilter === course.course_code && styles.courseFilterTextActive
                ]}>
                  {course.course_code}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Finding perfect matches...</Text>
        </View>
      ) : matches.length > 0 ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.statsCard}>
            <Ionicons name="people" size={24} color="#3b82f6" />
            <Text style={styles.statsText}>
              Found {matches.length} high-quality matches
            </Text>
          </View>

          {matches.map(renderMatchCard)}
          <View style={styles.bottomSpace} />
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={64} color="#666" />
          <Text style={styles.emptyStateText}>No matches found yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Try enrolling in more courses or wait for more students to join
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => navigation.navigate('StudyPreferences', { userId })}
          >
            <Text style={styles.emptyStateButtonText}>Update Preferences</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Message Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showMessageModal}
        onRequestClose={() => setShowMessageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Study Buddy Request</Text>
              <TouchableOpacity onPress={() => setShowMessageModal(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            {selectedBuddy && (
              <View style={styles.recipientInfo}>
                <View style={styles.recipientAvatar}>
                  <Text style={styles.recipientAvatarText}>
                    {selectedBuddy.full_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.recipientName}>{selectedBuddy.full_name}</Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Message (Optional)</Text>
            <TextInput
              style={styles.messageInput}
              value={requestMessage}
              onChangeText={setRequestMessage}
              placeholder="Hi! Let's study together..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={styles.sendButton}
              onPress={sendBuddyRequest}
            >
              <Text style={styles.sendButtonText}>Send Request</Text>
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
  headerInfo: {
    flex: 1,
    marginLeft: 16
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff'
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2
  },
  settingsButton: {
    padding: 4
  },
  filterContainer: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a'
  },
  filterLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  courseFilterScroll: {
    flexDirection: 'row'
  },
  courseFilterButton: {
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  courseFilterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6'
  },
  courseFilterText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600'
  },
  courseFilterTextActive: {
    color: '#fff'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#888'
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
  matchCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff'
  },
  matchInfo: {
    flex: 1,
    marginLeft: 12
  },
  matchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4
  },
  matchMeta: {
    fontSize: 13,
    color: '#888'
  },
  matchScoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  matchScoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff'
  },
  skillsContainer: {
    marginBottom: 12
  },
  sectionLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    fontWeight: '600'
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  skillBadge: {
    backgroundColor: '#f59e0b20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b40'
  },
  skillText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600'
  },
  availabilityContainer: {
    marginBottom: 12
  },
  availabilityList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  dayBadge: {
    backgroundColor: '#3b82f620',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f640'
  },
  dayText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600'
  },
  compatibilityBar: {
    marginBottom: 16
  },
  compatibilityLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    fontWeight: '600'
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4
  },
  compatibilityValue: {
    fontSize: 11,
    color: '#666',
    textAlign: 'right'
  },
  sendRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8
  },
  sendRequestText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600'
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center'
  },
  emptyStateButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20
  },
  emptyStateButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600'
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
    padding: 20
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
  recipientInfo: {
    alignItems: 'center',
    marginBottom: 20
  },
  recipientAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  recipientAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff'
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  },
  inputLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
    fontWeight: '600'
  },
  messageInput: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    minHeight: 100,
    textAlignVertical: 'top'
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  sendButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600'
  },
  bottomSpace: {
    height: 40
  }
});

export default StudyBuddyScreen;