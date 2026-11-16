import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/flow2/components/Badge';
import { Button } from '@/flow2/components/Button';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { leading, useType } from '@/hooks/use-type';
import { money } from '@/flow2/data/format';
import { b } from '@/flow2/data/options';
import { API_ENABLED, type ApiRecord, useGetLeadsQuery } from '@/api';
import { useApp as useSession } from '@/state/store';
import { rowsOf, textOf } from '@/api/mappers';
import { useApp } from '@/flow2/state/app';

export default function VendorLeadsScreen() {
  const { t } = useApp();
  const { session, restored } = useSession();
  const enabled = API_ENABLED && restored && session.signedIn && session.mode === 'provider';
  const query = useGetLeadsQuery(undefined, { skip: !enabled });
  const leads = rowsOf(query.data);
  const type = useType();
  const { view: routeView } = useLocalSearchParams<{ view?: string | string[] }>();
  const requestedView = Array.isArray(routeView) ? routeView[0] : routeView;
  const view = requestedView === 'proposals' ? 'proposals' : 'requests';
  const sent = leads.filter((lead) => !!(lead.proposal || lead.proposal_id || ['sent', 'proposal', 'submitted'].includes(String(lead.status ?? '').toLowerCase())));
  const shown = view === 'proposals' ? sent : leads.filter((lead) => !sent.includes(lead));

  return (
    <Screen
      loading={enabled && query.isLoading}
      refreshing={enabled && query.isFetching && !query.isLoading}
      onRefresh={enabled ? () => { void query.refetch(); } : undefined}
      header={<Header title={t(b('Requests', 'Requests'))} subtitle={t(b('Requests and your sent proposals', 'Requests and your sent proposals'))} />}>
      <View style={styles.switcher}>
        <Button label={`Incoming (${leads.length})`} variant={view === 'requests' ? 'primary' : 'secondary'} onPress={() => router.setParams({ view: 'requests' })} style={styles.switchButton} labelStyle={{ fontSize: type.caption, lineHeight: leading(type.caption, 4) }} />
        <Button label={`Proposals (${sent.length})`} variant={view === 'proposals' ? 'primary' : 'secondary'} onPress={() => router.setParams({ view: 'proposals' })} style={styles.switchButton} labelStyle={{ fontSize: type.caption, lineHeight: leading(type.caption, 4) }} />
      </View>
      {!enabled ? <EmptyState icon="inbox" title="Vendor API unavailable" body="Sign in as a vendor and enable the API to load server requests." /> : null}
      {query.isLoading ? <Text>Loading requests…</Text> : null}
      {query.isError ? <Text>Could not load requests from the server.</Text> : null}
      {query.isSuccess && shown.length === 0 ? <EmptyState icon={view === 'proposals' ? 'send' : 'inbox'} title={view === 'proposals' ? 'No proposals returned' : t(b('Geen aanvragen', 'No requests'))} body={view === 'proposals' ? 'The server returned no sent proposals.' : t(b('De server heeft geen aanvragen teruggegeven.', 'The server returned no requests.'))} /> : null}
      {query.isSuccess ? shown.map((lead) => <ApiLeadCard key={rowId(lead)} lead={lead} proposal={view === 'proposals'} />) : null}
    </Screen>
  );
}

function rowId(row: ApiRecord) {
  return String(row.lead_id ?? row.id ?? row.request_id ?? '');
}

function ApiLeadCard({ lead, proposal }: { lead: ApiRecord; proposal: boolean }) {
  const id = rowId(lead);
  const request = lead.request && typeof lead.request === 'object' ? lead.request as ApiRecord : lead;
  const type = useType();
  const title = textOf(lead, 'reference', 'request_reference') || textOf(request, 'event_type', 'occasion', 'title') || `Request ${id}`;
  const status = textOf(lead, 'status', 'availability_status') || (proposal ? 'sent' : 'new');
  const guests = Number(request.guest_count ?? request.guests ?? 0) || 0;
  const date = textOf(request, 'event_date', 'date') || '';
  const city = textOf(request, 'city') || '';
  const amount = Number(lead.total_cents ?? lead.amount_cents ?? (lead.proposal as ApiRecord | undefined)?.total_cents ?? 0);
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={[styles.ref, { fontSize: type.cardTitle }]} numberOfLines={2}>{title}</Text>
          <Text style={[styles.provider, { fontSize: type.caption }]} numberOfLines={1}>{textOf(request, 'event_type', 'occasion') || status}</Text>
        </View>
        <Badge label={status} tone={proposal ? 'good' : 'accent'} />
      </View>
      <View style={styles.metaRow}><Icon name="people" color={palette.muted} size={type.caption} /><Text style={[styles.metaText, { fontSize: type.caption }]}>{guests} guests · {city}</Text></View>
      <View style={styles.metaRow}><Icon name="calendar" color={palette.muted} size={type.caption} /><Text style={[styles.metaText, { fontSize: type.caption }]}>{date}</Text></View>
      {proposal && amount > 0 ? <Text style={[styles.metaText, { fontSize: type.caption }]}>{money(amount, 'en')} total</Text> : null}
      <Button label={proposal ? 'View proposal' : 'Review request'} variant="secondary" onPress={() => router.push(`/vendor/lead/${id}` as any)} style={styles.action} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.line, padding: 14, gap: 8 },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  headText: { flex: 1, gap: 2 },
  ref: { fontWeight: '800', color: palette.ink },
  provider: { color: palette.muted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { flex: 1, color: palette.muted },
  deadline: { fontWeight: '600', color: palette.warning },
  action: { minHeight: 42, alignSelf: 'stretch' },
  switcher: { flexDirection: 'row', gap: 8 },
  switchButton: { flex: 1, minHeight: 40, paddingHorizontal: 8 },
});
