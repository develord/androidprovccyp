// Simulation IA Screen - AI Backtest Simulation
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import DatePicker from 'react-native-date-picker';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { RootStackParamList } from '../types';
import apiService from '../services/apiService';

type Props = NativeStackScreenProps<RootStackParamList, 'Simulation'>;

interface BacktestTrade {
  entry_date: string;
  exit_date: string;
  entry_price: number;
  exit_price: number;
  pnl_pct: number;
  pnl_usd: number;
  outcome: 'WIN' | 'LOSS' | 'OPEN';
  duration_hours: number;
}

interface BacktestMetrics {
  total_trades: number;
  win_trades: number;
  loss_trades: number;
  open_trades: number;
  win_rate: number;
  total_roi: number;
  avg_trade_roi: number;
  total_pnl_usd: number;
  sharpe_ratio: number;
  max_drawdown: number;
  avg_bars_held: number;
  expected_value: number;
}

interface BacktestResults {
  metrics: BacktestMetrics;
  trades: BacktestTrade[];
  total_candles: number;
  start_date: string;
  end_date: string;
}

const SimulationScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();

  // State for inputs
  const [selectedCrypto, setSelectedCrypto] = useState<'bitcoin' | 'ethereum' | 'solana'>('bitcoin');
  const [startDate, setStartDate] = useState(new Date('2024-01-01'));
  const [endDate, setEndDate] = useState(new Date('2024-12-31'));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // State for results
  const [results, setResults] = useState<BacktestResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cryptos = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', color: '#F7931A' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
    { id: 'solana', name: 'Solana', symbol: 'SOL', color: '#14F195' },
  ];

  const runBacktest = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.runBacktest({
        crypto: selectedCrypto,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        tp_pct: 1.5,
        sl_pct: 0.75,
        prob_threshold: 0.5,
      });

      setResults(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to run backtest');
      console.error('Backtest error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'WIN':
        return COLORS.success;
      case 'LOSS':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const renderHeader = () => (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryDark]}
      style={styles.header}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.headerTitle}>AI Simulation</Text>
      <Text style={styles.headerSubtitle}>Historical Performance Test</Text>

      {results && (
        <View style={styles.headerInfo}>
          <View style={styles.headerInfoItem}>
            <Text style={styles.headerInfoLabel}>Crypto</Text>
            <Text style={styles.headerInfoValue}>
              {cryptos.find(c => c.id === selectedCrypto)?.symbol}
            </Text>
          </View>
          <View style={styles.headerInfoItem}>
            <Text style={styles.headerInfoLabel}>Période</Text>
            <Text style={styles.headerInfoValue}>
              {formatDate(startDate)} - {formatDate(endDate)}
            </Text>
          </View>
        </View>
      )}
    </LinearGradient>
  );

  const renderCryptoSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Sélectionner la cryptomonnaie</Text>
      <View style={styles.cryptoButtons}>
        {cryptos.map((crypto) => (
          <TouchableOpacity
            key={crypto.id}
            style={[
              styles.cryptoButton,
              selectedCrypto === crypto.id && styles.cryptoButtonActive,
              { borderColor: crypto.color },
            ]}
            onPress={() => setSelectedCrypto(crypto.id as any)}
          >
            <Text
              style={[
                styles.cryptoButtonText,
                selectedCrypto === crypto.id && styles.cryptoButtonTextActive,
              ]}
            >
              {crypto.symbol}
            </Text>
            <Text style={styles.cryptoButtonName}>{crypto.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDatePickers = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Période de simulation</Text>

      <View style={styles.datePickersContainer}>
        <View style={styles.datePickerItem}>
          <Text style={styles.dateLabel}>Date de début</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={styles.dateButtonText}>{formatDate(startDate)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.datePickerItem}>
          <Text style={styles.dateLabel}>Date de fin</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndPicker(true)}
          >
            <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <DatePicker
        modal
        open={showStartPicker}
        date={startDate}
        mode="date"
        onConfirm={(date) => {
          setShowStartPicker(false);
          setStartDate(date);
        }}
        onCancel={() => setShowStartPicker(false)}
      />

      <DatePicker
        modal
        open={showEndPicker}
        date={endDate}
        mode="date"
        onConfirm={(date) => {
          setShowEndPicker(false);
          setEndDate(date);
        }}
        onCancel={() => setShowEndPicker(false)}
      />
    </View>
  );

  const renderRunButton = () => (
    <TouchableOpacity
      style={[styles.runButton, loading && styles.runButtonDisabled]}
      onPress={runBacktest}
      disabled={loading}
    >
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.runButtonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.runButtonText}>Lancer la simulation</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderMetrics = () => {
    if (!results) return null;

    const { metrics } = results;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Résultats</Text>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Trades</Text>
            <Text style={styles.metricValue}>{metrics.total_trades}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Win Rate</Text>
            <Text style={[styles.metricValue, { color: COLORS.success }]}>
              {(metrics.win_rate * 100).toFixed(1)}%
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total ROI</Text>
            <Text
              style={[
                styles.metricValue,
                { color: metrics.total_roi > 0 ? COLORS.success : COLORS.error },
              ]}
            >
              {metrics.total_roi > 0 ? '+' : ''}{metrics.total_roi.toFixed(2)}%
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Avg ROI/Trade</Text>
            <Text style={styles.metricValue}>{metrics.avg_trade_roi.toFixed(2)}%</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Wins</Text>
            <Text style={[styles.metricValue, { color: COLORS.success }]}>
              {metrics.win_trades}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Losses</Text>
            <Text style={[styles.metricValue, { color: COLORS.error }]}>
              {metrics.loss_trades}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Sharpe Ratio</Text>
            <Text style={styles.metricValue}>{metrics.sharpe_ratio.toFixed(2)}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Max Drawdown</Text>
            <Text style={[styles.metricValue, { color: COLORS.error }]}>
              {metrics.max_drawdown.toFixed(2)}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTrades = () => {
    if (!results || results.trades.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Trades ({results.trades.length})
        </Text>

        {results.trades.map((trade, index) => (
          <View key={index} style={styles.tradeCard}>
            <View style={styles.tradeHeader}>
              <View style={styles.tradeOutcome}>
                <View
                  style={[
                    styles.tradeOutcomeBadge,
                    { backgroundColor: getOutcomeColor(trade.outcome) },
                  ]}
                >
                  <Text style={styles.tradeOutcomeText}>{trade.outcome}</Text>
                </View>
                <Text style={styles.tradeDuration}>{trade.duration_hours}h</Text>
              </View>
              <Text
                style={[
                  styles.tradePnl,
                  { color: trade.pnl_pct > 0 ? COLORS.success : COLORS.error },
                ]}
              >
                {trade.pnl_pct > 0 ? '+' : ''}{trade.pnl_pct.toFixed(2)}%
              </Text>
            </View>

            <View style={styles.tradeDetails}>
              <View style={styles.tradeDetailRow}>
                <Text style={styles.tradeDetailLabel}>Entrée</Text>
                <Text style={styles.tradeDetailValue}>
                  {new Date(trade.entry_date).toLocaleDateString()} - $
                  {trade.entry_price.toFixed(2)}
                </Text>
              </View>
              <View style={styles.tradeDetailRow}>
                <Text style={styles.tradeDetailLabel}>Sortie</Text>
                <Text style={styles.tradeDetailValue}>
                  {new Date(trade.exit_date).toLocaleDateString()} - $
                  {trade.exit_price.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderError = () => {
    if (!error) return null;

    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderCryptoSelector()}
        {renderDatePickers()}
        {renderRunButton()}
        {renderError()}
        {renderMetrics()}
        {renderTrades()}
      </ScrollView>
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
    paddingTop: Platform.OS === 'android' ? SPACING.xl : SPACING.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    opacity: 0.9,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  headerInfoItem: {
    flex: 1,
  },
  headerInfoLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    opacity: 0.8,
    marginBottom: SPACING.xs,
  },
  headerInfoValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  cryptoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  cryptoButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  cryptoButtonActive: {
    backgroundColor: COLORS.primary + '20',
  },
  cryptoButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  cryptoButtonTextActive: {
    color: COLORS.primary,
  },
  cryptoButtonName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  datePickersContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  datePickerItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  dateButton: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    textAlign: 'center',
  },
  runButton: {
    marginBottom: SPACING.xl,
  },
  runButtonDisabled: {
    opacity: 0.6,
  },
  runButtonGradient: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  runButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  errorContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.error + '20',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  metricCard: {
    width: '48%',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small,
  },
  metricLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  metricValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  tradeCard: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  tradeOutcome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  tradeOutcomeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  tradeOutcomeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  tradeDuration: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  tradePnl: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  tradeDetails: {
    gap: SPACING.xs,
  },
  tradeDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tradeDetailLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  tradeDetailValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: FONT_WEIGHTS.medium,
  },
});

export default SimulationScreen;
