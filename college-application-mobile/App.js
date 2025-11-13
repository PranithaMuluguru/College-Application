import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import all your screens with correct paths
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen.js';
import HomeScreen from './src/screens/HomeScreen';
import MessMenuScreen from './src/screens/MessMenuScreen.js';
import AcademicsScreen from './src/screens/AcademicsScreen';
import SportsScreen from './src/screens/SportsScreen';
import CampusScreen from './src/screens/CampusScreen';
import ClubsScreen from './src/screens/ClubsScreen';
import ClubDetailScreen from './src/screens/ClubDetailScreen';
import ClubAnnouncementsScreen from './src/screens/ClubAnnouncementsScreen';
import BusScheduleScreen from './src/screens/BusScheduleScreen'; // Fixed import


//////////////////////////new imports below//////////////////////////
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
//////////////////////////new imports above//////////////////////////

/////////market screen imports/////////
import MarketplaceChatListScreen from './src/screens/market/MarketplaceChatListScreen';
import SavedItemsScreen from './src/screens/market/SavedItemsScreen'; 
import MarketplaceScreen from './src/screens/market/MarketplaceScreen';
import MarketplaceChatScreen from './src/screens/market/MarketplaceChatScreen';
import ItemDetailScreen from './src/screens/market/ItemDetailScreen';
import CreateListingScreen from './src/screens/market/CreateListingScreen';
import MyListingsScreen from './src/screens/market/MyListingsScreen.js';
import EditListingScreen from './src/screens/market/EditListingScreen';

/////////market screen imports end/////////
import UserSearchScreen from './src/screens/social/UserSearchScreen';

//////// admin screens ////////
import AdminLoginScreen from './src/screens/admin/AdminLoginScreen';
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';
import AdminManagementScreen from './src/screens/admin/AdminManagementScreen';
//////// admin screens end //////// 


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
          options={{ headerShown: false }}
        />
        <Stack.Screen name="MessMenuScreen" component={MessMenuScreen} />
        <Stack.Screen name="Academics" component={AcademicsScreen} />
        <Stack.Screen name="Sports" component={SportsScreen} />
        <Stack.Screen name="Campus" component={CampusScreen} />
        <Stack.Screen name="Clubs" component={ClubsScreen} />
        <Stack.Screen name="ClubDetail" component={ClubDetailScreen} />
        <Stack.Screen name="ClubAnnouncements" component={ClubAnnouncementsScreen} />
        <Stack.Screen name="ChatList" component={ChatListScreen} options={{ headerShown: false }} />
<Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
<Stack.Screen name="Feed" component={FeedScreen} options={{ headerShown: false }} />
<Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
<Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ headerShown: false }} />
<Stack.Screen name="Discussions" component={DiscussionsScreen} options={{ headerShown: false }} />
<Stack.Screen name="DiscussionDetail" component={DiscussionDetailScreen} options={{ headerShown: false }} />
<Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
<Stack.Screen name="Followers" component={FollowersScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Following" component={FollowingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="UserSearch" component={UserSearchScreen}options={{ headerShown: false }} />

	<Stack.Screen name="GroupInfo" component={GroupInfoScreen} options={{ headerShown: false }} />
        {/* Added BusScheduleScreen */}
        <Stack.Screen 
          name="BusSchedule" 
          component={BusScheduleScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Marketplace" component={MarketplaceScreen} options={{ headerShown: false }} />
<Stack.Screen name="ItemDetail" component={ItemDetailScreen}options={{ headerShown: false }} />
<Stack.Screen name="CreateListing" component={CreateListingScreen}options={{ headerShown: false }} />
<Stack.Screen 
  name="MyListings" 
  component={MyListingsScreen}
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
<Stack.Screen 
  name="EditListing" 
  component={EditListingScreen}
  options={{ headerShown: false }}
/>

<Stack.Screen 
  name="AdminLogin" 
  component={AdminLoginScreen}
  options={{ headerShown: false }}  // Add this
/>
<Stack.Screen 
  name="AdminDashboard" 
  component={AdminDashboardScreen}
  options={{ headerShown: false }}  // Add this
/>
<Stack.Screen 
  name="AdminManagement" 
  component={AdminManagementScreen}
  options={{ headerShown: false }}  // Add this
/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}