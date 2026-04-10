// SignalsScreen — AI Command Center: CNN Predictions for 5 Coins
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, Image, StatusBar, SafeAreaView, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SHADOWS } from '../config/theme';
import { RootStackParamList } from '../types';
import { useCredits } from '../context/CreditsContext';
import APIService, { CryptoPrediction } from '../services/apiService';
import useAppStore from '../store/useAppStore';
import { SignalCardSkeleton } from '../components/SkeletonLoader';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// Fallback coin list (used if API /api/cryptos fails)
const FALLBACK_COINS = ['bitcoin', 'ethereum', 'solana', 'dogecoin', 'avalanche', 'xrp', 'chainlink', 'cardano', 'near', 'polkadot', 'filecoin'];

const COIN_SHORT: Record<string, string> = {
  bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', dogecoin: 'DOGE', avalanche: 'AVAX',
  xrp: 'XRP', chainlink: 'LINK', cardano: 'ADA', near: 'NEAR', polkadot: 'DOT', filecoin: 'FIL',
};
const COIN_IMAGES: Record<string, string> = {
  bitcoin: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ethereum: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  solana: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  dogecoin: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  avalanche: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  xrp: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  chainlink: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  cardano: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  near: 'https://assets.coingecko.com/coins/images/10365/small/near.jpg',
  polkadot: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
  filecoin: 'https://assets.coingecko.com/coins/images/12817/small/filecoin.png',
};

const COINS = FALLBACK_COINS;

type DirFilter = 'ALL' | 'LONG' | 'SHORT' | 'HOLD';

const SignalsScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { balance, isCoinUnlocked, spendOnCrypto, watchAdAndEarn, resetUnlocks, adReady } = useCredits();
  const storeSignals = useAppStore(s => s.signals);
  const setStoreSignals = useAppStore(s => s.setSignals);
  const [signals, setSignals] = useState<CryptoPrediction[]>(storeSignals);
  const [filtered, setFiltered] = useState<CryptoPrediction[]>(storeSignals);
  const [loading, setLoading] = useState(storeSignals.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [dirFilter, setDirFilter] = useState<DirFilter>('ALL');
  const [coinFilter, setCoinFilter] = useState<string | null>(null);

  const fetchSignals = async () => {
    try {
      // Fetch coin list dynamically from API, fallback to hardcoded list
      let coinList = FALLBACK_COINS;
      try {
        const cryptosResp = await APIService.getCryptosList();
        if (cryptosResp?.cryptos) {
          coinList = Object.keys(cryptosResp.cryptos);
          // Update COIN_SHORT dynamically from API response
          Object.entries(cryptosResp.cryptos).forEach(([id, info]: [string, any]) => {
            if (!COIN_SHORT[id]) {
              COIN_SHORT[id] = info.symbol?.replace('USDT', '') || id.toUpperCase();
            }
          });
        }
      } catch { /* use fallback */ }

      const preds = await Promise.all(
        coinList.map(c => APIService.getPrediction(c).catch(() => null))
      );
      const valid = preds.filter(Boolean) as CryptoPrediction[];
      valid.sort((a, b) => {
        if (a.signal !== 'HOLD' && b.signal === 'HOLD') return -1;
        if (a.signal === 'HOLD' && b.signal !== 'HOLD') return 1;
        return (b.confidence || 0) - (a.confidence || 0);
      });
      setSignals(valid);
      setStoreSignals(valid);
    } catch (e) {
      console.error('Signals fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchSignals(); }, []);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      APIService.clearCache();
      fetchSignals();
    }, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let f = signals;
    if (dirFilter !== 'ALL') {
      const map: Record<string, string> = { LONG: 'BUY', SHORT: 'SELL', HOLD: 'HOLD' };
      f = f.filter(s => s.signal === map[dirFilter]);
    }
    if (coinFilter) {
      f = f.filter(s => s.crypto === coinFilter);
    }
    setFiltered(f);
  }, [dirFilter, coinFilter, signals]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    APIService.clearCache();
    resetUnlocks();
    fetchSignals();
  }, [resetUnlocks]);

  const activeCount = signals.filter(s => s.signal !== 'HOLD').length;
  const longCount = signals.filter(s => s.signal === 'BUY').length;
  const shortCount = signals.filter(s => s.signal === 'SELL').length;

  const getSignalColor = (signal: string) =>
    signal === 'BUY' ? COLORS.success : signal === 'SELL' ? COLORS.danger : COLORS.warning;
  const getSignalLabel = (signal: string) =>
    signal === 'BUY' ? 'LONG' : signal === 'SELL' ? 'SHORT' : 'HOLD';

  const openDetail = async (item: CryptoPrediction) => {
    if (isCoinUnlocked(item.crypto)) {
      navigation.navigate('Detail', { crypto: item });
      return;
    }

    if (balance >= 3) {
      const success = await spendOnCrypto(item.crypto);
      if (success) {
        navigation.navigate('Detail', { crypto: item });
      }
      return;
    }

    // Insufficient credits
    Alert.alert(
      t('insufficientCredits'),
      t('insufficientCreditsMsg'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('watchAd'), onPress: () => watchAdAndEarn() },
      ],
    );
  };

  const renderSignal = ({ item, index }: { item: CryptoPrediction; index: number }) => {
    const sColor = getSignalColor(item.signal);
    const label = getSignalLabel(item.signal);
    const img = COIN_IMAGES[item.crypto];
    const conf = ((item.confidence || 0) * 100).toFixed(0);
    const price = item.current_price || 0;
    const rm = item.risk_management;
    const longFilter = (item as any).long_filter;
    const shortFilter = (item as any).short_filter;
    const hasSignal = item.signal !== 'HOLD';
    const time = item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
    const unlocked = isCoinUnlocked(item.crypto);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => openDetail(item)}
        style={[cs.card, { borderColor: `${sColor}20` }]}
      >
        {/* Glow top bar */}
        <View style={[cs.glow, { backgroundColor: hasSignal ? sColor : 'transparent', opacity: hasSignal ? 0.6 : 0 }]} />

        {/* Header: Coin + Signal Badge — always visible */}
        <View style={cs.headerRow}>
          <View style={cs.coinRow}>
            {img && <Image source={{ uri: img }} style={cs.coinImg} />}
            <View>
              <Text style={cs.coinName}>{item.name || COIN_SHORT[item.crypto] || item.crypto}</Text>
              <Text style={cs.coinSymbol}>{COIN_SHORT[item.crypto]}/USDT</Text>
            </View>
          </View>

          <View style={cs.headerRight}>
            <View style={[cs.signalBadge, { backgroundColor: `${sColor}15`, borderColor: `${sColor}50` }]}>
              <View style={[cs.signalDot, { backgroundColor: sColor }]} />
              <Text style={[cs.signalText, { color: sColor }]}>{label}</Text>
              <Text style={[cs.signalArrow, { color: sColor }]}>
                {item.signal === 'BUY' ? '↑' : item.signal === 'SELL' ? '↓' : '—'}
              </Text>
            </View>
            <Text style={cs.timeText}>{time}</Text>
          </View>
        </View>

        {/* LOCKED: show lock section instead of data */}
        {!unlocked ? (
          <View style={cs.lockedSection}>
            <Icon name="lock" size={28} color={COLORS.textDark} />
            <Text style={cs.lockText}>{t('tapToUnlock')}</Text>
            <Text style={cs.lockCost}>3 credits</Text>
          </View>
        ) : (
          <>
            {/* Price row */}
            <View style={cs.priceMainRow}>
              <Text style={cs.priceMain}>
                ${price >= 1000 ? price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : price >= 1 ? price.toFixed(2) : price.toFixed(4)}
              </Text>
              {hasSignal && (
                <View style={[cs.confBadge, { backgroundColor: `${sColor}15` }]}>
                  <Text style={[cs.confBadgeText, { color: sColor }]}>{conf}%</Text>
                </View>
              )}
            </View>

            {/* Confidence bar (active signal only) */}
            {hasSignal && (
              <View style={cs.confRow}>
                <Text style={cs.confLabel}>Confidence</Text>
                <View style={cs.confBarOuter}>
                  <View style={[cs.confBarInner, {
                    width: `${conf}%`,
                    backgroundColor: sColor,
                  }]} />
                </View>
                <Text style={[cs.confValue, { color: sColor }]}>{conf}%</Text>
              </View>
            )}

            {/* TP/SL row (only if active signal) */}
            {hasSignal && rm && (
              <View style={cs.tpslRow}>
                <View style={cs.tpslItem}>
                  <Text style={[cs.tpslLabel, { color: COLORS.success }]}>TP</Text>
                  <Text style={[cs.tpslValue, { color: COLORS.success }]}>
                    ${(rm.target_price || 0) >= 1 ? (rm.target_price || 0).toFixed(2) : (rm.target_price || 0).toFixed(4)}
                  </Text>
                  <Text style={[cs.tpslPct, { color: COLORS.success }]}>
                    +{((rm.take_profit_pct || 0) * 100).toFixed(1)}%
                  </Text>
                </View>
                <View style={cs.tpslDivider} />
                <View style={cs.tpslItem}>
                  <Text style={[cs.tpslLabel, { color: COLORS.danger }]}>SL</Text>
                  <Text style={[cs.tpslValue, { color: COLORS.danger }]}>
                    ${(rm.stop_loss || 0) >= 1 ? (rm.stop_loss || 0).toFixed(2) : (rm.stop_loss || 0).toFixed(4)}
                  </Text>
                  <Text style={[cs.tpslPct, { color: COLORS.danger }]}>
                    -{((rm.stop_loss_pct || 0) * 100).toFixed(1)}%
                  </Text>
                </View>
                <View style={cs.tpslDivider} />
                <View style={cs.tpslItem}>
                  <Text style={[cs.tpslLabel, { color: COLORS.primary }]}>R:R</Text>
                  <Text style={[cs.tpslValue, { color: COLORS.primary }]}>
                    {(rm.risk_reward_ratio || 0).toFixed(1)}
                  </Text>
                </View>
              </View>
            )}

            {/* HOLD: show filter reasons */}
            {!hasSignal && (
              <View style={cs.holdSection}>
                <Text style={cs.holdText}>{t('noActiveSignal')}</Text>
                <View style={cs.filterReasons}>
                  {longFilter && (
                    <View style={cs.filterReasonBadge}>
                      <Text style={cs.filterReasonText}>LONG: {longFilter}</Text>
                    </View>
                  )}
                  {shortFilter && (
                    <View style={cs.filterReasonBadge}>
                      <Text style={cs.filterReasonText}>SHORT: {shortFilter}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Tap hint */}
            <View style={cs.tapHint}>
              <Text style={cs.tapHintText}>Tap for details →</Text>
            </View>
          </>
        )}
      </TouchableOpacity>
    );
  };

  // Sentiment summary header
  const renderHeader = () => (
    <View style={st.sentimentCard}>
      <View style={st.sentimentRow}>
        <View style={st.sentimentItem}>
          <View style={[st.sentimentDot, { backgroundColor: COLORS.success }]} />
          <Text style={st.sentimentCount}>{longCount}</Text>
          <Text style={st.sentimentLabel}>LONG</Text>
        </View>
        <View style={st.sentimentDivider} />
        <View style={st.sentimentItem}>
          <View style={[st.sentimentDot, { backgroundColor: COLORS.danger }]} />
          <Text style={st.sentimentCount}>{shortCount}</Text>
          <Text style={st.sentimentLabel}>SHORT</Text>
        </View>
        <View style={st.sentimentDivider} />
        <View style={st.sentimentItem}>
          <View style={[st.sentimentDot, { backgroundColor: COLORS.warning }]} />
          <Text style={st.sentimentCount}>{signals.length - activeCount}</Text>
          <Text style={st.sentimentLabel}>HOLD</Text>
        </View>
      </View>
      {/* Sentiment bar */}
      <View style={st.sentimentBar}>
        {longCount > 0 && (
          <View style={[st.sentimentBarSeg, { flex: longCount, backgroundColor: COLORS.success, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }]} />
        )}
        {shortCount > 0 && (
          <View style={[st.sentimentBarSeg, { flex: shortCount, backgroundColor: COLORS.danger }]} />
        )}
        {(signals.length - activeCount) > 0 && (
          <View style={[st.sentimentBarSeg, { flex: signals.length - activeCount, backgroundColor: COLORS.warning, borderTopRightRadius: 4, borderBottomRightRadius: 4 }]} />
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background, paddingTop: 16 }}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        {Array.from({ length: 6 }).map((_, i) => (
          <SignalCardSkeleton key={i} />
        ))}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={st.header}>
        <View>
          <Text style={st.title}>{t('signals')}</Text>
          <Text style={st.subtitle}>{t('signalsSubtitle')}</Text>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
          <TouchableOpacity
            onPress={() => navigation.navigate('SignalHistory')}
            style={{padding: 6, borderRadius: 8, backgroundColor: COLORS.card}}>
            <Icon name="history" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={st.activeBadge}>
            <Text style={st.activeCount}>{activeCount}</Text>
            <Text style={st.activeLabel}>ACTIVE</Text>
          </View>
        </View>
      </View>

      {/* Direction filters */}
      <View style={st.filterRow}>
        {(['ALL', 'LONG', 'SHORT', 'HOLD'] as DirFilter[]).map(f => {
          const active = dirFilter === f;
          const color = f === 'LONG' ? COLORS.success : f === 'SHORT' ? COLORS.danger : f === 'HOLD' ? COLORS.warning : COLORS.primary;
          return (
            <TouchableOpacity key={f} style={[st.filterChip, active && { backgroundColor: `${color}15`, borderColor: color }]}
              onPress={() => setDirFilter(f)}>
              <Text style={[st.filterText, active && { color }]}>{f}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Coin filter */}
      <View style={st.coinRow}>
        <TouchableOpacity
          style={[st.coinChip, !coinFilter && st.coinChipActive]}
          onPress={() => setCoinFilter(null)}
        >
          <Text style={[st.coinChipText, !coinFilter && st.coinChipTextActive]}>All</Text>
        </TouchableOpacity>
        {COINS.map(c => {
          const active = coinFilter === c;
          const img = COIN_IMAGES[c];
          return (
            <TouchableOpacity key={c} style={[st.coinChip, active && st.coinChipActive]}
              onPress={() => setCoinFilter(active ? null : c)}>
              {img && <Image source={{ uri: img }} style={st.coinChipImg} />}
              <Text style={[st.coinChipText, active && st.coinChipTextActive]}>{COIN_SHORT[c]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Credits banner */}
      <View style={st.creditsBanner}>
        <View style={st.creditsLeft}>
          <Icon name="star-circle" size={20} color={COLORS.warning} />
          <Text style={st.creditsLabel}>Credits:</Text>
          <Text style={st.creditsValue}>{balance}</Text>
        </View>
        <TouchableOpacity
          style={[st.watchAdBtn, !adReady && { opacity: 0.5 }]}
          onPress={() => watchAdAndEarn()}
          disabled={!adReady}
          activeOpacity={0.7}
        >
          <Icon name="play-circle" size={16} color={COLORS.background} />
          <Text style={st.watchAdText}>{t('watchAd')}</Text>
        </TouchableOpacity>
      </View>

      {/* Signal feed */}
      <FlatList
        data={filtered}
        renderItem={renderSignal}
        keyExtractor={item => item.crypto}
        ListHeaderComponent={signals.length > 0 ? renderHeader : null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <View style={st.emptyState}>
            <View style={st.radarPulse}>
              <View style={st.radarRing1} />
              <View style={st.radarRing2} />
              <View style={st.radarDot} />
            </View>
            <Text style={st.emptyText}>No signals match filters</Text>
            <Text style={st.emptyHint}>Try changing the filter</Text>
          </View>
        }
        contentContainerStyle={st.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

// ═══ MAIN STYLES ═══
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  list: { paddingHorizontal: 16, paddingBottom: 100 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500', marginTop: 2, letterSpacing: 0.5 },

  activeBadge: { alignItems: 'center', backgroundColor: 'rgba(0,255,136,0.1)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,255,136,0.3)' },
  activeCount: { fontSize: 20, fontWeight: '900', color: COLORS.success },
  activeLabel: { fontSize: 8, fontWeight: '800', color: COLORS.success, letterSpacing: 1.5 },

  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 10 },
  filterChip: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  filterText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.5 },

  coinRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 14 },
  coinChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  coinChipActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}10` },
  coinChipImg: { width: 16, height: 16, borderRadius: 8 },
  coinChipText: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  coinChipTextActive: { color: COLORS.primary },

  // Sentiment
  sentimentCard: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 12, ...SHADOWS.small },
  sentimentRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 10 },
  sentimentItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sentimentDot: { width: 8, height: 8, borderRadius: 4 },
  sentimentCount: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  sentimentLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.8 },
  sentimentDivider: { width: 1, height: 20, backgroundColor: COLORS.border },
  sentimentBar: { flexDirection: 'row', height: 4, borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)' },
  sentimentBarSeg: { height: '100%' },

  loadText: { fontSize: 16, color: COLORS.text, fontWeight: '600', marginTop: 20 },
  loadHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },

  // Credits banner
  creditsBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginBottom: 10, backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 10, ...SHADOWS.small },
  creditsLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  creditsLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  creditsValue: { fontSize: 18, fontWeight: '900', color: COLORS.warning },
  watchAdBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.success, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  watchAdText: { fontSize: 12, fontWeight: '800', color: COLORS.background },

  emptyState: { alignItems: 'center', paddingTop: 50 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600', marginTop: 20 },
  emptyHint: { fontSize: 12, color: COLORS.textDark, marginTop: 4 },

  radarPulse: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
  radarRing1: { position: 'absolute', width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: 'rgba(0,212,255,0.15)' },
  radarRing2: { position: 'absolute', width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(0,212,255,0.25)' },
  radarDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary },
});

// ═══ SIGNAL CARD STYLES ═══
const cs = StyleSheet.create({
  card: { backgroundColor: COLORS.card, borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 12, padding: 16, ...SHADOWS.small },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },

  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  coinRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  coinImg: { width: 36, height: 36, borderRadius: 18 },
  coinName: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  coinSymbol: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600', letterSpacing: 0.8, marginTop: 1 },

  headerRight: { alignItems: 'flex-end', gap: 4 },
  signalBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  signalDot: { width: 6, height: 6, borderRadius: 3 },
  signalText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.8 },
  signalArrow: { fontSize: 15, fontWeight: '800' },
  timeText: { fontSize: 9, color: COLORS.textDark, fontWeight: '600' },

  // Price
  priceMainRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  priceMain: { fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
  confBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  confBadgeText: { fontSize: 14, fontWeight: '900' },

  // Confidence bar
  confRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  confLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600', width: 70 },
  confBarOuter: { flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' },
  confBarInner: { height: '100%', borderRadius: 3 },
  confValue: { fontSize: 13, fontWeight: '900', minWidth: 32, textAlign: 'right' },

  // TP/SL
  tpslRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 10, marginBottom: 6 },
  tpslItem: { flex: 1, alignItems: 'center' },
  tpslLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8, marginBottom: 2 },
  tpslValue: { fontSize: 12, fontWeight: '800' },
  tpslPct: { fontSize: 9, fontWeight: '600', marginTop: 1 },
  tpslDivider: { width: 1, height: 28, backgroundColor: COLORS.border },

  // HOLD
  holdSection: { marginBottom: 4 },
  holdText: { fontSize: 12, color: COLORS.textDark, fontWeight: '500', fontStyle: 'italic', marginBottom: 6 },
  filterReasons: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  filterReasonBadge: { backgroundColor: 'rgba(255,182,0,0.08)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  filterReasonText: { fontSize: 9, color: COLORS.warning, fontWeight: '700', letterSpacing: 0.3 },

  // Tap hint
  tapHint: { alignItems: 'flex-end', marginTop: 4 },
  tapHintText: { fontSize: 9, color: COLORS.textDark, fontWeight: '500', letterSpacing: 0.3 },

  // Lock section (replaces data when locked)
  lockedSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  lockText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '700' },
  lockCost: { fontSize: 12, color: COLORS.warning, fontWeight: '800' },
});

export default SignalsScreen;
