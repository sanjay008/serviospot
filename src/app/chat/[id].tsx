import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bubble, Composer, Day, GiftedChat, InputToolbar, Send, type IMessage } from 'react-native-gifted-chat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState } from '@/components/ErrorState';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { CONTACT_BLOCKED } from '@/constants/copy';
import { palette } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useMessagesSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { maxWidth, gutter } = useResponsive();
  const { conversations, sendMessage } = useApp();
  const conversation = conversations.find((item) => item.id === id);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const me = conversation?.box === 'provider' ? 'provider' : 'customer';
  useMessagesSync(id, me);
  const messages = useMemo<IMessage[]>(() => {
    if (!conversation) return [];
    return [...conversation.messages].reverse().map((message) => ({
      _id: message.id,
      text: message.text,
      createdAt: new Date(message.at),
      user: { _id: message.from },
    }));
  }, [conversation]);

  if (!conversation) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Header title="Message" back />
        <ErrorState body="This conversation is not available." onRetry={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={[styles.frame, { maxWidth }]}>
        <View style={[styles.header, { paddingHorizontal: gutter }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}>
            <Icon name="back" color={palette.ink} size={18} />
          </Pressable>
          <View style={styles.titles}>
            <Text style={styles.title} numberOfLines={1}>{conversation.title}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{conversation.subtitle}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Report"
            onPress={() => router.push(`/report?target=message:${conversation.id}`)}
            style={styles.back}>
            <Icon name="flag" color={palette.muted} size={16} />
          </Pressable>
        </View>
        <GiftedChat
          messages={messages}
          text={text}
          onInputTextChanged={setText}
          onSend={(outgoing) => {
            const body = outgoing[0]?.text?.trim() ?? '';
            if (!body) return;
            void (async () => {
              const result = await sendMessage(conversation.id, body);
              if (!result.ok) {
                setError(result.reason);
                setText(body);
                return;
              }
              setText('');
              setError('');
            })();
          }}
          user={{ _id: me }}
          placeholder="Write a message"
          alwaysShowSend
          renderAvatar={null}
          keyboardShouldPersistTaps="handled"
          bottomOffset={insets.bottom}
          minComposerHeight={44}
          messagesContainerStyle={styles.list}
          textInputProps={{ placeholderTextColor: palette.muted }}
          timeTextStyle={{ right: { color: '#E4DEFF' }, left: { color: palette.muted } }}
          renderDay={(props) => (
            <Day
              {...props}
              dateFormat="D MMM"
              containerStyle={styles.day}
              wrapperStyle={styles.dayPill}
              textStyle={styles.dayText}
            />
          )}
          renderBubble={(props) => (
            <Bubble
              {...props}
              wrapperStyle={{ right: styles.mine, left: styles.theirs }}
              containerToNextStyle={{ right: styles.round, left: styles.round }}
              containerToPreviousStyle={{ right: styles.round, left: styles.round }}
              textStyle={{ right: styles.mineText, left: styles.theirsText }}
            />
          )}
          renderInputToolbar={(props) => (
            <InputToolbar {...props} containerStyle={styles.toolbar} primaryStyle={styles.toolbarRow} />
          )}
          renderComposer={(props) => <Composer {...props} textInputStyle={styles.input} />}
          renderSend={(props) => {
            const ready = !!props.text?.trim();
            return (
              <Send {...props} disabled={!ready} containerStyle={styles.sendHit}>
                <View style={[styles.send, !ready && styles.sendOff]}>
                  <Icon name="send" color="#fff" size={16} />
                </View>
              </Send>
            );
          }}
          renderChatFooter={() =>
            error ? (
              <Text style={styles.error}>{error === 'contact' ? CONTACT_BLOCKED : error}</Text>
            ) : null
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  frame: { flex: 1, width: '100%', alignSelf: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.bg,
  },
  titles: { flex: 1, minWidth: 0, gap: 1 },
  title: { fontSize: 17, fontWeight: '700', color: palette.ink },
  subtitle: { fontSize: 13, color: palette.muted },
  list: { backgroundColor: palette.bg },
  day: { marginTop: 8, marginBottom: 4 },
  dayPill: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: palette.line,
  },
  dayText: { color: palette.muted, fontSize: 12, fontWeight: '600' },
  round: { borderRadius: 18 },
  mine: { backgroundColor: palette.accent, borderRadius: 18 },
  theirs: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 18 },
  mineText: { color: '#fff', fontSize: 15, lineHeight: 21 },
  theirsText: { color: palette.ink, fontSize: 15, lineHeight: 21 },
  toolbar: {
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingTop: 8,
    paddingBottom: 8,
  },
  toolbarRow: { alignItems: 'flex-end' },
  input: {
    backgroundColor: palette.bg,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    marginHorizontal: 12,
    marginTop: 0,
    marginBottom: 0,
    fontSize: 16,
    lineHeight: 22,
    color: palette.ink,
  },
  sendHit: { width: 52, height: 44, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOff: { backgroundColor: '#C4B8F5' },
  error: {
    marginHorizontal: 12,
    marginBottom: 8,
    color: palette.danger,
    fontSize: 13,
    lineHeight: 18,
  },
});
