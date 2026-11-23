import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { control, palette, radius } from '@/flow2/constants/theme';
import { useType } from '@/hooks/use-type';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
  labelStyle,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}) {
  const busy = disabled || loading;
  const type = useType();
  const spinner =
    variant === 'primary' || variant === 'danger' ? palette.white : palette.accentDark;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        busy && styles.disabled,
        pressed && !busy && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={spinner} />
      ) : (
        <Text
          style={[styles.label, styles[`${variant}Label` as const], { fontSize: type.button, lineHeight: type.button + 2 }, labelStyle]}
          numberOfLines={1}>
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
  secondary: {
    backgroundColor: palette.surface,
    borderWidth: 1.5,
    borderColor: palette.lineStrong,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: palette.accent,
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: palette.danger },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  label: {
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    letterSpacing: 0.1,
  },
  primaryLabel: { color: palette.white },
  secondaryLabel: { color: palette.ink },
  outlineLabel: { color: palette.accentDark },
  ghostLabel: { color: palette.accentDark },
  dangerLabel: { color: palette.white },
});
