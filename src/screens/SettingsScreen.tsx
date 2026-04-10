// SettingsScreen — System Status + Preferences + Profile
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView, Alert, Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SHADOWS } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import APIService from '../services/apiService';
import DatabaseService from '../services/databaseService';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
];

const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
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

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>{t('settings')}</Text>
          <Text style={s.subtitle}>{t('settingsSubtitle')}</Text>
        </View>

        {/* USER PROFILE */}
        {user && (
          <View style={s.sectionCard}>
            <View style={s.sectionHeader}>
              <Icon name="account-circle" size={20} color={COLORS.primary} />
              <Text style={s.sectionTitle}>{t('profile')}</Text>
            </View>

            <View style={s.profileRow}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={s.profileAvatar} />
              ) : (
                <View style={s.profileAvatarPlaceholder}>
                  <Icon name="account" size={28} color={COLORS.textSecondary} />
                </View>
              )}
              <View style={s.profileInfo}>
                <Text style={s.profileName}>{user.name || 'User'}</Text>
                {user.email && <Text style={s.profileEmail}>{user.email}</Text>}
                <View style={s.providerBadge}>
                  <Icon
                    name={user.auth_provider === 'google' ? 'google' : 'currency-btc'}
                    size={12}
                    color={user.auth_provider === 'google' ? '#4285F4' : '#F0B90B'}
                  />
                  <Text style={s.providerText}>
                    {user.auth_provider === 'google' ? 'Google' : 'Binance'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* SYSTEM STATUS */}
        <View style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <Icon name="lightning-bolt" size={20} color={COLORS.primary} />
            <Text style={s.sectionTitle}>{t('systemStatus')}</Text>
          </View>

          {/* API */}
          <View style={s.statusRow}>
            <View style={s.statusLeft}>
              <View style={[s.statusDot, {
                backgroundColor: apiStatus === 'online' ? COLORS.success : apiStatus === 'offline' ? COLORS.danger : COLORS.warning
              }]} />
              <Text style={s.statusLabel}>{t('predictionAPI')}</Text>
            </View>
            <Text style={[s.statusValue, {
              color: apiStatus === 'online' ? COLORS.success : apiStatus === 'offline' ? COLORS.danger : COLORS.warning
            }]}>
              {apiStatus === 'checking' ? t('checking') : apiStatus === 'online' ? t('online') : t('offline')}
            </Text>
          </View>

          {/* Models */}
          <View style={s.statusRow}>
            <View style={s.statusLeft}>
              <Icon name="brain" size={16} color={COLORS.textSecondary} />
              <Text style={s.statusLabel}>{t('cnnModels')}</Text>
            </View>
            <Text style={[s.statusValue, { color: modelsLoaded > 0 ? COLORS.primary : COLORS.textSecondary }]}>
              {modelsLoaded > 0 ? t('loaded') : '—'}
            </Text>
          </View>

          {/* Bot */}
          <View style={s.statusRow}>
            <View style={s.statusLeft}>
              <Icon name="robot" size={16} color={COLORS.textSecondary} />
              <Text style={s.statusLabel}>{t('tradingBot')}</Text>
            </View>
            <Text style={[s.statusValue, { color: COLORS.success }]}>{t('botActive')}</Text>
          </View>

          {/* Exchange */}
          <View style={[s.statusRow, { borderBottomWidth: 0 }]}>
            <View style={s.statusLeft}>
              <Icon name="swap-horizontal" size={16} color={COLORS.textSecondary} />
              <Text style={s.statusLabel}>{t('binanceDemo')}</Text>
            </View>
            <Text style={[s.statusValue, { color: COLORS.primary }]}>{t('connected')}</Text>
          </View>
        </View>

        {/* MODEL INFO */}
        <View style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <Icon name="microscope" size={20} color={COLORS.primary} />
            <Text style={s.sectionTitle}>{t('modelInfo')}</Text>
          </View>

          <View style={s.infoGrid}>
            <View style={s.infoBox}>
              <Text style={s.infoLabel}>{t('architecture')}</Text>
              <Text style={s.infoValue}>XHunter AI v3</Text>
            </View>
            <View style={s.infoBox}>
              <Text style={s.infoLabel}>{t('directions')}</Text>
              <Text style={s.infoValue}>LONG + SHORT</Text>
            </View>
            <View style={s.infoBox}>
              <Text style={s.infoLabel}>{t('timeframes')}</Text>
              <Text style={s.infoValue}>{t('multiTimeframe')}</Text>
            </View>
            <View style={s.infoBox}>
              <Text style={s.infoLabel}>{t('coins')}</Text>
              <Text style={s.infoValue}>{t('cryptoAssets')}</Text>
            </View>
          </View>

          <View style={s.featureRow}>
            <View style={[s.featureBadge, { borderColor: `${COLORS.success}30` }]}>
              <Text style={[s.featureText, { color: COLORS.success }]}>{t('trailingStop')}</Text>
            </View>
            <View style={[s.featureBadge, { borderColor: `${COLORS.primary}30` }]}>
              <Text style={[s.featureText, { color: COLORS.primary }]}>{t('dynamicTPSL')}</Text>
            </View>
            <View style={[s.featureBadge, { borderColor: `${COLORS.warning}30` }]}>
              <Text style={[s.featureText, { color: COLORS.warning }]}>{t('smartFilters')}</Text>
            </View>
          </View>
        </View>

        {/* LANGUAGE */}
        <View style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <Icon name="translate" size={20} color={COLORS.primary} />
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
                    <Icon name="check" size={14} color={COLORS.background} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ABOUT */}
        <View style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <Icon name="information-outline" size={20} color={COLORS.primary} />
            <Text style={s.sectionTitle}>{t('aboutApp')}</Text>
          </View>

          <View style={s.aboutRow}>
            <Text style={s.aboutLabel}>{t('appVersion')}</Text>
            <Text style={s.aboutValue}>2.0 Alpha</Text>
          </View>
          <View style={s.aboutRow}>
            <Text style={s.aboutLabel}>{t('engine')}</Text>
            <Text style={s.aboutValue}>XHunter AI v3</Text>
          </View>
          <View style={[s.aboutRow, { borderBottomWidth: 0 }]}>
            <Text style={s.aboutLabel}>{t('dataLabel')}</Text>
            <Text style={s.aboutValue}>Binance Live API</Text>
          </View>
        </View>

        {/* LOGOUT */}
        <TouchableOpacity
          style={s.logoutBtn}
          onPress={() => {
            Alert.alert(
              t('logout'),
              t('logoutConfirm'),
              [
                { text: t('cancel'), style: 'cancel' },
                { text: t('logout'), style: 'destructive', onPress: () => logout() },
              ],
            );
          }}
          activeOpacity={0.7}
        >
          <Icon name="logout" size={18} color={COLORS.danger} />
          <Text style={s.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>

        <View style={s.footer}>
          <Text style={s.footerText}>CryptoXHunter</Text>
          <Text style={s.footerSub}>{t('footerEngine')}</Text>
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
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, letterSpacing: 0.3 },

  // Status
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  statusValue: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  // Model info
  infoGrid: { gap: 8, marginBottom: 12 },
  infoBox: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  infoValue: { fontSize: 12, color: COLORS.text, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
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

  // About
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  aboutLabel: { fontSize: 13, color: COLORS.textSecondary },
  aboutValue: { fontSize: 13, color: COLORS.text, fontWeight: '700' },

  // Profile
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  profileAvatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: COLORS.primary },
  profileAvatarPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.cardSecondary, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  profileEmail: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  providerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, backgroundColor: COLORS.cardSecondary, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  providerText: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary },

  // Logout
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginBottom: 8, backgroundColor: `${COLORS.danger}10`, borderRadius: 14, borderWidth: 1, borderColor: `${COLORS.danger}30` },
  logoutText: { fontSize: 15, fontWeight: '700', color: COLORS.danger },

  footer: { alignItems: 'center', paddingVertical: 24 },
  footerText: { fontSize: 12, color: COLORS.textDark, fontWeight: '600' },
  footerSub: { fontSize: 10, color: COLORS.textDark, marginTop: 3 },
});

export default SettingsScreen;
