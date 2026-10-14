import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { useContactsSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

export default function ContactScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { requests, providers } = useApp();
  useContactsSync(requestId);
  const request = requests.find((item) => item.id === requestId);
  const released = providers.filter((provider) => request?.contactProviderIds.includes(provider.id));
  return (
    <Screen header={<Header title="Contact released" back />}>
      <Notice tone="success" title="Match made" body="Phone and email are visible for the providers you continued with. Final price, payment and the event itself are agreed directly." />
      {released.length === 0 ? <Text style={styles.muted}>No contacts have been released for this request.</Text> : null}
      {released.map((provider) => (
        <Card key={provider.id}>
          <Text style={styles.name}>{provider.name}</Text>
          <Text selectable style={styles.line}>{provider.contactPerson}</Text>
          <Text selectable style={styles.line}>{provider.phone}</Text>
          <Text selectable style={styles.line}>{provider.email}</Text>
          <Text style={styles.muted}>{provider.city}</Text>
        </Card>
      ))}
      {request?.status === 'event_pending' || request?.status === 'contact_released' ? (
        <Text style={styles.muted} onPress={() => request && router.push(`/outcome/${request.id}`)}>
          After the event date, tell us whether you used one of these providers.
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 18, fontWeight: '700', color: palette.ink },
  line: { fontSize: 16, color: palette.ink },
  muted: { fontSize: 14, lineHeight: 20, color: palette.muted },
});
