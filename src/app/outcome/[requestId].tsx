import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { ChipSingle } from '@/components/Chip';
import { Header } from '@/components/Header';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { useRequestSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

const OPTIONS = ['Yes, a provider I continued with', 'Yes, another platform provider', 'No', 'Event cancelled', 'Prefer not to say'];

export default function OutcomeScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { requests, providers, submitOutcome, outcomes } = useApp();
  useRequestSync(requestId);
  const request = requests.find((item) => item.id === requestId);
  const existing = outcomes.find((item) => item.requestId === requestId);
  const choices = request?.contactProviderIds.map((id) => providers.find((provider) => provider.id === id)?.name).filter(Boolean) as string[];
  const [choice, setChoice] = useState(OPTIONS[0]);
  const [providerName, setProviderName] = useState(choices[0] ?? '');
  const [saved, setSaved] = useState(!!existing);
  const [error, setError] = useState('');
  return (
    <Screen header={<Header title="After the event" back />}>
      <Text style={styles.lead}>Did you ultimately use one of the providers you met through ServioSpot?</Text>
      <Text style={styles.muted}>A contact release is not the same as a completed job.</Text>
      {error ? <Notice tone="error" body={error} /> : null}
      {saved ? <Notice tone="success" body="Outcome saved. If you used a provider you continued with, you can leave a verified review." /> : null}
      <ChipSingle options={OPTIONS} value={choice} onChange={setChoice} />
      {choice.startsWith('Yes, a provider') && choices.length ? <ChipSingle options={choices} value={providerName} onChange={setProviderName} /> : null}
      <Button
        label="Save outcome"
        onPress={async () => {
          const provider = providers.find((item) => item.name === providerName);
          const map = {
            'Yes, a provider I continued with': 'provider',
            'Yes, another platform provider': 'other',
            No: 'no',
            'Event cancelled': 'cancelled',
            'Prefer not to say': 'private',
          } as const;
          const result = await submitOutcome({ requestId: requestId ?? '', choice: map[choice as keyof typeof map], providerId: provider?.id });
          if (!result.ok) {
            setError(result.reason);
            setSaved(false);
            return;
          }
          setError('');
          setSaved(true);
        }}
      />
      {saved && choice.startsWith('Yes, a provider') ? <Button label="Write a verified review" variant="secondary" onPress={() => router.push(`/review/${requestId}`)} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: palette.ink },
  muted: { fontSize: 14, lineHeight: 20, color: palette.muted },
});
