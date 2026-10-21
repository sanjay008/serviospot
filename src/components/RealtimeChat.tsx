import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View, Alert, type ListRenderItem } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { Icon } from '@/flow2/components/Icon';
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

  const sendPhoto = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo access needed', 'Allow photo access to share an image in this chat.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]) return;
      addChatMessage(conversationId, {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text: '',
        imageUri: result.assets[0].uri,
        createdAt: Date.now(),
        sender: role,
      });
    } catch {
      Alert.alert('Could not open photos', 'Please try again.');
    }
  }, [addChatMessage, conversationId, role]);

  const renderMessage: ListRenderItem<FlowChatMessage> = ({ item }) => {
    const mine = item.sender === role;
    const date = new Date(validTimestamp(item.createdAt));
    return (
      <View style={[styles.messageRow, mine ? styles.mineRow : styles.theirsRow]}>
        <View style={[styles.bubble, mine ? styles.mineBubble : styles.theirsBubble]}>
          {item.imageUri ? <Image source={{ uri: item.imageUri }} contentFit="cover" style={styles.messageImage} /> : null}
          {item.text ? <Text style={styles.messageText}>{item.text}</Text> : null}
          <Text style={[styles.time, mine ? styles.mineTime : styles.theirsTime]}>
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
            <Text style={styles.emptyTitle}>Start the conversation</Text>
            <Text style={styles.emptyBody}>Keep event details and updates with {recipient} in one place.</Text>
          </View>
        )}
      />
      <View style={styles.toolbar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Add a photo" onPress={() => void sendPhoto()} style={styles.photoButton}>
          <Icon name="photo" color={palette.accent} size={21} />
        </Pressable>
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
  emptyTitle: { color: palette.ink, fontSize: 17, fontWeight: '800' },
  emptyBody: { color: palette.muted, textAlign: 'center', marginTop: 5 },
  messageRow: { width: '100%', marginVertical: 4 },
  mineRow: { alignItems: 'flex-end' },
  theirsRow: { alignItems: 'flex-start' },
  bubble: { maxWidth: '84%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  mineBubble: { backgroundColor: palette.accentSoft, borderBottomRightRadius: 5 },
  theirsBubble: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 5 },
  messageImage: { width: 220, height: 160, borderRadius: 10, marginBottom: 4 },
  messageText: { color: palette.ink, fontSize: 15, lineHeight: 21 },
  time: { alignSelf: 'flex-end', marginTop: 3, fontSize: 10 },
  mineTime: { color: palette.accentDark },
  theirsTime: { color: palette.muted },
  toolbar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderTopColor: palette.line, borderTopWidth: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 8 },
  photoButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accentSoft },
  composer: { flex: 1, minHeight: 42, maxHeight: 110, borderRadius: 22, backgroundColor: palette.well, paddingHorizontal: 15, paddingTop: 10, paddingBottom: 8, fontSize: 15, color: palette.ink },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.55 },
});
