import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { ChipGroup, ChipSingle } from '@/components/Chip';
import { Disclaimer } from '@/components/Disclaimer';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { interpretRequest } from '@/data/ai';
import { toggleIn } from '@/data/format';
import { CUISINES, DIETARY, EVENT_TYPES, NEEDS, SERVICE_PREFS, SERVING_STYLES } from '@/data/mock';
import type { QuoteDraft } from '@/data/types';
import { useApp } from '@/state/store';

const STEPS = ['Assist', 'Event', 'Needs', 'Food', 'Service', 'Budget', 'Notes', 'Review'];

export default function QuoteWizard() {
  const app = useApp();
  const [draft, setDraft] = useState<QuoteDraft>(app.quoteDraft);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const patch = (partial: Partial<QuoteDraft>) => {
    const next = { ...draft, ...partial };
    setDraft(next);
    app.saveDraft(next);
  };

  const go = (step: number) => {
    const problem = validate(draft, draft.step);
    if (problem && step > draft.step) {
      setError(problem);
      return;
    }
    setError('');
    patch({ step });
  };

  const interpret = () => {
    const credit = app.spendAi();
    if (!credit.ok) {
      setError(credit.reason);
      return;
    }
    const next = interpretRequest(draft.rawText, draft);
    setDraft(next);
    app.saveDraft(next);
    setError('');
  };

  const submit = () => {
    if (!app.session.signedIn || !app.session.phoneVerified) {
      app.saveDraft(draft);
      router.push('/auth?next=quote');
      return;
    }
    const result = app.submitQuote(draft);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setDone(result.requestId ?? '');
  };

  if (done) {
    return (
      <Screen header={<Header title="Request sent" />}>
        <Notice tone="success" title="Providers are being invited" body="Eligible providers can confirm availability and send an indicative proposal. You can compare them from Requests." />
        <Button label="View request" onPress={() => router.replace(`/request/${done}`)} />
        <Button label="Back to discover" variant="secondary" onPress={() => router.replace('/customer')} />
      </Screen>
    );
  }

  return (
    <Screen
      header={<Header title="Request proposals" subtitle={`${draft.step + 1} of ${STEPS.length} · ${STEPS[draft.step]}`} back />}
      footer={
        <Button
          label={draft.step === STEPS.length - 1 ? (app.session.phoneVerified ? 'Send request' : 'Continue to sign in') : 'Continue'}
          onPress={() => (draft.step === STEPS.length - 1 ? submit() : go(draft.step + 1))}
        />
      }>
      {error ? <Notice tone="error" body={error} /> : null}
      {draft.step === 0 ? (
        <>
          <Text style={styles.lead}>Describe the event in your own words, or skip this and fill the steps yourself.</Text>
          <Input label="Your description" value={draft.rawText} onChangeText={(rawText) => patch({ rawText })} multiline placeholder="Surinamese food for a birthday in Utrecht, about 80 people, halal, two servers, around €35 per person." />
          <Button label="Fill the form from this text" variant="secondary" onPress={interpret} />
          <Button label="Skip and fill it in" variant="ghost" onPress={() => go(1)} />
          {draft.missing.length ? <Notice tone="info" title="Still needed" body={draft.missing.join('\n')} /> : null}
        </>
      ) : null}
      {draft.step === 1 ? (
        <>
          <Text style={styles.label}>Event type</Text>
          <ChipSingle options={EVENT_TYPES} value={draft.eventType} onChange={(eventType) => patch({ eventType })} />
          <Input label="Date" value={draft.date} onChangeText={(date) => patch({ date })} placeholder="2026-11-14" />
          <Input label="Start time" value={draft.startTime} onChangeText={(startTime) => patch({ startTime })} placeholder="16:00" />
          <Input label="End time (optional)" value={draft.endTime} onChangeText={(endTime) => patch({ endTime })} placeholder="21:00" />
          <ChipSingle options={['Fixed date', 'Date is flexible']} value={draft.flexibleDate ? 'Date is flexible' : 'Fixed date'} onChange={(value) => patch({ flexibleDate: value === 'Date is flexible' })} />
          <Input label="City" value={draft.city} onChangeText={(city) => patch({ city })} placeholder="Utrecht" />
          <Input label="Postcode" value={draft.postcode} onChangeText={(postcode) => patch({ postcode })} placeholder="3511" />
          <Text style={styles.label}>Setting</Text>
          <ChipSingle options={['indoor', 'outdoor', 'both']} value={draft.setting} onChange={(setting) => patch({ setting: setting as QuoteDraft['setting'] })} />
          <Input label="Guest count" value={draft.guests} onChangeText={(guests) => patch({ guests })} keyboardType="number-pad" />
          <Input label="Adults (optional)" value={draft.adults} onChangeText={(adults) => patch({ adults })} keyboardType="number-pad" />
          <Input label="Children (optional)" value={draft.children} onChangeText={(children) => patch({ children })} keyboardType="number-pad" />
        </>
      ) : null}
      {draft.step === 2 ? (
        <>
          <Text style={styles.lead}>Select every part of the event. A provider may cover all of it, or only one part.</Text>
          <ChipGroup options={NEEDS} selected={draft.needs} onToggle={(item) => patch({ needs: toggleIn(draft.needs, item) })} />
        </>
      ) : null}
      {draft.step === 3 ? (
        <>
          <Text style={styles.label}>Cuisines</Text>
          <ChipGroup options={CUISINES} selected={draft.cuisines} onToggle={(item) => patch({ cuisines: toggleIn(draft.cuisines, item) })} />
          <Input label="Dishes or menus" value={draft.dishes} onChangeText={(dishes) => patch({ dishes })} placeholder="Nasi, bami, chicken" />
          <Text style={styles.label}>Serving style</Text>
          <ChipSingle options={SERVING_STYLES} value={draft.servingStyle} onChange={(servingStyle) => patch({ servingStyle })} />
          <Text style={styles.label}>Dietary</Text>
          <ChipGroup options={DIETARY.filter((item) => item !== 'Halal')} selected={draft.dietary} onToggle={(item) => patch({ dietary: toggleIn(draft.dietary, item) })} />
          <ChipSingle options={['No halal preference', 'Halal preferred']} value={draft.halal ? 'Halal preferred' : 'No halal preference'} onChange={(value) => patch({ halal: value === 'Halal preferred', halalConfirmed: value !== 'Halal preferred' })} />
          {draft.halal ? <ChipSingle options={['Not confirmed', 'I confirm halal is required']} value={draft.halalConfirmed ? 'I confirm halal is required' : 'Not confirmed'} onChange={(value) => patch({ halalConfirmed: value.startsWith('I confirm') })} /> : null}
          <Input label="Allergies" value={draft.allergies} onChangeText={(allergies) => patch({ allergies })} multiline placeholder="Name them, or write None. We will not guess." />
        </>
      ) : null}
      {draft.step === 4 ? (
        <>
          <Text style={styles.lead}>Service on the day. Leave this empty if you only need food dropped off.</Text>
          <ChipGroup options={SERVICE_PREFS} selected={draft.servicePrefs} onToggle={(item) => patch({ servicePrefs: toggleIn(draft.servicePrefs, item) })} />
        </>
      ) : null}
      {draft.step === 5 ? (
        <>
          <Disclaimer />
          <Text style={styles.label}>Budget</Text>
          <ChipSingle options={['Per person', 'Total', 'Open to proposals']} value={draft.budgetType === 'total' ? 'Total' : draft.budgetType === 'open' ? 'Open to proposals' : 'Per person'} onChange={(value) => patch({ budgetType: value === 'Total' ? 'total' : value === 'Open to proposals' ? 'open' : 'per_person' })} />
          {draft.budgetType !== 'open' ? <Input label="Amount in euro" value={draft.budget} onChangeText={(budget) => patch({ budget })} keyboardType="decimal-pad" hint="Optional, but it helps matching." /> : null}
        </>
      ) : null}
      {draft.step === 6 ? <Input label="Anything else" value={draft.notes} onChangeText={(notes) => patch({ notes })} multiline placeholder="Venue access, timing, or a dish you want." /> : null}
      {draft.step === 7 ? (
        <>
          <Text style={styles.lead}>{draft.eventType || 'Event'} · {draft.city || 'City missing'} · {draft.guests || '?'} guests · {draft.date || 'Date missing'}</Text>
          <Text style={styles.meta}>Needs: {draft.needs.join(', ') || 'None selected'}</Text>
          <Text style={styles.meta}>Cuisines: {draft.cuisines.join(', ') || 'None'}</Text>
          <Text style={styles.meta}>Allergies: {draft.allergies || 'Missing'}</Text>
          <Text style={styles.meta}>Budget: {draft.budgetType === 'open' ? 'Open' : draft.budget || 'Not set'}</Text>
          {draft.missing.length ? <Notice tone="warning" title="Check these" body={draft.missing.join('\n')} /> : null}
          <Disclaimer />
          <ChipSingle options={['I understand these are indicative proposals']} value={draft.understood ? 'I understand these are indicative proposals' : ''} onChange={() => patch({ understood: true })} />
        </>
      ) : null}
      {draft.step > 0 ? <Button label="Back" variant="ghost" onPress={() => patch({ step: draft.step - 1 })} /> : null}
    </Screen>
  );
}

function validate(draft: QuoteDraft, step: number) {
  if (step === 1) {
    if (!draft.eventType) return 'Choose an event type.';
    if (!draft.date) return 'Add the event date.';
    if (!draft.city && !draft.postcode) return 'Add a city or postcode.';
    if (!draft.guests) return 'Add the guest count.';
  }
  if (step === 2 && draft.needs.length === 0) return 'Select at least one catering need.';
  if (step === 3 && !draft.allergies.trim()) return 'Add allergy notes, or write None.';
  if (step === 5 && draft.budgetType !== 'open' && draft.budget && Number.isNaN(Number(draft.budget.replace(',', '.')))) return 'Enter the budget as a number.';
  return '';
}

const styles = StyleSheet.create({
  lead: { fontSize: 16, lineHeight: 22, color: palette.ink },
  label: { fontSize: 13, fontWeight: '600', color: palette.ink },
  meta: { fontSize: 14, lineHeight: 20, color: palette.muted },
});
