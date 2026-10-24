import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { formatDate } from '@/data/format';
import { leading, useType } from '@/hooks/use-type';
import { useNotificationsSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

export default function NotificationsScreen() {
  const { notifications, session, markRead, markAllRead } = useApp();
  const type = useType();
  const audience = session.mode === 'provider' ? 'provider' : 'customer';
  useNotificationsSync(audience);
  const rows = notifications.filter((item) => item.audience === audience);
  return (
    <Screen refresh header={<Header title="Notifications" back />}>
      {rows.length ? <Button label="Mark all read" variant="ghost" onPress={() => markAllRead(audience)} /> : null}
      {rows.length === 0 ? <EmptyState icon="bell" title="No notifications" body="Proposals, messages and outcome reminders will land here." /> : null}
      {rows.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          onPress={() => {
            markRead(item.id);
            router.push(item.href as never);
          }}
          style={[styles.row, !item.read && styles.unread]}>
          <View style={styles.text}>
            <Text style={[styles.title, { fontSize: type.cardTitle }]}>{item.title}</Text>
            <Text style={[styles.body, { fontSize: type.secondary, lineHeight: leading(type.secondary, 6) }]}>{item.body}</Text>
            <Text style={[styles.time, { fontSize: type.small }]}>{formatDate(item.at)}</Text>
          </View>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.line, padding: 14 },
  unread: { borderColor: palette.accent },
  text: { gap: 4 },
  title: { fontWeight: '700', color: palette.ink },
  body: { color: palette.ink },
  time: { color: palette.muted },
});
