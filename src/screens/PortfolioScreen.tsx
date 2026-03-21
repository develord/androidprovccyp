// PortfolioScreen - Display all virtual trades with live price updates
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { RootStackParamList, VirtualTrade } from '../types';
import VirtualTradeService from '../services/virtualTradeService';
import BinanceService from '../services/binanceService';

type Props = NativeStackScreenProps<RootStackParamList, 'Portfolio'>;

const PortfolioScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const [trades, setTrades] = useState<VirtualTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');

  useFocusEffect(
    useCallback(() => {
      loadTrades();
    }, [filter])
  );

  const loadTrades = async () => {
    try {
      let allTrades: VirtualTrade[];

      if (filter === 'open') {
        allTrades = await VirtualTradeService.getOpenTrades();
      } else if (filter === 'closed') {
        allTrades = await VirtualTradeService.getClosedTrades();
      } else {
        allTrades = await VirtualTradeService.getAllTrades();
      }

      // Update prices for open trades
      const updatedTrades = await Promise.all(
        allTrades.map(async (trade) => {
          if (trade.status === 'open') {
            try {
              const currentPrice = await BinanceService.getCurrentPrice(trade.cryptoId);
              const updatedTrade = await VirtualTradeService.updateTradePrice(trade.id, currentPrice);
              return updatedTrade || trade;
            } catch (error) {
              console.error(`Error updating price for ${trade.symbol}:`, error);
              return trade;
            }
          }
          return trade;
        })
      );

      // Sort: open trades first, then by date
      updatedTrades.sort((a, b) => {
        if (a.status === 'open' && b.status !== 'open') return -1;
        if (a.status !== 'open' && b.status === 'open') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setTrades(updatedTrades);
    } catch (error) {
      console.error('Error loading trades:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTrades();
  };

  const handleTradePress = (trade: VirtualTrade) => {
    navigation.navigate('TradeDetail', { trade });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return COLORS.primary;
      case 'success': return COLORS.success;
      case 'failed': return COLORS.danger;
      case 'closed': return COLORS.textSecondary;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return t('tradeOpen');
      case 'success': return t('tradeSuccess');
      case 'failed': return t('tradeFailed');
      case 'closed': return t('tradeClosed');
      default: return status;
    }
  };

  const calculateStats = () => {
    const openTrades = trades.filter(t => t.status === 'open').length;
    const successTrades = trades.filter(t => t.status === 'success').length;
    const failedTrades = trades.filter(t => t.status === 'failed').length;

    const totalProfitLoss = trades.reduce((sum, trade) => {
      return sum + (trade.profitLoss || 0);
    }, 0);

    return { openTrades, successTrades, failedTrades, totalProfitLoss };
  };

  const stats = calculateStats();

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>{t('portfolio')}</Text>
      <Text style={styles.subtitle}>{t('virtualTrades')}</Text>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('openTrades')}</Text>
          <Text style={[styles.statValue, { color: COLORS.primary }]}>
            {stats.openTrades}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('totalPL')}</Text>
          <Text style={[
            styles.statValue,
            { color: stats.totalProfitLoss >= 0 ? COLORS.success : COLORS.danger }
          ]}>
            ${stats.totalProfitLoss.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('successful')}</Text>
          <Text style={[styles.statValue, { color: COLORS.success }]}>
            {stats.successTrades}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('failed')}</Text>
          <Text style={[styles.statValue, { color: COLORS.danger }]}>
            {stats.failedTrades}
          </Text>
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'all' && styles.filterButtonTextActive
          ]}>
            {t('all')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'open' && styles.filterButtonActive]}
          onPress={() => setFilter('open')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'open' && styles.filterButtonTextActive
          ]}>
            {t('open')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'closed' && styles.filterButtonActive]}
          onPress={() => setFilter('closed')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'closed' && styles.filterButtonTextActive
          ]}>
            {t('closed')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTradeCard = ({ item }: { item: VirtualTrade }) => {
    const profitLossPercent = item.profitLossPercent || 0;
    const profitLoss = item.profitLoss || 0;

    return (
      <TouchableOpacity
        style={styles.tradeCard}
        onPress={() => handleTradePress(item)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.tradeHeader}>
          <View style={styles.tradeSymbolContainer}>
            <Text style={styles.tradeSymbol}>
              {item.symbol.toUpperCase().replace('USDT', '/USDT')}
            </Text>
            <Text style={styles.tradeName}>{item.name}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: `${getStatusColor(item.status)}20` }
          ]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        {/* Signal & Confidence */}
        <View style={styles.tradeInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('signal')}</Text>
            <View style={[
              styles.signalBadge,
              {
                backgroundColor: item.signal === 'BUY' ? `${COLORS.success}20` :
                  item.signal === 'SELL' ? `${COLORS.danger}20` : `${COLORS.warning}20`
              }
            ]}>
              <Text style={[
                styles.signalText,
                {
                  color: item.signal === 'BUY' ? COLORS.success :
                    item.signal === 'SELL' ? COLORS.danger : COLORS.warning
                }
              ]}>
                {item.signal}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('confidence')}</Text>
            <Text style={styles.infoValue}>
              {(item.confidence * 100).toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Prices */}
        <View style={styles.pricesRow}>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>{t('entry')}</Text>
            <Text style={styles.priceValue}>${item.entryPrice.toFixed(2)}</Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>{t('current')}</Text>
            <Text style={styles.priceValue}>
              ${(item.currentPrice || item.entryPrice).toFixed(2)}
            </Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>{t('target')}</Text>
            <Text style={styles.priceValue}>${item.targetPrice.toFixed(2)}</Text>
          </View>
        </View>

        {/* Profit/Loss */}
        <View style={styles.profitLossContainer}>
          <Text style={styles.profitLossLabel}>{t('profitLoss')}</Text>
          <View style={styles.profitLossValues}>
            <Text style={[
              styles.profitLossValue,
              { color: profitLoss >= 0 ? COLORS.success : COLORS.danger }
            ]}>
              ${profitLoss.toFixed(2)}
            </Text>
            <Text style={[
              styles.profitLossPercent,
              { color: profitLossPercent >= 0 ? COLORS.success : COLORS.danger }
            ]}>
              ({profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%)
            </Text>
          </View>
        </View>

        {/* Date */}
        <Text style={styles.tradeDate}>
          {t('created')}: {new Date(item.createdAt).toLocaleString()}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📊</Text>
      <Text style={styles.emptyText}>{t('noTrades')}</Text>
      <Text style={styles.emptyHint}>{t('createTradeHint')}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('loadingTrades')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <FlatList
        data={trades}
        renderItem={renderTradeCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  listContent: {
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.extrabold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  filterButton: {
    flex: 1,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  filterButtonTextActive: {
    color: COLORS.background,
  },
  tradeCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  tradeSymbolContainer: {
    flex: 1,
  },
  tradeSymbol: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  tradeName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  tradeInfo: {
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  infoLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  signalBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  signalText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
  },
  pricesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  priceValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  profitLossContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  profitLossLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  profitLossValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  profitLossValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  profitLossPercent: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  tradeDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textDark,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyHint: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default PortfolioScreen;
