import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { PageTitle } from '@/components/Header';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { formatDate } from '@/data/format';
import { useConversationsSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

export function ConversationList({ box, title = 'Chat', subtitle = 'Questions stay here until a phone number is shared.' }: { box: 'customer' | 'provider'; title?: string; subtitle?: string }) {
  const { conversations } = useApp();
  useConversationsSync(box);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);
  const rows = conversations.filter((item) => item.box === box);
  return (
    <Screen tab refresh>
      <PageTitle title={title} subtitle={subtitle} />
      {loading ? <LoadingState label="Loading messages" /> : null}
      {!loading && rows.length === 0 ? <EmptyState icon="chat" title="No messages yet" body="When a provider or customer asks a question, it will show up here." /> : null}
      {!loading
        ? rows.map((conversation) => {
            const last = conversation.messages[conversation.messages.length - 1];
            return (
              <Pressable key={conversation.id} accessibilityRole="button" onPress={() => router.push(`/chat/${conversation.id}`)} style={styles.row}>
                <View style={styles.text}>
                  <Text style={styles.name}>{conversation.title}</Text>
                  <Text style={styles.subline} numberOfLines={1}>
                    {last?.text ?? conversation.subtitle}
                  </Text>
                </View>
                <Text style={styles.time}>{last ? formatDate(last.at) : ''}</Text>
              </Pressable>
            );
          })
        : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.line, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' },
  text: { flex: 1, gap: 4, minWidth: 0 },
  name: { fontSize: 16, fontWeight: '700', color: palette.ink },
  subline: { fontSize: 14, color: palette.muted },
  time: { fontSize: 12, color: palette.muted },
});
