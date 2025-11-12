// screens/MarketplaceChatScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_URL from '../../config';

const MarketplaceChatScreen = ({ navigation, route }) => {
  const { chatId, userId, userInfo } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [chatInfo, setChatInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchChatMessages();
    const interval = setInterval(fetchChatMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [chatId]);

  const fetchChatMessages = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/marketplace/chats/${chatId}/messages`,
        {
          params: { user_id: userId },
        }
      );

      setChatInfo(response.data.chat);
      setMessages(response.data.messages);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setIsLoading(false);
    }
  };

const sendMessage = async () => {
  if (!inputText.trim()) return;

  const tempMessage = {
    id: Date.now(),
    senderId: userId,
    message: inputText,
    messageType: 'text',
    timestamp: new Date().toISOString(),
    isRead: false,
  };

  setMessages((prev) => [...prev, tempMessage]);
  const messageToSend = inputText;
  setInputText('');

  try {
    const response = await axios.post(
      `${API_URL}/marketplace/chats/${chatId}/messages`,
      {
        sender_id: userId,
        message: messageToSend,
        message_type: 'text',
      }
    );

    console.log('Message sent:', response.data);

    // Fetch fresh messages to ensure sync
    setTimeout(() => {
      fetchChatMessages();
    }, 500);
  } catch (error) {
    console.error('Error sending message:', error);
    console.error('Error details:', error.response?.data);
    Alert.alert('Error', 'Could not send message');
    
    // Remove the temp message on error
    setMessages((prev) => prev.filter(msg => msg.id !== tempMessage.id));
  }
};

  const handleMarkAsSold = async () => {
    if (chatInfo.itemStatus === 'sold') {
      Alert.alert('Notice', 'This item is already marked as sold');
      return;
    }

    Alert.alert(
      'Mark as Sold',
      'Are you sure you want to mark this item as sold?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Sold',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.post(
                `${API_URL}/marketplace/items/${chatInfo.itemId}/sold`,
                { user_id: userId }
              );

              // Send system message
              await axios.post(
                `${API_URL}/marketplace/chats/${chatId}/messages`,
                {
                  sender_id: userId,
                  message: 'This item has been marked as sold.',
                  message_type: 'system',
                }
              );

              Alert.alert('Success', 'Item marked as sold');
              fetchChatMessages();
            } catch (error) {
              console.error('Error marking as sold:', error);
              Alert.alert('Error', 'Could not mark item as sold');
            }
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }) => {
    const isSender = item.senderId === userId;
    const isOffer = item.messageType === 'offer';
    const isSystem = item.messageType === 'system';

    if (isSystem) {
      return (
        <View style={styles.systemMessage}>
          <Text style={styles.systemMessageText}>{item.message}</Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageContainer,
          isSender ? styles.senderMessage : styles.receiverMessage,
        ]}
      >
        {isOffer && (
          <View style={styles.offerBadge}>
            <Ionicons name="pricetag" size={12} color="#8b5cf6" />
            <Text style={styles.offerBadgeText}>Offer</Text>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isSender ? styles.senderBubble : styles.receiverBubble,
            isOffer && styles.offerBubble,
          ]}
        >
          {isOffer && item.offerAmount && (
            <Text style={styles.offerAmount}>{item.offerAmount}</Text>
          )}
          <Text
            style={[
              styles.messageText,
              isSender ? styles.senderText : styles.receiverText,
            ]}
          >
            {item.message}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isSender ? styles.senderTime : styles.receiverTime,
            ]}
          >
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  const otherUser =
    chatInfo.seller.id === userId ? chatInfo.buyer : chatInfo.seller;
  const isSeller = chatInfo.seller.id === userId;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerCenter}
          onPress={() =>
            navigation.navigate('ItemDetail', {
              item: {
                id: chatInfo.itemId,
                title: chatInfo.itemTitle,
                images: [chatInfo.itemImage],
                price: chatInfo.itemPrice,
                seller: chatInfo.seller,
              },
              userId,
              userInfo,
            })
          }
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: chatInfo.itemImage || 'https://via.placeholder.com/40' }}
            style={styles.itemThumbnail}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {chatInfo.itemTitle}
            </Text>
            <Text style={styles.headerSubtitle}>{otherUser.name}</Text>
          </View>
        </TouchableOpacity>
        {isSeller && chatInfo.itemStatus !== 'sold' && (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleMarkAsSold}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="#10b981" />
          </TouchableOpacity>
        )}
        {!isSeller && (
          <View style={{ width: 40 }} />
        )}
      </View>

      {chatInfo.itemStatus === 'sold' && (
        <View style={styles.soldBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={styles.soldBannerText}>This item has been sold</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#666"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim()}
          activeOpacity={0.8}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#10b98120',
    borderBottomWidth: 1,
    borderBottomColor: '#10b98140',
  },
  soldBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  senderMessage: {
    alignSelf: 'flex-end',
  },
  receiverMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  senderBubble: {
    backgroundColor: '#8b5cf6',
    borderBottomRightRadius: 4,
  },
  receiverBubble: {
    backgroundColor: '#1a1a1a',
    borderBottomLeftRadius: 4,
  },
  offerBubble: {
    borderWidth: 2,
    borderColor: '#8b5cf640',
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#8b5cf620',
    marginBottom: 6,
  },
  offerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  offerAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8b5cf6',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  senderText: {
    color: '#fff',
  },
  receiverText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  senderTime: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
  },
  receiverTime: {
    color: '#666',
  },
  systemMessage: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    marginBottom: 12,
  },
  systemMessageText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});

export default MarketplaceChatScreen;