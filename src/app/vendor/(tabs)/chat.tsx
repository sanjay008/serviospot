import { useCallback, useEffect, useState } from 'react';
import { BackHandler, StyleSheet, Text } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';

import { ConversationList } from '@/components/ConversationList';
import { RealtimeChat } from '@/components/RealtimeChat';
import { ChatTopBar } from '@/components/ChatTopBar';
import { Button } from '@/flow2/components/Button';
import { Header } from '@/flow2/components/Header';
import { Screen } from '@/flow2/components/Screen';
import { API_ENABLED, useGetConversationsQuery } from '@/api';
import { useApp as useSession } from '@/state/store';
import { rowsOf, textOf } from '@/api/mappers';

export default function VendorChatTab() {
  const navigation = useNavigation();
  const { session, restored } = useSession();
  const { conversation } = useLocalSearchParams<{ conversation?: string }>();
  const enabled = API_ENABLED && restored && session.signedIn && session.mode === 'provider';
  const query = useGetConversationsQuery(undefined, { skip: !enabled });
  const conversations = rowsOf(query.data).map((row) => {
    const id = textOf(row, 'conversation_id', 'id') || '';
    const preview = textOf(row, 'last_message');
    const updatedAt = Date.parse(textOf(row, 'updated_at', 'last_message_at') || '');
    return {
      id,
      name: textOf(row, 'customer_name', 'name', 'customer_reference') || 'Customer',
      city: textOf(row, 'city') || '',
      guests: textOf(row, 'guest_count', 'guests') || '',
      lastActivityAt: updatedAt,
      lastMessage: preview ? { id: `${id}-preview`, text: preview, createdAt: updatedAt || 0, sender: 'customer' as const } : undefined,
    };
  }).filter((item) => item.id);
  const [activeId, setActiveId] = useState<string | null>(null);
  useEffect(() => { if (conversation) setActiveId(String(conversation)); }, [conversation]);
  const active = conversations.find((item) => item.id === activeId);

  useEffect(() => {
    navigation.setOptions({ tabBarStyle: activeId ? { display: 'none' } : undefined });
  }, [activeId, navigation]);

  useFocusEffect(useCallback(() => {
    if (!activeId) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setActiveId(null);
      return true;
    });
    return () => subscription.remove();
  }, [activeId, setActiveId]));

  if (activeId) {
    return (
      <Screen
        scroll={false}
        style={styles.chatScreen}
        header={<ChatTopBar name={active?.name || 'Chat'} subtitle={active ? `${active.guests} guests · ${active.city}` : ''} onBack={() => setActiveId(null)} />}>
        <RealtimeChat conversationId={activeId} role="vendor" recipient={active?.name || 'this customer'} />
      </Screen>
    );
  }

  if (!enabled) return <Screen header={<Header title="Conversations" />}><Text style={styles.status}>Sign in as a vendor and enable the API to load conversations.</Text></Screen>;
  if (query.isError) return <Screen header={<Header title="Conversations" />} onRefresh={() => { void query.refetch(); }}><Text style={styles.status}>Could not load conversations from the server.</Text><Button label="Try again" variant="secondary" onPress={() => { void query.refetch(); }} /></Screen>;
  return <ConversationList
    items={conversations}
    loading={query.isLoading}
    refreshing={query.isFetching && !query.isLoading}
    onRefresh={() => { void query.refetch(); }}
    onOpen={(conversation) => setActiveId(conversation.id)}
  />;
}

const styles = StyleSheet.create({ chatScreen: { paddingHorizontal: 0, paddingBottom: 0, gap: 0 }, status: { paddingVertical: 24, color: '#777185', textAlign: 'center' } });
