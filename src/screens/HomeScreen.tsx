// HomeScreen — All Binance Cryptos with Technical Data
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  ActivityIndicator, StatusBar, TouchableOpacity, Image, TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SHADOWS } from '../config/theme';
import { RootStackParamList } from '../types';
import useAppStore from '../store/useAppStore';
import axios from 'axios';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const BINANCE_API = 'https://data-api.binance.vision';

// Our AI-supported coins
const AI_COINS = ['BTC', 'ETH', 'SOL', 'DOGE', 'AVAX', 'XRP', 'LINK', 'ADA', 'NEAR', 'DOT', 'FIL'];

const COIN_IMAGES: Record<string, string> = {
  BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  DOGE: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  AVAX: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  BNB: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  XRP: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  ADA: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  DOT: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
  MATIC: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png',
  LINK: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  UNI: 'https://assets.coingecko.com/coins/images/12504/small/uni.jpg',
  ATOM: 'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png',
  LTC: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png',
  FIL: 'https://assets.coingecko.com/coins/images/12817/small/filecoin.png',
  NEAR: 'https://assets.coingecko.com/coins/images/10365/small/near.jpg',
  APT: 'https://assets.coingecko.com/coins/images/26455/small/aptos_round.png',
  ARB: 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
  OP: 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png',
  SUI: 'https://assets.coingecko.com/coins/images/26375/small/sui_asset.jpeg',
};

const CRYPTO_NAMES: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', DOGE: 'dogecoin', AVAX: 'avalanche',
  XRP: 'xrp', LINK: 'chainlink', ADA: 'cardano', NEAR: 'near',
};

// Top traded pairs on Binance
const TOP_PAIRS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'LINKUSDT',
  'MATICUSDT', 'UNIUSDT', 'ATOMUSDT', 'LTCUSDT', 'FILUSDT',
  'NEARUSDT', 'APTUSDT', 'ARBUSDT', 'OPUSDT', 'SUIUSDT',
];

interface CryptoTicker {
  symbol: string;
  coin: string;
  price: number;
  change24h: number;
  changePct: number;
  volume: number;
  high24h: number;
  low24h: number;
  hasAI: boolean;
}

// Separate search bar component to prevent keyboard dismiss on FlatList re-render
const SearchBar = React.memo(({ value, onChangeText }: { value: string; onChangeText: (t: string) => void }) => (
  <View style={st.searchBar}>
    <Text style={st.searchIcon}>🔍</Text>
    <TextInput
      style={st.searchInput}
      placeholder="Search coin..."
      placeholderTextColor={COLORS.textDark}
      value={value}
      onChangeText={onChangeText}
      autoCorrect={false}
      autoCapitalize="characters"
    />
    {value.length > 0 && (
      <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={st.clearIcon}>✕</Text>
      </TouchableOpacity>
    )}
  </View>
));

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const storeTickers = useAppStore(s => s.tickers);
  const setStoreTickers = useAppStore(s => s.setTickers);
  const [tickers, setTickers] = useState<CryptoTicker[]>(storeTickers);
  const [loading, setLoading] = useState(storeTickers.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'rank' | 'gainers' | 'losers' | 'volume' | 'ai'>('rank');

  const fetchTickers = async () => {
    try {
      const res = await axios.get(`${BINANCE_API}/api/v3/ticker/24hr`);
      const data: CryptoTicker[] = TOP_PAIRS
        .map(pair => {
          const t = res.data.find((x: any) => x.symbol === pair);
          if (!t) return null;
          const coin = pair.replace('USDT', '');
          return {
            symbol: pair,
            coin,
            price: parseFloat(t.lastPrice),
            change24h: parseFloat(t.priceChange),
            changePct: parseFloat(t.priceChangePercent),
            volume: parseFloat(t.quoteVolume),
            high24h: parseFloat(t.highPrice),
            low24h: parseFloat(t.lowPrice),
            hasAI: AI_COINS.includes(coin),
          };
        })
        .filter(Boolean) as CryptoTicker[];

      setTickers(data);
      setStoreTickers(data);
    } catch (e) {
      console.error('Ticker fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTickers(); }, []);

  const filtered = useMemo(() => {
    let f = [...tickers];
    if (search) {
      f = f.filter(t => t.coin.toLowerCase().includes(search.toLowerCase()));
    }
    if (sortBy === 'gainers') f.sort((a, b) => b.changePct - a.changePct);
    else if (sortBy === 'losers') f.sort((a, b) => a.changePct - b.changePct);
    else if (sortBy === 'volume') f.sort((a, b) => b.volume - a.volume);
    else if (sortBy === 'ai') f = f.filter(t => t.hasAI);
    return f;
  }, [search, sortBy, tickers]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchTickers(); }, []);

  const handleCoinPress = useCallback((item: CryptoTicker) => {
    navigation.navigate('Analysis', {
      coin: item.coin,
      price: item.price,
      changePct: item.changePct,
    });
  }, [navigation]);

  const formatPrice = (p: number) => {
    if (p >= 1000) return `$${p.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    if (p >= 1) return `$${p.toFixed(2)}`;
    return `$${p.toFixed(4)}`;
  };

  const formatVolume = (v: number) => {
    if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
    return `$${(v / 1e3).toFixed(0)}K`;
  };

  const renderTicker = useCallback(({ item, index }: { item: CryptoTicker; index: number }) => {
    const isPositive = item.changePct >= 0;
    const changeColor = isPositive ? COLORS.success : COLORS.danger;
    const img = COIN_IMAGES[item.coin];

    const cardContent = (
      <>
        {/* Rank + Coin info */}
        <View style={cs.leftSection}>
          <Text style={cs.rank}>{index + 1}</Text>
          <View style={cs.coinInfo}>
            {img ? (
              <Image source={{ uri: img }} style={cs.coinImg} />
            ) : (
              <View style={cs.coinPlaceholder}>
                <Text style={cs.coinLetter}>{item.coin[0]}</Text>
              </View>
            )}
            <View>
              <Text style={cs.coinName}>{item.coin}</Text>
              <Text style={cs.coinPair}>/USDT</Text>
            </View>
          </View>
        </View>

        {/* Price + Change */}
        <View style={cs.midSection}>
          <Text style={cs.price}>{formatPrice(item.price)}</Text>
          <View style={[cs.changeBadge, { backgroundColor: `${changeColor}12` }]}>
            <Text style={[cs.changeText, { color: changeColor }]}>
              {isPositive ? '+' : ''}{item.changePct.toFixed(2)}%
            </Text>
          </View>
        </View>

        {/* Volume */}
        <View style={cs.rightSection}>
          <Text style={cs.volume}>{formatVolume(item.volume)}</Text>
          {item.hasAI && (
            <Icon name="chart-box-outline" size={16} color={COLORS.primary} />
          )}
        </View>
      </>
    );

    if (item.hasAI) {
      return (
        <TouchableOpacity style={cs.card} onPress={() => handleCoinPress(item)} activeOpacity={0.7}>
          {cardContent}
        </TouchableOpacity>
      );
    }

    return (
      <View style={cs.card}>
        {cardContent}
      </View>
    );
  }, [handleCoinPress]);

  const renderHeader = useCallback(() => (
    <View style={st.header}>
      <View style={st.titleRow}>
        <View>
          <Text style={st.title}>CryptoXHunter</Text>
          <Text style={st.subtitle}>Market Overview</Text>
        </View>
        <View style={st.aiBadge}>
          <Text style={st.aiCount}>{AI_COINS.length}</Text>
          <Text style={st.aiLabel}>IA MODELS</Text>
        </View>
      </View>

      {/* Search — separate component to avoid keyboard dismiss */}
      <SearchBar value={search} onChangeText={setSearch} />

      {/* Sort/Filter chips */}
      <View style={st.sortRow}>
        {([
          ['rank', '📋 All'],
          ['gainers', '🚀 Gainers'],
          ['losers', '📉 Losers'],
          ['volume', '💎 Volume'],
          ['ai', '🧠 AI Only'],
        ] as const).map(([key, label]) => {
          const active = sortBy === key;
          const color = key === 'gainers' ? COLORS.success : key === 'losers' ? COLORS.danger : COLORS.primary;
          return (
            <TouchableOpacity key={key} style={[st.sortChip, active && { borderColor: color, backgroundColor: `${color}10` }]}
              onPress={() => setSortBy(key as any)}>
              <Text style={[st.sortText, active && { color }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Column headers */}
      <View style={st.colHeaders}>
        <Text style={[st.colText, { flex: 1.2 }]}>#  Coin</Text>
        <Text style={[st.colText, { flex: 1, textAlign: 'center' }]}>Price / 24h</Text>
        <Text style={[st.colText, { flex: 0.8, textAlign: 'right' }]}>Vol / IA</Text>
      </View>
    </View>
  ), [search, sortBy]);

  if (loading) {
    return (
      <View style={st.center}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={st.loadText}>Loading market data...</Text>
      </View>
    );
  }

  return (
    <View style={st.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <FlatList
        data={filtered}
        renderItem={renderTicker}
        keyExtractor={item => item.symbol}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={st.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
      />
    </View>
  );
};

// Screen styles
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  loadText: { color: COLORS.textSecondary, marginTop: 12, fontSize: 13 },

  header: { paddingTop: 50, marginBottom: 8 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500', marginTop: 3, letterSpacing: 0.5 },
  aiBadge: { alignItems: 'center', backgroundColor: 'rgba(0,212,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,212,255,0.3)' },
  aiCount: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  aiLabel: { fontSize: 7, fontWeight: '800', color: COLORS.primary, letterSpacing: 1.5 },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500', padding: 0 },
  clearIcon: { fontSize: 14, color: COLORS.textDark, paddingLeft: 8 },

  sortRow: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  sortChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  sortText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },

  colHeaders: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 4, marginBottom: 4 },
  colText: { fontSize: 10, color: COLORS.textDark, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
});

// Card styles
const cs = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },

  leftSection: { flexDirection: 'row', alignItems: 'center', flex: 1.2, gap: 8 },
  rank: { fontSize: 11, color: COLORS.textDark, fontWeight: '700', width: 18, textAlign: 'center' },
  coinInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coinImg: { width: 30, height: 30, borderRadius: 15 },
  coinPlaceholder: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  coinLetter: { fontSize: 14, fontWeight: '800', color: COLORS.textSecondary },
  coinName: { fontSize: 14, fontWeight: '800', color: COLORS.text, letterSpacing: 0.3 },
  coinPair: { fontSize: 9, color: COLORS.textDark, fontWeight: '600' },

  midSection: { flex: 1, alignItems: 'center' },
  price: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 3 },
  changeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  changeText: { fontSize: 11, fontWeight: '800' },

  rightSection: { flex: 0.8, alignItems: 'flex-end', gap: 4 },
  volume: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600' },
});

export default HomeScreen;
