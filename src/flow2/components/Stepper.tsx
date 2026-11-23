import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Icon } from '@/flow2/components/Icon';
import { palette, radius, spacing } from '@/flow2/constants/theme';
import { useType } from '@/hooks/use-type';

export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
}: {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  const clamp = (next: number) => Math.max(min, Math.min(max, next));
  const type = useType();
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(false);
  const displayValue = editing ? text : String(value);

  const apply = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      onChange(min);
      setText('');
      setEditing(false);
      return;
    }
    const next = clamp(Number(digits));
    onChange(next);
    setText('');
    setEditing(false);
  };

  return (
    <View style={styles.row}>
      {label ? <Text style={[styles.label, { fontSize: type.body }]}>{label}</Text> : null}
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Decrease"
          onPress={() => {
            setEditing(false);
            onChange(clamp(value - 1));
          }}
          disabled={value <= min}
          style={[styles.btn, value <= min && styles.disabled]}>
          <Icon name="minus" color={palette.accentDark} size={16} />
        </Pressable>
        <TextInput
          accessibilityLabel={label ? `${label} value` : 'Value'}
          value={displayValue}
          onChangeText={(next) => {
            setEditing(true);
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Increase"
          onPress={() => {
            setEditing(false);
            onChange(clamp(value + 1));
          }}
          disabled={value >= max}
          style={[styles.btn, value >= max && styles.disabled]}>
          <Icon name="plus" color={palette.accentDark} size={16} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 48,
  },
  label: { flex: 1, color: palette.inkSecondary, fontWeight: '600' },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.well,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderWidth: 1.5,
    borderColor: palette.line,
  },
  btn: {
    width: 34,
    height: 34,
    borderRadius: radius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.lineStrong,
  },
  disabled: { opacity: 0.35 },
  value: {
    minWidth: 52,
    height: 34,
    padding: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontWeight: '800',
    color: palette.ink,
  },
});
