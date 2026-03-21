// PriceChart Component - Display price chart
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
// import { LineChart } from 'react-native-chart-kit';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../config/theme';
import { BinanceKline } from '../types';
import BinanceService from '../services/binanceService';

interface PriceChartProps {
  crypto: string;
  interval?: '1h' | '4h' | '1d' | '1w';
  limit?: number;
}

const PriceChart: React.FC<PriceChartProps> = ({ crypto, interval = '1h', limit = 24 }) => {
  const [klines, setKlines] = useState<BinanceKline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChartData();
  }, [crypto, interval]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await BinanceService.getKlines(crypto, interval, limit);
      setKlines(data);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError('Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || klines.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || 'No data available'}</Text>
      </View>
    );
  }

  // Prepare data for chart
  const prices = klines.map(k => parseFloat(k.close));
  const labels = klines.map((k, index) => {
    if (index % Math.floor(klines.length / 6) === 0) {
      const date = new Date(k.closeTime);
      return `${date.getHours()}:00`;
    }
    return '';
  });

  // Calculate min and max for better visualization
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const yMin = minPrice - (priceRange * 0.1);
  const yMax = maxPrice + (priceRange * 0.1);

  const chartData = {
    labels,
    datasets: [
      {
        data: prices,
        color: (opacity = 1) => COLORS.primary,
        strokeWidth: 2,
      },
    ],
  };

  const screenWidth = Dimensions.get('window').width - (SPACING.md * 2);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Price Chart ({interval})</Text>
        <View style={styles.priceInfo}>
          <Text style={styles.currentPrice}>
            ${prices[prices.length - 1].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={[
            styles.priceChange,
            { color: prices[prices.length - 1] >= prices[0] ? COLORS.success : COLORS.danger }
          ]}>
            {prices[prices.length - 1] >= prices[0] ? '+' : ''}
            {(((prices[prices.length - 1] - prices[0]) / prices[0]) * 100).toFixed(2)}%
          </Text>
        </View>
      </View>

      <View style={styles.chartPlaceholder}>
        <Text style={styles.placeholderText}>
          Price range: ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}
        </Text>
        <Text style={styles.placeholderSubtext}>
          Chart visualization temporarily disabled
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
  },
  currentPrice: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  priceChange: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  chart: {
    borderRadius: BORDER_RADIUS.lg,
    marginLeft: -SPACING.md,
  },
  chartPlaceholder: {
    backgroundColor: COLORS.cardSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  placeholderText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.sm,
  },
  placeholderSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.danger,
    textAlign: 'center',
    padding: SPACING.lg,
  },
});

export default PriceChart;
