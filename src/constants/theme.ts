import { Platform } from 'react-native';

/** ServioSpot brand — violet primary, cool lavender surfaces */
export const palette = {
  bg: '#F6F4FB',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  ink: '#1F1A33',
  inkSecondary: '#4A4563',
  muted: '#7A7693',
  mutedSoft: '#A39EBA',
  line: '#E8E4F2',
  lineStrong: '#D4CFE3',
  accent: '#7C5BFF',
  accentDark: '#5B45E0',
  accentSoft: '#F1EDFC',
  accentMid: '#E4DCFF',
  mint: '#DCFCE7',
  mintDark: '#059669',
  gold: '#D97706',
  goldSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  info: '#0284C7',
  infoSoft: '#E0F2FE',
  well: '#F3F0FA',
  overlay: 'rgba(20, 16, 40, 0.45)',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;

export const control = {
  height: 52,
  heightSm: 44,
  icon: 40,
  hitSlop: 8,
} as const;

export const shadow = Platform.select({
  android: {
    elevation: 2,
    shadowColor: '#241C4B',
  },
  default: {
    shadowColor: '#241C4B',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
}) ?? { elevation: 2 };

export const shadowSoft = Platform.select({
  android: {
    elevation: 1,
    shadowColor: '#241C4B',
  },
  default: {
    shadowColor: '#241C4B',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
}) ?? { elevation: 1 };
