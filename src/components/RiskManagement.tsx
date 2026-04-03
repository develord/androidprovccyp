// RiskManagement Component - Display risk management details (CNN compatible)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../config/theme';

interface RiskManagementProps {
  riskManagement: any;
  currentPrice: number;
}

const RiskManagement: React.FC<RiskManagementProps> = ({ riskManagement, currentPrice }) => {
  if (!riskManagement) return null;

  const tp = riskManagement.target_price || riskManagement.take_profit || 0;
  const sl = riskManagement.stop_loss || 0;
  const rr = riskManagement.risk_reward_ratio || 0;
  const gainPct = riskManagement.potential_gain_percent || riskManagement.take_profit_pct || 0;
  const lossPct = riskManagement.potential_loss_percent || riskManagement.stop_loss_pct || 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Risk Management</Text>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Current Price</Text>
          <Text style={[styles.value, { color: COLORS.primary }]}>
            ${(currentPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Target Price</Text>
          <Text style={[styles.value, { color: COLORS.success }]}>
            ${tp.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Stop Loss</Text>
          <Text style={[styles.value, { color: COLORS.danger }]}>
            ${sl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Risk:Reward</Text>
          <Text style={[styles.value, { color: rr >= 2 ? COLORS.success : COLORS.warning }]}>
            1:{rr.toFixed(2)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Potential Gain</Text>
          <Text style={[styles.value, { color: COLORS.success }]}>
            +{gainPct.toFixed(2)}%
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Potential Loss</Text>
          <Text style={[styles.value, { color: COLORS.danger }]}>
            -{lossPct.toFixed(2)}%
          </Text>
        </View>
      </View>

      {/* Visual Bar */}
      <View style={styles.barContainer}>
        <View style={styles.riskBar}>
          <View style={[styles.fill, { backgroundColor: COLORS.danger, opacity: 0.3 }]} />
          <Text style={styles.barLabel}>Risk</Text>
        </View>
        <View style={[styles.rewardBar, { flex: Math.max(rr, 0.5) }]}>
          <View style={[styles.fill, { backgroundColor: COLORS.success, opacity: 0.3 }]} />
          <Text style={styles.barLabel}>Reward</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.medium,
  },
  title: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text, marginBottom: SPACING.md },
  section: { marginBottom: SPACING.md, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.sm },
  label: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  value: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semibold },
  barContainer: { flexDirection: 'row', height: 40, borderRadius: BORDER_RADIUS.md, overflow: 'hidden', marginTop: SPACING.sm },
  riskBar: { flex: 1, backgroundColor: `${COLORS.danger}20`, justifyContent: 'center', alignItems: 'center' },
  rewardBar: { backgroundColor: `${COLORS.success}20`, justifyContent: 'center', alignItems: 'center' },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  barLabel: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text, zIndex: 1 },
});

export default RiskManagement;
