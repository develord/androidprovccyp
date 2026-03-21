// ActionAdvice Component - Trading advice based on signal
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { CryptoPrediction } from '../types';

interface ActionAdviceProps {
  prediction: CryptoPrediction;
}

const ActionAdvice: React.FC<ActionAdviceProps> = ({ prediction }) => {
  const getAdviceConfig = () => {
    const { signal, confidence, risk_management } = prediction;

    switch (signal) {
      case 'BUY':
        return {
          color: COLORS.success,
          icon: '📈',
          title: 'Buy Signal',
          mainAdvice: 'Consider entering a long position',
          tips: [
            `Strong confidence: ${(confidence * 100).toFixed(1)}%`,
            risk_management ? `Set stop loss at $${risk_management.stop_loss.toFixed(2)}` : 'Use proper stop loss',
            risk_management ? `Target price: $${risk_management.target_price.toFixed(2)}` : 'Set realistic target',
            'Monitor market conditions',
            'Consider position sizing based on risk tolerance',
          ],
        };

      case 'SELL':
        return {
          color: COLORS.danger,
          icon: '📉',
          title: 'Sell Signal',
          mainAdvice: 'Consider exiting or shorting',
          tips: [
            `Strong confidence: ${(confidence * 100).toFixed(1)}%`,
            risk_management ? `Set stop loss at $${risk_management.stop_loss.toFixed(2)}` : 'Use proper stop loss',
            risk_management ? `Target price: $${risk_management.target_price.toFixed(2)}` : 'Set realistic target',
            'Watch for reversal patterns',
            'Consider taking partial profits',
          ],
        };

      case 'HOLD':
        return {
          color: COLORS.warning,
          icon: '⏸️',
          title: 'Hold Signal',
          mainAdvice: 'Wait for clearer signal',
          tips: [
            'Market conditions are neutral',
            'No clear trend detected',
            'Monitor for breakout signals',
            'Patience is key in sideways markets',
            'Use this time to analyze other opportunities',
          ],
        };

      default:
        return {
          color: COLORS.textSecondary,
          icon: '❓',
          title: 'Unknown Signal',
          mainAdvice: 'Unable to provide advice',
          tips: ['Please refresh the data'],
        };
    }
  };

  const config = getAdviceConfig();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: `${config.color}20` }]}>
        <Text style={styles.icon}>{config.icon}</Text>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: config.color }]}>{config.title}</Text>
          <Text style={styles.mainAdvice}>{config.mainAdvice}</Text>
        </View>
      </View>

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Action Items:</Text>
        {config.tips.map((tip, index) => (
          <View key={index} style={styles.tipRow}>
            <View style={[styles.bullet, { backgroundColor: config.color }]} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      {prediction.signal !== 'HOLD' && (
        <View style={styles.warning}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Always perform your own research. This is not financial advice.
            Past performance does not guarantee future results.
          </Text>
        </View>
      )}

      {/* V6: Show detailed probabilities */}
      {prediction.probabilities && (
        <View style={styles.probabilitiesContainer}>
          <Text style={styles.probabilitiesTitle}>Signal Probabilities</Text>
          <View style={styles.probabilityRow}>
            <Text style={styles.probabilityLabel}>BUY</Text>
            <View style={styles.probabilityBar}>
              <View
                style={[
                  styles.probabilityFill,
                  {
                    width: `${prediction.probabilities.buy * 100}%`,
                    backgroundColor: COLORS.success
                  }
                ]}
              />
            </View>
            <Text style={styles.probabilityValue}>
              {(prediction.probabilities.buy * 100).toFixed(1)}%
            </Text>
          </View>
          <View style={styles.probabilityRow}>
            <Text style={styles.probabilityLabel}>SELL</Text>
            <View style={styles.probabilityBar}>
              <View
                style={[
                  styles.probabilityFill,
                  {
                    width: `${prediction.probabilities.sell * 100}%`,
                    backgroundColor: COLORS.danger
                  }
                ]}
              />
            </View>
            <Text style={styles.probabilityValue}>
              {(prediction.probabilities.sell * 100).toFixed(1)}%
            </Text>
          </View>
          <View style={styles.probabilityRow}>
            <Text style={styles.probabilityLabel}>HOLD</Text>
            <View style={styles.probabilityBar}>
              <View
                style={[
                  styles.probabilityFill,
                  {
                    width: `${prediction.probabilities.hold * 100}%`,
                    backgroundColor: COLORS.warning
                  }
                ]}
              />
            </View>
            <Text style={styles.probabilityValue}>
              {(prediction.probabilities.hold * 100).toFixed(1)}%
            </Text>
          </View>
        </View>
      )}

      {/* V11: Show model threshold */}
      {prediction.threshold && prediction.model_version && (
        <View style={styles.thresholdContainer}>
          <Text style={styles.thresholdTitle}>Model Information</Text>
          <View style={styles.thresholdRow}>
            <Text style={styles.thresholdLabel}>Model Version</Text>
            <Text style={styles.thresholdValue}>{prediction.model_version}</Text>
          </View>
          <View style={styles.thresholdRow}>
            <Text style={styles.thresholdLabel}>Optimal Threshold</Text>
            <Text style={styles.thresholdValue}>{(prediction.threshold * 100).toFixed(1)}%</Text>
          </View>
          <View style={styles.thresholdRow}>
            <Text style={styles.thresholdLabel}>P(Take Profit)</Text>
            <Text style={styles.thresholdValue}>{(prediction.confidence * 100).toFixed(1)}%</Text>
          </View>
        </View>
      )}
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
    ...SHADOWS.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  icon: {
    fontSize: 40,
    marginRight: SPACING.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs,
  },
  mainAdvice: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  tipsContainer: {
    marginBottom: SPACING.md,
  },
  tipsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: BORDER_RADIUS.round,
    marginTop: 6,
    marginRight: SPACING.sm,
  },
  tipText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  warning: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.warning}10`,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
    marginBottom: SPACING.md,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  warningText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  probabilitiesContainer: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  probabilitiesTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  probabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  probabilityLabel: {
    width: 50,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  probabilityBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.cardSecondary,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    marginHorizontal: SPACING.sm,
  },
  probabilityFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },
  probabilityValue: {
    width: 50,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: FONT_WEIGHTS.medium,
    textAlign: 'right',
  },
  thresholdContainer: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  thresholdTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  thresholdLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  thresholdValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: FONT_WEIGHTS.semibold,
  },
});

export default ActionAdvice;
