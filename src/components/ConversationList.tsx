import { useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import type { FlowChatMessage } from '@/flow2/data/types';

export type ConversationItem = {
  id: string;
  name: string;
  avatarUri?: string;
  lastMessage?: FlowChatMessage;
  lastActivityAt?: number;
};

const AVATAR_COLORS = ['#FCE6DA', '#E5E9FC', '#E1F2E9', '#F9E6EF', '#E5F1F6'];

function formatMessageTime(timestamp: number) {
  if (!Number.isFinite(timestamp)) return '';
  return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function getConversationTime(item: ConversationItem) {
  const timestamp = item.lastMessage?.createdAt ?? item.lastActivityAt;
  return typeof timestamp === 'number' ? formatMessageTime(timestamp) : '';
}

export function ConversationList<T extends ConversationItem>({ items, onOpen }: { items: T[]; onOpen: (item: T) => void }) {
  const [search, setSearch] = useState('');
  const visibleItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return items;
    return items.filter(({ name, lastMessage }) => `${name} ${lastMessage?.text ?? ''}`.toLocaleLowerCase().includes(query));
  }, [items, search]);

  return (
    <Screen header={<Header title="Conversations" />}>
      <View style={styles.searchBox}>
        <Icon name="search" color={palette.muted} size={17} />
        <TextInput
          accessibilityLabel="Search conversations"
          placeholder="Search..."
          placeholderTextColor={palette.muted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={styles.searchInput}
        />
        {search.length > 0 ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearch('')} hitSlop={8} style={styles.clearButton}>
            <Icon name="close" color={palette.muted} size={16} />
          </Pressable>
        ) : null}
      </View>
      {visibleItems.length === 0 ? (
        <Text style={styles.emptyText}>{search ? 'No conversations match your search.' : 'Your conversations will appear here.'}</Text>
      ) : visibleItems.map((item, index) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          accessibilityLabel={`Open conversation with ${item.name}`}
          onPress={() => onOpen(item)}
          style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }]}>
            {item.avatarUri ? <Image source={{ uri: item.avatarUri }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>}
          </View>
          <View style={styles.details}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              {getConversationTime(item) ? <Text style={styles.time}>{getConversationTime(item)}</Text> : null}
            </View>
            <Text style={styles.preview} numberOfLines={1}>{item.lastMessage?.imageUri ? 'Photo' : item.lastMessage?.text || 'No messages yet'}</Text>
          </View>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBox: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 14, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 8, color: palette.ink, fontSize: 14 },
  clearButton: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 2, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line },
  avatar: { width: 46, height: 46, overflow: 'hidden', borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: palette.ink, fontSize: 18, fontWeight: '700' },
  details: { flex: 1, minWidth: 0, gap: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, color: palette.ink, fontSize: 13, lineHeight: 17, fontWeight: '700' },
  time: { color: palette.muted, fontSize: 10, lineHeight: 15 },
  preview: { color: palette.muted, fontSize: 11, lineHeight: 15 },
  emptyText: { paddingVertical: 24, color: palette.muted, textAlign: 'center', fontSize: 14 },
});
