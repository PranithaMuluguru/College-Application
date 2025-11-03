import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ClockTimePicker = ({ visible, onClose, initialTime, onSelectTime }) => {
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [period, setPeriod] = useState('AM');
  const [mode, setMode] = useState('hour');

  useEffect(() => {
    if (initialTime) {
      const timeParts = initialTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (timeParts) {
        setSelectedHour(parseInt(timeParts[1], 10));
        setSelectedMinute(parseInt(timeParts[2], 10));
        setPeriod(timeParts[3].toUpperCase());
      }
    }
  }, [initialTime]);

  const hours = Array.from({ length: 12 }, (_, i) => i === 0 ? 12 : i);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const formatTime = () => {
    const hour = selectedHour;
    const minute = selectedMinute.toString().padStart(2, '0');
    return `${hour}:${minute} ${period}`;
  };

  const handleSave = () => {
    onSelectTime(formatTime());
    onClose();
  };

  const getHourAngle = () => {
    const hour = selectedHour === 12 ? 0 : selectedHour;
    const minuteProgress = selectedMinute / 60;
    return ((hour + minuteProgress) / 12) * 360 - 90;
  };

  const getMinuteAngle = () => {
    return (selectedMinute / 60) * 360 - 90;
  };

  const renderClockFace = () => {
    const items = mode === 'hour' ? hours : minutes;
    const setValue = mode === 'hour' ? setSelectedHour : setSelectedMinute;
    const selectedValue = mode === 'hour' ? selectedHour : selectedMinute;
    const size = 280;
    const radius = size / 2 - 40;
    
    return (
      <View style={[styles.clockContainer, { width: size, height: size }]}>
        <View style={[styles.clockFace, { width: size, height: size }]}>
          {/* Fixed Hour markers - now properly centered */}
          {Array.from({ length: 12 }).map((_, index) => {
            const angle = (index / 12) * 360 - 90; // Start from 12 o'clock
            const isMainHour = index % 3 === 0; // 12, 3, 6, 9 o'clock
            const markerRadius = size / 2 - (isMainHour ? 8 : 12);
            const markerLength = isMainHour ? 16 : 12;
            
            // Calculate position from center
            const x = Math.cos((angle * Math.PI) / 180) * markerRadius + size / 2;
            const y = Math.sin((angle * Math.PI) / 180) * markerRadius + size / 2;
            
            return (
              <View
                key={`marker-${index}`}
                style={[
                  styles.hourMarker,
                  isMainHour && styles.mainHourMarker,
                  {
                    left: x - (isMainHour ? 1.5 : 1),
                    top: y - markerLength / 2,
                    height: markerLength,
                    width: isMainHour ? 3 : 2,
                    transform: [{ rotate: `${angle + 90}deg` }],
                  },
                ]}
              />
            );
          })}
          
          {/* Clock numbers */}
          {items.map((value, index) => {
            const angle = ((index / items.length) * 2 * Math.PI) - Math.PI / 2;
            const x = radius * Math.cos(angle) + size / 2;
            const y = radius * Math.sin(angle) + size / 2;
            
            return (
              <TouchableOpacity
                key={value}
                style={[
                  styles.clockNumber,
                  { left: x - 25, top: y - 25 },
                  selectedValue === value && styles.selectedClockNumber
                ]}
                onPress={() => setValue(value)}
              >
                <Text style={[
                  styles.clockNumberText,
                  selectedValue === value && styles.selectedClockNumberText
                ]}>
                  {mode === 'hour' ? value : value.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            );
          })}
          
          {/* Clock hands */}
          <View style={styles.handContainer}>
            {/* Hour hand (shorter, thicker) */}
            <Animated.View 
              style={[
                styles.hourHand,
                { 
                  transform: [
                    { rotate: `${getHourAngle()}deg` }
                  ] 
                }
              ]} 
            />
            
            {/* Minute hand (longer, thinner) */}
            <Animated.View 
              style={[
                styles.minuteHand,
                { 
                  transform: [
                    { rotate: `${getMinuteAngle()}deg` }
                  ] 
                }
              ]} 
            />
            
            {/* Center dot */}
            <View style={styles.clockCenter} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.timePickerContainer}>
          <View style={styles.timePickerHeader}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Ionicons name="close" size={24} color="#888" />
            </TouchableOpacity>
            <Text style={styles.timePickerTitle}>Select Time</Text>
            <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.timeDisplay}>
            <TouchableOpacity 
              style={[styles.timeComponent, mode === 'hour' && styles.activeTimeComponent]} 
              onPress={() => setMode('hour')}
            >
              <Text style={[styles.timeText, mode === 'hour' && styles.activeTimeText]}>
                {selectedHour.toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
            <Text style={styles.timeSeparator}>:</Text>
            <TouchableOpacity 
              style={[styles.timeComponent, mode === 'minute' && styles.activeTimeComponent]} 
              onPress={() => setMode('minute')}
            >
              <Text style={[styles.timeText, mode === 'minute' && styles.activeTimeText]}>
                {selectedMinute.toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
            <View style={styles.periodSelector}>
              <TouchableOpacity 
                style={[styles.periodButton, period === 'AM' && styles.activePeriod]} 
                onPress={() => setPeriod('AM')}
              >
                <Text style={[styles.periodText, period === 'AM' && styles.activePeriodText]}>AM</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.periodButton, period === 'PM' && styles.activePeriod]} 
                onPress={() => setPeriod('PM')}
              >
                <Text style={[styles.periodText, period === 'PM' && styles.activePeriodText]}>PM</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {renderClockFace()}
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.modeButton, mode === 'hour' && styles.activeModeButton]} 
              onPress={() => setMode('hour')}
            >
              <Ionicons name="time-outline" size={16} color={mode === 'hour' ? '#fff' : '#888'} />
              <Text style={[styles.modeButtonText, mode === 'hour' && styles.activeModeButtonText]}>
                Hours
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modeButton, mode === 'minute' && styles.activeModeButton]} 
              onPress={() => setMode('minute')}
            >
              <Ionicons name="timer-outline" size={16} color={mode === 'minute' ? '#fff' : '#888'} />
              <Text style={[styles.modeButtonText, mode === 'minute' && styles.activeModeButtonText]}>
                Minutes
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    width: '95%',
    maxWidth: 350,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  headerButton: {
    padding: 8,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  timePickerTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  saveText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '700',
  },
  timeDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  timeComponent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  activeTimeComponent: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  timeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#888',
  },
  activeTimeText: {
    color: '#fff',
  },
  timeSeparator: {
    fontSize: 28,
    fontWeight: '700',
    color: '#666',
    marginHorizontal: 8,
  },
  periodSelector: {
    marginLeft: 16,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  periodText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
  },
  activePeriod: {
    backgroundColor: '#3b82f6',
  },
  activePeriodText: {
    color: '#fff',
  },
  clockContainer: {
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockFace: {
    position: 'relative',
    borderRadius: 140,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#2a2a2a',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  hourMarker: {
    position: 'absolute',
    backgroundColor: '#444',
    borderRadius: 1,
  },
  mainHourMarker: {
    backgroundColor: '#666',
  },
  handContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hourHand: {
    position: 'absolute',
    width: 80,
    height: 4,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
    transformOrigin: '0% center', // Fixed: rotate from left edge (center attachment point)
    left: '50%', // Center the hand horizontally
    top: '50%', // Center the hand vertically  
    marginTop: -2, // Half of height to center vertically
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  minuteHand: {
    position: 'absolute',
    width: 110,
    height: 2,
    backgroundColor: '#22c55e',
    borderRadius: 1,
    transformOrigin: '0% center', // Fixed: rotate from left edge (center attachment point)
    left: '50%', // Center the hand horizontally
    top: '50%', // Center the hand vertically
    marginTop: -1, // Half of height to center vertically
    shadowColor: '#22c55e',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  clockCenter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3b82f6',
    position: 'absolute',
    left: '50%', // Center horizontally
    top: '50%', // Center vertically
    marginLeft: -8, // Half of width to center
    marginTop: -8, // Half of height to center
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  clockNumber: {
    position: 'absolute',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    backgroundColor: 'transparent',
  },
  selectedClockNumber: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  clockNumberText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '700',
  },
  selectedClockNumberText: {
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 8,
  },
  activeModeButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  modeButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  activeModeButtonText: {
    color: '#fff',
  },
});

export default ClockTimePicker;