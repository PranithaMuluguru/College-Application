// MeditationScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MeditationScreen = ({ navigation }) => {
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState('ready');
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const meditations = [
    {
      id: 1,
      title: '5-Minute Quick Calm',
      duration: '5:00',
      description: 'Perfect for study breaks',
      icon: 'time',
      color: '#8b5cf6',
    },
    {
      id: 2,
      title: 'Body Scan Relaxation',
      duration: '10:00',
      description: 'Release physical tension',
      icon: 'body',
      color: '#10b981',
    },
    {
      id: 3,
      title: 'Sleep Meditation',
      duration: '15:00',
      description: 'Prepare for restful sleep',
      icon: 'moon',
      color: '#3b82f6',
    },
    {
      id: 4,
      title: 'Anxiety Relief',
      duration: '8:00',
      description: 'Calm racing thoughts',
      icon: 'heart',
      color: '#f59e0b',
    },
  ];

  const breathingCycle = () => {
    const phases = [
      { name: 'Inhale', duration: 4000, scale: 1.3, opacity: 0.6 },
      { name: 'Hold', duration: 4000, scale: 1.3, opacity: 0.6 },
      { name: 'Exhale', duration: 4000, scale: 1.0, opacity: 1.0 },
      { name: 'Hold', duration: 4000, scale: 1.0, opacity: 1.0 },
    ];

    let currentPhase = 0;

    const animate = () => {
      const phase = phases[currentPhase];
      setBreathPhase(phase.name);

      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: phase.scale,
          duration: phase.duration,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: phase.opacity,
          duration: phase.duration,
          useNativeDriver: true,
        }),
      ]).start(() => {
        currentPhase = (currentPhase + 1) % phases.length;
        if (breathingActive) {
          animate();
        }
      });
    };

    animate();
  };

  useEffect(() => {
    if (breathingActive) {
      breathingCycle();
    } else {
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
      setBreathPhase('ready');
    }
  }, [breathingActive]);

  const tips = [
    {
      icon: 'bulb',
      title: 'Start Small',
      text: 'Begin with 2-3 minutes daily',
      color: '#f59e0b',
    },
    {
      icon: 'calendar',
      title: 'Be Consistent',
      text: 'Same time each day builds habit',
      color: '#8b5cf6',
    },
    {
      icon: 'leaf',
      title: 'Focus on Breath',
      text: 'Gently return when mind wanders',
      color: '#10b981',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meditation & Mindfulness</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Breathing Exercise */}
        <View style={styles.breathingCard}>
          <Text style={styles.breathingTitle}>Box Breathing</Text>
          <Text style={styles.breathingSubtitle}>
            A powerful technique to reduce stress
          </Text>

          <View style={styles.breathingCircleContainer}>
            <Animated.View
              style={[
                styles.breathingCircle,
                {
                  transform: [{ scale: scaleAnim }],
                  opacity: opacityAnim,
                },
              ]}
            >
              <Text style={styles.breathingPhaseText}>
                {breathingActive ? breathPhase : 'Ready'}
              </Text>
            </Animated.View>
          </View>

          <TouchableOpacity
            style={[
              styles.breathingButton,
              breathingActive && styles.breathingButtonActive,
            ]}
            onPress={() => setBreathingActive(!breathingActive)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={breathingActive ? 'stop' : 'play'}
              size={20}
              color="#fff"
            />
            <Text style={styles.breathingButtonText}>
              {breathingActive ? 'Stop' : 'Start'} Exercise
            </Text>
          </TouchableOpacity>

          <View style={styles.breathingSteps}>
            <View style={styles.breathingStep}>
              <Text style={styles.breathingStepDuration}>4s</Text>
              <Text style={styles.breathingStepLabel}>Inhale</Text>
            </View>
            <View style={styles.breathingStep}>
              <Text style={styles.breathingStepDuration}>4s</Text>
              <Text style={styles.breathingStepLabel}>Hold</Text>
            </View>
            <View style={styles.breathingStep}>
              <Text style={styles.breathingStepDuration}>4s</Text>
              <Text style={styles.breathingStepLabel}>Exhale</Text>
            </View>
            <View style={styles.breathingStep}>
              <Text style={styles.breathingStepDuration}>4s</Text>
              <Text style={styles.breathingStepLabel}>Hold</Text>
            </View>
          </View>
        </View>

        {/* Guided Meditations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guided Audio</Text>
          {meditations.map((meditation) => (
            <TouchableOpacity
              key={meditation.id}
              style={styles.meditationCard}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.meditationIcon,
                  { backgroundColor: `${meditation.color}20` },
                ]}
              >
                <Ionicons
                  name={meditation.icon}
                  size={28}
                  color={meditation.color}
                />
              </View>
              <View style={styles.meditationInfo}>
                <Text style={styles.meditationTitle}>{meditation.title}</Text>
                <Text style={styles.meditationDescription}>
                  {meditation.description}
                </Text>
              </View>
              <View style={styles.meditationRight}>
                <Text style={styles.meditationDuration}>
                  {meditation.duration}
                </Text>
                <Ionicons name="play-circle" size={32} color={meditation.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meditation Tips</Text>
          <View style={styles.tipsGrid}>
            {tips.map((tip, index) => (
              <View key={index} style={styles.tipCard}>
                <View
                  style={[
                    styles.tipIcon,
                    { backgroundColor: `${tip.color}20` },
                  ]}
                >
                  <Ionicons name={tip.icon} size={24} color={tip.color} />
                </View>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipText}>{tip.text}</Text>
              </View>
            ))}
          </View>
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
  breathingCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  breathingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  breathingSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  breathingCircleContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  breathingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingPhaseText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  breathingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8b5cf6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  breathingButtonActive: {
    backgroundColor: '#ef4444',
  },
  breathingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  breathingSteps: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  breathingStep: {
    alignItems: 'center',
    gap: 4,
  },
  breathingStepDuration: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  breathingStepLabel: {
    fontSize: 12,
    color: '#888',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  meditationCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
    gap: 12,
  },
  meditationIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  meditationInfo: {
    flex: 1,
  },
  meditationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  meditationDescription: {
    fontSize: 13,
    color: '#888',
  },
  meditationRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  meditationDuration: {
    fontSize: 13,
    color: '#888',
  },
  tipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tipCard: {
    flex: 1,
    minWidth: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  tipIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  bottomSpace: {
    height: 40,
  },
});

export default MeditationScreen;