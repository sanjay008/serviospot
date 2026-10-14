import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { palette } from '@/constants/theme';
import { euro } from '@/data/format';
import type { Provider } from '@/data/types';

export function ProviderCard({
  provider,
  saved,
  onPress,
  onSave,
  compact,
}: {
  provider: Provider;
  saved?: boolean;
  onPress: () => void;
  onSave?: () => void;
  /** Home list: name and rating only. */
  compact?: boolean;
}) {
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" onPress={onPress}>
        <View style={[styles.photo, { backgroundColor: provider.cover }]}>
          {provider.photo ? (
            <Image source={{ uri: provider.photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          ) : (
            <View style={styles.placeholder}>
              <Icon name="store" color="#fff" size={34} />
            </View>
          )}
          <View style={styles.scrim} />
          {compact ? null : (
            <Text style={styles.cuisine} numberOfLines={1}>
              {provider.cuisines[0] || provider.services[0] || provider.city}
            </Text>
          )}
        </View>
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {provider.name}
          </Text>
          <Text style={styles.line} numberOfLines={1}>
            {compact ? `★ ${provider.rating.toFixed(1)}` : `${provider.city} · ★ ${provider.rating.toFixed(1)} · ${provider.reviewCount} reviews`}
          </Text>
          {compact ? null : <Text style={styles.price}>From {euro(provider.startingPriceCents)}</Text>}
        </View>
      </Pressable>
      {onSave ? (
        <Pressable accessibilityRole="button" accessibilityLabel={saved ? 'Remove favorite' : 'Save provider'} onPress={onSave} hitSlop={8} style={styles.heart}>
          <Icon name={saved ? 'heartOn' : 'heart'} color={saved ? '#FFD0DC' : '#fff'} size={16} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.line,
    overflow: 'hidden',
  },
  photo: { height: 132, justifyContent: 'flex-end', padding: 12 },
  placeholder: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(20, 16, 40, 0.18)' },
  cuisine: { color: '#fff', fontSize: 13, fontWeight: '700' },
  body: { padding: 12, gap: 3 },
  name: { fontSize: 16, fontWeight: '700', color: palette.ink },
  line: { fontSize: 13, color: palette.muted },
  price: { marginTop: 4, fontSize: 14, fontWeight: '700', color: palette.accent },
  heart: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20, 16, 40, 0.35)',
  },
});
