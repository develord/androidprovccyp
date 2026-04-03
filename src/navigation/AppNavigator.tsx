// App Navigator - Navigation configuration with bottom tabs
import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { COLORS, FONT_SIZES } from '../config/theme';
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

// Bottom Tab Navigator
const BottomTabs: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: {
          fontSize: FONT_SIZES.sm,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: t('home'),
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 26, color, fontWeight: 'bold' }}>◉</Text>
          ),
        }}
      />
      <Tab.Screen
        name="SignalsTab"
        component={SignalsScreen}
        options={{
          tabBarLabel: 'Signals',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 26, color, fontWeight: 'bold' }}>📡</Text>
          ),
        }}
      />
      <Tab.Screen
        name="PortfolioTab"
        component={LiveTradingScreen}
        options={{
          tabBarLabel: 'Trades',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 26, color, fontWeight: 'bold' }}>📊</Text>
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: t('settings'),
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 26, color, fontWeight: 'bold' }}>⚙</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator: React.FC = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Load saved language on app start
    const loadLanguage = async () => {
      const savedLanguage = await DatabaseService.getLanguage();
      i18n.changeLanguage(savedLanguage);
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
          contentStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      >
        <Stack.Screen
          name="HomeTabs"
          component={BottomTabs}
          options={{
            title: 'Crypto Adviser',
          }}
        />
        <Stack.Screen
          name="Detail"
          component={DetailScreen}
          options={{
            title: 'Crypto Details',
          }}
        />
        <Stack.Screen
          name="TradeDetail"
          component={TradeDetailScreen}
          options={{
            title: 'Trade Details',
          }}
        />
        <Stack.Screen
          name="Simulation"
          component={SimulationScreen}
          options={{
            title: 'Simulation IA',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
