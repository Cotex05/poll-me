import React from 'react';
import { StyleSheet, LogBox } from 'react-native';

import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import LoginScreen from './Screens/LoginScreen';
import RegisterScreen from './Screens/RegisterScreen';
import MainScreen from './Screens/MainScreen';
import SettingScreen from './Screens/SettingScreen';
import PostScreen from './Screens/PostScreen';
import UserProfileScreen from './Screens/UserProfileScreen';
import SearchScreen from './Screens/SearchScreen';

const Stack = createStackNavigator();

const globalScreenOptions = {
  headerStyle: { backgroundColor: '#007fff', },
  headerTitleStyle: { color: 'white' },
  headerTintColor: "white",
}

LogBox.ignoreLogs(['Setting a timer']);

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={globalScreenOptions}>
        <Stack.Screen name='Login' component={LoginScreen} />
        <Stack.Screen name='Register' component={RegisterScreen} />
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="Settings" component={SettingScreen} />
        <Stack.Screen options={{ title: "Post" }} name="Post" component={PostScreen} />
        <Stack.Screen name="UserProfile" component={UserProfileScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#012',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
