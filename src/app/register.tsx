import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { useApp } from '@/state/store';

export default function RegisterScreen() {
  const { session, registerAccount } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'customer' | 'provider'>('customer');
  const [error, setError] = useState('');

  if (session.signedIn) {
    if (session.mode === 'provider') return <Redirect href={session.hasProviderProfile ? '/business' : '/setup'} />;
    return <Redirect href="/customer" />;
  }

  return (
    <Screen header={<Header title="Create account" back />}>
      <Text style={styles.body}>Tell us who you are. You can switch later from your profile.</Text>
      {error ? <Notice tone="error" body={error} /> : null}
      <View style={styles.roles}>
        <Role label="Customer" caption="Find catering" selected={mode === 'customer'} onPress={() => setMode('customer')} />
        <Role label="Provider" caption="Run a business" selected={mode === 'provider'} onPress={() => setMode('provider')} />
      </View>
      <Input label="Name" value={name} onChangeText={setName} placeholder="Your name" />
      <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" />
      <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="+31 6" keyboardType="phone-pad" />
      <Input label="Password" value={password} onChangeText={setPassword} placeholder="At least 6 characters" secure autoCapitalize="none" />
      <Button
        label="Create account"
        onPress={() => {
          if (!name.trim() || !email.includes('@') || phone.trim().length < 8 || password.length < 6) {
            setError('Add your name, a valid email, a phone number and a password of at least 6 characters.');
            return;
          }
          const result = registerAccount({ name, email, phone, password, mode });
          if (!result.ok) {
            setError(result.reason);
            return;
          }
          router.replace(result.destination ?? '/customer');
        }}
      />
      <Pressable onPress={() => router.back()} style={styles.linkHit}>
        <Text style={styles.link}>
          Already have an account? <Text style={styles.linkStrong}>Log in</Text>
        </Text>
      </Pressable>
    </Screen>
  );
}

function Role({ label, caption, selected, onPress }: { label: string; caption: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.role, selected && styles.roleOn]}>
      <Text style={[styles.roleLabel, selected && styles.roleLabelOn]}>{label}</Text>
      <Text style={styles.roleCaption}>{caption}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 15, lineHeight: 21, color: palette.muted },
  roles: { flexDirection: 'row', gap: 10 },
  role: { flex: 1, borderRadius: 14, borderWidth: 1, borderColor: palette.line, padding: 12, gap: 2, backgroundColor: palette.well },
  roleOn: { borderColor: palette.accent, backgroundColor: palette.accentSoft },
  roleLabel: { fontSize: 15, fontWeight: '700', color: palette.ink },
  roleLabelOn: { color: palette.accentDark },
  roleCaption: { fontSize: 12, color: palette.muted },
  linkHit: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  link: { color: palette.muted, fontSize: 15 },
  linkStrong: { color: palette.accent, fontWeight: '700' },
});
