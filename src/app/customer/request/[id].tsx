import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { API_ENABLED, useCloseRequestMutation, useDuplicateRequestMutation, useGetRequestDetailsQuery } from '@/api';
import { recordOf } from '@/api/mappers';
import { ApiRecord } from '@/api/types';
import { Button } from '@/flow2/components/Button';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';

export default function RequestDetailScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const query = useGetRequestDetailsQuery(id, { skip: !API_ENABLED || !id });
  const request = recordOf(query.data, 'request');
  const [duplicateRequest, duplicateState] = useDuplicateRequestMutation();
  const [closeRequest, closeState] = useCloseRequestMutation();
  const [notice, setNotice] = useState('');
  if (!API_ENABLED) return <Screen header={<Header title="My requirements" back />}><EmptyState icon="doc" title="API unavailable" body="Connect to the API to load request details." /></Screen>;
  if (!query.isLoading && !request) return <Screen header={<Header title="My requirements" back />}><EmptyState icon="doc" title="Request not found" body="The server returned no request details." action="Back" onAction={() => router.back()} /></Screen>;
  return <Screen loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRefresh={() => { void query.refetch(); }} header={<Header title="My requirements" subtitle={String(request?.request_id ?? request?.id ?? id)} back />}>
    {request ? <Rows data={request} /> : null}
    <Button label="Duplicate request" variant="secondary" loading={duplicateState.isLoading} onPress={async () => { try { await duplicateRequest(id).unwrap(); setNotice('Request duplicated.'); } catch { setNotice('Could not duplicate this request.'); } }} />
    <Button label="Close request" variant="danger" loading={closeState.isLoading} onPress={async () => { try { await closeRequest(id).unwrap(); setNotice('Request closed.'); } catch { setNotice('Could not close this request.'); } }} />
    {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
  </Screen>;
}
function Rows({ data }: { data: ApiRecord }) { return <View style={styles.card}>{Object.entries(data).filter(([, v]) => v == null || ['string', 'number', 'boolean'].includes(typeof v)).map(([key, value]) => <View key={key} style={styles.row}><Text style={styles.label}>{key.replaceAll('_', ' ')}</Text><Text style={styles.value}>{value == null ? '' : String(value)}</Text></View>)}</View>; }
const styles = StyleSheet.create({ card: { padding: 14, gap: 12, borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line }, row: { gap: 3 }, label: { color: palette.muted, textTransform: 'capitalize' }, value: { color: palette.ink, fontWeight: '600' }, notice: { color: palette.accentDark } });
