import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChipGroup } from '@/components/Chip';
import { ErrorState } from '@/components/ErrorState';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Input } from '@/components/Input';
import { eventIcon } from '@/components/LeadCard';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { leadSummary, suggestedQuestions } from '@/data/ai';
import { euro, formatDate, leadLabel, toggleIn } from '@/data/format';
import { useConversationsSync, useLeadSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

export default function LeadDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { leads, setAvailability, openChat, spendAi, days } = useApp();
  useLeadSync(id);
  useConversationsSync('provider');
  const lead = leads.find((item) => item.id === id);
  const [needs, setNeeds] = useState<string[]>(lead?.fulfilledNeeds ?? []);
  const [note, setNote] = useState(lead?.availabilityNote ?? '');
  const [summary, setSummary] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [error, setError] = useState('');
  if (!lead) return <Screen header={<Header title="Request" back />}><ErrorState body="This request is not here." onRetry={() => router.back()} /></Screen>;
  const request = lead.request;
  const blocked = days[request.date] === 'unavailable';
  const budget = request.budgetType === 'open' ? 'Open' : request.budgetCents ? euro(request.budgetCents) : 'Not provided';
  const respond = async (status: typeof lead.status) => {
    if (status === 'partial' && needs.length === 0) {
      setError('Pick the parts you can do.');
      return;
    }
    setError('');
    const result = await setAvailability(lead.id, status, needs, note);
    if (!result.ok) setError(result.reason);
  };
  return (
    <Screen header={<Header title={request.eventType} subtitle={leadLabel[lead.status]} back />}>
      <View style={styles.hero}>
        <Icon name={eventIcon(request.eventType)} color={palette.accent} size={48} />
      </View>
      {blocked ? <Notice tone="warning" title="You marked this day as busy" body="You can still say yes if you want this event." /> : null}
      {error ? <Notice tone="error" body={error} /> : null}
      <Card>
        <Text style={styles.heading}>{lead.customerName}</Text>
        <Text style={styles.line}>{request.city} · {formatDate(request.date)} · {request.startTime}</Text>
        <Text style={styles.line}>{request.guests} guests · {request.setting}</Text>
        <Text style={styles.line}>They want {request.needs.join(', ') || 'catering'}</Text>
        <Text style={styles.line}>Food: {request.cuisines.join(', ') || 'Any'}</Text>
        <Text style={styles.muted}>Allergies: {request.allergies || 'Not stated'}</Text>
        <Text style={styles.muted}>Budget: {budget}</Text>
        {request.notes ? <Text style={styles.body}>{request.notes}</Text> : null}
        {request.summary.map((line) => <Text key={line} style={styles.line}>{line}</Text>)}
      </Card>
      <ViewTags lead={lead} />
      {summary ? <Notice tone="info" title="In short" body={summary} /> : null}
      {questions.length ? <Notice tone="info" title="Questions you might ask" body={questions.join('\n')} /> : null}
      <Button
        label="Explain this request"
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
      <Text style={styles.heading}>Can you do this event?</Text>
      <Text style={styles.muted}>Say yes before you send a price. If you can only do part of it, pick those parts.</Text>
      <ChipGroup options={request.needs} selected={needs} onToggle={(item) => setNeeds(toggleIn(needs, item))} />
      <Input label="Note to yourself" value={note} onChangeText={setNote} placeholder="Food available, waiting staff unavailable." />
      <Button label="Yes, I can do it" onPress={() => respond('available')} />
      <Button label="Only part of it" variant="secondary" onPress={() => respond('partial')} />
      <Button label="I need to check" variant="secondary" onPress={() => respond('maybe')} />
      <Button label="I cannot do it" variant="ghost" onPress={() => respond('unavailable')} />
      {lead.status === 'available' || lead.status === 'partial' || lead.status === 'maybe' || lead.status === 'proposal_draft' ? (
        <Button label={lead.status === 'proposal_draft' ? 'Finish the price' : 'Send a price'} onPress={() => router.push(`/proposal-builder/${lead.id}`)} />
      ) : null}
      {lead.proposalId && lead.status === 'proposal_submitted' ? (
        <Button label="View or withdraw your price" variant="secondary" onPress={() => router.push(`/proposal/${lead.proposalId}`)} />
      ) : null}
      {lead.contactReleased ? (
        <Card>
          <Text style={styles.heading}>Customer contact</Text>
          <Text selectable style={styles.line}>{lead.customerName}</Text>
          <Text selectable style={styles.line}>{lead.customerPhone}</Text>
          <Text selectable style={styles.line}>{lead.customerEmail}</Text>
        </Card>
      ) : (
        <Text style={styles.muted}>Their phone and email stay hidden until they pick you.</Text>
      )}
      <Button
        label="Ask a question"
        variant="secondary"
        onPress={() => {
          const chatId = openChat({ box: 'provider', requestId: request.id, providerId: 'me' });
          if (!chatId) {
            setError('There is no chat for this request yet.');
            return;
          }
          router.push(`/chat/${chatId}`);
        }}
      />
    </Screen>
  );
}

function ViewTags({ lead }: { lead: { quality: { phoneVerified: boolean; completeness: string; dateConfirmed: boolean; budgetProvided: boolean } } }) {
  return (
    <Card>
      <Text style={styles.heading}>About this customer</Text>
      <Badge label={lead.quality.phoneVerified ? 'Phone checked' : 'Phone not checked'} tone={lead.quality.phoneVerified ? 'good' : 'warn'} />
      {lead.quality.dateConfirmed ? <Badge label="Date is set" tone="good" /> : null}
      {lead.quality.budgetProvided ? <Badge label="They wrote a budget" tone="good" /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  line: { fontSize: 15, lineHeight: 22, color: palette.ink },
  body: { fontSize: 15, lineHeight: 22, color: palette.ink },
  muted: { fontSize: 13, lineHeight: 19, color: palette.muted },
  heading: { fontSize: 16, fontWeight: '700', color: palette.ink },
  hero: { height: 180, borderRadius: 18, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
});
