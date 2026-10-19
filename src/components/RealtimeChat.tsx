import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View, type ListRenderItem } from 'react-native';

import { palette } from '@/flow2/constants/theme';
import type { FlowChatMessage } from '@/flow2/data/types';
import { useApp } from '@/flow2/state/app';

type Props = {
  conversationId: string;
  role: 'customer' | 'vendor';
  recipient: string;
};

function validTimestamp(timestamp: number) {
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : Date.now();
}

export function RealtimeChat({ conversationId, role, recipient }: Props) {
  const { chatMessages, addChatMessage } = useApp();
  const [draft, setDraft] = useState('');
  const messages = useMemo(
    () => [...(chatMessages[conversationId] ?? [])].sort((a, b) => validTimestamp(b.createdAt) - validTimestamp(a.createdAt)),
    [chatMessages, conversationId],
  );

  // Socket subscriptions are temporarily disabled while investigating APK crashes.

  const sendMessage = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    const id = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const createdAt = Date.now();
    addChatMessage(conversationId, { id, text, createdAt, sender: role });
    // Keep the design interactive with local-only messages until chat networking is restored.
    setDraft('');
  }, [addChatMessage, conversationId, draft, role]);

  const renderMessage: ListRenderItem<FlowChatMessage> = ({ item }) => {
    const mine = item.sender === role;
    const date = new Date(validTimestamp(item.createdAt));
    return (
      <View style={[styles.messageRow, mine ? styles.mineRow : styles.theirsRow]}>
        <View style={[styles.bubble, mine ? styles.mineBubble : styles.theirsBubble]}>
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={[styles.time, mine ? styles.mineTime : styles.theirsTime]}>
            {date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.frame}>
      <View style={styles.liveBar}>
        <View style={[styles.dot, styles.offline]} />
        <Text style={styles.liveText}>Preview · offline</Text>
        <Text numberOfLines={1} style={styles.recipient}>{recipient}</Text>
      </View>
      <FlatList
        style={styles.list}
        contentContainerStyle={messages.length === 0 ? styles.emptyList : styles.messageList}
        data={messages}
        inverted
        keyExtractor={(message) => message.id}
        renderItem={renderMessage}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Start the conversation</Text>
            <Text style={styles.emptyBody}>Keep event details and updates in one place.</Text>
          </View>
        )}
      />
      <View style={styles.toolbar}>
        <TextInput
          accessibilityLabel="Message"
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={sendMessage}
          placeholder="Message…"
          placeholderTextColor={palette.muted}
          selectionColor={palette.accent}
          multiline
          maxLength={4000}
          blurOnSubmit={false}
          style={styles.composer}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          disabled={!draft.trim()}
          onPress={sendMessage}
          style={[styles.sendButton, !draft.trim() && styles.sendDisabled]}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: palette.bg },
  liveBar: { minHeight: 34, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#FFFFFF' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  online: { backgroundColor: palette.accent },
  connecting: { backgroundColor: '#E8A93A' },
  offline: { backgroundColor: '#C35858' },
  liveText: { color: palette.muted, fontSize: 12, fontWeight: '700' },
  recipient: { flex: 1, textAlign: 'right', color: palette.muted, fontSize: 12 },
  list: { flex: 1 },
  messageList: { paddingHorizontal: 12, paddingVertical: 10 },
  emptyList: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 12 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { color: palette.ink, fontSize: 17, fontWeight: '800' },
  emptyBody: { color: palette.muted, textAlign: 'center', marginTop: 5 },
  messageRow: { width: '100%', marginVertical: 4 },
  mineRow: { alignItems: 'flex-end' },
  theirsRow: { alignItems: 'flex-start' },
  bubble: { maxWidth: '84%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  mineBubble: { backgroundColor: palette.accentSoft, borderBottomRightRadius: 5 },
  theirsBubble: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 5 },
  messageText: { color: palette.ink, fontSize: 15, lineHeight: 21 },
  time: { alignSelf: 'flex-end', marginTop: 3, fontSize: 10 },
  mineTime: { color: palette.accentDark },
  theirsTime: { color: palette.muted },
  toolbar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderTopColor: palette.line, borderTopWidth: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 8 },
  composer: { flex: 1, minHeight: 42, maxHeight: 110, borderRadius: 22, backgroundColor: palette.well, paddingHorizontal: 15, paddingTop: 10, paddingBottom: 8, fontSize: 16, color: palette.ink },
  sendButton: { minWidth: 58, height: 40, paddingHorizontal: 12, borderRadius: 20, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.55 },
  sendText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
