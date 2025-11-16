// src/screens/CreateEventScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';

const CreateEventScreen = ({ route, navigation }) => {
  const { clubId } = route.params;
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    eventDate: new Date(),
    registrationRequired: false,
    maxParticipants: ''
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.location) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/clubs/${clubId}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          event_date: formData.eventDate.toISOString(),
          location: formData.location,
          registration_required: formData.registrationRequired,
          max_participants: formData.maxParticipants
            ? parseInt(formData.maxParticipants)
            : null
        })
      });

      if (response.ok) {
        Alert.alert('Success', 'Event created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Event</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={loading}>
          <Text style={[styles.submitText, loading && styles.submitTextDisabled]}>
            {loading ? 'Creating...' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Event Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter event title"
            value={formData.title}
            onChangeText={(text) =>
              setFormData({ ...formData, title: text })
            }
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your event..."
            multiline
            numberOfLines={6}
            value={formData.description}
            onChangeText={(text) =>
              setFormData({ ...formData, description: text })
            }
          />
        </View>

        {/* Date & Time */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date & Time *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.dateText}>
              {formData.eventDate.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={formData.eventDate}
            mode="datetime"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setFormData({ ...formData, eventDate: selectedDate });
              }
            }}
          />
        )}

        {/* Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location *</Text>
          <TextInput
            style={styles.input}
            placeholder="Event venue"
            value={formData.location}
            onChangeText={(text) =>
              setFormData({ ...formData, location: text })
            }
          />
        </View>

        {/* Registration Required */}
        <View style={styles.switchGroup}>
          <View style={styles.switchLabel}>
            <Text style={styles.label}>Require Registration</Text>
            <Text style={styles.helpText}>
              Users need to register to attend
            </Text>
          </View>
          <Switch
            value={formData.registrationRequired}
            onValueChange={(value) =>
              setFormData({ ...formData, registrationRequired: value })
            }
          />
        </View>

        {/* Max Participants */}
        {formData.registrationRequired && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Maximum Participants (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Leave empty for unlimited"
              keyboardType="number-pad"
              value={formData.maxParticipants}
              onChangeText={(text) =>
                setFormData({ ...formData, maxParticipants: text })
              }
            />
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>* Required fields</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF'
  },
  submitTextDisabled: {
    color: '#ccc'
  },
  content: {
    flex: 1,
    padding: 16
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333'
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top'
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  dateText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333'
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20
  },
  switchLabel: {
    flex: 1
  },
  footer: {
    paddingVertical: 20
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center'
  }
});

export default CreateEventScreen;