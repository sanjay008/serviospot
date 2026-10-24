import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/flow2/components/Icon';
import { palette } from '@/flow2/constants/theme';
import { useType } from '@/hooks/use-type';

export function ChatTopBar({ name, subtitle, onBack }: { name: string; subtitle: string; onBack: () => void }) {
  const type = useType();
  return (
    <View style={styles.bar}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to all conversations" onPress={onBack} hitSlop={10} style={styles.back}>
        <Icon name="back" color={palette.accentDark} size={18} />
      </Pressable>
      <View style={styles.avatar}><Text style={[styles.initial, { fontSize: type.sectionTitle }]}>{name.charAt(0).toUpperCase()}</Text></View>
      <View style={styles.person}>
        <Text style={[styles.name, { fontSize: type.cardTitle }]} numberOfLines={1}>{name}</Text>
        <Text style={[styles.subtitle, { fontSize: type.small }]} numberOfLines={1}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: palette.surface, borderBottomWidth: 1, borderBottomColor: palette.line },
  back: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bg, borderWidth: 1, borderColor: palette.line },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accentSoft },
  initial: { color: palette.accentDark, fontWeight: '800' },
  person: { flex: 1, gap: 2 },
  name: { color: palette.ink, fontWeight: '800' },
  subtitle: { color: palette.muted },
});
