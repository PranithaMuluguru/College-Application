// screens/ItemDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_URL from '../../config';

const ItemDetailScreen = ({ navigation, route }) => {
  const { item: initialItem, userId, userInfo } = route.params;
  const [item, setItem] = useState(initialItem);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(initialItem.isSaved);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');

  useEffect(() => {
    fetchItemDetails();
  }, []);

  const fetchItemDetails = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/marketplace/items/${item.id}`,
        {
          params: { user_id: userId },
        }
      );
      setItem(response.data);
      setIsSaved(response.data.isSaved);
    } catch (error) {
      console.error('Error fetching item details:', error);
    }
  };

const toggleSave = async () => {
  try {
    const response = await axios.post(
      `${API_URL}/marketplace/items/${item.id}/save?user_id=${userId}`,
      {} // Empty body
    );
    setIsSaved(response.data.is_saved);
  } catch (error) {
    console.error('Error toggling save:', error);
    console.error('Error details:', error.response?.data);
    Alert.alert('Error', 'Could not save item');
  }
};

  const handleContactSeller = async () => {
  if (item.seller.id === userId) {
    Alert.alert('Notice', 'This is your own listing');
    return;
  }

  try {
    const response = await axios.post(`${API_URL}/marketplace/chats`, {
      item_id: item.id,
      buyer_id: userId,
    });

    // Navigate to chat screen (not ChatList)
    navigation.navigate('MarketplaceChat', {
      chatId: response.data.chat_id,
      userId,
      userInfo,
      itemInfo: {
        id: item.id,
        title: item.title,
        image: item.images[0],
        price: item.price,
      }
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    Alert.alert('Error', 'Could not start chat');
  }
};
const handleMakeOffer = async () => {
  if (!offerAmount.trim()) {
    Alert.alert('Error', 'Please enter an offer amount');
    return;
  }

  try {
    // First create/get the chat
    const chatResponse = await axios.post(`${API_URL}/marketplace/chats`, {
      item_id: item.id,
      buyer_id: userId,
    });

    // Then send the offer message
    const messageResponse = await axios.post(
      `${API_URL}/marketplace/chats/${chatResponse.data.chat_id}/messages`,
      {
        sender_id: userId,
        message: offerMessage || `I'd like to offer ${offerAmount} for this item`,
        message_type: 'offer',
        offer_amount: offerAmount,
      }
    );

    console.log('Offer sent:', messageResponse.data);

    setShowOfferModal(false);
    setOfferAmount('');
    setOfferMessage('');

    Alert.alert('Success', 'Your offer has been sent to the seller', [
      {
        text: 'View Chat',
        onPress: () =>
          navigation.navigate('MarketplaceChat', {
            chatId: chatResponse.data.chat_id,
            userId,
            userInfo,
          }),
      },
      { text: 'OK' },
    ]);
  } catch (error) {
    console.error('Error making offer:', error);
    console.error('Error details:', error.response?.data);
    Alert.alert('Error', 'Could not send offer. Please try again.');
  }
};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={toggleSave}>
            <Ionicons
              name={isSaved ? 'heart' : 'heart-outline'}
              size={24}
              color={isSaved ? '#ef4444' : '#fff'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: item.images[currentImageIndex] || 'https://via.placeholder.com/400',
            }}
            style={styles.image}
          />
          {item.images.length > 1 && (
            <View style={styles.imageDots}>
              {item.images.map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dot,
                    idx === currentImageIndex && styles.dotActive,
                  ]}
                  onPress={() => setCurrentImageIndex(idx)}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.priceSection}>
            <View>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{item.price}</Text>
                {item.isNegotiable && (
                  <View style={styles.negotiableBadge}>
                    <Ionicons name="pricetag" size={12} color="#8b5cf6" />
                    <Text style={styles.negotiableText}>Negotiable</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={16} color="#666" />
              <Text style={styles.statText}>{item.views} views</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.statText}>{item.postedDate}</Text>
            </View>
          </View>

          <View style={styles.quickInfo}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Condition</Text>
              <Text style={styles.infoValue}>{item.condition}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{item.category}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Location</Text>
              <View style={styles.locationValue}>
                <Ionicons name="location" size={12} color="#888" />
                <Text style={[styles.infoValue, { fontSize: 11 }]}>
                  {item.location}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>

          <View style={styles.sellerSection}>
            <Text style={styles.sectionTitle}>Seller Information</Text>
            <View style={styles.sellerCard}>
              <View style={styles.sellerHeader}>
                <View style={styles.sellerAvatar}>
                  <Text style={styles.sellerAvatarText}>
                    {item.seller.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.sellerInfo}>
                  <View style={styles.sellerNameRow}>
                    <Text style={styles.sellerName}>{item.seller.name}</Text>
                    {item.seller.verified && (
                      <Ionicons name="shield-checkmark" size={16} color="#10b981" />
                    )}
                  </View>
                  <Text style={styles.sellerCollege}>{item.seller.college}</Text>
                  <View style={styles.sellerStats}>
                    <View style={styles.sellerStat}>
                      <Ionicons name="star" size={14} color="#f59e0b" />
                      <Text style={styles.sellerStatText}>
                        {item.seller.rating}
                      </Text>
                    </View>
                    <Text style={styles.sellerStatDivider}>•</Text>
                    <Text style={styles.sellerStatText}>
                      {item.seller.itemsSold} sold
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.viewProfileButton}>
                <Text style={styles.viewProfileText}>View Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.section, styles.safetySection]}>
            <Text style={styles.safetyTitle}>
              <Ionicons name="shield-checkmark" size={16} color="#3b82f6" />
              {' Safety Tips'}
            </Text>
            <Text style={styles.safetyTip}>• Meet in public places on campus</Text>
            <Text style={styles.safetyTip}>• Inspect items before payment</Text>
            <Text style={styles.safetyTip}>
              • Don't share personal financial info
            </Text>
            <Text style={styles.safetyTip}>• Report suspicious activity</Text>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={handleContactSeller}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#fff" />
          <Text style={styles.chatButtonText}>Chat with Seller</Text>
        </TouchableOpacity>
        {item.isNegotiable ? (
          <TouchableOpacity
            style={styles.offerButton}
            onPress={() => setShowOfferModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.offerButtonText}>Make Offer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.offerButton}
            onPress={handleContactSeller}
            activeOpacity={0.8}
          >
            <Text style={styles.offerButtonText}>Contact Seller</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={showOfferModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOfferModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Make an Offer</Text>
              <TouchableOpacity onPress={() => setShowOfferModal(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.listedPrice}>Listed Price: {item.price}</Text>

              <Text style={styles.inputLabel}>Your Offer Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your offer (e.g., $30)"
                placeholderTextColor="#666"
                value={offerAmount}
                onChangeText={setOfferAmount}
              />

              <Text style={styles.inputLabel}>Message (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add a message to the seller..."
                placeholderTextColor="#666"
                value={offerMessage}
                onChangeText={setOfferMessage}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={styles.sendOfferButton}
                onPress={handleMakeOffer}
                activeOpacity={0.8}
              >
                <Text style={styles.sendOfferText}>Send Offer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    aspectRatio: 1,
    backgroundColor: '#1a1a1a',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageDots: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: '#fff',
  },
  detailsContainer: {
    padding: 20,
  },
  priceSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  negotiableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#8b5cf620',
  },
  negotiableText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: '#666',
  },
  quickInfo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  infoLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  locationValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#888',
  },
  sellerSection: {
    marginBottom: 24,
  },
  sellerCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  sellerHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  sellerCollege: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  sellerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerStatText: {
    fontSize: 12,
    color: '#888',
  },
  sellerStatDivider: {
    fontSize: 12,
    color: '#444',
  },
  viewProfileButton: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  viewProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  safetySection: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#3b82f620',
    borderWidth: 1,
    borderColor: '#3b82f640',
  },
  safetyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 12,
  },
  safetyTip: {
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
    lineHeight: 20,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  chatButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  offerButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
  },
  offerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  modalBody: {
    padding: 20,
  },
  listedPrice: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 20,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sendOfferButton: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
  },
  sendOfferText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  bottomSpace: {
    height: 20,
  },
});

export default ItemDetailScreen;