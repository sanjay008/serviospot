import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Icon } from '@/components/Icon';
import { palette, shadow } from '@/constants/theme';
import { euro } from '@/data/format';
import type { Provider } from '@/data/types';

export function ProviderCard({
  provider,
  saved,
  onPress,
  onSave,
}: {
  provider: Provider;
  saved?: boolean;
  onPress: () => void;
  onSave?: () => void;
}) {
  const letters = provider.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.letters}>{letters}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {provider.name}
          </Text>
          <Text style={styles.line} numberOfLines={1}>
            {provider.city} · ★ {provider.rating.toFixed(1)}
          </Text>
          <View style={styles.footer}>
            {provider.verified ? <Badge label="Verified" tone="good" /> : <Badge label="New" />}
            <Text style={styles.price}>From {euro(provider.startingPriceCents)}</Text>
          </View>
        </View>
      </Pressable>
      {onSave ? (
        <Pressable accessibilityRole="button" accessibilityLabel={saved ? 'Remove favorite' : 'Save provider'} onPress={onSave} hitSlop={8} style={styles.heart}>
          <Icon name={saved ? 'heartOn' : 'heart'} color={saved ? palette.danger : palette.muted} size={18} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 14,
    ...shadow,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingRight: 28 },
  avatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
  letters: { color: palette.accent, fontWeight: '700', fontSize: 15 },
  body: { flex: 1, gap: 3, minWidth: 0 },
  name: { fontSize: 16, fontWeight: '700', color: palette.ink },
  line: { fontSize: 13, color: palette.muted },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4 },
  price: { fontSize: 13, fontWeight: '700', color: palette.accent },
  heart: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});
