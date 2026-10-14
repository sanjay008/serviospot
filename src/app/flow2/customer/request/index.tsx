import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { ChipSingle } from '@/flow2/components/Chip';
import { Field } from '@/flow2/components/Field';
import { Header } from '@/flow2/components/Header';
import { Input } from '@/flow2/components/Input';
import { Notice } from '@/flow2/components/Notice';
import { ProgressSteps } from '@/flow2/components/ProgressSteps';
import { RequestSummary } from '@/flow2/components/RequestSummary';
import { Screen } from '@/flow2/components/Screen';
import { SectionTitle } from '@/flow2/components/SectionTitle';
import { Stepper } from '@/flow2/components/Stepper';
import { palette } from '@/flow2/constants/theme';
import { b, COUNT_FIELDS, CUISINES, CUISINE_STYLES, DRINK_TYPES, FORMATS, FULFILMENTS, OCCASIONS, SETTINGS, TASKS, VENUE_TYPES, WARE, YES_NO, totalDishes } from '@/flow2/data/options';
import type { Bilingual, RequestDraft } from '@/flow2/data/types';
import { useApp } from '@/flow2/state/app';

type Option = { value: string; label: Bilingual };

function Choice({ label, options, value, onChange, hint }: { label: string; options: Option[]; value: string; onChange: (value: string) => void; hint?: string }) {
  const { t } = useApp();
  return (
    <Field label={label} hint={hint}>
      <ChipSingle options={options.map((option) => option.value)} value={value} onChange={onChange} labelOf={(v) => t(options.find((option) => option.value === v)?.label ?? v)} />
    </Field>
  );
}

export default function RequestWizardScreen() {
  const params = useLocalSearchParams<{ providerId?: string }>();
  const { t, draft, patchDraft, patchCount, patchTask, submitDraft, providers } = useApp();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const provider = providers.find((item) => item.id === params.providerId);

  useEffect(() => {
    if (params.providerId) patchDraft({ providerId: params.providerId });
  }, [params.providerId, patchDraft]);

  const steps = [t(b('Evenement', 'Event')), t(b('Keuken & gerechten', 'Cuisine & dishes')), t(b('Bediening & logistiek', 'Staff & logistics')), t(b('Extra wensen', 'Extra wishes')), t(b('Controleren', 'Review'))];

  const validate = (index: number): string => {
    if (index === 0) {
      if (draft.guests < 1) return t(b('Vul minimaal 1 gast in.', 'Enter at least 1 guest.'));
      if (!draft.date) return t(b('Kies een evenementdatum.', 'Choose an event date.'));
      if (!draft.city.trim()) return t(b('Vul een stad in.', 'Enter a city.'));
    }
    if (index === 1 && totalDishes(draft.counts) < 1) return t(b('Kies minimaal één gerecht.', 'Choose at least one dish.'));
    if (index === 4 && !draft.consent) return t(b('Bevestig de samenvatting en het indicatieve karakter.', 'Confirm the summary and the indicative nature.'));
    return '';
  };

  const next = () => {
    const message = validate(step);
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setStep((current) => Math.min(steps.length - 1, current + 1));
  };

  const back = () => {
    setError('');
    if (step === 0) {
      router.back();
      return;
    }
    setStep((current) => current - 1);
  };

  const onSubmit = () => {
    const message = validate(4);
    if (message) {
      setError(message);
      return;
    }
    const submitted = submitDraft();
    router.replace(`/flow2/customer/request/${submitted.id}`);
  };

  const animalHidden = draft.vegetarian === 'full';

  return (
    <Screen
      header={<Header title={t(b('Aanvraag', 'Request'))} subtitle={provider ? provider.name : t(b('Matching met passende aanbieders', 'Matching with suitable providers'))} back />}
      footer={
        <View style={styles.footerRow}>
          <Button label={t(b('Vorige', 'Back'))} variant="secondary" onPress={back} style={styles.footerBtn} />
          {step < steps.length - 1 ? <Button label={t(b('Volgende', 'Next'))} onPress={next} style={styles.footerBtn} /> : <Button label={t(b('Aanvraag versturen', 'Submit request'))} onPress={onSubmit} style={styles.footerBtn} />}
        </View>
      }>
      <ProgressSteps steps={steps} current={step} onPress={(index) => setStep(index)} />
      <Text style={styles.stepTitle}>{steps[step]}</Text>
      {error ? <Notice tone="error" body={error} /> : null}

      {step === 0 ? (
        <Card>
          <Stepper label={t(b('Aantal personen', 'Number of guests'))} value={draft.guests} onChange={(value) => patchDraft({ guests: value })} min={1} max={500} />
          <Input label={t(b('Evenementdatum', 'Event date'))} value={draft.date} onChangeText={(value) => patchDraft({ date: value })} placeholder="2026-11-14" autoCapitalize="none" hint={t(b('Formaat: JJJJ-MM-DD', 'Format: YYYY-MM-DD'))} />
          <Input label={t(b('Evenementstad', 'Event city'))} value={draft.city} onChangeText={(value) => patchDraft({ city: value })} autoCapitalize="words" />
          <Input label={t(b('Postcode', 'Postcode'))} value={draft.postcode} onChangeText={(value) => patchDraft({ postcode: value })} autoCapitalize="characters" />
          <Choice label={t(b('Evenementlocatie', 'Event location'))} options={VENUE_TYPES} value={draft.venueType} onChange={(value) => patchDraft({ venueType: value as RequestDraft['venueType'] })} />
          {draft.venueType === 'venue' ? <Input label={t(b('Naam venue', 'Venue name'))} value={draft.venueName} onChangeText={(value) => patchDraft({ venueName: value })} autoCapitalize="words" /> : null}
          <Choice label={t(b('Binnen / buiten', 'Indoor / outdoor'))} options={SETTINGS} value={draft.setting} onChange={(value) => patchDraft({ setting: value as RequestDraft['setting'] })} />
          <Choice label={t(b('Gelegenheid', 'Occasion'))} options={OCCASIONS} value={draft.occasion} onChange={(value) => patchDraft({ occasion: value })} />
          <Input label={t(b('Toegang, keukenruimte, stroom en water', 'Access, kitchen facilities, power and water'))} value={draft.access} onChangeText={(value) => patchDraft({ access: value })} multiline />
        </Card>
      ) : null}

      {step === 1 ? (
        <>
          <Card>
            <Choice label={t(b('Soort keuken', 'Cuisine'))} options={CUISINES} value={draft.cuisine} onChange={(value) => patchDraft({ cuisine: value })} />
            {draft.cuisine === 'surinamese' ? <Choice label={t(b('Surinaamse keukenstijl', 'Surinamese cuisine style'))} options={CUISINE_STYLES} value={draft.cuisineStyle} onChange={(value) => patchDraft({ cuisineStyle: value })} /> : null}
            <Choice
              label={t(b('Vegetarisch', 'Vegetarian'))}
              options={[{ value: 'no', label: b('Nee', 'No') }, { value: 'full', label: b('Ja, volledig vegetarisch', 'Yes, fully vegetarian') }, { value: 'mixed', label: b('Gemixt', 'Mixed') }]}
              value={draft.vegetarian}
              onChange={(value) => {
                const vegetarian = value as RequestDraft['vegetarian'];
                if (vegetarian === 'full') {
                  patchDraft({ vegetarian, counts: { ...draft.counts, chicken: 0, pork: 0, beef: 0, fish: 0, shrimp: 0 } });
                } else {
                  patchDraft({ vegetarian });
                }
              }}
            />
            <Choice label={t(b('Serveervorm', 'Serving format'))} options={FORMATS} value={draft.format} onChange={(value) => patchDraft({ format: value as RequestDraft['format'] })} />
          </Card>
          <Card style={styles.countsCard}>
            <SectionTitle title={t(b('Gerechten per categorie', 'Dishes per category'))} subtitle={`${totalDishes(draft.counts)} ${t(b('verschillende gerechten', 'distinct dishes'))}`} />
            {COUNT_FIELDS.filter((field) => !(animalHidden && field.animal)).map((field) => (
              <Stepper key={field.key} label={t(field.label)} value={draft.counts[field.key]} onChange={(value) => patchCount(field.key, value)} min={0} max={50} />
            ))}
          </Card>
          <Notice tone="info" body={t(b('Elk gerecht telt één keer in één categorie. Specifieke gerechtnamen zijn optioneel in opmerkingen.', 'Each dish counts once in one category. Specific dish names are optional in comments.'))} />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <Card>
            <Choice label={t(b('Bediening', 'Staffed service'))} options={YES_NO} value={draft.staff} onChange={(value) => patchDraft({ staff: value as RequestDraft['staff'] })} />
            <Choice label={t(b('Warmhoudbakken gewenst', 'Warming trays requested'))} options={YES_NO} value={draft.warm} onChange={(value) => patchDraft({ warm: value as RequestDraft['warm'] })} hint={t(b('Ook mogelijk met bediening.', 'Also possible with staff.'))} />
          </Card>
          {draft.staff === 'yes' ? (
            <Card>
              <Input label={t(b('Starttijd catering', 'Catering start time'))} value={draft.start} onChangeText={(value) => patchDraft({ start: value })} placeholder="19:00" autoCapitalize="none" />
              <Input label={t(b('Eindtijd catering', 'Catering end time'))} value={draft.end} onChangeText={(value) => patchDraft({ end: value })} placeholder="23:00" autoCapitalize="none" />
              <Input label={t(b('Einddatum catering', 'Catering end date'))} value={draft.endDate} onChangeText={(value) => patchDraft({ endDate: value })} autoCapitalize="none" hint={t(b('Kies een volgende einddatum bij na middernacht.', 'Choose the next day for overnight events.'))} />
            </Card>
          ) : (
            <Card>
              <Choice label={t(b('Bezorgen / ophalen', 'Delivery / pickup'))} options={FULFILMENTS} value={draft.fulfilment} onChange={(value) => patchDraft({ fulfilment: value as RequestDraft['fulfilment'] })} />
              <Input label={t(b('Bezorg- / ophaaltijd', 'Delivery / pickup time'))} value={draft.handoverTime} onChangeText={(value) => patchDraft({ handoverTime: value })} autoCapitalize="none" />
            </Card>
          )}
          <Card>
            <Choice label={t(b('Servies', 'Tableware'))} options={WARE} value={draft.ware} onChange={(value) => patchDraft({ ware: value as RequestDraft['ware'] })} />
            {draft.ware !== 'own' ? (
              <>
                <Choice label={t(b('Borden gewenst', 'Plates requested'))} options={YES_NO} value={draft.plates} onChange={(value) => patchDraft({ plates: value as RequestDraft['plates'] })} />
                <Choice label={t(b('Bestek gewenst', 'Cutlery requested'))} options={YES_NO} value={draft.cutlery} onChange={(value) => patchDraft({ cutlery: value as RequestDraft['cutlery'] })} />
                <Choice label={t(b('Glazen gewenst', 'Glasses requested'))} options={YES_NO} value={draft.glasses} onChange={(value) => patchDraft({ glasses: value as RequestDraft['glasses'] })} />
              </>
            ) : null}
          </Card>
          {draft.staff === 'yes' ? (
            <Card>
              <SectionTitle title={t(b('Werkzaamheden', 'Tasks'))} />
              {TASKS.map((task) => (
                <Choice key={task.key} label={t(task.label)} options={YES_NO} value={draft.tasks[task.key]} onChange={(value) => patchTask(task.key, value as 'no' | 'yes')} />
              ))}
            </Card>
          ) : null}
        </>
      ) : null}

      {step === 3 ? (
        <>
          <Card>
            <Choice label={t(b('Drank gewenst', 'Drinks requested'))} options={YES_NO} value={draft.drinks} onChange={(value) => patchDraft({ drinks: value as RequestDraft['drinks'] })} />
            {draft.drinks === 'yes' ? <Choice label={t(b('Soort drank', 'Drink type'))} options={DRINK_TYPES} value={draft.drinkType} onChange={(value) => patchDraft({ drinkType: value as RequestDraft['drinkType'] })} /> : null}
            {draft.drinks === 'yes' ? <Input label={t(b('Drankhoeveelheid / pakketwens', 'Drink quantity / package'))} value={draft.drinkQuantity} onChangeText={(value) => patchDraft({ drinkQuantity: value })} /> : null}
          </Card>
          <Card>
            <Choice label={t(b('Halal vereist', 'Halal required'))} options={YES_NO} value={draft.halal} onChange={(value) => patchDraft({ halal: value as RequestDraft['halal'] })} />
            <Choice label={t(b('Veganistische opties vereist', 'Vegan options required'))} options={YES_NO} value={draft.vegan} onChange={(value) => patchDraft({ vegan: value as RequestDraft['vegan'] })} />
            <Input label={t(b('Allergieën en kruisbesmettingseisen', 'Allergies and cross-contact requirements'))} value={draft.allergies} onChangeText={(value) => patchDraft({ allergies: value })} multiline />
            <Input label={t(b('Verboden ingrediënten / eiwitten', 'Forbidden ingredients / proteins'))} value={draft.forbidden} onChangeText={(value) => patchDraft({ forbidden: value })} multiline />
            <Input label={t(b('Overige dieetwensen', 'Other dietary needs'))} value={draft.dietNotes} onChangeText={(value) => patchDraft({ dietNotes: value })} multiline />
          </Card>
          <Card>
            <Input label={t(b('Budget totaal (€ incl. btw), 0 = onbekend', 'Total budget (€ incl. VAT), 0 = unknown'))} value={String(draft.budget)} onChangeText={(value) => patchDraft({ budget: Number(value.replace(/[^0-9.]/g, '')) || 0 })} keyboardType="numeric" />
            <Input label={t(b('Opmerkingen / persoonlijke wensen', 'Comments / personal wishes'))} value={draft.comments} onChangeText={(value) => patchDraft({ comments: value })} multiline hint={t(b('Hier mag je specifieke gerechten noemen.', 'You may name specific dishes here.'))} />
          </Card>
        </>
      ) : null}

      {step === 4 ? (
        <>
          <RequestSummary request={draft} />
          <Card>
            <PressableRow checked={draft.consent} onPress={() => patchDraft({ consent: !draft.consent })} label={t(b('Ik bevestig de gegevens en begrijp dat dit een indicatie is, geen boeking.', 'I confirm the details and understand this is an indication, not a booking.'))} />
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function PressableRow({ checked, onPress, label }: { checked: boolean; onPress: () => void; label: string }) {
  return (
    <View style={styles.consentRow}>
      <View style={[styles.checkbox, checked && styles.checkboxOn]}>{checked ? <Text style={styles.checkmark}>✓</Text> : null}</View>
      <Text style={styles.consentText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footerRow: { flexDirection: 'row', gap: 10 },
  footerBtn: { flex: 1 },
  stepTitle: { fontSize: 20, fontWeight: '700', color: palette.ink },
  countsCard: { paddingVertical: 10 },
  consentRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: palette.line, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface },
  checkboxOn: { backgroundColor: palette.accent, borderColor: palette.accent },
  checkmark: { color: '#fff', fontSize: 15, fontWeight: '800', lineHeight: 18 },
  consentText: { flex: 1, fontSize: 14, lineHeight: 20, color: palette.ink },
});
