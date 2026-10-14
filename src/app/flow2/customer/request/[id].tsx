import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/flow2/components/Badge';
import { Button } from '@/flow2/components/Button';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { LangToggle } from '@/flow2/components/LangToggle';
import { Notice } from '@/flow2/components/Notice';
import { ProposalCard } from '@/flow2/components/ProposalCard';
import { RequestSummary } from '@/flow2/components/RequestSummary';
import { Screen } from '@/flow2/components/Screen';
import { SectionTitle } from '@/flow2/components/SectionTitle';
import { palette } from '@/flow2/constants/theme';
import { b } from '@/flow2/data/options';
import { useApp } from '@/flow2/state/app';

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, requests, proposalsFor, setRole } = useApp();
  const request = requests.find((item) => item.id === id);

  if (!request) {
    return (
      <Screen header={<Header title={t(b('Aanvraag', 'Request'))} back right={<LangToggle />} />}>
        <EmptyState icon="doc" title={t(b('Niet gevonden', 'Not found'))} body={t(b('Deze aanvraag bestaat niet.', 'This request does not exist.'))} action={t(b('Terug', 'Back'))} onAction={() => router.back()} />
      </Screen>
    );
  }

  const proposals = proposalsFor(request.id);

  return (
    <Screen
      header={
        <Header
          title={request.reference}
          subtitle={t(b('Aanvraag en ontvangen voorstellen', 'Request and received proposals'))}
          back
          right={<LangToggle />}
        />
      }>
      <View style={styles.statusRow}>
        <Badge label={t(b('Voorstellen', 'Proposals'))} tone="accent" />
        <Text style={styles.statusText}>
          {proposals.length} {t(b('aanbieders reageerden', 'providers responded'))}
        </Text>
      </View>

      {proposals.length > 1 ? <Button label={t(b('Vergelijk alle voorstellen', 'Compare all proposals'))} onPress={() => router.push(`/flow2/customer/compare/${request.id}`)} /> : null}

      <SectionTitle title={t(b('Ontvangen voorstellen', 'Received proposals'))} />
      {proposals.length === 0 ? (
        <EmptyState icon="inbox" title={t(b('Nog geen voorstellen', 'No proposals yet'))} body={t(b('Aanbieders kunnen binnen de deadline reageren.', 'Providers can respond within the deadline.'))} />
      ) : (
        proposals.map((proposal) => <ProposalCard key={proposal.id} proposal={proposal} onPress={() => router.push(`/flow2/customer/proposal/${proposal.id}`)} />)
      )}

      <Button
        label={t(b('Vraag verduidelijking in de app', 'Ask clarification in the app'))}
        variant="secondary"
        onPress={() => Alert.alert(t(b('Chat (demo)', 'Chat (demo)')), t(b('In de echte app stel je hier vragen aan de aanbieder over dit voorstel.', 'In the real app you ask the provider questions about this proposal here.')))}
      />

      <SectionTitle title={t(b('Jouw aanvraag', 'Your request'))} />
      <RequestSummary request={request} />

      <Notice tone="accent" body={t(b('Niet vermeld is niet hetzelfde als inbegrepen. Er is geen boekingsknop.', 'Not stated does not mean included. There is no book button.'))} />

      <Button
        label={t(b('Bekijk de aanbiederflow', 'View the vendor flow'))}
        variant="secondary"
        onPress={() => {
          setRole('vendor');
          router.push('/flow2/vendor');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusText: { fontSize: 14, color: palette.muted },
});
