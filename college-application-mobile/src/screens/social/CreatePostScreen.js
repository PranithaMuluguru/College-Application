import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

import API_URL from '../../config';

const CreatePostScreen = ({ navigation, route }) => {
  const { userId, userInfo } = route.params;
  const [content, setContent] = useState('');
  const [mediaUri, setMediaUri] = useState(null);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Please grant permission to access photos'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const createPost = async () => {
    if (!content.trim() && !mediaUri) {
      Alert.alert('Error', 'Please add some content or an image');
      return;
    }

    setLoading(true);
    try {
      // Note: In production, you'd upload the image to a storage service first
      // and get a URL back. For now, we'll just use the local URI.
      await axios.post(`${API_URL}/posts/${userId}`, {
        content: content.trim(),
        media_url: mediaUri,
        media_type: mediaUri ? 'image' : null,
        is_announcement: isAnnouncement,
      });

      Alert.alert('Success', 'Post created successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Could not create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity
          style={[styles.postButton, loading && styles.postButtonDisabled]}
          onPress={createPost}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.postButtonText}>...</Text>
          ) : (
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              style={styles.postButtonGradient}
            >
              <Text style={styles.postButtonText}>Post</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.authorSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userInfo?.full_name?.charAt(0) || 'U'}
            </Text>
          </View>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>
              {userInfo?.full_name || 'User'}
            </Text>
            <Text style={styles.authorDetails}>
              {userInfo?.department || 'Department'} • Year{' '}
              {userInfo?.year || '0'}
            </Text>
          </View>
        </View>

        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          placeholderTextColor="#666"
          value={content}
          onChangeText={setContent}
          multiline
          autoFocus
          maxLength={2000}
        />

        {mediaUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: mediaUri }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setMediaUri(null)}
            >
              <Ionicons name="close-circle" size={32} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionButton} onPress={pickImage}>
            <LinearGradient
              colors={['#10b98120', '#10b98110']}
              style={styles.optionGradient}
            >
              <Ionicons name="image-outline" size={24} color="#10b981" />
              <Text style={styles.optionText}>Add Photo</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.announcementOption}>
            <View style={styles.announcementInfo}>
              <Ionicons name="megaphone-outline" size={20} color="#8b5cf6" />
              <Text style={styles.announcementLabel}>Make Announcement</Text>
            </View>
            <Switch
              value={isAnnouncement}
              onValueChange={setIsAnnouncement}
              trackColor={{ false: '#2a2a2a', true: '#8b5cf6' }}
              thumbColor={isAnnouncement ? '#fff' : '#888'}
            />
          </View>

          {isAnnouncement && (
            <View style={styles.announcementNote}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#f59e0b"
              />
              <Text style={styles.announcementNoteText}>
                This will be sent as a notification to all your followers
              </Text>
            </View>
          )}
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={20} color="#8b5cf6" />
          <Text style={styles.tipText}>
            Tip: Add relevant hashtags to help others discover your post
          </Text>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  postButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  postButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  authorDetails: {
    fontSize: 13,
    color: '#666',
  },
  input: {
    color: '#fff',
    fontSize: 17,
    lineHeight: 24,
    minHeight: 150,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  optionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#10b98140',
    borderRadius: 12,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10b981',
  },
  announcementOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  announcementInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  announcementLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  announcementNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#f59e0b20',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b40',
  },
  announcementNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#f59e0b',
    lineHeight: 18,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#8b5cf620',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8b5cf640',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#8b5cf6',
    lineHeight: 18,
  },
});

export default CreatePostScreen;