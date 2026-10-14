import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { ChipGroup } from '@/components/Chip';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { toggleIn } from '@/data/format';
import { useCategoriesSync, usePreferencesSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

export default function PreferencesScreen() {
  const { preferences, savePreferences, entitlements, categories, categoryName } = useApp();
  useCategoriesSync();
  usePreferencesSync();
  const [prefs, setPrefs] = useState(preferences);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const set = (patch: Partial<typeof prefs>) => setPrefs({ ...prefs, ...patch });
  return (
    <Screen header={<Header title="Lead preferences" back />} footer={<Button label="Save preferences" onPress={async () => {
      const result = await savePreferences(prefs);
      setSaved(result.ok);
      setError(result.ok ? '' : result.reason);
    }} />}>
      {error ? <Notice tone="error" body={error} /> : null}
      {saved ? <Notice tone="success" body="Preferences saved." /> : null}
      <Text style={styles.lead}>Tell us which requests are worth your time. Stricter rules mean fewer, better leads.</Text>
      <Input label="Radius (km)" value={String(prefs.radiusKm)} onChangeText={(value) => set({ radiusKm: Number(value) || 0 })} keyboardType="number-pad" hint={`This plan allows up to ${entitlements.maxRadiusKm} km.`} />
      <Input label="Cities or regions" value={prefs.cities} onChangeText={(cities) => set({ cities })} />
      <Input label="Minimum guests" value={prefs.minGuests} onChangeText={(minGuests) => set({ minGuests })} keyboardType="number-pad" />
      <Input label="Maximum guests" value={prefs.maxGuests} onChangeText={(maxGuests) => set({ maxGuests })} keyboardType="number-pad" />
      <Input label="Minimum order €" value={prefs.minOrder} onChangeText={(minOrder) => set({ minOrder })} keyboardType="decimal-pad" />
      <Input label="Minimum € per person" value={prefs.minPerPerson} onChangeText={(minPerPerson) => set({ minPerPerson })} keyboardType="decimal-pad" />
      <Input label="Lead time (days)" value={prefs.leadTimeDays} onChangeText={(leadTimeDays) => set({ leadTimeDays })} keyboardType="number-pad" />
      <Input label="Cuisines" value={prefs.cuisines.join(', ')} onChangeText={(value) => set({ cuisines: splitList(value) })} hint="Separate with commas." />
      <Text style={styles.label}>Services</Text>
      <ChipGroup options={categories.map((item) => item.code)} labelOf={categoryName} selected={prefs.services} onToggle={(item) => set({ services: toggleIn(prefs.services, item) })} />
      {entitlements.advancedLeadFilters ? (
        <>
          <Input label="Excluded request types" value={prefs.excluded} onChangeText={(excluded) => set({ excluded })} />
          <Input label="Time window" value={prefs.timeWindow} onChangeText={(timeWindow) => set({ timeWindow })} placeholder="11:00–23:00" />
        </>
      ) : (
        <Notice tone="info" body="Excluded types and time windows are on Gold and Platinum. Basic radius, guest and cuisine rules are saved on this plan." />
      )}
    </Screen>
  );
}

function splitList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

const styles = StyleSheet.create({
  lead: { fontSize: 15, lineHeight: 22, color: palette.ink },
  label: { fontSize: 13, fontWeight: '600', color: palette.ink },
});
