// TechnicalAnalysis — Template-based technical analysis display
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SHADOWS } from '../config/theme';

interface Props {
  analysis: any;
  loading: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  strong_bullish: COLORS.success,
  bullish: COLORS.success,
  overbought: COLORS.warning,
  bearish: COLORS.danger,
  strong_bearish: COLORS.danger,
  oversold: COLORS.warning,
  neutral: COLORS.textSecondary,
  upper_band: COLORS.success,
  lower_band: COLORS.danger,
  high: COLORS.warning,
  low: COLORS.primary,
  normal: COLORS.textSecondary,
  weak: COLORS.textDark,
  strong: COLORS.success,
  very_strong: COLORS.success,
  ranging: COLORS.warning,
};

const STATUS_ICON: Record<string, string> = {
  strong_bullish: 'arrow-up-bold',
  bullish: 'trending-up',
  overbought: 'alert-circle',
  bearish: 'trending-down',
  strong_bearish: 'arrow-down-bold',
  oversold: 'alert-circle-outline',
  neutral: 'minus',
  high: 'flash',
  low: 'sleep',
  normal: 'minus',
  ranging: 'swap-horizontal',
};

const SkeletonBar = ({ width, height = 14 }: { width: number | string; height?: number }) => (
  <View style={[{ width: width as any, height, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 6 }]} />
);

const Gauge = ({ value, max, color, label }: { value: number | null; max: number; color: string; label: string }) => {
  if (value === null || value === undefined) return null;
  const pct = Math.min(Math.max(value / max, 0), 1) * 100;
  return (
    <View style={g.row}>
      <Text style={g.label}>{label}</Text>
      <View style={g.barOuter}>
        <View style={[g.barInner, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[g.value, { color }]}>{typeof value === 'number' ? value.toFixed(1) : value}</Text>
    </View>
  );
};

const TechnicalAnalysis: React.FC<Props> = ({ analysis, loading }) => {
  if (loading) {
    return (
      <View style={s.card}>
        <View style={s.header}>
          <Icon name="chart-box-outline" size={20} color={COLORS.primary} />
          <Text style={s.title}>Technical Analysis</Text>
        </View>
        <View style={{ gap: 12, paddingVertical: 8 }}>
          <SkeletonBar width="100%" height={60} />
          <SkeletonBar width="80%" height={12} />
          <SkeletonBar width="60%" height={12} />
        </View>
      </View>
    );
  }

  if (!analysis) return null;

  const { overall, trend, momentum, volatility, volume, regime, levels } = analysis;
  const overallColor = STATUS_COLOR[overall?.status] || COLORS.textSecondary;
  const overallIcon = STATUS_ICON[overall?.status] || 'minus';

  const formatStatus = (st: string) => st?.replace(/_/g, ' ').toUpperCase() || 'N/A';

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.header}>
        <Icon name="chart-box-outline" size={20} color={COLORS.primary} />
        <Text style={s.title}>Technical Analysis</Text>
      </View>

      {/* Overall Score */}
      <View style={[s.overallBox, { borderColor: `${overallColor}40`, backgroundColor: `${overallColor}08` }]}>
        <Icon name={overallIcon} size={28} color={overallColor} />
        <View style={s.overallCenter}>
          <Text style={[s.overallLabel, { color: overallColor }]}>{formatStatus(overall?.status)}</Text>
          <Text style={s.overallSub}>Score: {overall?.score || 0}/5</Text>
        </View>
        <View style={[s.scoreBadge, { backgroundColor: `${overallColor}15` }]}>
          <Text style={[s.scoreText, { color: overallColor }]}>{overall?.score > 0 ? '+' : ''}{overall?.score || 0}</Text>
        </View>
      </View>

      {/* Trend */}
      <View style={s.section}>
        <View style={s.sectionHead}>
          <Icon name="trending-up" size={16} color={COLORS.primary} />
          <Text style={s.sectionTitle}>Trend</Text>
          <View style={[s.statusPill, { backgroundColor: `${STATUS_COLOR[trend?.status] || COLORS.textSecondary}15` }]}>
            <Text style={[s.statusText, { color: STATUS_COLOR[trend?.status] || COLORS.textSecondary }]}>
              {formatStatus(trend?.status)}
            </Text>
          </View>
        </View>
        <View style={s.metricsGrid}>
          <MetricBox label="SMA 50" value={trend?.sma50?.toFixed(2)} />
          <MetricBox label="SMA 200" value={trend?.sma200?.toFixed(2)} />
          <MetricBox label="Dist SMA20" value={trend?.dist_sma20_pct ? `${(trend.dist_sma20_pct * 100).toFixed(1)}%` : null}
            color={trend?.dist_sma20_pct > 0 ? COLORS.success : COLORS.danger} />
          <MetricBox label="Trend Score" value={trend?.trend_score?.toFixed(1)} />
        </View>
        {trend?.golden_cross && (
          <View style={s.eventBadge}>
            <Icon name="star" size={12} color={COLORS.success} />
            <Text style={[s.eventText, { color: COLORS.success }]}>Golden Cross (5d)</Text>
          </View>
        )}
        {trend?.death_cross && (
          <View style={s.eventBadge}>
            <Icon name="skull-crossbones" size={12} color={COLORS.danger} />
            <Text style={[s.eventText, { color: COLORS.danger }]}>Death Cross (5d)</Text>
          </View>
        )}
      </View>

      {/* Momentum */}
      <View style={s.section}>
        <View style={s.sectionHead}>
          <Icon name="speedometer" size={16} color={COLORS.primary} />
          <Text style={s.sectionTitle}>Momentum</Text>
        </View>
        <Gauge value={momentum?.rsi_1d} max={100} color={
          momentum?.rsi_1d > 70 ? COLORS.danger : momentum?.rsi_1d < 30 ? COLORS.success : COLORS.primary
        } label="RSI 1D" />
        <Gauge value={momentum?.rsi_4h} max={100} color={
          momentum?.rsi_4h > 70 ? COLORS.danger : momentum?.rsi_4h < 30 ? COLORS.success : COLORS.primary
        } label="RSI 4H" />
        <Gauge value={momentum?.adx} max={60} color={
          momentum?.adx > 25 ? COLORS.success : COLORS.textSecondary
        } label="ADX" />
        <View style={s.metricsGrid}>
          <MetricBox label="MACD" value={momentum?.macd_status?.toUpperCase()}
            color={STATUS_COLOR[momentum?.macd_status]} />
          <MetricBox label="Stoch" value={momentum?.stoch_status?.toUpperCase()}
            color={STATUS_COLOR[momentum?.stoch_status]} />
          <MetricBox label="Mom 5D" value={momentum?.momentum_5d ? `${(momentum.momentum_5d * 100).toFixed(1)}%` : null}
            color={momentum?.momentum_5d > 0 ? COLORS.success : COLORS.danger} />
          <MetricBox label="ADX Str" value={momentum?.adx_status?.toUpperCase()}
            color={STATUS_COLOR[momentum?.adx_status]} />
        </View>
      </View>

      {/* Volatility */}
      <View style={s.section}>
        <View style={s.sectionHead}>
          <Icon name="flash" size={16} color={COLORS.warning} />
          <Text style={s.sectionTitle}>Volatility</Text>
          <View style={[s.statusPill, { backgroundColor: `${STATUS_COLOR[volatility?.vol_status] || COLORS.textSecondary}15` }]}>
            <Text style={[s.statusText, { color: STATUS_COLOR[volatility?.vol_status] || COLORS.textSecondary }]}>
              {formatStatus(volatility?.vol_status)}
            </Text>
          </View>
        </View>
        <View style={s.metricsGrid}>
          <MetricBox label="ATR 14" value={volatility?.atr_14?.toFixed(4)} />
          <MetricBox label="BB Width" value={volatility?.bb_width?.toFixed(4)} />
          <MetricBox label="BB Position" value={formatStatus(volatility?.bb_status)}
            color={STATUS_COLOR[volatility?.bb_status]} />
          <MetricBox label="Vol Regime" value={volatility?.vol_regime?.toFixed(2)} />
        </View>
      </View>

      {/* Volume + Regime */}
      <View style={s.section}>
        <View style={s.sectionHead}>
          <Icon name="chart-bar" size={16} color={COLORS.primary} />
          <Text style={s.sectionTitle}>Volume & Regime</Text>
        </View>
        <View style={s.metricsGrid}>
          <MetricBox label="Vol Ratio" value={volume?.volume_ratio?.toFixed(2)}
            color={volume?.volume_ratio > 1.5 ? COLORS.success : COLORS.textSecondary} />
          <MetricBox label="Vol Trend" value={volume?.volume_trend?.toFixed(2)} />
          <MetricBox label="Regime" value={formatStatus(regime?.status)}
            color={STATUS_COLOR[regime?.status]} />
          <MetricBox label="Price Pos" value={levels?.price_position_20d ? `${(levels.price_position_20d * 100).toFixed(0)}%` : null} />
        </View>
        {regime?.accumulation && (
          <View style={s.eventBadge}>
            <Icon name="basket" size={12} color={COLORS.success} />
            <Text style={[s.eventText, { color: COLORS.success }]}>Accumulation Zone</Text>
          </View>
        )}
        {regime?.distribution && (
          <View style={s.eventBadge}>
            <Icon name="hand-coin" size={12} color={COLORS.danger} />
            <Text style={[s.eventText, { color: COLORS.danger }]}>Distribution Zone</Text>
          </View>
        )}
      </View>

      {/* Support / Resistance */}
      <View style={s.section}>
        <View style={s.sectionHead}>
          <Icon name="ray-vertex" size={16} color={COLORS.primary} />
          <Text style={s.sectionTitle}>Support & Resistance</Text>
        </View>
        <View style={s.levelRow}>
          <View style={[s.levelBox, { borderColor: `${COLORS.danger}20` }]}>
            <Text style={[s.levelLabel, { color: COLORS.danger }]}>Resistance</Text>
            <Text style={[s.levelValue, { color: COLORS.danger }]}>
              +{levels?.resistance_dist_pct?.toFixed(1) || '?'}%
            </Text>
          </View>
          <View style={[s.levelBox, { borderColor: `${COLORS.success}20` }]}>
            <Text style={[s.levelLabel, { color: COLORS.success }]}>Support</Text>
            <Text style={[s.levelValue, { color: COLORS.success }]}>
              -{levels?.support_dist_pct?.toFixed(1) || '?'}%
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const MetricBox = ({ label, value, color }: { label: string; value: string | null | undefined; color?: string }) => (
  <View style={s.metricBox}>
    <Text style={s.metricLabel}>{label}</Text>
    <Text style={[s.metricValue, color ? { color } : {}]}>{value || '—'}</Text>
  </View>
);

const g = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  label: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '700', width: 50, letterSpacing: 0.5 },
  barOuter: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  barInner: { height: '100%', borderRadius: 3 },
  value: { fontSize: 12, fontWeight: '800', minWidth: 36, textAlign: 'right' },
});

const s = StyleSheet.create({
  card: { backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 18, marginBottom: 14, ...SHADOWS.small },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  title: { fontSize: 17, fontWeight: '800', color: COLORS.text, letterSpacing: 0.3 },

  // Overall
  overallBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16 },
  overallCenter: { flex: 1, marginLeft: 12 },
  overallLabel: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  overallSub: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600', marginTop: 2 },
  scoreBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  scoreText: { fontSize: 18, fontWeight: '900' },

  // Sections
  section: { marginBottom: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, letterSpacing: 0.3 },
  statusPill: { marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  // Metrics grid
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricBox: { width: '47%', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  metricLabel: { fontSize: 9, color: COLORS.textSecondary, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  metricValue: { fontSize: 13, color: COLORS.text, fontWeight: '800' },

  // Events
  eventBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.03)' },
  eventText: { fontSize: 11, fontWeight: '700' },

  // Levels
  levelRow: { flexDirection: 'row', gap: 10 },
  levelBox: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.02)' },
  levelLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  levelValue: { fontSize: 18, fontWeight: '900' },
});

export default TechnicalAnalysis;
