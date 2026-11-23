import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { palette } from '@/constants/theme';
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
  const type = useType();
  return (
    <View style={styles.wrap}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { fontSize: type.label, lineHeight: leading(type.label, 4) }]}>{label}</Text>
          {secure ? (
            <Pressable onPress={() => setHidden((value) => !value)} hitSlop={8}>
              <Text style={[styles.toggle, { fontSize: type.caption }]}>{hidden ? 'Show' : 'Hide'}</Text>
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
        secureTextEntry={secure ? hidden : false}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCapitalize === 'none' ? false : undefined}
        style={[styles.input, { fontSize: type.input }, multiline && styles.multi, error ? styles.bad : null]}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {error ? <Text style={[styles.error, { fontSize: type.helper, lineHeight: leading(type.helper, 4) }]}>{error}</Text> : hint ? <Text style={[styles.hint, { fontSize: type.helper, lineHeight: leading(type.helper, 4) }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontWeight: '600', color: palette.inkSecondary },
  toggle: { fontWeight: '700', color: palette.accentDark },
  input: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: palette.line,
    backgroundColor: palette.surface,
    paddingHorizontal: 16,
    color: palette.ink,
  },
  multi: { minHeight: 112, paddingTop: 14 },
  bad: { borderColor: palette.danger, backgroundColor: '#FFF8F8' },
  error: { color: palette.danger, fontWeight: '600' },
  hint: { color: palette.muted },
});
