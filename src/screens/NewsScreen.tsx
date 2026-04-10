// NewsScreen — Crypto News Feed with Sentiment Classification
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, ScrollView,
  TouchableOpacity, StatusBar, SafeAreaView, Linking, Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { COLORS, SHADOWS } from '../config/theme';
import APIService from '../services/apiService';
import useAppStore from '../store/useAppStore';
import { NewsCardSkeleton } from '../components/SkeletonLoader';

interface NewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  published_at: string;
  sentiment: { label: 'bullish' | 'bearish' | 'neutral'; score: number };
  coins: string[];
}

type SentimentFilter = 'ALL' | 'BULLISH' | 'BEARISH' | 'NEUTRAL';
type CoinFilter = string | null;

const COIN_SHORT: Record<string, string> = {
  bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', dogecoin: 'DOGE', avalanche: 'AVAX',
  xrp: 'XRP', chainlink: 'LINK', cardano: 'ADA', near: 'NEAR', polkadot: 'DOT', filecoin: 'FIL', market: 'ALL',
};

const COIN_IMAGES: Record<string, string> = {
  bitcoin: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ethereum: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  solana: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  xrp: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  chainlink: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  cardano: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  near: 'https://assets.coingecko.com/coins/images/10365/small/near.jpg',
  avalanche: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  dogecoin: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  polkadot: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
  filecoin: 'https://assets.coingecko.com/coins/images/12817/small/filecoin.png',
};

const SENTIMENT_CONFIG = {
  bullish: { color: COLORS.success, icon: 'trending-up', label: 'Bullish' },
  bearish: { color: COLORS.danger, icon: 'trending-down', label: 'Bearish' },
  neutral: { color: COLORS.warning, icon: 'minus', label: 'Neutral' },
};

const NewsScreen: React.FC = () => {
  const { t } = useTranslation();
  const storeArticles = useAppStore(s => s.articles);
  const setStoreArticles = useAppStore(s => s.setArticles);
  const [articles, setArticles] = useState<NewsArticle[]>(storeArticles);
  const [filtered, setFiltered] = useState<NewsArticle[]>(storeArticles);
  const [loading, setLoading] = useState(storeArticles.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('ALL');
  const [coinFilter, setCoinFilter] = useState<CoinFilter>(null);

  const fetchNews = async () => {
    try {
      const data = await APIService.getNews();
      const arts = data.articles || [];
      setArticles(arts);
      setStoreArticles(arts);
    } catch (e) {
      console.error('News fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchNews(); }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      APIService.clearCache();
      fetchNews();
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let f = articles;
    if (sentimentFilter !== 'ALL') {
      f = f.filter(a => a.sentiment.label === sentimentFilter.toLowerCase());
    }
    if (coinFilter) {
      f = f.filter(a => a.coins.includes(coinFilter));
    }
    setFiltered(f);
  }, [sentimentFilter, coinFilter, articles]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    APIService.clearCache();
    fetchNews();
  }, []);

  const openArticle = (url: string) => {
    if (url) Linking.openURL(url);
  };

  // Counts
  const bullCount = articles.filter(a => a.sentiment.label === 'bullish').length;
  const bearCount = articles.filter(a => a.sentiment.label === 'bearish').length;
  const neutralCount = articles.filter(a => a.sentiment.label === 'neutral').length;

  // Available coins from news
  const availableCoins = [...new Set(articles.flatMap(a => a.coins))].filter(c => c !== 'market');

  const timeAgo = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `${mins}m`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h`;
      return `${Math.floor(hrs / 24)}d`;
    } catch { return ''; }
  };

  const renderArticle = ({ item }: { item: NewsArticle }) => {
    const sentConf = SENTIMENT_CONFIG[item.sentiment.label];
    return (
      <TouchableOpacity
        style={[s.card, { borderLeftColor: sentConf.color, borderLeftWidth: 3 }]}
        activeOpacity={0.7}
        onPress={() => openArticle(item.url)}
      >
        {/* Sentiment badge + time */}
        <View style={s.cardHeader}>
          <View style={[s.sentBadge, { backgroundColor: `${sentConf.color}15`, borderColor: `${sentConf.color}40` }]}>
            <Icon name={sentConf.icon} size={12} color={sentConf.color} />
            <Text style={[s.sentText, { color: sentConf.color }]}>{sentConf.label}</Text>
            <Text style={[s.sentScore, { color: sentConf.color }]}>
              {(item.sentiment.score * 100).toFixed(0)}%
            </Text>
          </View>
          <Text style={s.timeText}>{timeAgo(item.published_at)}</Text>
        </View>

        {/* Title */}
        <Text style={s.title} numberOfLines={3}>{item.title}</Text>

        {/* Footer: source + coin tags */}
        <View style={s.cardFooter}>
          <Text style={s.source}>{item.source}</Text>
          <View style={s.coinTags}>
            {item.coins.slice(0, 3).map(coin => (
              <View key={coin} style={s.coinTag}>
                {COIN_IMAGES[coin] && (
                  <Image source={{ uri: COIN_IMAGES[coin] }} style={s.coinTagImg} />
                )}
                <Text style={s.coinTagText}>{COIN_SHORT[coin] || coin.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSentimentBar = () => (
    <View style={s.sentimentCard}>
      <View style={s.sentimentRow}>
        <View style={s.sentimentItem}>
          <Icon name="trending-up" size={16} color={COLORS.success} />
          <Text style={s.sentimentCount}>{bullCount}</Text>
          <Text style={s.sentimentLabel}>Bullish</Text>
        </View>
        <View style={s.sentimentDivider} />
        <View style={s.sentimentItem}>
          <Icon name="trending-down" size={16} color={COLORS.danger} />
          <Text style={s.sentimentCount}>{bearCount}</Text>
          <Text style={s.sentimentLabel}>Bearish</Text>
        </View>
        <View style={s.sentimentDivider} />
        <View style={s.sentimentItem}>
          <Icon name="minus" size={16} color={COLORS.warning} />
          <Text style={s.sentimentCount}>{neutralCount}</Text>
          <Text style={s.sentimentLabel}>Neutral</Text>
        </View>
      </View>
      {/* Sentiment bar */}
      <View style={s.sentBar}>
        {bullCount > 0 && (
          <View style={[s.sentBarSeg, { flex: bullCount, backgroundColor: COLORS.success, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }]} />
        )}
        {bearCount > 0 && (
          <View style={[s.sentBarSeg, { flex: bearCount, backgroundColor: COLORS.danger }]} />
        )}
        {neutralCount > 0 && (
          <View style={[s.sentBarSeg, { flex: neutralCount, backgroundColor: COLORS.warning, borderTopRightRadius: 4, borderBottomRightRadius: 4 }]} />
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>{t('news', 'News')}</Text>
            <Text style={s.headerSub}>{t('newsSubtitle', 'AI Sentiment Analysis')}</Text>
          </View>
        </View>
        <ScrollView style={{ flex: 1, padding: 16 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <NewsCardSkeleton key={i} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>{t('news', 'News')}</Text>
          <Text style={s.headerSub}>{t('newsSubtitle', 'AI Sentiment Analysis')}</Text>
        </View>
        <View style={s.articleCount}>
          <Text style={s.articleCountNum}>{articles.length}</Text>
          <Text style={s.articleCountLabel}>ARTICLES</Text>
        </View>
      </View>

      {/* Sentiment filters */}
      <View style={s.filterRow}>
        {(['ALL', 'BULLISH', 'BEARISH', 'NEUTRAL'] as SentimentFilter[]).map(f => {
          const active = sentimentFilter === f;
          const color = f === 'BULLISH' ? COLORS.success : f === 'BEARISH' ? COLORS.danger : f === 'NEUTRAL' ? COLORS.warning : COLORS.primary;
          return (
            <TouchableOpacity
              key={f}
              style={[s.filterChip, active && { backgroundColor: `${color}15`, borderColor: color }]}
              onPress={() => setSentimentFilter(f)}
            >
              <Text style={[s.filterText, active && { color }]}>{f}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Coin filters */}
      <View style={s.coinRow}>
        <TouchableOpacity
          style={[s.coinChip, !coinFilter && s.coinChipActive]}
          onPress={() => setCoinFilter(null)}
        >
          <Text style={[s.coinChipText, !coinFilter && s.coinChipTextActive]}>All</Text>
        </TouchableOpacity>
        {availableCoins.map(c => {
          const active = coinFilter === c;
          return (
            <TouchableOpacity
              key={c}
              style={[s.coinChip, active && s.coinChipActive]}
              onPress={() => setCoinFilter(active ? null : c)}
            >
              {COIN_IMAGES[c] && <Image source={{ uri: COIN_IMAGES[c] }} style={s.coinChipImg} />}
              <Text style={[s.coinChipText, active && s.coinChipTextActive]}>{COIN_SHORT[c] || c.toUpperCase()}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* News feed */}
      <FlatList
        data={filtered}
        renderItem={renderArticle}
        keyExtractor={item => item.id}
        ListHeaderComponent={articles.length > 0 ? renderSentimentBar : null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Icon name="newspaper-variant-outline" size={48} color={COLORS.textDark} />
            <Text style={s.emptyText}>{t('noNews', 'No news available')}</Text>
          </View>
        }
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  list: { paddingHorizontal: 16, paddingBottom: 100 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
  headerSub: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500', marginTop: 2, letterSpacing: 0.5 },

  articleCount: { alignItems: 'center', backgroundColor: 'rgba(0,212,255,0.1)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,212,255,0.3)' },
  articleCountNum: { fontSize: 20, fontWeight: '900', color: COLORS.primary },
  articleCountLabel: { fontSize: 8, fontWeight: '800', color: COLORS.primary, letterSpacing: 1.5 },

  // Filters
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 10 },
  filterChip: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  filterText: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.5 },

  coinRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 14, flexWrap: 'wrap' },
  coinChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  coinChipActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}10` },
  coinChipImg: { width: 16, height: 16, borderRadius: 8 },
  coinChipText: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  coinChipTextActive: { color: COLORS.primary },

  // Sentiment summary
  sentimentCard: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 12, ...SHADOWS.small },
  sentimentRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 10 },
  sentimentItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sentimentCount: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  sentimentLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.8 },
  sentimentDivider: { width: 1, height: 20, backgroundColor: COLORS.border },
  sentBar: { flexDirection: 'row', height: 4, borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)' },
  sentBarSeg: { height: '100%' },

  // Article card
  card: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10, ...SHADOWS.small },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sentBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  sentText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  sentScore: { fontSize: 10, fontWeight: '600' },
  timeText: { fontSize: 10, color: COLORS.textDark, fontWeight: '600' },
  title: { fontSize: 14, fontWeight: '700', color: COLORS.text, lineHeight: 20, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  source: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600' },
  coinTags: { flexDirection: 'row', gap: 4 },
  coinTag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  coinTagImg: { width: 12, height: 12, borderRadius: 6 },
  coinTagText: { fontSize: 9, fontWeight: '700', color: COLORS.textSecondary },

  loadText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600', marginTop: 12 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
});

export default NewsScreen;
