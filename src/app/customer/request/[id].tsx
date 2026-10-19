import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/flow2/components/Badge';
import { Button } from '@/flow2/components/Button';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Notice } from '@/flow2/components/Notice';
import { ProposalCard } from '@/flow2/components/ProposalCard';
import { RequestSummary } from '@/flow2/components/RequestSummary';
import { Screen } from '@/flow2/components/Screen';
import { SectionTitle } from '@/flow2/components/SectionTitle';
import { palette } from '@/flow2/constants/theme';
import { useApp } from '@/flow2/state/app';

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { requests, proposalsFor, setRole } = useApp();
  const request = requests.find((item) => item.id === id);

  if (!request) {
    return (
      <Screen header={<Header title='Request' back />}>
        <EmptyState icon="doc" title='Not found' body='This request does not exist.' action='Back' onAction={() => router.back()} />
      </Screen>
    );
  }

  const proposals = proposalsFor(request.id);

  return (
    <Screen
      header={
        <Header
          title={request.reference}
          subtitle='Request and received proposals'
          back
         
        />

      }>
      <View style={styles.statusRow}>
        <Badge label='Proposals' tone="accent" />
        <Text style={styles.statusText}>
          {proposals.length} providers responded
        </Text>
      </View>

      {proposals.length > 1 ? <Button label='Compare all proposals' onPress={() => router.push(`/customer/compare/${request.id}` as any)} /> : null}

        <Text style={styles.statusText}>No proposals</Text>
      {proposals.length === 0 ? (
        <EmptyState icon='inbox' title='No proposals yet' body='Providers can respond within the deadline.' />
      ) : (
        proposals.map((proposal) => <ProposalCard key={proposal.id} proposal={proposal} onPress={() => router.push(`/customer/proposal/${proposal.id}` as any)} />)
      )}

      <Button
        label='Ask clarification in the app'
        variant="secondary"
        onPress={() => Alert.alert('Chat (demo)', 'In the real app you ask the provider questions about this proposal here.')}
      />

      <SectionTitle title='Your request' />
      <RequestSummary request={request} />

      <Notice tone="accent" body='Not stated does not mean included. There is no book button.' />

      <Button
        label='View the vendor flow'
        variant="secondary"
        onPress={() => {
          setRole('vendor');
          router.push('/vendor' as any);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusText: { fontSize: 14, color: palette.muted },
});