import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { ChipGroup, ChipSingle } from '@/components/Chip';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { toggleIn } from '@/data/format';
import { CUISINES, EVENT_TYPES, NEEDS, WEEKDAYS } from '@/data/mock';
import { useApp } from '@/state/store';

export default function PreferencesScreen() {
  const { preferences, savePreferences, entitlements } = useApp();
  const [prefs, setPrefs] = useState(preferences);
  const [saved, setSaved] = useState(false);
  const set = (patch: Partial<typeof prefs>) => setPrefs({ ...prefs, ...patch });
  return (
    <Screen header={<Header title="Lead preferences" back />} footer={<Button label="Save preferences" onPress={() => { savePreferences(prefs); setSaved(true); }} />}>
      {saved ? <Notice tone="success" body="Preferences saved on this device." /> : null}
      <Text style={styles.lead}>Tell us which requests are worth your time. Stricter rules mean fewer, better leads.</Text>
      <Input label="Radius (km)" value={String(prefs.radiusKm)} onChangeText={(value) => set({ radiusKm: Number(value) || 0 })} keyboardType="number-pad" hint={`This plan allows up to ${entitlements.maxRadiusKm} km.`} />
      <Input label="Cities or regions" value={prefs.cities} onChangeText={(cities) => set({ cities })} />
      <Input label="Minimum guests" value={prefs.minGuests} onChangeText={(minGuests) => set({ minGuests })} keyboardType="number-pad" />
      <Input label="Maximum guests" value={prefs.maxGuests} onChangeText={(maxGuests) => set({ maxGuests })} keyboardType="number-pad" />
      <Input label="Minimum order €" value={prefs.minOrder} onChangeText={(minOrder) => set({ minOrder })} keyboardType="decimal-pad" />
      <Input label="Minimum € per person" value={prefs.minPerPerson} onChangeText={(minPerPerson) => set({ minPerPerson })} keyboardType="decimal-pad" />
      <Input label="Lead time (days)" value={prefs.leadTimeDays} onChangeText={(leadTimeDays) => set({ leadTimeDays })} keyboardType="number-pad" />
      <Text style={styles.label}>Audience</Text>
      <ChipSingle options={['any', 'private', 'corporate']} value={prefs.audience} onChange={(audience) => set({ audience: audience as typeof prefs.audience })} />
      <Text style={styles.label}>Cuisines</Text>
      <ChipGroup options={CUISINES} selected={prefs.cuisines} onToggle={(item) => set({ cuisines: toggleIn(prefs.cuisines, item) })} />
      <Text style={styles.label}>Services</Text>
      <ChipGroup options={NEEDS} selected={prefs.services} onToggle={(item) => set({ services: toggleIn(prefs.services, item) })} />
      <Text style={styles.label}>Event types</Text>
      <ChipGroup options={EVENT_TYPES} selected={prefs.eventTypes} onToggle={(item) => set({ eventTypes: toggleIn(prefs.eventTypes, item) })} />
      <Text style={styles.label}>Weekdays</Text>
      <ChipGroup options={WEEKDAYS} selected={prefs.weekdays} onToggle={(item) => set({ weekdays: toggleIn(prefs.weekdays, item) })} />
      {entitlements.advancedLeadFilters ? (
        <>
          <Input label="Excluded request types" value={prefs.excluded} onChangeText={(excluded) => set({ excluded })} />
          <Input label="Time window" value={prefs.timeWindow} onChangeText={(timeWindow) => set({ timeWindow })} placeholder="11:00–23:00" />
        </>
      ) : (
        <Notice tone="info" body="Excluded types and time windows are on Professional and Business. Basic radius, guest and cuisine rules are saved on this plan." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { fontSize: 15, lineHeight: 22, color: palette.ink },
  label: { fontSize: 13, fontWeight: '600', color: palette.ink },
});
