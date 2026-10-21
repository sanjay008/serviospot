import { useCallback, useEffect, useState } from 'react';
import { BackHandler, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from 'expo-router';

import { ConversationList } from '@/components/ConversationList';
import { RealtimeChat } from '@/components/RealtimeChat';
import { ChatTopBar } from '@/components/ChatTopBar';
import { Screen } from '@/flow2/components/Screen';
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

  const conversations = leads.map((lead) => {
    const conversationId = `${lead.request.id}:${lead.providerId}`;
    return {
      id: conversationId,
      name: 'Mansi',
      lastMessage: chatMessages[conversationId]?.at(-1),
      lastActivityAt: Date.parse(lead.request.submittedAt ?? ''),
      leadId: lead.id,
    };
  });
  return <ConversationList items={conversations} onOpen={(conversation) => setActiveLeadId(conversation.leadId)} />;
}

const styles = StyleSheet.create({ chatScreen: { paddingHorizontal: 0, paddingBottom: 0, gap: 0 } });
