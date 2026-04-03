// SettingsScreen — System Status + Preferences
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { RootStackParamList } from '../types';
import APIService from '../services/apiService';
import DatabaseService from '../services/databaseService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'HomeTabs'>;

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
];

const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [selectedLang, setSelectedLang] = useState(i18n.language);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [modelsLoaded, setModelsLoaded] = useState(0);

  useEffect(() => {
    loadLang();
    checkApi();
  }, []);

  const loadLang = async () => {
    const saved = await DatabaseService.getLanguage();
    setSelectedLang(saved);
    i18n.changeLanguage(saved);
  };

  const changeLang = async (code: string) => {
    setSelectedLang(code);
    await DatabaseService.setLanguage(code);
    i18n.changeLanguage(code);
  };

  const checkApi = async () => {
    try {
      const health = await APIService.healthCheck();
      setApiStatus('online');
      setModelsLoaded(health.models_loaded || 0);
    } catch {
      setApiStatus('offline');
    }
  };

  const StatusDot = ({ status }: { status: string }) => (
    <View style={[s.statusDot, {
      backgroundColor: status === 'online' ? COLORS.success : status === 'offline' ? COLORS.danger : COLORS.warning
    }]} />
  );

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Settings</Text>
          <Text style={s.subtitle}>System & Preferences</Text>
        </View>

        {/* ═══ SYSTEM STATUS ═══ */}
        <View style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionIcon}>⚡</Text>
            <Text style={s.sectionTitle}>System Status</Text>
          </View>

          {/* API */}
          <View style={s.statusRow}>
            <View style={s.statusLeft}>
              <StatusDot status={apiStatus} />
              <Text style={s.statusLabel}>Prediction API</Text>
            </View>
            <Text style={[s.statusValue, {
              color: apiStatus === 'online' ? COLORS.success : apiStatus === 'offline' ? COLORS.danger : COLORS.warning
            }]}>
              {apiStatus === 'checking' ? 'Checking...' : apiStatus.toUpperCase()}
            </Text>
          </View>

          {/* Models */}
          <View style={s.statusRow}>
            <View style={s.statusLeft}>
              <Text style={s.statusIcon}>🧠</Text>
              <Text style={s.statusLabel}>CNN Models</Text>
            </View>
            <Text style={[s.statusValue, { color: modelsLoaded > 0 ? COLORS.primary : COLORS.textSecondary }]}>
              {modelsLoaded > 0 ? `${modelsLoaded} loaded` : '—'}
            </Text>
          </View>

          {/* Bot */}
          <View style={s.statusRow}>
            <View style={s.statusLeft}>
              <Text style={s.statusIcon}>🤖</Text>
              <Text style={s.statusLabel}>Trading Bot</Text>
            </View>
            <Text style={[s.statusValue, { color: COLORS.success }]}>24/7 Active</Text>
          </View>

          {/* Exchange */}
          <View style={[s.statusRow, { borderBottomWidth: 0 }]}>
            <View style={s.statusLeft}>
              <Text style={s.statusIcon}>💱</Text>
              <Text style={s.statusLabel}>Binance Demo</Text>
            </View>
            <Text style={[s.statusValue, { color: COLORS.primary }]}>Connected</Text>
          </View>
        </View>

        {/* ═══ MODEL INFO ═══ */}
        <View style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionIcon}>🔬</Text>
            <Text style={s.sectionTitle}>Model Information</Text>
          </View>

          <View style={s.infoGrid}>
            <View style={s.infoBox}>
              <Text style={s.infoLabel}>Architecture</Text>
              <Text style={s.infoValue}>CNN 1D-MultiScale</Text>
            </View>
            <View style={s.infoBox}>
              <Text style={s.infoLabel}>Directions</Text>
              <Text style={s.infoValue}>LONG + SHORT</Text>
            </View>
            <View style={s.infoBox}>
              <Text style={s.infoLabel}>Timeframes</Text>
              <Text style={s.infoValue}>4h / 1d / 1w</Text>
            </View>
            <View style={s.infoBox}>
              <Text style={s.infoLabel}>Coins</Text>
              <Text style={s.infoValue}>BTC ETH SOL DOGE AVAX</Text>
            </View>
          </View>

          <View style={s.featureRow}>
            <View style={[s.featureBadge, { borderColor: `${COLORS.success}30` }]}>
              <Text style={[s.featureText, { color: COLORS.success }]}>Trailing Stop</Text>
            </View>
            <View style={[s.featureBadge, { borderColor: `${COLORS.primary}30` }]}>
              <Text style={[s.featureText, { color: COLORS.primary }]}>Dynamic TP/SL</Text>
            </View>
            <View style={[s.featureBadge, { borderColor: `${COLORS.warning}30` }]}>
              <Text style={[s.featureText, { color: COLORS.warning }]}>Smart Filters</Text>
            </View>
          </View>
        </View>

        {/* ═══ LANGUAGE ═══ */}
        <View style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionIcon}>🌍</Text>
            <Text style={s.sectionTitle}>{t('language')}</Text>
          </View>

          {LANGUAGES.map(lang => {
            const active = selectedLang === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[s.langItem, active && s.langItemActive]}
                onPress={() => changeLang(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={s.langFlag}>{lang.flag}</Text>
                <View style={s.langInfo}>
                  <Text style={[s.langNative, active && { color: COLORS.primary }]}>{lang.native}</Text>
                  <Text style={s.langName}>{lang.name}</Text>
                </View>
                {active && (
                  <View style={s.checkCircle}>
                    <Text style={s.checkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ═══ ABOUT ═══ */}
        <View style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionIcon}>ℹ️</Text>
            <Text style={s.sectionTitle}>About</Text>
          </View>

          <View style={s.aboutRow}>
            <Text style={s.aboutLabel}>Version</Text>
            <Text style={s.aboutValue}>2.0 Alpha</Text>
          </View>
          <View style={s.aboutRow}>
            <Text style={s.aboutLabel}>Engine</Text>
            <Text style={s.aboutValue}>PyTorch CNN</Text>
          </View>
          <View style={[s.aboutRow, { borderBottomWidth: 0 }]}>
            <Text style={s.aboutLabel}>Data</Text>
            <Text style={s.aboutValue}>Binance Live API</Text>
          </View>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Powered by Amine</Text>
          <Text style={s.footerSub}>CNN 1D-MultiScale · Binance · Multi-TF</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 100 },

  header: { paddingTop: 40, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500', marginTop: 3, letterSpacing: 0.5 },

  sectionCard: { backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 18, marginBottom: 14, ...SHADOWS.small },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, letterSpacing: 0.3 },

  // Status
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusIcon: { fontSize: 14 },
  statusLabel: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  statusValue: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  // Model info
  infoGrid: { gap: 8, marginBottom: 12 },
  infoBox: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  infoValue: { fontSize: 12, color: COLORS.text, fontWeight: '700' },
  featureRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  featureBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.02)' },
  featureText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

  // Language
  langItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12 },
  langItemActive: { backgroundColor: `${COLORS.primary}08`, marginHorizontal: -18, paddingHorizontal: 18, borderRadius: 0 },
  langFlag: { fontSize: 22 },
  langInfo: { flex: 1 },
  langNative: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  langName: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  checkText: { color: COLORS.background, fontSize: 13, fontWeight: '800' },

  // About
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  aboutLabel: { fontSize: 13, color: COLORS.textSecondary },
  aboutValue: { fontSize: 13, color: COLORS.text, fontWeight: '700' },

  footer: { alignItems: 'center', paddingVertical: 24 },
  footerText: { fontSize: 12, color: COLORS.textDark, fontWeight: '600' },
  footerSub: { fontSize: 10, color: COLORS.textDark, marginTop: 3 },
});

export default SettingsScreen;
