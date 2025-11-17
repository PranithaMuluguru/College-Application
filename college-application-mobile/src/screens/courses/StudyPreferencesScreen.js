import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_URL from '../../config';

const StudyPreferencesScreen = ({ route, navigation }) => {
  const { userId, fromStudyBuddy } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [preferences, setPreferences] = useState({
    study_environment: 'quiet',
    preferred_study_time: 'evening',
    learning_style: 'visual',
    session_duration: 120,
    group_size: 'small',
    communication_style: 'balanced',
    primary_goal: 'improve_grades'
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/ai/preferences/${userId}`);
      
      if (response.data.has_preferences) {
        setPreferences(response.data.preferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      
      const response = await axios.post(
        `${API_URL}/ai/preferences/${userId}`, 
        preferences
      );
      
      if (fromStudyBuddy) {
        Alert.alert('Success', 'Preferences saved! Finding study buddies...', [
          { 
            text: 'OK', 
            onPress: () => {
              navigation.goBack();
              setTimeout(() => {
                navigation.navigate('StudyBuddy', { userId });
              }, 100);
            }
          }
        ]);
      } else {
        Alert.alert('Success', 'Preferences saved successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const renderOption = (key, value, label, icon) => {
    const isSelected = preferences[key] === value;
    
    return (
      <TouchableOpacity
        key={`${key}-${value}`}
        style={[styles.optionButton, isSelected && styles.optionButtonActive]}
        onPress={() => updatePreference(key, value)}
        activeOpacity={0.7}
      >
        {icon && (
          <Ionicons 
            name={icon} 
            size={20} 
            color={isSelected ? '#fff' : '#888'} 
          />
        )}
        <Text style={[
          styles.optionButtonText,
          isSelected && styles.optionButtonTextActive
        ]}>
          {label}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={18} color="#fff" style={styles.checkmark} />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Study Preferences</Text>
          <Text style={styles.headerSubtitle}>
            {fromStudyBuddy ? 'Required for matching' : 'Help us find your perfect study buddy'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Study Environment */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="home-outline" size={20} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Study Environment</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Where do you prefer to study?
          </Text>
          <View style={styles.optionGroup}>
            {renderOption('study_environment', 'quiet', 'Quiet', 'volume-mute')}
            {renderOption('study_environment', 'library', 'Library', 'library')}
            {renderOption('study_environment', 'social', 'Social', 'people')}
            {renderOption('study_environment', 'cafe', 'Café', 'cafe')}
          </View>
        </View>

        {/* Preferred Study Time */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={20} color="#10b981" />
            <Text style={styles.sectionTitle}>Preferred Study Time</Text>
          </View>
          <Text style={styles.sectionDescription}>
            When are you most productive?
          </Text>
          <View style={styles.optionGroup}>
            {renderOption('preferred_study_time', 'morning', 'Morning', 'sunny')}
            {renderOption('preferred_study_time', 'afternoon', 'Afternoon', 'partly-sunny')}
            {renderOption('preferred_study_time', 'evening', 'Evening', 'moon')}
            {renderOption('preferred_study_time', 'night', 'Night', 'moon-outline')}
          </View>
        </View>

        {/* Learning Style */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb-outline" size={20} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Learning Style</Text>
          </View>
          <Text style={styles.sectionDescription}>
            How do you learn best?
          </Text>
          <View style={styles.optionGroup}>
            {renderOption('learning_style', 'visual', 'Visual', 'eye')}
            {renderOption('learning_style', 'auditory', 'Auditory', 'headset')}
            {renderOption('learning_style', 'kinesthetic', 'Hands-on', 'hand-left')}
            {renderOption('learning_style', 'reading', 'Reading', 'book')}
          </View>
        </View>

        {/* Session Duration */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="timer-outline" size={20} color="#8b5cf6" />
            <Text style={styles.sectionTitle}>Session Duration</Text>
          </View>
          <Text style={styles.sectionDescription}>
            How long do you prefer to study?
          </Text>
          <View style={styles.optionGroup}>
            {renderOption('session_duration', 30, '30 min', 'time')}
            {renderOption('session_duration', 60, '1 hour', 'time')}
            {renderOption('session_duration', 120, '2 hours', 'time')}
            {renderOption('session_duration', 180, '3+ hours', 'time')}
          </View>
        </View>

        {/* Group Size */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={20} color="#ec4899" />
            <Text style={styles.sectionTitle}>Group Size</Text>
          </View>
          <Text style={styles.sectionDescription}>
            How many people do you prefer to study with?
          </Text>
          <View style={styles.optionGroup}>
            {renderOption('group_size', 'solo', 'Solo', 'person')}
            {renderOption('group_size', 'small', 'Small (2-3)', 'people')}
            {renderOption('group_size', 'medium', 'Medium (4-6)', 'people-circle')}
            {renderOption('group_size', 'large', 'Large (7+)', 'people-circle-outline')}
          </View>
        </View>

        {/* Communication Style */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubbles-outline" size={20} color="#06b6d4" />
            <Text style={styles.sectionTitle}>Communication Style</Text>
          </View>
          <Text style={styles.sectionDescription}>
            How do you prefer to interact while studying?
          </Text>
          <View style={styles.optionGroup}>
            {renderOption('communication_style', 'silent', 'Silent', 'volume-mute')}
            {renderOption('communication_style', 'minimal', 'Minimal', 'chatbubble')}
            {renderOption('communication_style', 'balanced', 'Balanced', 'chatbubbles')}
            {renderOption('communication_style', 'collaborative', 'Collaborative', 'people')}
          </View>
        </View>

        {/* Primary Goal */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flag-outline" size={20} color="#ef4444" />
            <Text style={styles.sectionTitle}>Primary Goal</Text>
          </View>
          <Text style={styles.sectionDescription}>
            What's your main study objective?
          </Text>
          <View style={styles.optionGroup}>
            {renderOption('primary_goal', 'improve_grades', 'Improve Grades', 'trending-up')}
            {renderOption('primary_goal', 'understand_concepts', 'Understand Concepts', 'bulb')}
            {renderOption('primary_goal', 'exam_prep', 'Exam Prep', 'document-text')}
            {renderOption('primary_goal', 'project_help', 'Project Help', 'construct')}
          </View>
        </View>

        {/* Current Selection Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <Text style={styles.summaryTitle}>Current Selection</Text>
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryItem}>
              📚 Environment: <Text style={styles.summaryValue}>{preferences.study_environment}</Text>
            </Text>
            <Text style={styles.summaryItem}>
              ⏰ Time: <Text style={styles.summaryValue}>{preferences.preferred_study_time}</Text>
            </Text>
            <Text style={styles.summaryItem}>
              🧠 Learning: <Text style={styles.summaryValue}>{preferences.learning_style}</Text>
            </Text>
            <Text style={styles.summaryItem}>
              ⏱️ Duration: <Text style={styles.summaryValue}>{preferences.session_duration} min</Text>
            </Text>
            <Text style={styles.summaryItem}>
              👥 Group: <Text style={styles.summaryValue}>{preferences.group_size}</Text>
            </Text>
            <Text style={styles.summaryItem}>
              💬 Style: <Text style={styles.summaryValue}>{preferences.communication_style}</Text>
            </Text>
            <Text style={styles.summaryItem}>
              🎯 Goal: <Text style={styles.summaryValue}>{preferences.primary_goal.replace('_', ' ')}</Text>
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={savePreferences}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>
                {fromStudyBuddy ? 'Save & Find Buddies' : 'Save Preferences'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a'
  },
  backButton: {
    padding: 4,
    marginRight: 16
  },
  headerInfo: {
    flex: 1
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
  section: {
    marginBottom: 28
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  },
  sectionDescription: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
    lineHeight: 18
  },
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2a2a2a',
    gap: 6,
    minWidth: 100
  },
  optionButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6'
  },
  optionButtonText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600'
  },
  optionButtonTextActive: {
    color: '#fff'
  },
  checkmark: {
    marginLeft: 'auto'
  },
  summaryCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff'
  },
  summaryContent: {
    gap: 8
  },
  summaryItem: {
    fontSize: 13,
    color: '#888'
  },
  summaryValue: {
    color: '#3b82f6',
    fontWeight: '600'
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  saveButtonDisabled: {
    backgroundColor: '#666',
    shadowOpacity: 0
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

export default StudyPreferencesScreen;