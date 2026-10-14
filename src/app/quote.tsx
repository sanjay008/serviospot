import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ChipSingle } from '@/components/Chip';
import { DateField } from '@/components/DateField';
import { Disclaimer } from '@/components/Disclaimer';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { emptyAnswers } from '@/data/mock';
import type { QuoteDraft, RequestAnswers, YesNo } from '@/data/types';
import { useLoginGate } from '@/hooks/use-login-gate';
import { useApp } from '@/state/store';

const STEPS = ['Event', 'Cuisine & dishes', 'Staff & logistics', 'Extra wishes', 'Review'];

export default function QuoteWizard() {
  const app = useApp();
  const { requireLogin, gate } = useLoginGate();
  const [draft, setDraft] = useState<QuoteDraft>({ ...app.quoteDraft, answers: app.quoteDraft.answers ?? emptyAnswers() });
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const answers = draft.answers;
  const animal = answers.vegetarian !== 'yes';

  const patch = (partial: Partial<QuoteDraft>, nextAnswers?: Partial<RequestAnswers>) => {
    const next = { ...draft, ...partial, answers: { ...answers, ...nextAnswers } };
    setDraft(next);
    void app.saveDraft(next);
  };

  const go = async (step: number) => {
    const problem = step > draft.step ? validate(draft, draft.step) : '';
    if (problem) {
      setError(problem);
      return;
    }
    const next = { ...draft, step };
    setDraft(next);
    const result = await app.saveDraft(next);
    setError(result.ok ? '' : result.reason);
  };

  const submit = async () => {
    const problem = validate(draft, 3);
    if (problem) {
      setError(problem);
      return;
    }
    if (!app.session.signedIn) {
      void app.saveDraft(draft);
      requireLogin('/quote');
      return;
    }
    setError('');
    const result = await app.submitQuote(draft);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setDone(result.requestId || 'sent');
  };

  if (done) {
    return (
      <Screen header={<Header title="Request sent" />}>
        <Notice tone="success" title="Providers are being invited" body="Eligible providers can confirm availability and send an indicative proposal. You can compare them from Requests." />
        <Button label={done === 'sent' ? 'View requests' : 'View request'} onPress={() => router.replace(done === 'sent' ? '/customer/requests' : `/request/${done}`)} />
        <Button label="Back to discover" variant="secondary" onPress={() => router.replace('/customer')} />
      </Screen>
    );
  }

  return (
    <Screen
      header={<Header title="Request proposals" subtitle={`Step ${draft.step + 1} of ${STEPS.length}`} back />}
      footer={
        <Button
          label={draft.step === STEPS.length - 1 ? (app.session.signedIn ? 'Send request' : 'Log in to send') : 'Next'}
          onPress={() => (draft.step === STEPS.length - 1 ? submit() : go(draft.step + 1))}
        />
      }>
      {error ? <Notice tone="error" body={error} /> : null}
      {gate}
      <Text style={styles.step}>{STEPS[draft.step]}</Text>
      {draft.step === 0 ? (
        <>
          <Input label="Number of guests" value={draft.guests} onChangeText={(guests) => patch({ guests })} keyboardType="number-pad" />
          <DateField label="Event date" value={draft.date} onChange={(date) => patch({ date })} />
          <Input label="Event city" value={draft.city} onChangeText={(city) => patch({ city })} />
          <Input label="Postcode" value={draft.postcode} onChangeText={(postcode) => patch({ postcode })} />
          <Text style={styles.label}>Event location</Text>
          <ChipSingle options={['Home', 'Venue / hall']} value={answers.venueKind === 'home' ? 'Home' : answers.venueKind === 'venue' ? 'Venue / hall' : ''} onChange={(value) => patch({}, { venueKind: value === 'Home' ? 'home' : 'venue' })} />
          {answers.venueKind === 'venue' ? <Input label="Venue name" value={answers.venueName} onChangeText={(venueName) => patch({}, { venueName })} /> : null}
          <Text style={styles.label}>Indoor / outdoor</Text>
          <ChipSingle options={['Indoor', 'Outdoor', 'Both']} value={labelSetting(draft.setting)} onChange={(value) => patch({ setting: value.toLowerCase() as QuoteDraft['setting'] })} />
          <Input label="Occasion" value={answers.occasion} onChangeText={(occasion) => patch({ eventType: occasion }, { occasion })} />
          <Input label="Access, kitchen facilities, power and water" value={answers.accessNotes} onChangeText={(accessNotes) => patch({}, { accessNotes })} multiline />
        </>
      ) : null}
      {draft.step === 1 ? (
        <>
          <Input label="Cuisine" value={answers.cuisine} onChangeText={(cuisine) => patch({}, { cuisine })} />
          <Input label="Cuisine style" value={answers.cuisineStyle} onChangeText={(cuisineStyle) => patch({}, { cuisineStyle })} />
          <Input
            label="Vegetarian"
            value={answers.vegetarian}
            onChangeText={(vegetarian) => patch({}, vegetarian.trim().toLowerCase() === 'yes' ? { vegetarian, chicken: '0', pork: '0', beef: '0', fish: '0', shrimp: '0' } : { vegetarian })}
          />
          <Count label="Number of base dishes" hint="For example nasi, bami, roti or rice. A count only." value={answers.base} onChange={(base) => patch({}, { base })} />
          {animal ? <Count label="Number of chicken dishes" value={answers.chicken} onChange={(chicken) => patch({}, { chicken })} /> : null}
          {animal ? <Count label="Number of pork dishes" value={answers.pork} onChange={(pork) => patch({}, { pork })} /> : null}
          {animal ? <Count label="Number of beef dishes" value={answers.beef} onChange={(beef) => patch({}, { beef })} /> : null}
          {animal ? <Count label="Number of fish dishes" value={answers.fish} onChange={(fish) => patch({}, { fish })} /> : null}
          {animal ? <Count label="Number of shrimp dishes" value={answers.shrimp} onChange={(shrimp) => patch({}, { shrimp })} /> : null}
          <Count label="Number of vegetable dishes" value={answers.vegetables} onChange={(vegetables) => patch({}, { vegetables })} />
          <Count label="Number of extra vegetarian dishes" hint="Do not count a dish that is already in another category." value={answers.extraVegetarian} onChange={(extraVegetarian) => patch({}, { extraVegetarian })} />
          <Count label="Number of starters" value={answers.starters} onChange={(starters) => patch({}, { starters })} />
          <Count label="Number of desserts" value={answers.desserts} onChange={(desserts) => patch({}, { desserts })} />
          <Input label="Serving format" value={answers.servingFormat} onChangeText={(servingFormat) => patch({}, { servingFormat })} />
        </>
      ) : null}
      {draft.step === 2 ? (
        <>
          <YesNo label="Staffed service" value={answers.staffed} onChange={(staffed) => patch({}, { staffed })} />
          <YesNo label="Warming trays requested" value={answers.warming} onChange={(warming) => patch({}, { warming })} />
          <Input label="Tableware" value={answers.tableware} onChangeText={(tableware) => patch({}, { tableware })} />
          <YesNo label="Plates requested" value={answers.plates} onChange={(plates) => patch({}, { plates })} />
          <YesNo label="Cutlery requested" value={answers.cutlery} onChange={(cutlery) => patch({}, { cutlery })} />
          <YesNo label="Glasses requested" value={answers.glasses} onChange={(glasses) => patch({}, { glasses })} />
          {answers.staffed === 'yes' ? (
            <>
              <Input label="Catering start time" value={answers.cateringStart} onChangeText={(cateringStart) => patch({}, { cateringStart })} placeholder="19:00" />
              <DateField label="Catering end date" value={answers.cateringEndDate} minimum={draft.date} onChange={(cateringEndDate) => patch({}, { cateringEndDate })} />
              <Input label="Catering end time" value={answers.cateringEnd} onChangeText={(cateringEnd) => patch({}, { cateringEnd })} placeholder="23:00" hint="Setup and teardown sit outside these times." />
              <YesNo label="Decoration / setup" value={answers.decoration} onChange={(decoration) => patch({}, { decoration })} />
              <YesNo label="Buffet setup" value={answers.buffetSetup} onChange={(buffetSetup) => patch({}, { buffetSetup })} />
              <YesNo label="Serving" value={answers.serving} onChange={(serving) => patch({}, { serving })} />
              <YesNo label="Drinks service" value={answers.drinksService} onChange={(drinksService) => patch({}, { drinksService })} />
              <YesNo label="Dishwashing" value={answers.dishwashing} onChange={(dishwashing) => patch({}, { dishwashing })} />
              <YesNo label="Cleanup / teardown" value={answers.cleanup} onChange={(cleanup) => patch({}, { cleanup })} />
            </>
          ) : null}
          {answers.staffed === 'no' ? (
            <>
              <Text style={styles.label}>Delivery or pickup</Text>
              <ChipSingle options={['Delivery', 'Pickup']} value={answers.handoff === 'delivery' ? 'Delivery' : answers.handoff === 'pickup' ? 'Pickup' : ''} onChange={(value) => patch({}, { handoff: value === 'Delivery' ? 'delivery' : 'pickup' })} />
              <Input label="Time" value={answers.handoffTime} onChangeText={(handoffTime) => patch({}, { handoffTime })} placeholder="18:00" />
            </>
          ) : null}
        </>
      ) : null}
      {draft.step === 3 ? (
        <>
          <YesNo label="Drinks requested" value={answers.drinks} onChange={(drinks) => patch({}, { drinks })} />
          {answers.drinks === 'yes' ? <Input label="Drink type and quantity" value={answers.drinkDetails} onChangeText={(drinkDetails) => patch({}, { drinkDetails })} /> : null}
          <YesNo label="Halal required" value={answers.halal} onChange={(halal) => patch({ halal: halal === 'yes' }, { halal })} />
          <Input label="Allergies and cross-contact requirements" value={draft.allergies} onChangeText={(allergies) => patch({ allergies })} multiline />
          <Input label="Forbidden ingredients / proteins" value={answers.forbidden} onChangeText={(forbidden) => patch({}, { forbidden })} hint="A dish count of 0 means not requested. List ingredients only when they are forbidden." multiline />
          <YesNo label="Vegan options required" value={answers.vegan} onChange={(vegan) => patch({}, { vegan })} />
          <Input label="Other dietary needs" value={answers.otherDiet} onChangeText={(otherDiet) => patch({}, { otherDiet })} />
          <Input label="Total budget (€ incl. VAT), 0 = unknown" value={draft.budgetTotal} onChangeText={(budgetTotal) => patch({ budgetTotal })} keyboardType="number-pad" />
          <Input label="Comments / personal wishes" value={draft.notes} onChangeText={(notes) => patch({ notes })} hint="You may name specific dishes here. Dish names are not required." multiline />
        </>
      ) : null}
      {draft.step === 4 ? (
        <>
          <Disclaimer />
          {reviewBlocks(draft).map((block) => (
            <View key={block.title} style={styles.block}>
              <Text style={styles.blockTitle}>{block.title}</Text>
              {block.rows.map((row) => (
                <Text key={row} style={styles.blockLine}>{row}</Text>
              ))}
            </View>
          ))}
        </>
      ) : null}
      {draft.step > 0 ? <Button label="Back" variant="ghost" onPress={() => go(draft.step - 1)} /> : null}
    </Screen>
  );
}

function YesNo({ label, value, onChange }: { label: string; value: YesNo; onChange: (value: YesNo) => void }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <ChipSingle options={['Yes', 'No']} value={value === 'yes' ? 'Yes' : value === 'no' ? 'No' : ''} onChange={(item) => onChange(item === 'Yes' ? 'yes' : 'no')} />
    </>
  );
}

function Count({ label, value, onChange, hint }: { label: string; value: string; onChange: (value: string) => void; hint?: string }) {
  return <Input label={label} value={value} onChangeText={onChange} keyboardType="number-pad" hint={hint} />;
}

function labelSetting(value: QuoteDraft['setting']) {
  if (value === 'indoor') return 'Indoor';
  if (value === 'outdoor') return 'Outdoor';
  if (value === 'both') return 'Both';
  return '';
}

function reviewBlocks(draft: QuoteDraft) {
  const answers = draft.answers;
  const place = answers.venueKind === 'home' ? 'Home' : answers.venueName || 'Venue';
  return [
    {
      title: 'Event',
      rows: [
        `${draft.guests || '—'} guests`,
        draft.date || 'Date missing',
        `${draft.city || 'City missing'} ${draft.postcode}`.trim(),
        `${place} · ${labelSetting(draft.setting) || 'Setting missing'}`,
        answers.occasion || 'Occasion missing',
      ],
    },
    {
      title: 'Food',
      rows: [
        answers.cuisine || 'Cuisine missing',
        answers.cuisineStyle,
        answers.vegetarian || 'Vegetarian missing',
        answers.servingFormat || 'Serving missing',
        `Base ${answers.base || '0'} · Chicken ${answers.vegetarian === 'yes' ? '0' : answers.chicken || '0'} · Pork ${answers.vegetarian === 'yes' ? '0' : answers.pork || '0'}`,
        `Beef ${answers.vegetarian === 'yes' ? '0' : answers.beef || '0'} · Fish ${answers.vegetarian === 'yes' ? '0' : answers.fish || '0'} · Shrimp ${answers.vegetarian === 'yes' ? '0' : answers.shrimp || '0'}`,
        `Vegetables ${answers.vegetables || '0'} · Extra vegetarian ${answers.extraVegetarian || '0'}`,
        `Starters ${answers.starters || '0'} · Desserts ${answers.desserts || '0'}`,
      ].filter(Boolean),
    },
    {
      title: 'Staff and extras',
      rows: [
        `Staff ${answers.staffed || 'missing'}`,
        `Warming trays ${answers.warming || 'missing'}`,
        `Tableware ${answers.tableware || 'missing'}`,
        `Drinks ${answers.drinks || 'missing'} · Halal ${answers.halal || 'missing'} · Vegan ${answers.vegan || 'missing'}`,
        `Budget €${draft.budgetTotal || '0'} incl. VAT`,
        draft.notes,
      ].filter(Boolean),
    },
  ];
}

function chosen(value: string) {
  return value === 'yes' || value === 'no';
}

function validate(draft: QuoteDraft, step: number) {
  const answers = draft.answers;
  if (step === 0) {
    if (!Number(draft.guests)) return 'Add the number of guests.';
    if (!draft.date.trim()) return 'Add the event date.';
    if (!draft.city.trim()) return 'Add the event city.';
    if (!draft.postcode.trim()) return 'Add the postcode.';
    if (!answers.venueKind) return 'Choose home or a venue.';
    if (answers.venueKind === 'venue' && !answers.venueName.trim()) return 'Add the venue name.';
    if (!draft.setting) return 'Choose indoor, outdoor or both.';
    if (!answers.occasion.trim()) return 'Add the occasion.';
  }
  if (step === 1) {
    if (!answers.cuisine.trim()) return 'Add the cuisine.';
    if (!answers.vegetarian.trim()) return 'Say whether the menu is vegetarian.';
    if (!answers.servingFormat.trim()) return 'Add the serving format.';
  }
  if (step === 2) {
    if (!chosen(answers.staffed)) return 'Say whether you want staff.';
    if (!chosen(answers.warming)) return 'Say whether you want warming trays.';
    if (!answers.tableware.trim()) return 'Add the tableware.';
    if (!chosen(answers.plates) || !chosen(answers.cutlery) || !chosen(answers.glasses)) return 'Answer plates, cutlery and glasses.';
    if (answers.staffed === 'yes' && (!answers.cateringStart || !answers.cateringEndDate || !answers.cateringEnd)) return 'Add the catering start, end date and end time.';
    if (answers.staffed === 'yes' && ![answers.decoration, answers.buffetSetup, answers.serving, answers.drinksService, answers.dishwashing, answers.cleanup].every(chosen)) return 'Answer every staff task with yes or no.';
    if (answers.staffed === 'no' && (!answers.handoff || !answers.handoffTime)) return 'Choose delivery or pickup, and a time.';
  }
  if (step === 3) {
    if (!chosen(answers.drinks)) return 'Say whether you want drinks.';
    if (answers.drinks === 'yes' && !answers.drinkDetails.trim()) return 'Add the drink type and quantity.';
    if (!chosen(answers.halal)) return 'Say whether halal is required.';
    if (!chosen(answers.vegan)) return 'Say whether vegan options are required.';
    if (draft.budgetTotal.trim() && Number.isNaN(Number(draft.budgetTotal))) return 'Enter the budget as a number, or 0 if unknown.';
  }
  return '';
}

const styles = StyleSheet.create({
  step: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: palette.ink },
  label: { marginTop: 6, fontSize: 16, lineHeight: 22, fontWeight: '700', color: palette.ink },
  block: { gap: 4, padding: 14, borderRadius: 14, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  blockTitle: { fontSize: 16, lineHeight: 22, fontWeight: '700', color: palette.ink },
  blockLine: { fontSize: 16, lineHeight: 24, color: palette.ink },
});
