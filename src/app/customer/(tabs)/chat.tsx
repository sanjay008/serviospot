import { useCallback, useEffect, useState } from 'react';
import { BackHandler, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from 'expo-router';

import { ConversationList } from '@/components/ConversationList';
import { RealtimeChat } from '@/components/RealtimeChat';
import { ChatTopBar } from '@/components/ChatTopBar';
import { Screen } from '@/flow2/components/Screen';
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
  const conversations = chats.map(({ request: chatRequest, provider: chatProvider }) => {
    const conversationId = `${chatRequest.id}:${chatProvider.id}`;
    return {
      id: conversationId,
      name: chatProvider.name,
      avatarUri: chatProvider.photo,
      lastMessage: chatMessages[conversationId]?.at(-1),
      lastActivityAt: Date.parse(chatRequest.submittedAt ?? ''),
      requestId: chatRequest.id,
      providerId: chatProvider.id,
    };
  });
  return <ConversationList items={conversations} onOpen={(conversation) => setActive({ requestId: conversation.requestId, providerId: conversation.providerId })} />;
}

const styles = StyleSheet.create({ chatScreen: { paddingHorizontal: 0, paddingBottom: 0, gap: 0 } });
