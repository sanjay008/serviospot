import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Icon } from '@/components/Icon';
import { palette } from '@/constants/theme';
import { euro } from '@/data/format';
import type { Offering } from '@/data/types';

const priceLabel: Record<string, string> = {
  per_person: ' / person',
  per_item: ' / item',
  per_tray: ' / tray',
  per_hour: ' / hour',
  per_day: ' / day',
  fixed: '',
  package: ' package',
  on_request: '',
};

export function OfferingCard({
  offering,
  providerName,
  saved,
  onPress,
  onSave,
  actionLabel,
}: {
  offering: Offering;
  providerName?: string;
  saved?: boolean;
  onPress: () => void;
  onSave?: () => void;
  actionLabel?: string;
}) {
  const price = offering.priceType === 'on_request' || offering.priceCents == null ? 'Price on request' : `From ${euro(offering.priceCents)}${priceLabel[offering.priceType]}`;
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
        {offering.photo ? (
          <Image source={{ uri: offering.photo }} style={styles.photo} contentFit="cover" transition={200} />
        ) : (
          <View style={[styles.photo, styles.fallback]}>
            <Text style={styles.letter}>{offering.title.slice(0, 1)}</Text>
          </View>
        )}
        <View style={styles.text}>
          <Badge label={offering.category || offering.offerType} />
          <Text style={styles.title} numberOfLines={2}>
            {offering.title}
          </Text>
          {providerName ? <Text style={styles.muted}>{providerName}</Text> : null}
          <Text style={styles.price}>{price}</Text>
          {!offering.active ? <Text style={styles.muted}>Inactive</Text> : null}
        </View>
      </Pressable>
      {actionLabel ? (
        <Pressable accessibilityRole="button" onPress={onSave} style={styles.action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : onSave ? (
        <Pressable accessibilityRole="button" accessibilityLabel={saved ? 'Remove saved offering' : 'Save offering'} onPress={onSave} hitSlop={8} style={styles.heartButton}>
          <Icon name={saved ? 'heartOn' : 'heart'} color={saved ? palette.danger : palette.muted} size={18} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.line, padding: 10, position: 'relative' },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingRight: 28 },
  photo: { width: 84, height: 84, borderRadius: 14, backgroundColor: palette.well },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  letter: { fontSize: 22, fontWeight: '700', color: palette.accent },
  text: { flex: 1, gap: 4, minWidth: 0 },
  title: { fontSize: 16, fontWeight: '700', color: palette.ink },
  muted: { fontSize: 13, color: palette.muted },
  price: { fontSize: 14, fontWeight: '700', color: palette.accent },
  heartButton: { position: 'absolute', top: 8, right: 6, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  action: { position: 'absolute', top: 10, right: 10, minHeight: 36, justifyContent: 'center' },
  actionText: { color: palette.accent, fontWeight: '700', fontSize: 13 },
});
