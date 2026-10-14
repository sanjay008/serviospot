import { Platform } from 'react-native';
export const palette = {
  bg: '#F6F4FB',
  surface: '#FFFFFF',
  ink: '#1E1B4B',
  muted: '#7A7693',
  line: '#EEEDF5',
  accent: '#7C5CFF',
  accentDark: '#5B45E0',
  accentSoft: '#F3EFFF',
  mint: '#DCFCE7',
  mintDark: '#059669',
  gold: '#D97706',
  goldSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  infoSoft: '#E0F2FE',
  well: '#F6F5FB',
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

export const shadow = Platform.select({
  android: { elevation: 0 },
  default: {
    shadowColor: '#241C4B',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
}) ?? { elevation: 0 };
