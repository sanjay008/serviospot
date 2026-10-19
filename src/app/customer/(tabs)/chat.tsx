import { useCallback, useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from 'expo-router';

import { RealtimeChat } from '@/components/RealtimeChat';
import { ChatTopBar } from '@/components/ChatTopBar';
import { Card } from '@/flow2/components/Card';
import { Header } from '@/flow2/components/Header';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { useApp } from '@/flow2/state/app';

type ActiveChat = { requestId: string; providerId: string };

export default function CustomerChatTab() {
  const navigation = useNavigation();
  const { providers, requests, chatMessages } = useApp();
  const [active, setActive] = useState<ActiveChat | null>(null);
  const request = requests.find((item) => item.id === active?.requestId);
  const provider = providers.find((item) => item.id === active?.providerId);

  useEffect(() => {
    navigation.setOptions({ tabBarStyle: active ? { display: 'none' } : undefined });
  }, [active, navigation]);

  useFocusEffect(useCallback(() => {
    if (!active) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setActive(null);
      return true;
    });
    return () => subscription.remove();
  }, [active]));

  if (active && request && provider) {
    const conversationId = `${request.id}:${provider.id}`;
    return (
      <Screen
        scroll={false}
        style={styles.chatScreen}
        header={<ChatTopBar name={provider.name} subtitle={`${request.guests} guests · ${request.city}`} onBack={() => setActive(null)} />}>
        <RealtimeChat conversationId={conversationId} role="customer" recipient={provider.name} />
      </Screen>
    );
  }

  const chats = requests.filter((item) => item.status !== 'draft').flatMap((item) => providers.slice(0, 4).map((vendor) => ({ request: item, provider: vendor })));
  return (
    <Screen header={<Header title="Chats" />}>
      {chats.map(({ request: item, provider: vendor }) => {
        const conversationId = `${item.id}:${vendor.id}`;
        const lastMessage = chatMessages[conversationId]?.at(-1);
        return (
          <Pressable key={conversationId} accessibilityRole="button" onPress={() => setActive({ requestId: item.id, providerId: vendor.id })}>
            <Card style={styles.row}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{vendor.name.charAt(0).toUpperCase()}</Text></View>
              <View style={styles.details}>
                <View style={styles.nameRow}><Text style={styles.name}>{vendor.name}</Text></View>
                <Text style={styles.preview} numberOfLines={1}>{lastMessage?.text ?? `${item.guests} guests · ${item.city}`}</Text>
                <Text style={styles.meta}>{vendor.city}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chatScreen: { paddingHorizontal: 0, paddingBottom: 0, gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: palette.accentDark, fontSize: 18, fontWeight: '800' },
  details: { flex: 1, gap: 3 },
  name: { color: palette.ink, fontSize: 15, fontWeight: '800' },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  preview: { color: palette.muted, fontSize: 13 },
  meta: { color: palette.muted, fontSize: 11 },
  chevron: { color: palette.muted, fontSize: 25, paddingHorizontal: 4 },
});
