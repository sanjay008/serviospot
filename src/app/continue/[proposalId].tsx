import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { ChipSingle } from '@/components/Chip';
import { ErrorState } from '@/components/ErrorState';
import { Header } from '@/components/Header';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { CONTINUE_COPY, NOT_A_BOOKING } from '@/constants/copy';
import { palette } from '@/constants/theme';
import { euro, proposalTotal } from '@/data/format';
import { useApp } from '@/state/store';

export default function ContinueScreen() {
  const { proposalId } = useLocalSearchParams<{ proposalId: string }>();
  const { proposals, providers, continueWith } = useApp();
  const proposal = proposals.find((item) => item.id === proposalId);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  if (!proposal) return <Screen header={<Header title="Continue" back />}><ErrorState body="Proposal not found." onRetry={() => router.back()} /></Screen>;
  const provider = providers.find((item) => item.id === proposal.providerId);
  return (
    <Screen
      header={<Header title="Continue with provider" back />}
      footer={
        <Button
          label="Release contact details"
          disabled={!accepted}
          onPress={() => {
            const result = continueWith(proposal.id);
            if (!result.ok) {
              setError(result.reason);
              return;
            }
            router.replace(`/contact/${proposal.requestId}`);
          }}
        />
      }>
      <Text style={styles.title}>{provider?.name}</Text>
      <Text style={styles.price}>{euro(proposalTotal(proposal))} indicative</Text>
      <Notice tone="warning" title={NOT_A_BOOKING} body={CONTINUE_COPY} />
      {error ? <Notice tone="error" body={error} /> : null}
      <ChipSingle options={['I understand and want to continue']} value={accepted ? 'I understand and want to continue' : ''} onChange={() => setAccepted(true)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', color: palette.ink },
  price: { fontSize: 16, color: palette.muted },
});
