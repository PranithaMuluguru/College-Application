import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CalendarPicker = ({ visible = false, 
    onClose = () => {}, 
    initialDate = null, 
    onSelectDate = () => {} }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (initialDate) {
      const date = new Date(initialDate);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setCurrentMonth(date.getMonth());
        setCurrentYear(date.getFullYear());
      }
    }
  }, [initialDate]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const formatDate = (date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const handleSave = () => {
    onSelectDate(formatDate(selectedDate));
    onClose();
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSameDay = (date1, date2) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const navigateMonth = (direction) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;

    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }

    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const selectDate = (day) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.calendarDay} />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(currentYear, currentMonth, day);
      const isSelected = isSameDay(dayDate, selectedDate);
      const isCurrentDay = isToday(dayDate);

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            styles.calendarDayButton,
            isSelected && styles.selectedCalendarDay,
            isCurrentDay && !isSelected && styles.todayCalendarDay
          ]}
          onPress={() => selectDate(day)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.calendarDayText,
            isSelected && styles.selectedCalendarDayText,
            isCurrentDay && !isSelected && styles.todayCalendarDayText
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const renderYearPicker = () => {
    const currentYearIndex = currentYear - 2020;
    const years = Array.from({ length: 20 }, (_, i) => 2020 + i);

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.yearPickerContainer}
      >
        {years.map((year) => (
          <TouchableOpacity
            key={year}
            style={[
              styles.yearButton,
              year === currentYear && styles.selectedYearButton
            ]}
            onPress={() => setCurrentYear(year)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.yearButtonText,
              year === currentYear && styles.selectedYearButtonText
            ]}>
              {year}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
        <View style={styles.calendarContainer}>
          {/* Header */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Ionicons name="close" size={24} color="#888" />
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>Select Date</Text>
            <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Selected Date Display */}
          <View style={styles.selectedDateDisplay}>
            <Text style={styles.selectedDateText}>
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateMonth(-1)}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color="#3b82f6" />
            </TouchableOpacity>
            
            <Text style={styles.monthYearText}>
              {months[currentMonth]} {currentYear}
            </Text>
            
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateMonth(1)}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          {/* Year Picker */}
          {renderYearPicker()}

          {/* Week Days Header */}
          <View style={styles.weekDaysHeader}>
            {weekDays.map((day) => (
              <View key={day} style={styles.weekDayCell}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {renderCalendarDays()}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => {
                const today = new Date();
                setSelectedDate(today);
                setCurrentMonth(today.getMonth());
                setCurrentYear(today.getFullYear());
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="today-outline" size={16} color="#3b82f6" />
              <Text style={styles.quickActionText}>Today</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setSelectedDate(tomorrow);
                setCurrentMonth(tomorrow.getMonth());
                setCurrentYear(tomorrow.getFullYear());
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-forward-outline" size={16} color="#3b82f6" />
              <Text style={styles.quickActionText}>Tomorrow</Text>
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
  calendarContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    width: '95%',
    maxWidth: 380,
    padding: 20,
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
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerButton: {
    padding: 8,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  calendarTitle: {
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
  selectedDateDisplay: {
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
  },
  selectedDateText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  monthYearText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  yearPickerContainer: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  yearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  selectedYearButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  yearButtonText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  selectedYearButtonText: {
    color: '#fff',
  },
  weekDaysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    marginTop: 16,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  calendarDay: {
    width: '14.28%', // 7 days in a week
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayButton: {
    borderRadius: 8,
    margin: 2,
  },
  selectedCalendarDay: {
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
  todayCalendarDay: {
    backgroundColor: '#0a0a0a',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  calendarDayText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  selectedCalendarDayText: {
    color: '#fff',
    fontWeight: '700',
  },
  todayCalendarDayText: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  quickActionText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CalendarPicker;