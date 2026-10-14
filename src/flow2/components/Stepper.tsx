import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/flow2/components/Icon';
import { palette } from '@/flow2/constants/theme';

export function Stepper({ label, value, onChange, min = 0, max = 999 }: { label?: string; value: number; onChange: (value: number) => void; min?: number; max?: number }) {
  const clamp = (next: number) => Math.max(min, Math.min(max, next));
  return (
    <View style={styles.row}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Decrease"
          onPress={() => onChange(clamp(value - 1))}
          disabled={value <= min}
          style={[styles.btn, value <= min && styles.disabled]}>
          <Icon name="close" color={palette.accent} size={14} />
        </Pressable>
        <Text style={styles.value}>{value}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Increase" onPress={() => onChange(clamp(value + 1))} disabled={value >= max} style={[styles.btn, value >= max && styles.disabled]}>
          <Icon name="plus" color={palette.accent} size={16} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 44 },
  label: { flex: 1, fontSize: 15, color: palette.ink },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.well, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: palette.line },
  btn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  disabled: { opacity: 0.4 },
  value: { minWidth: 28, textAlign: 'center', fontSize: 16, fontWeight: '700', color: palette.ink },
});
