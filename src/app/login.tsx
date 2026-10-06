import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { useApp } from '@/state/store';

export default function LoginScreen() {
  const { session, signIn } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (session.signedIn) {
    if (session.mode === 'provider') return <Redirect href={session.hasProviderProfile ? '/business' : '/setup'} />;
    return <Redirect href="/customer" />;
  }

  return (
    <Screen>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Text style={styles.mark}>S</Text>
        </View>
        <Text style={styles.title}>Log in</Text>
        <Text style={styles.body}>Use your ServioSpot email and password.</Text>
      </View>
      {error ? <Notice tone="error" body={error} /> : null}
      <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" />
      <Input label="Password" value={password} onChangeText={setPassword} placeholder="Password" secure autoCapitalize="none" />
      <Button
        label="Log in"
        onPress={() => {
          if (!email.includes('@') || password.length < 6) {
            setError('Enter your email and a password of at least 6 characters.');
            return;
          }
          const result = signIn({ email, password });
          if (!result.ok) {
            setError(result.reason);
            return;
          }
          router.replace(result.destination ?? '/customer');
        }}
      />
      <Pressable onPress={() => router.push('/register')} style={styles.linkHit}>
        <Text style={styles.link}>
          New here? <Text style={styles.linkStrong}>Create an account</Text>
        </Text>
      </Pressable>
      <Text style={styles.hint}>Sample customer: anna.devries@example.nl / demo123{'\n'}Sample provider: hello@mangoandco.nl / demo123</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { gap: 6, paddingTop: 28, paddingBottom: 8 },
  logo: { width: 52, height: 52, borderRadius: 16, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  mark: { color: '#fff', fontSize: 24, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '700', color: palette.ink },
  body: { fontSize: 15, lineHeight: 21, color: palette.muted },
  linkHit: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  link: { color: palette.muted, fontSize: 15 },
  linkStrong: { color: palette.accent, fontWeight: '700' },
  hint: { color: palette.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
