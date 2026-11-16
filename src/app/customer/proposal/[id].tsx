import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { API_ENABLED, useGetProposalQuery, useSetProposalResponseMutation } from '@/api';
import { recordOf } from '@/api/mappers';
import { type ApiRecord } from '@/api/types';
import { Button } from '@/flow2/components/Button';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { useApp } from '@/flow2/state/app';

export default function ProposalDetailScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { t } = useApp();
  const query = useGetProposalQuery(id, { skip: !API_ENABLED || !id });
  const proposal = recordOf(query.data, 'proposal');
  const [respond, responseState] = useSetProposalResponseMutation();
  const proposalId = String(proposal?.proposal_id ?? proposal?.id ?? id);
  const providerName = get(proposal, 'provider_name', 'business_name', 'name') || t({ nl: 'Voorstel', en: 'Proposal' });
  if (!API_ENABLED) return <Screen header={<Header title={providerName} back />}><EmptyState title="API unavailable" body="Connect to the API to load this proposal." /></Screen>;
  if (!query.isLoading && !proposal) return <Screen header={<Header title={providerName} back />}><EmptyState icon="doc" title="Not found" body="The server returned no proposal." action="Back" onAction={() => router.back()} /></Screen>;
  return <Screen loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRefresh={() => { void query.refetch(); }} header={<Header title={providerName} back />}>
    <DataRows data={proposal} />
    <Button label="Interested" variant="secondary" loading={responseState.isLoading} onPress={() => void respond({ proposal_id: proposalId, response: 'interested' }).unwrap()} />
    <Button label="Reject proposal" variant="secondary" loading={responseState.isLoading} onPress={() => void respond({ proposal_id: proposalId, response: 'rejected' }).unwrap()} />
    <Button label="Request contact" onPress={() => router.push(`/customer/continue/${proposalId}` as any)} />
  </Screen>;
}
function get(row: ApiRecord | null, ...keys: string[]) { for (const key of keys) if (typeof row?.[key] === 'string' || typeof row?.[key] === 'number') return String(row[key]); return ''; }
function DataRows({ data }: { data: ApiRecord | null }) { if (!data) return null; const entries = Object.entries(data).filter(([, value]) => value == null || ['string', 'number', 'boolean'].includes(typeof value)); return <View style={styles.box}>{entries.map(([key, value]) => <View style={styles.row} key={key}><Text style={styles.key}>{key.replaceAll('_', ' ')}</Text><Text style={styles.value}>{value == null ? '' : String(value)}</Text></View>)}</View>; }
const styles = StyleSheet.create({ box: { padding: 14, borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, gap: 12 }, row: { gap: 3 }, key: { color: palette.muted, textTransform: 'capitalize' }, value: { color: palette.ink, fontWeight: '600' } });
