import { DateTimePicker, type DateTimePickerEvent } from '@expo/ui/community/datetime-picker';
import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/flow2/components/Icon';
import { palette } from '@/flow2/constants/theme';
import { leading, useType } from '@/hooks/use-type';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplay(date: Date) {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function DateField({
  label,
  value,
  onChange,
  placeholder = 'No date selected',
  hint,
  error,
  minimumDate,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  minimumDate?: Date;
}) {
  const type = useType();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const minDate = useMemo(() => {
    const floor = minimumDate ? new Date(minimumDate) : startOfToday();
    floor.setHours(0, 0, 0, 0);
    return floor;
  }, [minimumDate]);

  const selected = useMemo(() => parseDate(value), [value]);
  const pickerValue = useMemo(() => {
    if (selected && selected.getTime() >= minDate.getTime()) return selected;
    return minDate;
  }, [selected, minDate]);

  const openPicker = () => setOpen(true);
  const closePicker = () => setOpen(false);

  const applyDate = (next?: Date) => {
    if (!next) return;
    const normalized = new Date(next);
    normalized.setHours(0, 0, 0, 0);
    if (normalized.getTime() < minDate.getTime()) return;
    onChange(formatDate(normalized));
  };

  const onAndroidChange = (event: DateTimePickerEvent, date?: Date) => {
    closePicker();
    if (event.type !== 'set') return;
    applyDate(date);
  };

  const onIosChange = (_event: DateTimePickerEvent, date?: Date) => {
    applyDate(date);
  };

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { fontSize: type.label, lineHeight: leading(type.label, 4) }]}>{label}</Text> : null}

      <View style={[styles.field, selected ? styles.fieldFilled : styles.fieldEmpty, error ? styles.bad : null]}>
        <View style={styles.valueBlock}>
          <Text style={[styles.caption, { fontSize: type.micro }]}>{selected ? 'Selected date' : 'Pick a date'}</Text>
          <Text style={[styles.value, { fontSize: type.input }, !selected && styles.placeholder]} numberOfLines={1}>
            {selected ? formatDisplay(selected) : placeholder}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label ? `Open calendar for ${label}` : 'Open calendar'}
          onPress={openPicker}
          hitSlop={6}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}>
          <Icon name="calendar" color="#FFFFFF" size={18} />
        </Pressable>
      </View>

      {error ? (
        <Text style={[styles.error, { fontSize: type.caption, lineHeight: leading(type.caption, 5) }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hint, { fontSize: type.caption, lineHeight: leading(type.caption, 5) }]}>{hint}</Text>
      ) : null}

      {/* Keep picker outside the form flow so opening it never shifts fields below. */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={closePicker} statusBarTranslucent>
        <View style={styles.modalRoot} pointerEvents="box-none">
          {Platform.OS === 'android' ? (
            <DateTimePicker
              value={pickerValue}
              mode="date"
              display="default"
              presentation="dialog"
              minimumDate={minDate}
              accentColor={palette.accent}
              onChange={onAndroidChange}
              onDismiss={closePicker}
              style={styles.hiddenHost}
            />
          ) : (
            <>
              <Pressable style={styles.backdrop} onPress={closePicker} />
              <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <View style={styles.sheetHeader}>
                  <Pressable onPress={closePicker} hitSlop={8}>
                    <Text style={[styles.sheetAction, { fontSize: type.body }]}>Cancel</Text>
                  </Pressable>
                  <Text style={[styles.sheetTitle, { fontSize: type.body }]}>{label ?? 'Select date'}</Text>
                  <Pressable onPress={closePicker} hitSlop={8}>
                    <Text style={[styles.sheetActionDone, { fontSize: type.body }]}>Done</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={pickerValue}
                  mode="date"
                  display="inline"
                  minimumDate={minDate}
                  accentColor={palette.accent}
                  themeVariant="light"
                  onChange={onIosChange}
                />
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontWeight: '600', color: '#5C5772' },
  field: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingLeft: 14,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fieldEmpty: {
    backgroundColor: '#F7F5FC',
    borderColor: '#D8D2EA',
    borderStyle: 'dashed',
  },
  fieldFilled: {
    backgroundColor: palette.surface,
    borderColor: '#D4CEEA',
    borderStyle: 'solid',
  },
  valueBlock: { flex: 1, gap: 2, minWidth: 0 },
  caption: {
    color: palette.muted,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  value: { color: palette.ink, fontWeight: '700' },
  placeholder: { color: '#9A95AB', fontWeight: '500' },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accent,
  },
  iconBtnPressed: {
    backgroundColor: palette.accentDark,
  },
  bad: { borderColor: palette.danger, borderStyle: 'solid' },
  error: { color: palette.danger },
  hint: { color: palette.muted },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  hiddenHost: {
    width: 0,
    height: 0,
    opacity: 0,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 16, 40, 0.4)',
  },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sheetTitle: { fontWeight: '700', color: palette.ink },
  sheetAction: { color: palette.muted, fontWeight: '600' },
  sheetActionDone: { color: palette.accentDark, fontWeight: '700' },
});
