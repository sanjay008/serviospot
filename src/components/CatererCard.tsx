import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/flow2/components/Icon';
import { palette, radius, spacing } from '@/flow2/constants/theme';
import { b } from '@/flow2/data/options';
import { useApp } from '@/flow2/state/app';
import { leading, useType } from '@/hooks/use-type';

export type CatererCardModel = {
  id: string;
  name: string;
  city?: string;
  image?: string;
  imageKind?: 'logo' | 'photo';
  reviewCount: number;
  verified: boolean;
  price?: string;
  guests?: string;
  favorite: boolean;
  favoriteBusy?: boolean;
};

export function CatererCard({
  caterer,
  onPress,
  onFavorite,
}: {
  caterer: CatererCardModel;
  onPress: () => void;
  onFavorite?: () => void;
}) {
  const { t } = useApp();
  const type = useType();
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(caterer.image) && !imageFailed;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.top}>
        <View style={styles.image}>
          {showImage ? (
            <Image
              source={{ uri: caterer.image }}
              style={styles.imageFill}
              contentFit={caterer.imageKind === 'photo' ? 'cover' : 'contain'}
              transition={120}
              onError={() => setImageFailed(true)}
              accessibilityLabel={caterer.name}
            />
          ) : (
            <Icon name="chef" color={palette.accentDark} size={32} />
          )}
        </View>
        <View style={styles.copy}>
          <View style={styles.nameRow}>
            <View style={styles.nameWrap}>
              <Text style={[styles.name, { fontSize: type.cardTitle, lineHeight: leading(type.cardTitle, 3) }]} numberOfLines={2}>{caterer.name}</Text>
              {caterer.verified ? <Icon name="verified" color={palette.mintDark} size={15} /> : null}
            </View>
            {onFavorite ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={caterer.favorite ? t(b('Favoriet verwijderen', 'Remove favorite')) : t(b('Favoriet opslaan', 'Save favorite'))}
                disabled={caterer.favoriteBusy}
                hitSlop={8}
                onPress={onFavorite}
                style={styles.heart}>
                <Icon name="heart" color={caterer.favorite ? palette.danger : palette.muted} size={18} filled={caterer.favorite} />
              </Pressable>
            ) : null}
          </View>
          {caterer.city ? (
            <View style={styles.meta}>
              <Icon name="pin" color={palette.muted} size={13} />
              <Text style={[styles.metaText, { fontSize: type.caption, lineHeight: leading(type.caption, 3) }]} numberOfLines={1}>{caterer.city}</Text>
            </View>
          ) : null}
          <Text style={[styles.metaText, { fontSize: type.caption, lineHeight: leading(type.caption, 3) }]}>
            {caterer.reviewCount > 0 ? t(b(`${caterer.reviewCount} beoordelingen`, `${caterer.reviewCount} reviews`)) : t(b('Nog geen reviews', 'No reviews yet'))}
          </Text>
          {caterer.guests ? (
            <View style={styles.meta}>
              <Icon name="people" color={palette.muted} size={13} />
              <Text style={[styles.metaText, { fontSize: type.caption, lineHeight: leading(type.caption, 3) }]} numberOfLines={1}>{caterer.guests}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.priceBlock}>
          <Text style={[styles.priceLabel, { fontSize: type.small }]}>{t(b('Vanaf', 'Starting from'))}</Text>
          <Text style={[styles.price, { fontSize: type.sectionTitle }]} numberOfLines={1}>{caterer.price ?? t(b('Prijs niet vermeld', 'Price not listed'))}</Text>
        </View>
        <View style={styles.view}>
          <Text style={[styles.viewText, { fontSize: type.caption }]}>{t(b('Bekijk cateraar', 'View caterer'))}</Text>
          <Icon name="chevron" color={palette.accentDark} size={14} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: 12,
    borderRadius: 14,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
  },
  pressed: { borderColor: palette.accentMid },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  image: {
    width: 116,
    height: 116,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: palette.bg,
  },
  imageFill: { width: '100%', height: '100%' },
  copy: { flex: 1, minWidth: 0, gap: 4, paddingTop: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  nameWrap: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { flexShrink: 1, color: palette.ink, fontWeight: '600' },
  heart: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { flexShrink: 1, color: palette.muted, fontWeight: '400' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.line,
  },
  priceBlock: { flex: 1, minWidth: 0, gap: 1 },
  priceLabel: { color: palette.muted, fontWeight: '500' },
  price: { color: palette.ink, fontWeight: '700' },
  view: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewText: { color: palette.accentDark, fontWeight: '600' },
});
