import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { ChipGroup } from '@/flow2/components/Chip';
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
import { leading, useType } from '@/hooks/use-type';
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
  const { onboarding, patchOnboarding, submitOnboarding, lang, t } = useApp();
  const tx = (en: string) => t({ en, nl: en });
  const { hydrate, session } = useSessionApp();
  const type = useType();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [errorStep, setErrorStep] = useState<number | null>(null);
  const [options, setOptions] = useState(FALLBACK_ONBOARDING_OPTIONS);
  const [optionsReady, setOptionsReady] = useState(false);
  const [getOptions] = useGetOnboardingOptionsMutation();
  const [saveVendorOnboarding, { isLoading: saving }] = useSaveVendorOnboardingMutation();
  const seededName = useRef(false);

  useEffect(() => {
    if (!session.signedIn || session.mode !== 'provider') return;
    const writtenName = /[A-Za-z]/.test(session.name) ? session.name.trim() : '';
    patchOnboarding({
      email: session.email,
      emailRequired: !session.email,
      phone: session.phone,
      accountCreated: true,
      emailVerified: Boolean(session.email),
      phoneVerified: Boolean(session.phone),
      ...(seededName.current ? {} : { name: writtenName, profileName: writtenName }),
    });
    seededName.current = true;
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
    tx('Contact details'),
    tx('Provider & private address'),
    tx('Service area & fulfilment'),
    tx('Catering capabilities'),
    tx('Capacity per fulfilment type'),
    tx('Profile, PDF & photos'),
    tx('6 months of full access'),
    tx('Review & submit'),
  ];

  const validate = (index: number): string => {
    if (index === 0 && !onboarding.name.trim()) return tx('Enter your full name.');
    if (index === 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(onboarding.email.trim())) return tx('Enter a real email address.');
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
        full_name: onboarding.name.trim(),
        profile_name: onboarding.profileName.trim(),
        provider_type: 'business',
        business_name: onboarding.company.trim(),
        ...(onboarding.kvk.trim() ? { kvk: onboarding.kvk.trim() } : {}),
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
      hydrate({ session: { ...(typeof saved.email === 'string' ? { email: saved.email } : {}), hasProviderProfile: true, vendorProfileComplete: 1 } });
      submitOnboarding();
      router.replace('/vendor' as any);
    } catch (failure) {
      setError(apiMessage(failure, ''));
      setErrorStep(7);
    }
  };

  return (
    <Screen
      liftFooter={false}
      header={<Header title={tx('Provider onboarding')} subtitle={tx('8 steps · private and business')} prominent />}
      footer={
        <View style={styles.footerRow}>
          {step > 0 ? <Button label={tx('Back')} variant="secondary" onPress={back} style={styles.footerBtn} /> : null}
          {step < steps.length - 1 ? <Button label={step === 3 && !optionsReady ? tx('Loading options…') : tx('Next')} onPress={next} loading={step === 3 && !optionsReady} style={styles.footerBtn} /> : <Button label={saving ? tx('Saving…') : tx('Confirm & submit')} onPress={() => void submit()} loading={saving} style={styles.footerBtn} />}
        </View>
      }>
      <ProgressSteps
        steps={steps}
        current={step}
        onPress={(index) => { setError(''); setErrorStep(null); setStep(index); }}
        title={steps[step]}
      />
      {error && errorStep === step ? <Notice tone="error" body={error} /> : null}

      {step === 0 ? (
        <Card style={styles.accountFields}>
          <Input label={tx('Full name')} value={onboarding.name} onChangeText={(value) => patchOnboarding({ name: value })} placeholder={tx('Your name')} autoCapitalize="words" />
          <Input label={tx('Email')} value={onboarding.email} onChangeText={(value) => patchOnboarding({ email: value, emailVerified: false })} placeholder={'you@example.com'} keyboardType="email-address" autoCapitalize="none" />
          <Row label={tx('Phone')} value={onboarding.phone || '—'} />
        </Card>
      ) : null}

      {step === 1 ? (
        <Card>
          <Input label={tx('Public profile name')} value={onboarding.profileName} onChangeText={(value) => patchOnboarding({ profileName: value })} autoCapitalize="words" />
          <Input label={tx('Business name')} value={onboarding.company} onChangeText={(value) => patchOnboarding({ company: value })} autoCapitalize="words" />
          <Input label={tx('KvK number — optional')} value={onboarding.kvk} onChangeText={(value) => patchOnboarding({ kvk: value })} autoCapitalize="none" />
          <Input label={tx('Street — private')} value={onboarding.street} onChangeText={(value) => patchOnboarding({ street: value })} autoCapitalize="words" />
          <Input label={tx('House number — private')} value={onboarding.house} onChangeText={(value) => patchOnboarding({ house: value })} autoCapitalize="none" />
          <Input label={tx('Postcode — private')} value={onboarding.postal} onChangeText={(value) => patchOnboarding({ postal: value })} autoCapitalize="characters" />
          <Input label={tx('City')} value={onboarding.city} onChangeText={(value) => patchOnboarding({ city: value })} autoCapitalize="words" />
        </Card>
      ) : null}

      {step === 2 ? (
        <>
          <Card>
            <Input label={tx('Base postcode')} value={onboarding.postal} onChangeText={(value) => patchOnboarding({ postal: value })} autoCapitalize="characters" />
            <Stepper label={tx('Service area: radius in km')} value={onboarding.radius} onChange={(value) => patchOnboarding({ radius: value })} min={1} max={120} />
          </Card>
          <Card>
            <SectionTitle title={tx('Which fulfilment types do you offer?')} />
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
              <SectionTitle title={tx('Cuisines')} />
              <Field>
                <ChipGroup options={options.cuisines.map((item) => item.code)} selected={onboarding.cuisines} onToggle={(value) => patchOnboarding({ cuisines: onboarding.cuisines.includes(value) ? onboarding.cuisines.filter((item) => item !== value) : [...onboarding.cuisines, value] })} labelOf={(value) => optionLabel(options.cuisines, value)} />
              </Field>
              {onboarding.cuisines.includes('surinamese') ? (
                <>
                  <SectionTitle title={tx('Surinamese styles')} />
                  <Field>
                    <ChipGroup options={options.cuisine_styles.map((item) => item.code)} selected={onboarding.cuisineStyles} onToggle={(value) => patchOnboarding({ cuisineStyles: onboarding.cuisineStyles.includes(value) ? onboarding.cuisineStyles.filter((item) => item !== value) : [...onboarding.cuisineStyles, value] })} labelOf={(value) => optionLabel(options.cuisine_styles, value)} />
                  </Field>
                </>
              ) : null}
            </Card>
            <Card>
              <SectionTitle title={tx('What can you offer?')} />
              <Field>
                <ChipGroup options={options.capabilities.map((item) => item.code)} selected={onboarding.capabilities} onToggle={(value) => patchOnboarding({ capabilities: onboarding.capabilities.includes(value) ? onboarding.capabilities.filter((item) => item !== value) : [...onboarding.capabilities, value] })} labelOf={(value) => optionLabel(options.capabilities, value)} />
              </Field>
            </Card>
          </>
        ) : <Notice tone="info" body={tx('Loading options…')} />
      ) : null}

      {step === 4 ? (
        <>
          <Notice tone="info" body={tx('Each enabled fulfilment type has its own minimum and maximum guest count.')} />
          {onboarding.delivery ? <Card><SectionTitle title={tx('Delivery')} /><Stepper label={tx('Minimum')} value={onboarding.minDelivery} onChange={(value) => patchOnboarding({ minDelivery: value })} min={1} max={500} /><Stepper label={tx('Maximum')} value={onboarding.maxDelivery} onChange={(value) => patchOnboarding({ maxDelivery: value })} min={1} max={1000} /></Card> : null}
          {onboarding.pickup ? <Card><SectionTitle title={tx('Pickup')} /><Stepper label={tx('Minimum')} value={onboarding.minPickup} onChange={(value) => patchOnboarding({ minPickup: value })} min={1} max={500} /><Stepper label={tx('Maximum')} value={onboarding.maxPickup} onChange={(value) => patchOnboarding({ maxPickup: value })} min={1} max={1000} /></Card> : null}
          {onboarding.onsite ? <Card><SectionTitle title={tx('On-site')} /><Stepper label={tx('Minimum')} value={onboarding.minOnsite} onChange={(value) => patchOnboarding({ minOnsite: value })} min={1} max={500} /><Stepper label={tx('Maximum')} value={onboarding.maxOnsite} onChange={(value) => patchOnboarding({ maxOnsite: value })} min={1} max={1000} /></Card> : null}
          <Card>
            <Stepper label={tx('Minimum preparation time (days)')} value={onboarding.leadDays} onChange={(value) => patchOnboarding({ leadDays: value })} min={0} max={30} />
          </Card>
        </>
      ) : null}

      {step === 5 ? (
        <Card>
          <Input label={tx('Profile description')} value={onboarding.description} onChangeText={(value) => patchOnboarding({ description: value })} multiline hint={tx('At least 20 characters.')} />
          <Input label={tx('Starting price per guest (€ incl. VAT) — optional')} value={onboarding.fromPrice} onChangeText={(value) => patchOnboarding({ fromPrice: value })} keyboardType="numeric" />
          <Notice tone="info" title={tx('Menu PDF and photos')} body={tx('Optional. In production files are stored securely and moderated. This demo does not upload.')} />
        </Card>
      ) : null}

      {step === 6 ? (
        <Card>
          <SectionTitle title={tx('Full plan · 6 months free')} subtitle={tx('For all new providers, private and business.')} />
          <Text style={[styles.paragraph, { fontSize: type.secondary, lineHeight: leading(type.secondary, 7) }]}>{tx('Starts on admin approval. No billing details needed. After expiry you explicitly choose paid or Free. Without an active plan new leads stop.')}</Text>
          <CheckRow checked={onboarding.trialConsent} onPress={() => patchOnboarding({ trialConsent: !onboarding.trialConsent })} label={tx('I understand the free period and the plan choice after.')} />
        </Card>
      ) : null}

      {step === 7 ? (
        <>
          <Card>
            <SectionTitle title={tx('Summary')} />
            <Row label={tx('Full name')} value={onboarding.name || '—'} />
            <Row label={tx('Profile name')} value={onboarding.profileName || '—'} />
            <Row label={tx('Business name')} value={onboarding.company || '—'} />
            <Row label={tx('Verification')} value={`${onboarding.emailVerified ? 'e-mail ✓' : 'e-mail ✗'} · ${onboarding.phoneVerified ? 'telefoon ✓' : 'telefoon ✗'}`} />
            <Row label={tx('City')} value={onboarding.city || '—'} />
            <Row label={tx('Service area')} value={`${onboarding.radius} km`} />
            <Row label={tx('Cuisines')} value={String(onboarding.cuisines.length)} />
            <Row label={tx('Capabilities')} value={String(onboarding.capabilities.length)} />
            <Row label={tx('Starting price')} value={onboarding.fromPrice ? `€ ${onboarding.fromPrice}` : '—'} />
          </Card>
          <CheckRow checked={onboarding.terms} onPress={() => patchOnboarding({ terms: !onboarding.terms })} label={tx('I confirm my details are accurate and accept the terms.')} />
        </>
      ) : null}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const type = useType();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { fontSize: type.secondary }]}>{label}</Text>
      <Text style={[styles.rowValue, { fontSize: type.secondary }]}>{value}</Text>
    </View>
  );
}

function CheckRow({ checked, onPress, label }: { checked: boolean; onPress: () => void; label: string }) {
  const type = useType();
  return (
    <View style={styles.checkRow}>
      <View style={[styles.checkbox, checked && styles.checkboxOn]}>{checked ? <Text style={[styles.checkmark, { fontSize: type.body, lineHeight: leading(type.body, 3) }]}>✓</Text> : null}</View>
      <Text style={[styles.checkText, { fontSize: type.secondary, lineHeight: leading(type.secondary, 6) }]} onPress={onPress}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  accountFields: { gap: 14 },
  footerRow: { flexDirection: 'row', gap: 10 },
  footerBtn: { flex: 1 },
  paragraph: { color: palette.ink },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 4 },
  rowLabel: { flex: 1, color: palette.muted },
  rowValue: { flex: 1, fontWeight: '600', color: palette.ink, textAlign: 'right' },
  checkRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: palette.line, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface },
  checkboxOn: { backgroundColor: palette.accent, borderColor: palette.accent },
  checkmark: { color: '#fff', fontWeight: '800' },
  checkText: { flex: 1, color: palette.ink },
});
