import { useCallback, useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from 'expo-router';

import { Card } from '@/flow2/components/Card';
import { Header } from '@/flow2/components/Header';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { RealtimeChat } from '@/components/RealtimeChat';
import { ChatTopBar } from '@/components/ChatTopBar';
import { useApp } from '@/flow2/state/app';

export default function VendorChatTab() {
  const navigation = useNavigation();
  const { leads, chatMessages } = useApp();
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const activeLead = leads.find((lead) => lead.id === activeLeadId);

  useEffect(() => {
    navigation.setOptions({ tabBarStyle: activeLeadId ? { display: 'none' } : undefined });
  }, [activeLeadId, navigation]);

  useFocusEffect(useCallback(() => {
    if (!activeLeadId) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setActiveLeadId(null);
      return true;
    });
    return () => subscription.remove();
  }, [activeLeadId]));

  if (activeLead) {
    const conversationId = `${activeLead.request.id}:${activeLead.providerId}`;
    return (
      <Screen
        scroll={false}
        style={styles.chatScreen}
        header={<ChatTopBar name="Mansi" subtitle={`${activeLead.request.guests} guests · ${activeLead.request.city}`} onBack={() => setActiveLeadId(null)} />}>
        <RealtimeChat conversationId={conversationId} role="vendor" recipient="Mansi" />
      </Screen>
    );
  }

  return (
    <Screen header={<Header title="Chats" />}>
      <Notice tone="info" body="Your conversations with customers are listed here." />
      {leads.map((lead) => {
        const conversationId = `${lead.request.id}:${lead.providerId}`;
        const lastMessage = chatMessages[conversationId]?.at(-1);
        return (
          <Pressable key={lead.id} accessibilityRole="button" onPress={() => setActiveLeadId(lead.id)}>
            <Card style={styles.row}>
              <View style={styles.avatar}><Text style={styles.avatarText}>M</Text></View>
              <View style={styles.details}>
                <View style={styles.nameRow}><Text style={styles.name}>Mansi</Text></View>
                <Text style={styles.preview} numberOfLines={1}>{lastMessage?.text ?? `${lead.request.guests} guests · ${lead.request.city}`}</Text>
                <Text style={styles.meta}>{lead.request.date}</Text>
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
