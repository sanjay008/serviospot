import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { useRegisterMutation, type ApiFailure } from '@/api';
import { toSessionPatch } from '@/api/mappers';
import { AuthLink, AuthScreen, AuthTitle, authButton } from '@/components/AuthScreen';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Notice } from '@/components/Notice';
import { splitPhone } from '@/data/format';
import { continueAfterLogin } from '@/hooks/use-login-gate';
import { homeFor, useApp } from '@/state/store';

export default function RegisterScreen() {
  const { role, from, next } = useLocalSearchParams<{ role?: string; from?: string; next?: string }>();
  const vendor = role === 'vendor';
  const { session, startSession, hydrate } = useApp();
  const [signedInOnOpen] = useState(session.signedIn);
  const [registerUser, { isLoading }] = useRegisterMutation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (vendor) return <Redirect href="/vendor-onboarding" />;
  if (signedInOnOpen) return <Redirect href={homeFor(session)} />;

  const finish = (destination: '/customer' | '/business' | '/vendor-onboarding' | undefined) => {
    if (!continueAfterLogin(from, next)) router.replace(destination ?? '/customer');
  };

  const submit = async () => {
    if (!name.trim() || !email.includes('@') || phone.trim().length < 8 || password.length < 6) {
      setError('Add your name, a valid email, a phone number and a password of at least 6 characters.');
      return;
    }
    setError('');
    const cleanEmail = email.trim().toLowerCase();
    try {
      const reply = await registerUser({
        role: 'customer',
        full_name: name.trim(),
        email: cleanEmail,
        password,
        ...splitPhone(phone),
      }).unwrap();
      const destination = startSession({ name: name.trim(), email: cleanEmail, phone: phone.trim(), mode: 'customer', hasProviderProfile: false });
      hydrate({ session: toSessionPatch(reply) });
      finish(destination);
    } catch (failure) {
      setError((failure as ApiFailure).message || 'Could not create the account. Try again.');
    }
  };

  return (
    <AuthScreen back>
      <AuthTitle
        title="Create account"
        subtitle="Join ServioSpot."
      />
      {error ? <Notice tone="error" body={error} /> : null}
      <Input label="Name" value={name} onChangeText={setName} placeholder="Name" />
      <Input label="Email" value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />
      <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" />
      <Input label="Password" value={password} onChangeText={setPassword} placeholder="Password" secure autoCapitalize="none" />
      <Button label="Register" style={authButton} loading={isLoading} onPress={submit} />
      <AuthLink before="Already have an account?" action="Log in" onPress={() => router.push('/login')} />
    </AuthScreen>
  );
}
