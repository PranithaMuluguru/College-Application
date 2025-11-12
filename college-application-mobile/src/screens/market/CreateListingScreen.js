// screens/CreateListingScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import API_URL from '../../config';

const CreateListingScreen = ({ navigation, route }) => {
  const { userId, userInfo } = route.params;
  const [listingType, setListingType] = useState('sell');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [location, setLocation] = useState('Main Campus');
  const [images, setImages] = useState([]);
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Books',
    'Electronics',
    'Accessories',
    'Furniture',
    'Appliances',
    'Other',
  ];

  const conditions = ['Brand New', 'Like New', 'Excellent', 'Good', 'Fair'];

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can only upload up to 5 images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return false;
    }
    if (listingType === 'sell' && !price.trim()) {
      Alert.alert('Error', 'Please enter a price');
      return false;
    }
    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return false;
    }
    if (!condition) {
      Alert.alert('Error', 'Please select a condition');
      return false;
    }
    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one image');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const finalPrice =
        listingType === 'free'
          ? 'Free'
          : listingType === 'trade'
          ? 'Trade/Barter'
          : `$${price}`;

      const listingData = {
        seller_id: userId,
        title,
        description,
        price: finalPrice,
        category,
        condition,
        location,
        images,
        is_negotiable: isNegotiable,
      };

      await axios.post(`${API_URL}/marketplace/items`, listingData);

      Alert.alert('Success', 'Your listing has been created!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating listing:', error);
      Alert.alert('Error', 'Could not create listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Listing</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I want to</Text>
          <View style={styles.typeButtons}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                listingType === 'sell' && styles.typeButtonActive,
              ]}
              onPress={() => setListingType('sell')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="cash-outline"
                size={20}
                color={listingType === 'sell' ? '#fff' : '#888'}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  listingType === 'sell' && styles.typeButtonTextActive,
                ]}
              >
                Sell for money
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                listingType === 'trade' && styles.typeButtonActive,
              ]}
              onPress={() => setListingType('trade')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="swap-horizontal-outline"
                size={20}
                color={listingType === 'trade' ? '#fff' : '#888'}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  listingType === 'trade' && styles.typeButtonTextActive,
                ]}
              >
                Trade/Barter
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                listingType === 'free' && styles.typeButtonActive,
              ]}
              onPress={() => setListingType('free')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="gift-outline"
                size={20}
                color={listingType === 'free' ? '#fff' : '#888'}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  listingType === 'free' && styles.typeButtonTextActive,
                ]}
              >
                Give away free
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos (up to 5)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imagesScroll}
          >
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={pickImage}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-outline" size={32} color="#666" />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>

            {images.map((image, index) => (
              <View key={index} style={styles.imagePreview}>
                <Image source={{ uri: image }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
                {index === 0 && (
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverBadgeText}>Cover</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
          <Text style={styles.helperText}>
            First photo will be the cover image
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., iPhone 12 Pro - Excellent Condition"
            placeholderTextColor="#666"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your item in detail..."
            placeholderTextColor="#666"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        {listingType === 'sell' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0"
                placeholderTextColor="#666"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity
              style={styles.negotiableToggle}
              onPress={() => setIsNegotiable(!isNegotiable)}
              activeOpacity={0.8}
            >
              <View style={styles.checkbox}>
                {isNegotiable && (
                  <Ionicons name="checkmark" size={16} color="#8b5cf6" />
                )}
              </View>
              <Text style={styles.negotiableText}>Price is negotiable</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  category === cat && styles.categoryButtonActive,
                ]}
                onPress={() => setCategory(cat)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    category === cat && styles.categoryButtonTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Condition</Text>
          <View style={styles.conditionList}>
            {conditions.map((cond) => (
              <TouchableOpacity
                key={cond}
                style={[
                  styles.conditionButton,
                  condition === cond && styles.conditionButtonActive,
                ]}
                onPress={() => setCondition(cond)}
                activeOpacity={0.8}
              >
                <View style={styles.radioButton}>
                  {condition === cond && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text
                  style={[
                    styles.conditionButtonText,
                    condition === cond && styles.conditionButtonTextActive,
                  ]}
                >
                  {cond}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Main Campus, North Dorms"
            placeholderTextColor="#666"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Creating...' : 'Create Listing'}
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  typeButtons: {
    gap: 12,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  typeButtonActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  imagesScroll: {
    marginBottom: 8,
  },
  addPhotoButton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#2a2a2a',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addPhotoText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  imagePreview: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  coverBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  coverBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  dollarSign: {
    fontSize: 20,
    fontWeight: '600',
    color: '#888',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    paddingVertical: 16,
  },
  negotiableToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  negotiableText: {
    fontSize: 14,
    color: '#888',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  categoryButtonActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  conditionList: {
    gap: 12,
  },
  conditionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  conditionButtonActive: {
    borderColor: '#8b5cf6',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8b5cf6',
  },
  conditionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  conditionButtonTextActive: {
    color: '#8b5cf6',
  },
  submitButton: {
    marginTop: 32,
    paddingVertical: 18,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  bottomSpace: {
    height: 40,
  },
});

export default CreateListingScreen;