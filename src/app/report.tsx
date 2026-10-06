import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/Button';
import { ChipSingle } from '@/components/Chip';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { REPORT_REASONS } from '@/data/mock';
import { useApp } from '@/state/store';

export default function ReportScreen() {
  const { target } = useLocalSearchParams<{ target?: string }>();
  const { report } = useApp();
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <Screen header={<Header title="Report" back />}>
      {sent ? <Notice tone="success" title="Report received" body="A moderator would review this in the live product. This preview only keeps it on the device." /> : null}
      <ChipSingle options={REPORT_REASONS} value={reason} onChange={setReason} />
      <Input label="What happened" value={note} onChangeText={setNote} multiline />
      <Button
        label="Submit report"
        onPress={() => {
          report(`${target ?? 'general'}: ${reason}. ${note}`);
          setSent(true);
          setTimeout(() => router.back(), 700);
        }}
      />
    </Screen>
  );
}
