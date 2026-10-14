import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/theme';

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Pill({ label, tone = 'accent' }: { label: string; tone?: 'accent' | 'good' | 'warn' | 'neutral' }) {
  const bg = tone === 'good' ? palette.mint : tone === 'warn' ? palette.warningSoft : tone === 'neutral' ? palette.well : palette.accentSoft;
  const fg = tone === 'good' ? palette.mintDark : tone === 'warn' ? palette.warning : tone === 'neutral' ? palette.muted : palette.accentDark;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2, marginTop: 4 },
  title: { fontSize: 18, fontWeight: '700', color: palette.ink },
  subtitle: { fontSize: 14, lineHeight: 20, color: palette.muted },
  pill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
});
