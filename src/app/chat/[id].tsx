import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { MessageBubble } from '@/components/MessageBubble';
import { Notice } from '@/components/Notice';
import { CONTACT_BLOCKED } from '@/constants/copy';
import { palette } from '@/constants/theme';
import { useApp } from '@/state/store';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { conversations, sendMessage } = useApp();
  const conversation = conversations.find((item) => item.id === id);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  if (!conversation) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Header title="Message" back />
        <ErrorState body="This conversation is not available." onRetry={() => router.back()} />
      </View>
    );
  }
  return (
    <KeyboardAvoidingView style={[styles.screen, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title={conversation.title} subtitle={conversation.subtitle} back right={<Button label="Report" variant="ghost" onPress={() => router.push(`/report?target=message:${conversation.id}`)} />} />
      <ScrollView contentContainerStyle={styles.messages}>
        {conversation.messages.map((message) => (
          <MessageBubble key={message.id} message={message} mine={conversation.box === 'customer' ? message.from === 'customer' : message.from === 'provider'} />
        ))}
      </ScrollView>
      {error ? <View style={styles.pad}><Notice tone="error" body={error === 'contact' ? CONTACT_BLOCKED : error} /></View> : null}
      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Input value={text} onChangeText={setText} placeholder="Write a clarifying question" />
        <Button
          label="Send"
          onPress={() => {
            const result = sendMessage(conversation.id, text);
            if (!result.ok) {
              setError(result.reason);
              return;
            }
            setText('');
            setError('');
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  messages: { padding: 16, gap: 10 },
  composer: { padding: 16, gap: 8, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.line },
  pad: { paddingHorizontal: 16 },
});
