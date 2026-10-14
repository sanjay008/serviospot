import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { useApp } from '@/state/store';

export default function ReportScreen() {
  const { target } = useLocalSearchParams<{ target?: string }>();
  const { report } = useApp();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  return (
    <Screen header={<Header title="Report" back />}>
      {error ? <Notice tone="error" body={error} /> : null}
      {sent ? <Notice tone="success" title="Report received" body="The report was sent. A moderator can review it." /> : null}
      <Input label="Reason" value={reason} onChangeText={setReason} />
      <Input label="What happened" value={note} onChangeText={setNote} multiline />
      <Button
        label="Submit report"
        onPress={async () => {
          const result = await report(target ?? 'general', reason, note);
          if (!result.ok) {
            setError(result.reason);
            return;
          }
          setError('');
          setSent(true);
          setTimeout(() => router.back(), 700);
        }}
      />
    </Screen>
  );
}
