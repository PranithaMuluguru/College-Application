import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import API_URL from '../../config';

const EditProfileScreen = ({ navigation, route }) => {
  const { userInfo, userId } = route.params;

  const [fullName, setFullName] = useState(userInfo?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(
    userInfo?.phone_number || ''
  );
  const [year, setYear] = useState(userInfo?.year?.toString() || '1');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name cannot be empty');
      return;
    }

    if (parseInt(year) < 1 || parseInt(year) > 4) {
      Alert.alert('Error', 'Year must be between 1 and 4');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.put(`${API_URL}/users/${userId}`, {
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim() || null,
        year: parseInt(year),
      });

      Alert.alert('Success', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: () => {
            // Reload app by navigating back to home with updated data
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: 'Home',
                  params: {
                    userId,
                    userInfo: response.data,
                  },
                },
              ],
            });
          },
        },
      ]);
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Could not update profile'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Read-only fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>College ID (Cannot be changed)</Text>
            <View style={[styles.input, styles.disabledInput]}>
              <Text style={styles.disabledText}>
                {userInfo?.college_id}
              </Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email (Cannot be changed)</Text>
            <View style={[styles.input, styles.disabledInput]}>
              <Text style={styles.disabledText}>{userInfo?.email}</Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Department (Cannot be changed)
            </Text>
            <View style={[styles.input, styles.disabledInput]}>
              <Text style={styles.disabledText}>
                {userInfo?.department}
              </Text>
            </View>
          </View>
        </View>

        {/* Editable fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Editable Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter phone number"
              placeholderTextColor="#666"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Year *</Text>
            <View style={styles.yearButtons}>
              {[1, 2, 3, 4].map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[
                    styles.yearButton,
                    year === y.toString() && styles.yearButtonActive,
                  ]}
                  onPress={() => setYear(y.toString())}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.yearButtonText,
                      year === y.toString() && styles.yearButtonTextActive,
                    ]}
                  >
                    Year {y}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            style={styles.saveButtonGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </LinearGradient>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  disabledInput: {
    backgroundColor: '#0f0f0f',
    borderColor: '#1a1a1a',
  },
  disabledText: {
    color: '#666',
    fontSize: 15,
  },
  yearButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  yearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
  },
  yearButtonActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  yearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  yearButtonTextActive: {
    color: '#fff',
  },
  saveButton: {
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  bottomSpace: {
    height: 40,
  },
});

export default EditProfileScreen;