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

  // Convert time string to minutes since midnight for comparison
  const timeToMinutes = (timeStr) => {
    let [hours, minutes] = timeStr.split(':').map(Number);
    // Handle 24:00 as 24*60 = 1440 minutes
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
    
    // Determine route based on from/to locations
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

    // Convert all schedule times to minutes and find the next buses
    const scheduleInMinutes = schedule.map(timeToMinutes);
    
    // Find all bus times that are after current time
    const upcomingBuses = scheduleInMinutes.filter(time => time > currentMinutes);
    
    // Get the next two buses
    const nextTwoBuses = upcomingBuses.slice(0, 2);
    
    // If we don't have two buses for today, get remaining from tomorrow
    if (nextTwoBuses.length < 2) {
      const busesNeeded = 2 - nextTwoBuses.length;
      const tomorrowBuses = scheduleInMinutes.slice(0, busesNeeded);
      nextTwoBuses.push(...tomorrowBuses);
    }

    // Convert minutes back to time strings
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
    
    // If bus is for next day (like after midnight)
    if (timeDiff < 0) {
      timeDiff += 24 * 60; // Add 24 hours
    }

    if (timeDiff < 60) {
      return `${timeDiff} minutes`;
    } else {
      const hours = Math.floor(timeDiff / 60);
      const mins = timeDiff % 60;
      if (mins === 0) {
        return `${hours} hours`;
      } else {
        return `${hours} hours ${mins} minutes`;
      }
    }
  };

  const isBusToday = (busTime) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const busMinutes = timeToMinutes(busTime);
    return busMinutes > currentMinutes;
  };

  const LocationButton = ({ location, type }) => (
    <TouchableOpacity
      style={[
        styles.locationBtn,
        type === 'from' && fromLocation === location.id && styles.selectedLocation,
        type === 'to' && toLocation === location.id && styles.selectedLocation
      ]}
      onPress={() => type === 'from' ? setFromLocation(location.id) : setToLocation(location.id)}
    >
      <Text style={styles.locationBtnText}>{location.name}</Text>
    </TouchableOpacity>
  );

  const DayButton = ({ day }) => (
    <TouchableOpacity
      style={[
        styles.dayBtn,
        selectedDay === day.id && styles.selectedDay
      ]}
      onPress={() => setSelectedDay(day.id)}
    >
      <Text style={[
        styles.dayBtnText,
        selectedDay === day.id && styles.selectedDayText
      ]}>
        {day.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Next Bus</Text>
        <TouchableOpacity onPress={findNextBuses}>
          <Ionicons name="refresh-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Time */}
        <View style={styles.timeDisplay}>
          <Text style={styles.currentTime}>
            {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
          <Text style={styles.currentDate}>
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
        </View>

        {/* Day Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Day Type</Text>
          <View style={styles.dayContainer}>
            {dayTypes.map(day => (
              <DayButton key={day.id} day={day} />
            ))}
          </View>
        </View>

        {/* From Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>From</Text>
          <View style={styles.locationGrid}>
            {locations.map(location => (
              <LocationButton key={location.id} location={location} type="from" />
            ))}
          </View>
        </View>

        {/* To Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>To</Text>
          <View style={styles.locationGrid}>
            {locations.map(location => (
              <LocationButton key={location.id} location={location} type="to" />
            ))}
          </View>
        </View>

        {/* Next Buses Display */}
        {fromLocation && toLocation && (
          <View style={styles.nextBusContainer}>
            <Text style={styles.nextBusTitle}>Next Buses</Text>
            
            {nextBuses.length > 0 ? (
              <View style={styles.busesContainer}>
                {nextBuses.map((busTime, index) => (
                  <View key={index} style={[
                    styles.busCard,
                    index === 0 && styles.firstBusCard,
                    index === 1 && styles.secondBusCard
                  ]}>
                    <View style={styles.busHeader}>
                      <Text style={styles.busNumber}>Bus {index + 1}</Text>
                      <View style={[
                        styles.busIndicator,
                        index === 0 ? styles.firstBusIndicator : styles.secondBusIndicator
                      ]}>
                        <Text style={styles.busIndicatorText}>
                          {index === 0 ? 'NEXT' : 'FOLLOWING'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.busTime}>{busTime}</Text>
                    <Text style={styles.busRoute}>
                      {locations.find(l => l.id === fromLocation)?.name} → {locations.find(l => l.id === toLocation)?.name}
                    </Text>
                    <Text style={styles.timeUntil}>
                      {isBusToday(busTime) ? `In ${getTimeUntilBus(busTime)}` : 'First bus tomorrow'}
                    </Text>
                    {index === 0 && (
                      <Text style={styles.dayType}>• {dayTypes.find(d => d.id === selectedDay)?.name} Schedule</Text>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noBusCard}>
                <Ionicons name="time-outline" size={48} color="#666" />
                <Text style={styles.noBusText}>No buses available for this route</Text>
              </View>
            )}
          </View>
        )}

        {/* Instructions */}
        {!fromLocation || !toLocation ? (
          <View style={styles.instructionCard}>
            <Ionicons name="bus-outline" size={32} color="#007AFF" />
            <Text style={styles.instructionText}>
              Select your starting point and destination to see the next available buses
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: StatusBar.currentHeight + 12 || 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  timeDisplay: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentTime: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
  },
  currentDate: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  dayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayBtn: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedDay: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  dayBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectedDayText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  locationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    minWidth: '48%',
    alignItems: 'center',
  },
  selectedLocation: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  locationBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  nextBusContainer: {
    marginVertical: 24,
  },
  nextBusTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  busesContainer: {
    gap: 12,
  },
  busCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  firstBusCard: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  secondBusCard: {
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    opacity: 0.9,
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  busNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  busIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  firstBusIndicator: {
    backgroundColor: '#007AFF',
  },
  secondBusIndicator: {
    backgroundColor: '#666',
  },
  busIndicatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  busTime: {
    fontSize: 36,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  busRoute: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  timeUntil: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  dayType: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  noBusCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  noBusText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  instructionCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
});

export default BusScheduleScreen;