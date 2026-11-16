import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/flow2/components/Badge';
import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
import { SectionTitle } from '@/flow2/components/SectionTitle';
import { palette } from '@/flow2/constants/theme';
import { useType } from '@/hooks/use-type';
import { b } from '@/flow2/data/options';
import { API_ENABLED, type ApiRecord, useGetContactReleasesQuery, useGetContactReleaseMutation, useGetLeadsQuery } from '@/api';
import { useApp as useSession } from '@/state/store';
import { rowsOf, textOf } from '@/api/mappers';
import { useState } from 'react';
import { euro } from '@/data/format';
import { useApp as useFlow2 } from '@/flow2/state/app';

export default function VendorProposalsScreen() {
  const { t } = useFlow2();
  const { session } = useSession();
  const enabled = API_ENABLED && session.signedIn && session.mode === 'provider';
  const leadsQuery = useGetLeadsQuery('sent', { skip: !enabled });
  const releases = useGetContactReleasesQuery(undefined, { skip: !enabled });
  const [getContactRelease, contactResult] = useGetContactReleaseMutation();
  const [contact, setContact] = useState<ApiRecord | null>(null);
  const type = useType();
  const sent = rowsOf(leadsQuery.data);

  return (
    <Screen
      loading={enabled && (leadsQuery.isLoading || releases.isLoading)}
      refreshing={enabled && (leadsQuery.isFetching || releases.isFetching) && !(leadsQuery.isLoading || releases.isLoading)}
      onRefresh={enabled ? () => { void Promise.all([leadsQuery.refetch(), releases.refetch()]); } : undefined}
      header={<Header title={t(b('Proposals & responses', 'Proposals & responses'))} subtitle={t(b('Elke aanbieder ziet alleen eigen voorstellen.', 'Each provider sees only their own proposals.'))} back  />}>
      <Notice tone="accent" body={t(b('Analytics: profielweergaven → uitnodigingen → beschikbaarheid → voorstellen → contacten. Contacten zijn geen bewezen omzet.', 'Metrics: profile views → invitations → availability → proposals → contacts. Contacts are not verified revenue.'))} />

      <SectionTitle title={t(b('Verzonden voorstellen', 'Sent proposals'))} />
      {!enabled ? <EmptyState icon="send" title="Vendor API unavailable" body="Sign in as a vendor and enable the API to load proposals." /> : null}
      {leadsQuery.isLoading ? <Text>Loading proposals…</Text> : null}
      {leadsQuery.isError ? <Notice tone="error" body="Could not load proposals from the server." /> : null}
      {leadsQuery.isSuccess && sent.length === 0 ? <EmptyState icon="send" title={t(b('Nog geen voorstellen', 'No proposals yet'))} body={t(b('De server heeft geen voorstellen teruggegeven.', 'The server returned no proposals.'))} action={t(b('Naar inbox', 'Go to inbox'))} onAction={() => router.push('/vendor/leads' as any)} /> : null}
      {leadsQuery.isSuccess ? sent.map((lead) => <SentProposalCard key={String(lead.lead_id ?? lead.id ?? lead.request_id)} row={lead} />) : null}

      <SectionTitle title={t(b('Klantreacties', 'Customer responses'))} />
      {releases.isLoading ? <Text>Loading released contacts…</Text> : null}
      {releases.isError ? <Notice tone="error" body="Could not load released contacts from the server." /> : null}
      {rowsOf(releases.data).map((row, index) => {
        const releaseId = row.contact_release_id ?? row.id;
        const requestId = row.request_id;
        const key = String(releaseId ?? requestId ?? index);
        return (
          <Card key={key}>
            <Text style={[styles.ref, { fontSize: type.secondary }]}>{textOf(row, 'reference', 'request_reference') || `Request ${String(requestId ?? key)}`}</Text>
            <Text style={[styles.metaText, { fontSize: type.caption }]}>{t(b('Contact is available after customer consent.', 'Contact is available after customer consent.'))}</Text>
            <Button
              label={t(b('Bekijk vrijgegeven contact', 'View released contact'))}
              variant="secondary"
              loading={contactResult.isLoading}
              onPress={async () => {
                try {
                  const result = await getContactRelease(releaseId !== undefined
                    ? { contact_release_id: releaseId as string | number }
                    : { request_id: requestId as string | number }).unwrap();
                  setContact(result);
                } catch {
                  setContact(null);
                }
              }}
            />
          </Card>
        );
      })}
      {contact ? (
        <Card>
          <Text style={[styles.ref, { fontSize: type.secondary }]}>{textOf(contact, 'name', 'full_name', 'contact_name')}</Text>
          <Text style={[styles.metaText, { fontSize: type.caption }]}>{[textOf(contact, 'email'), textOf(contact, 'phone', 'phone_number')].filter(Boolean).join(' · ')}</Text>
        </Card>
      ) : null}
      {releases.isSuccess && rowsOf(releases.data).length === 0 ? <EmptyState icon="chat" title="No released contacts" body="The server returned no customer contact releases." /> : null}
    </Screen>
  );
}

function SentProposalCard({ row }: { row: ApiRecord }) {
  const type = useType();
  const id = String(row.lead_id ?? row.id ?? row.request_id ?? '');
  const proposal = row.proposal && typeof row.proposal === 'object' ? row.proposal as ApiRecord : row;
  const request = row.request && typeof row.request === 'object' ? row.request as ApiRecord : row;
  const title = textOf(row, 'reference', 'request_reference') || textOf(request, 'event_type', 'occasion') || `Request ${id}`;
  const total = proposal.total_cents == null ? null : Number(proposal.total_cents);
  const perPerson = proposal.per_person_cents == null ? null : Number(proposal.per_person_cents);
  return (
    <Card>
      <View style={styles.head}><View style={styles.headText}><Text style={[styles.ref, { fontSize: type.cardTitle }]}>{title}</Text><Text style={[styles.provider, { fontSize: type.caption }]}>{textOf(proposal, 'status') || 'sent'}</Text></View><Badge label="Sent" tone="good" /></View>
      <View style={styles.metaRow}><Icon name="receipt" color={palette.muted} size={14} /><Text style={[styles.metaText, { fontSize: type.caption }]}>{euro(total)} · {euro(perPerson)} per person</Text></View>
      <View style={styles.metaRow}><Icon name="lock" color={palette.muted} size={14} /><Text style={[styles.metaText, { fontSize: type.caption }]}>Customer contact stays hidden until consent.</Text></View>
      <Button label="View request" variant="secondary" onPress={() => router.push(`/vendor/lead/${id}` as any)} />
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  headText: { flex: 1, gap: 2 },
  ref: { fontWeight: '800', color: palette.ink },
  provider: { color: palette.muted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: palette.muted },
  paragraph: { color: palette.ink },
});
