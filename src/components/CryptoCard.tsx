// CryptoCard Component - Display crypto in list
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { CryptoPrediction } from '../types';

interface CryptoCardProps {
  crypto: CryptoPrediction;
  onPress: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const CryptoCard: React.FC<CryptoCardProps> = ({ crypto, onPress, isFavorite = false, onToggleFavorite }) => {
  const formatSymbol = (symbol: string) => {
    return symbol.toUpperCase().replace('USDT', '/USDT');
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return COLORS.success;
      case 'SELL':
        return COLORS.danger;
      case 'HOLD':
        return COLORS.warning;
      default:
        return COLORS.textSecondary;
    }
  };

  const getSignalBackgroundColor = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return `${COLORS.success}20`;
      case 'SELL':
        return `${COLORS.danger}20`;
      case 'HOLD':
        return `${COLORS.warning}20`;
      default:
        return `${COLORS.textSecondary}20`;
    }
  };

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite();
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <View style={styles.symbolRow}>
            <Text style={styles.symbol}>{formatSymbol(crypto.symbol)}</Text>
            {onToggleFavorite && (
              <TouchableOpacity onPress={handleFavoritePress} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.favoriteIcon}>{isFavorite ? '⭐' : '☆'}</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.name}>{crypto.name}</Text>
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.price}>${crypto.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={[styles.signalBadge, { backgroundColor: getSignalBackgroundColor(crypto.signal) }]}>
          <Text style={[styles.signalText, { color: getSignalColor(crypto.signal) }]}>
            {crypto.signal}
          </Text>
        </View>

        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceLabel}>Confidence</Text>
          <View style={styles.confidenceBar}>
            <View
              style={[
                styles.confidenceFill,
                {
                  width: `${crypto.confidence * 100}%`,
                  backgroundColor: getSignalColor(crypto.signal)
                }
              ]}
            />
          </View>
          <Text style={styles.confidenceValue}>{(crypto.confidence * 100).toFixed(1)}%</Text>
        </View>
      </View>

      {crypto.risk_management && (
        <View style={styles.riskPreview}>
          <View style={styles.riskItem}>
            <Text style={styles.riskLabel}>Target</Text>
            <Text style={styles.riskValue}>${crypto.risk_management.target_price.toFixed(2)}</Text>
          </View>
          <View style={styles.riskItem}>
            <Text style={styles.riskLabel}>Stop Loss</Text>
            <Text style={styles.riskValue}>${crypto.risk_management.stop_loss.toFixed(2)}</Text>
          </View>
          <View style={styles.riskItem}>
            <Text style={styles.riskLabel}>R:R</Text>
            <Text style={[styles.riskValue, { color: COLORS.primary }]}>
              {crypto.risk_management.risk_reward_ratio.toFixed(2)}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  leftSection: {
    flex: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  symbol: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  favoriteIcon: {
    fontSize: FONT_SIZES.xl,
    lineHeight: FONT_SIZES.xl + 4,
  },
  name: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  price: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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
    flex: 1,
    marginLeft: SPACING.md,
  },
  confidenceLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  confidenceBar: {
    height: 6,
    backgroundColor: COLORS.cardSecondary,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },
  confidenceValue: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
    textAlign: 'right',
  },
  riskPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  riskItem: {
    alignItems: 'center',
  },
  riskLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  riskValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
});

export default CryptoCard;
