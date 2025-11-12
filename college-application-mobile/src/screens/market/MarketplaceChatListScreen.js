// screens/MarketplaceChatListScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_URL from '../../config';

const MarketplaceChatListScreen = ({ navigation, route }) => {
  const { userId, userInfo } = route.params;
  const [chats, setChats] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchChats();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchChats();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchChats = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/marketplace/chats/${userId}`
      );
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchChats();
    setRefreshing(false);
  };

  const renderChat = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() =>
        navigation.navigate('MarketplaceChat', {
          chatId: item.id,
          userId,
          userInfo,
        })
      }
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.itemImage || 'https://via.placeholder.com/60' }}
        style={styles.itemImage}
      />
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.itemTitle}
          </Text>
          <Text style={styles.chatTime}>{item.lastMessageTime}</Text>
        </View>
        <Text style={styles.itemPrice}>{item.itemPrice}</Text>
        <View style={styles.chatFooter}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {item.otherUser.name.charAt(0)}
              </Text>
            </View>
            <Text style={styles.userName} numberOfLines={1}>
              {item.otherUser.name}
            </Text>
            {item.isBuyer && (
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>Buying</Text>
              </View>
            )}
            {!item.isBuyer && (
              <View style={[styles.roleBadge, styles.sellerBadge]}>
                <Text style={[styles.roleBadgeText, styles.sellerBadgeText]}>
                  Selling
                </Text>
              </View>
            )}
          </View>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {item.unreadCount > 9 ? '9+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.lastMessage,
            item.unreadCount > 0 && styles.lastMessageUnread,
          ]}
          numberOfLines={1}
        >
          {item.lastMessage || 'No messages yet'}
        </Text>
      </View>
    </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Marketplace Chats</Text>
        <View style={{ width: 40 }} />
      </View>

      {chats.length > 0 ? (
        <FlatList
          data={chats}
          renderItem={renderChat}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.chatList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#8b5cf6"
            />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={64} color="#444" />
          <Text style={styles.emptyStateTitle}>No chats yet</Text>
          <Text style={styles.emptyStateText}>
            When you contact sellers or buyers, your conversations will appear
            here
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
  chatList: {
    paddingTop: 8,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
  },
  chatContent: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  chatTime: {
    fontSize: 11,
    color: '#666',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8b5cf6',
    marginBottom: 6,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  userAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
  },
  userName: {
    fontSize: 12,
    color: '#888',
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#3b82f620',
  },
  sellerBadge: {
    backgroundColor: '#10b98120',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3b82f6',
  },
  sellerBadgeText: {
    color: '#10b981',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  lastMessage: {
    fontSize: 13,
    color: '#666',
  },
  lastMessageUnread: {
    fontWeight: '600',
    color: '#888',
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
});

export default MarketplaceChatListScreen;