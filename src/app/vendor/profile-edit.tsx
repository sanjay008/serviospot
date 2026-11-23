import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { API_ENABLED, useGetVendorProfileQuery, useUpdateVendorProfileMutation } from '@/api';
import { recordOf, textOf } from '@/api/mappers';
import { PhotoPicker } from '@/components/PhotoPicker';
import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { Header } from '@/flow2/components/Header';
import { Input } from '@/flow2/components/Input';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { useApp } from '@/flow2/state/app';
import { leading, useType } from '@/hooks/use-type';

export default function VendorProfileEditScreen() {
  const { onboarding, patchOnboarding } = useApp();
  const type = useType();
  const profileQuery = useGetVendorProfileQuery(undefined, { skip: !API_ENABLED });
  const [updateVendorProfile, updateState] = useUpdateVendorProfileMutation();
  const [profileName, setProfileName] = useState(onboarding.profileName);
  const [company, setCompany] = useState(onboarding.company);
  const [city, setCity] = useState(onboarding.city);
  const [description, setDescription] = useState(onboarding.description);
  const [fromPrice, setFromPrice] = useState(onboarding.fromPrice);
  const [photo, setPhoto] = useState(onboarding.profileImageUri ?? '');
  const [error, setError] = useState('');

  useEffect(() => {
    // Postman/PHP wraps the vendor under `profile`.
    const record = recordOf(profileQuery.data, 'profile', 'vendor', 'provider') ?? (profileQuery.data && typeof profileQuery.data === 'object' ? profileQuery.data : null);
    if (!record) return;
    const name = textOf(record, 'name', 'profile_name', 'public_name');
    const business = textOf(record, 'business_name', 'company', 'company_name', 'legal_name');
    const nextCity = textOf(record, 'city');
    const story = textOf(record, 'story', 'description', 'about');
    const image = textOf(record, 'photo', 'logo', 'image', 'profile_photo');
    const cents = typeof record.starting_price_cents === 'number'
      ? record.starting_price_cents
      : typeof record.from_price_cents === 'number'
        ? record.from_price_cents
        : null;
    const price = textOf(record, 'from_price') || (cents != null ? String(cents / 100) : '');
    if (name) setProfileName(name);
    if (business) setCompany(business);
    if (nextCity) setCity(nextCity);
    if (story) setDescription(story);
    if (image) setPhoto(image);
    if (price) setFromPrice(price);
  }, [profileQuery.data]);

  const save = async () => {
    if (!profileName.trim()) {
      setError('Enter a public profile name.');
      return;
    }
    setError('');

    if (API_ENABLED) {
      try {
        const cents = Math.round(Number(fromPrice.replace(',', '.')) * 100);
        await updateVendorProfile({
          name: profileName.trim(),
          business_name: company.trim() || undefined,
          city: city.trim() || undefined,
          story: description.trim() || undefined,
          logo: photo || undefined,
          photo: photo || undefined,
          from_price: fromPrice.trim() || undefined,
          from_price_cents: Number.isFinite(cents) && cents > 0 ? cents : undefined,
        }).unwrap();
      } catch (failure) {
        const message =
          failure && typeof failure === 'object' && 'message' in failure && typeof (failure as { message: unknown }).message === 'string'
            ? (failure as { message: string }).message
            : 'Could not save your profile. Please try again.';
        setError(message);
        return;
      }
    }

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
    <Screen
      loading={API_ENABLED && profileQuery.isLoading}
      refreshing={profileQuery.isFetching && !profileQuery.isLoading}
      onRefresh={API_ENABLED ? () => { void profileQuery.refetch(); } : undefined}
      header={<Header title="Edit profile" subtitle="Update your public vendor details" back />}>
      <Card style={styles.photoCard}>
        <PhotoPicker centered shape="logo" label="Profile photo" value={photo} onChange={setPhoto} />
        <Text style={[styles.photoHint, { fontSize: type.small, lineHeight: leading(type.small, 6) }]}>
          Choose a clear photo of your business or catering team.
        </Text>
      </Card>

      <Card style={styles.form}>
        <Text style={[styles.sectionTitle, { fontSize: type.sectionTitle }]}>Business details</Text>
        <Input label="Public profile name" value={profileName} onChangeText={setProfileName} placeholder="Name customers will see" autoCapitalize="words" />
        <Input label="Business name" value={company} onChangeText={setCompany} placeholder="Your business name" autoCapitalize="words" />
        <Input label="City" value={city} onChangeText={setCity} placeholder="Your city" autoCapitalize="words" />
        <Input label="Profile description" value={description} onChangeText={setDescription} placeholder="Tell customers about your catering" multiline />
        <Input label="Starting price per guest (€)" value={fromPrice} onChangeText={setFromPrice} placeholder="e.g. 25" keyboardType="decimal-pad" />
        {error ? <Notice tone="error" body={error} /> : null}
      </Card>

      <Button label="Save changes" loading={updateState.isLoading} onPress={() => void save()} style={styles.save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  photoCard: { alignItems: 'center', paddingVertical: 18 },
  photoHint: { color: palette.muted, textAlign: 'center', maxWidth: 280 },
  form: { gap: 13 },
  sectionTitle: { color: palette.ink, fontWeight: '800', marginBottom: 2 },
  save: { minHeight: 54, marginTop: 2 },
});
