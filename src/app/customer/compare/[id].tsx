import { API_ENABLED, useGetRequestProposalComparisonQuery } from '@/api';
import { recordOf, rowsOf } from '@/api/mappers';
import { type ApiRecord } from '@/api/types';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function CompareScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const query = useGetRequestProposalComparisonQuery(id, { skip: !API_ENABLED || !id });
  const root = recordOf(query.data, 'comparison');
  const rows = rowsOf(query.data);
  const data = root && root !== query.data ? root : null;
  return <Screen loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRefresh={() => { void query.refetch(); }} header={<Header title="Compare proposals" back />}>
    {!API_ENABLED ? <EmptyState icon="compare" title="API unavailable" body="Connect to the API to load proposal comparison." /> : null}
    {API_ENABLED && !query.isLoading && !data && !rows.length ? <EmptyState icon="compare" title="Nothing to compare" body="The server returned no comparison." action="Back" onAction={() => router.back()} /> : null}
    {data ? <ApiRows data={data} /> : null}
    {rows.map((row, index) => <ApiRows key={String(row.proposal_id ?? row.id ?? index)} data={row} />)}
  </Screen>;
}
function ApiRows({ data }: { data: ApiRecord }) { const fields = Object.entries(data).filter(([, v]) => v == null || ['string', 'number', 'boolean'].includes(typeof v)); return <View style={styles.card}>{fields.map(([k, v]) => <View key={k} style={styles.row}><Text style={styles.key}>{k.replaceAll('_', ' ')}</Text><Text style={styles.value}>{v == null ? '' : String(v)}</Text></View>)}</View>; }
const styles = StyleSheet.create({ card: { padding: 14, gap: 12, borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line }, row: { gap: 3 }, key: { color: palette.muted, textTransform: 'capitalize' }, value: { color: palette.ink, fontWeight: '700' } });
