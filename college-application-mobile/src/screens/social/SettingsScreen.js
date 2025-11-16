import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = ({ navigation, route }) => {
  const { userInfo, userId } = route.params;
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const handleLogout = () => {
    console.log('🔵 Logout button pressed');
    
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => console.log('❌ Logout cancelled')
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            console.log('🟡 Starting logout process...');
            try {
              // Clear AsyncStorage
              console.log('🟡 Clearing AsyncStorage...');
              await AsyncStorage.clear();
              console.log('✅ AsyncStorage cleared successfully');
              
              // Check if navigation is available
              console.log('🟡 Navigation object:', navigation ? 'Available' : 'Not Available');
              
              // Reset to Login screen
              console.log('🟡 Attempting to navigate to Login...');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
              console.log('✅ Navigation successful');
              
            } catch (error) {
              console.error('❌ Logout error:', error);
              console.error('Error details:', error.message);
              Alert.alert(
                'Error', 
                `Failed to logout: ${error.message}\n\nPlease restart the app.`
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const settingSections = [
    {
      title: 'Account',
      items: [
        {
          icon: 'person-outline',
          label: 'Edit Profile',
          color: '#8b5cf6',
          onPress: () =>
            navigation.navigate('EditProfile', { userInfo, userId }),
        },
        {
          icon: 'lock-closed-outline',
          label: 'Change Password',
          color: '#f59e0b',
          onPress: () => navigation.navigate('ChangePassword', { userId }),
        },
        {
          icon: 'shield-checkmark-outline',
          label: 'Privacy',
          color: '#10b981',
          onPress: () => Alert.alert('Coming Soon', 'Privacy settings'),
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'notifications-outline',
          label: 'Notifications',
          color: '#3b82f6',
          toggle: true,
          value: notifications,
          onToggle: setNotifications,
        },
        {
          icon: 'moon-outline',
          label: 'Dark Mode',
          color: '#6366f1',
          toggle: true,
          value: darkMode,
          onToggle: setDarkMode,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle-outline',
          label: 'Help & Support',
          color: '#ec4899',
          onPress: () => Alert.alert('Support', 'Contact support@campus.edu'),
        },
        {
          icon: 'document-text-outline',
          label: 'Terms & Conditions',
          color: '#8b5cf6',
          onPress: () => Alert.alert('Coming Soon', 'T&C page'),
        },
        {
          icon: 'information-circle-outline',
          label: 'About',
          color: '#10b981',
          onPress: () =>
            Alert.alert(
              'Campus Connect',
              'Version 1.0.0\n\nYour all-in-one college companion app.'
            ),
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userInfo?.full_name?.charAt(0) || 'U'}
            </Text>
          </View>
          <Text style={styles.profileName}>{userInfo?.full_name}</Text>
          <Text style={styles.profileId}>@{userInfo?.college_id}</Text>
          <View style={styles.profileDetails}>
            <Text style={styles.profileDetail}>
              {userInfo?.department} • Year {userInfo?.year}
            </Text>
          </View>
        </View>

        {/* Settings Sections */}
        {settingSections.map((section, sectionIdx) => (
          <View key={sectionIdx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIdx) => (
                <TouchableOpacity
                  key={itemIdx}
                  style={[
                    styles.settingItem,
                    itemIdx === section.items.length - 1 &&
                      styles.settingItemLast,
                  ]}
                  onPress={item.onPress}
                  disabled={item.toggle}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingLeft}>
                    <View
                      style={[
                        styles.settingIcon,
                        { backgroundColor: `${item.color}20` },
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color={item.color}
                      />
                    </View>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                  </View>
                  {item.toggle ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: '#2a2a2a', true: '#8b5cf6' }}
                      thumbColor={item.value ? '#fff' : '#666'}
                    />
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#666"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  profileCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#1a1a1a',
    margin: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  profileDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileDetail: {
    fontSize: 12,
    color: '#888',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: '#ef444420',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
  bottomSpace: {
    height: 40,
  },
});

export default SettingsScreen;