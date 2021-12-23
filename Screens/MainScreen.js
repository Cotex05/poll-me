import React, { useLayoutEffect } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import ProfileScreen from './ProfileScreen';
import HomeScreen from './HomeScreen';
import ExploreScreen from './ExploreScreen';

const Tab = createBottomTabNavigator();

const MainScreen = ({ navigation, route }) => {

    const handleSettingPress = () => {
        navigation.navigate("Settings");
    }

    const handlePostPress = () => {
        navigation.navigate("Post");
    }

    const handleSearchPress = () => {
        navigation.navigate("Search");
    }

    useLayoutEffect(() => {
        navigation.setOptions({
            title: "Poll Me",
            headerStyle: { backgroundColor: '#007fff' },
            headerTitleStyle: { fontWeight: 'bold', letterSpacing: 1, fontFamily: 'serif', color: '#eef' },
            headerLeft: () => (
                <View style={{ marginLeft: 10, justifyContent: 'center' }}>
                    <TouchableOpacity onPress={handlePostPress}>
                        <Icon name="library-add" type="material-icon" size={30} color="#fff" />
                    </TouchableOpacity>
                </View>
            ),
            headerRight: () => (
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginHorizontal: 10
                }}>
                    <TouchableOpacity onPress={handleSearchPress} style={{ marginHorizontal: 5 }}>
                        <Icon name="search" type="material-icon" size={30} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSettingPress} style={{ marginHorizontal: 5 }}>
                        <Icon name="settings" type="material-icon" size={30} color="#fff" />
                    </TouchableOpacity>
                </View>
            )
        })
    }, [navigation]);

    return (
        <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen
                options={({ route }) => ({
                    tabBarIcon: ({ focused }) => {
                        let color;
                        if (route.name == "Home") {
                            color = focused ? '#007fff' : '#fff';
                        }
                        return <Icon name="home" type="font-awesome-5" size={20} color={color} />;
                    },
                    tabBarActiveBackgroundColor: '#001',
                    tabBarInactiveBackgroundColor: '#001',
                })}
                name="Home"
                component={HomeScreen}
            />
            <Tab.Screen
                options={({ route }) => ({
                    tabBarIcon: ({ focused }) => {
                        let color;
                        if (route.name == "Explore") {
                            color = focused ? '#007fff' : '#fff';
                        }
                        return <Icon name="explore" size={20} color={color} />;
                    },
                    tabBarActiveBackgroundColor: '#001',
                    tabBarInactiveBackgroundColor: '#001',
                })}
                name="Explore"
                component={ExploreScreen}
            />
            <Tab.Screen
                options={({ route }) => ({
                    tabBarIcon: ({ focused }) => {
                        let color;
                        if (route.name == "Profile") {
                            color = focused ? '#007fff' : '#fff';
                        }
                        return <Icon name="user-circle" type="font-awesome-5" size={20} color={color} />;
                    },
                    tabBarActiveBackgroundColor: '#001',
                    tabBarInactiveBackgroundColor: '#001',
                })}
                name="Profile"
                component={ProfileScreen}
            />
        </Tab.Navigator>
    );
}

export default MainScreen;

const styles = StyleSheet.create({
    container: {
        height: "100%",
    }
})
