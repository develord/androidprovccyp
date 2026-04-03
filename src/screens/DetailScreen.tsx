// DetailScreen — Holographic Trading Terminal
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, StatusBar, SafeAreaView, Image, Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { RootStackParamList, CryptoPrediction } from '../types';
import APIService from '../services/apiService';
import BinanceService from '../services/binanceService';
import RiskManagement from '../components/RiskManagement';
import DatabaseService from '../services/databaseService';

const { width: SW } = Dimensions.get('window');
type Props = NativeStackScreenProps<RootStackParamList, 'Detail'>;

const COIN_IMAGES: Record<string, string> = {
  bitcoin: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ethereum: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  solana: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  dogecoin: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  avalanche: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
};

const DetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { crypto: initialCrypto } = route.params;
  const [crypto, setCrypto] = useState<CryptoPrediction>(initialCrypto);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [priceChange24h, setPriceChange24h] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const signal = crypto.signal || 'HOLD';
  const confidence = crypto.confidence || 0;
  const direction = (crypto as any).direction;
  const longConf = (crypto as any).long_confidence;
  const shortConf = (crypto as any).short_confidence;
  const longFilter = (crypto as any).long_filter;
  const shortFilter = (crypto as any).short_filter;
  const model = (crypto as any).model;
  const dataSource = (crypto as any).data_source;
  const displayPrice = livePrice ?? crypto.current_price ?? 0;
  const coinImage = COIN_IMAGES[crypto.crypto];

  const signalColor = signal === 'BUY' ? COLORS.success : signal === 'SELL' ? COLORS.danger : COLORS.warning;
  const signalLabel = signal === 'BUY' ? 'LONG' : signal === 'SELL' ? 'SHORT' : 'HOLD';
  const signalArrow = signal === 'BUY' ? '↑' : signal === 'SELL' ? '↓' : '—';

  useEffect(() => {
    loadLiveData();
    loadFav();
  }, []);

  const loadFav = async () => setIsFavorite(await DatabaseService.isFavorite(crypto.crypto));
  const toggleFav = async () => setIsFavorite(await DatabaseService.toggleFavorite(crypto.crypto));

  const loadLiveData = async () => {
    try {
      const price = await BinanceService.getCurrentPrice(crypto.crypto);
      setLivePrice(price);
      const ticker = await BinanceService.get24hTicker(crypto.crypto);
      setPriceChange24h(parseFloat(ticker.priceChangePercent));
      const updated = await APIService.getPrediction(crypto.crypto);
      setCrypto(updated);
    } catch (e) {
      console.error('Detail load error:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); APIService.clearCache(); loadLiveData(); };

  const formatPrice = (p: number) => {
    if (p >= 1000) return `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (p >= 1) return `$${p.toFixed(2)}`;
    return `$${p.toFixed(5)}`;
  };

  const confPercent = (confidence * 100).toFixed(0);
  const confBarWidth = `${Math.min(confidence * 100, 100)}%`;

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Nav bar */}
      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.navTitle}>{crypto.name}</Text>
        <TouchableOpacity onPress={toggleFav} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={s.favIcon}>{isFavorite ? '★' : '☆'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══ HERO CARD ═══ */}
        <View style={[s.heroCard, { borderColor: `${signalColor}25` }]}>
          {/* Glow top */}
          <View style={[s.heroGlow, { backgroundColor: `${signalColor}12` }]} />

          {/* Coin + Price row */}
          <View style={s.heroTop}>
            <View style={s.coinRow}>
              {coinImage && <Image source={{ uri: coinImage }} style={s.coinImg} />}
              <View>
                <Text style={s.heroSymbol}>{crypto.symbol?.replace('USDT', '/USDT') || ''}</Text>
                <View style={s.liveRow}>
                  <View style={s.liveDot} />
                  <Text style={s.liveLabel}>Live</Text>
                </View>
              </View>
            </View>
            <View style={s.priceCol}>
              <Text style={s.heroPrice}>{formatPrice(displayPrice)}</Text>
              {priceChange24h !== null && (
                <View style={[s.changeBadge, { backgroundColor: priceChange24h >= 0 ? `${COLORS.success}15` : `${COLORS.danger}15` }]}>
                  <Text style={[s.changeText, { color: priceChange24h >= 0 ? COLORS.success : COLORS.danger }]}>
                    {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* ═══ BIG SIGNAL ═══ */}
          <View style={[s.signalBox, { backgroundColor: `${signalColor}10`, borderColor: `${signalColor}40` }]}>
            <Text style={[s.signalArrow, { color: signalColor }]}>{signalArrow}</Text>
            <View style={s.signalCenter}>
              <Text style={[s.signalLabel, { color: signalColor }]}>{signalLabel}</Text>
              {direction && <Text style={[s.signalDir, { color: signalColor }]}>{direction}</Text>}
            </View>
            {/* Confidence ring */}
            <View style={s.confRing}>
              <View style={[s.confRingBg, { borderColor: `${signalColor}20` }]}>
                <View style={[s.confRingFill, { borderColor: signalColor, borderTopColor: 'transparent', transform: [{ rotate: `${confidence * 360}deg` }] }]} />
              </View>
              <Text style={[s.confRingText, { color: signalColor }]}>{confPercent}%</Text>
            </View>
          </View>

          {/* Confidence bar full width */}
          <View style={s.confSection}>
            <View style={s.confBarRow}>
              <Text style={s.confBarLabel}>Confidence</Text>
              <Text style={[s.confBarValue, { color: signalColor }]}>{confPercent}%</Text>
            </View>
            <View style={s.confBarOuter}>
              <View style={[s.confBarInner, { width: confBarWidth, backgroundColor: signalColor }]} />
            </View>
          </View>
        </View>

        {/* ═══ AI INSIGHTS ═══ */}
        <View style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionIcon}>🧠</Text>
            <Text style={s.sectionTitle}>AI Insights</Text>
          </View>

          <View style={s.insightGrid}>
            {/* LONG confidence */}
            <View style={[s.insightBox, { borderColor: `${COLORS.success}20` }]}>
              <Text style={s.insightLabel}>LONG</Text>
              <Text style={[s.insightValue, { color: COLORS.success }]}>
                {longConf != null ? `${(longConf * 100).toFixed(0)}%` : '—'}
              </Text>
              {longFilter && (
                <View style={[s.filterBadge, { backgroundColor: `${COLORS.warning}15` }]}>
                  <Text style={s.filterText}>{longFilter}</Text>
                </View>
              )}
              {!longFilter && longConf != null && (
                <Text style={[s.filterPass, { color: COLORS.success }]}>✓ Pass</Text>
              )}
            </View>

            {/* SHORT confidence */}
            <View style={[s.insightBox, { borderColor: `${COLORS.danger}20` }]}>
              <Text style={s.insightLabel}>SHORT</Text>
              <Text style={[s.insightValue, { color: COLORS.danger }]}>
                {shortConf != null ? `${(shortConf * 100).toFixed(0)}%` : '—'}
              </Text>
              {shortFilter && (
                <View style={[s.filterBadge, { backgroundColor: `${COLORS.warning}15` }]}>
                  <Text style={s.filterText}>{shortFilter}</Text>
                </View>
              )}
              {!shortFilter && shortConf != null && (
                <Text style={[s.filterPass, { color: COLORS.danger }]}>✓ Pass</Text>
              )}
            </View>
          </View>

          {/* Model info row */}
          <View style={s.modelRow}>
            <View style={s.modelItem}>
              <Text style={s.modelLabel}>Model</Text>
              <Text style={s.modelValue}>{model || 'CNN_1D'}</Text>
            </View>
            <View style={s.modelDivider} />
            <View style={s.modelItem}>
              <Text style={s.modelLabel}>Data</Text>
              <Text style={s.modelValue}>{dataSource || 'live'}</Text>
            </View>
            <View style={s.modelDivider} />
            <View style={s.modelItem}>
              <Text style={s.modelLabel}>Updated</Text>
              <Text style={s.modelValue}>
                {crypto.timestamp ? new Date(crypto.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* ═══ RISK MANAGEMENT ═══ */}
        {crypto.risk_management && (
          <RiskManagement riskManagement={crypto.risk_management} currentPrice={displayPrice} />
        )}

        {/* ═══ FOOTER ═══ */}
        <View style={s.footer}>
          <Text style={s.footerText}>CNN 1D-MultiScale · Binance Live · Multi-TF 4h/1d/1w</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 80 },

  // Nav
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 20, color: COLORS.text },
  navTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, letterSpacing: 0.3 },
  favIcon: { fontSize: 22, color: '#FFB800' },

  // Hero Card
  heroCard: { backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 14, ...SHADOWS.large },
  heroGlow: { height: 3, width: '100%' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, paddingBottom: 14 },
  coinRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  coinImg: { width: 44, height: 44, borderRadius: 22 },
  heroSymbol: { fontSize: 20, fontWeight: '800', color: COLORS.text, letterSpacing: 0.5 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  liveLabel: { fontSize: 10, color: COLORS.success, fontWeight: '700', letterSpacing: 0.8 },
  priceCol: { alignItems: 'flex-end' },
  heroPrice: { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  changeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  changeText: { fontSize: 12, fontWeight: '700' },

  // Signal Box
  signalBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 18, marginBottom: 16, padding: 16, borderRadius: 16, borderWidth: 1 },
  signalArrow: { fontSize: 36, fontWeight: '800' },
  signalCenter: { alignItems: 'center' },
  signalLabel: { fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  signalDir: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginTop: 2 },
  confRing: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center' },
  confRingBg: { position: 'absolute', width: 56, height: 56, borderRadius: 28, borderWidth: 4 },
  confRingFill: { position: 'absolute', width: 56, height: 56, borderRadius: 28, borderWidth: 4 },
  confRingText: { fontSize: 16, fontWeight: '800' },

  // Confidence bar
  confSection: { paddingHorizontal: 18, paddingBottom: 18 },
  confBarRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  confBarLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', letterSpacing: 0.5 },
  confBarValue: { fontSize: 11, fontWeight: '800' },
  confBarOuter: { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  confBarInner: { height: '100%', borderRadius: 3 },

  // AI Insights
  sectionCard: { backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 18, marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, letterSpacing: 0.3 },

  insightGrid: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  insightBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: 14, borderWidth: 1, alignItems: 'center' },
  insightLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  insightValue: { fontSize: 26, fontWeight: '900' },
  filterBadge: { marginTop: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  filterText: { fontSize: 9, color: COLORS.warning, fontWeight: '700', letterSpacing: 0.3 },
  filterPass: { fontSize: 11, fontWeight: '700', marginTop: 6 },

  modelRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 12 },
  modelItem: { flex: 1, alignItems: 'center' },
  modelDivider: { width: 1, height: 24, backgroundColor: COLORS.border },
  modelLabel: { fontSize: 9, color: COLORS.textSecondary, fontWeight: '600', letterSpacing: 0.8, marginBottom: 3, textTransform: 'uppercase' },
  modelValue: { fontSize: 12, color: COLORS.text, fontWeight: '700' },

  // Footer
  footer: { alignItems: 'center', paddingVertical: 24 },
  footerText: { fontSize: 10, color: COLORS.textDark, letterSpacing: 0.5 },
});

export default DetailScreen;
