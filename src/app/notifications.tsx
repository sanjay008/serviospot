import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { formatDate } from '@/data/format';
import { useApp } from '@/state/store';

export default function NotificationsScreen() {
  const { notifications, session, markRead, markAllRead } = useApp();
  const audience = session.mode === 'provider' ? 'provider' : 'customer';
  const rows = notifications.filter((item) => item.audience === audience);
  return (
    <Screen header={<Header title="Notifications" back />}>
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
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.time}>{formatDate(item.at)}</Text>
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
  title: { fontSize: 16, fontWeight: '700', color: palette.ink },
  body: { fontSize: 14, lineHeight: 20, color: palette.ink },
  time: { fontSize: 12, color: palette.muted },
});
