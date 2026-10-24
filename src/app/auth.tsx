import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { leading, useType } from '@/hooks/use-type';
import { useApp } from '@/state/store';

export default function AuthScreen() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { session, verifyEmail, verifyPhone } = useApp();
  const type = useType();
  const [error, setError] = useState('');

  const finish = () => {
    if (next === 'quote' && router.canGoBack()) router.back();
    else router.replace('/customer');
  };

  return (
    <Screen header={<Header title="Your account" subtitle="Needed before a request is sent" back />}>
      <Text style={[styles.lead, { fontSize: type.body, lineHeight: leading(type.body, 7) }]}>Sending a request needs this account’s email and phone confirmed with the server.</Text>
      {error ? <Notice tone="error" body={error} /> : null}
      {!session.signedIn ? <Button label="Create account" onPress={() => router.push('/register')} /> : null}
      {session.signedIn ? (
        <>
          <Text style={[styles.line, { fontSize: type.cardTitle, lineHeight: leading(type.cardTitle, 6) }]}>{session.name}</Text>
          <Text style={[styles.line, { fontSize: type.cardTitle, lineHeight: leading(type.cardTitle, 6) }]}>{session.email}</Text>
          <Text style={[styles.line, { fontSize: type.cardTitle, lineHeight: leading(type.cardTitle, 6) }]}>{session.phone || 'No phone on this account'}</Text>
        </>
      ) : null}
      {session.signedIn && !session.emailVerified ? (
        <Button
          label="Verify email"
          variant="secondary"
          onPress={async () => {
            const result = await verifyEmail();
            setError(result.ok ? '' : result.reason);
          }}
        />
      ) : null}
      {session.signedIn && session.emailVerified && !session.phoneVerified ? (
        <Button
          label="Verify phone"
          onPress={async () => {
            if (!session.phone.trim()) {
              router.push('/account-edit');
              return;
            }
            const result = await verifyPhone();
            if (!result.ok) {
              setError(result.reason);
              return;
            }
            finish();
          }}
        />
      ) : null}
      {session.phoneVerified ? <Button label="Continue" onPress={finish} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { color: palette.muted },
  line: { color: palette.ink },
});
