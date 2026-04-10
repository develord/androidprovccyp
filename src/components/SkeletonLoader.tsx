import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS, SPACING } from '../config/theme';

const SKELETON_BG = '#242952';

type Variant = 'text' | 'title' | 'circle' | 'card';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  variant?: Variant;
  style?: ViewStyle;
}

const VARIANT_DEFAULTS: Record<Variant, { width: number | string; height: number; borderRadius: number }> = {
  text: { width: '100%', height: 14, borderRadius: 4 },
  title: { width: '60%', height: 20, borderRadius: 4 },
  circle: { width: 40, height: 40, borderRadius: 20 },
  card: { width: '100%', height: 120, borderRadius: 12 },
};

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width,
  height,
  borderRadius,
  variant = 'text',
  style,
}) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const defaults = VARIANT_DEFAULTS[variant];

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width ?? defaults.width,
          height: height ?? defaults.height,
          borderRadius: borderRadius ?? defaults.borderRadius,
          backgroundColor: SKELETON_BG,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const SignalCardSkeleton: React.FC = () => (
  <View style={styles.signalCard}>
    <View style={styles.row}>
      <SkeletonLoader variant="circle" width={44} height={44} borderRadius={22} />
      <View style={styles.textBlock}>
        <SkeletonLoader variant="title" width="50%" />
        <SkeletonLoader variant="text" width="80%" style={{ marginTop: 6 }} />
      </View>
      <SkeletonLoader width={56} height={24} borderRadius={12} />
    </View>
  </View>
);

export const NewsCardSkeleton: React.FC = () => (
  <View style={styles.newsCard}>
    <SkeletonLoader variant="title" width="90%" />
    <SkeletonLoader variant="text" width="40%" style={{ marginTop: 8 }} />
    <View style={[styles.row, { marginTop: 10 }]}>
      <SkeletonLoader width={64} height={22} borderRadius={11} />
    </View>
  </View>
);

export const TickerRowSkeleton: React.FC = () => (
  <View style={styles.tickerRow}>
    <SkeletonLoader variant="circle" width={36} height={36} borderRadius={18} />
    <View style={styles.textBlock}>
      <SkeletonLoader variant="text" width={80} height={14} />
      <SkeletonLoader variant="text" width={50} height={12} style={{ marginTop: 4 }} />
    </View>
    <SkeletonLoader width={70} height={14} borderRadius={4} style={{ marginLeft: 'auto' }} />
  </View>
);

const styles = StyleSheet.create({
  signalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  newsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  tickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textBlock: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
});
