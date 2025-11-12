// screens/MarketplaceScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_URL from '../../config';

const MarketplaceScreen = ({ navigation, route }) => {
  const { userId, userInfo } = route.params;
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('browse'); // browse, myListings, saved

  const categories = [
    'all',
    'Books',
    'Electronics',
    'Accessories',
    'Furniture',
    'Appliances',
  ];

  useEffect(() => {
    fetchItems();
  }, [selectedCategory]);

  useEffect(() => {
    filterItems();
  }, [searchQuery, items]);

  const fetchItems = async () => {
    try {
      const response = await axios.get(`${API_URL}/marketplace/items`, {
        params: {
          category: selectedCategory,
          user_id: userId,
        },
      });
      setItems(response.data);
      setFilteredItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
      Alert.alert('Error', 'Could not load marketplace items');
    }
  };

  const filterItems = () => {
    if (!searchQuery.trim()) {
      setFilteredItems(items);
      return;
    }

    const filtered = items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredItems(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  };

  const toggleSaveItem = async (itemId, currentSavedState) => {
  try {
    console.log(`Toggling save for item ${itemId}, user ${userId}`);
    
    const response = await axios.post(
      `${API_URL}/marketplace/items/${itemId}/save?user_id=${userId}`,
      {}, // Empty body - user_id goes in query params
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Save response:', response.data);

    // Update both states with the actual saved state from server
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId 
          ? { ...item, isSaved: response.data.is_saved } 
          : item
      )
    );

    setFilteredItems((prev) =>
      prev.map((item) =>
        item.id === itemId 
          ? { ...item, isSaved: response.data.is_saved } 
          : item
      )
    );
  } catch (error) {
    console.error('Error toggling save:', error);
    console.error('Error response:', error.response?.data);
    Alert.alert('Error', 'Could not save item. Please try again.');
  }
};

  const navigateToItemDetail = (item) => {
    navigation.navigate('ItemDetail', { item, userId, userInfo });
  };

  const navigateToCreateListing = () => {
    navigation.navigate('CreateListing', { userId, userInfo });
  };

  const renderBrowseTab = () => (
    <>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.postButton}
        onPress={navigateToCreateListing}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.postButtonText}>Post an Item</Text>
      </TouchableOpacity>

      <View style={styles.itemsGrid}>
        {filteredItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.itemCard}
            onPress={() => navigateToItemDetail(item)}
            activeOpacity={0.8}
          >
            <View style={styles.itemImageContainer}>
              <Image
                source={{ uri: item.images[0] || 'https://via.placeholder.com/200' }}
                style={styles.itemImage}
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleSaveItem(item.id, item.isSaved);
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={item.isSaved ? 'heart' : 'heart-outline'}
                  size={20}
                  color={item.isSaved ? '#ef4444' : '#fff'}
                />
              </TouchableOpacity>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{item.category}</Text>
              </View>
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
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Campus Marketplace</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'browse' && styles.tabActive]}
          onPress={() => setActiveTab('browse')}
        >
          <Ionicons
            name="storefront"
            size={20}
            color={activeTab === 'browse' ? '#8b5cf6' : '#666'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'browse' && styles.tabTextActive,
            ]}
          >
            Browse
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'myListings' && styles.tabActive]}
          onPress={() => {
            setActiveTab('myListings');
            navigation.navigate('MyListings', { userId, userInfo });
          }}
        >
          <Ionicons
            name="list"
            size={20}
            color={activeTab === 'myListings' ? '#8b5cf6' : '#666'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'myListings' && styles.tabTextActive,
            ]}
          >
            My Listings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
          onPress={() => {
            setActiveTab('saved');
            navigation.navigate('SavedItems', { userId, userInfo });
          }}
        >
          <Ionicons
            name="heart"
            size={20}
            color={activeTab === 'saved' ? '#8b5cf6' : '#666'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'saved' && styles.tabTextActive,
            ]}
          >
            Saved
          </Text>
        </TouchableOpacity>
      </View>

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
        {renderBrowseTab()}
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
  headerButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#8b5cf6',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#8b5cf6',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categoriesContent: {
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  categoryChipActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  categoryTextActive: {
    color: '#fff',
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
  },
  postButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
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
  saveButton: {
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
  categoryBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
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
  bottomSpace: {
    height: 40,
  },
});

export default MarketplaceScreen;