// CounselorFormScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_URL from '../../config';

const CounselorFormScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !message) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/wellness/counselor-form`, {
        user_id: userId,
        name,
        email,
        subject,
        message,
      });

      Alert.alert(
        'Message Sent',
        response.data.message,
        [
          response.data.crisis_hotline && {
            text: 'Call Hotline',
            onPress: () => Linking.openURL(`tel:${response.data.crisis_hotline}`),
          },
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ].filter(Boolean)
      );
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
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
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Counselor</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={24} color="#10b981" />
          <View style={styles.infoBannerText}>
            <Text style={styles.infoBannerTitle}>Confidential Support</Text>
            <Text style={styles.infoBannerSubtitle}>
              Your information is private and secure. A counselor will respond within 24 hours.
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Email <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="your.email@college.edu"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Subject (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Brief summary of your concern"
              placeholderTextColor="#666"
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Message <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Share what's on your mind... Your message is confidential."
              placeholderTextColor="#666"
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />
            <Text style={styles.charCount}>{message.length} characters</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>
              {loading ? 'Sending...' : 'Send Message'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Crisis Resources */}
        <View style={styles.crisisSection}>
          <View style={styles.crisisHeader}>
            <Ionicons name="alert-circle" size={20} color="#ef4444" />
            <Text style={styles.crisisTitle}>In Crisis?</Text>
          </View>
          <Text style={styles.crisisText}>
            If you're in immediate danger or having thoughts of self-harm, please call:
          </Text>
          <TouchableOpacity
            style={styles.hotlineButton}
            onPress={() => Linking.openURL('tel:1-800-273-8255')}
          >
            <Ionicons name="call" size={20} color="#fff" />
            <View>
              <Text style={styles.hotlineTitle}>National Suicide Prevention Lifeline</Text>
              <Text style={styles.hotlineNumber}>1-800-273-8255</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#10b98120',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#10b98140',
  },
  infoBannerText: {
    flex: 1,
  },
  infoBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 4,
  },
  infoBannerSubtitle: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  form: {
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  required: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8b5cf6',
    padding: 18,
    borderRadius: 12,
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
  crisisSection: {
    backgroundColor: '#1a0a0a',
    borderWidth: 2,
    borderColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  crisisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  crisisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  crisisText: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
    marginBottom: 12,
  },
  hotlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 12,
  },
  hotlineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  hotlineNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  bottomSpace: {
    height: 40,
  },
});

export default CounselorFormScreen;