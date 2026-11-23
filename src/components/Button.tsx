import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { control, palette, radius } from '@/constants/theme';
import { leading, useType } from '@/hooks/use-type';

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
  const type = useType();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [styles.base, styles[variant], busy && styles.disabled, pressed && !busy && styles.pressed, style]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? palette.white : palette.accentDark} />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`], { fontSize: type.button, lineHeight: leading(type.button, 4) }]} numberOfLines={2}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: control.height,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primary: { backgroundColor: palette.accent },
  secondary: { backgroundColor: palette.surface, borderWidth: 1.5, borderColor: palette.lineStrong },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: palette.danger },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  label: { fontWeight: '700', textAlign: 'center' },
  primaryLabel: { color: palette.white },
  secondaryLabel: { color: palette.ink },
  ghostLabel: { color: palette.accentDark },
  dangerLabel: { color: palette.white },
});
