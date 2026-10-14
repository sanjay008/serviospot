import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Grid } from '@/components/Grid';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { PageTitle } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { formatDate, requestLabel } from '@/data/format';
import { useLoginGate } from '@/hooks/use-login-gate';
import { useResponsive } from '@/hooks/use-responsive';
import { useRequestsSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

export default function RequestsScreen() {
  const { requests, proposals, session, quoteDraft } = useApp();
  const { requireLogin, gate } = useLoginGate();
  useRequestsSync();
  const { isTablet } = useResponsive();
  const hasDraft = quoteDraft.eventType || quoteDraft.rawText || quoteDraft.needs.length > 0;
  return (
    <Screen tab refresh>
      <PageTitle title="Requests" subtitle="Quotes you asked for. Prices are estimates." />
      {!session.signedIn ? <Button label="Log in to send a request" variant="secondary" onPress={() => router.push('/login')} /> : null}
      {hasDraft ? <Button label="Continue draft request" variant="secondary" onPress={() => requireLogin('/quote')} /> : null}
      {requests.length === 0 ? <EmptyState icon="doc" title="No requests yet" body="Start a quote request when you know the date, city and guest count." action="Request proposals" onAction={() => requireLogin('/quote')} /> : null}
      {requests.length > 0 ? (
        <Grid minItem={300} maxColumns={isTablet ? 2 : 1} gap={12}>
          {requests.map((request) => {
        const count = proposals.filter((item) => item.requestId === request.id && item.status === 'submitted').length;
        return (
          <Pressable key={request.id} accessibilityRole="button" onPress={() => router.push(`/request/${request.id}`)} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{request.eventType}</Text>
              <Badge label={requestLabel[request.status]} tone={request.status === 'cancelled' ? 'bad' : 'good'} />
            </View>
            <Text style={styles.meta}>
              {request.city} · {formatDate(request.date)} · {request.guests} guests
            </Text>
            <Text style={styles.meta}>{count} indicative proposal{count === 1 ? '' : 's'}</Text>
          </Pressable>
        );
          })}
        </Grid>
      ) : null}
      {gate}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.line, padding: 14, gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center' },
  name: { fontSize: 17, fontWeight: '700', color: palette.ink, flex: 1, minWidth: 0 },
  meta: { color: palette.muted, fontSize: 14 },
});
