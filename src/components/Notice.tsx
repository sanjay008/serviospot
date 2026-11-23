import { StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing } from '@/constants/theme';
import { leading, useType } from '@/hooks/use-type';

const tones = {
  info: { bg: palette.infoSoft, fg: palette.info, border: '#BAE6FD' },
  success: { bg: palette.mint, fg: palette.mintDark, border: '#BBF7D0' },
  warning: { bg: palette.warningSoft, fg: palette.warning, border: '#FDE68A' },
  error: { bg: palette.dangerSoft, fg: palette.danger, border: '#FECACA' },
};

export function Notice({ tone = 'info', title, body }: { tone?: keyof typeof tones; title?: string; body: string }) {
  const color = tones[tone];
  const type = useType();
  return (
    <View style={[styles.box, { backgroundColor: color.bg, borderColor: color.border }]}>
      {title ? (
        <Text style={[styles.title, { color: color.fg, fontSize: type.secondary, lineHeight: leading(type.secondary, 4) }]}>
          {title}
        </Text>
      ) : null}
      <Text style={[styles.body, { color: color.fg, fontSize: type.secondary, lineHeight: leading(type.secondary, 6) }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xxs,
    borderWidth: 1,
  },
  title: { fontWeight: '800' },
  body: { fontWeight: '500' },
});
