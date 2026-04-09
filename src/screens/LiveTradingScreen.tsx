// LiveTradingScreen — Mission Control Dashboard
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  ActivityIndicator, TouchableOpacity, Image,
} from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../config/theme';
import axios from 'axios';
import hmacSHA256 from 'crypto-js/hmac-sha256';

const DEMO_API = 'https://demo-fapi.binance.com';
const API_KEY = 'UQG6f1qrF6lwXeNYG7QMSFTp4DWIvUpNwx3rnIKHmg4FCF3cBcATcFgp9cOJRAfw';
const API_SECRET = 'T60J1F6Ak5BKiKlffI5QOZLIPU6LMTXjy3c29oT0OZnpKYg6tAOcI6JMKfm5sgS9';

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

interface Position {
  symbol: string; coin: string; side: 'LONG' | 'SHORT';
  entryPrice: number; markPrice: number; quantity: number;
  pnl: number; pnlPercent: number;
  tpPrice: number | null; slPrice: number | null;
  progressPercent: number; trailPalier: string;
}

interface Trade {
  coin: string; direction: 'LONG' | 'SHORT'; result: 'WIN' | 'LOSS';
  entryPrice: number; exitPrice: number; quantity: number;
  realizedPnl: number; pnlPercent: number; sizeUsd: number; pnlUsd: number;
  entryTime: number; exitTime: number; durationHours: number;
}

const LiveTradingScreen: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<Trade[]>([]);
  const [balance, setBalance] = useState(0);
  const [totalPnl, setTotalPnl] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'positions' | 'history'>('positions');

  const sign = (params: Record<string, any>) => {
    const q = Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&');
    return { ...params, signature: hmacSHA256(q, API_SECRET).toString() };
  };

  const headers = { 'X-MBX-APIKEY': API_KEY };

  const fetchData = async () => {
    try {
      const ts = Date.now();

      // Balance — use walletBalance (total) not availableBalance (after margin deduction)
      const balRes = await axios.get(`${DEMO_API}/fapi/v2/balance`, { params: sign({ timestamp: ts, recvWindow: 10000 }), headers });
      const usdtBal = balRes.data.find((b: any) => b.asset === 'USDT');
      setBalance(parseFloat(usdtBal?.balance || usdtBal?.availableBalance || '0'));

      // Positions
      const posRes = await axios.get(`${DEMO_API}/fapi/v2/positionRisk`, { params: sign({ timestamp: Date.now(), recvWindow: 10000 }), headers });

      // TP orders
      let tpOrders: any[] = [];
      try {
        const ordRes = await axios.get(`${DEMO_API}/fapi/v1/openOrders`, { params: sign({ timestamp: Date.now(), recvWindow: 10000 }), headers });
        tpOrders = ordRes.data;
      } catch (e) {}

      // SL algo orders
      let algoOrders: any[] = [];
      try {
        const algoRes = await axios.get(`${DEMO_API}/fapi/v1/openAlgoOrders`, { params: sign({ timestamp: Date.now(), recvWindow: 10000 }), headers });
        const d = algoRes.data;
        algoOrders = Array.isArray(d) ? d : (d.orders || []);
      } catch (e) {}

      const openPos: Position[] = [];
      let pnlSum = 0;

      for (const pos of posRes.data) {
        const amt = parseFloat(pos.positionAmt);
        if (amt === 0) continue;

        const entry = parseFloat(pos.entryPrice);
        const mark = parseFloat(pos.markPrice);
        const pnl = parseFloat(pos.unRealizedProfit);
        const side: 'LONG' | 'SHORT' = amt < 0 ? 'SHORT' : 'LONG';
        const pnlPct = side === 'SHORT' ? (entry / mark - 1) * 100 : (mark / entry - 1) * 100;
        const coin = pos.symbol.replace('USDT', '');

        pnlSum += pnl;

        // TP from limit orders
        const tpSide = side === 'LONG' ? 'SELL' : 'BUY';
        const tp = tpOrders.find((o: any) => o.symbol === pos.symbol && o.side === tpSide && o.type === 'LIMIT');
        let tpPrice: number | null = tp ? parseFloat(tp.price) : null;
        // Fallback: estimate TP from entry price (3% for LONG, 4% for SHORT)
        if (!tpPrice && entry > 0) {
          tpPrice = side === 'LONG' ? entry * 1.03 : entry * 0.96;
        }

        // SL from algo orders, fallback to STOP_MARKET open orders
        const slSide = side === 'LONG' ? 'SELL' : 'BUY';
        const sl = algoOrders.filter((o: any) => o.symbol === pos.symbol && o.side === slSide && o.algoStatus === 'NEW');
        let slPrice: number | null = sl.length > 0 ? parseFloat(sl[sl.length - 1].triggerPrice) : null;
        // Fallback: check STOP_MARKET in regular open orders
        if (!slPrice) {
          const slOrd = tpOrders.find((o: any) => o.symbol === pos.symbol && o.side === slSide && o.type === 'STOP_MARKET');
          slPrice = slOrd ? parseFloat(slOrd.stopPrice) : null;
        }
        // Last fallback: estimate SL from entry price (2% for SHORT, 1.5% for LONG)
        if (!slPrice && entry > 0) {
          slPrice = side === 'LONG' ? entry * 0.985 : entry * 1.02;
        }

        // Progress
        let progress = 0;
        if (tpPrice && entry > 0) {
          const totalDist = Math.abs(tpPrice - entry);
          const currDist = side === 'LONG' ? mark - entry : entry - mark;
          progress = totalDist > 0 ? Math.min(Math.max((currDist / totalDist) * 100, -50), 100) : 0;
        }

        // Trailing stop palier
        let palier = '';
        if (pnlPct >= 3.0) palier = 'SL @ +2%';
        else if (pnlPct >= 2.5) palier = 'SL @ +1%';
        else if (pnlPct >= 1.5) palier = 'SL @ BE';

        openPos.push({
          symbol: pos.symbol, coin, side, entryPrice: entry,
          markPrice: mark, quantity: Math.abs(amt), pnl,
          pnlPercent: pnlPct, tpPrice, slPrice,
          progressPercent: progress, trailPalier: palier,
        });
      }
      setPositions(openPos);
      setTotalPnl(pnlSum);

      // Trade history — aggregate fills into complete trades
      try {
        const histRes = await axios.get(`${DEMO_API}/fapi/v1/userTrades`, {
          params: sign({ timestamp: Date.now(), recvWindow: 10000, limit: 200 }), headers,
        });
        const raw = histRes.data.sort((a: any, b: any) => a.time - b.time);

        // Group fills into rounds: each "round" is an entry (opens position) + exit (closes it)
        const rounds: Trade[] = [];
        const tracker: Record<string, { qty: number; side: string; costSum: number; entryTime: number; fills: number }> = {};

        for (const t of raw) {
          const sym = t.symbol;
          const coin = sym.replace('USDT', '');
          const side = t.side; // BUY or SELL
          const qty = parseFloat(t.qty);
          const price = parseFloat(t.price);
          const pnl = parseFloat(t.realizedPnl);
          const ts = t.time;

          if (!tracker[sym]) {
            // First fill for this symbol — opening
            tracker[sym] = { qty, side, costSum: price * qty, entryTime: ts, fills: 1, closedQty: 0, closedCost: 0, totalPnl: 0 };
          } else {
            const tk = tracker[sym];
            if (side === tk.side) {
              // Same side = adding to position
              tk.costSum += price * qty;
              tk.qty += qty;
              tk.fills++;
            } else {
              // Opposite side = closing (accumulate all close fills)
              tk.closedQty += qty;
              tk.closedCost += price * qty;
              tk.totalPnl += pnl;
              tk.qty -= qty;

              if (tk.qty <= 0.0001) {
                // Position fully closed — record complete round
                const entryAvg = tk.costSum / (tk.closedQty + tk.qty);
                const exitAvg = tk.closedCost / tk.closedQty;
                const direction: 'LONG' | 'SHORT' = tk.side === 'BUY' ? 'LONG' : 'SHORT';
                const pnlPct = direction === 'LONG'
                  ? ((exitAvg / entryAvg) - 1) * 100
                  : ((entryAvg / exitAvg) - 1) * 100;
                const sizeUsd = entryAvg * tk.closedQty;
                const pnlUsd = tk.totalPnl;
                const durH = (ts - tk.entryTime) / 3600000;

                rounds.push({
                  coin, direction,
                  result: pnlPct >= 0 ? 'WIN' : 'LOSS',
                  entryPrice: entryAvg, exitPrice: exitAvg,
                  quantity: tk.closedQty,
                  realizedPnl: tk.totalPnl,
                  pnlPercent: pnlPct,
                  sizeUsd, pnlUsd,
                  entryTime: tk.entryTime, exitTime: ts,
                  durationHours: durH,
                });
                delete tracker[sym];
              }
            }
          }
        }

        // Filter: only show trades from 05/04 onwards
        const cutoff = new Date('2026-04-05T00:00:00').getTime();
        const filtered = rounds.filter((r: Trade) => r.exitTime >= cutoff);
        setHistory(filtered.reverse().slice(0, 50));
      } catch (e) {}
    } catch (e: any) {
      console.error('Fetch error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 30000);
    return () => clearInterval(iv);
  }, []);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const equity = balance + totalPnl;
  const pnlColor = totalPnl >= 0 ? COLORS.success : COLORS.danger;

  const renderPosition = ({ item }: { item: Position }) => {
    const isProfit = item.pnl >= 0;
    const sColor = item.side === 'LONG' ? COLORS.success : COLORS.danger;
    const img = COIN_IMAGES[item.coin];

    return (
      <View style={[ps.card, { borderColor: `${sColor}20` }]}>
        <View style={[ps.glowStrip, { backgroundColor: `${sColor}15` }]} />

        {/* Top: coin + PnL */}
        <View style={ps.topRow}>
          <View style={ps.coinRow}>
            {img && <Image source={{ uri: img }} style={ps.coinImg} />}
            <View>
              <Text style={ps.coinName}>{item.coin}</Text>
              <View style={[ps.sideBadge, { backgroundColor: `${sColor}15`, borderColor: `${sColor}40` }]}>
                <Text style={[ps.sideText, { color: sColor }]}>{item.side}</Text>
              </View>
            </View>
          </View>
          <View style={ps.pnlCol}>
            <Text style={[ps.pnlPct, { color: isProfit ? COLORS.success : COLORS.danger }]}>
              {item.pnlPercent >= 0 ? '+' : ''}{item.pnlPercent.toFixed(2)}%
            </Text>
            <Text style={[ps.pnlUsd, { color: isProfit ? COLORS.success : COLORS.danger }]}>
              ${item.pnl.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        {item.tpPrice && (
          <View style={ps.progressSection}>
            <View style={ps.progressLabels}>
              <Text style={ps.slLabel}>SL</Text>
              {item.trailPalier ? (
                <View style={ps.trailBadge}>
                  <Text style={ps.trailText}>{item.trailPalier}</Text>
                </View>
              ) : null}
              <Text style={ps.tpLabel}>TP {item.progressPercent.toFixed(0)}%</Text>
            </View>
            <View style={ps.progressBar}>
              <View style={[
                ps.progressFill,
                { width: `${Math.max(0, Math.min(item.progressPercent, 100))}%`, backgroundColor: item.progressPercent >= 0 ? COLORS.success : COLORS.danger },
              ]} />
            </View>
          </View>
        )}

        {/* Data grid */}
        <View style={ps.dataGrid}>
          <View style={ps.dataItem}>
            <Text style={ps.dataLabel}>Entry</Text>
            <Text style={ps.dataValue}>${item.entryPrice.toFixed(4)}</Text>
          </View>
          <View style={ps.dataItem}>
            <Text style={ps.dataLabel}>Mark</Text>
            <Text style={[ps.dataValue, { color: isProfit ? COLORS.success : COLORS.danger }]}>${item.markPrice.toFixed(4)}</Text>
          </View>
          {item.tpPrice && (
            <View style={ps.dataItem}>
              <Text style={[ps.dataLabel, { color: COLORS.success }]}>TP</Text>
              <Text style={[ps.dataValue, { color: COLORS.success }]}>${item.tpPrice.toFixed(4)}</Text>
            </View>
          )}
          {item.slPrice && (
            <View style={ps.dataItem}>
              <Text style={[ps.dataLabel, { color: COLORS.danger }]}>SL</Text>
              <Text style={[ps.dataValue, { color: COLORS.danger }]}>${item.slPrice.toFixed(4)}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderTrade = ({ item }: { item: Trade }) => {
    const isWin = item.result === 'WIN';
    const dirColor = item.direction === 'LONG' ? COLORS.success : COLORS.danger;
    const resultColor = isWin ? COLORS.success : COLORS.danger;
    const img = COIN_IMAGES[item.coin];
    const durStr = item.durationHours < 1
      ? `${Math.round(item.durationHours * 60)}m`
      : item.durationHours < 24
        ? `${item.durationHours.toFixed(1)}h`
        : `${(item.durationHours / 24).toFixed(1)}d`;
    const dateStr = new Date(item.exitTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const timeStr = new Date(item.exitTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const priceFmt = (p: number) => p >= 100 ? p.toFixed(2) : p >= 1 ? p.toFixed(4) : p.toFixed(6);

    return (
      <View style={[hs.card, { borderLeftColor: resultColor, borderLeftWidth: 3 }]}>
        <View style={hs.topRow}>
          <View style={hs.coinRow}>
            {img && <Image source={{ uri: img }} style={hs.img} />}
            <View>
              <Text style={hs.coin}>{item.coin}</Text>
              <View style={[hs.dirBadge, { backgroundColor: `${dirColor}15`, borderColor: `${dirColor}40` }]}>
                <Text style={[hs.dirText, { color: dirColor }]}>{item.direction}</Text>
              </View>
            </View>
          </View>
          <View style={hs.resultCol}>
            <View style={[hs.resultBadge, { backgroundColor: `${resultColor}18` }]}>
              <Text style={[hs.resultText, { color: resultColor }]}>{isWin ? 'WIN' : 'LOSS'}</Text>
            </View>
            <Text style={[hs.pnlPct, { color: resultColor }]}>
              {item.pnlPercent >= 0 ? '+' : ''}{item.pnlPercent.toFixed(2)}%
            </Text>
            <Text style={[hs.pnlUsd, { color: resultColor }]}>
              {item.pnlUsd >= 0 ? '+' : ''}${item.pnlUsd.toFixed(2)}
            </Text>
          </View>
        </View>
        <View style={hs.detailGrid}>
          <View style={hs.detailItem}>
            <Text style={hs.detailLabel}>Entry</Text>
            <Text style={hs.detailValue}>${priceFmt(item.entryPrice)}</Text>
          </View>
          <View style={hs.detailItem}>
            <Text style={hs.detailLabel}>Exit</Text>
            <Text style={[hs.detailValue, { color: resultColor }]}>${priceFmt(item.exitPrice)}</Text>
          </View>
          <View style={hs.detailItem}>
            <Text style={hs.detailLabel}>Size</Text>
            <Text style={hs.detailValue}>${item.sizeUsd.toFixed(2)}</Text>
          </View>
          <View style={hs.detailItem}>
            <Text style={hs.detailLabel}>Duration</Text>
            <Text style={hs.detailValue}>{durStr}</Text>
          </View>
          <View style={hs.detailItem}>
            <Text style={hs.detailLabel}>Date</Text>
            <Text style={hs.detailValue}>{dateStr} {timeStr}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={st.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={st.loadText}>Connecting to Binance...</Text>
      </View>
    );
  }

  return (
    <View style={st.container}>
      {/* Header */}
      <View style={st.header}>
        <Text style={st.title}>Live Trading</Text>
        <View style={st.liveRow}>
          <View style={st.liveDot} />
          <Text style={st.liveText}>DEMO</Text>
        </View>
      </View>

      {/* Portfolio Summary */}
      <View style={st.portfolio}>
        <View style={st.portMain}>
          <Text style={st.portLabel}>Total Equity</Text>
          <Text style={st.portEquity}>${equity.toFixed(2)}</Text>
        </View>
        <View style={st.portGrid}>
          <View style={st.portItem}>
            <Text style={st.portItemLabel}>Balance</Text>
            <Text style={st.portItemValue}>${balance.toFixed(2)}</Text>
          </View>
          <View style={[st.portItem, { borderLeftWidth: 1, borderLeftColor: COLORS.border }]}>
            <Text style={st.portItemLabel}>PnL</Text>
            <Text style={[st.portItemValue, { color: pnlColor }]}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
            </Text>
          </View>
          <View style={[st.portItem, { borderLeftWidth: 1, borderLeftColor: COLORS.border }]}>
            <Text style={st.portItemLabel}>Positions</Text>
            <Text style={[st.portItemValue, { color: COLORS.primary }]}>{positions.length}</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={st.tabs}>
        {(['positions', 'history'] as const).map(t => (
          <TouchableOpacity key={t} style={[st.tab, tab === t && st.tabActive]} onPress={() => setTab(t)}>
            <Text style={[st.tabText, tab === t && st.tabTextActive]}>
              {t === 'positions' ? `Positions (${positions.length})` : `History (${history.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {tab === 'positions' ? (
        <FlatList
          data={positions}
          renderItem={renderPosition}
          keyExtractor={i => i.symbol}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={st.empty}>
              <Text style={st.emptyIcon}>📡</Text>
              <Text style={st.emptyText}>No open positions</Text>
              <Text style={st.emptyHint}>Bot checks at 00:00 & 08:00 UTC</Text>
            </View>
          }
          contentContainerStyle={st.list}
        />
      ) : (
        <FlatList
          data={history}
          renderItem={renderTrade}
          keyExtractor={(_, i) => i.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={st.empty}>
              <Text style={st.emptyText}>No trade history</Text>
            </View>
          }
          contentContainerStyle={st.list}
        />
      )}
    </View>
  );
};

// ═══ STYLES ═══

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadText: { color: COLORS.textSecondary, marginTop: 12, fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
  liveRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,212,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,212,255,0.3)' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginRight: 5 },
  liveText: { fontSize: 10, fontWeight: '800', color: COLORS.primary, letterSpacing: 1.2 },

  portfolio: { marginHorizontal: 16, backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 14, ...SHADOWS.medium },
  portMain: { padding: 18, paddingBottom: 14 },
  portLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  portEquity: { fontSize: 32, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  portGrid: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.border },
  portItem: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  portItemLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600', letterSpacing: 0.5, marginBottom: 3 },
  portItemValue: { fontSize: 16, fontWeight: '800', color: COLORS.text },

  tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'transparent' },
  tabActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}10` },
  tabText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary },

  empty: { alignItems: 'center', paddingTop: 50 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
  emptyHint: { fontSize: 12, color: COLORS.textDark, marginTop: 4 },
});

// Position card styles
const ps = StyleSheet.create({
  card: { backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 12, ...SHADOWS.medium },
  glowStrip: { height: 3, width: '100%' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 10 },
  coinRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  coinImg: { width: 36, height: 36, borderRadius: 18 },
  coinName: { fontSize: 18, fontWeight: '800', color: COLORS.text, letterSpacing: 0.3 },
  sideBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, marginTop: 3, alignSelf: 'flex-start' },
  sideText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  pnlCol: { alignItems: 'flex-end' },
  pnlPct: { fontSize: 22, fontWeight: '900' },
  pnlUsd: { fontSize: 13, fontWeight: '700', marginTop: 1 },

  progressSection: { paddingHorizontal: 16, marginBottom: 10 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  slLabel: { fontSize: 10, color: COLORS.danger, fontWeight: '800', letterSpacing: 0.5 },
  tpLabel: { fontSize: 10, color: COLORS.success, fontWeight: '800', letterSpacing: 0.5 },
  trailBadge: { backgroundColor: 'rgba(0,212,255,0.12)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(0,212,255,0.3)' },
  trailText: { fontSize: 9, color: COLORS.primary, fontWeight: '800', letterSpacing: 0.5 },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  dataGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingBottom: 14, gap: 0 },
  dataItem: { width: '50%', paddingVertical: 5 },
  dataLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 },
  dataValue: { fontSize: 13, color: COLORS.text, fontWeight: '700' },
});

// History card styles
const hs = StyleSheet.create({
  card: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10, overflow: 'hidden', ...SHADOWS.small },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingBottom: 10 },
  coinRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  img: { width: 32, height: 32, borderRadius: 16 },
  coin: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  dirBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, borderWidth: 1, marginTop: 2, alignSelf: 'flex-start' },
  dirText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  resultCol: { alignItems: 'flex-end' },
  resultBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginBottom: 3 },
  resultText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  pnlPct: { fontSize: 18, fontWeight: '900' },
  pnlUsd: { fontSize: 12, fontWeight: '700', marginTop: 1 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, paddingBottom: 12, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
  detailItem: { width: '50%', paddingVertical: 3 },
  detailLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600', letterSpacing: 0.4, marginBottom: 1 },
  detailValue: { fontSize: 12, color: COLORS.text, fontWeight: '700' },
});

export default LiveTradingScreen;
