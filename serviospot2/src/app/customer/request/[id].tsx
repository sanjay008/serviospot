import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { LangToggle } from '@/components/LangToggle';
import { Notice } from '@/components/Notice';
import { ProposalCard } from '@/components/ProposalCard';
import { RequestSummary } from '@/components/RequestSummary';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { palette } from '@/constants/theme';
import { b } from '@/data/options';
import { useApp } from '@/state/app';

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

      {proposals.length > 1 ? <Button label={t(b('Vergelijk alle voorstellen', 'Compare all proposals'))} onPress={() => router.push(`/customer/compare/${request.id}`)} /> : null}

      <SectionTitle title={t(b('Ontvangen voorstellen', 'Received proposals'))} />
      {proposals.length === 0 ? (
        <EmptyState icon="inbox" title={t(b('Nog geen voorstellen', 'No proposals yet'))} body={t(b('Aanbieders kunnen binnen de deadline reageren.', 'Providers can respond within the deadline.'))} />
      ) : (
        proposals.map((proposal) => <ProposalCard key={proposal.id} proposal={proposal} onPress={() => router.push(`/customer/proposal/${proposal.id}`)} />)
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
          router.push('/vendor');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusText: { fontSize: 14, color: palette.muted },
});
