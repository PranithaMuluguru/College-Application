import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import all your screens with correct paths
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen.js';
import HomeScreen from './src/screens/HomeScreen';
import MessScreen from './src/screens/MessScreen';
import AcademicsScreen from './src/screens/AcademicsScreen';
import SportsScreen from './src/screens/SportsScreen';
import CampusScreen from './src/screens/CampusScreen';
import ClubsScreen from './src/screens/ClubsScreen';
import ClubDetailScreen from './src/screens/ClubDetailScreen';
import ClubAnnouncementsScreen from './src/screens/ClubAnnouncementsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ title: 'Create Account' }} 
        />
        <Stack.Screen 
          name="VerifyOTP" 
          component={OTPVerificationScreen} 
          options={{ title: 'Verify Email' }} 
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
        options={{ headerShown: false }}  // <-- hides the default header
       />
        <Stack.Screen name="Mess" component={MessScreen} />
        <Stack.Screen name="Academics" component={AcademicsScreen} />
        <Stack.Screen name="Sports" component={SportsScreen} />
        <Stack.Screen name="Campus" component={CampusScreen} />
        <Stack.Screen name="Clubs" component={ClubsScreen} />
        <Stack.Screen name="ClubDetail" component={ClubDetailScreen} />
        <Stack.Screen name="ClubAnnouncements" component={ClubAnnouncementsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}