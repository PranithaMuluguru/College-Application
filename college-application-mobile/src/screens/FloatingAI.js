import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  StyleSheet,
  Animated,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

import API_URL from '../config';
const API_BASE_URL = API_URL;

const FloatingAI = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef(null);
  
  // Draggable position
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        
        // Snap to edges
        const screenWidth = Dimensions.get('window').width;
        const screenHeight = Dimensions.get('window').height;
        
        let finalX = gesture.moveX < screenWidth / 2 ? 20 : screenWidth - 80;
        let finalY = Math.max(50, Math.min(gesture.moveY, screenHeight - 150));
        
        Animated.spring(pan, {
          toValue: { x: finalX - 20, y: finalY - 100 },
          useNativeDriver: false,
        }).start();
      }
    })
  ).current;

  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
    }
  }, [isOpen]);

  const loadChatHistory = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/ai/chat-history/${userId}?limit=20`
      );
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      message: inputText,
      is_user: true,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/ai/ask?user_id=${userId}`,
        { message: inputText }
      );

      const aiMessage = {
        message: response.data.response,
        is_user: false,
        created_at: new Date().toISOString(),
        confidence_score: response.data.confidence
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        message: "Sorry, I'm having trouble connecting. Please try again.",
        is_user: false,
        created_at: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      await axios.delete(`${API_URL}/ai/chat-history/${userId}`);
      setMessages([]);
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  const suggestedQuestions = [
    'Hostel allocation process',
    'Mess menu timings',
    'Library hours',
    'Contact academic office',
    'Sports facilities',
    'Club activities'
  ];

  return (
    <>
      {/* Floating AI Button */}
      <Animated.View
        style={[
          styles.floatingButton,
          {
            transform: [{ translateX: pan.x }, { translateY: pan.y }]
          }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          onPress={() => setIsOpen(true)}
          style={styles.aiButton}
          activeOpacity={0.9}
        >
          <Ionicons name="sparkles" size={26} color="white" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>AI</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.chatContainer}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ionicons name="sparkles" size={24} color="#6366F1" />
                <View>
                  <Text style={styles.headerTitle}>IIT Palakkad AI</Text>
                  <Text style={styles.headerSubtitle}>Your Campus Assistant</Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity onPress={clearChat} style={styles.iconButton}>
                  <Ionicons name="trash-outline" size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.iconButton}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Messages */}
            <ScrollView 
              style={styles.messagesContainer}
              ref={scrollViewRef}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.length === 0 ? (
                <View style={styles.welcomeContainer}>
                  <View style={styles.welcomeIcon}>
                    <Ionicons name="school-outline" size={50} color="#6366F1" />
                  </View>
                  <Text style={styles.welcomeTitle}>
                    Hello! I'm your IIT Palakkad AI Assistant
                  </Text>
                  <Text style={styles.welcomeText}>
                    Ask me anything about IIT Palakkad!
                  </Text>
                  
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsTitle}>Try asking:</Text>
                    {suggestedQuestions.map((question, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionChip}
                        onPress={() => setInputText(question)}
                      >
                        <Ionicons name="help-circle-outline" size={16} color="#6366F1" />
                        <Text style={styles.suggestionText}>{question}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                messages.map((msg, index) => (
                  <View
                    key={index}
                    style={[
                      styles.messageItem,
                      msg.is_user ? styles.userMessage : styles.aiMessage
                    ]}
                  >
                    {!msg.is_user && (
                      <View style={styles.aiAvatar}>
                        <Ionicons name="sparkles" size={14} color="#6366F1" />
                      </View>
                    )}
                    <View style={[
                      styles.messageContent,
                      msg.is_user ? styles.userMessageContent : styles.aiMessageContent
                    ]}>
                      <Text style={[
                        styles.messageText,
                        msg.is_user ? styles.userMessageText : styles.aiMessageText
                      ]}>
                        {msg.message}
                      </Text>
                      {!msg.is_user && msg.confidence_score === 'low' && (
                        <View style={styles.confidenceWarning}>
                          <Ionicons name="information-circle-outline" size={14} color="#F59E0B" />
                          <Text style={styles.confidenceText}>
                            I'm still learning about this
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}
              {loading && (
                <View style={styles.loadingContainer}>
                  <View style={styles.aiAvatar}>
                    <Ionicons name="sparkles" size={14} color="#6366F1" />
                  </View>
                  <View style={styles.loadingBubble}>
                    <ActivityIndicator size="small" color="#6366F1" />
                    <Text style={styles.loadingText}>Thinking...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Ask about IIT Palakkad..."
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  onPress={sendMessage}
                  style={[
                    styles.sendButton,
                    !inputText.trim() && styles.sendButtonDisabled
                  ]}
                  disabled={!inputText.trim() || loading}
                >
                  <Ionicons 
                    name="send" 
                    size={20} 
                    color={inputText.trim() ? "white" : "#ccc"} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    zIndex: 1000,
  },
  aiButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#10B981',
    borderRadius: 10,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  chatContainer: {
    backgroundColor: 'white',
    height: '85%',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: 'white',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  suggestionsContainer: {
    width: '100%',
    marginTop: 20,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  suggestionText: {
    color: '#374151',
    fontSize: 14,
    flex: 1,
  },
  messageItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageContent: {
    maxWidth: '75%',
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  userMessageContent: {
    backgroundColor: '#6366F1',
    borderBottomRightRadius: 4,
  },
  aiMessageContent: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  aiMessageText: {
    color: '#1F2937',
  },
  confidenceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  confidenceText: {
    fontSize: 11,
    color: '#F59E0B',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
  },
  inputContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    color: '#1F2937',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
});

export default FloatingAI;