// DetailScreen - Detailed view of a crypto prediction
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { RootStackParamList, CryptoPrediction } from '../types';
import APIService from '../services/apiService';
import BinanceService from '../services/binanceService';
import RiskManagement from '../components/RiskManagement';
import ActionAdvice from '../components/ActionAdvice';
import DatabaseService from '../services/databaseService';
import TradeModal from '../components/TradeModal';

type Props = NativeStackScreenProps<RootStackParamList, 'Detail'>;

const DetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { crypto: initialCrypto } = route.params;
  const [crypto, setCrypto] = useState<CryptoPrediction>(initialCrypto);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [priceChange24h, setPriceChange24h] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [tradeModalVisible, setTradeModalVisible] = useState(false);

  const formatSymbol = (symbol: string) => {
    return symbol.toUpperCase().replace('USDT', '/USDT');
  };

  useEffect(() => {
    loadLiveData();
    loadFavoriteStatus();
  }, []);

  const loadFavoriteStatus = async () => {
    const favoriteStatus = await DatabaseService.isFavorite(crypto.crypto);
    setIsFavorite(favoriteStatus);
  };

  const handleToggleFavorite = async () => {
    const newStatus = await DatabaseService.toggleFavorite(crypto.crypto);
    setIsFavorite(newStatus);
  };

  const loadLiveData = async () => {
    try {
      // Fetch live price from Binance
      const price = await BinanceService.getCurrentPrice(crypto.crypto);
      setLivePrice(price);

      // Fetch 24h ticker for price change
      const ticker = await BinanceService.get24hTicker(crypto.crypto);
      setPriceChange24h(parseFloat(ticker.priceChangePercent));

      // Refresh prediction from API
      const updatedPrediction = await APIService.getPrediction(crypto.crypto);
      setCrypto(updatedPrediction);
    } catch (error) {
      console.error('Error loading live data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    APIService.clearCache();
    loadLiveData();
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return COLORS.success;
      case 'SELL': return COLORS.danger;
      case 'HOLD': return COLORS.warning;
      default: return COLORS.textSecondary;
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'BUY': return '⤴';
      case 'SELL': return '⤵';
      case 'HOLD': return '↝';
      default: return '';
    }
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.8) return 'Très forte';
    if (confidence >= 0.6) return 'Forte';
    if (confidence >= 0.4) return 'Modérée';
    return 'Faible';
  };

  const getConfidenceLevelColor = (confidence: number) => {
    if (confidence >= 0.8) return COLORS.success;
    if (confidence >= 0.6) return '#00BCD4'; // Cyan
    if (confidence >= 0.4) return COLORS.warning;
    return COLORS.danger;
  };

  const displayPrice = livePrice ?? crypto.current_price;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.symbolRow}>
                <Text style={styles.symbol}>{formatSymbol(crypto.symbol)}</Text>
                <TouchableOpacity
                  onPress={handleToggleFavorite}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.favoriteIcon}>
                    {isFavorite ? '⭐' : '☆'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.name}>{crypto.name}</Text>
            </View>
          </View>

          <View style={styles.priceSection}>
            <Text style={styles.price}>
              ${displayPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            {priceChange24h !== null && (
              <View style={[
                styles.priceChangeBadge,
                { backgroundColor: priceChange24h >= 0 ? `${COLORS.success}20` : `${COLORS.danger}20` }
              ]}>
                <Text style={[
                  styles.priceChangeText,
                  { color: priceChange24h >= 0 ? COLORS.success : COLORS.danger }
                ]}>
                  {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}% (24h)
                </Text>
              </View>
            )}
          </View>

          <View style={styles.signalSection}>
            <View style={[
              styles.signalBadge,
              { backgroundColor: `${getSignalColor(crypto.signal)}20` }
            ]}>
              <Text style={[styles.signalText, { color: getSignalColor(crypto.signal) }]}>
                {crypto.signal}
              </Text>
              <Text style={[styles.signalIcon, { color: getSignalColor(crypto.signal) }]}>
                {getSignalIcon(crypto.signal)}
              </Text>
            </View>
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceLabel}>Confidence</Text>
              <Text style={styles.confidenceValue}>
                {(crypto.confidence * 100).toFixed(1)}%
              </Text>
              <Text style={[styles.confidenceLevel, { color: getConfidenceLevelColor(crypto.confidence) }]}>
                {getConfidenceLevel(crypto.confidence)}
              </Text>
            </View>
          </View>

          <View style={styles.timestampContainer}>
            <Text style={styles.timestamp}>
              Updated: {new Date(crypto.timestamp).toLocaleString()}
            </Text>
            {livePrice && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live Price</Text>
              </View>
            )}
          </View>
        </View>

        {/* CNN Model Details */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>CNN Prediction Details</Text>

          {(crypto as any).direction && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Direction</Text>
              <Text style={[styles.infoValue, {
                color: (crypto as any).direction === 'LONG' ? COLORS.success : COLORS.danger,
                fontWeight: 'bold'
              }]}>
                {(crypto as any).direction}
              </Text>
            </View>
          )}

          {(crypto as any).long_confidence != null && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>LONG Confidence</Text>
              <Text style={styles.infoValue}>
                {((crypto as any).long_confidence * 100).toFixed(1)}%
              </Text>
            </View>
          )}

          {(crypto as any).short_confidence != null && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>SHORT Confidence</Text>
              <Text style={styles.infoValue}>
                {((crypto as any).short_confidence * 100).toFixed(1)}%
              </Text>
            </View>
          )}

          {(crypto as any).long_filter && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>LONG Filter</Text>
              <Text style={[styles.infoValue, { color: COLORS.warning }]}>
                {(crypto as any).long_filter}
              </Text>
            </View>
          )}

          {(crypto as any).short_filter && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>SHORT Filter</Text>
              <Text style={[styles.infoValue, { color: COLORS.warning }]}>
                {(crypto as any).short_filter}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Model</Text>
            <Text style={styles.infoValue}>{(crypto as any).model || 'CNN_1D_MultiScale'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Data Source</Text>
            <Text style={styles.infoValue}>{(crypto as any).data_source || 'binance_live'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Updated</Text>
            <Text style={styles.infoValue}>
              {new Date(crypto.timestamp).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Action Advice */}
        <ActionAdvice prediction={crypto} />

        {/* Risk Management */}
        {crypto.risk_management && (
          <RiskManagement
            riskManagement={crypto.risk_management}
            currentPrice={displayPrice}
          />
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            CNN 1D-MultiScale LONG+SHORT | Binance Live Data
          </Text>
        </View>
      </ScrollView>

      {/* Trade Modal */}
      <TradeModal
        visible={tradeModalVisible}
        onClose={() => setTradeModalVisible(false)}
        prediction={crypto}
        currentPrice={displayPrice}
        onTradeCreated={() => {
          // Navigate to Portfolio tab after trade creation
          navigation.navigate('HomeTabs', { screen: 'PortfolioTab' });
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  headerCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.large,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  headerLeft: {
    flex: 1,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  favoriteIcon: {
    fontSize: FONT_SIZES.xxl,
    lineHeight: FONT_SIZES.xxl + 4,
    marginLeft: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.text,
    lineHeight: FONT_SIZES.xxl,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  symbol: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.extrabold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  name: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  priceSection: {
    marginBottom: SPACING.md,
  },
  price: {
    fontSize: FONT_SIZES.huge,
    fontWeight: FONT_WEIGHTS.extrabold,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  priceChangeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  priceChangeText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  signalSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  signalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  signalIcon: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    marginLeft: SPACING.sm,
    lineHeight: FONT_SIZES.xxl,
    textAlignVertical: 'center',
  },
  signalText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  confidenceContainer: {
    alignItems: 'flex-end',
  },
  confidenceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  confidenceValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  confidenceLevel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    marginTop: SPACING.xs,
  },
  timestampContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  timestamp: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textDark,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.success}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.success,
    marginRight: SPACING.xs,
  },
  liveText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: FONT_WEIGHTS.medium,
  },
  tradeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  tradeButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.background,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  footerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textDark,
    textAlign: 'center',
  },
});

export default DetailScreen;
