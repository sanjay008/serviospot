import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { useApp } from '@/state/store';

export default function AuthScreen() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { session, register, verifyEmail, verifyPhone } = useApp();
  const [name, setName] = useState(session.name);
  const [email, setEmail] = useState(session.email);
  const [phone, setPhone] = useState(session.phone);
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [error, setError] = useState('');

  const finish = () => {
    if (next === 'quote' && router.canGoBack()) router.back();
    else router.replace('/customer');
  };

  return (
    <Screen header={<Header title="Your account" subtitle="Needed before a request is sent" back />}>
      <Text style={styles.lead}>Browsing stays open without an account. Sending a request needs an email and a verified phone so providers receive a real lead.</Text>
      {error ? <Notice tone="error" body={error} /> : null}
      <Input label="Name" value={name} onChangeText={setName} />
      <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+31 6" />
      {!session.signedIn ? (
        <Button
          label="Create account"
          onPress={() => {
            if (!name.trim() || !email.includes('@') || phone.trim().length < 8) {
              setError('Add your name, a valid email and a phone number.');
              return;
            }
            setError('');
            register({ name: name.trim(), email: email.trim(), phone: phone.trim() });
          }}
        />
      ) : null}
      {session.signedIn && !session.emailVerified ? (
        <>
          <Notice tone="info" body="Enter any 4-digit code. This prototype does not send email." />
          <Input label="Email code" value={emailCode} onChangeText={setEmailCode} keyboardType="number-pad" />
          <Button label="Verify email" variant="secondary" onPress={() => (emailCode.trim().length >= 4 ? verifyEmail() : setError('Enter the 4-digit email code.'))} />
        </>
      ) : null}
      {session.signedIn && session.emailVerified && !session.phoneVerified ? (
        <>
          <Notice tone="info" body="Phone verification is required before providers see the request. Any 4-digit code works here." />
          <Input label="Phone code" value={phoneCode} onChangeText={setPhoneCode} keyboardType="number-pad" />
          <Button
            label="Verify phone"
            onPress={() => {
              if (phoneCode.trim().length < 4) {
                setError('Enter the 4-digit phone code.');
                return;
              }
              verifyPhone();
              finish();
            }}
          />
        </>
      ) : null}
      {session.phoneVerified ? <Button label="Continue" onPress={finish} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { fontSize: 15, lineHeight: 22, color: palette.muted },
});
