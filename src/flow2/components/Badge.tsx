import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/flow2/constants/theme';

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'gold' | 'accent' }) {
  return (
    <View style={[styles.badge, styles[tone]]}>
      <Text style={[styles.text, styles[`${tone}Text`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  text: { fontSize: 12, fontWeight: '600' },
  neutral: { backgroundColor: palette.well },
  good: { backgroundColor: palette.mint },
  warn: { backgroundColor: palette.warningSoft },
  bad: { backgroundColor: palette.dangerSoft },
  gold: { backgroundColor: palette.goldSoft },
  accent: { backgroundColor: palette.accentSoft },
  neutralText: { color: palette.muted },
  goodText: { color: palette.mintDark },
  warnText: { color: palette.warning },
  badText: { color: palette.danger },
  goldText: { color: palette.gold },
  accentText: { color: palette.accentDark },
});
