import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Icon } from '@/flow2/components/Icon';
import { palette } from '@/flow2/constants/theme';
import { useType } from '@/hooks/use-type';

export function Stepper({ label, value, onChange, min = 0, max = 999 }: { label?: string; value: number; onChange: (value: number) => void; min?: number; max?: number }) {
  const clamp = (next: number) => Math.max(min, Math.min(max, next));
  const type = useType();
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  const apply = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      onChange(min);
      setText(String(min));
      return;
    }
    const next = clamp(Number(digits));
    onChange(next);
    setText(String(next));
  };

  return (
    <View style={styles.row}>
      {label ? <Text style={[styles.label, { fontSize: type.body }]}>{label}</Text> : null}
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Decrease"
          onPress={() => onChange(clamp(value - 1))}
          disabled={value <= min}
          style={[styles.btn, value <= min && styles.disabled]}>
          <Icon name="minus" color={palette.accent} size={16} />
        </Pressable>
        <TextInput
          accessibilityLabel={label ? `${label} value` : 'Value'}
          value={text}
          onChangeText={(next) => {
            const digits = next.replace(/\D/g, '').slice(0, String(max).length);
            setText(digits);
            if (digits) onChange(clamp(Number(digits)));
          }}
          onBlur={() => apply(text)}
          onSubmitEditing={() => apply(text)}
          keyboardType="number-pad"
          inputMode="numeric"
          selectTextOnFocus
          maxLength={String(max).length}
          style={[styles.value, { fontSize: type.cardTitle }]}
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Increase" onPress={() => onChange(clamp(value + 1))} disabled={value >= max} style={[styles.btn, value >= max && styles.disabled]}>
          <Icon name="plus" color={palette.accent} size={16} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 44 },
  label: { flex: 1, color: palette.ink },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.well, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: palette.line },
  btn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  disabled: { opacity: 0.4 },
  value: { minWidth: 56, height: 32, padding: 0, textAlign: 'center', textAlignVertical: 'center', fontWeight: '700', color: palette.ink },
});
