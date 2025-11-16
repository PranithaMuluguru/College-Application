// WellnessCheckInScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import axios from 'axios';
import API_URL from '../../config';

const WellnessCheckInScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  
  const [mood, setMood] = useState(3);
  const [stress, setStress] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [notes, setNotes] = useState('');
  const [triggers, setTriggers] = useState('');
  const [loading, setLoading] = useState(false);

  const moodEmojis = [
    { value: 1, emoji: '😢', label: 'Very Low' },
    { value: 2, emoji: '😕', label: 'Low' },
    { value: 3, emoji: '😐', label: 'Neutral' },
    { value: 4, emoji: '🙂', label: 'Good' },
    { value: 5, emoji: '😄', label: 'Great' },
  ];

// In WellnessCheckInScreen.tsx
const handleSubmit = async () => {
  setLoading(true);
  try {
    const response = await axios.post(`${API_URL}/wellness/checkin`, {
      user_id: userId,
      mood: mood,
      stress: stress,
      energy: energy,
      sleep_hours: sleepHours,
      sleep_quality: sleepQuality,
      notes: notes,
      triggers: triggers,
    });

    console.log('✅ Check-in response:', response.data);

    Alert.alert(
      'Success',
      response.data.message,
      [
        {
          text: 'Done',
          onPress: () => {
            // Navigate back and refresh
            navigation.goBack();
            // Or trigger a refresh in parent component
          },
        },
      ]
    );
  } catch (error) {
    console.error('❌ Check-in error:', error);
    Alert.alert('Error', 'Failed to save check-in. Please try again.');
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Check-in</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mood Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How's your mood?</Text>
          <View style={styles.moodGrid}>
            {moodEmojis.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.moodButton,
                  mood === item.value && styles.moodButtonActive,
                ]}
                onPress={() => setMood(item.value)}
                activeOpacity={0.7}
              >
                <Text style={styles.moodEmoji}>{item.emoji}</Text>
                <Text style={styles.moodLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stress Level */}
        <View style={styles.section}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sectionTitle}>Stress Level</Text>
            <Text style={styles.sliderValue}>{stress}/10</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={stress}
            onValueChange={setStress}
            minimumTrackTintColor="#ef4444"
            maximumTrackTintColor="#2a2a2a"
            thumbTintColor="#ef4444"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>Low</Text>
            <Text style={styles.sliderLabel}>High</Text>
          </View>
        </View>

        {/* Energy Level */}
        <View style={styles.section}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sectionTitle}>Energy Level</Text>
            <Text style={styles.sliderValue}>{energy}/10</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={energy}
            onValueChange={setEnergy}
            minimumTrackTintColor="#10b981"
            maximumTrackTintColor="#2a2a2a"
            thumbTintColor="#10b981"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>Drained</Text>
            <Text style={styles.sliderLabel}>Energized</Text>
          </View>
        </View>

        {/* Sleep Hours */}
        <View style={styles.section}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sectionTitle}>Sleep Last Night</Text>
            <Text style={styles.sliderValue}>{sleepHours}h</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={12}
            step={0.5}
            value={sleepHours}
            onValueChange={setSleepHours}
            minimumTrackTintColor="#3b82f6"
            maximumTrackTintColor="#2a2a2a"
            thumbTintColor="#3b82f6"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>0h</Text>
            <Text style={styles.sliderLabel}>12h</Text>
          </View>
        </View>

        {/* Sleep Quality */}
        <View style={styles.section}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sectionTitle}>Sleep Quality</Text>
            <Text style={styles.sliderValue}>{sleepQuality}/5</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={sleepQuality}
            onValueChange={setSleepQuality}
            minimumTrackTintColor="#8b5cf6"
            maximumTrackTintColor="#2a2a2a"
            thumbTintColor="#8b5cf6"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>Poor</Text>
            <Text style={styles.sliderLabel}>Excellent</Text>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How are you feeling? (Optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Share what's on your mind..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Triggers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Any triggers today? (Optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., exam stress, argument, good news..."
            placeholderTextColor="#666"
            value={triggers}
            onChangeText={setTriggers}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Saving...' : 'Save Check-in'}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  moodButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2a2a2a',
    alignItems: 'center',
    gap: 8,
  },
  moodButtonActive: {
    borderColor: '#8b5cf6',
    backgroundColor: '#8b5cf620',
  },
  moodEmoji: {
    fontSize: 32,
  },
  moodLabel: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#8b5cf6',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 40,
  },
});

export default WellnessCheckInScreen;