import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

import API_URL from '../../config';

const ChatScreen = ({ navigation, route }) => {
  const { groupId, groupName, userId, userInfo } = route.params;
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef();

  useEffect(() => {
    console.log('ChatScreen loaded with:', { groupId, groupName, userId });
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/chat/groups/${groupId}/messages`
      );
      setMessages(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      await axios.post(
        `${API_URL}/chat/groups/${groupId}/messages/${userId}`,
        {
          message: messageText,
          message_type: 'text',
        }
      );
      setMessageText('');
      fetchMessages();
    } catch (error) {
      Alert.alert('Error', 'Could not send message');
    }
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender_id === userId;
    const showSender = !isMyMessage;

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage
            ? styles.myMessageContainer
            : styles.otherMessageContainer,
        ]}
      >
        {showSender && (
          <View style={styles.senderAvatar}>
            <Text style={styles.senderAvatarText}>
              {item.sender_name.charAt(0)}
            </Text>
          </View>
        )}
        <View style={styles.messageContent}>
          {showSender && (
            <Text style={styles.senderName}>{item.sender_name}</Text>
          )}
          <View
            style={[
              styles.messageBubble,
              isMyMessage ? styles.myMessage : styles.otherMessage,
            ]}
          >
            {isMyMessage && (
              <LinearGradient
                colors={['#8b5cf6', '#7c3aed']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.messageGradient}
              >
                <Text style={styles.messageText}>{item.message}</Text>
              </LinearGradient>
            )}
            {!isMyMessage && (
              <Text style={styles.messageText}>{item.message}</Text>
            )}
          </View>
          <Text style={styles.messageTime}>
            {formatMessageTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{groupName}</Text>
          <Text style={styles.headerSubtitle}>
            {messages.length} messages
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => {
            console.log('Navigating to GroupInfo with:', { groupId, userId, userInfo });
            navigation.navigate('GroupInfo', { 
              groupId: groupId,
              userId: userId,
              userInfo: userInfo
            });
          }}
        >
          <Ionicons name="information-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        showsVerticalScrollIndicator={false}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add-circle-outline" size={28} color="#8b5cf6" />
          </TouchableOpacity>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#666"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
            />
          </View>
          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
            disabled={!messageText.trim()}
          >
            <LinearGradient
              colors={
                messageText.trim()
                  ? ['#8b5cf6', '#7c3aed']
                  : ['#2a2a2a', '#2a2a2a']
              }
              style={styles.sendButtonGradient}
            >
              <Ionicons
                name="send"
                size={20}
                color={messageText.trim() ? '#fff' : '#666'}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  senderAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  messageContent: {
    maxWidth: '75%',
  },
  senderName: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 4,
  },
  myMessage: {
    alignSelf: 'flex-end',
    overflow: 'hidden',
  },
  otherMessage: {
    backgroundColor: '#1a1a1a',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  messageGradient: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  messageText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    color: '#666',
    marginLeft: 12,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  attachButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
  },
  input: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
  },
  sendButton: {
    marginBottom: 8,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;