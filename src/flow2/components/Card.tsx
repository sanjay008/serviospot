import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { palette, radius, shadowSoft, spacing } from '@/flow2/constants/theme';

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadowSoft,
  },
});
