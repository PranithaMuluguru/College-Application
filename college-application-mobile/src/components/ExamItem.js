import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ExamItem = ({ exam }) => {
  return (
    <View style={styles.container}>
      <View style={styles.dateBadge}>
        <Text style={styles.dateText}>{exam.date}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.subject}>{exam.subject}</Text>
        <Text style={styles.details}>{exam.time} • {exam.location}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateBadge: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 60,
  },
  dateText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 14,
  },
  info: {
    flex: 1,
  },
  subject: {
    fontWeight: '600',
    fontSize: 16,
    color: '#2d3748',
    marginBottom: 2,
  },
  details: {
    color: '#718096',
    fontSize: 12,
  },
});

export default ExamItem;