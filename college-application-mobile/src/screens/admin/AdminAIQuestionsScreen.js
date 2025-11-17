import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../../config';

const AdminAIQuestionsScreen = ({ navigation, route }) => {
  const { admin_user, user, token } = route.params;
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answerModalVisible, setAnswerModalVisible] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [category, setCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('unanswered');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, [statusFilter]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/ai/question-queue?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setQuestions(response.data.questions);
      setFilteredQuestions(response.data.questions);
    } catch (error) {
      console.error('Error loading questions:', error);
      Alert.alert('Error', 'Failed to load questions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuestions();
  };

  const handleAnswerQuestion = () => {
    if (!answerText.trim()) {
      Alert.alert('Validation Error', 'Please provide an answer');
      return;
    }

    const payload = {
      question_id: selectedQuestion.id,
      answer: answerText,
      category: category || selectedQuestion.category
    };

    axios.post(`${API_URL}/ai/add-answer`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => {
      Alert.alert('Success', 'Answer added to knowledge base');
      setAnswerModalVisible(false);
      setAnswerText('');
      setCategory('');
      fetchQuestions();
    })
    .catch(error => {
      console.error('Error adding answer:', error);
      Alert.alert('Error', 'Failed to add answer');
    });
  };

  const showAnswerModal = (question) => {
    setSelectedQuestion(question);
    setAnswerModalVisible(true);
    setAnswerText('');
    setCategory(question.category || '');
  };

  const filterQuestions = (query) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredQuestions(questions);
      return;
    }

    const filtered = questions.filter(q => 
      q.question_text.toLowerCase().includes(query.toLowerCase()) ||
      (q.category && q.category.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredQuestions(filtered);
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const renderQuestionItem = ({ item }) => (
    <View style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <Text style={styles.questionText}>{item.question_text}</Text>
        <View style={[
          styles.statusBadge,
          { 
            backgroundColor: item.status === 'unanswered' ? '#EF4444' : 
                           item.status === 'answered' ? '#10B981' : '#F59E0B'
          }
        ]}>
          <Text style={styles.statusText}>
            {item.status === 'unanswered' ? 'Unanswered' : 
             item.status === 'answered' ? 'Answered' : 'Duplicate'}
          </Text>
        </View>
      </View>
      
      <View style={styles.questionMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="tag" size={14} color="#666" />
          <Text style={styles.metaText}>
            {item.category || 'No Category'}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="person" size={14} color="#666" />
          <Text style={styles.metaText}>
            Asked {item.ask_count > 1 ? `${item.ask_count} times` : 'once'}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time" size={14} color="#666" />
          <Text style={styles.metaText}>
            {formatTimeAgo(item.created_at)}
          </Text>
        </View>
      </View>

      {item.status === 'unanswered' && (
        <TouchableOpacity 
          style={styles.answerButton}
          onPress={() => showAnswerModal(item)}
        >
          <Text style={styles.answerButtonText}>Answer Question</Text>
        </TouchableOpacity>
      )}

      {item.admin_answer && (
        <View style={styles.answerContainer}>
          <Text style={styles.answerLabel}>Admin Answer:</Text>
          <Text style={styles.answerContent}>{item.admin_answer}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>AI Questions</Text>
          <Text style={styles.screenSubtitle}>
            Manage unanswered questions and build knowledge base
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Ionicons 
            name={refreshing ? "refresh" : "refresh-outline"} 
            size={24} 
            color={refreshing ? "#8B5CF6" : "#666"} 
          />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search questions..."
            value={searchQuery}
            onChangeText={filterQuestions}
            underlineColorAndroid="transparent"
          />
        </View>

        <View style={styles.statusFilter}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === 'unanswered' && styles.activeFilter
            ]}
            onPress={() => setStatusFilter('unanswered')}
          >
            <Text style={[
              styles.filterText,
              statusFilter === 'unanswered' && styles.activeFilterText
            ]}>
              Unanswered
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === 'answered' && styles.activeFilter
            ]}
            onPress={() => setStatusFilter('answered')}
          >
            <Text style={[
              styles.filterText,
              statusFilter === 'answered' && styles.activeFilterText
            ]}>
              Answered
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === 'duplicate' && styles.activeFilter
            ]}
            onPress={() => setStatusFilter('duplicate')}
          >
            <Text style={[
              styles.filterText,
              statusFilter === 'duplicate' && styles.activeFilterText
            ]}>
              Duplicates
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : (
        <FlatList
          data={filteredQuestions}
          renderItem={renderQuestionItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="help-circle-outline" size={50} color="#666" />
              <Text style={styles.emptyStateText}>
                No {statusFilter} questions found
              </Text>
            </View>
          }
        />
      )}

      {/* Answer Modal */}
      <Modal
        visible={answerModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={100}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Answer Question</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setAnswerModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.questionPreview}>
                  <Text style={styles.questionPreviewLabel}>Question:</Text>
                  <Text style={styles.questionPreviewText}>
                    {selectedQuestion?.question_text}
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Category</Text>
                  <TextInput
                    style={styles.formInput}
                    value={category}
                    onChangeText={setCategory}
                    placeholder="Enter category (optional)"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Your Answer</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    value={answerText}
                    onChangeText={setAnswerText}
                    placeholder="Type your answer here..."
                  />
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setAnswerModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleAnswerQuestion}
                >
                  <Text style={styles.submitButtonText}>Submit Answer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a'
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff'
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4
  },
  refreshButton: {
    padding: 8
  },
  filterContainer: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: '#fff',
    fontSize: 16
  },
  statusFilter: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  filterButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#1a1a1a'
  },
  activeFilter: {
    backgroundColor: '#8B5CF6'
  },
  filterText: {
    fontSize: 14,
    color: '#888'
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '600'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100
  },
  questionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  questionHeader: {
    marginBottom: 12
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff'
  },
  questionMeta: {
    flexDirection: 'row',
    marginBottom: 12
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4
  },
  answerButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center'
  },
  answerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff'
  },
  answerContainer: {
    marginTop: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a'
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
    marginBottom: 4
  },
  answerContent: {
    fontSize: 14,
    color: '#fff'
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a'
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff'
  },
  closeButton: {
    padding: 8
  },
  modalBody: {
    flex: 1,
    padding: 20
  },
  questionPreview: {
    marginBottom: 24
  },
  questionPreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
    marginBottom: 8
  },
  questionPreviewText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24
  },
  formGroup: {
    marginBottom: 20
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8
  },
  formInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top'
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a'
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#1a1a1a',
    marginRight: 10
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
    marginLeft: 10
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888'
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff'
  }
});

export default AdminAIQuestionsScreen;