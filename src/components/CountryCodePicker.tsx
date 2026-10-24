import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { palette } from '@/constants/theme';
import { useType } from '@/hooks/use-type';

type Country = { name: string; code: string; flag: string };

// Common destinations, with the Netherlands first for ServioSpot's primary market.
const COUNTRIES: Country[] = [
  { name: 'Netherlands', code: '31', flag: '🇳🇱' }, { name: 'Belgium', code: '32', flag: '🇧🇪' },
  { name: 'Germany', code: '49', flag: '🇩🇪' }, { name: 'United Kingdom', code: '44', flag: '🇬🇧' },
  { name: 'France', code: '33', flag: '🇫🇷' }, { name: 'United States', code: '1', flag: '🇺🇸' },
  { name: 'Canada', code: '1', flag: '🇨🇦' }, { name: 'India', code: '91', flag: '🇮🇳' },
  { name: 'Suriname', code: '597', flag: '🇸🇷' }, { name: 'Turkey', code: '90', flag: '🇹🇷' },
  { name: 'Spain', code: '34', flag: '🇪🇸' }, { name: 'Italy', code: '39', flag: '🇮🇹' },
  { name: 'Portugal', code: '351', flag: '🇵🇹' }, { name: 'Ireland', code: '353', flag: '🇮🇪' },
  { name: 'Poland', code: '48', flag: '🇵🇱' }, { name: 'Sweden', code: '46', flag: '🇸🇪' },
  { name: 'Norway', code: '47', flag: '🇳🇴' }, { name: 'Denmark', code: '45', flag: '🇩🇰' },
  { name: 'Switzerland', code: '41', flag: '🇨🇭' }, { name: 'Austria', code: '43', flag: '🇦🇹' },
  { name: 'Greece', code: '30', flag: '🇬🇷' }, { name: 'Romania', code: '40', flag: '🇷🇴' },
  { name: 'Bulgaria', code: '359', flag: '🇧🇬' }, { name: 'Ukraine', code: '380', flag: '🇺🇦' },
  { name: 'Morocco', code: '212', flag: '🇲🇦' }, { name: 'Nigeria', code: '234', flag: '🇳🇬' },
  { name: 'South Africa', code: '27', flag: '🇿🇦' }, { name: 'Ghana', code: '233', flag: '🇬🇭' },
  { name: 'Australia', code: '61', flag: '🇦🇺' }, { name: 'New Zealand', code: '64', flag: '🇳🇿' },
  { name: 'China', code: '86', flag: '🇨🇳' }, { name: 'Japan', code: '81', flag: '🇯🇵' },
  { name: 'Pakistan', code: '92', flag: '🇵🇰' }, { name: 'Indonesia', code: '62', flag: '🇮🇩' },
  { name: 'Brazil', code: '55', flag: '🇧🇷' }, { name: 'Mexico', code: '52', flag: '🇲🇽' },
  { name: 'United Arab Emirates', code: '971', flag: '🇦🇪' }, { name: 'Saudi Arabia', code: '966', flag: '🇸🇦' },
];

export function CountryCodePicker({ value, countryName, onChange }: { value: string; countryName: string; onChange: (code: string, name: string) => void }) {
  const type = useType();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const selected = COUNTRIES.find((country) => country.name === countryName) ?? COUNTRIES.find((country) => country.code === value) ?? COUNTRIES[0];
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase().replace(/^\+/, '');
    if (!normalized) return COUNTRIES;
    return COUNTRIES.filter((country) => country.name.toLowerCase().includes(normalized) || country.code.includes(normalized));
  }, [query]);

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={`Country code +${selected.code}`} onPress={() => { setQuery(''); setSearching(false); setVisible(true); }} style={styles.trigger}>
        <Text style={[styles.flag, { fontSize: type.screenTitle }]}>{selected.flag}</Text>
        <Text style={[styles.code, { fontSize: type.body }]}>+{selected.code}</Text>
        <Text style={[styles.chevron, { fontSize: type.body }]}>⌄</Text>
      </Pressable>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => { setSearching(false); setVisible(false); }}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, searching && styles.sheetSearching]}>
            <View style={styles.heading}>
              <Text style={[styles.title, { fontSize: type.screenTitle }]}>Choose country</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close country picker" onPress={() => { setSearching(false); setVisible(false); }} hitSlop={12}>
                <Text style={[styles.close, { fontSize: type.sectionTitle }]}>✕</Text>
              </Pressable>
            </View>
            <TextInput value={query} onChangeText={setQuery} onFocus={() => setSearching(true)} onBlur={() => setSearching(false)} placeholder="Search country or code" placeholderTextColor={palette.muted} style={[styles.search, { fontSize: type.input }]} autoCorrect={false} />
            <ScrollView keyboardShouldPersistTaps="handled">
              {filtered.map((country) => (
                <Pressable key={`${country.name}-${country.code}`} onPress={() => { onChange(country.code, country.name); setVisible(false); }} style={styles.option}>
                  <Text style={[styles.optionFlag, { fontSize: type.screenTitle }]}>{country.flag}</Text>
                  <Text style={[styles.countryName, { fontSize: type.cardTitle }]}>{country.name}</Text>
                  <Text style={[styles.optionCode, { fontSize: type.body }]}>+{country.code}</Text>
                </Pressable>
              ))}
              {filtered.length === 0 ? <Text style={[styles.empty, { fontSize: type.secondary }]}>No countries found.</Text> : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { height: 48, minWidth: 100, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: palette.line, borderRadius: 12, backgroundColor: palette.surface },
  flag: {}, code: { fontWeight: '700', color: palette.ink }, chevron: { color: palette.muted, marginTop: -4 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20, 18, 28, 0.42)' },
  sheet: { maxHeight: '82%', minHeight: '55%', paddingTop: 20, paddingHorizontal: 20, paddingBottom: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: palette.surface },
  sheetSearching: { maxHeight: '100%', minHeight: '92%' },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }, title: { fontWeight: '700', color: palette.ink }, close: { color: palette.muted, padding: 4 },
  search: { height: 46, marginBottom: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: palette.line, borderRadius: 12, color: palette.ink },
  option: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line },
  optionFlag: { width: 28 }, countryName: { flex: 1, color: palette.ink }, optionCode: { color: palette.muted }, empty: { paddingVertical: 24, textAlign: 'center', color: palette.muted },
});
