import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { ChipSingle } from '@/components/Chip';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { uid } from '@/data/format';
import { useApp } from '@/state/store';

const SCORES = ['1', '2', '3', '4', '5'];

export default function ReviewScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { requests, providers, outcomes, submitReview, session } = useApp();
  const request = requests.find((item) => item.id === requestId);
  const outcome = outcomes.find((item) => item.requestId === requestId);
  const names = (request?.contactProviderIds ?? []).map((id) => providers.find((item) => item.id === id)?.name).filter(Boolean) as string[];
  const [providerName, setProviderName] = useState(names[0] ?? '');
  const [overall, setOverall] = useState('5');
  const [food, setFood] = useState('5');
  const [communication, setCommunication] = useState('5');
  const [reliability, setReliability] = useState('5');
  const [value, setValue] = useState('5');
  const [service, setService] = useState('5');
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');
  const [ok, setOk] = useState(false);
  return (
    <Screen header={<Header title="Verified review" back />}>
      <Text style={styles.muted}>Only a confirmed completed job can leave this kind of review.</Text>
      {message ? <Notice tone={ok ? 'success' : 'error'} body={message} /> : null}
      {names.length ? <ChipSingle options={names} value={providerName} onChange={setProviderName} /> : <Notice tone="warning" body="Continue with a provider and confirm they did the job before reviewing." />}
      <Score label="Overall" value={overall} onChange={setOverall} />
      <Score label="Food" value={food} onChange={setFood} />
      <Score label="Communication" value={communication} onChange={setCommunication} />
      <Score label="Reliability" value={reliability} onChange={setReliability} />
      <Score label="Value" value={value} onChange={setValue} />
      <Score label="Service" value={service} onChange={setService} />
      <Input label="Review" value={text} onChangeText={setText} multiline />
      <Button
        label="Submit review"
        onPress={() => {
          const provider = providers.find((item) => item.name === providerName);
          if (!provider || !text.trim()) {
            setOk(false);
            setMessage('Choose a provider and write a short review.');
            return;
          }
          if (outcome?.choice !== 'provider') {
            setOk(false);
            setMessage('Confirm on the outcome screen that you used this provider.');
            return;
          }
          const result = submitReview({
            id: uid('rev'),
            providerId: provider.id,
            requestId,
            author: session.name || 'Customer',
            overall: Number(overall),
            food: Number(food),
            communication: Number(communication),
            reliability: Number(reliability),
            value: Number(value),
            service: Number(service),
            text: text.trim(),
            verified: true,
            at: new Date().toISOString(),
          });
          setOk(result.ok);
          setMessage(result.ok ? 'Review saved as a verified completed job.' : result.reason);
          if (result.ok) setTimeout(() => router.back(), 600);
        }}
      />
    </Screen>
  );
}

function Score({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <ChipSingle options={SCORES} value={value} onChange={onChange} />
    </>
  );
}

const styles = StyleSheet.create({
  muted: { color: palette.muted, fontSize: 14, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600', color: palette.ink },
});
