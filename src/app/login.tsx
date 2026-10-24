import { Redirect, router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useLoginMutation, type ApiFailure, type ApiRecord } from '@/api';
import { toSessionPatch } from '@/api/mappers';
import { AuthLink, AuthScreen, AuthTitle, authButton } from '@/components/AuthScreen';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Notice } from '@/components/Notice';
import { palette } from '@/constants/theme';
import { continueAfterLogin } from '@/hooks/use-login-gate';
import { useType } from '@/hooks/use-type';
import { homeFor, useApp } from '@/state/store';

function textField(record: ApiRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export default function LoginScreen() {
  const { role, from, next } = useLocalSearchParams<{ role?: string; from?: string; next?: string }>();
  const vendor = role === 'vendor';
  const { session, startSession, hydrate } = useApp();
  const type = useType();
  const [signedInOnOpen] = useState(session.signedIn);
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [resetNote, setResetNote] = useState(false);

  const submit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const nextErrors = {
      email: !cleanEmail ? 'Email is required.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ? 'Enter a valid email address.' : undefined,
      password: !password ? 'Password is required.' : password.length < 8 ? 'Password must be at least 8 characters.' : undefined,
    };
    setFieldErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    setError('');
    try {
      const reply = await login({ email: cleanEmail, password, role: vendor ? 'vendor' : 'customer' }).unwrap();
      const user = reply.user && typeof reply.user === 'object' ? (reply.user as ApiRecord) : reply;
      const destination = startSession({
        name: textField(user, 'full_name', 'name') || cleanEmail,
        email: textField(user, 'email') || cleanEmail,
        phone: textField(user, 'phone'),
        mode: vendor ? 'provider' : 'customer',
        // A vendor counts as set up once a plan is picked, so a reopen mid-flow lands on the plan screen.
        hasProviderProfile: false,
      });
      hydrate({ session: toSessionPatch(reply) });
        if (!continueAfterLogin(from, next)) router.replace(destination as any);
      } catch (failure) {
        setError((failure as ApiFailure).message || 'Could not log in. Try again.');
      }
    };

    if (signedInOnOpen) return <Redirect href={homeFor(session) as any} />;

  return (
    <AuthScreen back>
      <AuthTitle title="Welcome back" subtitle={vendor ? 'Log in to your vendor account.' : 'Log in to your account.'} />
      {error ? <Notice tone="error" body={error} /> : null}
      {resetNote ? <Notice tone="info" body="Password reset is not available yet. Contact support to reset your password." /> : null}
      <Input label="Email" value={email} onChangeText={(value) => { setEmail(value); setFieldErrors((current) => ({ ...current, email: undefined })); setError(''); }} placeholder="Email address" keyboardType="email-address" autoCapitalize="none" error={fieldErrors.email} />
      <Input label="Password" value={password} onChangeText={(value) => { setPassword(value); setFieldErrors((current) => ({ ...current, password: undefined })); setError(''); }} placeholder="At least 8 characters" secure autoCapitalize="none" error={fieldErrors.password} />
      <Button
        label="Log in"
        style={authButton}
        loading={isLoading}
        onPress={submit}
      />
      <Pressable onPress={() => setResetNote(true)} style={styles.forgot}>
        <Text style={[styles.forgotText, { fontSize: type.secondary }]}>Forgot password?</Text>
      </Pressable>
      <AuthLink before="Don't have an account?" action="Register" onPress={() => router.push(`/register${from ? `?from=${encodeURIComponent(from as any)}&next=${encodeURIComponent(next ?? from)}` : ''}` as Href)} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  forgot: { minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  forgotText: { color: palette.accentDark, fontWeight: '700' },
});
