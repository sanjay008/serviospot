import { Tabs, router } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/flow2/components/Icon';
import { palette } from '@/flow2/constants/theme';

function TabIcon({ name, color, size }: { name: IconName; color: string; size: number }) {
  return <Icon name={name} color={color} size={Math.max(16, size - 2)} />;
}

export default function CustomerTabsLayout() {
  const insets = useSafeAreaInsets();
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
          borderTopWidth: 1,
          height: 56 + bottom,
          paddingTop: 4,
          paddingBottom: bottom,
          elevation: 0,
          shadowOpacity: 0,
          shadowRadius: 0,
          shadowOffset: { width: 0, height: 0 },
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const },
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
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <TabIcon name="home" color={String(color)} size={size} /> }}
      />
      <Tabs.Screen
        name="requests"
        options={{ title: 'Requests', tabBarIcon: ({ color, size }) => <TabIcon name="inbox" color={String(color)} size={size} /> }}
      />
      <Tabs.Screen
        name="new-request"
        options={{
          title: 'New request',
          tabBarLabel: () => null,
          tabBarButton: (props: any) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start a new request"
              onPress={() => router.push('/customer/request' as any)}
              android_ripple={{ color: 'transparent' }}
              style={[props.style, styles.createTab]}>
              <View style={styles.createButton}><TabIcon name="plus" color="#FFFFFF" size={27} /></View>
              <Text style={styles.createLabel}>New</Text>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{ title: 'Chat', tabBarIcon: ({ color, size }) => <TabIcon name="chat" color={String(color)} size={size} /> }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: 'Me', tabBarIcon: ({ color, size }) => <TabIcon name="person" color={String(color)} size={size} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  createTab: { flex: 0, width: 68, alignItems: 'center', justifyContent: 'center', marginTop: -17 },
  createButton: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accent, shadowColor: palette.accentDark, shadowOpacity: 0.22, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  createLabel: { marginTop: 3, fontSize: 10, lineHeight: 12, fontWeight: '700', color: palette.accentDark },
});
