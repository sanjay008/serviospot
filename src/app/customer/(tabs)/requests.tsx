import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useGetRequestsQuery, useGetProposalsQuery, API_ENABLED } from '@/api';
import { rowsOf } from '@/api/mappers';
import type { ApiRecord } from '@/api/types';
import { Button } from '@/flow2/components/Button';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { b } from '@/flow2/data/options';
import { useApp } from '@/flow2/state/app';
import { useType } from '@/hooks/use-type';

export default function RequestsScreen() {
  const { t, resetDraft } = useApp();
  const requestsQuery = useGetRequestsQuery(undefined, { skip: !API_ENABLED });
  const requests = rowsOf(requestsQuery.data).filter((row) => String(row.status ?? '').toLowerCase() !== 'draft');

  return (
    <Screen loading={requestsQuery.isLoading} refreshing={requestsQuery.isFetching && !requestsQuery.isLoading} onRefresh={() => { void requestsQuery.refetch(); }} header={<Header title={t(b('My requests', 'My requests'))} subtitle={t(b('Volg uitnodigingen, voorstellen en deadlines.', 'Track invitations, proposals and deadlines.'))} back />}>
      <Button label={t(b('New request', 'New request'))} onPress={() => { resetDraft(); router.push('/customer/request' as any); }} />
      {!API_ENABLED ? <EmptyState icon="doc" title={t(b('API niet beschikbaar', 'API unavailable'))} body={t(b('Configureer de API om aanvragen te laden.', 'Configure the API to load requests.'))} /> : requests.length === 0 ? (
        <EmptyState icon="doc" title={t(b('Nog geen aanvragen', 'No requests yet'))} body={t(b('Start een aanvraag en ontvang voorstellen.', 'Start a request and receive proposals.'))} />
      ) : requests.map((request, index) => <RequestItem key={String(request.request_id ?? request.id ?? index)} request={request} />)}
    </Screen>
  );
}

function RequestItem({ request }: { request: ApiRecord }) {
  const { t } = useApp();
  const type = useType();
  const requestId = String(request.request_id ?? request.id ?? '');
  const proposalsQuery = useGetProposalsQuery(requestId, { skip: !API_ENABLED || !requestId });
  const proposals = rowsOf(proposalsQuery.data);
  const title = value(request, 'event_type', 'event_name', 'title') || t(b('Aanvraag', 'Request'));
  return <View style={styles.group}>
    <Pressable accessibilityRole="button" onPress={() => router.push(`/customer/request/${requestId}` as any)} style={styles.card}>
      <View style={styles.titleRow}><Text style={[styles.title, { fontSize: type.cardTitle }]}>{title}</Text><Text style={styles.status}>{value(request, 'status') || ''}</Text></View>
      <Text style={[styles.meta, { fontSize: type.caption }]}>{[value(request, 'event_date', 'date'), value(request, 'city'), value(request, 'guest_count', 'guests') ? `${value(request, 'guest_count', 'guests')} guests` : ''].filter(Boolean).join(' · ')}</Text>
      <Text style={styles.link}>View request</Text>
    </Pressable>
    {proposalsQuery.isLoading ? <Text style={styles.meta}>Loading proposals…</Text> : proposals.map((proposal, index) => {
      const proposalId = String(proposal.proposal_id ?? proposal.id ?? '');
      return <Pressable key={proposalId || index} style={styles.proposal} onPress={() => router.push(`/customer/proposal/${proposalId}` as any)}>
        <Text style={styles.title}>{value(proposal, 'provider_name', 'business_name', 'name') || t(b('Proposal', 'Proposal'))}</Text>
        <Text style={styles.meta}>{[value(proposal, 'total_cents', 'price_cents', 'total'), value(proposal, 'status')].filter(Boolean).join(' · ')}</Text>
      </Pressable>;
    })}
  </View>;
}

function value(row: ApiRecord, ...keys: string[]) { for (const key of keys) { const item = row[key]; if (typeof item === 'string' || typeof item === 'number') return String(item); } return ''; }

const styles = StyleSheet.create({
  group: { gap: 9 }, card: { gap: 7, padding: 15, borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, title: { color: palette.ink, fontWeight: '800' }, status: { color: palette.accentDark, fontWeight: '700' }, meta: { color: palette.muted }, link: { color: palette.accentDark, fontWeight: '700' },
  proposal: { marginLeft: 13, padding: 13, borderRadius: 14, backgroundColor: palette.accentSoft, gap: 5 },
});
