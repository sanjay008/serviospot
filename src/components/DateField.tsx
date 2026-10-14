import DateTimePicker from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Input } from '@/components/Input';
import { palette } from '@/constants/theme';

export function DateField({
  label,
  value,
  onChange,
  minimum,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minimum?: string;
}) {
  const [open, setOpen] = useState(false);
  if (Platform.OS === 'web') {
    return <Input label={label} value={value} onChangeText={onChange} placeholder="2026-11-14" />;
  }
  const earliest = startOfDay(parseIso(minimum) ?? new Date());
  const selected = laterDate(parseIso(value) ?? earliest, earliest);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Choose a date" onPress={() => setOpen((current) => (Platform.OS === 'ios' ? !current : true))} style={styles.field}>
        <Text style={parseIso(value) ? styles.value : styles.placeholder}>{parseIso(value) ? displayDate(parseIso(value) as Date) : 'Choose a date'}</Text>
        <Icon name="calendar" color={palette.accent} size={20} />
      </Pressable>
      {open ? (
        <DateTimePicker
          value={selected}
          mode="date"
          presentation="dialog"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={earliest}
          accentColor={palette.accent}
          onValueChange={(_, date) => {
            onChange(toIsoDate(date));
            if (Platform.OS !== 'ios') setOpen(false);
          }}
          onDismiss={() => setOpen(false)}
        />
      ) : null}
    </View>
  );
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseIso(value: string | undefined) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function laterDate(date: Date, earliest: Date) {
  return date < earliest ? earliest : date;
}

function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function displayDate(date: Date) {
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 15, fontWeight: '700', color: palette.ink },
  field: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surface,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  value: { flex: 1, fontSize: 17, color: palette.ink },
  placeholder: { flex: 1, fontSize: 17, color: '#8A847C' },
});
