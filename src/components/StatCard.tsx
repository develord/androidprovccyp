// StatCard Component - Display statistics
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../config/theme';

interface StatCardProps {
  label: string;
  value: number | string;
  color?: string;
  percentage?: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color = COLORS.primary, percentage }) => {
  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <View style={[styles.dot, { backgroundColor: color }]} />
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color }]}>{value}</Text>
        {percentage !== undefined && (
          <Text style={styles.percentage}>{percentage.toFixed(1)}%</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: BORDER_RADIUS.round,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  value: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  percentage: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textDark,
    marginTop: SPACING.xs,
  },
});

export default StatCard;
