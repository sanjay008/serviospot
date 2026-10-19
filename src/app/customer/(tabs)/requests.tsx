import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/flow2/components/Badge';
import { Button } from '@/flow2/components/Button';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { dateLong } from '@/flow2/data/format';
import { b, totalDishes } from '@/flow2/data/options';
import type { RequestStatus } from '@/flow2/data/types';
import { useApp } from '@/flow2/state/app';

const STATUS_LABELS: Record<RequestStatus, { nl: string; en: string }> = {
  draft: b('Concept', 'Draft'),
  submitted: b('Verstuurd', 'Submitted'),
  collecting: b('Verzamelen', 'Collecting'),
  proposals: b('Voorstellen', 'Proposals'),
  contact: b('Contact', 'Contact'),
  closed: b('Gesloten', 'Closed'),
};

export default function RequestsScreen() {
  const { t, lang, requests, proposalsFor } = useApp();
  const customerRequests = requests.filter((request) => request.status !== 'draft');

  return (
    <Screen header={<Header title={t(b('My requests', 'My requests'))} subtitle={t(b('Volg uitnodigingen, voorstellen en deadlines.', 'Track invitations, proposals and deadlines.'))} back  />}>
      <Button label={t(b('New request', 'New request'))} onPress={() => router.push('/customer/request' as any)} />
      {customerRequests.length === 0 ? (
        <EmptyState icon="doc" title={t(b('Nog geen aanvragen', 'No requests yet'))} body={t(b('Start een aanvraag en ontvang voorstellen.', 'Start a request and receive proposals.'))} />
      ) : (
        customerRequests.map((request) => {
          const count = proposalsFor(request.id).length;
          return (
            <View key={request.id} style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.ref}>{request.reference}</Text>
                <Badge label={t(STATUS_LABELS[request.status])} tone={request.status === 'proposals' ? 'accent' : 'neutral'} />
              </View>
              <Text style={styles.title}>
                {request.guests} {t(b('gasten', 'guests'))} · {request.city}
              </Text>
              <View style={styles.metaRow}>
                <Icon name="calendar" color={palette.muted} size={14} />
                <Text style={styles.metaText}>{dateLong(request.date, lang)}</Text>
              </View>
              <View style={styles.metaRow}>
                <Icon name="food" color={palette.muted} size={14} />
                <Text style={styles.metaText}>
                  {totalDishes(request.counts)} {t(b('gerechten', 'dishes'))}
                </Text>
              </View>
              <View style={styles.footer}>
                <Text style={styles.proposals}>
                  {count} {t(b('voorstellen', 'proposals'))}
                </Text>
                <Button label={t(b('Bekijk', 'View'))} variant="secondary" onPress={() => router.push(`/customer/request/${request.id}` as any)} />
              </View>
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.line, padding: 14, gap: 8 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ref: { fontSize: 16, fontWeight: '800', color: palette.ink },
  title: { fontSize: 15, fontWeight: '600', color: palette.ink },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: palette.muted },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  proposals: { fontSize: 14, fontWeight: '700', color: palette.accent },
});
