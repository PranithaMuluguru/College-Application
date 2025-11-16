// RiskAssessmentScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_URL from '../../config';

const RiskAssessmentScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRiskAssessment();
  }, []);

  const fetchRiskAssessment = async () => {
    try {
      const response = await axios.get(`${API_URL}/wellness/risk-assessment/${userId}`);
      setAssessment(response.data);
    } catch (error) {
      console.error('Error fetching risk assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'critical': return '#dc2626';
      default: return '#888';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'low': return 'checkmark-circle';
      case 'medium': return 'alert-circle';
      case 'high': return 'warning';
      case 'critical': return 'alert';
      default: return 'information-circle';
    }
  };

  const getRiskMessage = (level) => {
    switch (level) {
      case 'low':
        return 'Your mental health indicators look good! Keep up the healthy habits.';
      case 'medium':
        return 'Some areas need attention. Consider implementing the recommendations below.';
      case 'high':
        return 'Several concerning indicators detected. Please reach out for support.';
      case 'critical':
        return 'Urgent: Please contact a counselor or crisis helpline immediately.';
      default:
        return 'Assessment in progress...';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Analyzing your wellness data...</Text>
      </View>
    );
  }

  if (!assessment) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#ef4444" />
        <Text style={styles.errorText}>Unable to generate assessment</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchRiskAssessment}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const riskColor = getRiskColor(assessment.risk_level);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Risk Assessment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overall Risk */}
        <View style={[styles.riskCard, { borderColor: riskColor }]}>
          <View style={styles.riskHeader}>
            <Ionicons
              name={getRiskIcon(assessment.risk_level)}
              size={48}
              color={riskColor}
            />
            <View style={styles.riskTextContainer}>
              <Text style={styles.riskLevel}>
                {assessment.risk_level.toUpperCase()} RISK
              </Text>
              <Text style={styles.riskPercentage}>
                {assessment.overall_risk_percentage}%
              </Text>
            </View>
          </View>
          <Text style={styles.riskMessage}>
            {getRiskMessage(assessment.risk_level)}
          </Text>
        </View>

        {/* Risk Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Risk Breakdown</Text>
          {Object.entries(assessment.risk_breakdown).map(([key, value]) => {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const percentage = value;
            const color = percentage > 60 ? '#ef4444' : percentage > 40 ? '#f59e0b' : '#10b981';
            
            return (
              <View key={key} style={styles.breakdownItem}>
                <View style={styles.breakdownHeader}>
                  <Text style={styles.breakdownLabel}>{label}</Text>
                  <Text style={[styles.breakdownValue, { color }]}>
                    {percentage}%
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${percentage}%`, backgroundColor: color }
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Recommendations */}
        {assessment.recommendations && assessment.recommendations.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recommendations</Text>
            {assessment.recommendations.map((rec, index) => (
              <View
                key={index}
                style={[
                  styles.recommendationItem,
                  rec.priority === 'urgent' && styles.urgentRecommendation
                ]}
              >
                <View style={styles.recommendationHeader}>
                  <Ionicons
                    name={rec.priority === 'urgent' ? 'alert' : 'information-circle'}
                    size={20}
                    color={rec.priority === 'urgent' ? '#ef4444' : '#8b5cf6'}
                  />
                  <Text style={styles.recommendationAction}>{rec.action}</Text>
                </View>
                {rec.tips && (
                  <View style={styles.tipsList}>
                    {rec.tips.map((tip, i) => (
                      <Text key={i} style={styles.tipText}>• {tip}</Text>
                    ))}
                  </View>
                )}
                {rec.contact && (
                  <TouchableOpacity
                    style={styles.contactButton}
                    onPress={() => Linking.openURL(`tel:${rec.contact}`)}
                  >
                    <Ionicons name="call" size={16} color="#fff" />
                    <Text style={styles.contactButtonText}>{rec.contact}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Crisis Resources */}
        {assessment.crisis_resources && (
          <View style={[styles.card, styles.crisisCard]}>
            <View style={styles.crisisHeader}>
              <Ionicons name="alert-circle" size={24} color="#ef4444" />
              <Text style={styles.crisisTitle}>Crisis Resources</Text>
            </View>
            <Text style={styles.crisisMessage}>
              {assessment.crisis_resources.message}
            </Text>
            <View style={styles.crisisContacts}>
              <TouchableOpacity
                style={styles.crisisButton}
                onPress={() => Linking.openURL(`tel:${assessment.crisis_resources.national_suicide_hotline}`)}
              >
                <Ionicons name="call" size={20} color="#fff" />
                <View>
                  <Text style={styles.crisisButtonTitle}>Suicide Hotline</Text>
                  <Text style={styles.crisisButtonNumber}>
                    {assessment.crisis_resources.national_suicide_hotline}
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.crisisButton}
                onPress={() => Linking.openURL('sms:741741&body=HOME')}
              >
                <Ionicons name="chatbubbles" size={20} color="#fff" />
                <View>
                  <Text style={styles.crisisButtonTitle}>Crisis Text Line</Text>
                  <Text style={styles.crisisButtonNumber}>Text HOME to 741741</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {assessment.counselor_contact_needed && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => navigation.navigate('CounselorForm', { userId })}
            >
              <Ionicons name="chatbubbles" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Contact Counselor</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate('WellnessCheckIn', { userId })}
          >
            <Ionicons name="heart" size={20} color="#8b5cf6" />
            <Text style={[styles.actionButtonText, { color: '#8b5cf6' }]}>
              Daily Check-in
            </Text>
          </TouchableOpacity>
        </View>

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
    gap: 16,
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  content: {
    flex: 1,
    padding: 20,
  },
  riskCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  riskTextContainer: {
    flex: 1,
  },
  riskLevel: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  riskPercentage: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  riskMessage: {
    fontSize: 15,
    color: '#888',
    lineHeight: 22,
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
  breakdownItem: {
    marginBottom: 16,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#fff',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  recommendationItem: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  urgentRecommendation: {
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  recommendationAction: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 22,
  },
  tipsList: {
    marginTop: 8,
    gap: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#888',
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#8b5cf6',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  crisisCard: {
    backgroundColor: '#1a0a0a',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  crisisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  crisisTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ef4444',
  },
  crisisMessage: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
    marginBottom: 16,
  },
  crisisContacts: {
    gap: 12,
  },
  crisisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 12,
  },
  crisisButtonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  crisisButtonNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  actionButtons: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: '#8b5cf6',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  bottomSpace: {
    height: 40,
  },
});

export default RiskAssessmentScreen;