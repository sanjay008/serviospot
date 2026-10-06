import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { palette } from '@/constants/theme';

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
}) {
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.wrap}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {secure ? (
            <Pressable onPress={() => setHidden((value) => !value)} hitSlop={8}>
              <Text style={styles.toggle}>{hidden ? 'Show' : 'Hide'}</Text>
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
        secureTextEntry={secure ? hidden : false}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCapitalize === 'none' ? false : undefined}
        style={[styles.input, multiline && styles.multi, error ? styles.bad : null]}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 13, fontWeight: '600', color: palette.ink },
  toggle: { fontSize: 13, fontWeight: '600', color: palette.accent },
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
  multi: { minHeight: 110, paddingTop: 12 },
  bad: { borderColor: palette.danger },
  error: { color: palette.danger, fontSize: 13, lineHeight: 18 },
  hint: { color: palette.muted, fontSize: 13, lineHeight: 18 },
});
