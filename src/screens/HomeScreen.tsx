// HomeScreen — Premium Crypto Command Center
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  ActivityIndicator, StatusBar, TouchableOpacity, Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../config/theme';
import { RootStackParamList, CryptoPrediction, Stats } from '../types';
import APIService from '../services/apiService';
import CryptoCard from '../components/CryptoCard';
import DatabaseService from '../services/databaseService';

const { width: SW } = Dimensions.get('window');
type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const FILTERS = ['ALL', 'BUY', 'SELL', 'HOLD'] as const;
type FilterType = typeof FILTERS[number];

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [predictions, setPredictions] = useState<CryptoPrediction[]>([]);
  const [filtered, setFiltered] = useState<CryptoPrediction[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, buy: 0, sell: 0, hold: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  useEffect(() => { loadData(); }, []);

  useFocusEffect(useCallback(() => {
    const refresh = async () => {
      const f = await DatabaseService.getFavorites();
      setFavorites(f);
      setPredictions(prev => sortByFavorites(prev, f));
    };
    refresh();
  }, []));

  useEffect(() => {
    if (activeFilter === 'ALL') {
      setFiltered(predictions);
    } else {
      setFiltered(predictions.filter(p => p.signal === activeFilter));
    }
  }, [activeFilter, predictions]);

  const sortByFavorites = (preds: CryptoPrediction[], favs: string[]) =>
    [...preds].sort((a: any, b: any) => {
      const af = favs.includes(a.crypto);
      const bf = favs.includes(b.crypto);
      if (af && !bf) return -1;
      if (!af && bf) return 1;
      return 0;
    });

  const loadData = async () => {
    await loadFavorites();
    await loadPredictions();
  };

  const loadFavorites = async () => setFavorites(await DatabaseService.getFavorites());

  const loadPredictions = async () => {
    try {
      setError(null);
      let arr = await APIService.getAllPredictions();
      const favs = await DatabaseService.getFavorites();
      arr = sortByFavorites(arr, favs);
      setPredictions(arr);
      setStats({
        total: arr.length,
        buy: arr.filter(p => p.signal === 'BUY').length,
        sell: arr.filter(p => p.signal === 'SELL').length,
        hold: arr.filter(p => p.signal === 'HOLD').length,
      });
    } catch (err) {
      setError('Failed to load. Check API connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    await DatabaseService.toggleFavorite(id);
    const f = await DatabaseService.getFavorites();
    setFavorites(f);
    setPredictions(prev => sortByFavorites(prev, f));
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    APIService.clearCache();
    loadData();
  }, []);

  const getFilterColor = (f: FilterType) => {
    if (f === 'BUY') return COLORS.success;
    if (f === 'SELL') return COLORS.danger;
    if (f === 'HOLD') return COLORS.warning;
    return COLORS.primary;
  };

  const getFilterCount = (f: FilterType) => {
    if (f === 'ALL') return stats.total;
    if (f === 'BUY') return stats.buy;
    if (f === 'SELL') return stats.sell;
    return stats.hold;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Title */}
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>CryptoAdviser</Text>
          <Text style={styles.subtitle}>CNN AI Trading Signals</Text>
        </View>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* Market Overview Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { borderColor: COLORS.primary + '30' }]}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Coins</Text>
        </View>
        <View style={[styles.statBox, { borderColor: COLORS.success + '30' }]}>
          <Text style={[styles.statValue, { color: COLORS.success }]}>{stats.buy}</Text>
          <Text style={styles.statLabel}>Buy</Text>
        </View>
        <View style={[styles.statBox, { borderColor: COLORS.danger + '30' }]}>
          <Text style={[styles.statValue, { color: COLORS.danger }]}>{stats.sell}</Text>
          <Text style={styles.statLabel}>Sell</Text>
        </View>
        <View style={[styles.statBox, { borderColor: COLORS.warning + '30' }]}>
          <Text style={[styles.statValue, { color: COLORS.warning }]}>{stats.hold}</Text>
          <Text style={styles.statLabel}>Hold</Text>
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => {
          const active = activeFilter === f;
          const color = getFilterColor(f);
          return (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                active && { backgroundColor: `${color}20`, borderColor: color },
              ]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, active && { color }]}>
                {f} ({getFilterCount(f)})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.loadingPulse}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
        <Text style={styles.loadingText}>Fetching CNN predictions...</Text>
        <Text style={styles.loadingHint}>Analyzing 5 coins across 3 timeframes</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <Text style={styles.errorIcon}>⚡</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <FlatList
        data={filtered}
        renderItem={({ item }) => (
          <CryptoCard
            crypto={item}
            onPress={() => navigation.navigate('Detail', { crypto: item })}
            isFavorite={favorites.includes(item.crypto)}
            onToggleFavorite={() => handleToggleFavorite(item.crypto)}
          />
        )}
        keyExtractor={item => item.crypto}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No {activeFilter} signals right now</Text>
          </View>
        }
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', padding: 32 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },

  // Header
  header: { paddingTop: 52, marginBottom: 8 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 30, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500', marginTop: 3, letterSpacing: 0.5 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,255,136,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,255,136,0.3)' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.success, marginRight: 5 },
  liveText: { fontSize: 11, fontWeight: '800', color: COLORS.success, letterSpacing: 1.2 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.primary, marginBottom: 2 },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },

  // Filters
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterChip: {
    flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  filterText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.3 },

  // Loading
  loadingPulse: { marginBottom: 16 },
  loadingText: { fontSize: 16, color: COLORS.text, fontWeight: '600', marginBottom: 4 },
  loadingHint: { fontSize: 12, color: COLORS.textSecondary },

  // Error
  errorIcon: { fontSize: 48, marginBottom: 12 },
  errorText: { fontSize: 15, color: COLORS.danger, textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: `${COLORS.primary}20`, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary },
  retryText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },

  // Empty
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary },
});

export default HomeScreen;
