// TradeDetailScreen - Detailed view of a virtual trade with price history
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Alert,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { RootStackParamList, VirtualTrade } from '../types';
import VirtualTradeService from '../services/virtualTradeService';
import BinanceService from '../services/binanceService';
import { useLivePrice } from '../hooks/useLivePrice';
import tradeMonitoringService from '../services/tradeMonitoringService';

type Props = NativeStackScreenProps<RootStackParamList, 'TradeDetail'>;

const TradeDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { trade: initialTrade } = route.params;
  const { t } = useTranslation();
  const [trade, setTrade] = useState<VirtualTrade>(initialTrade);
  const [refreshing, setRefreshing] = useState(false);

  // Memoize the price update callback to prevent unnecessary re-subscriptions
  const handlePriceUpdate = useCallback(async (price: number) => {
    console.log(`[TradeDetail] Price update: ${price} for trade ${trade.id}`);
    // Update trade with live price
    const updatedTrade = await VirtualTradeService.updateTradePrice(trade.id, price);
    if (updatedTrade) {
      console.log(`[TradeDetail] Trade updated with new price`);
      setTrade(updatedTrade);
    }
  }, [trade.id]);

  // Use live WebSocket price updates for open trades
  const { price: livePrice, isConnected } = useLivePrice({
    symbol: trade.symbol,
    enabled: trade.status === 'open',
    onPriceUpdate: handlePriceUpdate,
  });

  useEffect(() => {
    // Initial price update for closed trades
    if (trade.status !== 'open') {
      updatePrice();
    }

    // Add trade to monitoring service (for background notifications)
    if (trade.status === 'open') {
      tradeMonitoringService.addTradeToMonitor(trade.id);
    }

    // Cleanup: remove from monitoring when leaving screen
    return () => {
      // Keep monitoring in background unless user manually closes trade
    };
  }, []);

  const updatePrice = async () => {
    if (trade.status === 'open') {
      try {
        const currentPrice = await BinanceService.getCurrentPrice(trade.cryptoId);
        const updatedTrade = await VirtualTradeService.updateTradePrice(trade.id, currentPrice);
        if (updatedTrade) {
          setTrade(updatedTrade);
        }
      } catch (error) {
        console.error('Error updating price:', error);
      }
    }
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    updatePrice();
  };

  const handleCloseTrade = () => {
    Alert.alert(
      t('closeTrade'),
      t('closeTradeConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('close'),
          style: 'destructive',
          onPress: async () => {
            const closedTrade = await VirtualTradeService.closeTrade(trade.id);
            if (closedTrade) {
              setTrade(closedTrade);
            }
          },
        },
      ]
    );
  };

  const handleDeleteTrade = () => {
    Alert.alert(
      t('deleteTrade'),
      t('deleteTradeConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            await VirtualTradeService.deleteTrade(trade.id);
            navigation.goBack();
          },
        },
      ]
    );
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

  const calculateProgress = () => {
    const currentPrice = trade.currentPrice || trade.entryPrice;
    const entry = trade.entryPrice;
    const target = trade.targetPrice;
    const stop = trade.stopLoss;

    if (trade.signal === 'BUY') {
      const range = target - entry;
      const current = currentPrice - entry;
      return (current / range) * 100;
    } else {
      const range = entry - target;
      const current = entry - currentPrice;
      return (current / range) * 100;
    }
  };

  const progress = calculateProgress();
  const profitLoss = trade.profitLoss || 0;
  const profitLossPercent = trade.profitLossPercent || 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{t('tradeDetails')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.cryptoInfo}>
            <Text style={styles.symbol}>
              {trade.symbol.toUpperCase().replace('USDT', '/USDT')}
            </Text>
            <Text style={styles.name}>{trade.name}</Text>
          </View>

          <View style={styles.statusRow}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(trade.status)}20` }
            ]}>
              <Text style={[styles.statusText, { color: getStatusColor(trade.status) }]}>
                {getStatusLabel(trade.status)}
              </Text>
            </View>

            {/* Live WebSocket Indicator */}
            {trade.status === 'open' && (
              <View style={[
                styles.liveIndicator,
                { backgroundColor: isConnected ? `${COLORS.success}20` : `${COLORS.textSecondary}20` }
              ]}>
                <View style={[
                  styles.liveDot,
                  { backgroundColor: isConnected ? COLORS.success : COLORS.textSecondary }
                ]} />
                <Text style={[
                  styles.liveText,
                  { color: isConnected ? COLORS.success : COLORS.textSecondary }
                ]}>
                  {isConnected ? 'LIVE' : 'OFFLINE'}
                </Text>
              </View>
            )}
          </View>

          {/* Signal & Confidence */}
          <View style={styles.signalRow}>
            <View style={styles.signalContainer}>
              <Text style={styles.label}>{t('signal')}</Text>
              <View style={[
                styles.signalBadge,
                {
                  backgroundColor: trade.signal === 'BUY' ? `${COLORS.success}20` :
                    trade.signal === 'SELL' ? `${COLORS.danger}20` : `${COLORS.warning}20`
                }
              ]}>
                <Text style={[
                  styles.signalText,
                  {
                    color: trade.signal === 'BUY' ? COLORS.success :
                      trade.signal === 'SELL' ? COLORS.danger : COLORS.warning
                  }
                ]}>
                  {trade.signal}
                </Text>
              </View>
            </View>

            <View style={styles.confidenceContainer}>
              <Text style={styles.label}>{t('confidence')}</Text>
              <Text style={styles.confidenceValue}>
                {(trade.confidence * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Profit/Loss Card */}
        <View style={styles.profitCard}>
          <Text style={styles.cardTitle}>{t('profitLoss')}</Text>
          <Text style={[
            styles.profitValue,
            { color: profitLoss >= 0 ? COLORS.success : COLORS.danger }
          ]}>
            ${profitLoss.toFixed(2)}
          </Text>
          <Text style={[
            styles.profitPercent,
            { color: profitLossPercent >= 0 ? COLORS.success : COLORS.danger }
          ]}>
            {profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>{t('progressToTarget')}</Text>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                {
                  width: `${Math.min(Math.max(progress, 0), 100)}%`,
                  backgroundColor: progress >= 100 ? COLORS.success :
                    progress >= 50 ? COLORS.primary : COLORS.warning
                }
              ]} />
            </View>
            <Text style={styles.progressValue}>{progress.toFixed(1)}%</Text>
          </View>
        </View>

        {/* Price Information Card */}
        <View style={styles.priceCard}>
          <Text style={styles.cardTitle}>{t('priceInformation')}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t('entryPrice')}</Text>
            <Text style={styles.priceValue}>${trade.entryPrice.toFixed(2)}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t('currentPrice')}</Text>
            <Text style={[styles.priceValue, { color: COLORS.primary }]}>
              ${(trade.currentPrice || trade.entryPrice).toFixed(2)}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t('targetPrice')}</Text>
            <Text style={[styles.priceValue, { color: COLORS.success }]}>
              ${trade.targetPrice.toFixed(2)}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t('stopLoss')}</Text>
            <Text style={[styles.priceValue, { color: COLORS.danger }]}>
              ${trade.stopLoss.toFixed(2)}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t('quantity')}</Text>
            <Text style={styles.priceValue}>{trade.quantity.toFixed(4)}</Text>
          </View>
        </View>

        {/* Price History Card */}
        {trade.priceHistory && trade.priceHistory.length > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.cardTitle}>{t('priceHistory')}</Text>

            {trade.priceHistory.slice().reverse().map((item, index) => {
              const isTarget = item.price >= trade.targetPrice && trade.signal === 'BUY' ||
                item.price <= trade.targetPrice && trade.signal === 'SELL';
              const isStopLoss = item.price <= trade.stopLoss && trade.signal === 'BUY' ||
                item.price >= trade.stopLoss && trade.signal === 'SELL';

              return (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyPrice}>${item.price.toFixed(2)}</Text>
                    <Text style={styles.historyTime}>
                      {new Date(item.timestamp).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.historyRight}>
                    {isTarget && (
                      <View style={[styles.indicator, { backgroundColor: COLORS.success }]}>
                        <Text style={styles.indicatorText}>🎯 {t('target')}</Text>
                      </View>
                    )}
                    {isStopLoss && (
                      <View style={[styles.indicator, { backgroundColor: COLORS.danger }]}>
                        <Text style={styles.indicatorText}>🛑 {t('stopLoss')}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Trade Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>{t('tradeInformation')}</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('created')}</Text>
            <Text style={styles.infoValue}>
              {new Date(trade.createdAt).toLocaleString()}
            </Text>
          </View>

          {trade.closedAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('closed')}</Text>
              <Text style={styles.infoValue}>
                {new Date(trade.closedAt).toLocaleString()}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('tradeId')}</Text>
            <Text style={styles.infoValue}>{trade.id}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {trade.status === 'open' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.closeButton]}
              onPress={handleCloseTrade}
            >
              <Text style={styles.closeButtonText}>{t('closeTrade')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteTrade}
          >
            <Text style={styles.deleteButtonText}>{t('deleteTrade')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.text,
  },
  navTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  headerCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.large,
  },
  cryptoInfo: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  symbol: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.extrabold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  name: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  statusText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 0.5,
  },
  signalRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  signalContainer: {
    alignItems: 'center',
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  signalBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  signalText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  confidenceContainer: {
    alignItems: 'center',
  },
  confidenceValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  profitCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  profitValue: {
    fontSize: FONT_SIZES.huge,
    fontWeight: FONT_WEIGHTS.extrabold,
    marginBottom: SPACING.xs,
  },
  profitPercent: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.lg,
  },
  progressContainer: {
    width: '100%',
    marginTop: SPACING.md,
  },
  progressLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.cardSecondary,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  progressFill: {
    height: '100%',
  },
  progressValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    textAlign: 'center',
  },
  priceCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  priceLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  historyCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  historyLeft: {
    flex: 1,
  },
  historyPrice: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  historyTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textDark,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  indicator: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  indicatorText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.background,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },
  actionButtons: {
    marginBottom: SPACING.md,
  },
  actionButton: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: COLORS.warning,
  },
  closeButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.background,
  },
  deleteButton: {
    backgroundColor: COLORS.cardSecondary,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  deleteButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.danger,
  },
});

export default TradeDetailScreen;
