import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { ChipGroup } from '@/components/Chip';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Notice } from '@/components/Notice';
import { PhotoPicker } from '@/components/PhotoPicker';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { improveText } from '@/data/ai';
import { toggleIn } from '@/data/format';
import { apiActions } from '@/api/actions';
import { useCategoriesSync, useVendorProfileSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

export default function BusinessProfileScreen() {
  const { me, updateProvider, spendAi, entitlements, categories, categoryName, preferences, savePreferences } = useApp();
  useCategoriesSync();
  useVendorProfileSync();
  const [photo, setPhoto] = useState(me.photo);
  const [name, setName] = useState(me.name);
  const [intro, setIntro] = useState(me.intro);
  const [description, setDescription] = useState(me.description);
  const [city, setCity] = useState(me.city);
  const [radius, setRadius] = useState(String(me.radiusKm));
  const [cuisinesText, setCuisinesText] = useState(me.cuisines.join(', '));
  const [services, setServices] = useState(me.services);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  return (
    <Screen
      header={<Header title="Business profile" back />}
      footer={
        <Button
          label="Save profile"
          loading={saving}
          onPress={async () => {
            setSaving(true);
            const cuisines = cuisinesText.split(',').map((item) => item.trim()).filter(Boolean);
            const nextRadius = Math.min(Number(radius) || preferences.radiusKm, entitlements.maxRadiusKm);
            const profile = await apiActions.vendorProfile({ name, city, description, ...(photo !== me.photo ? { photo } : {}) });
            const servicesResult = services.length ? await apiActions.vendorServices(services) : { ok: true as const, data: {} };
            const prefsResult = await savePreferences({ ...preferences, cities: city, cuisines, radiusKm: nextRadius });
            setSaving(false);
            if (!profile.ok) {
              setSaved(false);
              setError(profile.reason);
              return;
            }
            if (!servicesResult.ok) {
              setSaved(false);
              setError(servicesResult.reason);
              return;
            }
            if (!prefsResult.ok) {
              setSaved(false);
              setError(prefsResult.reason);
              return;
            }
            updateProvider({ name, intro, description, city, radiusKm: nextRadius, cuisines, services, ...(photo !== me.photo ? { photo } : {}) });
            setRadius(String(nextRadius));
            setError('');
            setSaved(true);
          }}
        />
      }>
      {saved ? <Notice tone="success" body="Profile updated. Customers see this on your public page." /> : null}
      {error ? <Notice tone="error" body={error} /> : null}
      <PhotoPicker label="Logo" shape="logo" value={photo} onChange={(uri) => { setPhoto(uri); setSaved(false); }} />
      <Input label="Trading name" value={name} onChangeText={setName} />
      <Input label="Short introduction" value={intro} onChangeText={setIntro} multiline />
      <Input label="Full description" value={description} onChangeText={setDescription} multiline />
      <Button
        label="Improve description"
        variant="ghost"
        onPress={() => {
          const credit = spendAi();
          if (!credit.ok) {
            setError(credit.reason);
            return;
          }
          setDescription(improveText(description));
          setError('');
        }}
      />
      <Input label="City" value={city} onChangeText={setCity} />
      <Input label="Radius km" value={radius} onChangeText={setRadius} keyboardType="number-pad" hint={`Plan limit ${entitlements.maxRadiusKm} km. Exact home addresses stay off the public profile.`} />
      <Input label="Cuisines" value={cuisinesText} onChangeText={setCuisinesText} hint="Separate with commas." />
      <Text style={styles.label}>Services</Text>
      <ChipGroup options={categories.map((item) => item.code)} labelOf={categoryName} selected={services} onToggle={(item) => setServices(toggleIn(services, item))} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: palette.ink },
});
