import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { Header } from '@/flow2/components/Header';
import { Input } from '@/flow2/components/Input';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
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
  const [error, setError] = useState('');

  const openAsGuest = () => router.replace('/customer' as any);

  const submit = () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('Enter your full name.');
      return;
    }
    if (mode === 'register' && !/^[+()0-9\s-]{8,20}$/.test(phone.trim())) {
      setError('Enter a valid phone number.');
      return;
    }

    setError('');
    setCustomerAccount({
      name: mode === 'register' ? name.trim() : customerAccount?.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      phone: mode === 'register' ? phone.trim() : customerAccount?.phone ?? '',
      photo: customerAccount?.photo,
    });
    router.replace('/customer' as any);
  };

  const registering = mode === 'register';

  return (
    <Screen header={<Header title="ServioSpot" back />}>
      <View style={styles.intro}>
        <Text style={styles.title}>{registering ? 'Create your account' : 'Welcome back'}</Text>
        <Text style={styles.subtitle}>{registering ? 'Register to manage your event requests.' : 'Log in to continue to your customer account.'}</Text>
      </View>

      <Card style={styles.form}>
        {registering ? <Input label="Full name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" /> : null}
        <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
        <Input label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secure autoCapitalize="none" />
        {registering ? <Input label="Phone number" value={phone} onChangeText={setPhone} placeholder="+31 6 1234 5678" keyboardType="phone-pad" /> : null}
        {error ? <Notice tone="error" body={error} /> : null}
        <Button label={registering ? 'Register' : 'Login'} onPress={submit} style={styles.submit} />

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>{registering ? 'Already have an account?' : 'New to ServioSpot?'}</Text>
          <Pressable accessibilityRole="button" onPress={() => { setError(''); setMode(registering ? 'login' : 'register'); }}>
            <Text style={styles.switchAction}>{registering ? 'Login' : 'Register'}</Text>
          </Pressable>
        </View>
      </Card>

      <View style={styles.guest}>
        <Text style={styles.guestLabel}>Just browsing?</Text>
        <Button label="Skip for now" variant="secondary" onPress={openAsGuest} />
      </View>
      <Text style={styles.demoNote}>Demo mode · account details stay on this device.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: 5, marginTop: 12 },
  title: { color: palette.ink, fontSize: 26, fontWeight: '800' },
  subtitle: { color: palette.muted, fontSize: 14, lineHeight: 20 },
  form: { gap: 14, padding: 18 },
  submit: { marginTop: 2, minHeight: 52 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  switchText: { color: palette.muted, fontSize: 14 },
  switchAction: { color: palette.accentDark, fontSize: 14, fontWeight: '800' },
  guest: { gap: 8, alignItems: 'center', marginTop: 3 },
  guestLabel: { color: palette.muted, fontSize: 13 },
  demoNote: { textAlign: 'center', color: palette.muted, fontSize: 11, marginTop: 5 },
});
