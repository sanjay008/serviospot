import { Tabs } from 'expo-router';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/flow2/components/Icon';
import { palette } from '@/flow2/constants/theme';
import { useApp } from '@/flow2/state/app';
import { useType } from '@/hooks/use-type';

function TabIcon({ name, color, size }: { name: IconName; color: string; size: number }) {
  return <Icon name={name} color={color} size={Math.max(16, size - 2)} />;
}

export default function VendorTabsLayout() {
  const { t } = useApp();
  const tx = (en: string) => t({ en, nl: en });
  const insets = useSafeAreaInsets();
  const type = useType();
  const bottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 4 : 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.line,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 58 + bottom,
          paddingTop: 6,
          paddingBottom: bottom,
          elevation: 0,
          shadowOpacity: 0,
          shadowRadius: 0,
          shadowOffset: { width: 0, height: 0 },
        },
        tabBarLabelStyle: { fontSize: type.tab, fontWeight: '700' as const },
        tabBarItemStyle: { paddingHorizontal: 2 },
        tabBarButton: (props: any) => (
          <Pressable
            onPress={props.onPress}
            onLongPress={props.onLongPress}
            android_ripple={{ color: 'transparent' }}
            style={props.style}
          >
            {props.children}
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: tx('Home'), tabBarIcon: ({ color, size }) => <TabIcon name="home" color={String(color)} size={size} /> }}
      />
      <Tabs.Screen
        name="leads"
        options={{ title: tx('Requests'), tabBarIcon: ({ color, size }) => <TabIcon name="inbox" color={String(color)} size={size} /> }}
      />
      <Tabs.Screen
        name="packages"
        options={{ title: tx('Packages'), tabBarIcon: ({ color, size }) => <TabIcon name="box" color={String(color)} size={size} /> }}
      />
      <Tabs.Screen name="menu" options={{ href: null }} />
      <Tabs.Screen
        name="chat"
        options={{ title: tx('Chat'), tabBarIcon: ({ color, size }) => <TabIcon name="chat" color={String(color)} size={size} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: tx('Profile'), tabBarIcon: ({ color, size }) => <TabIcon name="person" color={String(color)} size={size} /> }}
      />
      <Tabs.Screen name="proposals" options={{ href: null }} />
    </Tabs>
  );
}
