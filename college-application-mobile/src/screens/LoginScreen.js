import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import axios from 'axios';

const API_BASE_URL = 'http://10.32.10.15:8000';

const LoginScreen = ({ navigation }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting login with:', identifier);
      const response = await axios.post(`${API_BASE_URL}/login/`, {
        identifier,
        password,
      });

      console.log('Login successful:', response.data);
      
      // Pass user data properly to HomeScreen
      const userData = response.data;
      navigation.replace('Home', { 
        user: userData.user,
        userId: userData.user.id,
        userInfo: userData.user,
        token: userData.access_token
      });

    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response) {
        console.log('Error response data:', error.response.data);
        console.log('Error status:', error.response.status);
        
        if (error.response.data && error.response.data.detail) {
          errorMessage = typeof error.response.data.detail === 'string' 
            ? error.response.data.detail
            : 'Invalid credentials or server error';
        } else if (error.response.status === 422) {
          errorMessage = 'Validation error. Please check your input.';
        } else if (error.response.status === 404) {
          errorMessage = 'User not found. Please check your email/college ID.';
        } else if (error.response.status === 401) {
          errorMessage = 'Incorrect password. Please try again.';
        } else if (error.response.status === 400) {
          errorMessage = 'Account not verified. Please verify your email first.';
        }
      } else if (error.request) {
        console.log('No response received:', error.request);
        errorMessage = 'Cannot connect to server. Please check your internet connection and try again.';
      } else {
        console.log('Error message:', error.message);
        errorMessage = error.message || 'An unexpected error occurred.';
      }
      
      Alert.alert('Login Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://via.placeholder.com/150' }}
        style={styles.logo}
      />
      <Text style={styles.title}>College Login</Text>
      
      <Text style={styles.subtitle}>Sign in to your account</Text>

      <TextInput
        style={styles.input}
        placeholder="Email or College ID"
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isLoading}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading}
      />

      <TouchableOpacity
        style={[styles.loginButton, isLoading && styles.disabledButton]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.loginButtonText}>
          {isLoading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.registerButton} 
        onPress={handleRegister}
        disabled={isLoading}
      >
        <Text style={styles.registerText}>Don't have an account? Create Account</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 20, 
    backgroundColor: '#f8f9fa' 
  },
  logo: { 
    width: 120, 
    height: 120, 
    alignSelf: 'center', 
    marginBottom: 20, 
    borderRadius: 60, 
    backgroundColor: '#ddd' 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 10, 
    color: '#333' 
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666'
  },
  input: { 
    backgroundColor: 'white', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#ddd',
    fontSize: 16
  },
  loginButton: { 
    backgroundColor: '#3B82F6', 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  disabledButton: { 
    backgroundColor: '#9CA3AF' 
  },
  loginButtonText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  registerButton: {
    alignItems: 'center',
    padding: 10,
  },
  registerText: { 
    textAlign: 'center', 
    color: '#3B82F6', 
    fontSize: 14,
    fontWeight: '500'
  }
});

export default LoginScreen;