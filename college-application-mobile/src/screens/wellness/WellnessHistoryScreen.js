// src/screens/wellness/WellnessHistoryScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_URL from '../../config';

const WellnessHistoryScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/wellness/history/${userId}`);
      console.log('📋 History loaded:', response.data.length, 'entries');
      setEntries(response.data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const getMoodEmoji = (mood) => {
    if (mood >= 4.5) return '😄';
    if (mood >= 3.5) return '🙂';
    if (mood >= 2.5) return '😐';
    if (mood >= 1.5) return '😕';
    return '😢';
  };

  const getStressColor = (stress) => {
    if (stress >= 8) return '#ef4444';
    if (stress >= 5) return '#f59e0b';
    return '#10b981';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wellness History</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wellness History</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#666" />
          <Text style={styles.emptyTitle}>No Check-ins Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start tracking your wellness to see your history
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('WellnessCheckIn', { userId })}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Check-in</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
          }
        >
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{entries.length}</Text>
              <Text style={styles.statLabel}>Total Check-ins</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {(entries.reduce((sum, e) => sum + e.mood_score, 0) / entries.length).toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>Avg Mood</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {(entries.reduce((sum, e) => sum + e.stress_level, 0) / entries.length).toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>Avg Stress</Text>
            </View>
          </View>

          {entries.map((entry) => (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <View style={styles.entryDate}>
                  <Text style={styles.dateText}>{formatDate(entry.date)}</Text>
                  <Text style={styles.dateSubtext}>
                    {new Date(entry.date).toLocaleDateString('en-US', { 
                      weekday: 'long' 
                    })}
                  </Text>
                </View>
                <Text style={styles.moodEmoji}>{getMoodEmoji(entry.mood_score)}</Text>
              </View>

              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <View style={styles.metricHeader}>
                    <Ionicons name="happy-outline" size={16} color="#8b5cf6" />
                    <Text style={styles.metricLabel}>Mood</Text>
                  </View>
                  <Text style={styles.metricValue}>{entry.mood_score}/5</Text>
                </View>

                <View style={styles.metricItem}>
                  <View style={styles.metricHeader}>
                    <Ionicons name="alert-circle-outline" size={16} color={getStressColor(entry.stress_level)} />
                    <Text style={styles.metricLabel}>Stress</Text>
                  </View>
                  <Text style={[styles.metricValue, { color: getStressColor(entry.stress_level) }]}>
                    {entry.stress_level}/10
                  </Text>
                </View>

                <View style={styles.metricItem}>
                  <View style={styles.metricHeader}>
                    <Ionicons name="flash-outline" size={16} color="#10b981" />
                    <Text style={styles.metricLabel}>Energy</Text>
                  </View>
                  <Text style={styles.metricValue}>{entry.energy_level}/10</Text>
                </View>

                {entry.sleep_hours && (
                  <View style={styles.metricItem}>
                    <View style={styles.metricHeader}>
                      <Ionicons name="moon-outline" size={16} color="#3b82f6" />
                      <Text style={styles.metricLabel}>Sleep</Text>
                    </View>
                    <Text style={styles.metricValue}>{entry.sleep_hours}h</Text>
                  </View>
                )}
              </View>

              {entry.notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesLabel}>Notes:</Text>
                  <Text style={styles.notesText}>{entry.notes}</Text>
                </View>
              )}

              {entry.triggers && (
                <View style={styles.triggersSection}>
                  <Ionicons name="warning-outline" size={14} color="#f59e0b" />
                  <Text style={styles.triggersText}>{entry.triggers}</Text>
                </View>
              )}
            </View>
          ))}

          <View style={styles.bottomSpace} />
        </ScrollView>
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
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  entryCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  entryDate: {
    flex: 1,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  dateSubtext: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  moodEmoji: {
    fontSize: 40,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#0a0a0a',
    padding: 12,
    borderRadius: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 12,
    color: '#888',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  notesLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  triggersSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f59e0b20',
    borderRadius: 6,
  },
  triggersText: {
    fontSize: 13,
    color: '#f59e0b',
  },
  bottomSpace: {
    height: 40,
  },
});

export default WellnessHistoryScreen;