import { Pressable, StyleSheet, Text } from 'react-native';

import { Icon } from '@/components/Icon';
import { palette } from '@/constants/theme';
import { useApp } from '@/state/app';

export function LangToggle() {
  const { lang, toggleLang } = useApp();
  return (
    <Pressable onPress={toggleLang} style={styles.btn} accessibilityRole="button" accessibilityLabel="Toggle language">
      <Icon name="globe" color={palette.ink} size={15} />
      <Text style={styles.text}>{lang === 'nl' ? 'NL' : 'EN'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  text: { fontSize: 12, fontWeight: '700', color: palette.ink },
});
