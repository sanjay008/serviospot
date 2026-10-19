import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '@/flow2/constants/theme';

export function ChatTopBar({ name, subtitle, onBack }: { name: string; subtitle: string; onBack: () => void }) {
  return (
    <View style={styles.bar}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to all conversations" onPress={onBack} hitSlop={10} style={styles.back}>
        <Text style={styles.backArrow}>‹</Text>
      </Pressable>
      <View style={styles.avatar}><Text style={styles.initial}>{name.charAt(0).toUpperCase()}</Text></View>
      <View style={styles.person}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
      <View style={styles.live}><View style={styles.dot} /><Text style={styles.liveText}>Chat</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: palette.accentDark },
  back: { width: 30, alignItems: 'center', justifyContent: 'center' },
  backArrow: { color: '#FFFFFF', fontSize: 32, lineHeight: 34, fontWeight: '300' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accentSoft },
  initial: { color: palette.accentDark, fontSize: 17, fontWeight: '800' },
  person: { flex: 1, gap: 2 },
  name: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  subtitle: { color: '#E7E2FF', fontSize: 11 },
  live: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 14, backgroundColor: palette.accent },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
  liveText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
});
