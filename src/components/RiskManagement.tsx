// RiskManagement Component - Display risk management details
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { RiskManagement as RiskManagementType } from '../types';

interface RiskManagementProps {
  riskManagement: RiskManagementType;
  currentPrice: number;
}

const RiskManagement: React.FC<RiskManagementProps> = ({ riskManagement, currentPrice }) => {
  const renderRow = (label: string, value: string, color: string = COLORS.text) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  );

  const getGainLossColor = (percent: number) => {
    return percent >= 0 ? COLORS.success : COLORS.danger;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Risk Management</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Price Targets</Text>

        {renderRow(
          'Current Price',
          `$${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          COLORS.primary
        )}

        {renderRow(
          'Target Price',
          `$${riskManagement.target_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          COLORS.success
        )}

        {renderRow(
          'Stop Loss',
          `$${riskManagement.stop_loss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          COLORS.danger
        )}

        {riskManagement.take_profit && renderRow(
          'Take Profit',
          `$${riskManagement.take_profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          COLORS.warning
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Risk Analysis</Text>

        {renderRow(
          'Risk:Reward Ratio',
          `1:${riskManagement.risk_reward_ratio.toFixed(2)}`,
          riskManagement.risk_reward_ratio >= 2 ? COLORS.success : COLORS.warning
        )}

        {renderRow(
          'Potential Gain',
          `${riskManagement.potential_gain_percent > 0 ? '+' : ''}${riskManagement.potential_gain_percent.toFixed(2)}%`,
          getGainLossColor(riskManagement.potential_gain_percent)
        )}

        {renderRow(
          'Potential Loss',
          `${riskManagement.potential_loss_percent.toFixed(2)}%`,
          COLORS.danger
        )}
      </View>

      {/* Visual Risk:Reward Bar */}
      <View style={styles.visualSection}>
        <Text style={styles.sectionTitle}>Risk vs Reward</Text>
        <View style={styles.barContainer}>
          <View style={styles.riskBar}>
            <View style={[styles.riskFill, { backgroundColor: COLORS.danger }]} />
            <Text style={styles.barLabel}>Risk</Text>
          </View>
          <View style={[styles.rewardBar, { flex: riskManagement.risk_reward_ratio }]}>
            <View style={[styles.rewardFill, { backgroundColor: COLORS.success }]} />
            <Text style={styles.barLabel}>Reward</Text>
          </View>
        </View>
        <Text style={styles.barNote}>
          For every $1 risked, potential reward is ${riskManagement.risk_reward_ratio.toFixed(2)}
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
    ...SHADOWS.medium,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  section: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  visualSection: {
    marginTop: SPACING.sm,
  },
  barContainer: {
    flexDirection: 'row',
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    marginVertical: SPACING.sm,
  },
  riskBar: {
    flex: 1,
    backgroundColor: `${COLORS.danger}20`,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  rewardBar: {
    backgroundColor: `${COLORS.success}20`,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  riskFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  rewardFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  barLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    zIndex: 1,
  },
  barNote: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default RiskManagement;
