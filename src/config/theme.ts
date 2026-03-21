// Dark Theme Configuration - Ultra Modern
export const COLORS = {
  // Backgrounds
  background: '#0A0E27',      // Bleu foncé profond
  card: '#1A1F3A',            // Bleu gris foncé
  cardSecondary: '#252B4A',   // Bleu gris moyen

  // Primary Colors
  primary: '#00D4FF',         // Cyan brillant
  primaryDark: '#0099CC',     // Cyan foncé
  primaryLight: '#33DDFF',    // Cyan clair

  // Signal Colors
  success: '#00FF88',         // Vert néon (BUY)
  danger: '#FF3366',          // Rouge néon (SELL)
  warning: '#FFB800',         // Jaune doré (HOLD)

  // Text Colors
  text: '#E8EAED',            // Gris clair
  textSecondary: '#8E92BC',   // Gris bleuté
  textDark: '#5A5F7F',        // Gris foncé

  // Utility Colors
  border: '#2A3050',          // Bordure subtile
  borderLight: '#3A4060',     // Bordure claire
  shadow: '#000000',          // Ombres
  white: '#FFFFFF',
  black: '#000000',

  // Transparency
  overlay: 'rgba(10, 14, 39, 0.95)',
  glassmorphism: 'rgba(26, 31, 58, 0.7)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const FONT_WEIGHTS = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
};

export const SHADOWS = {
  small: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  large: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
};
