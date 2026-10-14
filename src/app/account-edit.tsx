import { Redirect } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { PhotoPicker } from '@/components/PhotoPicker';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { useMeSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

export default function AccountEditScreen() {
  const { session } = useApp();
  useMeSync();
  const [name, setName] = useState(session.name);
  const [email, setEmail] = useState(session.email);
  const [phone, setPhone] = useState(session.phone);
  const [photo, setPhoto] = useState(session.photo);

  if (!session.signedIn) return <Redirect href="/role" />;

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
      <Text style={styles.note}>
        These details come from your account. The server has no call to save a photo, name, email, or phone change, so nothing is sent from this screen.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { fontSize: 13, lineHeight: 18, color: palette.muted },
});
