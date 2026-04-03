// App Navigator — Premium Navigation with custom tab bar
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../config/theme';
import { RootStackParamList, TabParamList } from '../types';
import HomeScreen from '../screens/HomeScreen';
import DetailScreen from '../screens/DetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SignalsScreen from '../screens/SignalsScreen';
import LiveTradingScreen from '../screens/LiveTradingScreen';
import TradeDetailScreen from '../screens/TradeDetailScreen';
import SimulationScreen from '../screens/SimulationScreen';
import DatabaseService from '../services/databaseService';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<string, { icon: string; label: string }> = {
  HomeTab: { icon: '◉', label: 'Home' },
  SignalsTab: { icon: '📡', label: 'Signals' },
  PortfolioTab: { icon: '📊', label: 'Trades' },
  SettingsTab: { icon: '⚙', label: 'Settings' },
};

const BottomTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(26, 31, 58, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(42, 48, 80, 0.6)',
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabel: ({ focused, color }) => {
          const { label } = TAB_ICONS[route.name] || { label: '' };
          return (
            <Text style={{
              fontSize: 10,
              fontWeight: focused ? '800' : '600',
              color,
              letterSpacing: focused ? 0.5 : 0,
              marginTop: -2,
            }}>
              {label}
            </Text>
          );
        },
        tabBarIcon: ({ focused, color }) => {
          const { icon } = TAB_ICONS[route.name] || { icon: '●' };
          return (
            <View style={focused ? styles.activeIconWrap : undefined}>
              <Text style={{
                fontSize: focused ? 24 : 22,
                color,
                textAlign: 'center',
              }}>
                {icon}
              </Text>
              {focused && <View style={[styles.activeDot, { backgroundColor: COLORS.primary }]} />}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="SignalsTab" component={SignalsScreen} />
      <Tab.Screen name="PortfolioTab" component={LiveTradingScreen} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const loadLanguage = async () => {
      const saved = await DatabaseService.getLanguage();
      i18n.changeLanguage(saved);
    };
    loadLanguage();
  }, [i18n]);

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: COLORS.primary,
          background: COLORS.background,
          card: COLORS.card,
          text: COLORS.text,
          border: COLORS.border,
          notification: COLORS.primary,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen name="HomeTabs" component={BottomTabs} />
        <Stack.Screen name="Detail" component={DetailScreen} />
        <Stack.Screen name="TradeDetail" component={TradeDetailScreen} />
        <Stack.Screen name="Simulation" component={SimulationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  activeIconWrap: {
    alignItems: 'center',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});

export default AppNavigator;
