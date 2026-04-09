// CryptoCard — Premium glassmorphism card with signal prominence
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { CryptoPrediction } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CryptoCardProps {
  crypto: CryptoPrediction;
  onPress: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const COIN_IMAGES: Record<string, string> = {
  bitcoin: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ethereum: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  solana: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  dogecoin: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  avalanche: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  xrp: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  chainlink: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  cardano: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  near: 'https://assets.coingecko.com/coins/images/10365/small/near.jpg',
  polkadot: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
  filecoin: 'https://assets.coingecko.com/coins/images/12817/small/filecoin.png',
};

const CryptoCard: React.FC<CryptoCardProps> = ({ crypto, onPress, isFavorite = false, onToggleFavorite }) => {
  const signal = crypto.signal || 'HOLD';
  const confidence = crypto.confidence || 0;
  const price = crypto.current_price || 0;
  const direction = (crypto as any).direction;

  const signalColor = signal === 'BUY' ? COLORS.success : signal === 'SELL' ? COLORS.danger : COLORS.warning;
  const signalGlow = signal === 'BUY' ? 'rgba(0,255,136,0.15)' : signal === 'SELL' ? 'rgba(255,51,102,0.15)' : 'rgba(255,184,0,0.08)';
  const coinImage = COIN_IMAGES[crypto.crypto];

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    onToggleFavorite?.();
  };

  const formatPrice = (p: number) => {
    if (p >= 1000) return `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (p >= 1) return `$${p.toFixed(2)}`;
    return `$${p.toFixed(4)}`;
  };

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: `${signalColor}30`, shadowColor: signalColor }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Signal glow strip */}
      <View style={[styles.glowStrip, { backgroundColor: signalGlow }]} />

      {/* Main content */}
      <View style={styles.content}>
        {/* Top row: coin info + price */}
        <View style={styles.topRow}>
          <View style={styles.coinInfo}>
            <View style={[styles.iconCircle, { borderColor: `${signalColor}40` }]}>
              {coinImage ? (
                <Image source={{ uri: coinImage }} style={styles.coinImage} />
              ) : (
                <Text style={[styles.coinIcon, { color: signalColor }]}>●</Text>
              )}
            </View>
            <View style={styles.nameBlock}>
              <View style={styles.nameRow}>
                <Text style={styles.coinName}>{crypto.name}</Text>
                {onToggleFavorite && (
                  <TouchableOpacity onPress={handleFavoritePress} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Text style={styles.favIcon}>{isFavorite ? '★' : '☆'}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.symbol}>{crypto.symbol?.replace('USDT', '') || ''}</Text>
            </View>
          </View>

          <View style={styles.priceBlock}>
            <Text style={styles.price}>{formatPrice(price)}</Text>
          </View>
        </View>

        {/* Bottom row: signal + confidence + direction */}
        <View style={styles.bottomRow}>
          {/* Signal badge */}
          <View style={[styles.signalBadge, { backgroundColor: `${signalColor}18`, borderColor: `${signalColor}50` }]}>
            <View style={[styles.signalDot, { backgroundColor: signalColor }]} />
            <Text style={[styles.signalText, { color: signalColor }]}>
              {signal === 'BUY' ? 'LONG' : signal === 'SELL' ? 'SHORT' : 'HOLD'}
            </Text>
            {direction && (
              <Text style={[styles.directionText, { color: signalColor }]}>
                {direction === 'LONG' ? '↑' : '↓'}
              </Text>
            )}
          </View>

          {/* Confidence meter */}
          <View style={styles.confidenceBlock}>
            <View style={styles.confBarOuter}>
              <View style={[styles.confBarInner, { width: `${confidence * 100}%`, backgroundColor: signalColor }]} />
            </View>
            <Text style={[styles.confValue, { color: signalColor }]}>
              {(confidence * 100).toFixed(0)}%
            </Text>
          </View>

          {/* TP/SL mini */}
          {crypto.risk_management && (
            <View style={styles.tpslMini}>
              <Text style={styles.tpText}>TP {crypto.risk_management.take_profit_pct?.toFixed(1) || crypto.risk_management.potential_gain_percent?.toFixed(1) || '—'}%</Text>
              <Text style={styles.slText}>SL {crypto.risk_management.stop_loss_pct?.toFixed(1) || crypto.risk_management.potential_loss_percent?.toFixed(1) || '—'}%</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  glowStrip: {
    height: 3,
    width: '100%',
  },
  content: {
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  coinInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  coinImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  coinIcon: {
    fontSize: 20,
    fontWeight: '800',
  },
  nameBlock: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coinName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  favIcon: {
    fontSize: 16,
    color: '#FFB800',
  },
  symbol: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 1,
  },
  priceBlock: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  signalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
  },
  signalDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  signalText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  directionText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 2,
  },
  confidenceBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confBarOuter: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confBarInner: {
    height: '100%',
    borderRadius: 3,
  },
  confValue: {
    fontSize: 13,
    fontWeight: '800',
    minWidth: 32,
    textAlign: 'right',
  },
  tpslMini: {
    alignItems: 'flex-end',
    gap: 1,
  },
  tpText: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  slText: {
    fontSize: 10,
    color: COLORS.danger,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default CryptoCard;
