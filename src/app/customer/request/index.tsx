import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { API_ENABLED, useGetRequestDetailsQuery, useSaveRequestDraftMutation, useSubmitRequestMutation, useUpdateRequestMutation, type RequestBody } from '@/api';
import { recordOf } from '@/api/mappers';
import type { ApiRecord } from '@/api/types';
import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { DateField } from '@/flow2/components/DateField';
import { Header } from '@/flow2/components/Header';
import { Input } from '@/flow2/components/Input';
import { Notice } from '@/flow2/components/Notice';
import { ProgressSteps } from '@/flow2/components/ProgressSteps';
import { RequestSummary } from '@/flow2/components/RequestSummary';
import { Screen } from '@/flow2/components/Screen';
import { SectionTitle } from '@/flow2/components/SectionTitle';
import { SelectField } from '@/flow2/components/SelectField';
import { Stepper } from '@/flow2/components/Stepper';
import { palette } from '@/flow2/constants/theme';
import { COUNT_FIELDS, CUISINES, CUISINE_STYLES, DRINK_TYPES, FORMATS, FULFILMENTS, OCCASIONS, SETTINGS, TASKS, VENUE_TYPES, WARE, YES_NO, b, emptyCounts, totalDishes } from '@/flow2/data/options';
import type { Bilingual, DishCounts, RequestDraft } from '@/flow2/data/types';
import { useApp } from '@/flow2/state/app';
import { leading, useType } from '@/hooks/use-type';
import { useApp as useSession } from '@/state/store';

type Option = { value: string; label: Bilingual };

function Choice({
  label,
  options,
  value,
  onChange,
  hint,
  placeholder,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
}) {
  const { t } = useApp();
  return (
    <SelectField
      label={label}
      value={value}
      hint={hint}
      placeholder={placeholder ?? t(b('Selecteer…', 'Select…'))}
      options={options.map((option) => ({ value: option.value, label: t(option.label) }))}
      onChange={onChange}
    />
  );
}

export default function RequestWizardScreen() {
  const params = useLocalSearchParams<{ providerId?: string; providerName?: string; fresh?: string; requestId?: string }>();
  const editing = Boolean(params.requestId);
  const { t, draft, patchDraft, patchCount, patchTask, resetDraft, providers } = useApp();
  const { session } = useSession();
  const [saveRequestDraft, saveState] = useSaveRequestDraftMutation();
  const [submitRequest, submitState] = useSubmitRequestMutation();
  const [updateRequest, updateState] = useUpdateRequestMutation();
  const detailsQuery = useGetRequestDetailsQuery(params.requestId ?? '', { skip: !params.requestId });
  const loadedRequestId = useRef('');
  const [step, setStep] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const [draftId, setDraftId] = useState<string | number | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const frame = requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
    return () => cancelAnimationFrame(frame);
  }, [step]);

  const provider = providers.find((item) => item.id === params.providerId);

  useEffect(() => {
    if (params.requestId) return;
    resetDraft();
    setDraftId(null);
    setStep(0);
    if (params.providerId) patchDraft({ providerId: params.providerId });
  }, [params.providerId, params.fresh, params.requestId, patchDraft, resetDraft]);

  useEffect(() => {
    const record = recordOf(detailsQuery.data, 'request');
    if (!params.requestId || !record || loadedRequestId.current === params.requestId) return;
    loadedRequestId.current = params.requestId;
    resetDraft();
    patchDraft(draftPatchFromRequest(record));
    setStep(0);
  }, [detailsQuery.data, params.requestId, patchDraft, resetDraft]);

  const steps = [t(b('Event', 'Event')), t(b('Cuisine', 'Cuisine')), t(b('Staff', 'Staff')), t(b('Extras', 'Extras')), t(b('Review', 'Review'))];
  const stepTitles = [
    t(b('Evenement', 'Event details')),
    t(b('Keuken & gerechten', 'Cuisine & dishes')),
    t(b('Bediening & logistiek', 'Staff & logistics')),
    t(b('Extra wensen', 'Extra wishes')),
    t(b('Controleren', 'Review & submit')),
  ];
  const stepSubtitles = [
    t(b('Vertel waar en wanneer het evenement plaatsvindt.', 'Tell us where and when the event takes place.')),
    t(b('Kies keuken, dieet en gerechten.', 'Choose cuisine, diet and dishes.')),
    t(b('Geef bediening, tijden en servies door.', 'Share staffing, timing and tableware.')),
    t(b('Drank, dieetwensen en budget.', 'Drinks, dietary needs and budget.')),
    t(b('Controleer alles voordat je verstuurt.', 'Check everything before you send.')),
  ];

  const filled = (value: string) => value.trim() !== '';
  const requestBody = (apiStep: number) => {
    const services = Object.entries(draft.tasks).filter(([, value]) => value === 'yes').map(([key]) => key);
    const cuisines = [draft.cuisine, draft.cuisine === 'surinamese' ? draft.cuisineStyle : ''].filter(filled);
    const dietary = [
      filled(draft.vegetarian) ? `vegetarian:${draft.vegetarian}` : '',
      draft.halal === 'yes' ? 'halal' : '',
      draft.vegan === 'yes' ? 'vegan' : '',
      draft.dietNotes,
    ].filter(filled);
    const providerId = params.providerId || draft.providerId;
    return {
      step: apiStep,
      ...(draftId != null ? { draft_id: draftId } : {}),
      ...(providerId ? { provider_id: providerId } : {}),
      ...(filled(draft.occasion) || filled(draft.eventName) ? { event_type: draft.occasion || draft.eventName } : {}),
      ...(filled(draft.date) ? { event_date: draft.date } : {}),
      ...(filled(draft.start) ? { start_time: draft.start } : {}),
      ...(filled(draft.end) ? { end_time: draft.end } : {}),
      ...(filled(draft.city) ? { city: draft.city } : {}),
      ...(filled(draft.postcode) ? { postcode: draft.postcode } : {}),
      ...(draft.venueType === 'venue' && filled(draft.venueName) ? { location: draft.venueName } : {}),
      ...(filled(draft.setting) ? { indoor_outdoor: draft.setting } : {}),
      guest_count: draft.guests,
      needs: ['food'],
      ...(cuisines.length ? { cuisines } : {}),
      ...(dietary.length ? { dietary } : {}),
      ...(services.length ? { services } : {}),
      ...(draft.budget > 0 ? { budget_total_cents: Math.round(draft.budget * 100) } : {}),
      ...([draft.comments, draft.access, draft.allergies && `Allergies: ${draft.allergies}`, draft.forbidden && `Avoid: ${draft.forbidden}`].filter(Boolean).join('\n')
        ? { description: [draft.comments, draft.access, draft.allergies && `Allergies: ${draft.allergies}`, draft.forbidden && `Avoid: ${draft.forbidden}`].filter(Boolean).join('\n') }
        : {}),
      details: {
        ...(filled(draft.venueType) ? { venue_type: draft.venueType } : {}),
        ...(filled(draft.occasion) ? { occasion: draft.occasion } : {}),
        ...(draft.cuisine === 'surinamese' && filled(draft.cuisineStyle) ? { cuisine_style: draft.cuisineStyle } : {}),
        counts: draft.counts,
        ...(filled(draft.format) ? { serving_format: draft.format } : {}),
        ...(filled(draft.staff) ? { staff: draft.staff } : {}),
        ...(filled(draft.warm) ? { warming: draft.warm } : {}),
        ...(filled(draft.fulfilment) ? { fulfilment: draft.fulfilment } : {}),
        ...(filled(draft.handoverTime) ? { handover_time: draft.handoverTime } : {}),
        ...(filled(draft.ware) ? { tableware: draft.ware } : {}),
        ...(filled(draft.plates) ? { plates: draft.plates } : {}),
        ...(filled(draft.cutlery) ? { cutlery: draft.cutlery } : {}),
        ...(filled(draft.glasses) ? { glasses: draft.glasses } : {}),
        ...(filled(draft.endDate) ? { end_date: draft.endDate } : {}),
        ...(filled(draft.drinks) ? { drinks: draft.drinks } : {}),
        ...(filled(draft.drinkType) ? { drink_type: draft.drinkType } : {}),
        ...(filled(draft.drinkQuantity) ? { drink_quantity: draft.drinkQuantity } : {}),
        ...(filled(draft.halal) ? { halal: draft.halal } : {}),
        ...(filled(draft.vegan) ? { vegan: draft.vegan } : {}),
        ...(filled(draft.dietNotes) ? { diet_notes: draft.dietNotes } : {}),
      },
    };
  };

  const failureMessage = (failure: unknown, fallback: string) =>
    failure && typeof failure === 'object' && 'message' in failure && typeof (failure as { message: unknown }).message === 'string'
      ? (failure as { message: string }).message
      : fallback;

  const next = async () => {
    setError('');
    if (!API_ENABLED || !session.signedIn || session.mode !== 'customer') {
      setError(t(b('Log in as a customer and connect to the API before continuing.', 'Log in as a customer and connect to the API before continuing.')));
      return;
    }
    const apiStep = step + 1;
    if (editing) {
      setStep(Math.min(steps.length - 1, apiStep));
      return;
    }
    try {
      const reply = await saveRequestDraft(requestBody(apiStep)).unwrap();
      if (reply.draft_id != null && (typeof reply.draft_id === 'string' || typeof reply.draft_id === 'number')) setDraftId(reply.draft_id);
      const completed = typeof reply.step_completed === 'number' ? reply.step_completed : null;
      if (completed === apiStep) {
        setStep(Math.min(steps.length - 1, apiStep));
        return;
      }
      const nextStep = typeof reply.next_step === 'number' ? reply.next_step : null;
      if (nextStep != null && nextStep >= 1 && nextStep <= steps.length) setStep(nextStep - 1);
      setError(t(b('Deze stap is nog niet afgerond.', 'This step is not complete yet.')));
    } catch (failure) {
      setError(failureMessage(failure, t(b('Deze stap kon niet worden opgeslagen. Probeer het opnieuw.', 'This step could not be saved. Please try again.'))));
    }
  };

  const back = () => {
    setError('');
    if (step === 0) {
      router.back();
      return;
    }
    setStep((current) => current - 1);
  };

  const onSubmit = async () => {
    setError('');
    if (!draft.consent) {
      setError(t(b('Bevestig de gegevens voordat je verstuurt.', 'Confirm the details before you submit.')));
      return;
    }
    if (editing && params.requestId) {
      const { step: _step, draft_id: _draftId, ...fields } = requestBody(5);
      try {
        await updateRequest({ ...fields, request_id: params.requestId } as RequestBody & { request_id: string }).unwrap();
        router.replace(`/customer/request/${params.requestId}` as never);
      } catch (failure) {
        setError(failureMessage(failure, t(b('De aanvraag kon niet worden bijgewerkt.', 'The request could not be updated.'))));
      }
      return;
    }
    if (API_ENABLED && session.signedIn && session.mode === 'customer') {
      if (draftId == null) {
        setError(t(b('Rond eerst de vorige stappen af.', 'Complete the earlier steps first.')));
        return;
      }
      try {
        const reply = await submitRequest({ draft_id: draftId, consent: true }).unwrap();
        const requestId = String(reply.request_id ?? reply.id ?? '');
        if (!requestId) {
          router.replace('/customer/(tabs)/requests' as any);
          return;
        }
        router.replace(`/customer/request/${requestId}` as any);
        return;
      } catch (failure) {
        setError(failureMessage(failure, t(b('De aanvraag kon niet worden verstuurd. Probeer het opnieuw.', 'The request could not be submitted. Please try again.'))));
        return;
      }
    }
    setError(t(b('Log in as a customer and connect to the API before submitting.', 'Log in as a customer and connect to the API before submitting.')));
  };

  const animalHidden = draft.vegetarian === 'full';

  return (
    <Screen
      scrollRef={scrollRef}
      loading={editing && detailsQuery.isLoading}
      header={<Header title={editing ? t(b('Aanvraag bijwerken', 'Update request')) : t(b('Aanvraag', 'Request'))} subtitle={editing ? t(b('Controleer elke stap en sla je wijzigingen op.', 'Check each step, then save your changes.')) : provider?.name || params.providerName || t(b('Matching met passende aanbieders', 'Matching with suitable providers'))} back />}
      footer={
        <View style={styles.footerRow}>
          <Button label={t(b('Vorige', 'Back'))} variant="secondary" onPress={back} style={styles.footerBtn} />
          {step < steps.length - 1 ? <Button label={t(b('Volgende', 'Next'))} loading={!editing && saveState.isLoading} onPress={() => void next()} style={styles.footerBtn} /> : <Button label={editing ? t(b('Aanvraag bijwerken', 'Update request')) : t(b('Aanvraag versturen', 'Submit request'))} loading={editing ? updateState.isLoading : submitState.isLoading} onPress={() => void onSubmit()} style={styles.footerBtn} />}
        </View>
      }>
      <ProgressSteps
        steps={steps}
        current={step}
        onPress={(index) => { if (editing || index < step) { setError(''); setStep(index); } }}
        title={stepTitles[step]}
        subtitle={stepSubtitles[step]}
      />
      {error ? <Notice tone="error" body={error} /> : null}

      {step === 0 ? (
        <Card>
          <Input label={t(b('Evenementnaam', 'Event name'))} value={draft.eventName} onChangeText={(value) => patchDraft({ eventName: value })} placeholder={t(b('bijv. Verjaardag van Asha', 'e.g. Asha’s birthday'))} autoCapitalize="words" />
          <Stepper label={t(b('Aantal personen', 'Number of guests'))} value={draft.guests} onChange={(value) => patchDraft({ guests: value })} min={1} max={9999} />
          <DateField
            label={t(b('Evenementdatum', 'Event date'))}
            value={draft.date}
            onChange={(value) => patchDraft({ date: value })}
            placeholder={t(b('Nog geen datum', 'No date selected'))}
          />
          <Input label={t(b('Evenementstad', 'Event city'))} value={draft.city} onChangeText={(value) => patchDraft({ city: value })} autoCapitalize="words" />
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
            <Input label={t(b('Budget totaal (€ incl. btw), 0 = onbekend', 'Total budget (€ incl. VAT), 0 = unknown'))} value={draft.budget ? String(draft.budget) : ''} onChangeText={(value) => patchDraft({ budget: Number(value.replace(/[^0-9.]/g, '')) || 0 })} keyboardType="numeric" />
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

const OCCASION_CODES = new Set(['birthday', 'wedding', 'business', 'other']);

function recordText(record: ApiRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' || typeof value === 'number') return String(value);
  }
  return '';
}

function yesNo(value: unknown): 'yes' | 'no' {
  return value === 'yes' ? 'yes' : 'no';
}

function draftPatchFromRequest(record: ApiRecord): Partial<RequestDraft> {
  const details = record.details && typeof record.details === 'object' && !Array.isArray(record.details) ? record.details as ApiRecord : {};
  const cuisines = Array.isArray(record.cuisines) ? record.cuisines.map(String) : [];
  const dietary = Array.isArray(record.dietary) ? record.dietary.map(String) : [];
  const services = Array.isArray(record.services) ? record.services.map(String) : [];
  const eventType = recordText(record, 'event_type');
  const occasion = recordText(details, 'occasion') || (OCCASION_CODES.has(eventType) ? eventType : '');
  const vegetarianRaw = dietary.find((item) => item.startsWith('vegetarian:'))?.split(':')[1] ?? '';
  const description = recordText(record, 'description');
  const lines = description.split('\n').filter(Boolean);
  const allergies = lines.find((line) => line.startsWith('Allergies:'))?.replace(/^Allergies:\s*/, '') ?? '';
  const forbidden = lines.find((line) => line.startsWith('Avoid:'))?.replace(/^Avoid:\s*/, '') ?? '';
  const comments = lines.filter((line) => !line.startsWith('Allergies:') && !line.startsWith('Avoid:')).join('\n');
  const counts = emptyCounts();
  const countsRaw = details.counts && typeof details.counts === 'object' ? details.counts as Record<string, unknown> : {};
  (Object.keys(counts) as (keyof DishCounts)[]).forEach((key) => {
    const value = Number(countsRaw[key]);
    if (Number.isFinite(value)) counts[key] = value;
  });
  const tasks: RequestDraft['tasks'] = { decorate: 'no', buffet: 'no', serve: 'no', bar: 'no', wash: 'no', clean: 'no' };
  (Object.keys(tasks) as (keyof RequestDraft['tasks'])[]).forEach((key) => {
    if (services.includes(key)) tasks[key] = 'yes';
  });
  const cents = Number(record.budget_total_cents);
  const setting = recordText(record, 'indoor_outdoor');
  const format = recordText(details, 'serving_format');
  const tableware = recordText(details, 'tableware');
  const drinkType = recordText(details, 'drink_type');
  const venueType = recordText(details, 'venue_type');
  return {
    eventName: occasion && eventType === occasion ? '' : eventType,
    occasion,
    guests: Number(record.guest_count) || 0,
    date: recordText(record, 'event_date'),
    city: recordText(record, 'city'),
    postcode: recordText(record, 'postcode'),
    venueName: recordText(record, 'location'),
    venueType: venueType === 'venue' || recordText(record, 'location') ? 'venue' : 'home',
    setting: setting === 'outdoor' || setting === 'both' ? setting : 'indoor',
    comments,
    allergies,
    forbidden,
    cuisine: cuisines[0] ?? '',
    cuisineStyle: recordText(details, 'cuisine_style') || cuisines[1] || '',
    vegetarian: vegetarianRaw === 'full' || vegetarianRaw === 'mixed' || vegetarianRaw === 'no' ? vegetarianRaw : 'no',
    format: format === 'plated' || format === 'bites' ? format : 'buffet',
    counts,
    staff: yesNo(details.staff),
    warm: yesNo(details.warming),
    fulfilment: recordText(details, 'fulfilment') === 'pickup' ? 'pickup' : 'delivery',
    handoverTime: recordText(details, 'handover_time'),
    ware: tableware === 'real' || tableware === 'plastic' ? tableware : 'own',
    plates: yesNo(details.plates),
    cutlery: yesNo(details.cutlery),
    glasses: yesNo(details.glasses),
    start: recordText(record, 'start_time'),
    end: recordText(record, 'end_time'),
    endDate: recordText(details, 'end_date'),
    tasks,
    drinks: yesNo(details.drinks),
    drinkType: drinkType === 'alcohol' || drinkType === 'both' ? drinkType : 'soft',
    drinkQuantity: recordText(details, 'drink_quantity'),
    halal: details.halal === 'yes' || dietary.includes('halal') ? 'yes' : 'no',
    vegan: details.vegan === 'yes' || dietary.includes('vegan') ? 'yes' : 'no',
    dietNotes: recordText(details, 'diet_notes'),
    budget: Number.isFinite(cents) ? cents / 100 : 0,
    providerId: recordText(record, 'provider_id') || undefined,
    consent: false,
  };
}

function PressableRow({ checked, onPress, label }: { checked: boolean; onPress: () => void; label: string }) {
  const type = useType();
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onPress} style={styles.consentRow}>
      <View style={[styles.checkbox, checked && styles.checkboxOn]}>{checked ? <Text style={[styles.checkmark, { fontSize: type.body, lineHeight: leading(type.body, 3) }]}>✓</Text> : null}</View>
      <Text style={[styles.consentText, { fontSize: type.secondary, lineHeight: leading(type.secondary, 6) }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  footerRow: { flexDirection: 'row', gap: 10 },
  footerBtn: { flex: 1 },
  countsCard: { paddingVertical: 10 },
  consentRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: palette.line, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface },
  checkboxOn: { backgroundColor: palette.accent, borderColor: palette.accent },
  checkmark: { color: '#fff', fontWeight: '800' },
  consentText: { flex: 1, color: palette.ink },
});
