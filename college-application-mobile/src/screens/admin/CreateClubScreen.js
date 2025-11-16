// src/screens/admin/CreateClubScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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

const CreateClubScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    clubHeadEmail: ''
  });
  const [categories] = useState([
    'Sports',
    'Technical', 
    'Cultural',
    'Academic',
    'Social',
    'Other'
  ]);
  const [loading, setLoading] = useState(false);

// src/screens/admin/CreateClubScreen.js
const handleSubmit = async () => {
  if (!formData.name || !formData.category || !formData.description || !formData.clubHeadEmail) {
    Alert.alert('Error', 'Please fill all fields');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.clubHeadEmail)) {
    Alert.alert('Error', 'Please enter a valid email address');
    return;
  }

  setLoading(true);

  try {
    const token = await AsyncStorage.getItem('admin_token');
    
    const requestBody = {
      name: formData.name,
      category: formData.category,
      description: formData.description,
      club_head_email: formData.clubHeadEmail  // ✅ Fixed field name
    };

    const response = await fetch(`${API_URL}/admin/clubs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const responseData = await response.json();

    if (response.ok) {
      Alert.alert('Success', 'Club created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert('Error', responseData.detail || 'Failed to create club');
    }
  } catch (error) {
    console.error('Error creating club:', error);
    Alert.alert('Error', 'Network error. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const renderCategorySelector = () => (
    <View style={styles.categoryContainer}>
      {categories.map((category) => (
        <TouchableOpacity
          key={category}
          style={[
            styles.categoryButton,
            formData.category === category && styles.categoryButtonActive
          ]}
          onPress={() => setFormData({ ...formData, category })}
        >
          <Text
            style={[
              styles.categoryText,
              formData.category === category && styles.categoryTextActive
            ]}
          >
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Club</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#8b5cf6" />
          ) : (
            <Text style={styles.submitText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Club Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Club Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter club name"
            placeholderTextColor="#666"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category *</Text>
          {renderCategorySelector()}
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the club's purpose and activities..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={6}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
          />
        </View>

        {/* Club Head Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Club Head Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email of club head"
            placeholderTextColor="#666"
            keyboardType="email-address"
            value={formData.clubHeadEmail}
            onChangeText={(text) => setFormData({ ...formData, clubHeadEmail: text })}
          />
          <Text style={styles.helpText}>
            This user must already be registered in the system
          </Text>
        </View>

        {/* Preview Section */}
        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>Club Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewLogo}>
              <Text style={styles.previewLogoText}>
                {formData.name.charAt(0) || 'C'}
              </Text>
            </View>
            <View style={styles.previewContent}>
              <Text style={styles.previewName}>
                {formData.name || 'Club Name'}
              </Text>
              {formData.category && (
                <View style={styles.previewCategory}>
                  <Text style={styles.previewCategoryText}>
                    {formData.category}
                  </Text>
                </View>
              )}
              <Text style={styles.previewDescription} numberOfLines={2}>
                {formData.description || 'Club description will appear here...'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>* Required fields</Text>
        </View>
      </ScrollView>
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
  inputGroup: {
    marginBottom: 24
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#fff'
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
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
  textArea: {
    height: 120,
    textAlignVertical: 'top'
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    backgroundColor: '#1a1a1a'
  },
  categoryButtonActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6'
  },
  categoryText: {
    fontSize: 14,
    color: '#666'
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600'
  },
  previewSection: {
    marginTop: 20
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#fff'
  },
  previewCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  previewLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  previewLogoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  previewContent: {
    flex: 1,
    justifyContent: 'center'
  },
  previewName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#fff'
  },
  previewCategory: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#8b5cf620',
    marginBottom: 8
  },
  previewCategoryText: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '600'
  },
  previewDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20
  },
  footer: {
    paddingVertical: 20
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  }
});

export default CreateClubScreen;