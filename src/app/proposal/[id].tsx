import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Disclaimer } from '@/components/Disclaimer';
import { ErrorState } from '@/components/ErrorState';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { euro, formatDate, perPersonCents, proposalTotal } from '@/data/format';
import { useApp } from '@/state/store';

export default function ProposalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { proposals, providers, requests, withdrawProposal, openChat } = useApp();
  const proposal = proposals.find((item) => item.id === id);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  if (!proposal) return <Screen header={<Header title="Proposal" back />}><ErrorState body="This proposal is not available." onRetry={() => router.back()} /></Screen>;
  const provider = providers.find((item) => item.id === proposal.providerId);
  const request = requests.find((item) => item.id === proposal.requestId);
  const total = proposalTotal(proposal);
  const each = perPersonCents(total, proposal.guests);
  const released = request?.contactProviderIds.includes(proposal.providerId);
  const lines = [
    ['Food', proposal.foodCents],
    ['Drinks', proposal.drinksCents],
    ['Staff', proposal.staffCents],
    ['Delivery / travel', proposal.deliveryCents],
    ['Equipment', proposal.equipmentCents],
    ['Other', proposal.otherCents],
    ['Discount', -proposal.discountCents],
  ] as const;
  return (
    <Screen
      header={<Header title={provider?.name ?? 'Proposal'} back />}
      footer={proposal.status === 'submitted' && !proposal.leadId ? <Button label={released ? 'Contact released' : 'Continue with provider'} onPress={() => router.push(`/continue/${proposal.id}`)} /> : null}>
      {proposal.status === 'withdrawn' ? <Notice tone="warning" body={`Withdrawn${proposal.withdrawReason ? `: ${proposal.withdrawReason}` : ''}.`} /> : null}
      <Badge label={proposal.availability} tone={proposal.availability === 'available' ? 'good' : 'warn'} />
      {proposal.partialNote ? <Text style={styles.body}>{proposal.partialNote}</Text> : null}
      <Text style={styles.price}>{euro(total)}</Text>
      <Text style={styles.muted}>{each != null ? `${euro(each)} per person · ` : ''}Expires {formatDate(proposal.expiresAt)}</Text>
      <Disclaimer />
      <Text style={styles.body}>{proposal.message}</Text>
      <Card>
        {lines.map(([label, cents]) => (
          <Text key={label} style={styles.line}>{label}: {cents < 0 ? `−${euro(Math.abs(cents))}` : euro(cents)}</Text>
        ))}
        <Text style={styles.line}>VAT: {proposal.vatNote}</Text>
      </Card>
      <Card>
        <Text style={styles.heading}>Included</Text>
        <Text style={styles.body}>{proposal.included.join(', ') || 'Not listed'}</Text>
        <Text style={styles.heading}>Excluded</Text>
        <Text style={styles.body}>{proposal.excluded.join(', ') || 'Not listed'}</Text>
        <Text style={styles.heading}>Assumptions</Text>
        <Text style={styles.body}>{proposal.assumptions}</Text>
        <Text style={styles.muted}>Items: {proposal.items.join(', ') || '—'} · Services: {proposal.services.join(', ') || '—'}</Text>
      </Card>
      {!proposal.leadId ? (
        <Button
          label="Ask a question"
          variant="secondary"
          onPress={() => {
            const chatId = openChat({
              box: 'customer',
              requestId: proposal.requestId,
              providerId: proposal.providerId,
              title: provider?.name ?? 'Provider',
              subtitle: request?.eventType ?? 'Request',
            });
            router.push(`/chat/${chatId}`);
          }}
        />
      ) : null}
      {proposal.leadId && proposal.status === 'submitted' ? (
        <Card>
          <Input label="Withdraw reason" value={reason} onChangeText={setReason} />
          <Button label="Withdraw proposal" variant="danger" onPress={() => { withdrawProposal(proposal.id, reason || 'Withdrawn'); setNote('Proposal withdrawn.'); }} />
          {note ? <Notice tone="success" body={note} /> : null}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  price: { fontSize: 32, fontWeight: '700', color: palette.ink },
  body: { fontSize: 15, lineHeight: 22, color: palette.ink },
  muted: { fontSize: 13, lineHeight: 18, color: palette.muted },
  line: { fontSize: 15, color: palette.ink },
  heading: { fontSize: 15, fontWeight: '700', color: palette.ink },
});
