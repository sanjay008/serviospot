import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { Header } from '@/flow2/components/Header';
import { Input } from '@/flow2/components/Input';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
import { CountryCodePicker } from '@/components/CountryCodePicker';
import { palette } from '@/flow2/constants/theme';
import { useApp } from '@/flow2/state/app';

type AuthMode = 'login' | 'register';

export default function CustomerAuthScreen() {
  const { customerAccount, setCustomerAccount } = useApp();
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState(customerAccount?.name ?? '');
  const [email, setEmail] = useState(customerAccount?.email ?? '');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(customerAccount?.phone ?? '');
  const [countryCode, setCountryCode] = useState('31');
  const [countryName, setCountryName] = useState('Netherlands');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string; phone?: string }>({});

  const openAsGuest = () => router.replace('/customer' as any);

  const submit = () => {
    const cleanEmail = email.trim().toLowerCase();
    const nextErrors = {
      name: mode === 'register' && !name.trim() ? 'Enter your full name.' : undefined,
      email: !cleanEmail ? 'Email is required.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ? 'Enter a valid email address.' : undefined,
      password: !password ? 'Password is required.' : password.length < 8 ? 'Password must be at least 8 characters.' : undefined,
      phone: mode === 'register' && !phone.trim() ? 'Phone number is required.' : mode === 'register' && (!/^[0-9\s()\-+]+$/.test(phone.trim()) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15) ? 'Enter a valid phone number.' : undefined,
    };
    setFieldErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setError('');
    setCustomerAccount({
      name: mode === 'register' ? name.trim() : customerAccount?.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      phone: mode === 'register' ? `+${countryCode} ${phone.trim()}` : customerAccount?.phone ?? '',
      photo: customerAccount?.photo,
    });
    router.replace('/customer' as any);
  };

  const registering = mode === 'register';

  return (
    <Screen
      header={
        <Header
          title="ServioSpot"
          back
          right={
            <Pressable accessibilityRole="button" onPress={openAsGuest} hitSlop={8}>
              <Text style={styles.skipLink}>Skip</Text>
            </Pressable>
          }
        />
      }>
      <View style={styles.intro}>
        <Text style={styles.title}>{registering ? 'Create your account' : 'Welcome back'}</Text>
        <Text style={styles.subtitle}>{registering ? 'Register to manage your event requests.' : 'Log in to continue to your customer account.'}</Text>
      </View>

      <Card style={styles.form}>
        {registering ? <Input label="Full name" value={name} onChangeText={(value) => { setName(value); setFieldErrors((current) => ({ ...current, name: undefined })); }} placeholder="Your name" autoCapitalize="words" error={fieldErrors.name} /> : null}
        <Input label="Email" value={email} onChangeText={(value) => { setEmail(value); setFieldErrors((current) => ({ ...current, email: undefined })); }} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" error={fieldErrors.email} />
        <Input label="Password" value={password} onChangeText={(value) => { setPassword(value); setFieldErrors((current) => ({ ...current, password: undefined })); }} placeholder="At least 8 characters" secure autoCapitalize="none" error={fieldErrors.password} />
        {registering ? (
          <View style={styles.phoneField}>
            <Text style={styles.phoneLabel}>Phone number</Text>
            <View style={styles.phoneRow}>
              <CountryCodePicker value={countryCode} countryName={countryName} onChange={(code, country) => { setCountryCode(code); setCountryName(country); setFieldErrors((current) => ({ ...current, phone: undefined })); }} />
              <View style={styles.phoneInput}>
                <Input value={phone} onChangeText={(value) => { setPhone(value); setFieldErrors((current) => ({ ...current, phone: undefined })); }} placeholder="6 1234 5678" keyboardType="phone-pad" error={fieldErrors.phone} />
              </View>
            </View>
          </View>
        ) : null}
        {error ? <Notice tone="error" body={error} /> : null}
        <Button label={registering ? 'Register' : 'Login'} onPress={submit} style={styles.submit} />

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>{registering ? 'Already have an account?' : 'New to ServioSpot?'}</Text>
          <Pressable accessibilityRole="button" onPress={() => { setError(''); setFieldErrors({}); setMode(registering ? 'login' : 'register'); }}>
            <Text style={styles.switchAction}>{registering ? 'Login' : 'Register'}</Text>
          </Pressable>
        </View>
      </Card>

      <Text style={styles.demoNote}>Demo mode · account details stay on this device.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: 5, marginTop: 12 },
  title: { color: palette.ink, fontSize: 26, fontWeight: '800' },
  subtitle: { color: palette.muted, fontSize: 14, lineHeight: 20 },
  form: { gap: 14, padding: 18 },
  phoneField: { gap: 6 },
  phoneLabel: { color: palette.ink, fontSize: 15, fontWeight: '700' },
  phoneRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  phoneInput: { flex: 1 },
  submit: { marginTop: 2, minHeight: 52 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  switchText: { color: palette.muted, fontSize: 14 },
  switchAction: { color: palette.accentDark, fontSize: 14, fontWeight: '800' },
  skipLink: { color: palette.accentDark, fontSize: 14, fontWeight: '700' },
  demoNote: { textAlign: 'center', color: palette.muted, fontSize: 11, marginTop: 5 },
});
