// LoginScreen — Google + Binance Sign-In
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  StatusBar, SafeAreaView, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { COLORS, SHADOWS } from '../config/theme';
import { useAuth } from '../context/AuthContext';

const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const { signInWithGoogle, signInWithBinance } = useAuth();
  const [loading, setLoading] = useState<'google' | 'binance' | null>(null);

  const handleGoogle = async () => {
    setLoading('google');
    try {
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Google Sign-In failed');
    } finally {
      setLoading(null);
    }
  };

  const handleBinance = async () => {
    setLoading('binance');
    try {
      await signInWithBinance();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Binance login failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={s.content}>
        {/* Logo */}
        <View style={s.logoContainer}>
          <View style={s.logoCircle}>
            <Icon name="chart-line-variant" size={48} color={COLORS.primary} />
          </View>
          <Text style={s.appName}>CryptoXHunter</Text>
          <Text style={s.tagline}>AI-Powered Trading Signals</Text>
        </View>

        {/* Features */}
        <View style={s.features}>
          <View style={s.featureRow}>
            <Icon name="brain" size={18} color={COLORS.primary} />
            <Text style={s.featureText}>Advanced AI Trading Engine</Text>
          </View>
          <View style={s.featureRow}>
            <Icon name="chart-timeline-variant-shimmer" size={18} color={COLORS.success} />
            <Text style={s.featureText}>Real-time LONG & SHORT Signals</Text>
          </View>
          <View style={s.featureRow}>
            <Icon name="shield-check" size={18} color={COLORS.warning} />
            <Text style={s.featureText}>Risk Management & TP/SL</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={s.buttons}>
          {/* Google Sign-In */}
          <TouchableOpacity
            style={s.googleBtn}
            onPress={handleGoogle}
            disabled={loading !== null}
            activeOpacity={0.8}
          >
            {loading === 'google' ? (
              <ActivityIndicator color="#333" size="small" />
            ) : (
              <>
                <Icon name="google" size={22} color="#4285F4" />
                <Text style={s.googleText}>Sign in with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Binance Sign-In — disabled until partner access approved */}
          <TouchableOpacity
            style={[s.binanceBtn, s.btnDisabled]}
            disabled={true}
            activeOpacity={0.8}
          >
            <Icon name="currency-btc" size={22} color="#1E232980" />
            <Text style={[s.binanceText, s.btnDisabledText]}>Sign in with Binance</Text>
            <Text style={s.comingSoon}>Coming Soon</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={s.footer}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },

  // Logo
  logoContainer: { alignItems: 'center', marginBottom: 48 },
  logoCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: `${COLORS.primary}15`,
    borderWidth: 2, borderColor: `${COLORS.primary}40`,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    ...SHADOWS.large,
  },
  appName: { fontSize: 32, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: COLORS.textSecondary, marginTop: 6, fontWeight: '500' },

  // Features
  features: { marginBottom: 48, gap: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },

  // Buttons
  buttons: { gap: 14 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14, height: 54, gap: 12,
    ...SHADOWS.medium,
  },
  googleText: { fontSize: 16, fontWeight: '700', color: '#333333' },
  binanceBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F0B90B', borderRadius: 14, height: 54, gap: 12,
    ...SHADOWS.medium,
  },
  binanceText: { fontSize: 16, fontWeight: '700', color: '#1E2329' },
  btnDisabled: { opacity: 0.4 },
  btnDisabledText: { color: '#1E232980' },
  comingSoon: { fontSize: 10, fontWeight: '700', color: '#1E232960', position: 'absolute', right: 14 },

  // Footer
  footer: {
    fontSize: 11, color: COLORS.textDark, textAlign: 'center',
    marginTop: 32, lineHeight: 16,
  },
});

export default LoginScreen;
