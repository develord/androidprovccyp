// HomeScreen - List all cryptos with stats
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../config/theme';
import { RootStackParamList, CryptoPrediction, Stats } from '../types';
import APIService from '../services/apiService';
import CryptoCard from '../components/CryptoCard';
import StatCard from '../components/StatCard';
import DatabaseService from '../services/databaseService';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [predictions, setPredictions] = useState<CryptoPrediction[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, buy: 0, sell: 0, hold: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  // Reload favorites when screen comes into focus (e.g., coming back from Detail screen)
  useFocusEffect(
    useCallback(() => {
      // Reload favorites and re-sort predictions
      const refreshFavorites = async () => {
        const updatedFavorites = await DatabaseService.getFavorites();
        setFavorites(updatedFavorites);

        // Re-sort existing predictions based on updated favorites
        setPredictions(prevPredictions => {
          if (prevPredictions.length === 0) return prevPredictions;

          return [...prevPredictions].sort((a, b) => {
            const aIsFavorite = updatedFavorites.includes(a.crypto);
            const bIsFavorite = updatedFavorites.includes(b.crypto);

            if (aIsFavorite && !bIsFavorite) return -1;
            if (!aIsFavorite && bIsFavorite) return 1;
            return 0;
          });
        });
      };

      refreshFavorites();
    }, [])
  );

  const loadData = async () => {
    await loadFavorites();
    await loadPredictions();
  };

  const loadFavorites = async () => {
    const savedFavorites = await DatabaseService.getFavorites();
    setFavorites(savedFavorites);
  };

  const loadPredictions = async () => {
    try {
      setError(null);
      const response = await APIService.getAllPredictions();

      // Convert predictions object to array
      let predictionsArray = Object.values(response.predictions);

      // Sort predictions: favorites first, then others
      const currentFavorites = await DatabaseService.getFavorites();
      predictionsArray = predictionsArray.sort((a, b) => {
        const aIsFavorite = currentFavorites.includes(a.crypto);
        const bIsFavorite = currentFavorites.includes(b.crypto);

        if (aIsFavorite && !bIsFavorite) return -1;
        if (!aIsFavorite && bIsFavorite) return 1;
        return 0;
      });

      setPredictions(predictionsArray);

      // Calculate stats
      const newStats: Stats = {
        total: predictionsArray.length,
        buy: predictionsArray.filter(p => p.signal === 'BUY').length,
        sell: predictionsArray.filter(p => p.signal === 'SELL').length,
        hold: predictionsArray.filter(p => p.signal === 'HOLD').length,
      };
      setStats(newStats);
    } catch (err) {
      console.error('Error loading predictions:', err);
      setError('Failed to load predictions. Please check if the API is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleFavorite = async (cryptoId: string) => {
    const newIsFavorite = await DatabaseService.toggleFavorite(cryptoId);
    await loadFavorites();

    // Re-sort predictions
    setPredictions(prevPredictions => {
      const sorted = [...prevPredictions].sort((a, b) => {
        const aIsFavorite = favorites.includes(a.crypto) || (a.crypto === cryptoId && newIsFavorite);
        const bIsFavorite = favorites.includes(b.crypto) || (b.crypto === cryptoId && newIsFavorite);

        if (aIsFavorite && !bIsFavorite) return -1;
        if (!aIsFavorite && bIsFavorite) return 1;
        return 0;
      });
      return sorted;
    });
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    APIService.clearCache();
    loadData();
  }, []);

  const handleCryptoPress = (crypto: CryptoPrediction) => {
    navigation.navigate('Detail', { crypto });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Crypto Adviser</Text>
      <Text style={styles.subtitle}>AI-Powered Trading Signals</Text>

      <Text style={styles.sectionTitle}>All Cryptocurrencies</Text>
    </View>
  );

  const renderItem = ({ item }: { item: CryptoPrediction }) => {
    const isFavorite = favorites.includes(item.crypto);

    return (
      <CryptoCard
        crypto={item}
        onPress={() => handleCryptoPress(item)}
        isFavorite={isFavorite}
        onToggleFavorite={() => handleToggleFavorite(item.crypto)}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading predictions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorHint}>
          Make sure the API server is running on port 8000
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <FlatList
        data={predictions}
        renderItem={renderItem}
        keyExtractor={(item) => item.crypto}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  errorHint: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.extrabold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  statsContainer: {
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xl,
    marginHorizontal: -SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
});

export default HomeScreen;
