import { StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing } from '@/flow2/constants/theme';
import { leading, useType } from '@/hooks/use-type';

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const type = useType();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { fontSize: type.sectionTitle, lineHeight: leading(type.sectionTitle, 5) }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { fontSize: type.secondary, lineHeight: leading(type.secondary, 6) }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

export function Pill({
  label,
  tone = 'accent',
}: {
  label: string;
  tone?: 'accent' | 'good' | 'warn' | 'neutral';
}) {
  const type = useType();
  const bg =
    tone === 'good' ? palette.mint : tone === 'warn' ? palette.warningSoft : tone === 'neutral' ? palette.well : palette.accentSoft;
  const fg =
    tone === 'good' ? palette.mintDark : tone === 'warn' ? palette.warning : tone === 'neutral' ? palette.muted : palette.accentDark;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color: fg, fontSize: type.micro, lineHeight: leading(type.micro, 3) }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xxs, marginTop: spacing.xxs },
  title: { fontWeight: '800', color: palette.ink, letterSpacing: -0.2 },
  subtitle: { color: palette.muted, fontWeight: '500' },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
  },
  pillText: { fontWeight: '700', letterSpacing: 0.3 },
});
