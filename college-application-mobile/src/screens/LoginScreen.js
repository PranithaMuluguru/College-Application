// import React, { useState } from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';

// const LoginScreen = ({ navigation }) => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');

//   const handleLogin = () => {
//     // Simple validation
//     if (email && password) {
//       navigation.replace('Home');
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Image 
//         source={{ uri: 'https://via.placeholder.com/150' }} 
//         style={styles.logo}
//       />
//       <Text style={styles.title}>College Login</Text>
      
//       <TextInput
//         style={styles.input}
//         placeholder="Email"
//         value={email}
//         onChangeText={setEmail}
//         keyboardType="email-address"
//         autoCapitalize="none"
//       />
      
//       <TextInput
//         style={styles.input}
//         placeholder="Password"
//         value={password}
//         onChangeText={setPassword}
//         secureTextEntry
//       />
      
//       <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
//         <Text style={styles.loginButtonText}>Login</Text>
//       </TouchableOpacity>
      
//       <TouchableOpacity>
//         <Text style={styles.registerText}>Create Account</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     padding: 20,
//     backgroundColor: '#f8f9fa',
//   },
//   logo: {
//     width: 120,
//     height: 120,
//     alignSelf: 'center',
//     marginBottom: 30,
//     borderRadius: 60,
//     backgroundColor: '#ddd',
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginBottom: 40,
//     color: '#333',
//   },
//   input: {
//     backgroundColor: 'white',
//     padding: 15,
//     borderRadius: 10,
//     marginBottom: 15,
//     borderWidth: 1,
//     borderColor: '#ddd',
//   },
//   loginButton: {
//     backgroundColor: '#4a86e8',
//     padding: 15,
//     borderRadius: 10,
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   loginButtonText: {
//     color: 'white',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
//   registerText: {
//     textAlign: 'center',
//     color: '#4a86e8',
//     fontSize: 14,
//   },
// });

// export default LoginScreen;
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import axios from 'axios';

const API_BASE_URL = 'http://10.32.9.125:8000';

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
      const response = await axios.post(`${API_BASE_URL}/login/`, {
        identifier,
        password,
      });

      const userData = response.data;
      navigation.replace('Home', { user: userData });

    } catch (error) {
      console.error('Login error:', error.response?.data);
      let errorMessage = 'Login failed. Please try again.';
      if (error.response && error.response.data && error.response.data.detail) {
        errorMessage = Array.isArray(error.response.data.detail)
          ? error.response.data.detail.map(d => d.msg || d).join('\n')
          : error.response.data.detail;
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Network error. Check your internet.';
      }
      Alert.alert('Login Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://via.placeholder.com/150' }}
        style={styles.logo}
      />
      <Text style={styles.title}>College Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email or College ID"
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
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

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.registerText}>Create Account</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f8f9fa' },
  logo: { width: 120, height: 120, alignSelf: 'center', marginBottom: 30, borderRadius: 60, backgroundColor: '#ddd' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#333' },
  input: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  loginButton: { backgroundColor: '#4a86e8', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  disabledButton: { backgroundColor: '#a8a8a8' },
  loginButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  registerText: { textAlign: 'center', color: '#4a86e8', fontSize: 14 },
});

export default LoginScreen;
