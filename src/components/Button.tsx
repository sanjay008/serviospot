import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { palette } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const busy = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [styles.base, styles[variant], busy && styles.disabled, pressed && !busy && styles.pressed, style]}>
      {loading ? <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : palette.accent} /> : <Text style={[styles.label, styles[`${variant}Label`]]} numberOfLines={2}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  primary: { backgroundColor: palette.accent },
  secondary: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: palette.danger },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.88 },
  label: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  primaryLabel: { color: '#fff' },
  secondaryLabel: { color: palette.ink },
  ghostLabel: { color: palette.accent },
  dangerLabel: { color: '#fff' },
});
