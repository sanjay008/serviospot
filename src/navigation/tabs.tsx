import { Platform, type ColorValue } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { palette } from '@/constants/theme';

export function tabOptions() {
  return {
    headerShown: false,
    tabBarActiveTintColor: palette.accent,
    tabBarInactiveTintColor: palette.muted,
    tabBarStyle: {
      backgroundColor: palette.surface,
      borderTopColor: palette.line,
      borderTopWidth: 1,
      height: Platform.OS === 'ios' ? 84 : 64,
      paddingTop: 6,
    },
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const },
  };
}

export function tabIcon(name: IconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => <Icon name={name} color={String(color)} size={size - 2} />;
}
