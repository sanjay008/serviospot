import { Pressable, StyleSheet, Text } from 'react-native';

import { Icon } from '@/flow2/components/Icon';
import { palette } from '@/flow2/constants/theme';
import { useApp } from '@/flow2/state/app';

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
