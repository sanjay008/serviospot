import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/flow2/components/Badge';
import { Button } from '@/flow2/components/Button';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { LangToggle } from '@/flow2/components/LangToggle';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { dateLong } from '@/flow2/data/format';
import { b, totalDishes } from '@/flow2/data/options';
import type { LeadStatus } from '@/flow2/data/types';
import { useApp } from '@/flow2/state/app';

const LEAD_LABELS: Record<LeadStatus, { nl: string; en: string }> = {
  invited: b('Uitgenodigd', 'Invited'),
  opened: b('Geopend', 'Opened'),
  availability: b('Beschikbaarheid', 'Availability'),
  proposal: b('Voorstel', 'Proposal'),
  declined: b('Afgewezen', 'Declined'),
};

export default function VendorLeadsScreen() {
  const { t, lang, leads, providers } = useApp();

  return (
    <Screen header={<Header title={t(b('Aanvragen inbox', 'Request inbox'))} subtitle={t(b('Geanonimiseerd tot een match', 'Anonymised until a match'))} back right={<LangToggle />} />}>
      <Notice tone="info" body={t(b('Geen privécontacten vóór een match. Reageer binnen 24 uur per uitnodiging.', 'No private contacts before a match. Respond within 24 hours per invitation.'))} />

      {leads.length === 0 ? (
        <EmptyState icon="inbox" title={t(b('Geen aanvragen', 'No requests'))} body={t(b('Nieuwe passende aanvragen verschijnen hier.', 'New matching requests appear here.'))} />
      ) : (
        leads.map((lead) => {
          const provider = providers.find((item) => item.id === lead.providerId);
          return (
            <View key={lead.id} style={styles.card}>
              <View style={styles.head}>
                <View style={styles.headText}>
                  <Text style={styles.ref}>{lead.reference}</Text>
                  <Text style={styles.provider}>{provider?.name ?? lead.providerId}</Text>
                </View>
                <Badge label={t(LEAD_LABELS[lead.status])} tone={lead.status === 'proposal' ? 'good' : lead.status === 'declined' ? 'bad' : 'accent'} />
              </View>
              <View style={styles.metaRow}>
                <Icon name="people" color={palette.muted} size={14} />
                <Text style={styles.metaText}>
                  {lead.request.guests} {t(b('gasten', 'guests'))} · {lead.request.city}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Icon name="calendar" color={palette.muted} size={14} />
                <Text style={styles.metaText}>{dateLong(lead.request.date, lang)}</Text>
              </View>
              <View style={styles.metaRow}>
                <Icon name="food" color={palette.muted} size={14} />
                <Text style={styles.metaText}>
                  {totalDishes(lead.request.counts)} {t(b('gerechten', 'dishes'))}
                </Text>
              </View>
              <View style={styles.footer}>
                <Text style={styles.deadline}>
                  {t(b('Deadline over', 'Deadline in'))} {lead.deadlineHours} u
                </Text>
                <Button label={t(b('Beoordeel aanvraag', 'Review request'))} variant="secondary" onPress={() => router.push(`/flow2/vendor/lead/${lead.id}`)} />
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
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  headText: { flex: 1, gap: 2 },
  ref: { fontSize: 16, fontWeight: '800', color: palette.ink },
  provider: { fontSize: 13, color: palette.muted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: palette.muted },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  deadline: { fontSize: 13, fontWeight: '600', color: palette.warning },
});
