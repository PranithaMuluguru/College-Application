// src/screens/admin/EditClubScreen.js
import React, { useState, useEffect } from 'react';
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

const EditClubScreen = ({ route, navigation }) => {
  const { clubId } = route.params;
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    logo_url: '',
    cover_url: ''
  });
  const [categories] = useState([
    'Sports',
    'Technical',
    'Cultural',
    'Academic',
    'Social',
    'Other'
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClubDetails();
  }, [clubId]);

  const fetchClubDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/admin/clubs/${clubId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.name,
          category: data.category,
          description: data.description,
          logo_url: data.logo_url || '',
          cover_url: data.cover_url || ''
        });
      } else {
        Alert.alert('Error', 'Failed to fetch club details');
      }
    } catch (error) {
      console.error('Error fetching club:', error);
      Alert.alert('Error', 'Failed to fetch club details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name || !formData.category || !formData.description) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setSaving(true);

    try {
      const token = await AsyncStorage.getItem('admin_token');
      
      const requestBody = {
        name: formData.name,
        description: formData.description,
        logo_url: formData.logo_url || null,
        cover_url: formData.cover_url || null
      };

      const response = await fetch(`${API_URL}/admin/clubs/${clubId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        Alert.alert('Success', 'Club updated successfully!', [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack()
          }
        ]);
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to update club');
      }
    } catch (error) {
      console.error('Error updating club:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Club</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#8b5cf6" />
          ) : (
            <Text style={styles.submitText}>Save</Text>
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

        {/* Category (Read-only display) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.readonlyInput}>
            <Text style={styles.readonlyText}>{formData.category}</Text>
          </View>
          <Text style={styles.helpText}>
            Category cannot be changed after creation
          </Text>
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

        {/* Logo URL (Optional) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Logo URL (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://example.com/logo.png"
            placeholderTextColor="#666"
            value={formData.logo_url}
            onChangeText={(text) => setFormData({ ...formData, logo_url: text })}
            autoCapitalize="none"
          />
          <Text style={styles.helpText}>
            Direct URL to club logo image
          </Text>
        </View>

        {/* Cover URL (Optional) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cover URL (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://example.com/cover.png"
            placeholderTextColor="#666"
            value={formData.cover_url}
            onChangeText={(text) => setFormData({ ...formData, cover_url: text })}
            autoCapitalize="none"
          />
          <Text style={styles.helpText}>
            Direct URL to club cover image
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  readonlyInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    opacity: 0.6
  },
  readonlyText: {
    fontSize: 16,
    color: '#8b5cf6'
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

export default EditClubScreen;