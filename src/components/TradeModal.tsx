// TradeModal - Modal for creating virtual trades
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../config/theme';
import { CryptoPrediction } from '../types';
import VirtualTradeService from '../services/virtualTradeService';

interface TradeModalProps {
  visible: boolean;
  onClose: () => void;
  prediction: CryptoPrediction;
  currentPrice: number;
  onTradeCreated?: () => void;
}

const TradeModal: React.FC<TradeModalProps> = ({
  visible,
  onClose,
  prediction,
  currentPrice,
  onTradeCreated,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  // Initialize form with AI predictions
  const [entryPrice, setEntryPrice] = useState(currentPrice.toString());
  const [targetPrice, setTargetPrice] = useState(
    prediction.risk_management?.target_price.toString() || currentPrice.toString()
  );
  const [stopLoss, setStopLoss] = useState(
    prediction.risk_management?.stop_loss.toString() || currentPrice.toString()
  );
  const [quantity, setQuantity] = useState('1');

  const handleCreateTrade = async () => {
    try {
      setLoading(true);

      const trade = await VirtualTradeService.createTrade({
        cryptoId: prediction.crypto,
        symbol: prediction.symbol,
        name: prediction.name,
        signal: prediction.signal,
        entryPrice: parseFloat(entryPrice),
        targetPrice: parseFloat(targetPrice),
        stopLoss: parseFloat(stopLoss),
        quantity: parseFloat(quantity),
        confidence: prediction.confidence,
        currentPrice: parseFloat(entryPrice),
      });

      console.log('Trade created:', trade);
      onClose();

      // Navigate to portfolio after successful trade creation
      if (onTradeCreated) {
        onTradeCreated();
      }
    } catch (error) {
      console.error('Error creating trade:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return COLORS.success;
      case 'SELL': return COLORS.danger;
      case 'HOLD': return COLORS.warning;
      default: return COLORS.textSecondary;
    }
  };

  const calculatePotentialProfit = () => {
    const entry = parseFloat(entryPrice);
    const target = parseFloat(targetPrice);
    const qty = parseFloat(quantity);

    if (isNaN(entry) || isNaN(target) || isNaN(qty)) return 0;

    return (target - entry) * qty;
  };

  const calculatePotentialLoss = () => {
    const entry = parseFloat(entryPrice);
    const stop = parseFloat(stopLoss);
    const qty = parseFloat(quantity);

    if (isNaN(entry) || isNaN(stop) || isNaN(qty)) return 0;

    return (entry - stop) * qty;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('createTrade')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Crypto Info */}
            <View style={styles.cryptoInfo}>
              <Text style={styles.cryptoSymbol}>
                {prediction.symbol.toUpperCase().replace('USDT', '/USDT')}
              </Text>
              <Text style={styles.cryptoName}>{prediction.name}</Text>
              <View style={[
                styles.signalBadge,
                { backgroundColor: `${getSignalColor(prediction.signal)}20` }
              ]}>
                <Text style={[styles.signalText, { color: getSignalColor(prediction.signal) }]}>
                  {prediction.signal}
                </Text>
              </View>
            </View>

            {/* AI Confidence */}
            <View style={styles.confidenceSection}>
              <Text style={styles.label}>{t('aiConfidence')}</Text>
              <Text style={styles.confidenceValue}>
                {(prediction.confidence * 100).toFixed(1)}%
              </Text>
            </View>

            {/* Form Fields */}
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('entryPrice')}</Text>
                <TextInput
                  style={styles.input}
                  value={entryPrice}
                  onChangeText={setEntryPrice}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textDark}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('targetPrice')}</Text>
                <TextInput
                  style={styles.input}
                  value={targetPrice}
                  onChangeText={setTargetPrice}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textDark}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('stopLoss')}</Text>
                <TextInput
                  style={styles.input}
                  value={stopLoss}
                  onChangeText={setStopLoss}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textDark}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('quantity')}</Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="decimal-pad"
                  placeholder="1.00"
                  placeholderTextColor={COLORS.textDark}
                />
              </View>
            </View>

            {/* Potential Profit/Loss */}
            <View style={styles.potentialSection}>
              <View style={styles.potentialRow}>
                <Text style={styles.potentialLabel}>{t('potentialProfit')}</Text>
                <Text style={[styles.potentialValue, { color: COLORS.success }]}>
                  ${calculatePotentialProfit().toFixed(2)}
                </Text>
              </View>
              <View style={styles.potentialRow}>
                <Text style={styles.potentialLabel}>{t('potentialLoss')}</Text>
                <Text style={[styles.potentialValue, { color: COLORS.danger }]}>
                  ${calculatePotentialLoss().toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.createButton]}
                onPress={handleCreateTrade}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.background} />
                ) : (
                  <Text style={styles.createButtonText}>{t('createTrade')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '90%',
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.cardSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 28,
    color: COLORS.text,
    lineHeight: 28,
    marginTop: -2,
  },
  cryptoInfo: {
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cryptoSymbol: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  cryptoName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  signalBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  signalText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  confidenceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: `${COLORS.primary}10`,
  },
  confidenceValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  formSection: {
    padding: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.cardSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  potentialSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cardSecondary,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  potentialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  potentialLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  potentialValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  button: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.cardSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  createButton: {
    backgroundColor: COLORS.primary,
  },
  createButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.background,
  },
});

export default TradeModal;
