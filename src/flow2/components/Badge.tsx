import { StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing } from '@/flow2/constants/theme';
import { useType } from '@/hooks/use-type';

export function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'gold' | 'accent';
}) {
  const type = useType();
  return (
    <View style={[styles.badge, styles[tone]]}>
      <Text style={[styles.text, styles[`${tone}Text`], { fontSize: type.small }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs + 1,
    borderWidth: 1,
  },
  text: { fontWeight: '700', letterSpacing: 0.1 },
  neutral: { backgroundColor: palette.well, borderColor: palette.line },
  good: { backgroundColor: palette.mint, borderColor: '#BBF7D0' },
  warn: { backgroundColor: palette.warningSoft, borderColor: '#FDE68A' },
  bad: { backgroundColor: palette.dangerSoft, borderColor: '#FECACA' },
  gold: { backgroundColor: palette.goldSoft, borderColor: '#FDE68A' },
  accent: { backgroundColor: palette.accentSoft, borderColor: palette.accentMid },
  neutralText: { color: palette.muted },
  goodText: { color: palette.mintDark },
  warnText: { color: palette.warning },
  badText: { color: palette.danger },
  goldText: { color: palette.gold },
  accentText: { color: palette.accentDark },
});
