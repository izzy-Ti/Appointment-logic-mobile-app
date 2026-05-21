import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SecretaryDashboard from '../screens/SecretaryDashboard';
import RequestAppointmentScreen from '../screens/RequestAppointmentScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Colors } from '../theme/colors';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator 
                initialRouteName="Login"
                screenOptions={{
                    headerStyle: { backgroundColor: Colors.background },
                    headerTintColor: Colors.text,
                    headerTitleStyle: { fontWeight: 'bold' },
                    headerShadowVisible: false,
                    headerBackTitleVisible: false, // Ensure neat back buttons
                }}
            >
                <Stack.Screen 
                    name="Login" 
                    component={LoginScreen} 
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Register"
                    component={RegisterScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen 
                    name="Dashboard" 
                    component={DashboardScreen} 
                    options={{ title: 'Dashboard', headerShown: false }}
                />
                <Stack.Screen 
                    name="SecretaryDashboard" 
                    component={SecretaryDashboard} 
                    options={{ title: 'Secretary' }}
                />
                <Stack.Screen
                    name="RequestAppointment"
                    component={RequestAppointmentScreen}
                    options={{ title: 'New request' }}
                />
                <Stack.Screen
                    name="Profile"
                    component={ProfileScreen}
                    options={{ title: 'My Profile' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
