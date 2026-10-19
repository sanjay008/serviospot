import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { PhotoPicker } from '@/components/PhotoPicker';
import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { Header } from '@/flow2/components/Header';
import { Input } from '@/flow2/components/Input';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { useApp } from '@/flow2/state/app';

export default function CustomerProfileEditScreen() {
  const { customerAccount, setCustomerAccount, t } = useApp();
  const [name, setName] = useState(customerAccount?.name === 'Guest' ? '' : customerAccount?.name ?? '');
  const [email, setEmail] = useState(customerAccount?.email ?? '');
  const [phone, setPhone] = useState(customerAccount?.phone ?? '');
  const [photo, setPhoto] = useState(customerAccount?.photo ?? '');
  const [error, setError] = useState('');

  const save = () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!name.trim()) {
      setError(t({ en: 'Please enter your name.', nl: 'Vul je naam in.' }));
      return;
    }
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError(t({ en: 'Enter a valid email address.', nl: 'Vul een geldig e-mailadres in.' }));
      return;
    }
    if (phone.trim() && !/^[+()0-9\s-]{8,20}$/.test(phone.trim())) {
      setError(t({ en: 'Enter a valid phone number.', nl: 'Vul een geldig telefoonnummer in.' }));
      return;
    }

    setCustomerAccount({ name: name.trim(), email: cleanEmail, phone: phone.trim(), photo });
    setError('');
    router.back();
  };

  return (
    <Screen header={<Header title={t({ en: 'Edit profile', nl: 'Profiel bewerken' })} subtitle={t({ en: 'Update your personal details', nl: 'Werk je persoonlijke gegevens bij' })} back />}>
      <Card style={styles.photoCard}>
        <PhotoPicker
          centered
          shape="logo"
          label={t({ en: 'Profile photo', nl: 'Profielfoto' })}
          value={photo}
          onChange={setPhoto}
        />
        <Text style={styles.photoHint}>{t({ en: 'Choose a clear photo so providers can recognise you.', nl: 'Kies een duidelijke foto zodat providers je kunnen herkennen.' })}</Text>
      </Card>

      <Card style={styles.form}>
        <Text style={styles.sectionTitle}>{t({ en: 'Personal details', nl: 'Persoonlijke gegevens' })}</Text>
        <Input label={t({ en: 'Full name', nl: 'Volledige naam' })} value={name} onChangeText={setName} placeholder={t({ en: 'Your name', nl: 'Je naam' })} autoCapitalize="words" />
        <Input label={t({ en: 'Email address', nl: 'E-mailadres' })} value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
        <Input label={t({ en: 'Phone number', nl: 'Telefoonnummer' })} value={phone} onChangeText={setPhone} placeholder="+31 6 1234 5678" keyboardType="phone-pad" />
        {error ? <Notice tone="error" body={error} /> : null}
      </Card>

      <Button label={t({ en: 'Save changes', nl: 'Wijzigingen opslaan' })} onPress={save} style={styles.save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  photoCard: { alignItems: 'center', paddingVertical: 18 },
  photoHint: { color: palette.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', maxWidth: 270 },
  form: { gap: 13 },
  sectionTitle: { color: palette.ink, fontSize: 17, fontWeight: '800', marginBottom: 2 },
  save: { minHeight: 54, marginTop: 2 },
});
