import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChipGroup, ChipSingle } from '@/components/Chip';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { toggleIn } from '@/data/format';
import { CUISINES, ME, plans } from '@/data/mock';
import type { PlanId } from '@/data/types';
import { useApp } from '@/state/store';

const STEPS = ['Account', 'Business', 'Profile', 'Verification', 'Plan'];

export default function SetupScreen() {
  const { session, me, register, finishSetup } = useApp();
  const [step, setStep] = useState(session.signedIn ? 1 : 0);
  const [name, setName] = useState(session.name);
  const [email, setEmail] = useState(session.email);
  const [phone, setPhone] = useState(session.phone);
  const [legalName, setLegalName] = useState('');
  const [trading, setTrading] = useState('');
  const [kvk, setKvk] = useState('');
  const [vat, setVat] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [city, setCity] = useState('Utrecht');
  const [intro, setIntro] = useState('');
  const [cuisines, setCuisines] = useState<string[]>(['Surinamese']);
  const [radius, setRadius] = useState('30');
  const [planId, setPlanId] = useState<PlanId>('starter');
  const [error, setError] = useState('');

  if (!session.signedIn) return <Redirect href="/login" />;

  const next = () => {
    if (step === 0 && (!name || !email.includes('@') || phone.length < 8)) {
      setError('Add a name, email and phone. Verification codes are skipped in this setup preview.');
      return;
    }
    if (step === 0 && !session.signedIn) register({ name, email, phone });
    if (step === 1 && (!legalName || !trading || !city)) {
      setError('Add the legal name, trading name and city.');
      return;
    }
    setError('');
    if (step === STEPS.length - 1) {
      finishSetup(
        {
          ...me,
          id: ME,
          name: trading || me.name,
          legalName,
          city,
          intro: intro || me.intro,
          cuisines,
          radiusKm: Number(radius) || 30,
          kvkNumber: kvk,
          vatNumber: vat,
          address,
          contactPerson: contact || name,
          email,
          phone,
          kvkState: kvk ? 'pending' : 'unverified',
          plan: planId,
        },
        planId,
      );
      router.replace('/business');
      return;
    }
    setStep(step + 1);
  };

  return (
    <Screen header={<Header title="Provider setup" subtitle={`${step + 1} of ${STEPS.length} · ${STEPS[step]}`} back />} footer={<Button label={step === STEPS.length - 1 ? 'Open dashboard' : 'Continue'} onPress={next} />}>
      {error ? <Notice tone="error" body={error} /> : null}
      {step === 0 ? (
        <>
          <Input label="Your name" value={name} onChangeText={setName} />
          <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </>
      ) : null}
      {step === 1 ? (
        <>
          <Input label="Legal name" value={legalName} onChangeText={setLegalName} />
          <Input label="Trading name" value={trading} onChangeText={setTrading} />
          <Input label="KvK number" value={kvk} onChangeText={setKvk} keyboardType="number-pad" hint="Stored for later verification. You can continue if it is still pending." />
          <Input label="VAT number" value={vat} onChangeText={setVat} />
          <Input label="Business address" value={address} onChangeText={setAddress} />
          <Input label="City" value={city} onChangeText={setCity} />
          <Input label="Contact person" value={contact} onChangeText={setContact} />
        </>
      ) : null}
      {step === 2 ? (
        <>
          <Input label="Short introduction" value={intro} onChangeText={setIntro} multiline />
          <Text style={styles.label}>Cuisines</Text>
          <ChipGroup options={CUISINES} selected={cuisines} onToggle={(item) => setCuisines(toggleIn(cuisines, item))} />
          <Input label="Travel radius (km)" value={radius} onChangeText={setRadius} keyboardType="number-pad" />
        </>
      ) : null}
      {step === 3 ? (
        <Notice tone="info" title="Verification is pending" body="Email and phone are marked verified in this preview. KvK stays pending until a reviewer accepts it. You can still finish the listing." />
      ) : null}
      {step === 4 ? (
        <>
          <Text style={styles.lead}>Customers use ServioSpot for free. Providers pay a subscription for leads and tools. No payment is taken in this prototype.</Text>
          {plans.map((plan) => (
            <Card key={plan.id}>
              <Text style={styles.plan}>{plan.name}</Text>
              <Text style={styles.meta}>{plan.range}</Text>
              <Text style={styles.meta}>{plan.summary}</Text>
              <Button label={planId === plan.id ? 'Selected' : `Choose ${plan.name}`} variant={planId === plan.id ? 'primary' : 'secondary'} onPress={() => setPlanId(plan.id)} />
            </Card>
          ))}
          <ChipSingle options={['Selected: ' + planId]} value={'Selected: ' + planId} onChange={() => undefined} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: palette.ink },
  lead: { fontSize: 15, lineHeight: 22, color: palette.ink },
  plan: { fontSize: 18, fontWeight: '700', color: palette.ink },
  meta: { fontSize: 14, lineHeight: 20, color: palette.muted },
});
