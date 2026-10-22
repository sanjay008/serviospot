import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { ChipGroup, ChipSingle } from '@/flow2/components/Chip';
import { Field } from '@/flow2/components/Field';
import { Header } from '@/flow2/components/Header';
import { Input } from '@/flow2/components/Input';
import { Notice } from '@/flow2/components/Notice';
import { ProgressSteps } from '@/flow2/components/ProgressSteps';
import { Screen } from '@/flow2/components/Screen';
import { SectionTitle } from '@/flow2/components/SectionTitle';
import { Stepper } from '@/flow2/components/Stepper';
import { palette } from '@/flow2/constants/theme';
import { CAPABILITIES, CUISINES, CUISINE_STYLES } from '@/flow2/data/options';
import { COMPANY_LOGIN, useGetOnboardingOptionsMutation, useSaveVendorOnboardingMutation, type OnboardingOption, type VendorOnboardingOptions } from '@/api';
import { useApp } from '@/flow2/state/app';
import { useApp as useSessionApp } from '@/state/store';

const FALLBACK_ONBOARDING_OPTIONS: VendorOnboardingOptions = {
  provider_types: [
    { code: 'private', label_nl: 'Particulier', label_en: 'Private' },
    { code: 'business', label_nl: 'Bedrijf', label_en: 'Business' },
  ],
  fulfilments: [
    { code: 'delivery', label_nl: 'Bezorgen', label_en: 'Delivery' },
    { code: 'pickup', label_nl: 'Ophalen', label_en: 'Pickup' },
    { code: 'onsite', label_nl: 'Op locatie', label_en: 'On-site' },
  ],
  cuisines: CUISINES.map((item) => ({ code: item.value, label_nl: item.label.nl, label_en: item.label.en })),
  cuisine_styles: CUISINE_STYLES.map((item) => ({ code: item.value, label_nl: item.label.nl, label_en: item.label.en })),
  capabilities: CAPABILITIES.map((item) => ({ code: item.value, label_nl: item.label.nl, label_en: item.label.en })),
};

function optionsFromApi(value: unknown): VendorOnboardingOptions {
  const input = value && typeof value === 'object' ? value as Partial<VendorOnboardingOptions> : {};
  const normalize = (items: unknown) => {
    if (!Array.isArray(items)) throw new Error('The onboarding options reply is incomplete.');
    const valid = items.filter((item): item is OnboardingOption =>
      !!item && typeof item === 'object' && typeof item.code === 'string' && typeof item.label_nl === 'string' && typeof item.label_en === 'string',
    );
    return valid;
  };
  return {
    provider_types: normalize(input.provider_types),
    fulfilments: normalize(input.fulfilments),
    cuisines: normalize(input.cuisines),
    cuisine_styles: normalize(input.cuisine_styles),
    capabilities: normalize(input.capabilities),
  };
}

function apiMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  if (error && typeof error === 'object' && 'data' in error) {
    const data = error.data;
    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') return data.message;
  }
  return fallback;
}

export default function VendorOnboardingScreen() {
  const { onboarding, patchOnboarding, submitOnboarding, lang } = useApp();
  const { hydrate, session } = useSessionApp();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [errorStep, setErrorStep] = useState<number | null>(null);
  const [options, setOptions] = useState(FALLBACK_ONBOARDING_OPTIONS);
  const [optionsReady, setOptionsReady] = useState(false);
  const [getOptions] = useGetOnboardingOptionsMutation();
  const [saveVendorOnboarding, { isLoading: saving }] = useSaveVendorOnboardingMutation();

  useEffect(() => {
    if (!session.signedIn || session.mode !== 'provider') return;
    patchOnboarding({
      name: session.name,
      email: session.email,
      emailRequired: !session.email,
      phone: session.phone,
      accountCreated: true,
      emailVerified: Boolean(session.email),
      phoneVerified: Boolean(session.phone),
      profileName: session.name,
    });
  }, [session.signedIn, session.mode, session.name, session.email, session.phone, patchOnboarding]);

  useEffect(() => {
    let active = true;
    void getOptions({ company_login: COMPANY_LOGIN })
      .unwrap()
      .then((result) => {
        if (!active) return;
        setOptions(optionsFromApi(result));
        setOptionsReady(true);
      })
      .catch(() => {
        if (!active) return;
        setOptions(FALLBACK_ONBOARDING_OPTIONS);
        setOptionsReady(true);
      });
    return () => { active = false; };
  }, [getOptions]);

  const optionLabel = (items: OnboardingOption[], code: string) => {
    const item = items.find((entry) => entry.code === code);
    return item ? (lang === 'nl' ? item.label_nl : item.label_en) : code;
  };
  const steps = [
    'Contact details',
    'Provider & private address',
    'Service area & fulfilment',
    'Catering capabilities',
    'Capacity per fulfilment type',
    'Profile, PDF & photos',
    '6 months of full access',
    'Review & submit',
  ];

  const validate = (index: number): string => {
    if (index === 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(onboarding.email.trim())) return 'Enter a real email address.';
    return '';
  };

  const next = () => {
    const message = validate(step);
    if (message) {
      setError(message);
      setErrorStep(step);
      return;
    }
    setError('');
    setErrorStep(null);
    setStep((current) => Math.min(steps.length - 1, current + 1));
  };

  const back = () => {
    setError('');
    setErrorStep(null);
    setStep((current) => Math.max(0, current - 1));
  };

  const submit = async () => {
    for (let index = 0; index < steps.length; index += 1) {
      const message = validate(index);
      if (message) {
        setStep(index);
        setError(message);
        setErrorStep(index);
        return;
      }
    }
    setError('');
    setErrorStep(null);
    try {
      const saved = await saveVendorOnboarding({
        email: onboarding.email.trim().toLowerCase(),
        profile_name: onboarding.profileName.trim(),
        provider_type: onboarding.type,
        ...(onboarding.type === 'business' ? { business_name: onboarding.company.trim() } : {}),
        ...(onboarding.type === 'business' && onboarding.kvk.trim() ? { kvk: onboarding.kvk.trim() } : {}),
        street: onboarding.street.trim(),
        ...(onboarding.house.trim() ? { house_number: onboarding.house.trim() } : {}),
        postcode: onboarding.postal.trim().toUpperCase(),
        city: onboarding.city.trim(),
        delivery: onboarding.delivery,
        pickup: onboarding.pickup,
        onsite: onboarding.onsite,
        radius_km: onboarding.radius,
        cuisines: onboarding.cuisines,
        cuisine_styles: onboarding.cuisineStyles,
        capabilities: onboarding.capabilities,
        min_delivery: onboarding.minDelivery,
        max_delivery: onboarding.maxDelivery,
        min_pickup: onboarding.minPickup,
        max_pickup: onboarding.maxPickup,
        min_onsite: onboarding.minOnsite,
        max_onsite: onboarding.maxOnsite,
        lead_days: onboarding.leadDays,
        description: onboarding.description.trim(),
        from_price: onboarding.fromPrice.trim(),
        trial_consent: onboarding.trialConsent,
        terms: onboarding.terms,
      }).unwrap();
      if (Number(saved.vendor_profile_complete) !== 1) {
        setError(typeof saved.message === 'string' ? saved.message : '');
        setErrorStep(7);
        return;
      }
      if (typeof saved.email === 'string') patchOnboarding({ email: saved.email, emailRequired: false });
      hydrate({ session: { ...(typeof saved.email === 'string' ? { email: saved.email } : {}), hasProviderProfile: true } });
      submitOnboarding();
      router.replace('/vendor' as any);
    } catch (failure) {
      setError(apiMessage(failure, ''));
      setErrorStep(7);
    }
  };

  return (
    <Screen
      header={<Header title={'Provider onboarding'} subtitle={'8 steps · private and business'} prominent />}
      footer={
        <View style={styles.footerRow}>
          {step > 0 ? <Button label={'Back'} variant="secondary" onPress={back} style={styles.footerBtn} /> : null}
          {step < steps.length - 1 ? <Button label={step === 3 && !optionsReady ? 'Loading options…' : 'Next'} onPress={next} loading={step === 3 && !optionsReady} style={styles.footerBtn} /> : <Button label={saving ? 'Saving…' : 'Confirm & submit'} onPress={() => void submit()} loading={saving} style={styles.footerBtn} />}
        </View>
      }>
      <ProgressSteps steps={steps} current={step} onPress={(index) => { setError(''); setErrorStep(null); setStep(index); }} />
      <Text style={styles.stepTitle}>{steps[step]}</Text>
      {error && errorStep === step ? <Notice tone="error" body={error} /> : null}

      {step === 0 ? (
        <Card style={styles.accountFields}>
          <Row label={'Full name'} value={onboarding.name || '—'} />
          <Input label={'Email'} value={onboarding.email} onChangeText={(value) => patchOnboarding({ email: value, emailVerified: false })} placeholder={'you@example.com'} keyboardType="email-address" autoCapitalize="none" />
          <Row label={'Phone'} value={onboarding.phone || '—'} />
        </Card>
      ) : null}

      {step === 1 ? (
        <Card>
          <Field label={'Provider type'}>
            <ChipSingle
              options={options.provider_types.map((item) => item.code)}
              value={onboarding.type}
              onChange={(value) => patchOnboarding({ type: value as 'private' | 'business' })}
              labelOf={(value) => optionLabel(options.provider_types, value)}
            />
          </Field>
          <Input label={'Public profile name'} value={onboarding.profileName} onChangeText={(value) => patchOnboarding({ profileName: value })} autoCapitalize="words" />
          {onboarding.type === 'business' ? (
            <>
              <Input label={'Business name'} value={onboarding.company} onChangeText={(value) => patchOnboarding({ company: value })} autoCapitalize="words" />
              <Input label={'KvK number — optional'} value={onboarding.kvk} onChangeText={(value) => patchOnboarding({ kvk: value })} autoCapitalize="none" />
            </>
          ) : null}
          <Input label={'Street — private'} value={onboarding.street} onChangeText={(value) => patchOnboarding({ street: value })} autoCapitalize="words" />
          <Input label={'House number — private'} value={onboarding.house} onChangeText={(value) => patchOnboarding({ house: value })} autoCapitalize="none" />
          <Input label={'Postcode — private'} value={onboarding.postal} onChangeText={(value) => patchOnboarding({ postal: value })} autoCapitalize="characters" />
          <Input label={'City'} value={onboarding.city} onChangeText={(value) => patchOnboarding({ city: value })} autoCapitalize="words" />
          <Notice tone="info" body={'Your address is not public. Only city and service area appear on your profile.'} />
        </Card>
      ) : null}

      {step === 2 ? (
        <>
          <Card>
            <Input label={'Base postcode'} value={onboarding.postal} onChangeText={(value) => patchOnboarding({ postal: value })} autoCapitalize="characters" />
            <Stepper label={'Service area: radius in km'} value={onboarding.radius} onChange={(value) => patchOnboarding({ radius: value })} min={1} max={120} />
          </Card>
          <Card>
            <SectionTitle title={'Which fulfilment types do you offer?'} />
            <Field>
              <ChipGroup
                options={options.fulfilments.map((item) => item.code)}
                selected={[onboarding.delivery && 'delivery', onboarding.pickup && 'pickup', onboarding.onsite && 'onsite'].filter(Boolean) as string[]}
                onToggle={(value) => patchOnboarding(value === 'delivery' ? { delivery: !onboarding.delivery } : value === 'pickup' ? { pickup: !onboarding.pickup } : { onsite: !onboarding.onsite })}
                labelOf={(value) => optionLabel(options.fulfilments, value)}
              />
            </Field>
          </Card>
        </>
      ) : null}

      {step === 3 ? (
        optionsReady ? (
          <>
            <Card>
              <SectionTitle title={'Cuisines'} />
              <Field>
                <ChipGroup options={options.cuisines.map((item) => item.code)} selected={onboarding.cuisines} onToggle={(value) => patchOnboarding({ cuisines: onboarding.cuisines.includes(value) ? onboarding.cuisines.filter((item) => item !== value) : [...onboarding.cuisines, value] })} labelOf={(value) => optionLabel(options.cuisines, value)} />
              </Field>
              {onboarding.cuisines.includes('surinamese') ? (
                <>
                  <SectionTitle title={'Surinamese styles'} />
                  <Field>
                    <ChipGroup options={options.cuisine_styles.map((item) => item.code)} selected={onboarding.cuisineStyles} onToggle={(value) => patchOnboarding({ cuisineStyles: onboarding.cuisineStyles.includes(value) ? onboarding.cuisineStyles.filter((item) => item !== value) : [...onboarding.cuisineStyles, value] })} labelOf={(value) => optionLabel(options.cuisine_styles, value)} />
                  </Field>
                </>
              ) : null}
            </Card>
            <Card>
              <SectionTitle title={'What can you offer?'} />
              <Field>
                <ChipGroup options={options.capabilities.map((item) => item.code)} selected={onboarding.capabilities} onToggle={(value) => patchOnboarding({ capabilities: onboarding.capabilities.includes(value) ? onboarding.capabilities.filter((item) => item !== value) : [...onboarding.capabilities, value] })} labelOf={(value) => optionLabel(options.capabilities, value)} />
              </Field>
            </Card>
          </>
        ) : <Notice tone="info" body={'Loading onboarding options…'} />
      ) : null}

      {step === 4 ? (
        <>
          <Notice tone="info" body={'Each enabled fulfilment type has its own minimum and maximum guest count.'} />
          {onboarding.delivery ? <Card><SectionTitle title={'Delivery'} /><Stepper label={'Minimum'} value={onboarding.minDelivery} onChange={(value) => patchOnboarding({ minDelivery: value })} min={1} max={500} /><Stepper label={'Maximum'} value={onboarding.maxDelivery} onChange={(value) => patchOnboarding({ maxDelivery: value })} min={1} max={1000} /></Card> : null}
          {onboarding.pickup ? <Card><SectionTitle title={'Pickup'} /><Stepper label={'Minimum'} value={onboarding.minPickup} onChange={(value) => patchOnboarding({ minPickup: value })} min={1} max={500} /><Stepper label={'Maximum'} value={onboarding.maxPickup} onChange={(value) => patchOnboarding({ maxPickup: value })} min={1} max={1000} /></Card> : null}
          {onboarding.onsite ? <Card><SectionTitle title={'On-site'} /><Stepper label={'Minimum'} value={onboarding.minOnsite} onChange={(value) => patchOnboarding({ minOnsite: value })} min={1} max={500} /><Stepper label={'Maximum'} value={onboarding.maxOnsite} onChange={(value) => patchOnboarding({ maxOnsite: value })} min={1} max={1000} /></Card> : null}
          <Card>
            <Stepper label={'Minimum preparation time (days)'} value={onboarding.leadDays} onChange={(value) => patchOnboarding({ leadDays: value })} min={0} max={30} />
          </Card>
        </>
      ) : null}

      {step === 5 ? (
        <Card>
          <Input label={'Profile description'} value={onboarding.description} onChangeText={(value) => patchOnboarding({ description: value })} multiline hint={'At least 20 characters.'} />
          <Input label={'Starting price per guest (€ incl. VAT) — optional'} value={onboarding.fromPrice} onChangeText={(value) => patchOnboarding({ fromPrice: value })} keyboardType="numeric" />
          <Notice tone="info" title={'Menu PDF and photos'} body={'Optional. In production files are stored securely and moderated. This demo does not upload.'} />
        </Card>
      ) : null}

      {step === 6 ? (
        <Card>
          <SectionTitle title={'Full plan · 6 months free'} subtitle={'For all new providers, private and business.'} />
          <Text style={styles.paragraph}>{'Starts on admin approval. No billing details needed. After expiry you explicitly choose paid or Free. Without an active plan new leads stop.'}</Text>
          <CheckRow checked={onboarding.trialConsent} onPress={() => patchOnboarding({ trialConsent: !onboarding.trialConsent })} label={'I understand the free period and the plan choice after.'} />
        </Card>
      ) : null}

      {step === 7 ? (
        <>
          <Card>
            <SectionTitle title={'Summary'} />
            <Row label={'Profile name'} value={onboarding.profileName || '—'} />
            <Row label={'Type'} value={onboarding.type === 'private' ? 'Private' : 'Business'} />
            <Row label={'Verification'} value={`${onboarding.emailVerified ? 'e-mail ✓' : 'e-mail ✗'} · ${onboarding.phoneVerified ? 'telefoon ✓' : 'telefoon ✗'}`} />
            <Row label={'City'} value={onboarding.city || '—'} />
            <Row label={'Service area'} value={`${onboarding.radius} km`} />
            <Row label={'Cuisines'} value={String(onboarding.cuisines.length)} />
            <Row label={'Capabilities'} value={String(onboarding.capabilities.length)} />
            <Row label={'Starting price'} value={onboarding.fromPrice ? `€ ${onboarding.fromPrice}` : '—'} />
          </Card>
          <CheckRow checked={onboarding.terms} onPress={() => patchOnboarding({ terms: !onboarding.terms })} label={'I confirm my details are accurate and accept the terms.'} />
        </>
      ) : null}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function CheckRow({ checked, onPress, label }: { checked: boolean; onPress: () => void; label: string }) {
  return (
    <View style={styles.checkRow}>
      <View style={[styles.checkbox, checked && styles.checkboxOn]}>{checked ? <Text style={styles.checkmark}>✓</Text> : null}</View>
      <Text style={styles.checkText} onPress={onPress}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  accountFields: { gap: 14 },
  footerRow: { flexDirection: 'row', gap: 10 },
  footerBtn: { flex: 1 },
  stepTitle: { fontSize: 20, fontWeight: '700', color: palette.ink },
  paragraph: { fontSize: 14, lineHeight: 21, color: palette.ink },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 4 },
  rowLabel: { flex: 1, fontSize: 14, color: palette.muted },
  rowValue: { flex: 1, fontSize: 14, fontWeight: '600', color: palette.ink, textAlign: 'right' },
  checkRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: palette.line, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface },
  checkboxOn: { backgroundColor: palette.accent, borderColor: palette.accent },
  checkmark: { color: '#fff', fontSize: 15, fontWeight: '800', lineHeight: 18 },
  checkText: { flex: 1, fontSize: 14, lineHeight: 20, color: palette.ink },
});
