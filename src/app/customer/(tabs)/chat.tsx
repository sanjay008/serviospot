import { useCallback, useEffect, useState } from 'react';
import { BackHandler, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { ConversationList } from '@/components/ConversationList';
import { RealtimeChat } from '@/components/RealtimeChat';
import { ChatTopBar } from '@/components/ChatTopBar';
import { Screen } from '@/flow2/components/Screen';
import { API_ENABLED, useGetConversationsQuery } from '@/api';
import { useApp as useSession } from '@/state/store';
import { rowsOf, textOf } from '@/api/mappers';

export default function CustomerChatTab() {
  const navigation = useNavigation();
  const { session, restored } = useSession();
  const enabled = API_ENABLED && restored && session.signedIn && session.mode === 'customer';
  const { conversation } = useLocalSearchParams<{ conversation?: string }>();
  const query = useGetConversationsQuery(undefined, { skip: !enabled });
  const conversations = rowsOf(query.data).map((row) => {
    const id = textOf(row, 'conversation_id', 'id') || '';
    const preview = textOf(row, 'last_message');
    const updatedAt = Date.parse(textOf(row, 'updated_at', 'last_message_at') || '');
    return {
      id,
      name: textOf(row, 'provider_name', 'business_name', 'name') || 'Provider',
      city: textOf(row, 'city') || '',
      guests: textOf(row, 'guest_count', 'guests') || '',
      lastActivityAt: updatedAt,
      lastMessage: preview ? { id: `${id}-preview`, text: preview, createdAt: updatedAt || 0, sender: 'vendor' as const } : undefined,
    };
  }).filter((item) => item.id);
  const [activeId, setActiveId] = useState<string | null>(null);
  useEffect(() => { if (conversation) setActiveId(String(conversation)); }, [conversation]);
  const active = conversations.find((item) => item.id === activeId);
  useEffect(() => { navigation.setOptions({ tabBarStyle: activeId ? { display: 'none' } : undefined }); }, [activeId, navigation]);
  useFocusEffect(useCallback(() => {
    if (!activeId) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { setActiveId(null); return true; });
    return () => subscription.remove();
  }, [activeId, setActiveId]));
  if (activeId) return <Screen scroll={false} style={styles.chatScreen} header={<ChatTopBar name={active?.name || 'Chat'} subtitle={active ? `${active.guests} guests · ${active.city}` : ''} onBack={() => setActiveId(null)} />}><RealtimeChat conversationId={activeId} role="customer" recipient={active?.name || 'this caterer'} /></Screen>;
  const emptyMessage = query.isError
    ? 'Could not load conversations from the server.'
    : enabled
      ? 'No conversations available yet.'
      : 'Sign in as a customer and enable the API to load conversations.';
  return <ConversationList
    items={conversations}
    loading={!restored || (enabled && query.isLoading)}
    refreshing={enabled && query.isFetching && !query.isLoading}
    onRefresh={enabled ? () => { void query.refetch(); } : undefined}
    emptyMessage={emptyMessage}
    onOpen={(conversation) => setActiveId(conversation.id)}
  />;
}
const styles = StyleSheet.create({ chatScreen: { paddingHorizontal: 0, paddingBottom: 0, gap: 0 } });
