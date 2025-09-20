import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import axios from 'axios';

const API_BASE_URL = 'http://10.32.9.125:8000'; // Change to your server IP

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    college_id: '',
    department: '',
    year: '',
    phone_number: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    for (const key in formData) {
      if (!formData[key]) {
        Alert.alert('Error', 'Please fill all fields');
        return;
      }
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/register/`, formData);
      Alert.alert('Success', response.data.message);
      navigation.navigate('VerifyOTP', { email: formData.email });
    } catch (error) {
      console.error('Registration error:', error.response?.data);
      Alert.alert('Error', error.response?.data?.detail || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.innerContainer}>
          <Text style={styles.title}>Create Account</Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={formData.full_name}
            onChangeText={text => handleInputChange('full_name', text)}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChangeText={text => handleInputChange('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={formData.password}
            onChangeText={text => handleInputChange('password', text)}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="College ID"
            value={formData.college_id}
            onChangeText={text => handleInputChange('college_id', text)}
          />

          <TextInput
            style={styles.input}
            placeholder="Department"
            value={formData.department}
            onChangeText={text => handleInputChange('department', text)}
          />

          <TextInput
            style={styles.input}
            placeholder="Year"
            value={formData.year}
            onChangeText={text => handleInputChange('year', text)}
            keyboardType="numeric"
          />

          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={formData.phone_number}
            onChangeText={text => handleInputChange('phone_number', text)}
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.registerButtonText}>
              {isLoading ? 'Creating account...' : 'Register'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  innerContainer: {
    paddingBottom: 60, // extra space for keyboard
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  registerButton: {
    backgroundColor: '#4a86e8',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  registerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginText: {
    textAlign: 'center',
    color: '#4a86e8',
    fontSize: 14,
  },
});

export default RegisterScreen;
