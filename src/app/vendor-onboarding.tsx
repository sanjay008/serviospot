import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useRegisterMutation, type ApiFailure } from '@/api';
import { apiActions } from '@/api/actions';
import { toSessionPatch } from '@/api/mappers';
import { Button } from '@/components/Button';
import { ChipGroup } from '@/components/Chip';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Input } from '@/components/Input';
import { LoadingState } from '@/components/LoadingState';
import { Notice } from '@/components/Notice';
import { PhotoPicker } from '@/components/PhotoPicker';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { splitPhone, toggleIn } from '@/data/format';
import { useResponsive } from '@/hooks/use-responsive';
import { useCategoriesSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

const STEPS = [
  'Account & verification',
  'Provider & private address',
  'Service area & fulfilment',
  'Catering capabilities',
  'Capacity per fulfilment type',
  'Profile, PDF & photos',
  '6 months of full access',
  'Review & submit',
];

export default function VendorOnboardingScreen() {
  const { session, startSession, hydrate, verifyEmail, verifyPhone, preferences, updateProvider, setMode, categories, categoryName } = useApp();
  const [registerUser, { isLoading }] = useRegisterMutation();
  const categoriesLoading = useCategoriesSync();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(session.name);
  const [email, setEmail] = useState(session.email);
  const [phone, setPhone] = useState(session.phone);
  const [password, setPassword] = useState('');
  const [profileName, setProfileName] = useState('');
  const [city, setCity] = useState(preferences.cities);
  const [radius, setRadius] = useState(preferences.radiusKm ? String(preferences.radiusKm) : '');
  const [services, setServices] = useState<string[]>([]);
  const [minGuests, setMinGuests] = useState(preferences.minGuests);
  const [maxGuests, setMaxGuests] = useState(preferences.maxGuests);
  const [story, setStory] = useState('');
  const [photo, setPhoto] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState<'email' | 'phone' | ''>('');
  const [trialAccepted, setTrialAccepted] = useState(false);
  const { isCompact, isTablet } = useResponsive();

  const save = async () => {
    setError('');
    setBusy(true);
    try {
      if (step === 0 && !session.signedIn) {
        if (!name.trim() || !email.includes('@') || phone.trim().length < 8 || password.length < 8) {
          setError('Add your name, a valid email, a phone number and a password of at least 8 characters.');
          return;
        }
        const cleanEmail = email.trim().toLowerCase();
        const reply = await registerUser({
          role: 'vendor',
          full_name: name.trim(),
          email: cleanEmail,
          password,
          ...splitPhone(phone),
          ...(city.trim() ? { city: city.trim() } : {}),
        }).unwrap();
        startSession({ name: name.trim(), email: cleanEmail, phone: phone.trim(), mode: 'provider', hasProviderProfile: false });
        hydrate({ session: toSessionPatch(reply) });
        return;
      }
      if (step === 1) {
        if (!profileName.trim() || !city.trim()) {
          setError('Add the public profile name and city.');
          return;
        }
        const result = await apiActions.vendorProfile({ name: profileName.trim(), city: city.trim() });
        if (!result.ok) {
          setError(result.reason);
          return;
        }
        updateProvider({ name: profileName.trim(), city: city.trim() });
      }
      if (step === 2) {
        const result = await apiActions.preferences({ ...preferences, cities: city.trim(), radiusKm: Number(radius) || 0 });
        if (!result.ok) {
          setError(result.reason);
          return;
        }
      }
      if (step === 3) {
        if (services.length === 0) {
          setError('Pick at least one service.');
          return;
        }
        const result = await apiActions.vendorServices(services);
        if (!result.ok) {
          setError(result.reason);
          return;
        }
        updateProvider({ services });
      }
      if (step === 4) {
        const result = await apiActions.preferences({ ...preferences, cities: city.trim(), radiusKm: Number(radius) || preferences.radiusKm, minGuests, maxGuests });
        if (!result.ok) {
          setError(result.reason);
          return;
        }
      }
      if (step === 6 && !trialAccepted) {
        setError('Confirm that you understand the free period.');
        return;
      }
      if (step === 5) {
        const result = await apiActions.vendorProfile({ name: profileName.trim(), city: city.trim(), description: story.trim(), ...(photo ? { photo } : {}) });
        if (!result.ok) {
          setError(result.reason);
          return;
        }
        updateProvider({ description: story.trim(), ...(photo ? { photo } : {}) });
      }
      if (step === STEPS.length - 1) {
        setMode('provider');
        hydrate({ session: { hasProviderProfile: true } });
        router.replace('/business');
        return;
      }
      setStep((current) => current + 1);
    } catch (failure) {
      setError((failure as ApiFailure).message || 'Could not save this step. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async (kind: 'email' | 'phone') => {
    setChecking(kind);
    setError('');
    const result = kind === 'email' ? await verifyEmail() : await verifyPhone();
    setChecking('');
    if (!result.ok) setError(result.reason);
  };

  return (
    <Screen
      canvas={palette.bg}
      header={<Header title="Vendor register" subtitle={`Step ${step + 1} of ${STEPS.length}`} back />}
      footer={
        <View style={styles.actions}>
          {step > 0 ? <Button label="Back" variant="secondary" style={styles.half} onPress={() => { setError(''); setStep((current) => current - 1); }} /> : null}
          <Button
            label={step === STEPS.length - 1 ? 'Finish' : step === 0 && !session.signedIn ? 'Create account' : 'Next'}
            style={styles.half}
            loading={busy || isLoading}
            disabled={step === 6 && !trialAccepted}
            onPress={save}
          />
        </View>
      }>
      <View style={styles.pills}>
        {STEPS.map((label, index) => {
          const on = index === step;
          return (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              disabled={index > step}
              onPress={() => { setError(''); setStep(index); }}
              style={[styles.pill, isTablet && styles.pillTablet, on && styles.pillOn, index > step && styles.pillAhead]}>
              <Text style={[styles.pillText, isCompact && styles.pillTextCompact, on && styles.pillTextOn]} numberOfLines={2}>
                {index + 1} · {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.stepTitle, isCompact && styles.stepTitleCompact]}>{STEPS[step]}</Text>
      {error ? <Notice tone="error" body={error} /> : null}
      {step === 0 ? (
        <View style={[styles.fields, isTablet && styles.fieldsWide]}>
          <Input label="Full name" value={name} onChangeText={setName} placeholder="Full name" autoCapitalize="words" />
          <Input label="Email" value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />
          <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" />
          {session.signedIn ? null : <Input label="Password (at least 8 characters)" value={password} onChangeText={setPassword} placeholder="Password" secure autoCapitalize="none" />}
          {session.signedIn ? (
            <View style={[styles.verify, isTablet && styles.verifyRow]}>
              <Button label={session.emailVerified ? 'Email verified' : 'Verify email'} variant="secondary" style={isTablet ? styles.half : undefined} loading={checking === 'email'} disabled={session.emailVerified} onPress={() => verify('email')} />
              <Button label={session.phoneVerified ? 'Phone verified' : 'Verify phone'} variant="secondary" style={isTablet ? styles.half : undefined} loading={checking === 'phone'} disabled={session.phoneVerified} onPress={() => verify('phone')} />
            </View>
          ) : null}
        </View>
      ) : null}
      {step === 1 ? (
        <View style={[styles.fields, isTablet && styles.fieldsWide]}>
          <Input label="Public profile name" value={profileName} onChangeText={setProfileName} placeholder="Public profile name" />
          <Input label="City" value={city} onChangeText={setCity} placeholder="City" />
        </View>
      ) : null}
      {step === 2 ? <Input label="Service area: radius in km" value={radius} onChangeText={setRadius} placeholder="25" keyboardType="number-pad" /> : null}
      {step === 3 ? (
        categoriesLoading ? <LoadingState label="Loading services" /> : <ChipGroup options={categories.map((item) => item.code)} labelOf={categoryName} selected={services} onToggle={(item) => setServices(toggleIn(services, item))} />
      ) : null}
      {step === 4 ? (
        <View style={styles.pair}>
          <View style={styles.half}><Input label="Minimum guests" value={minGuests} onChangeText={setMinGuests} placeholder="10" keyboardType="number-pad" /></View>
          <View style={styles.half}><Input label="Maximum guests" value={maxGuests} onChangeText={setMaxGuests} placeholder="150" keyboardType="number-pad" /></View>
        </View>
      ) : null}
      {step === 5 ? (
        <>
          <Input label="Profile description" value={story} onChangeText={setStory} placeholder="Profile description" multiline />
          <PhotoPicker label="" shape="logo" centered value={photo} onChange={setPhoto} />
        </>
      ) : null}
      {step === 6 ? (
        <View style={[styles.offer, isTablet && styles.offerWide]}>
          <Text style={styles.badge}>INTRODUCTORY OFFER</Text>
          <Text style={styles.offerTitle}>Full plan · 6 months free</Text>
          <Text style={styles.offerBody}>For all new private and business providers. All plan features including eligible quote requests and in-app responses.</Text>
          <Text style={styles.offerHeading}>Starts on admin approval</Text>
          <Text style={styles.offerBody}>Review waiting time does not consume your six months. No payment details required at signup.</Text>
          <Text style={styles.offerBody}>After expiry explicitly choose a paid plan or continue on Free. No automatic charge. Without an active paid plan new quote leads stop; existing matches stay accessible.</Text>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: trialAccepted }} onPress={() => setTrialAccepted((on) => !on)} style={styles.checkRow}>
            <View style={[styles.box, trialAccepted && styles.boxOn]}>{trialAccepted ? <Icon name="check" color="#fff" size={14} /> : null}</View>
            <Text style={styles.checkText}>I understand the free period and plan choice afterwards.</Text>
          </Pressable>
        </View>
      ) : null}
      {step === 7 ? (
        <View style={[styles.review, isTablet && styles.offerWide]}>
          {[
            profileName,
            city,
            radius ? `${radius} km` : '',
            services.map(categoryName).join(', '),
            minGuests || maxGuests ? `${minGuests || '—'}–${maxGuests || '—'} guests` : '',
            story,
          ].filter(Boolean).map((line) => (
            <Text key={line} style={styles.line}>{line}</Text>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { flexGrow: 1, flexBasis: '46%', minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  pillTablet: { flexBasis: '30%' },
  pillOn: { backgroundColor: palette.accent, borderColor: palette.accent },
  pillAhead: { opacity: 0.55 },
  pillText: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: palette.ink },
  pillTextCompact: { fontSize: 12, lineHeight: 16 },
  pillTextOn: { color: '#fff' },
  stepTitle: { fontSize: 26, lineHeight: 32, fontWeight: '700', color: palette.ink },
  stepTitleCompact: { fontSize: 22, lineHeight: 28 },
  fields: { gap: 12 },
  fieldsWide: { maxWidth: 560 },
  verify: { gap: 10 },
  verifyRow: { flexDirection: 'row' },
  pair: { flexDirection: 'row', gap: 12 },
  offer: { gap: 10, padding: 16, borderRadius: 18, borderWidth: 1.5, borderColor: palette.accent, backgroundColor: palette.surface },
  offerWide: { maxWidth: 640 },
  badge: { alignSelf: 'flex-start', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: palette.accentSoft, color: palette.accent, fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  offerTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: palette.ink },
  offerHeading: { marginTop: 4, fontSize: 15, fontWeight: '700', color: palette.ink },
  offerBody: { fontSize: 15, lineHeight: 22, color: palette.ink },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 6 },
  box: { width: 22, height: 22, marginTop: 1, borderRadius: 4, borderWidth: 1.5, borderColor: palette.muted, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface },
  boxOn: { backgroundColor: palette.accent, borderColor: palette.accent },
  checkText: { flex: 1, fontSize: 15, lineHeight: 22, color: palette.ink },
  review: { gap: 8, padding: 16, borderRadius: 18, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  line: { fontSize: 16, lineHeight: 24, color: palette.ink },
  actions: { flexDirection: 'row', gap: 10 },
  half: { flex: 1, borderRadius: 14 },
});
