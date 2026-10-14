import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/theme';

type LabelOf<T extends string> = (option: T) => string;
const same = <T extends string>(option: T): string => option;

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!selected }} onPress={onPress} style={[styles.chip, selected && styles.on]}>
      <Text style={[styles.text, selected && styles.onText]}>{label}</Text>
    </Pressable>
  );
}

export function ChipGroup<T extends string>({ options, selected, onToggle, labelOf = same }: { options: T[]; selected: T[]; onToggle: (item: T) => void; labelOf?: LabelOf<T> }) {
  return (
    <View style={styles.row}>
      {options.map((option) => (
        <Chip key={option} label={labelOf(option)} selected={selected.includes(option)} onPress={() => onToggle(option)} />
      ))}
    </View>
  );
}

export function ChipSingle<T extends string>({ options, value, onChange, labelOf = same }: { options: T[]; value: T; onChange: (value: T) => void; labelOf?: LabelOf<T> }) {
  return (
    <View style={styles.row}>
      {options.map((option) => (
        <Chip key={option} label={labelOf(option)} selected={value === option} onPress={() => onChange(option)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 40, maxWidth: '100%', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.well, borderWidth: 1, borderColor: palette.line },
  on: { backgroundColor: palette.accent, borderColor: palette.accent },
  text: { color: palette.ink, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  onText: { color: '#fff' },
});
