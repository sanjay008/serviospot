import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { control, palette, radius, spacing } from '@/flow2/constants/theme';
import { leading, useType } from '@/hooks/use-type';

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  error,
  hint,
  secure,
  autoCapitalize,
  editable = true,
  rightAction,
}: {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
  hint?: string;
  secure?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  editable?: boolean;
  rightAction?: { label: string; onPress: () => void; disabled?: boolean };
}) {
  const [focused, setFocused] = useState(false);
  const type = useType();
  return (
    <View style={styles.wrap}>
      {label || rightAction ? (
        <View style={styles.labelRow}>
          {label ? (
            <Text style={[styles.label, { fontSize: type.label, lineHeight: leading(type.label, 4) }]}>{label}</Text>
          ) : (
            <View />
          )}
          {rightAction ? (
            <Pressable accessibilityRole="button" disabled={rightAction.disabled} onPress={rightAction.onPress} hitSlop={control.hitSlop}>
              <Text style={[styles.actionText, { fontSize: type.secondary }, rightAction.disabled && styles.actionDisabled]}>
                {rightAction.label}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.mutedSoft}
        multiline={multiline}
        keyboardType={keyboardType}
        secureTextEntry={secure}
        autoCapitalize={autoCapitalize}
        editable={editable}
        autoCorrect={autoCapitalize === 'none' ? false : undefined}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          { fontSize: type.input },
          multiline && { lineHeight: type.input + 4 },
          multiline && styles.multi,
          focused && styles.focused,
          error ? styles.bad : null,
          !editable && styles.readonly,
        ]}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {error ? (
        <Text style={[styles.error, { fontSize: type.helper, lineHeight: leading(type.helper, 4) }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hint, { fontSize: type.helper, lineHeight: leading(type.helper, 4) }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 18,
  },
  label: { fontWeight: '600', color: palette.inkSecondary },
  input: {
    minHeight: control.height,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: palette.line,
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.lg,
    color: palette.ink,
    includeFontPadding: false,
  },
  actionText: { color: palette.accentDark, fontWeight: '700' },
  actionDisabled: { color: palette.muted },
  focused: {
    borderColor: palette.accent,
    backgroundColor: palette.accentSoft,
  },
  multi: { minHeight: 112, paddingTop: 14, paddingBottom: 14 },
  bad: { borderColor: palette.danger, backgroundColor: '#FFF8F8' },
  readonly: { backgroundColor: palette.well, color: palette.inkSecondary },
  error: { color: palette.danger, fontWeight: '600' },
  hint: { color: palette.muted },
});
