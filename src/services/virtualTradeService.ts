// Virtual Trade Service - Manage virtual trades in AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VirtualTrade } from '../types';

const TRADES_KEY = '@crypto_adviser_virtual_trades';

class VirtualTradeService {
  // Get all trades
  async getAllTrades(): Promise<VirtualTrade[]> {
    try {
      const tradesJson = await AsyncStorage.getItem(TRADES_KEY);
      if (tradesJson) {
        return JSON.parse(tradesJson);
      }
      return [];
    } catch (error) {
      console.error('Error getting trades:', error);
      return [];
    }
  }

  // Get trade by ID
  async getTradeById(id: string): Promise<VirtualTrade | null> {
    try {
      const trades = await this.getAllTrades();
      return trades.find(trade => trade.id === id) || null;
    } catch (error) {
      console.error('Error getting trade by ID:', error);
      return null;
    }
  }

  // Create new trade
  async createTrade(trade: Omit<VirtualTrade, 'id' | 'createdAt' | 'status'>): Promise<VirtualTrade> {
    try {
      const trades = await this.getAllTrades();
      const newTrade: VirtualTrade = {
        ...trade,
        id: Date.now().toString(),
        status: 'open',
        createdAt: new Date().toISOString(),
        priceHistory: [{
          price: trade.entryPrice,
          timestamp: new Date().toISOString(),
        }],
      };

      trades.push(newTrade);
      await AsyncStorage.setItem(TRADES_KEY, JSON.stringify(trades));
      return newTrade;
    } catch (error) {
      console.error('Error creating trade:', error);
      throw error;
    }
  }

  // Update trade
  async updateTrade(id: string, updates: Partial<VirtualTrade>): Promise<VirtualTrade | null> {
    try {
      const trades = await this.getAllTrades();
      const index = trades.findIndex(trade => trade.id === id);

      if (index === -1) return null;

      trades[index] = { ...trades[index], ...updates };
      await AsyncStorage.setItem(TRADES_KEY, JSON.stringify(trades));
      return trades[index];
    } catch (error) {
      console.error('Error updating trade:', error);
      return null;
    }
  }

  // Add price to history
  async addPriceToHistory(id: string, price: number): Promise<void> {
    try {
      const trade = await this.getTradeById(id);
      if (!trade) return;

      const priceHistory = trade.priceHistory || [];
      priceHistory.push({
        price,
        timestamp: new Date().toISOString(),
      });

      await this.updateTrade(id, {
        currentPrice: price,
        priceHistory,
      });
    } catch (error) {
      console.error('Error adding price to history:', error);
    }
  }

  // Update trade with current price and check stop loss / target
  async updateTradePrice(id: string, currentPrice: number): Promise<VirtualTrade | null> {
    try {
      const trade = await this.getTradeById(id);
      if (!trade || trade.status !== 'open') return null;

      const profitLoss = (currentPrice - trade.entryPrice) * trade.quantity;
      const profitLossPercent = ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;

      let status = trade.status;
      let closedAt = trade.closedAt;

      // Check if target or stop loss reached
      if (trade.signal === 'BUY') {
        if (currentPrice >= trade.targetPrice) {
          status = 'success';
          closedAt = new Date().toISOString();
        } else if (currentPrice <= trade.stopLoss) {
          status = 'failed';
          closedAt = new Date().toISOString();
        }
      } else if (trade.signal === 'SELL') {
        if (currentPrice <= trade.targetPrice) {
          status = 'success';
          closedAt = new Date().toISOString();
        } else if (currentPrice >= trade.stopLoss) {
          status = 'failed';
          closedAt = new Date().toISOString();
        }
      }

      // Only add to price history every 4 hours to avoid huge lists
      const priceHistory = trade.priceHistory || [];
      const lastHistoryEntry = priceHistory[priceHistory.length - 1];
      const now = new Date();
      const shouldAddToHistory = !lastHistoryEntry ||
        (now.getTime() - new Date(lastHistoryEntry.timestamp).getTime() >= 4 * 60 * 60 * 1000); // 4 hours

      if (shouldAddToHistory) {
        await this.addPriceToHistory(id, currentPrice);
      }

      return await this.updateTrade(id, {
        currentPrice,
        profitLoss,
        profitLossPercent,
        status,
        closedAt,
      });
    } catch (error) {
      console.error('Error updating trade price:', error);
      return null;
    }
  }

  // Close trade manually
  async closeTrade(id: string): Promise<VirtualTrade | null> {
    try {
      return await this.updateTrade(id, {
        status: 'closed',
        closedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error closing trade:', error);
      return null;
    }
  }

  // Delete trade
  async deleteTrade(id: string): Promise<boolean> {
    try {
      const trades = await this.getAllTrades();
      const filtered = trades.filter(trade => trade.id !== id);
      await AsyncStorage.setItem(TRADES_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting trade:', error);
      return false;
    }
  }

  // Get open trades
  async getOpenTrades(): Promise<VirtualTrade[]> {
    try {
      const trades = await this.getAllTrades();
      return trades.filter(trade => trade.status === 'open');
    } catch (error) {
      console.error('Error getting open trades:', error);
      return [];
    }
  }

  // Get closed trades
  async getClosedTrades(): Promise<VirtualTrade[]> {
    try {
      const trades = await this.getAllTrades();
      return trades.filter(trade => trade.status !== 'open');
    } catch (error) {
      console.error('Error getting closed trades:', error);
      return [];
    }
  }

  // Clear all trades
  async clearAllTrades(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TRADES_KEY);
    } catch (error) {
      console.error('Error clearing trades:', error);
    }
  }
}

export default new VirtualTradeService();
