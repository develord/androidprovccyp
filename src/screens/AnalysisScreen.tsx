// AnalysisScreen — Technical Analysis for a coin (from HomeScreen click)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Image } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SHADOWS } from '../config/theme';
import { RootStackParamList } from '../types';
import TechnicalAnalysis from '../components/TechnicalAnalysis';
import apiService from '../services/apiService';

type AnalysisRoute = RouteProp<RootStackParamList, 'Analysis'>;

const COIN_IMAGES: Record<string, string> = {
  BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  DOGE: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  AVAX: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  XRP: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  LINK: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  ADA: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  NEAR: 'https://assets.coingecko.com/coins/images/10365/small/near.jpg',
  DOT: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
  FIL: 'https://assets.coingecko.com/coins/images/12817/small/filecoin.png',
};

const CRYPTO_NAMES: Record<string, string> = {
  BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana', DOGE: 'Dogecoin', AVAX: 'Avalanche',
  XRP: 'XRP', LINK: 'Chainlink', ADA: 'Cardano', NEAR: 'NEAR Protocol', DOT: 'Polkadot', FIL: 'Filecoin',
};

const CRYPTO_IDS: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', DOGE: 'dogecoin', AVAX: 'avalanche',
  XRP: 'xrp', LINK: 'chainlink', ADA: 'cardano', NEAR: 'near', DOT: 'polkadot', FIL: 'filecoin',
};

const AnalysisScreen: React.FC = () => {
  const route = useRoute<AnalysisRoute>();
  const navigation = useNavigation();
  const { coin, price, changePct } = route.params;

  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const cryptoId = CRYPTO_IDS[coin];
        if (cryptoId) {
          const data = await apiService.getTechnicalAnalysis(cryptoId);
          setAnalysis(data);
        }
      } catch (e) {
        console.error('Analysis fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [coin]);

  const isPositive = changePct >= 0;
  const changeColor = isPositive ? COLORS.success : COLORS.danger;
  const img = COIN_IMAGES[coin];

  const formatPrice = (p: number) => {
    if (p >= 1000) return `$${p.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    if (p >= 1) return `$${p.toFixed(2)}`;
    return `$${p.toFixed(4)}`;
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={s.coinHeader}>
          {img && <Image source={{ uri: img }} style={s.coinImg} />}
          <View>
            <Text style={s.coinName}>{CRYPTO_NAMES[coin] || coin}</Text>
            <Text style={s.coinSymbol}>{coin}/USDT</Text>
          </View>
        </View>

        <View style={s.priceBox}>
          <Text style={s.price}>{formatPrice(price)}</Text>
          <View style={[s.changeBadge, { backgroundColor: `${changeColor}15` }]}>
            <Text style={[s.changeText, { color: changeColor }]}>
              {isPositive ? '+' : ''}{changePct.toFixed(2)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Technical Analysis */}
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <TechnicalAnalysis analysis={analysis} loading={loading} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 14,
    paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 8, marginRight: 8 },
  coinHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  coinImg: { width: 36, height: 36, borderRadius: 18 },
  coinName: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  coinSymbol: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  priceBox: { alignItems: 'flex-end' },
  price: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  changeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 2 },
  changeText: { fontSize: 11, fontWeight: '800' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
});

export default AnalysisScreen;
