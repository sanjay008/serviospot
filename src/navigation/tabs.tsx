import type { BottomTabBarButtonProps } from 'expo-router/js-tabs';
import { Platform, Pressable, useWindowDimensions, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { palette } from '@/constants/theme';

export function useTabScreenOptions() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const bottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 4 : 8);

  return {
    headerShown: false,
    tabBarActiveTintColor: palette.accent,
    tabBarInactiveTintColor: palette.muted,
    tabBarStyle: {
      backgroundColor: palette.surface,
      borderTopColor: palette.line,
      borderTopWidth: 1,
      height: (compact ? 52 : 56) + bottom,
      paddingTop: 4,
      paddingBottom: bottom,
      elevation: 0,
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
    },
    tabBarLabelStyle: { fontSize: compact ? 10 : 11, fontWeight: '600' as const },
    tabBarItemStyle: { paddingHorizontal: compact ? 0 : 2 },
    tabBarButton: (props: BottomTabBarButtonProps) => (
      <Pressable onPress={props.onPress} onLongPress={props.onLongPress} android_ripple={{ color: 'transparent' }} style={props.style}>
        {props.children}
      </Pressable>
    ),
  };
}

export function tabIcon(name: IconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => <Icon name={name} color={String(color)} size={Math.max(16, size - 2)} />;
}
