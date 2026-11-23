import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { API_ENABLED, useUpdateMeMutation } from '@/api';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Notice } from '@/components/Notice';
import { PhotoPicker } from '@/components/PhotoPicker';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { useMeSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

export default function AccountEditScreen() {
  const { session, hydrate } = useApp();
  useMeSync();
  const [updateMe, updateState] = useUpdateMeMutation();
  const [name, setName] = useState(session.name);
  const [email, setEmail] = useState(session.email);
  const [phone, setPhone] = useState(session.phone);
  const [photo, setPhoto] = useState(session.photo);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(session.name);
    setEmail(session.email);
    setPhone(session.phone);
    setPhoto(session.photo);
  }, [session.name, session.email, session.phone, session.photo]);

  if (!session.signedIn) return <Redirect href="/" />;

  const save = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    setSaved(false);

    if (session.accountId === undefined || String(session.accountId).trim() === '') {
      setError('Your account ID is not loaded yet. Sign in again, then retry saving.');
      return;
    }

    if (!API_ENABLED) {
      setError('Connect to the API to save profile changes.');
      return;
    }

    try {
      await updateMe({
        id: session.accountId,
        full_name: name.trim(),
        email: cleanEmail || undefined,
        phone: phone.trim() || undefined,
        photo: photo || undefined,
      }).unwrap();
      hydrate({ session: { name: name.trim(), email: cleanEmail, phone: phone.trim(), photo } });
      setSaved(true);
      router.back();
    } catch (failure) {
      const message =
        failure && typeof failure === 'object' && 'message' in failure && typeof (failure as { message: unknown }).message === 'string'
          ? (failure as { message: string }).message
          : 'Could not save your profile. Please try again.';
      setError(message);
    }
  };

  return (
    <Screen header={<Header title="Edit account" subtitle="Your photo, name, email and phone" back />}>
      <PhotoPicker label="" shape="logo" centered value={photo} onChange={setPhoto} />
      <Input label="Name" value={name} onChangeText={setName} placeholder="Name" autoCapitalize="words" />
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        hint={session.emailVerified ? 'Verified' : 'Not verified yet'}
      />
      <Input
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        placeholder="+31 6 1234 5678"
        keyboardType="phone-pad"
        hint={session.phoneVerified ? 'Verified' : 'Not verified yet'}
      />
      {error ? <Notice tone="error" body={error} /> : null}
      {saved ? <Notice tone="success" body="Profile saved." /> : null}
      <Button label="Save changes" loading={updateState.isLoading} onPress={() => void save()} style={styles.save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  save: { marginTop: 8, backgroundColor: palette.accent },
});
