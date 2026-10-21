import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/flow2/components/Button';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { ProposalCard } from '@/flow2/components/ProposalCard';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { b } from '@/flow2/data/options';
import { useApp } from '@/flow2/state/app';

export default function RequestsScreen() {
  const { t, requests, proposalsFor } = useApp();
  const customerRequests = requests.filter((request) => request.status !== 'draft');
  const selectedRequest = customerRequests[0];
  const selectedProposalCount = selectedRequest ? proposalsFor(selectedRequest.id).length : 0;

  return (
    <Screen header={<Header
      title={t(b('My requests', 'My requests'))}
      subtitle={t(b('Volg uitnodigingen, voorstellen en deadlines.', 'Track invitations, proposals and deadlines.'))}
      back
      right={selectedRequest ? (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(b('Voorstellen vergelijken', 'Compare proposals'))}
            accessibilityState={{ disabled: selectedProposalCount < 2 }}
            disabled={selectedProposalCount < 2}
            onPress={() => router.push(`/customer/compare/${selectedRequest.id}` as any)}
            style={[styles.iconButton, selectedProposalCount < 2 && styles.iconButtonDisabled]}>
            <Image source={require('../../../../assets/images/comparison-custom.png')} contentFit="contain" tintColor={selectedProposalCount < 2 ? palette.muted : palette.accent} style={styles.actionImage} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(b('Mijn wensen bekijken', 'View my requirements'))}
            onPress={() => router.push(`/customer/request/${selectedRequest.id}` as any)}
            style={styles.iconButton}>
            <Image source={require('../../../../assets/images/requirements-custom.png')} contentFit="contain" tintColor={palette.accent} style={styles.actionImage} />
          </Pressable>
        </View>
      ) : null}
    />}>
      <Button label={t(b('New request', 'New request'))} onPress={() => router.push('/customer/request' as any)} />
      {customerRequests.length === 0 ? (
        <EmptyState icon="doc" title={t(b('Nog geen aanvragen', 'No requests yet'))} body={t(b('Start een aanvraag en ontvang voorstellen.', 'Start a request and receive proposals.'))} />
      ) : (
        customerRequests.map((request) => {
          const proposals = proposalsFor(request.id);
          return (
            <View key={request.id} style={styles.requestGroup}>
              {proposals.length ? proposals.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} onPress={() => router.push(`/customer/proposal/${proposal.id}` as any)} />
              )) : (
                <Text style={styles.noProposals}>{t(b('Nog geen cateraars hebben gereageerd.', 'No caterers have responded yet.'))}</Text>
              )}
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  requestGroup: { gap: 10 },
  actions: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' },
  iconButtonDisabled: { backgroundColor: palette.well },
  actionImage: { width: 20, height: 20 },
  noProposals: { paddingHorizontal: 4, paddingVertical: 2, color: palette.muted, fontSize: 13 },
});
