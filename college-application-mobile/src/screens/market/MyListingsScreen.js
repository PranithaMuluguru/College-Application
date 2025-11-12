// screens/MyListingsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_URL from '../../config';

const MyListingsScreen = ({ navigation, route }) => {
  const { userId, userInfo } = route.params;
  const [activeTab, setActiveTab] = useState('active');
  const [activeListings, setActiveListings] = useState([]);
  const [soldListings, setSoldListings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [activeTab]);

  const fetchListings = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/marketplace/my-listings/${userId}`,
        {
          params: { status: activeTab },
        }
      );

      if (activeTab === 'active') {
        setActiveListings(response.data);
      } else {
        setSoldListings(response.data);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  };

const handleMarkAsSold = async (itemId) => {
  try {
    await axios.post(
      `${API_URL}/marketplace/items/${itemId}/sold?user_id=${userId}`,
      {} // Empty body
    );
    Alert.alert('Success', 'Item marked as sold');
    fetchListings(); // Refresh the list
  } catch (error) {
    console.error('Error marking as sold:', error);
    Alert.alert('Error', 'Could not mark item as sold');
  }
};

  const handleDeleteListing = async (itemId) => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(
                `${API_URL}/marketplace/items/${itemId}?user_id=${userId}`
              );
              Alert.alert('Success', 'Listing deleted');
              fetchListings();
            } catch (error) {
              console.error('Error deleting listing:', error);
              Alert.alert('Error', 'Could not delete listing');
            }
          },
        },
      ]
    );
  };

  const handleEditListing = (item) => {
    navigation.navigate('EditListing', { item, userId, userInfo });
  };

  const renderListingCard = (item, showActions = true) => (
    <View key={item.id} style={styles.listingCard}>
      <TouchableOpacity
        style={styles.listingContent}
        onPress={() =>
          navigation.navigate('ItemDetail', {
            item: { ...item, seller: { id: userId, name: userInfo.full_name } },
            userId,
            userInfo,
          })
        }
        activeOpacity={0.8}
      >
        <Image
          source={{
            uri: item.images[0] || 'https://via.placeholder.com/100',
          }}
          style={styles.listingImage}
        />
        <View style={styles.listingDetails}>
          <View style={styles.listingHeader}>
            <Text style={styles.listingTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View
              style={[
                styles.statusBadge,
                item.status === 'sold' && styles.statusBadgeSold,
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {item.status === 'active' ? 'Active' : 'Sold'}
              </Text>
            </View>
          </View>
          <Text style={styles.listingPrice}>{item.price}</Text>
          <View style={styles.listingStats}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={14} color="#666" />
              <Text style={styles.statText}>{item.views}</Text>
            </View>
            {item.inquiries !== undefined && (
              <View style={styles.statItem}>
                <Ionicons name="chatbubble-outline" size={14} color="#666" />
                <Text style={styles.statText}>{item.inquiries}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {showActions && (
        <View style={styles.listingActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditListing(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={16} color="#8b5cf6" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleMarkAsSold(item.id)}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" />
            <Text style={[styles.actionButtonText, { color: '#10b981' }]}>
              Mark Sold
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteListing(item.id)}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}
    </View>
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
        <Text style={styles.headerTitle}>My Listings</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'active' && styles.tabTextActive,
            ]}
          >
            Active ({activeListings.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'sold' && styles.tabActive]}
          onPress={() => setActiveTab('sold')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'sold' && styles.tabTextActive,
            ]}
          >
            Sold ({soldListings.length})
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
        {activeTab === 'active' && (
          <>
            {activeListings.length > 0 ? (
              activeListings.map((item) => renderListingCard(item, true))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="storefront-outline" size={64} color="#444" />
                <Text style={styles.emptyStateTitle}>No active listings</Text>
                <Text style={styles.emptyStateText}>
                  Create your first listing to start selling
                </Text>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() =>
                    navigation.navigate('CreateListing', { userId, userInfo })
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.createButtonText}>Create Listing</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {activeTab === 'sold' && (
          <>
            {soldListings.length > 0 ? (
              soldListings.map((item) => renderListingCard(item, false))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={64} color="#444" />
                <Text style={styles.emptyStateTitle}>No sold items</Text>
                <Text style={styles.emptyStateText}>
                  Items you've marked as sold will appear here
                </Text>
              </View>
            )}
          </>
        )}

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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#8b5cf6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#8b5cf6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  listingCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 16,
  },
  listingContent: {
    flexDirection: 'row',
    padding: 12,
  },
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
  },
  listingDetails: {
    flex: 1,
    marginLeft: 12,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  listingTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#10b98120',
  },
  statusBadgeSold: {
    backgroundColor: '#88888820',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8b5cf6',
    marginBottom: 8,
  },
  listingStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  listingActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#2a2a2a',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  deleteButton: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  bottomSpace: {
    height: 20,
  },
});

export default MyListingsScreen;