// Database Service using AsyncStorage for settings persistence
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@crypto_adviser_settings';
const LANGUAGE_KEY = '@crypto_adviser_language';

export interface Settings {
  language: string;
  version: string;
}

class DatabaseService {
  // Get the saved language
  async getLanguage(): Promise<string> {
    try {
      const language = await AsyncStorage.getItem(LANGUAGE_KEY);
      return language || 'en'; // default to English
    } catch (error) {
      console.error('Error getting language:', error);
      return 'en';
    }
  }

  // Save the selected language
  async setLanguage(language: string): Promise<void> {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (error) {
      console.error('Error setting language:', error);
    }
  }

  // Get all settings
  async getSettings(): Promise<Settings> {
    try {
      const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
      if (settingsJson) {
        return JSON.parse(settingsJson);
      }
      // Return default settings
      return {
        language: 'en',
        version: '1.0.0',
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        language: 'en',
        version: '1.0.0',
      };
    }
  }

  // Save settings
  async saveSettings(settings: Settings): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  // Get favorites list
  async getFavorites(): Promise<string[]> {
    try {
      const favoritesJson = await AsyncStorage.getItem('@crypto_adviser_favorites');
      if (favoritesJson) {
        return JSON.parse(favoritesJson);
      }
      return [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  // Add a crypto to favorites
  async addFavorite(cryptoId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      if (!favorites.includes(cryptoId)) {
        favorites.push(cryptoId);
        await AsyncStorage.setItem('@crypto_adviser_favorites', JSON.stringify(favorites));
      }
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  }

  // Remove a crypto from favorites
  async removeFavorite(cryptoId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      const updatedFavorites = favorites.filter(id => id !== cryptoId);
      await AsyncStorage.setItem('@crypto_adviser_favorites', JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  }

  // Toggle favorite status
  async toggleFavorite(cryptoId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      const isFavorite = favorites.includes(cryptoId);

      if (isFavorite) {
        await this.removeFavorite(cryptoId);
        return false;
      } else {
        await this.addFavorite(cryptoId);
        return true;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  }

  // Check if crypto is favorite
  async isFavorite(cryptoId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.includes(cryptoId);
    } catch (error) {
      console.error('Error checking favorite:', error);
      return false;
    }
  }

  // Clear all data (for testing)
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([SETTINGS_KEY, LANGUAGE_KEY, '@crypto_adviser_favorites']);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
}

export default new DatabaseService();
