import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import NeighborhoodsScreen from './src/screens/NeighborhoodsScreen';
import SquaresScreen from './src/screens/SquaresScreen';
import HousesScreen from './src/screens/HousesScreen';
import HouseDetailsScreen from './src/screens/HouseDetailsScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // You can add a loading screen here
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Neighborhoods" component={NeighborhoodsScreen} />
            <Stack.Screen name="Squares" component={SquaresScreen} />
            <Stack.Screen name="Houses" component={HousesScreen} />
            <Stack.Screen name="HouseDetails" component={HouseDetailsScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </AuthProvider>
  );
}
