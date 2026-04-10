// App Navigator — Premium Navigation with Material Icons
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, NavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../config/theme';
import { RootStackParamList, TabParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import DetailScreen from '../screens/DetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SignalsScreen from '../screens/SignalsScreen';
import LiveTradingScreen from '../screens/LiveTradingScreen';
import TradeDetailScreen from '../screens/TradeDetailScreen';
import SimulationScreen from '../screens/SimulationScreen';
import NewsScreen from '../screens/NewsScreen';
import AnalysisScreen from '../screens/AnalysisScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import SignalHistoryScreen from '../screens/SignalHistoryScreen';
import DatabaseService from '../services/databaseService';
import AnalyticsService from '../services/analyticsService';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_CONFIG: Record<string, { icon: string; iconFocused: string; labelKey: string }> = {
  HomeTab: { icon: 'home-outline', iconFocused: 'home', labelKey: 'home' },
  SignalsTab: { icon: 'brain', iconFocused: 'brain', labelKey: 'signals' },
  NewsTab: { icon: 'newspaper-variant-outline', iconFocused: 'newspaper-variant', labelKey: 'news' },
  PortfolioTab: { icon: 'chart-line', iconFocused: 'chart-line', labelKey: 'trades' },
  SettingsTab: { icon: 'cog-outline', iconFocused: 'cog', labelKey: 'settings' },
};

const BottomTabs: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: Platform.OS === 'ios' ? 85 : 62,
          paddingBottom: Platform.OS === 'ios' ? 24 : 6,
          paddingTop: 6,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabel: ({ focused, color }) => {
          const config = TAB_CONFIG[route.name];
          return (
            <Text style={{
              fontSize: 10,
              fontWeight: focused ? '800' : '600',
              color,
              letterSpacing: focused ? 0.5 : 0,
              marginTop: 1,
            }}>
              {t(config?.labelKey || '')}
            </Text>
          );
        },
        tabBarIcon: ({ focused, color }) => {
          const config = TAB_CONFIG[route.name];
          const iconName = focused ? config?.iconFocused : config?.icon;
          return (
            <View style={styles.tabIconContainer}>
              <Icon name={iconName || 'circle'} size={focused ? 24 : 22} color={color} />
              {focused && <View style={[styles.activeDot, { backgroundColor: COLORS.primary }]} />}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="SignalsTab" component={SignalsScreen} />
      <Tab.Screen name="NewsTab" component={NewsScreen} />
      <Tab.Screen name="PortfolioTab" component={LiveTradingScreen} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const SplashScreen: React.FC = () => (
  <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
    <Icon name="chart-line-variant" size={48} color={COLORS.primary} />
    <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 24 }} />
  </View>
);

const AppNavigator: React.FC = () => {
  const { i18n } = useTranslation();
  const { isLoading, isAuthenticated } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const init = async () => {
      const saved = await DatabaseService.getLanguage();
      i18n.changeLanguage(saved);
      const onboardingDone = await AsyncStorage.getItem('@onboarding_complete');
      setShowOnboarding(!onboardingDone);
    };
    init();
  }, [i18n]);

  const onStateChange = (state: NavigationState | undefined) => {
    if (!state) return;
    const route = state.routes[state.index];
    const screenName = route.state
      ? route.state.routes[route.state.index]?.name || route.name
      : route.name;
    AnalyticsService.logScreenView(screenName);
  };

  return (
    <NavigationContainer
      onStateChange={onStateChange}
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
        {isLoading || showOnboarding === null ? (
          <Stack.Screen name="Splash" component={SplashScreen} options={{ animationTypeForReplace: 'pop' }} />
        ) : showOnboarding ? (
          <Stack.Screen name="Onboarding" options={{ animationTypeForReplace: 'pop' }}>
            {() => <OnboardingScreen onComplete={() => setShowOnboarding(false)} />}
          </Stack.Screen>
        ) : !isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ animationTypeForReplace: 'pop' }} />
        ) : (
          <>
            <Stack.Screen name="HomeTabs" component={BottomTabs} />
            <Stack.Screen name="Detail" component={DetailScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Analysis" component={AnalysisScreen} options={{ animation: 'fade_from_bottom' }} />
            <Stack.Screen name="TradeDetail" component={TradeDetailScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Simulation" component={SimulationScreen} options={{ animation: 'fade_from_bottom' }} />
            <Stack.Screen name="SignalHistory" component={SignalHistoryScreen} options={{ animation: 'slide_from_bottom' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabIconContainer: {
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
