import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/flow2/components/Icon';
import { control, palette, radius, spacing } from '@/flow2/constants/theme';
import { leading, useType } from '@/hooks/use-type';

export type SelectOption = { value: string; label: string };

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select…',
  hint,
  error,
}: {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
}) {
  const type = useType();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  const close = () => setOpen(false);
  const choose = (next: string) => {
    onChange(next);
    close();
  };

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { fontSize: type.label, lineHeight: leading(type.label, 4) }]}>{label}</Text> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={label ?? 'Open dropdown'}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed, error ? styles.bad : null, open && styles.triggerOpen]}>
        <Text
          style={[styles.value, { fontSize: type.input }, !selected && styles.placeholder]}
          numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <View style={styles.chevronWrap}>
          <Icon name="chevron" color={palette.accentDark} size={16} />
        </View>
      </Pressable>

      {error ? (
        <Text style={[styles.error, { fontSize: type.helper, lineHeight: leading(type.helper, 4) }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hint, { fontSize: type.helper, lineHeight: leading(type.helper, 4) }]}>{hint}</Text>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={close} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { fontSize: type.sectionTitle }]} numberOfLines={2}>
                {label ?? 'Select option'}
              </Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} hitSlop={control.hitSlop} style={styles.closeBtn}>
                <Icon name="close" color={palette.ink} size={18} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}>
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => choose(option.value)}
                    style={({ pressed }) => [styles.option, active && styles.optionActive, pressed && styles.optionPressed]}>
                    <Text
                      style={[
                        styles.optionText,
                        { fontSize: type.body, lineHeight: leading(type.body, 5) },
                        active && styles.optionTextActive,
                      ]}>
                      {option.label}
                    </Text>
                    {active ? (
                      <View style={styles.check}>
                        <Icon name="check" color={palette.white} size={14} />
                      </View>
                    ) : (
                      <View style={styles.checkSpacer} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { fontWeight: '600', color: palette.inkSecondary },
  trigger: {
    minHeight: control.height,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: palette.line,
    backgroundColor: palette.surface,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  triggerPressed: {
    borderColor: palette.accentMid,
    backgroundColor: palette.accentSoft,
  },
  triggerOpen: {
    borderColor: palette.accent,
  },
  value: {
    flex: 1,
    color: palette.ink,
    fontWeight: '600',
    paddingVertical: 12,
  },
  placeholder: {
    color: palette.mutedSoft,
    fontWeight: '500',
  },
  chevronWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.well,
    borderWidth: 1,
    borderColor: palette.line,
    transform: [{ rotate: '90deg' }],
  },
  bad: { borderColor: palette.danger, backgroundColor: '#FFF8F8' },
  error: { color: palette.danger, fontWeight: '600' },
  hint: { color: palette.muted },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.overlay,
  },
  sheet: {
    maxHeight: '72%',
    backgroundColor: palette.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderTopWidth: 1,
    borderColor: palette.line,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: palette.lineStrong,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sheetTitle: {
    flex: 1,
    fontWeight: '800',
    color: palette.ink,
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: control.icon,
    height: control.icon,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.well,
    borderWidth: 1,
    borderColor: palette.line,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  option: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: palette.line,
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  optionActive: {
    backgroundColor: palette.accentSoft,
    borderColor: palette.accent,
  },
  optionPressed: {
    backgroundColor: palette.well,
  },
  optionText: {
    flex: 1,
    color: palette.ink,
    fontWeight: '600',
  },
  optionTextActive: {
    color: palette.accentDark,
    fontWeight: '800',
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accent,
  },
  checkSpacer: {
    width: 24,
    height: 24,
  },
});
