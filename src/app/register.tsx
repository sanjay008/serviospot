import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useRegisterMutation, type ApiFailure } from '@/api';
import { toSessionPatch } from '@/api/mappers';
import { AuthLink, AuthScreen, AuthTitle, authButton } from '@/components/AuthScreen';
import { Button } from '@/components/Button';
import { CountryCodePicker } from '@/components/CountryCodePicker';
import { Input } from '@/components/Input';
import { Notice } from '@/components/Notice';
import { palette } from '@/constants/theme';
import { continueAfterLogin } from '@/hooks/use-login-gate';
import { useType } from '@/hooks/use-type';
import { homeFor, useApp } from '@/state/store';

export default function RegisterScreen() {
  const { from, next } = useLocalSearchParams<{ from?: string; next?: string }>();
  const { session, startSession, hydrate } = useApp();
  const type = useType();
  const [signedInOnOpen] = useState(session.signedIn);
  const [registerUser, { isLoading }] = useRegisterMutation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('31');
  const [countryName, setCountryName] = useState('Netherlands');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; phone?: string; password?: string }>({});

  if (signedInOnOpen) return <Redirect href={homeFor(session) as any} />;

  const finish = (destination: '/customer' | '/vendor' | undefined) => {
    if (!continueAfterLogin(from, next)) router.replace(destination ?? '/customer' as any);
  };

  const submit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const nextErrors = {
      name: !name.trim() ? 'Name is required.' : undefined,
      email: !cleanEmail ? 'Email is required.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ? 'Enter a valid email address.' : undefined,
      phone: !phone.trim() ? 'Phone number is required.' : !/^[0-9\s()\-+]+$/.test(phone.trim()) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15 ? 'Enter a valid phone number.' : undefined,
      password: !password ? 'Password is required.' : password.length < 8 ? 'Password must be at least 8 characters.' : undefined,
    };
    setFieldErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    setError('');
    try {
      const reply = await registerUser({
        role: 'customer',
        full_name: name.trim(),
        email: cleanEmail,
        password,
        country_code: countryCode,
        phone: phone.replace(/\D/g, '').replace(/^0+/, ''),
      }).unwrap();
      const destination = startSession({ name: name.trim(), email: cleanEmail, phone: `+${countryCode} ${phone.trim()}`, mode: 'customer', hasProviderProfile: false });
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
      <Input label="Name" value={name} onChangeText={(value) => { setName(value); setFieldErrors((current) => ({ ...current, name: undefined })); setError(''); }} placeholder="Name" error={fieldErrors.name} />
      <Input label="Email" value={email} onChangeText={(value) => { setEmail(value); setFieldErrors((current) => ({ ...current, email: undefined })); setError(''); }} placeholder="Email" keyboardType="email-address" autoCapitalize="none" error={fieldErrors.email} />
      <View style={styles.phoneField}>
        <Text style={[styles.phoneLabel, { fontSize: type.label }]}>Phone</Text>
        <View style={styles.phoneRow}>
          <CountryCodePicker value={countryCode} countryName={countryName} onChange={(code, country) => { setCountryCode(code); setCountryName(country); setFieldErrors((current) => ({ ...current, phone: undefined })); }} />
          <View style={styles.phoneInput}><Input value={phone} onChangeText={(value) => { setPhone(value); setFieldErrors((current) => ({ ...current, phone: undefined })); setError(''); }} placeholder="Phone number" keyboardType="phone-pad" error={fieldErrors.phone} /></View>
        </View>
      </View>
      <Input label="Password" value={password} onChangeText={(value) => { setPassword(value); setFieldErrors((current) => ({ ...current, password: undefined })); setError(''); }} placeholder="At least 8 characters" secure autoCapitalize="none" error={fieldErrors.password} />
      <Button label="Register" style={authButton} loading={isLoading} onPress={submit} />
      <AuthLink before="Already have an account?" action="Log in" onPress={() => router.push('/login' as any)} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  phoneField: { gap: 6 },
  phoneLabel: { fontWeight: '700', color: palette.ink },
  phoneRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  phoneInput: { flex: 1 },
});
