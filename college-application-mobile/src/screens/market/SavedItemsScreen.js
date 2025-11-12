// screens/SavedItemsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_URL from '../../config';

const SavedItemsScreen = ({ navigation, route }) => {
  const { userId, userInfo } = route.params;
  const [savedItems, setSavedItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSavedItems();
  }, []);

  const fetchSavedItems = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/marketplace/saved/${userId}`
      );
      setSavedItems(response.data);
    } catch (error) {
      console.error('Error fetching saved items:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSavedItems();
    setRefreshing(false);
  };

  const handleUnsave = async (itemId) => {
    try {
      await axios.post(`${API_URL}/marketplace/items/${itemId}/save`, {
        user_id: userId,
      });
      setSavedItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error('Error unsaving item:', error);
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
        <Text style={styles.headerTitle}>Saved Items</Text>
        <View style={{ width: 40 }} />
      </View>

      {savedItems.length > 0 ? (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#8b5cf6"
            />
          }
        >
          <View style={styles.itemsGrid}>
            {savedItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemCard}
                onPress={() =>
                  navigation.navigate('ItemDetail', { item, userId, userInfo })
                }
                activeOpacity={0.8}
              >
                <View style={styles.itemImageContainer}>
                  <Image
                    source={{
                      uri: item.images[0] || 'https://via.placeholder.com/200',
                    }}
                    style={styles.itemImage}
                  />
                  <TouchableOpacity
                    style={styles.unsaveButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleUnsave(item.id);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="heart" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemPrice}>{item.price}</Text>
                  <View style={styles.itemFooter}>
                    <View style={styles.sellerInfo}>
                      <View style={styles.sellerAvatar}>
                        <Text style={styles.sellerAvatarText}>
                          {item.seller.name.charAt(0)}
                        </Text>
                      </View>
                      <Text style={styles.sellerName} numberOfLines={1}>
                        {item.seller.name}
                      </Text>
                    </View>
                    <Text style={styles.postedDate}>{item.postedDate}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.bottomSpace} />
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={64} color="#444" />
          <Text style={styles.emptyStateTitle}>No saved items</Text>
          <Text style={styles.emptyStateText}>
            Items you save will appear here for easy access
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Marketplace', { userId, userInfo })}
            activeOpacity={0.8}
          >
            <Text style={styles.browseButtonText}>Browse Marketplace</Text>
          </TouchableOpacity>
        </View>
      )}
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
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    paddingTop: 20,
    gap: 12,
  },
  itemCard: {
    width: '47.5%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  itemImageContainer: {
    position: 'relative',
    aspectRatio: 1,
    backgroundColor: '#2a2a2a',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  unsaveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    padding: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
    height: 40,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8b5cf6',
    marginBottom: 8,
  },
  itemFooter: {
    gap: 6,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerAvatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
  },
  sellerName: {
    fontSize: 11,
    color: '#666',
    flex: 1,
  },
  postedDate: {
    fontSize: 10,
    color: '#555',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  browseButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
  },
  browseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  bottomSpace: {
    height: 20,
  },
});

export default SavedItemsScreen;