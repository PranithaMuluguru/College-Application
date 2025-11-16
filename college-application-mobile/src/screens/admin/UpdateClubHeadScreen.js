// src/screens/admin/UpdateClubHeadScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';

const UpdateClubHeadScreen = ({ route, navigation }) => {
  const { clubId, currentHead } = route.params;
  const [clubHeadEmail, setClubHeadEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!clubHeadEmail) {
      Alert.alert('Error', 'Please enter a club head email');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clubHeadEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/admin/clubs/${clubId}/head`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ club_head_email: clubHeadEmail })
      });

      if (response.ok) {
        Alert.alert('Success', 'Club head updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to update club head');
      }
    } catch (error) {
      console.error('Error updating club head:', error);
      Alert.alert('Error', 'Failed to update club head');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Club Head</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#8b5cf6" />
          ) : (
            <Text style={styles.submitText}>Update</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.currentHeadSection}>
          <Text style={styles.sectionTitle}>Current Club Head</Text>
          {currentHead ? (
            <View style={styles.currentHeadCard}>
              <View style={styles.headAvatar}>
                <Text style={styles.headAvatarText}>
                  {currentHead.name.charAt(0)}
                </Text>
              </View>
              <View style={styles.headInfo}>
                <Text style={styles.headName}>{currentHead.name}</Text>
                <Text style={styles.headEmail}>{currentHead.email}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.noCurrentHead}>
              <Text style={styles.noCurrentHeadText}>No club head assigned</Text>
            </View>
          )}
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>New Club Head</Text>
          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email of new club head"
            placeholderTextColor="#666"
            keyboardType="email-address"
            value={clubHeadEmail}
            onChangeText={setClubHeadEmail}
          />
          <Text style={styles.helpText}>
            This user must already be registered in the system
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff'
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b5cf6'
  },
  content: {
    flex: 1,
    padding: 16
  },
  currentHeadSection: {
    marginBottom: 32
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16
  },
  currentHeadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  headAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  headAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff'
  },
  headInfo: {
    flex: 1
  },
  headName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  headEmail: {
    fontSize: 14,
    color: '#8b5cf6'
  },
  noCurrentHead: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center'
  },
  noCurrentHeadText: {
    fontSize: 16,
    color: '#666'
  },
  inputSection: {
    marginBottom: 32
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#fff'
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    color: '#fff'
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8
  }
});

export default UpdateClubHeadScreen;