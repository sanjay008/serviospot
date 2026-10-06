import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChipGroup } from '@/components/Chip';
import { ErrorState } from '@/components/ErrorState';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { leadSummary, suggestedQuestions } from '@/data/ai';
import { euro, formatDate, leadLabel, toggleIn } from '@/data/format';
import { useApp } from '@/state/store';

export default function LeadDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { leads, setAvailability, openChat, spendAi, days } = useApp();
  const lead = leads.find((item) => item.id === id);
  const [needs, setNeeds] = useState<string[]>(lead?.fulfilledNeeds ?? []);
  const [note, setNote] = useState(lead?.availabilityNote ?? '');
  const [summary, setSummary] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [error, setError] = useState('');
  if (!lead) return <Screen header={<Header title="Lead" back />}><ErrorState body="This lead is not in the inbox." onRetry={() => router.back()} /></Screen>;
  const request = lead.request;
  const blocked = days[request.date] === 'unavailable';
  const budget = request.budgetType === 'open' ? 'Open' : request.budgetCents ? euro(request.budgetCents) : 'Not provided';
  const respond = (status: typeof lead.status) => {
    if (status === 'partial' && needs.length === 0) {
      setError('Select the needs you can cover.');
      return;
    }
    setError('');
    setAvailability(lead.id, status, needs, note);
  };
  return (
    <Screen header={<Header title={request.eventType} subtitle={leadLabel[lead.status]} back />}>
      {blocked ? <Notice tone="warning" title="Calendar says unavailable" body="Your calendar marks this date unavailable. A live reply still decides the lead." /> : null}
      {error ? <Notice tone="error" body={error} /> : null}
      <Card>
        <Text style={styles.line}>{request.city} {request.postcode} · {formatDate(request.date)} · {request.startTime}</Text>
        <Text style={styles.line}>{request.guests} guests · {request.setting}</Text>
        <Text style={styles.line}>Needs: {request.needs.join(', ')}</Text>
        <Text style={styles.line}>Cuisines: {request.cuisines.join(', ') || 'Any'}</Text>
        <Text style={styles.muted}>Allergies: {request.allergies || 'Not stated'}</Text>
        <Text style={styles.muted}>Budget: {budget}</Text>
        <Text style={styles.body}>{request.notes}</Text>
      </Card>
      <ViewTags lead={lead} />
      {summary ? <Notice tone="info" title="Lead summary" body={summary} /> : null}
      {questions.length ? <Notice tone="info" title="Questions you might ask" body={questions.join('\n')} /> : null}
      <Button
        label="Summarize this lead"
        variant="secondary"
        onPress={() => {
          const credit = spendAi();
          if (!credit.ok) {
            setError(credit.reason);
            return;
          }
          setSummary(leadSummary(request.eventType, request.city, request.guests, request.needs, budget));
          setQuestions(suggestedQuestions(request.allergies, request.setting, request.halal));
        }}
      />
      <Text style={styles.heading}>Availability</Text>
      <Text style={styles.muted}>Answer this before a proposal. If you can only cover part of the request, pick those needs.</Text>
      <ChipGroup options={request.needs} selected={needs} onToggle={(item) => setNeeds(toggleIn(needs, item))} />
      <Input label="Note to yourself" value={note} onChangeText={setNote} placeholder="Food available, waiting staff unavailable." />
      <Button label="Available" onPress={() => respond('available')} />
      <Button label="Partially available" variant="secondary" onPress={() => respond('partial')} />
      <Button label="Possibly available" variant="secondary" onPress={() => respond('maybe')} />
      <Button label="Not available" variant="ghost" onPress={() => respond('unavailable')} />
      {lead.status === 'available' || lead.status === 'partial' || lead.status === 'maybe' || lead.status === 'proposal_draft' || lead.status === 'proposal_submitted' ? (
        <Button label={lead.proposalId ? 'Edit proposal' : 'Create indicative proposal'} onPress={() => router.push(`/proposal-builder/${lead.id}`)} />
      ) : null}
      {lead.contactReleased ? (
        <Card>
          <Text style={styles.heading}>Customer contact</Text>
          <Text selectable style={styles.line}>{lead.customerName}</Text>
          <Text selectable style={styles.line}>{lead.customerPhone}</Text>
          <Text selectable style={styles.line}>{lead.customerEmail}</Text>
        </Card>
      ) : (
        <Text style={styles.muted}>Customer contact stays hidden until they choose to continue.</Text>
      )}
      <Button
        label="Message customer"
        variant="secondary"
        onPress={() => {
          const chatId = openChat({ box: 'provider', requestId: request.id, providerId: 'me', title: lead.customerName, subtitle: request.eventType });
          router.push(`/chat/${chatId}`);
        }}
      />
    </Screen>
  );
}

function ViewTags({ lead }: { lead: { quality: { phoneVerified: boolean; completeness: string; dateConfirmed: boolean; budgetProvided: boolean } } }) {
  return (
    <Card>
      <Text style={styles.heading}>Lead quality</Text>
      <Badge label={lead.quality.phoneVerified ? 'Phone verified' : 'Phone not verified'} tone={lead.quality.phoneVerified ? 'good' : 'warn'} />
      <Badge label={`Completeness ${lead.quality.completeness}`} />
      {lead.quality.dateConfirmed ? <Badge label="Event date confirmed" tone="good" /> : null}
      {lead.quality.budgetProvided ? <Badge label="Budget provided" tone="good" /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  line: { fontSize: 15, lineHeight: 22, color: palette.ink },
  body: { fontSize: 15, lineHeight: 22, color: palette.ink },
  muted: { fontSize: 13, lineHeight: 19, color: palette.muted },
  heading: { fontSize: 16, fontWeight: '700', color: palette.ink },
});
