import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Disclaimer } from '@/components/Disclaimer';
import { ErrorState } from '@/components/ErrorState';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Notice } from '@/components/Notice';
import { ProposalCard } from '@/components/ProposalCard';
import { Screen } from '@/components/Screen';
import { CANCEL_OUTSIDE, MAX_CONTINUES } from '@/constants/copy';
import { palette } from '@/constants/theme';
import { euro, formatDate, requestLabel } from '@/data/format';
import { useRequestSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

export default function RequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { requests, proposals, providers, cancelRequest } = useApp();
  useRequestSync(id);
  const request = requests.find((item) => item.id === id);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  if (!request) return <Screen header={<Header title="Request" back />}><ErrorState body="This request is not on this device." onRetry={() => router.back()} /></Screen>;
  const rows = proposals.filter((item) => item.requestId === request.id && item.status === 'submitted');
  const budget = request.budgetType === 'open' ? 'Open budget' : request.budgetCents ? euro(request.budgetCents) : 'No budget';
  return (
    <Screen refresh header={<Header title={request.eventType} subtitle={requestLabel[request.status]} back />}>
      {message ? <Notice tone={message.startsWith('Cancelled') ? 'success' : 'error'} body={message} /> : null}
      <Card>
        <Text style={styles.line}>{request.city} {request.postcode} · {formatDate(request.date)} · {request.startTime}</Text>
        <Text style={styles.line}>{request.guests} guests · {request.setting || 'Setting not set'} · {budget}</Text>
        <Text style={styles.line}>Needs: {request.needs.join(', ')}</Text>
        <Text style={styles.line}>Cuisines: {request.cuisines.join(', ') || 'Any'}</Text>
        <Text style={styles.muted}>Allergies: {request.allergies || 'Not stated'}</Text>
        {request.summary.map((line) => <Text key={line} style={styles.line}>{line}</Text>)}
        <Text style={styles.muted}>{request.invitedCount} eligible providers invited. Listings on the Free plan are excluded, as are providers over capacity or outside a useful distance.</Text>
      </Card>
      <Disclaimer short />
      <Text style={styles.heading}>Proposals</Text>
      {rows.length === 0 ? <Notice tone="info" body="No proposals yet. Providers still need to confirm availability." /> : null}
      {rows.map((proposal) => (
        <ProposalCard key={proposal.id} proposal={proposal} provider={providers.find((item) => item.id === proposal.providerId)} onPress={() => router.push(`/proposal/${proposal.id}`)} />
      ))}
      {rows.length > 1 ? <Button label="Compare proposals" variant="secondary" onPress={() => router.push(`/compare/${request.id}`)} /> : null}
      {request.status === 'event_pending' ? <Button label="Tell us the outcome" onPress={() => router.push(`/outcome/${request.id}`)} /> : null}
      {request.contactProviderIds.length ? <Button label="View released contacts" variant="secondary" onPress={() => router.push(`/contact/${request.id}`)} /> : null}
      <Text style={styles.muted}>You can continue with up to {MAX_CONTINUES} providers.</Text>
      {request.status !== 'cancelled' && request.status !== 'completed' ? (
        <Card>
          <Text style={styles.heading}>Cancel request</Text>
          <Input label="Reason" value={reason} onChangeText={setReason} />
          <Text style={styles.muted}>{request.contactProviderIds.length ? CANCEL_OUTSIDE : 'Providers who were invited will see the request as cancelled.'}</Text>
          <Button
            label="Cancel request"
            variant="danger"
            onPress={async () => {
              const result = await cancelRequest(request.id, reason);
              setMessage(result.ok ? 'Cancelled. Any deal you already made off-platform stays between you and the provider.' : result.reason);
            }}
          />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  line: { fontSize: 15, lineHeight: 22, color: palette.ink },
  muted: { fontSize: 13, lineHeight: 19, color: palette.muted },
  heading: { fontSize: 18, fontWeight: '700', color: palette.ink },
});
