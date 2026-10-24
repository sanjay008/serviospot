import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/flow2/constants/theme';
import { leading, useType } from '@/hooks/use-type';

const tones = {
  info: { bg: palette.infoSoft, fg: '#24384C' },
  success: { bg: palette.mint, fg: palette.mintDark },
  warning: { bg: palette.warningSoft, fg: palette.warning },
  error: { bg: palette.dangerSoft, fg: palette.danger },
  accent: { bg: palette.accentSoft, fg: palette.accentDark },
};

export function Notice({ tone = 'info', title, body }: { tone?: keyof typeof tones; title?: string; body: string }) {
  const color = tones[tone];
  const type = useType();
  return (
    <View style={[styles.box, { backgroundColor: color.bg }]}>
      {title ? <Text style={[styles.title, { color: color.fg, fontSize: type.secondary, lineHeight: leading(type.secondary, 4) }]}>{title}</Text> : null}
      <Text style={[styles.body, { color: color.fg, fontSize: type.secondary, lineHeight: leading(type.secondary, 6) }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 18, padding: 14, gap: 4 },
  title: { fontWeight: '700' },
  body: {},
});
