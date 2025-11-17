import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth & Core
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen.js';
import HomeScreen from './src/screens/HomeScreen';
import MessMenuScreen from './src/screens/MessMenuScreen.js';
import AcademicsScreen from './src/screens/AcademicsScreen';
import SportsScreen from './src/screens/SportsScreen';
import CampusScreen from './src/screens/CampusScreen';
import BusScheduleScreen from './src/screens/BusScheduleScreen';

// Social & Chat
import ChatListScreen from './src/screens/chat/ChatListScreen';
import ChatScreen from './src/screens/chat/ChatScreen';
import GroupInfoScreen from './src/screens/chat/GroupInfoScreen';
import FeedScreen from './src/screens/social/FeedScreen';
import ProfileScreen from './src/screens/social/ProfileScreen';
import CreatePostScreen from './src/screens/social/CreatePostScreen';
import DiscussionsScreen from './src/screens/discussions/DiscussionsScreen';
import DiscussionDetailScreen from './src/screens/discussions/DiscussionDetailScreen';
import NotificationsScreen from './src/screens/notifications/NotificationsScreen';
import FollowersScreen from './src/screens/social/FollowersScreen';
import FollowingScreen from './src/screens/social/FollowingScreen';
import SettingsScreen from './src/screens/social/SettingsScreen.js';
import EditProfileScreen from './src/screens/social/EditProfileScreen.js';
import UserSearchScreen from './src/screens/social/UserSearchScreen';

// Marketplace
import MarketplaceChatListScreen from './src/screens/market/MarketplaceChatListScreen';
import SavedItemsScreen from './src/screens/market/SavedItemsScreen'; 
import MarketplaceScreen from './src/screens/market/MarketplaceScreen';
import MarketplaceChatScreen from './src/screens/market/MarketplaceChatScreen';
import ItemDetailScreen from './src/screens/market/ItemDetailScreen';
import CreateListingScreen from './src/screens/market/CreateListingScreen';
import MyListingsScreen from './src/screens/market/MyListingsScreen.js';
import EditListingScreen from './src/screens/market/EditListingScreen';

// Admin
import AdminLoginScreen from './src/screens/admin/AdminLoginScreen';
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';
import AdminManagementScreen from './src/screens/admin/AdminManagementScreen';
import ManageClubsScreen from './src/screens/admin/ManageClubsScreen';
import CreateClubScreen from './src/screens/admin/CreateClubScreen';
import CourseManagementScreen from './src/screens/admin/CourseManagementScreen.js';
import UpdateClubHeadScreen from './src/screens/admin/UpdateClubHeadScreen.js';
import AdminClubDetailScreen from './src/screens/admin/AdminClubDetailScreen.js';
import EditClubScreen from './src/screens/admin/EditClubScreen.js';
import AdminAIQuestionsScreen from './src/screens/admin/AdminAIQuestionsScreen';


// Clubs - NEW FIXED IMPORTS
import ClubsHomeScreen from './src/screens/clubs/ClubsHomeScreen.js';
import CategoryClubsScreen from './src/screens/clubs/CategoryClubsScreen.js';
import ClubDetailScreen from './src/screens/clubs/ClubDetailScreen.js';
import AllClubsScreen from './src/screens/clubs/AllClubsScreen.js';
import MyClubsScreen from './src/screens/clubs/MyClubsScreen.js';
import ClubHeadDashboardScreen from './src/screens/clubs/ClubHeadDashboardScreen.js';
import CreateEventScreen from './src/screens/clubs/CreateEventScreen.js'; 
import EventDetailScreen from './src/screens/clubs/EventDetailScreen.js';
import CreateAnnouncementScreen from './src/screens/clubs/CreateAnnouncementScreen.js';

// Courses
import CoursesScreen from './src/screens/courses/CoursesScreen.js';
import StudyBuddyScreen from './src/screens/courses/StudyBuddyScreen.js'; 
import StudyGroupsScreen from './src/screens/courses/StudyGroupsScreen.js';
import CourseGroupScreen from './src/screens/courses/CourseGroupScreen.js';
import StudyPreferencesScreen from './src/screens/courses/StudyPreferencesScreen.js';

// Wellness
import WellnessHomeScreen from './src/screens/wellness/WellnessHomeScreen.js';
import WellnessCheckInScreen from './src/screens/wellness/WellnessCheckInScreen.js';
import RiskAssessmentScreen from './src/screens/wellness/RiskAssessmentScreen.js';
import CounselorFormScreen from './src/screens/wellness/CounselorFormScreen.js';
import MeditationScreen from './src/screens/wellness/MeditationScreen.js';
import WellnessHistoryScreen from './src/screens/wellness/WellnessHistoryScreen';

// Maps
import CampusMap from './src/screens/maps/CampusMaps.js';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {/* ==================== AUTH ==================== */}
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

        {/* ==================== MAIN APP ==================== */}
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MessMenuScreen" 
          component={MessMenuScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Academics" 
          component={AcademicsScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Sports" 
          component={SportsScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Campus" 
          component={CampusScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="BusSchedule" 
          component={BusScheduleScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CampusMap" 
          component={CampusMap} 
          options={{ headerShown: false }}
        />

        {/* ==================== CLUBS (NEW) ==================== */}
        <Stack.Screen 
          name="ClubsHome" 
          component={ClubsHomeScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="CategoryClubs" 
          component={CategoryClubsScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ClubDetail" 
          component={ClubDetailScreen}  
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="AllClubs" 
          component={AllClubsScreen}  
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MyClubs" 
          component={MyClubsScreen}  
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="EventDetail" 
          component={EventDetailScreen}
          options={{ headerShown: false }}
        />
        
        {/* Club Head Screens */}
        <Stack.Screen 
          name="ClubHeadDashboard" 
          component={ClubHeadDashboardScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CreateEvent" 
          component={CreateEventScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CreateAnnouncement" 
          component={CreateAnnouncementScreen}
          options={{ headerShown: false }}
        />

        {/* ==================== SOCIAL & CHAT ==================== */}
        <Stack.Screen 
          name="ChatList" 
          component={ChatListScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="GroupInfo" 
          component={GroupInfoScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Feed" 
          component={FeedScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="CreatePost" 
          component={CreatePostScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Followers" 
          component={FollowersScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Following" 
          component={FollowingScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="UserSearch" 
          component={UserSearchScreen}
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="EditProfile" 
          component={EditProfileScreen} 
          options={{ headerShown: false }}
        />

        {/* ==================== DISCUSSIONS ==================== */}
        <Stack.Screen 
          name="Discussions" 
          component={DiscussionsScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="DiscussionDetail" 
          component={DiscussionDetailScreen} 
          options={{ headerShown: false }} 
        />

        {/* ==================== NOTIFICATIONS ==================== */}
        <Stack.Screen 
          name="Notifications" 
          component={NotificationsScreen} 
          options={{ headerShown: false }} 
        />

        {/* ==================== MARKETPLACE ==================== */}
        <Stack.Screen 
          name="Marketplace" 
          component={MarketplaceScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="ItemDetail" 
          component={ItemDetailScreen}
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="CreateListing" 
          component={CreateListingScreen}
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="MyListings" 
          component={MyListingsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="EditListing" 
          component={EditListingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MarketplaceChat" 
          component={MarketplaceChatScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MarketplaceChatList" 
          component={MarketplaceChatListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="SavedItems" 
          component={SavedItemsScreen}
          options={{ headerShown: false }}
        />

        {/* ==================== COURSES ==================== */}
        <Stack.Screen 
          name="Courses"
          component={CoursesScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="StudyBuddy"
          component={StudyBuddyScreen}
          options={{ headerShown: 'study buddies' }}
        />
        <Stack.Screen 
          name="StudyGroups"
          component={StudyGroupsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CourseGroup" 
          component={CourseGroupScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="studyPreferences" 
          component={StudyPreferencesScreen}
          options={{ headerShown: 'preferences' }}
        />

        {/* ==================== WELLNESS ==================== */}
        <Stack.Screen 
          name="WellnessHome" 
          component={WellnessHomeScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="WellnessCheckIn" 
          component={WellnessCheckInScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RiskAssessment" 
          component={RiskAssessmentScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CounselorForm" 
          component={CounselorFormScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Meditation" 
          component={MeditationScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="WellnessHistory" 
          component={WellnessHistoryScreen}
          options={{ headerShown: false }}
        />

        {/* ==================== ADMIN ==================== */}
        <Stack.Screen 
          name="AdminLogin" 
          component={AdminLoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="AdminDashboard" 
          component={AdminDashboardScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="AdminManagement" 
          component={AdminManagementScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ManageClubs" 
          component={ManageClubsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CreateClub" 
          component={CreateClubScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="EditClub" 
          component={EditClubScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="UpdateClubHead" 
          component={UpdateClubHeadScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="AdminUpdateClubHead" 
          component={AdminClubDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CourseManagement"
          component={CourseManagementScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
  name="AdminAIQuestions" 
  component={AdminAIQuestionsScreen}
  options={{ title: 'AI Questions' }}
/>

      </Stack.Navigator>
    </NavigationContainer>
  );
}