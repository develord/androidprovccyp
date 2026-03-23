// AutoTradingScreen - Automated trading dashboard with V11 model
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Switch,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { RootStackParamList, VirtualTrade } from '../types';
import autoTradingService from '../services/autoTradingService';
import virtualTradeService from '../services/virtualTradeService';
import binanceWebSocketService from '../services/binanceWebSocketService';
import autoTradingBackgroundService from '../services/autoTradingBackgroundService';

type Props = NativeStackScreenProps<RootStackParamList, 'Portfolio'>;

const AutoTradingScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const [isAutoTradingEnabled, setIsAutoTradingEnabled] = useState(false);
  const [stats, setStats] = useState(autoTradingService.getStats());
  const [trades, setTrades] = useState<VirtualTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'active' | 'closed'>('active');
  const [livePrices, setLivePrices] = useState<Map<string, number>>(new Map());
  const lastUpdateRef = useRef<number>(0);
  const pendingPricesRef = useRef<Map<string, number>>(new Map());
  const subscriptionsRef = useRef<Map<string, (symbol: string, price: number) => void>>(new Map());

  useFocusEffect(
    useCallback(() => {
      loadData();
      subscribeToActiveTrades();
      const interval = setInterval(loadData, 5000); // Refresh every 5s
      return () => {
        clearInterval(interval);
        unsubscribeFromAllTrades();
      };
    }, [filter])
  );

  // Subscribe to WebSocket for active trades
  const subscribeToActiveTrades = async () => {
    try {
      const activeTrades = await virtualTradeService.getOpenTrades();

      activeTrades.forEach(trade => {
        // Create callback for this trade
        const callback = (symbol: string, price: number) => {
          // Store price in pending map (no re-render)
          pendingPricesRef.current.set(symbol, price);

          // Throttle updates to max 1 per second
          const now = Date.now();
          if (now - lastUpdateRef.current >= 1000) {
            lastUpdateRef.current = now;
            // Apply all pending price updates at once
            setLivePrices(new Map(pendingPricesRef.current));
          }

          // Update trade price in background
          virtualTradeService.updateTradePrice(trade.id, price);
        };

        // Store callback reference
        subscriptionsRef.current.set(trade.symbol, callback);

        // Subscribe with the stored callback
        binanceWebSocketService.subscribe(trade.symbol, callback);
      });
    } catch (error) {
      console.error('[AutoTradingScreen] Error subscribing to trades:', error);
    }
  };

  // Unsubscribe from all WebSocket connections
  const unsubscribeFromAllTrades = () => {
    // Unsubscribe only our own callbacks
    subscriptionsRef.current.forEach((callback, symbol) => {
      binanceWebSocketService.unsubscribe(symbol, callback);
    });
    subscriptionsRef.current.clear();
  };

  // Calculate real-time budget and P&L
  const calculateRealTimeStats = useCallback(() => {
    if (trades.length === 0) return stats;

    let totalPL = 0;

    trades.forEach(trade => {
      if (trade.status === 'open') {
        // Calculate real-time P&L for active trades
        const livePrice = livePrices.get(trade.symbol);
        const currentPrice = livePrice || trade.currentPrice;

        if (currentPrice) {
          const priceDiff = currentPrice - trade.entryPrice;
          const quantity = trade.quantity || 0;
          const tradePL = trade.signal === 'BUY' ? priceDiff * quantity : -priceDiff * quantity;
          totalPL += tradePL;
        }
      } else {
        // Use stored P&L for closed trades
        totalPL += trade.profitLoss || 0;
      }
    });

    return {
      ...stats,
      currentBudget: stats.initialBudget + totalPL,
      totalProfitLoss: totalPL,
    };
  }, [trades, livePrices, stats]);

  const loadData = async () => {
    try {
      // Update stats
      const currentStats = autoTradingService.getStats();
      setStats(currentStats);

      // Update trading state
      setIsAutoTradingEnabled(autoTradingService.isRunning());

      // Load trades
      let allTrades: VirtualTrade[];
      if (filter === 'active') {
        allTrades = await virtualTradeService.getOpenTrades();
      } else {
        allTrades = await virtualTradeService.getClosedTrades();
      }

      // Sort by date
      allTrades.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setTrades(allTrades);
    } catch (error) {
      console.error('[AutoTradingScreen] Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleAutoTrading = async () => {
    console.log('[AutoTradingScreen] Toggle called, current state:', isAutoTradingEnabled);
    if (isAutoTradingEnabled) {
      // Stop background service (runs in background even when app closed)
      console.log('[AutoTradingScreen] Stopping auto trading...');
      autoTradingBackgroundService.stopBackgroundService();
      await autoTradingService.stop();
      setIsAutoTradingEnabled(false);
    } else {
      // Start background service (runs in background even when app closed)
      console.log('[AutoTradingScreen] Starting auto trading...');
      autoTradingBackgroundService.startBackgroundService();
      await autoTradingService.start();
      setIsAutoTradingEnabled(true);
      console.log('[AutoTradingScreen] Auto trading started successfully');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleTradePress = (trade: VirtualTrade) => {
    navigation.navigate('TradeDetail', { trade });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return COLORS.primary;
      case 'success': return COLORS.success;
      case 'failed': return COLORS.danger;
      default: return COLORS.textSecondary;
    }
  };

  const renderStatsCard = () => {
    const realTimeStats = calculateRealTimeStats();

    return (
      <View style={styles.statsCard}>
        {/* Auto Trading Toggle */}
        <View style={styles.toggleContainer}>
          <View>
            <Text style={styles.toggleTitle}>🤖 Auto Trading</Text>
            <Text style={styles.toggleSubtitle}>
              {isAutoTradingEnabled ? 'System Active - Monitoring markets' : 'System Inactive'}
            </Text>
          </View>
          <Switch
            value={isAutoTradingEnabled}
            onValueChange={toggleAutoTrading}
            trackColor={{ false: COLORS.textSecondary + '40', true: COLORS.success + '80' }}
            thumbColor={isAutoTradingEnabled ? COLORS.success : COLORS.textSecondary}
          />
        </View>

        {/* Budget Stats */}
        <View style={styles.budgetSection}>
          <View style={styles.budgetRow}>
            <View style={styles.budgetItem}>
              <Text style={styles.budgetLabel}>Initial Budget</Text>
              <Text style={styles.budgetValue}>${realTimeStats.initialBudget.toLocaleString()}</Text>
            </View>
            <View style={styles.budgetItem}>
              <Text style={styles.budgetLabel}>Current Budget</Text>
              <Text style={[
                styles.budgetValue,
                { color: realTimeStats.totalProfitLoss >= 0 ? COLORS.success : COLORS.danger }
              ]}>
                ${realTimeStats.currentBudget.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.budgetRow}>
            <View style={styles.budgetItem}>
              <Text style={styles.budgetLabel}>Total P&L</Text>
              <Text style={[
                styles.profitLoss,
                { color: realTimeStats.totalProfitLoss >= 0 ? COLORS.success : COLORS.danger }
              ]}>
                {realTimeStats.totalProfitLoss >= 0 ? '+' : ''}${realTimeStats.totalProfitLoss.toFixed(2)}
                {' '}({((realTimeStats.totalProfitLoss / realTimeStats.initialBudget) * 100).toFixed(2)}%)
              </Text>
            </View>
          </View>
        </View>

        {/* Trading Stats */}
        <View style={styles.tradingStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalTrades}</Text>
            <Text style={styles.statLabel}>Total Trades</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>{stats.winningTrades}</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.danger }]}>{stats.losingTrades}</Text>
            <Text style={styles.statLabel}>Losses</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[
              styles.statValue,
              { color: stats.winRate >= 50 ? COLORS.success : COLORS.danger }
            ]}>
              {stats.winRate.toFixed(1)}%
            </Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTradeItem = ({ item }: { item: VirtualTrade }) => {
    // Get live price if available
    const livePrice = livePrices.get(item.symbol);
    const currentPrice = item.status === 'open' && livePrice ? livePrice : item.currentPrice;

    // Calculate P&L in real-time
    let profitLoss = item.profitLoss || 0;
    let profitLossPercent = item.profitLossPercent || 0;

    if (item.status === 'open' && currentPrice) {
      const priceDiff = currentPrice - item.entryPrice;
      const quantity = item.quantity || 0;

      if (item.signal === 'BUY') {
        profitLoss = priceDiff * quantity;
      } else {
        profitLoss = -priceDiff * quantity;
      }

      profitLossPercent = (profitLoss / (item.entryPrice * quantity)) * 100;
    }

    const isProfitable = profitLoss >= 0;

    return (
      <TouchableOpacity
        style={styles.tradeCard}
        onPress={() => handleTradePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.tradeHeader}>
          <View>
            <Text style={styles.tradeCrypto}>{item.cryptoName}</Text>
            <Text style={styles.tradeSymbol}>{item.symbol}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' }
          ]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.tradeDetails}>
          <View style={styles.tradeRow}>
            <Text style={styles.tradeLabel}>Signal:</Text>
            <Text style={[
              styles.tradeSignal,
              { color: item.signal === 'BUY' ? COLORS.success : COLORS.danger }
            ]}>
              {item.signal}
            </Text>
          </View>
          <View style={styles.tradeRow}>
            <Text style={styles.tradeLabel}>Entry:</Text>
            <Text style={styles.tradeValue}>${item.entryPrice.toFixed(2)}</Text>
          </View>
          {currentPrice && (
            <View style={styles.tradeRow}>
              <Text style={styles.tradeLabel}>Current:</Text>
              <Text style={styles.tradeValue}>
                ${currentPrice.toFixed(2)}
                {item.status === 'open' && livePrice && (
                  <Text style={styles.liveIndicator}> ● LIVE</Text>
                )}
              </Text>
            </View>
          )}
        </View>

        {/* Show P&L for both active and closed trades */}
        <View style={styles.profitLossContainer}>
          <Text style={[
            styles.profitLossText,
            { color: isProfitable ? COLORS.success : COLORS.danger }
          ]}>
            {isProfitable ? '+' : ''}${profitLoss.toFixed(2)}
            {' '}({isProfitable ? '+' : ''}{profitLossPercent.toFixed(2)}%)
          </Text>
        </View>

        <View style={styles.tradeFooter}>
          <Text style={styles.tradeDate}>
            {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading auto trading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primary + 'CC']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Auto Trading</Text>
        <Text style={styles.headerSubtitle}>AI-Powered Trading System</Text>
      </LinearGradient>

      <FlatList
        ListHeaderComponent={
          <>
            {renderStatsCard()}

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
                onPress={() => setFilter('active')}
              >
                <Text style={[
                  styles.filterText,
                  filter === 'active' && styles.filterTextActive
                ]}>
                  Active ({trades.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, filter === 'closed' && styles.filterTabActive]}
                onPress={() => setFilter('closed')}
              >
                <Text style={[
                  styles.filterText,
                  filter === 'closed' && styles.filterTextActive
                ]}>
                  Closed
                </Text>
              </TouchableOpacity>
            </View>
          </>
        }
        data={trades}
        renderItem={renderTradeItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {filter === 'active'
                ? '🤖 No active trades\n\nEnable auto trading to start'
                : '📊 No closed trades yet'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white + 'CC',
  },
  statsCard: {
    backgroundColor: COLORS.cardBackground,
    margin: SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  toggleTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  toggleSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  budgetSection: {
    marginBottom: SPACING.lg,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  budgetItem: {
    flex: 1,
  },
  budgetLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  budgetValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
  },
  profitLoss: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold as any,
  },
  tradingStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBackground,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  tradeCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  tradeCrypto: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
  },
  tradeSymbol: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
  tradeDetails: {
    marginBottom: SPACING.md,
  },
  tradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  tradeLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  tradeValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text,
  },
  tradeSignal: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
  liveIndicator: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
  profitLossContainer: {
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  profitLossText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold as any,
    textAlign: 'right',
  },
  tradeFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  tradeDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default AutoTradingScreen;
