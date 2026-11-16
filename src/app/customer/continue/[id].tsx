import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { API_ENABLED, useContinueWithProviderMutation, useGetProposalQuery, useGetReleasedContactsQuery } from '@/api';
import { recordOf, rowsOf } from '@/api/mappers';
import { ApiRecord } from '@/api/types';
import { Button } from '@/flow2/components/Button';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Card } from '@/flow2/components/Card';
import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';

export default function ContinueScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const proposalQuery = useGetProposalQuery(id, { skip: !API_ENABLED || !id });
  const proposal = recordOf(proposalQuery.data, 'proposal');
  const requestId = String(proposal?.request_id ?? '');
  const [continueProvider, continueState] = useContinueWithProviderMutation();
  const [consent, setConsent] = useState(false);
  const [done, setDone] = useState(false);
  const contactsQuery = useGetReleasedContactsQuery(requestId, { skip: !API_ENABLED || !done || !requestId });
  if (!API_ENABLED) return <Screen header={<Header title="Share contact" back />}><EmptyState title="API unavailable" body="Connect to the API to continue with a provider." /></Screen>;
  if (!proposalQuery.isLoading && !proposal) return <Screen header={<Header title="Share contact" back />}><EmptyState icon="doc" title="Not found" body="The server returned no proposal." action="Back" onAction={() => router.back()} /></Screen>;
  const confirm = async () => { try { await continueProvider(id).unwrap(); setDone(true); } catch { /* Mutation error is presented by keeping the consent form open. */ } };
  const contacts = rowsOf(contactsQuery.data);
  return <Screen loading={proposalQuery.isLoading} refreshing={proposalQuery.isFetching && !proposalQuery.isLoading} onRefresh={() => { void proposalQuery.refetch(); if (done) void contactsQuery.refetch(); }} header={<Header title="Share contact" back />}>
    <Notice tone="accent" title="Consent required" body="You share your verified contact details with this provider. This is not a booking." />
    {done ? <Card><Text style={styles.title}>Contacts shared</Text>{contacts.length ? contacts.map((row, index) => <ContactRow key={String(row.contact_id ?? row.id ?? index)} row={row} />) : <Text style={styles.value}>{contactsQuery.isLoading ? 'Loading released contacts…' : 'No contact details returned by the server.'}</Text>}<Button label="Back to proposals" onPress={() => router.replace(`/customer/request/${requestId}` as any)} /></Card> : <Card>
      <Pressable style={styles.checkRow} onPress={() => setConsent((v) => !v)} accessibilityRole="checkbox" accessibilityState={{ checked: consent }}><View style={[styles.checkbox, consent && styles.checked]}>{consent ? <Icon name="check" color="#fff" size={14} /> : null}</View><Text style={styles.value}>I consent and understand this is not a booking.</Text></Pressable>
      <Button label="Request contact" disabled={!consent} loading={continueState.isLoading} onPress={() => void confirm()} /><Button label="Cancel" variant="secondary" onPress={() => router.back()} />
    </Card>}
  </Screen>;
}
function ContactRow({ row }: { row: ApiRecord }) { return <View style={styles.contact}>{Object.entries(row).filter(([, v]) => typeof v === 'string' || typeof v === 'number').map(([k, v]) => <Text key={k} style={styles.value}>{k.replaceAll('_', ' ')}: {String(v)}</Text>)}</View>; }
const styles = StyleSheet.create({ checkRow: { flexDirection: 'row', gap: 10, alignItems: 'center' }, checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: palette.line, alignItems: 'center', justifyContent: 'center' }, checked: { backgroundColor: palette.accent, borderColor: palette.accent }, value: { color: palette.ink, flex: 1 }, title: { color: palette.ink, fontWeight: '800', fontSize: 18 }, contact: { paddingVertical: 8, gap: 5 } });
