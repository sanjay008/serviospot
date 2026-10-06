import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { ChipGroup } from '@/components/Chip';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { improveText } from '@/data/ai';
import { toggleIn } from '@/data/format';
import { CUISINES, NEEDS } from '@/data/mock';
import { useApp } from '@/state/store';

export default function BusinessProfileScreen() {
  const { me, updateProvider, spendAi, entitlements } = useApp();
  const [name, setName] = useState(me.name);
  const [intro, setIntro] = useState(me.intro);
  const [description, setDescription] = useState(me.description);
  const [city, setCity] = useState(me.city);
  const [radius, setRadius] = useState(String(me.radiusKm));
  const [cuisines, setCuisines] = useState(me.cuisines);
  const [services, setServices] = useState(me.services);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  return (
    <Screen
      header={<Header title="Business profile" back />}
      footer={
        <Button
          label="Save profile"
          onPress={() => {
            const nextRadius = Math.min(Number(radius) || me.radiusKm, entitlements.maxRadiusKm);
            updateProvider({ name, intro, description, city, radiusKm: nextRadius, cuisines, services });
            setRadius(String(nextRadius));
            setSaved(true);
          }}
        />
      }>
      {saved ? <Notice tone="success" body="Profile updated. Customers see this on your public page." /> : null}
      {error ? <Notice tone="error" body={error} /> : null}
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
      <Text style={styles.label}>Cuisines</Text>
      <ChipGroup options={CUISINES} selected={cuisines} onToggle={(item) => setCuisines(toggleIn(cuisines, item))} />
      <Text style={styles.label}>Services</Text>
      <ChipGroup options={NEEDS} selected={services} onToggle={(item) => setServices(toggleIn(services, item))} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: palette.ink },
});
