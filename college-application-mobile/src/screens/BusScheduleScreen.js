import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BusScheduleScreen = ({ navigation }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [nextBuses, setNextBuses] = useState([]);

  // Bus schedule data in 24-hour format
  const scheduleData = {
    working: {
      nilaToSahyadri: [
        '8:30', '9:25', '9:45', '10:20', '10:45', '11:15', '11:50', '12:15', '12:30',
        '13:00', '13:30', '13:45', '14:15', '14:45', '15:20', '15:45', '16:30', '17:00',
        '17:15', '17:45', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00',
        '22:00', '23:00', '24:00'
      ],
      sahyadriToNila: [
        '7:45', '8:15', '8:30', '8:45', '9:00', '9:25', '9:45', '10:20', '10:45',
        '11:15', '11:50', '12:15', '12:30', '13:00', '13:30', '13:45', '14:15', '14:45',
        '15:20', '15:45', '16:30', '17:00', '17:15', '17:45', '18:00', '18:30', '19:00',
        '19:30', '20:00', '21:15', '22:15', '23:15'
      ]
    },
    saturday: {
      nilaToSahyadri: [
        '8:30', '9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
        '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
        '17:15', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00',
        '22:00', '23:00', '24:00'
      ],
      sahyadriToNila: [
        '7:30', '8:00', '8:30', '9:00', '9:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00',
        '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:15', '21:15',
        '22:15', '23:15'
      ]
    },
    sunday: {
      nilaToSahyadri: [
        '8:45', '9:15', '10:00', '11:00', '12:00', '12:30', '13:15', '14:00', '15:00',
        '16:00', '17:00', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00',
        '22:00', '23:00', '24:00'
      ],
      sahyadriToNila: [
        '8:00', '8:30', '9:00', '9:30', '10:15', '11:15', '12:15', '12:45', '13:30',
        '14:15', '15:15', '16:15', '17:15', '18:00', '18:30', '19:00', '19:30', '20:15',
        '21:15', '22:15', '23:15'
      ]
    }
  };

  const locations = [
    { id: 'nila', name: 'Nila Gate' },
    { id: 'sahyadri', name: 'Sahyadri' },
    { id: 'apj', name: 'APJ Block' },
    { id: 'co6', name: 'CO6 Block' }
  ];

  const dayTypes = [
    { id: 'working', name: 'Weekday' },
    { id: 'saturday', name: 'Saturday' },
    { id: 'sunday', name: 'Sunday' }
  ];

  const [selectedDay, setSelectedDay] = useState('working');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      findNextBuses();
    }, 30000);

    findNextBuses();
    return () => clearInterval(timer);
  }, [fromLocation, toLocation, selectedDay]);

  const timeToMinutes = (timeStr) => {
    let [hours, minutes] = timeStr.split(':').map(Number);
    if (hours === 24 && minutes === 0) {
      return 24 * 60;
    }
    return hours * 60 + minutes;
  };

  const findNextBuses = () => {
    if (!fromLocation || !toLocation) return;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let schedule = [];
    
    if ((fromLocation === 'nila' || fromLocation === 'apj') && 
        (toLocation === 'sahyadri' || toLocation === 'co6')) {
      schedule = scheduleData[selectedDay].nilaToSahyadri;
    } else if ((fromLocation === 'sahyadri' || fromLocation === 'co6') && 
               (toLocation === 'nila' || toLocation === 'apj')) {
      schedule = scheduleData[selectedDay].sahyadriToNila;
    } else {
      setNextBuses([]);
      return;
    }

    const scheduleInMinutes = schedule.map(timeToMinutes);
    const upcomingBuses = scheduleInMinutes.filter(time => time > currentMinutes);
    const nextTwoBuses = upcomingBuses.slice(0, 2);
    
    if (nextTwoBuses.length < 2) {
      const busesNeeded = 2 - nextTwoBuses.length;
      const tomorrowBuses = scheduleInMinutes.slice(0, busesNeeded);
      nextTwoBuses.push(...tomorrowBuses);
    }

    const nextBusTimes = nextTwoBuses.map(busMinutes => {
      const hours = Math.floor(busMinutes / 60);
      const minutes = busMinutes % 60;
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    });

    setNextBuses(nextBusTimes);
  };

  const getTimeUntilBus = (busTime) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const busMinutes = timeToMinutes(busTime);

    let timeDiff = busMinutes - currentMinutes;
    
    if (timeDiff < 0) {
      timeDiff += 24 * 60;
    }

    if (timeDiff < 60) {
      return `${timeDiff} min`;
    } else {
      const hours = Math.floor(timeDiff / 60);
      const mins = timeDiff % 60;
      return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
    }
  };

  const isBusToday = (busTime) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const busMinutes = timeToMinutes(busTime);
    return busMinutes > currentMinutes;
  };

  const LocationButton = ({ location, type }) => {
    const isSelected = type === 'from' 
      ? fromLocation === location.id 
      : toLocation === location.id;
    
    return (
      <TouchableOpacity
        style={[styles.locationBtn, isSelected && styles.selectedLocation]}
        onPress={() => type === 'from' ? setFromLocation(location.id) : setToLocation(location.id)}
        activeOpacity={0.8}
      >
        <Text style={[styles.locationBtnText, isSelected && styles.selectedLocationText]}>
          {location.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const DayButton = ({ day }) => (
    <TouchableOpacity
      style={[styles.dayBtn, selectedDay === day.id && styles.selectedDay]}
      onPress={() => setSelectedDay(day.id)}
      activeOpacity={0.8}
    >
      <Text style={[styles.dayBtnText, selectedDay === day.id && styles.selectedDayText]}>
        {day.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bus Schedule</Text>
        <TouchableOpacity onPress={findNextBuses} style={styles.refreshButton}>
          <Ionicons name="refresh-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Time */}
        <View style={styles.timeCard}>
          <View style={styles.timeIcon}>
            <Ionicons name="time-outline" size={24} color="#4ade80" />
          </View>
          <Text style={styles.currentTime}>
            {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
          <Text style={styles.currentDate}>
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
        </View>

        {/* Day Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule Type</Text>
          <View style={styles.dayContainer}>
            {dayTypes.map(day => (
              <DayButton key={day.id} day={day} />
            ))}
          </View>
        </View>

        {/* From Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Departure</Text>
          <View style={styles.locationGrid}>
            {locations.map(location => (
              <LocationButton key={location.id} location={location} type="from" />
            ))}
          </View>
        </View>

        {/* To Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destination</Text>
          <View style={styles.locationGrid}>
            {locations.map(location => (
              <LocationButton key={location.id} location={location} type="to" />
            ))}
          </View>
        </View>

        {/* Next Buses Display */}
        {fromLocation && toLocation && (
          <View style={styles.nextBusContainer}>
            {nextBuses.length > 0 ? (
              <View style={styles.busesContainer}>
                {nextBuses.map((busTime, index) => (
                  <View key={index} style={[
                    styles.busCard,
                    index === 0 && styles.primaryBusCard
                  ]}>
                    <View style={styles.busCardHeader}>
                      <View style={styles.busBadge}>
                        <Ionicons 
                          name={index === 0 ? "flash" : "time-outline"} 
                          size={14} 
                          color={index === 0 ? "#000" : "#666"} 
                        />
                        <Text style={[styles.busLabel, index === 0 && styles.primaryBusLabel]}>
                          {index === 0 ? 'NEXT' : 'UPCOMING'}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={[styles.busTime, index === 0 && styles.primaryBusTime]}>
                      {busTime}
                    </Text>
                    
                    <View style={styles.routeInfo}>
                      <View style={styles.routeRow}>
                        <View style={styles.routeDot} />
                        <Text style={[styles.routeText, index === 0 && styles.primaryRouteText]}>
                          {locations.find(l => l.id === fromLocation)?.name}
                        </Text>
                      </View>
                      <View style={styles.routeArrow}>
                        <Ionicons 
                          name="arrow-down" 
                          size={16} 
                          color={index === 0 ? "#4ade80" : "#666"} 
                        />
                      </View>
                      <View style={styles.routeRow}>
                        <View style={styles.routeDot} />
                        <Text style={[styles.routeText, index === 0 && styles.primaryRouteText]}>
                          {locations.find(l => l.id === toLocation)?.name}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.timeInfo}>
                      <Ionicons 
                        name="timer-outline" 
                        size={14} 
                        color={index === 0 ? "#4ade80" : "#666"} 
                      />
                      <Text style={[styles.timeUntil, index === 0 && styles.primaryTimeUntil]}>
                        {isBusToday(busTime) ? `Arrives in ${getTimeUntilBus(busTime)}` : 'Tomorrow'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noBusCard}>
                <Ionicons name="alert-circle-outline" size={48} color="#666" />
                <Text style={styles.noBusText}>No buses available</Text>
                <Text style={styles.noBusSubtext}>Check your route selection</Text>
              </View>
            )}
          </View>
        )}

        {/* Instructions */}
        {!fromLocation || !toLocation ? (
          <View style={styles.instructionCard}>
            <View style={styles.instructionIcon}>
              <Ionicons name="information-circle" size={48} color="#4ade80" />
            </View>
            <Text style={styles.instructionTitle}>Get Started</Text>
            <Text style={styles.instructionText}>
              Select schedule type, departure point, and destination to view next available buses
            </Text>
          </View>
        ) : null}

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
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: StatusBar.currentHeight + 16 || 44,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    padding: 4,
  },
  refreshButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  timeCard: {
    backgroundColor: '#1a1a1a',
    padding: 24,
    borderRadius: 16,
    marginVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  timeIcon: {
    marginBottom: 12,
  },
  currentTime: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  currentDate: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dayContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dayBtn: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
  },
  selectedDay: {
    backgroundColor: '#4ade80',
    borderColor: '#4ade80',
  },
  dayBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  selectedDayText: {
    color: '#000',
  },
  locationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationBtn: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    minWidth: '48%',
    alignItems: 'center',
  },
  selectedLocation: {
    backgroundColor: '#4ade80',
    borderColor: '#4ade80',
  },
  locationBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  selectedLocationText: {
    color: '#000',
  },
  nextBusContainer: {
    marginVertical: 12,
  },
  busesContainer: {
    gap: 12,
  },
  busCard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  primaryBusCard: {
    backgroundColor: '#1e1e1e',
    borderColor: '#4ade80',
    borderWidth: 2,
  },
  busCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  busBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  busLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 1,
  },
  primaryBusLabel: {
    backgroundColor: '#4ade80',
    color: '#000',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  busTime: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 16,
    letterSpacing: 2,
  },
  primaryBusTime: {
    color: '#4ade80',
  },
  routeInfo: {
    marginBottom: 16,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
  },
  routeArrow: {
    paddingLeft: 4,
    paddingVertical: 4,
  },
  routeText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  primaryRouteText: {
    color: '#fff',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  timeUntil: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  primaryTimeUntil: {
    color: '#4ade80',
  },
  noBusCard: {
    backgroundColor: '#1a1a1a',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  noBusText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
    fontWeight: '600',
  },
  noBusSubtext: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  instructionCard: {
    backgroundColor: '#1a1a1a',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  instructionIcon: {
    marginBottom: 16,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomSpace: {
    height: 40,
  },
});

export default BusScheduleScreen;