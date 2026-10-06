import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/theme';

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!selected }} onPress={onPress} style={[styles.chip, selected && styles.on]}>
      <Text style={[styles.text, selected && styles.onText]}>{label}</Text>
    </Pressable>
  );
}

export function ChipGroup({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (item: string) => void }) {
  return (
    <View style={styles.row}>
      {options.map((option) => (
        <Chip key={option} label={option} selected={selected.includes(option)} onPress={() => onToggle(option)} />
      ))}
    </View>
  );
}

export function ChipSingle({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.row}>
      {options.map((option) => (
        <Chip key={option} label={option} selected={value === option} onPress={() => onChange(option)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 36, borderRadius: 999, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.well, borderWidth: 1, borderColor: palette.line },
  on: { backgroundColor: palette.accent, borderColor: palette.accent },
  text: { color: palette.ink, fontSize: 14, fontWeight: '500' },
  onText: { color: '#fff' },
});
