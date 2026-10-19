import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { PhotoPicker } from '@/components/PhotoPicker';
import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { Header } from '@/flow2/components/Header';
import { Input } from '@/flow2/components/Input';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { useApp } from '@/flow2/state/app';

export default function VendorProfileEditScreen() {
  const { onboarding, patchOnboarding } = useApp();
  const [profileName, setProfileName] = useState(onboarding.profileName);
  const [company, setCompany] = useState(onboarding.company);
  const [city, setCity] = useState(onboarding.city);
  const [description, setDescription] = useState(onboarding.description);
  const [fromPrice, setFromPrice] = useState(onboarding.fromPrice);
  const [photo, setPhoto] = useState(onboarding.profileImageUri ?? '');

  const save = () => {
    patchOnboarding({
      profileName: profileName.trim(),
      company: company.trim(),
      city: city.trim(),
      description: description.trim(),
      fromPrice: fromPrice.trim(),
      profileImageUri: photo,
    });
    router.back();
  };

  return (
    <Screen header={<Header title="Edit profile" subtitle="Update your public vendor details" back />}>
      <Card style={styles.photoCard}>
        <PhotoPicker centered shape="logo" label="Profile photo" value={photo} onChange={setPhoto} />
        <Text style={styles.photoHint}>Choose a clear photo of your business or catering team.</Text>
      </Card>

      <Card style={styles.form}>
        <Text style={styles.sectionTitle}>Business details</Text>
        <Input label="Public profile name" value={profileName} onChangeText={setProfileName} placeholder="Name customers will see" autoCapitalize="words" />
        <Input label="Business name" value={company} onChangeText={setCompany} placeholder="Your business name" autoCapitalize="words" />
        <Input label="City" value={city} onChangeText={setCity} placeholder="Your city" autoCapitalize="words" />
        <Input label="Profile description" value={description} onChangeText={setDescription} placeholder="Tell customers about your catering" multiline />
        <Input label="Starting price per guest (€)" value={fromPrice} onChangeText={setFromPrice} placeholder="e.g. 25" keyboardType="decimal-pad" />
      </Card>

      <Button label="Save changes" onPress={save} style={styles.save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  photoCard: { alignItems: 'center', paddingVertical: 18 },
  photoHint: { color: palette.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', maxWidth: 280 },
  form: { gap: 13 },
  sectionTitle: { color: palette.ink, fontSize: 17, fontWeight: '800', marginBottom: 2 },
  save: { minHeight: 54, marginTop: 2 },
});
