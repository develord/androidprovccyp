// LiveTradingScreen - Real-time bot trades from Binance Demo
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../config/theme';
import axios from 'axios';
import hmacSHA256 from 'crypto-js/hmac-sha256';

// Binance Demo API config
const DEMO_API = 'https://demo-fapi.binance.com';
const API_KEY = 'UQG6f1qrF6lwXeNYG7QMSFTp4DWIvUpNwx3rnIKHmg4FCF3cBcATcFgp9cOJRAfw';
const API_SECRET = 'T60J1F6Ak5BKiKlffI5QOZLIPU6LMTXjy3c29oT0OZnpKYg6tAOcI6JMKfm5sgS9';

interface Position {
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  markPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  margin: number;
}

interface TradeHistory {
  symbol: string;
  side: string;
  price: number;
  qty: number;
  realizedPnl: number;
  time: string;
}

const LiveTradingScreen: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<TradeHistory[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [totalPnl, setTotalPnl] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'positions' | 'history'>('positions');

  const signRequest = (params: Record<string, any>) => {
    const query = Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&');
    const signature = hmacSHA256(query, API_SECRET).toString();
    return { ...params, signature };
  };

  const fetchData = async () => {
    try {
      const timestamp = Date.now();

      // Fetch balance
      const balParams = signRequest({ timestamp, recvWindow: 10000 });
      const balRes = await axios.get(`${DEMO_API}/fapi/v2/balance`, {
        params: balParams,
        headers: { 'X-MBX-APIKEY': API_KEY },
      });
      const usdtBal = balRes.data.find((b: any) => b.asset === 'USDT');
      setBalance(parseFloat(usdtBal?.availableBalance || '0'));

      // Fetch positions
      const posParams = signRequest({ timestamp: Date.now(), recvWindow: 10000 });
      const posRes = await axios.get(`${DEMO_API}/fapi/v2/positionRisk`, {
        params: posParams,
        headers: { 'X-MBX-APIKEY': API_KEY },
      });

      const openPositions: Position[] = [];
      let pnlTotal = 0;

      for (const pos of posRes.data) {
        const amt = parseFloat(pos.positionAmt);
        if (amt === 0) continue;

        const entry = parseFloat(pos.entryPrice);
        const mark = parseFloat(pos.markPrice);
        const pnl = parseFloat(pos.unRealizedProfit);
        const side = amt < 0 ? 'SHORT' : 'LONG';
        const pnlPct = side === 'SHORT'
          ? (entry / mark - 1) * 100
          : (mark / entry - 1) * 100;

        pnlTotal += pnl;

        openPositions.push({
          symbol: pos.symbol,
          side,
          entryPrice: entry,
          markPrice: mark,
          quantity: Math.abs(amt),
          pnl,
          pnlPercent: pnlPct,
          margin: parseFloat(pos.initialMargin || '0'),
        });
      }

      setPositions(openPositions);
      setTotalPnl(pnlTotal);

      // Fetch trade history
      const histParams = signRequest({ timestamp: Date.now(), recvWindow: 10000, limit: 50 });
      const histRes = await axios.get(`${DEMO_API}/fapi/v1/userTrades`, {
        params: histParams,
        headers: { 'X-MBX-APIKEY': API_KEY },
      });

      const trades: TradeHistory[] = histRes.data
        .slice(-20)
        .reverse()
        .map((t: any) => ({
          symbol: t.symbol,
          side: t.side,
          price: parseFloat(t.price),
          qty: parseFloat(t.qty),
          realizedPnl: parseFloat(t.realizedPnl),
          time: new Date(t.time).toLocaleString(),
        }));

      setHistory(trades);
    } catch (error: any) {
      console.error('Fetch error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderPosition = ({ item }: { item: Position }) => {
    const isProfit = item.pnl >= 0;
    const coin = item.symbol.replace('USDT', '');

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.coinRow}>
            <Text style={styles.coinName}>{coin}</Text>
            <View style={[styles.badge, item.side === 'LONG' ? styles.longBadge : styles.shortBadge]}>
              <Text style={styles.badgeText}>{item.side}</Text>
            </View>
          </View>
          <Text style={[styles.pnlText, isProfit ? styles.profit : styles.loss]}>
            {item.pnlPercent >= 0 ? '+' : ''}{item.pnlPercent.toFixed(2)}%
          </Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.row}>
            <Text style={styles.label}>Entry</Text>
            <Text style={styles.value}>${item.entryPrice.toFixed(4)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Mark</Text>
            <Text style={styles.value}>${item.markPrice.toFixed(4)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Size</Text>
            <Text style={styles.value}>{item.quantity} {coin}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>PnL</Text>
            <Text style={[styles.value, isProfit ? styles.profit : styles.loss]}>
              ${item.pnl.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderHistory = ({ item }: { item: TradeHistory }) => {
    const isProfit = item.realizedPnl >= 0;
    const coin = item.symbol.replace('USDT', '');

    return (
      <View style={styles.historyItem}>
        <View style={styles.historyLeft}>
          <Text style={styles.historyCoin}>{coin}</Text>
          <Text style={[styles.historySide, item.side === 'BUY' ? styles.profit : styles.loss]}>
            {item.side}
          </Text>
        </View>
        <View style={styles.historyCenter}>
          <Text style={styles.historyPrice}>${item.price.toFixed(4)}</Text>
          <Text style={styles.historyTime}>{item.time}</Text>
        </View>
        <Text style={[styles.historyPnl, isProfit ? styles.profit : styles.loss]}>
          ${item.realizedPnl.toFixed(2)}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading trades...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Live Trading</Text>
        <Text style={styles.subtitle}>Binance Demo</Text>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Balance</Text>
            <Text style={styles.balanceValue}>${balance.toFixed(2)}</Text>
          </View>
          <View>
            <Text style={styles.balanceLabel}>Unrealized PnL</Text>
            <Text style={[styles.balanceValue, totalPnl >= 0 ? styles.profit : styles.loss]}>
              ${totalPnl.toFixed(2)}
            </Text>
          </View>
          <View>
            <Text style={styles.balanceLabel}>Positions</Text>
            <Text style={styles.balanceValue}>{positions.length}</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'positions' && styles.activeTab]}
          onPress={() => setTab('positions')}
        >
          <Text style={[styles.tabText, tab === 'positions' && styles.activeTabText]}>
            Positions ({positions.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'history' && styles.activeTab]}
          onPress={() => setTab('history')}
        >
          <Text style={[styles.tabText, tab === 'history' && styles.activeTabText]}>
            History ({history.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {tab === 'positions' ? (
        <FlatList
          data={positions}
          renderItem={renderPosition}
          keyExtractor={(item) => item.symbol}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No open positions</Text>
              <Text style={styles.emptySubtext}>Bot will open trades at 00:00 UTC</Text>
            </View>
          }
          contentContainerStyle={styles.list}
        />
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistory}
          keyExtractor={(_, index) => index.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No trade history</Text>
            </View>
          }
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { color: COLORS.textSecondary, marginTop: 10 },
  header: { paddingHorizontal: SPACING.lg, paddingTop: 50, paddingBottom: SPACING.md },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },

  balanceCard: {
    marginHorizontal: SPACING.lg, padding: SPACING.lg,
    backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  balanceLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  balanceValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },

  tabs: {
    flexDirection: 'row', marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg, marginBottom: SPACING.sm,
  },
  tab: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  activeTabText: { color: COLORS.primary },

  list: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },

  card: {
    backgroundColor: COLORS.card, borderRadius: 12,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  coinRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coinName: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  longBadge: { backgroundColor: '#22c55e30' },
  shortBadge: { backgroundColor: '#ef444430' },
  badgeText: { fontSize: 11, fontWeight: 'bold', color: COLORS.text },
  pnlText: { fontSize: 20, fontWeight: 'bold' },

  cardBody: { gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 13, color: COLORS.textSecondary },
  value: { fontSize: 13, color: COLORS.text, fontWeight: '500' },

  profit: { color: '#22c55e' },
  loss: { color: '#ef4444' },

  historyItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 80 },
  historyCoin: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  historySide: { fontSize: 11, fontWeight: 'bold' },
  historyCenter: { flex: 1, alignItems: 'center' },
  historyPrice: { fontSize: 13, color: COLORS.text },
  historyTime: { fontSize: 11, color: COLORS.textSecondary },
  historyPnl: { fontSize: 14, fontWeight: 'bold', width: 70, textAlign: 'right' },

  empty: { alignItems: 'center', paddingTop: 50 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary },
  emptySubtext: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
});

export default LiveTradingScreen;
