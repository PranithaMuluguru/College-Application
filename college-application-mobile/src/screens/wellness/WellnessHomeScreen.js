// WellnessHomeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';
import API_URL from '../../config';

const WellnessHomeScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  const [analytics, setAnalytics] = useState(null);
  const [todayEntry, setTodayEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWellnessData();
  }, []);

  const fetchWellnessData = async () => {
    try {
      const [analyticsRes, todayRes] = await Promise.all([
        axios.get(`${API_URL}/wellness/analytics/${userId}?days=7`),
        axios.get(`${API_URL}/wellness/today/${userId}`)
      ]);
      
      setAnalytics(analyticsRes.data);
      setTodayEntry(todayRes.data);
    } catch (error) {
      console.error('Error fetching wellness data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading wellness data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Wellness Dashboard</Text>
          <Text style={styles.headerSubtitle}>Track your mental health journey</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Check-in Button */}
        <TouchableOpacity
          style={styles.checkInButton}
          onPress={() => navigation.navigate('WellnessCheckIn', { userId })}
          activeOpacity={0.8}
        >
          <View style={styles.checkInLeft}>
            <Ionicons name="heart" size={32} color="#fff" />
            <View style={styles.checkInText}>
              <Text style={styles.checkInTitle}>Daily Check-in</Text>
              <Text style={styles.checkInSubtitle}>
                {todayEntry ? 'Update today\'s entry' : 'How are you feeling today?'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Resources - MOVED TO TOP */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Access</Text>
          <View style={styles.resourcesGrid}>
            <TouchableOpacity
              style={styles.resourceButton}
              onPress={() => navigation.navigate('WellnessHistory', { userId })}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={28} color="#ec4899" />
              <Text style={styles.resourceText}>History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resourceButton}
              onPress={() => navigation.navigate('RiskAssessment', { userId })}
              activeOpacity={0.8}
            >
              <Ionicons name="shield-checkmark" size={28} color="#3b82f6" />
              <Text style={styles.resourceText}>Risk Check</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.resourceButton}
              onPress={() => navigation.navigate('CounselorForm', { userId })}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubbles" size={28} color="#8b5cf6" />
              <Text style={styles.resourceText}>Counselor</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resourceButton}
              onPress={() => navigation.navigate('Meditation')}
              activeOpacity={0.8}
            >
              <Ionicons name="leaf" size={28} color="#10b981" />
              <Text style={styles.resourceText}>Meditation</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Summary */}
        {todayEntry && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Today's Summary</Text>
            <View style={styles.todayGrid}>
              <View style={styles.todayItem}>
                <Ionicons name="happy" size={32} color="#8b5cf6" />
                <Text style={styles.todayValue}>{todayEntry.mood_score}/5</Text>
                <Text style={styles.todayLabel}>Mood</Text>
              </View>
              <View style={styles.todayItem}>
                <Ionicons name="alert-circle" size={32} color="#f59e0b" />
                <Text style={styles.todayValue}>{todayEntry.stress_level}/10</Text>
                <Text style={styles.todayLabel}>Stress</Text>
              </View>
              <View style={styles.todayItem}>
                <Ionicons name="flash" size={32} color="#10b981" />
                <Text style={styles.todayValue}>{todayEntry.energy_level}/10</Text>
                <Text style={styles.todayLabel}>Energy</Text>
              </View>
            </View>
          </View>
        )}

        {/* Weekly Chart */}
        {analytics && analytics.time_series && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>7-Day Mood Trend</Text>
            <LineChart
              data={{
                labels: analytics.time_series.dates.slice(-7).map(d => 
                  new Date(d).toLocaleDateString('en-US', { weekday: 'short' })
                ),
                datasets: [{
                  data: analytics.time_series.mood.slice(-7)
                }]
              }}
              width={Dimensions.get('window').width - 60}
              height={220}
              chartConfig={{
                backgroundColor: '#1a1a1a',
                backgroundGradientFrom: '#1a1a1a',
                backgroundGradientTo: '#2a2a2a',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#8b5cf6'
                }
              }}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {/* Statistics */}
        {analytics && analytics.statistics && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>This Week's Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{analytics.statistics.avg_mood.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Avg Mood</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{analytics.statistics.avg_stress.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Avg Stress</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{analytics.statistics.streak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{analytics.statistics.avg_sleep.toFixed(1)}h</Text>
                <Text style={styles.statLabel}>Avg Sleep</Text>
              </View>
            </View>
          </View>
        )}

        {/* Insights */}
        {analytics && analytics.insights && analytics.insights.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personal Insights</Text>
            {analytics.insights.map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <Ionicons name="bulb" size={20} color="#f59e0b" />
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  checkInButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  checkInLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  checkInText: {
    gap: 4,
  },
  checkInTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  checkInSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  resourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  resourceButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  resourceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  todayGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  todayItem: {
    alignItems: 'center',
    gap: 8,
  },
  todayValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  todayLabel: {
    fontSize: 13,
    color: '#888',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#8b5cf6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  bottomSpace: {
    height: 40,
  },
});

export default WellnessHomeScreen;