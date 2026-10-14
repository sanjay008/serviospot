import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';

export const authButton = { borderRadius: 28 };

export function AuthScreen({ children, back, scroll = true }: { children: React.ReactNode; back?: boolean; scroll?: boolean }) {
  return (
    <Screen canvas={palette.surface} scroll={scroll} style={scroll ? undefined : styles.center}>
      {back ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}>
          <Icon name="back" color={palette.ink} size={18} />
        </Pressable>
      ) : null}
      {children}
    </Screen>
  );
}

export function AuthBrand({ subtitle }: { subtitle: string }) {
  return (
    <View style={styles.brand}>
      <Icon name="pin" color={palette.accent} size={42} />
      <Text style={styles.word}>ServioSpot</Text>
      <Text style={styles.tag}>{subtitle}</Text>
    </View>
  );
}

export function AuthTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.titles}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.tag, styles.tagLeft]}>{subtitle}</Text>
    </View>
  );
}

export function AuthLink({ before, action, onPress }: { before: string; action: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.linkHit}>
      <Text style={styles.link}>
        {before} <Text style={styles.linkStrong}>{action}</Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bg },
  brand: { alignItems: 'center', gap: 8, paddingTop: 36, paddingBottom: 12 },
  word: { fontSize: 32, fontWeight: '700', color: palette.ink },
  titles: { gap: 4, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: palette.ink },
  tag: { fontSize: 15, lineHeight: 21, color: palette.muted, textAlign: 'center' },
  tagLeft: { textAlign: 'left' },
  linkHit: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  link: { color: palette.muted, fontSize: 15, textAlign: 'center' },
  linkStrong: { color: palette.accent, fontWeight: '700' },
});
