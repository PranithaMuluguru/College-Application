import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const QuickAccess = ({ navigation }) => {
  const buttons = [
    { title: 'Academics', screen: 'Academics' },
    { title: 'Mess', screen: 'Mess' },
    { title: 'Sports', screen: 'Sports' },
    { title: 'Campus Life', screen: 'Campus' },
  ];
  
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Access</Text>
      <View style={styles.buttonContainer}>
        {buttons.map((button, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.button}
            onPress={() => navigation.navigate(button.screen)}
          >
            <Text style={styles.buttonText}>{button.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#4a86e8',
    padding: 15,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default QuickAccess;