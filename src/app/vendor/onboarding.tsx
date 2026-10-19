import { Redirect, router } from 'expo-router';
import { useState } from 'react';
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
import { useApp } from '@/flow2/state/app';

export default function VendorOnboardingScreen() {
  const { onboarding, patchOnboarding, submitOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');

  const steps = [
    'Account & verification',
    'Provider & private address',
    'Service area & fulfilment',
    'Catering capabilities',
    'Capacity per fulfilment type',
    'Profile, PDF & photos',
    '6 months of full access',
    'Review & submit',
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Retained for re-enabling onboarding checks after the APK demo.
  const validate = (index: number): string => {
    if (index === 0) {
      if (!onboarding.name.trim() || !onboarding.email.trim() || !onboarding.phone.trim()) return 'Enter name, email and phone.';
      if (onboarding.password.length < 8) return 'Enter a password of at least 8 characters.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(onboarding.email)) return 'Enter a valid email.';
      if (!/^[+()0-9\s-]{8,20}$/.test(onboarding.phone)) return 'Enter a valid phone number.';
      if (!onboarding.emailVerified || !onboarding.phoneVerified) return 'Verify both email and phone first.';
    }
    if (index === 1) {
      if (!onboarding.profileName.trim() || !onboarding.street.trim() || !onboarding.city.trim()) return 'Enter profile name and full address.';
      if (onboarding.type === 'business' && !onboarding.company.trim()) return 'Business name is required for business providers.';
      if (!/^[1-9][0-9]{3}\s?[A-Za-z]{2}$/.test(onboarding.postal)) return 'Enter a valid Dutch postcode.';
      if (onboarding.kvk && onboarding.type === 'business' && !/^\d{8}$/.test(onboarding.kvk)) return 'KvK is optional; if supplied, it must contain 8 digits.';
    }
    if (index === 2) {
      if (!onboarding.delivery && !onboarding.pickup && !onboarding.onsite) return 'Choose at least one fulfilment type.';
      if ((onboarding.delivery || onboarding.onsite) && (!Number.isFinite(onboarding.radius) || onboarding.radius < 1)) return 'Choose a positive service radius.';
    }
    if (index === 3) {
      if (!onboarding.cuisines.length || !onboarding.capabilities.length) return 'Choose at least one cuisine and one capability.';
      if (onboarding.cuisines.includes('surinamese') && !onboarding.cuisineStyles.length) return 'Choose at least one Surinamese style.';
    }
    if (index === 4) {
      const capacities = [
        ['Delivery', onboarding.delivery, onboarding.minDelivery, onboarding.maxDelivery],
        ['Pickup', onboarding.pickup, onboarding.minPickup, onboarding.maxPickup],
        ['On-site', onboarding.onsite, onboarding.minOnsite, onboarding.maxOnsite],
      ] as const;
      for (const [label, enabled, minimum, maximum] of capacities) {
        if (enabled && (!Number.isInteger(minimum) || !Number.isInteger(maximum) || minimum < 1 || maximum < minimum)) {
          return `${label}: minimum and maximum must be positive whole guest counts, and maximum must be at least minimum.`;
        }
      }
      if (!Number.isInteger(onboarding.leadDays) || onboarding.leadDays < 0) return 'Preparation time must be a whole number of days, 0 or more.';
    }
    if (index === 5 && onboarding.description.trim().length < 20) return 'Describe your profile in at least 20 characters.';
    if (index === 5 && onboarding.fromPrice !== '' && (!Number.isFinite(Number(onboarding.fromPrice)) || Number(onboarding.fromPrice) < 0)) return 'Starting price must be a non-negative amount, or leave it blank.';
    if (index === 6 && !onboarding.trialConsent) return 'Confirm the free period explanation.';
    if (index === 7 && !onboarding.terms) return 'Confirm your details and the terms.';
    return '';
  };

  const next = () => {
    // Temporary APK flow: bypass step validation so vendors can continue directly.
    // Restore this block when validation is re-enabled:
    // const message = validate(step);
    // if (message) {
    //   setError(message);
    //   return;
    // }
    setError('');
    setStep((current) => Math.min(steps.length - 1, current + 1));
  };

  const back = () => {
    setError('');
    setStep((current) => Math.max(0, current - 1));
  };

  const submit = () => {
    // Temporary APK flow: bypass all onboarding validation on submit.
    // Restore the validation loop below when validation is re-enabled:
    // for (let index = 0; index < steps.length; index += 1) {
    //   const message = validate(index);
    //   if (message) {
    //     setStep(index);
    //     setError(message);
    //     return;
    //   }
    // }
    setError('');
    submitOnboarding();
    router.replace('/vendor' as any);
  };

  if (onboarding.status === 'approved') return <Redirect href="/vendor" />;

  return (
    <Screen
      header={<Header title={'Provider onboarding'} subtitle={'8 steps · private and business'} back />}
      footer={
        <View style={styles.footerRow}>
          {step > 0 ? <Button label={'Back'} variant="secondary" onPress={back} style={styles.footerBtn} /> : null}
          {step < steps.length - 1 ? <Button label={'Next'} onPress={next} style={styles.footerBtn} /> : <Button label={'Confirm & submit'} onPress={submit} style={styles.footerBtn} />}
        </View>
      }>
      <ProgressSteps steps={steps} current={step} onPress={(index) => setStep(index)} />
      <Text style={styles.stepTitle}>{steps[step]}</Text>
      {error ? <Notice tone="error" body={error} /> : null}

      {step === 0 ? (
        <>
          <Card>
            <Input label={'Full name'} value={onboarding.name} onChangeText={(value) => patchOnboarding({ name: value })} autoCapitalize="words" />
            <Input label={'Email'} value={onboarding.email} onChangeText={(value) => patchOnboarding({ email: value, emailVerified: false })} keyboardType="email-address" autoCapitalize="none" />
            <Input label={'Phone'} value={onboarding.phone} onChangeText={(value) => patchOnboarding({ phone: value, phoneVerified: false })} keyboardType="phone-pad" />
            <Input label={'Password (min. 8 characters)'} value={onboarding.password} onChangeText={(value) => patchOnboarding({ password: value })} secure autoCapitalize="none" />
          </Card>
          <Card>
            <View style={styles.verifyRow}>
              <Text style={styles.verifyText}>{'Email verification'}</Text>
              <Button label={onboarding.emailVerified ? 'Verified' : 'Simulate'} variant={onboarding.emailVerified ? 'secondary' : 'primary'} disabled={onboarding.emailVerified} onPress={() => patchOnboarding({ emailVerified: true })} />
            </View>
            <View style={styles.verifyRow}>
              <Text style={styles.verifyText}>{'Phone verification'}</Text>
              <Button label={onboarding.phoneVerified ? 'Verified' : 'Simulate'} variant={onboarding.phoneVerified ? 'secondary' : 'primary'} disabled={onboarding.phoneVerified} onPress={() => patchOnboarding({ phoneVerified: true })} />
            </View>
          </Card>
        </>
      ) : null}

      {step === 1 ? (
        <Card>
          <Field label={'Provider type'}>
            <ChipSingle
              options={['private', 'business']}
              value={onboarding.type}
              onChange={(value) => patchOnboarding({ type: value as 'private' | 'business' })}
              labelOf={(value) => value}
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
                options={['delivery', 'pickup', 'onsite']}
                selected={[onboarding.delivery && 'delivery', onboarding.pickup && 'pickup', onboarding.onsite && 'onsite'].filter(Boolean) as string[]}
                onToggle={(value) => patchOnboarding(value === 'delivery' ? { delivery: !onboarding.delivery } : value === 'pickup' ? { pickup: !onboarding.pickup } : { onsite: !onboarding.onsite })}
                labelOf={(value) => value}
              />
            </Field>
          </Card>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <Card>
            <SectionTitle title={'Cuisines'} />
            <Field>
              <ChipGroup options={CUISINES.map((item) => item.value)} selected={onboarding.cuisines} onToggle={(value) => patchOnboarding({ cuisines: onboarding.cuisines.includes(value) ? onboarding.cuisines.filter((item) => item !== value) : [...onboarding.cuisines, value] })} labelOf={(value) => value} />
            </Field>
            {onboarding.cuisines.includes('surinamese') ? (
              <>
                <SectionTitle title={'Surinamese styles'} />
                <Field>
                  <ChipGroup options={CUISINE_STYLES.map((item) => item.value)} selected={onboarding.cuisineStyles} onToggle={(value) => patchOnboarding({ cuisineStyles: onboarding.cuisineStyles.includes(value) ? onboarding.cuisineStyles.filter((item) => item !== value) : [...onboarding.cuisineStyles, value] })} labelOf={(value) => value} />
                </Field>
              </>
            ) : null}
          </Card>
          <Card>
            <SectionTitle title={'What can you offer?'} />
            <Field>
              <ChipGroup options={CAPABILITIES.map((item) => item.value)} selected={onboarding.capabilities} onToggle={(value) => patchOnboarding({ capabilities: onboarding.capabilities.includes(value) ? onboarding.capabilities.filter((item) => item !== value) : [...onboarding.capabilities, value] })} labelOf={(value) => value} />
            </Field>
          </Card>
        </>
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
  footerRow: { flexDirection: 'row', gap: 10 },
  footerBtn: { flex: 1 },
  stepTitle: { fontSize: 20, fontWeight: '700', color: palette.ink },
  verifyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  verifyText: { flex: 1, fontSize: 15, color: palette.ink },
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
