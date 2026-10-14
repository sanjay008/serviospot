import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/theme';

const tones = {
  info: { bg: palette.infoSoft, fg: '#24384C' },
  success: { bg: palette.mint, fg: palette.mintDark },
  warning: { bg: palette.warningSoft, fg: palette.warning },
  error: { bg: palette.dangerSoft, fg: palette.danger },
  accent: { bg: palette.accentSoft, fg: palette.accentDark },
};

export function Notice({ tone = 'info', title, body }: { tone?: keyof typeof tones; title?: string; body: string }) {
  const color = tones[tone];
  return (
    <View style={[styles.box, { backgroundColor: color.bg }]}>
      {title ? <Text style={[styles.title, { color: color.fg }]}>{title}</Text> : null}
      <Text style={[styles.body, { color: color.fg }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 18, padding: 14, gap: 4 },
  title: { fontSize: 14, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 20 },
});
