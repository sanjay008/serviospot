import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { palette } from '@/flow2/constants/theme';

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
  return (
    <View style={styles.wrap}>
      {label || rightAction ? (
        <View style={styles.labelRow}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          {rightAction ? (
            <Pressable accessibilityRole="button" disabled={rightAction.disabled} onPress={rightAction.onPress} hitSlop={8}>
              <Text style={[styles.actionText, rightAction.disabled && styles.actionDisabled]}>{rightAction.label}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8A847C"
        multiline={multiline}
        keyboardType={keyboardType}
        secureTextEntry={secure}
        autoCapitalize={autoCapitalize}
        editable={editable}
        autoCorrect={autoCapitalize === 'none' ? false : undefined}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, multiline && styles.multi, focused && styles.focused, error ? styles.bad : null]}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 20 },
  label: { fontSize: 15, fontWeight: '700', color: palette.ink },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surface,
    paddingHorizontal: 14,
    fontSize: 16,
    color: palette.ink,
  },
  actionText: { color: palette.accentDark, fontSize: 14, fontWeight: '700' },
  actionDisabled: { color: palette.muted },
  focused: { borderColor: palette.accent },
  multi: { minHeight: 110, paddingTop: 12 },
  bad: { borderColor: palette.danger },
  error: { color: palette.danger, fontSize: 13, lineHeight: 18 },
  hint: { color: palette.muted, fontSize: 13, lineHeight: 18 },
});
