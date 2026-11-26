import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, FlatList, Pressable, StyleSheet, Text, TextInput, View, type ListRenderItem } from 'react-native';

import { Icon } from '@/flow2/components/Icon';
import { palette } from '@/flow2/constants/theme';
import type { FlowChatMessage } from '@/flow2/data/types';

import { API_ENABLED, useGetMeQuery, useGetMessagesQuery, useSendMessageMutation } from '@/api';
import { rowsOf, textOf } from '@/api/mappers';
import { useApp as useSession } from '@/state/store';
import { leading, useType } from '@/hooks/use-type';

type Props = {
  conversationId: string;
  role: 'customer' | 'vendor';
  recipient: string;
};

function validTimestamp(timestamp: number) {
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : Date.now();
}

function profileIdOf(data: unknown) {
  if (!data || typeof data !== 'object') return '';
  const record = data as Record<string, unknown>;
  if (typeof record.id === 'number' || (typeof record.id === 'string' && record.id.trim())) return String(record.id);
  for (const key of ['user', 'profile', 'me']) {
    const nested = record[key];
    if (!nested || typeof nested !== 'object' || Array.isArray(nested)) continue;
    const id = (nested as Record<string, unknown>).id;
    if (typeof id === 'number' || (typeof id === 'string' && id.trim())) return String(id);
  }
  return '';
}

function contactReleasedOf(data: unknown) {
  if (!data || typeof data !== 'object') return false;
  const value = (data as Record<string, unknown>).contact_released;
  return value === true || value === 1 || value === '1' || value === 'true';
}

export function RealtimeChat({ conversationId, role, recipient }: Props) {
  const { session, restored } = useSession();
  const enabled = API_ENABLED && restored && session.signedIn;
  const meQuery = useGetMeQuery(undefined, { skip: !enabled });
  const messagesQuery = useGetMessagesQuery(conversationId, { skip: !enabled || !conversationId, pollingInterval: 5000 });
  const [sendApiMessage, sendState] = useSendMessageMutation();
  const type = useType();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const myId = profileIdOf(meQuery.data);
  const contactReleased = contactReleasedOf(messagesQuery.data);
  const messages = useMemo(() => {
    if (!enabled) return [];
    return rowsOf(messagesQuery.data).map((row, index) => {
      const senderId = textOf(row, 'sender_profile_id');
      const mine = myId && senderId ? senderId === myId : textOf(row, 'sender_role', 'role') === role;
      return {
        id: textOf(row, 'message_id', 'id') || String(index),
        text: textOf(row, 'body', 'message', 'text') || '',
        createdAt: Date.parse(textOf(row, 'created_at', 'sent_at') || '') || 0,
        sender: (mine ? role : role === 'customer' ? 'vendor' : 'customer') as FlowChatMessage['sender'],
      };
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [enabled, messagesQuery.data, myId, role]);

  const refetchMessages = messagesQuery.refetch;
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && enabled && conversationId) void refetchMessages();
    });
    return () => subscription.remove();
  }, [conversationId, enabled, refetchMessages]);

  const sendMessage = useCallback(() => {
    const text = draft.trim();
    if (!text || !enabled) return;
    setError('');
    void sendApiMessage({ conversation_id: conversationId, body: text, message: text }).unwrap().then(() => {
      setDraft('');
      void refetchMessages();
    }).catch((failure: unknown) => {
      const message = failure && typeof failure === 'object' && 'message' in failure && typeof failure.message === 'string'
        ? failure.message
        : 'Could not send the message.';
      setError(message);
    });
  }, [conversationId, draft, enabled, refetchMessages, sendApiMessage]);



  const renderMessage: ListRenderItem<FlowChatMessage> = ({ item }) => {
    const mine = item.sender === role;
    const date = new Date(validTimestamp(item.createdAt));
    return (
      <View style={[styles.messageRow, mine ? styles.mineRow : styles.theirsRow]}>
        <View style={[styles.bubble, mine ? styles.mineBubble : styles.theirsBubble]}>
          {item.text ? <Text style={[styles.messageText, { fontSize: type.body, lineHeight: leading(type.body, 6) }]}>{item.text}</Text> : null}
          <Text style={[styles.time, { fontSize: type.micro }, mine ? styles.mineTime : styles.theirsTime]}>
            {date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.frame}>
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
            <Text style={[styles.emptyTitle, { fontSize: type.sectionTitle }]}>Start the conversation</Text>
            <Text style={[styles.emptyBody, { fontSize: type.secondary, lineHeight: leading(type.secondary, 6) }]}>Keep event details and updates with {recipient} in one place.</Text>
          </View>
        )}
      />
      {messagesQuery.data && !contactReleased ? (
        <Text style={[styles.blocked, { fontSize: type.micro, lineHeight: leading(type.micro, 4) }]}>
          {role === 'customer'
            ? 'Phone numbers, email addresses and links stay blocked until you continue with this caterer.'
            : 'Phone numbers, email addresses and links stay blocked until the customer continues with you.'}
        </Text>
      ) : null}
      {error ? <Text style={[styles.error, { fontSize: type.micro }]}>{error}</Text> : null}
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
          style={[styles.composer, { fontSize: type.body }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          disabled={!draft.trim() || !enabled || sendState.isLoading}
          onPress={sendMessage}
          style={[styles.sendButton, (!draft.trim() || !enabled) && styles.sendDisabled]}>
          <Icon name="send" color="#FFFFFF" size={18} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: palette.bg },
  list: { flex: 1 },
  messageList: { paddingHorizontal: 12, paddingVertical: 10 },
  emptyList: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 12 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { color: palette.ink, fontWeight: '800' },
  emptyBody: { color: palette.muted, textAlign: 'center', marginTop: 5 },
  messageRow: { width: '100%', marginVertical: 4 },
  mineRow: { alignItems: 'flex-end' },
  theirsRow: { alignItems: 'flex-start' },
  bubble: { maxWidth: '84%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  mineBubble: { backgroundColor: palette.accentSoft, borderBottomRightRadius: 5 },
  theirsBubble: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 5 },
  messageText: { color: palette.ink },
  time: { alignSelf: 'flex-end', marginTop: 3 },
  mineTime: { color: palette.accentDark },
  theirsTime: { color: palette.muted },
  blocked: { color: palette.muted, backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingTop: 8 },
  error: { color: palette.danger, backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingTop: 6 },
  toolbar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderTopColor: palette.line, borderTopWidth: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 8 },
  photoButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accentSoft },
  composer: { flex: 1, minHeight: 42, maxHeight: 110, borderRadius: 22, backgroundColor: palette.well, paddingHorizontal: 15, paddingTop: 10, paddingBottom: 8, color: palette.ink },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.55 },
});
