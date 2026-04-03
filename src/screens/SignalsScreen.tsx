// SignalsScreen — Radar Intercept Signal Feed
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  ActivityIndicator, TouchableOpacity, Image,
} from 'react-native';
import { COLORS, SHADOWS } from '../config/theme';
import APIService, { CryptoPrediction } from '../services/apiService';

const COINS = ['bitcoin', 'ethereum', 'solana', 'dogecoin', 'avalanche'];
const COIN_SHORT: Record<string, string> = { bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', dogecoin: 'DOGE', avalanche: 'AVAX' };
const COIN_IMAGES: Record<string, string> = {
  bitcoin: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ethereum: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  solana: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  dogecoin: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  avalanche: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
};

type DirFilter = 'ALL' | 'LONG' | 'SHORT' | 'HOLD';

const SignalsScreen: React.FC = () => {
  const [signals, setSignals] = useState<CryptoPrediction[]>([]);
  const [filtered, setFiltered] = useState<CryptoPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dirFilter, setDirFilter] = useState<DirFilter>('ALL');
  const [coinFilter, setCoinFilter] = useState<string | null>(null);

  const fetchSignals = async () => {
    try {
      const preds = await Promise.all(
        COINS.map(c => APIService.getPrediction(c).catch(() => null))
      );
      const valid = preds.filter(Boolean) as CryptoPrediction[];
      // Sort: signals first (BUY/SELL), then HOLD
      valid.sort((a, b) => {
        if (a.signal !== 'HOLD' && b.signal === 'HOLD') return -1;
        if (a.signal === 'HOLD' && b.signal !== 'HOLD') return 1;
        return (b.confidence || 0) - (a.confidence || 0);
      });
      setSignals(valid);
    } catch (e) {
      console.error('Signals fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchSignals(); }, []);

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
    fetchSignals();
  }, []);

  const activeCount = signals.filter(s => s.signal !== 'HOLD').length;

  const getSignalColor = (signal: string) =>
    signal === 'BUY' ? COLORS.success : signal === 'SELL' ? COLORS.danger : COLORS.warning;

  const getSignalLabel = (signal: string) =>
    signal === 'BUY' ? 'LONG' : signal === 'SELL' ? 'SHORT' : 'HOLD';

  const renderSignal = ({ item, index }: { item: CryptoPrediction; index: number }) => {
    const sColor = getSignalColor(item.signal);
    const label = getSignalLabel(item.signal);
    const img = COIN_IMAGES[item.crypto];
    const conf = ((item.confidence || 0) * 100).toFixed(0);
    const price = item.current_price || 0;
    const rm = item.risk_management;
    const direction = (item as any).direction;
    const longFilter = (item as any).long_filter;
    const shortFilter = (item as any).short_filter;
    const hasSignal = item.signal !== 'HOLD';
    const time = item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

    return (
      <View style={[cs.card, { borderColor: `${sColor}20` }]}>
        {/* Glow */}
        <View style={[cs.glow, { backgroundColor: hasSignal ? `${sColor}12` : 'transparent' }]} />

        {/* Timeline dot + line */}
        <View style={cs.timeline}>
          <View style={[cs.dot, { backgroundColor: sColor, shadowColor: sColor }]} />
          {index < filtered.length - 1 && <View style={cs.line} />}
        </View>

        {/* Content */}
        <View style={cs.content}>
          {/* Header row */}
          <View style={cs.headerRow}>
            <View style={cs.coinRow}>
              {img && <Image source={{ uri: img }} style={cs.coinImg} />}
              <View>
                <Text style={cs.coinName}>{item.name || COIN_SHORT[item.crypto] || item.crypto}</Text>
                <Text style={cs.coinSymbol}>{COIN_SHORT[item.crypto] || ''}</Text>
              </View>
            </View>

            <View style={cs.headerRight}>
              <View style={[cs.signalBadge, { backgroundColor: `${sColor}15`, borderColor: `${sColor}50` }]}>
                <View style={[cs.signalDot, { backgroundColor: sColor }]} />
                <Text style={[cs.signalText, { color: sColor }]}>{label}</Text>
                {direction && (
                  <Text style={[cs.dirArrow, { color: sColor }]}>
                    {direction === 'LONG' ? '↑' : '↓'}
                  </Text>
                )}
              </View>
              <Text style={cs.timeText}>{time}</Text>
            </View>
          </View>

          {/* Data row */}
          {hasSignal ? (
            <View style={cs.dataSection}>
              {/* Confidence */}
              <View style={cs.confRow}>
                <Text style={cs.confLabel}>Confidence</Text>
                <View style={cs.confBarOuter}>
                  <View style={[cs.confBarInner, { width: `${conf}%`, backgroundColor: sColor }]} />
                </View>
                <Text style={[cs.confValue, { color: sColor }]}>{conf}%</Text>
              </View>

              {/* Price + TP/SL */}
              <View style={cs.priceRow}>
                <View style={cs.priceItem}>
                  <Text style={cs.priceLabel}>Price</Text>
                  <Text style={cs.priceValue}>
                    ${price >= 1 ? price.toFixed(2) : price.toFixed(4)}
                  </Text>
                </View>
                {rm && (
                  <>
                    <View style={cs.priceItem}>
                      <Text style={[cs.priceLabel, { color: COLORS.success }]}>TP</Text>
                      <Text style={[cs.priceValue, { color: COLORS.success }]}>
                        ${(rm.target_price || 0) >= 1 ? (rm.target_price || 0).toFixed(2) : (rm.target_price || 0).toFixed(4)}
                      </Text>
                    </View>
                    <View style={cs.priceItem}>
                      <Text style={[cs.priceLabel, { color: COLORS.danger }]}>SL</Text>
                      <Text style={[cs.priceValue, { color: COLORS.danger }]}>
                        ${(rm.stop_loss || 0) >= 1 ? (rm.stop_loss || 0).toFixed(2) : (rm.stop_loss || 0).toFixed(4)}
                      </Text>
                    </View>
                    <View style={cs.priceItem}>
                      <Text style={[cs.priceLabel, { color: COLORS.primary }]}>R:R</Text>
                      <Text style={[cs.priceValue, { color: COLORS.primary }]}>
                        {(rm.risk_reward_ratio || 0).toFixed(1)}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          ) : (
            <View style={cs.holdSection}>
              <Text style={cs.holdText}>No signal — filters active</Text>
              {longFilter && <Text style={cs.filterText}>LONG: {longFilter}</Text>}
              {shortFilter && <Text style={cs.filterText}>SHORT: {shortFilter}</Text>}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={st.center}>
        <View style={st.radarPulse}>
          <View style={st.radarRing1} />
          <View style={st.radarRing2} />
          <View style={st.radarDot} />
        </View>
        <Text style={st.loadText}>Scanning markets...</Text>
        <Text style={st.loadHint}>CNN analyzing 5 coins</Text>
      </View>
    );
  }

  return (
    <View style={st.container}>
      {/* Header */}
      <View style={st.header}>
        <View>
          <Text style={st.title}>AI Signals</Text>
          <Text style={st.subtitle}>CNN 1D-MultiScale · Live</Text>
        </View>
        <View style={st.activeBadge}>
          <Text style={st.activeCount}>{activeCount}</Text>
          <Text style={st.activeLabel}>ACTIVE</Text>
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

      {/* Signal feed */}
      <FlatList
        data={filtered}
        renderItem={renderSignal}
        keyExtractor={item => item.crypto}
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
    </View>
  );
};

// ═══ STYLES ═══

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

  loadText: { fontSize: 16, color: COLORS.text, fontWeight: '600', marginTop: 20 },
  loadHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },

  emptyState: { alignItems: 'center', paddingTop: 50 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600', marginTop: 20 },
  emptyHint: { fontSize: 12, color: COLORS.textDark, marginTop: 4 },

  // Radar animation (static for RN)
  radarPulse: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
  radarRing1: { position: 'absolute', width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: 'rgba(0,212,255,0.15)' },
  radarRing2: { position: 'absolute', width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(0,212,255,0.25)' },
  radarDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary },
});

// Signal card styles
const cs = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 10, ...SHADOWS.small },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },

  timeline: { width: 32, alignItems: 'center', paddingTop: 20 },
  dot: { width: 10, height: 10, borderRadius: 5, elevation: 4, shadowOpacity: 0.6, shadowRadius: 4 },
  line: { width: 2, flex: 1, backgroundColor: COLORS.border, marginTop: 4 },

  content: { flex: 1, padding: 14, paddingLeft: 4 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  coinRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coinImg: { width: 32, height: 32, borderRadius: 16 },
  coinName: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  coinSymbol: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600', letterSpacing: 1 },

  headerRight: { alignItems: 'flex-end', gap: 4 },
  signalBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  signalDot: { width: 6, height: 6, borderRadius: 3 },
  signalText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  dirArrow: { fontSize: 14, fontWeight: '800' },
  timeText: { fontSize: 9, color: COLORS.textDark, fontWeight: '600' },

  dataSection: { gap: 8 },
  confRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600', width: 65 },
  confBarOuter: { flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  confBarInner: { height: '100%', borderRadius: 3 },
  confValue: { fontSize: 13, fontWeight: '900', minWidth: 32, textAlign: 'right' },

  priceRow: { flexDirection: 'row', gap: 0 },
  priceItem: { flex: 1 },
  priceLabel: { fontSize: 9, color: COLORS.textSecondary, fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 },
  priceValue: { fontSize: 12, color: COLORS.text, fontWeight: '700' },

  holdSection: { paddingVertical: 4 },
  holdText: { fontSize: 12, color: COLORS.textDark, fontWeight: '500', fontStyle: 'italic' },
  filterText: { fontSize: 10, color: COLORS.warning, fontWeight: '600', marginTop: 3 },
});

export default SignalsScreen;
