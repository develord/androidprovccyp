import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../config/theme';
import APIService from '../services/apiService';

interface Signal {
  id: number;
  coin: string;
  direction: 'LONG' | 'SHORT';
  confidence: number;
  price: number;
  tp_pct: number;
  sl_pct: number;
  result: 'TP' | 'SL' | 'CLOSED' | null;
  exit_price: number | null;
  pnl_pct: number | null;
  created_at: string;
  closed_at: string | null;
}

interface Stats {
  total: number;
  wins: number;
  losses: number;
  pending: number;
  avg_pnl: number;
  win_rate: number;
}

const COIN_ICONS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  DEFAULT: 'currency-usd',
};

const SignalHistoryScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await APIService.getSignalHistory(filter);
      setSignals(data.signals);
      setStats(data.stats);
    } catch (e) {
      console.error('Failed to load signal history:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getResultColor = (result: string | null) => {
    if (result === 'TP') return COLORS.success;
    if (result === 'SL') return COLORS.danger;
    if (result === 'CLOSED') return COLORS.warning;
    return COLORS.textSecondary;
  };

  const getResultLabel = (result: string | null) => {
    if (result === 'TP') return t('signalTP');
    if (result === 'SL') return t('signalSL');
    if (result === 'CLOSED') return t('signalClosed');
    return t('signalPending');
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    if (diffH < 1) return `${Math.floor(diffMs / 60000)}m ago`;
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString();
  };

  const coins = [...new Set(signals.map(s => s.coin))];

  const renderStatsCard = () => {
    if (!stats) return null;
    return (
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>{t('signalStats')}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>{t('signalTotal')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>{stats.wins}</Text>
            <Text style={styles.statLabel}>{t('signalWins')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.danger }]}>{stats.losses}</Text>
            <Text style={styles.statLabel}>{t('signalLosses')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>{stats.win_rate}%</Text>
            <Text style={styles.statLabel}>{t('signalWinRate')}</Text>
          </View>
        </View>
        {stats.avg_pnl !== 0 && (
          <View style={styles.avgPnlRow}>
            <Text style={styles.statLabel}>{t('signalAvgPnl')}</Text>
            <Text style={[styles.avgPnlValue, { color: stats.avg_pnl >= 0 ? COLORS.success : COLORS.danger }]}>
              {stats.avg_pnl >= 0 ? '+' : ''}{stats.avg_pnl}%
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderFilter = () => (
    <View style={styles.filterRow}>
      <TouchableOpacity
        style={[styles.filterChip, !filter && styles.filterChipActive]}
        onPress={() => setFilter(null)}>
        <Text style={[styles.filterText, !filter && styles.filterTextActive]}>{t('all')}</Text>
      </TouchableOpacity>
      {coins.map(coin => (
        <TouchableOpacity
          key={coin}
          style={[styles.filterChip, filter === coin && styles.filterChipActive]}
          onPress={() => setFilter(filter === coin ? null : coin)}>
          <Text style={[styles.filterText, filter === coin && styles.filterTextActive]}>{coin}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSignal = ({ item }: { item: Signal }) => {
    const isLong = item.direction === 'LONG';
    const dirColor = isLong ? COLORS.success : COLORS.danger;
    const resultColor = getResultColor(item.result);

    return (
      <View style={styles.signalCard}>
        <View style={styles.signalHeader}>
          <View style={styles.coinRow}>
            <Icon
              name={COIN_ICONS[item.coin] || COIN_ICONS.DEFAULT}
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.coinName}>{item.coin}</Text>
            <View style={[styles.dirBadge, { backgroundColor: dirColor + '20' }]}>
              <Icon name={isLong ? 'trending-up' : 'trending-down'} size={14} color={dirColor} />
              <Text style={[styles.dirText, { color: dirColor }]}>{item.direction}</Text>
            </View>
          </View>
          <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
        </View>

        <View style={styles.signalBody}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>{t('confidence')}</Text>
            <Text style={styles.infoValue}>{(item.confidence * 100).toFixed(0)}%</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>{t('entryPrice')}</Text>
            <Text style={styles.infoValue}>${item.price.toLocaleString()}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>{t('target')}</Text>
            <Text style={[styles.infoValue, { color: COLORS.success }]}>+{item.tp_pct}%</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>{t('stopLoss')}</Text>
            <Text style={[styles.infoValue, { color: COLORS.danger }]}>-{item.sl_pct}%</Text>
          </View>
        </View>

        <View style={styles.resultRow}>
          <View style={[styles.resultBadge, { backgroundColor: resultColor + '20' }]}>
            <View style={[styles.resultDot, { backgroundColor: resultColor }]} />
            <Text style={[styles.resultText, { color: resultColor }]}>{getResultLabel(item.result)}</Text>
          </View>
          {item.pnl_pct !== null && (
            <Text style={[styles.pnlText, { color: item.pnl_pct >= 0 ? COLORS.success : COLORS.danger }]}>
              {item.pnl_pct >= 0 ? '+' : ''}{item.pnl_pct.toFixed(2)}%
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{t('signalHistory')}</Text>
          <Text style={styles.headerSubtitle}>{t('signalHistorySubtitle')}</Text>
        </View>
      </View>

      <FlatList
        data={signals}
        keyExtractor={item => item.id.toString()}
        renderItem={renderSignal}
        ListHeaderComponent={
          <>
            {renderStatsCard()}
            {coins.length > 1 && renderFilter()}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="chart-timeline-variant" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>{t('noSignalHistory')}</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl + 16,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  statsCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  statsTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  avgPnlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  avgPnlValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: COLORS.primary,
  },
  signalCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  signalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  coinName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  dirBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  dirText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  timeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  signalBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoCol: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: 6,
  },
  resultDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  resultText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  pnlText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    gap: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
});

export default SignalHistoryScreen;
