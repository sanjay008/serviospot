import { StyleSheet, Text, View } from 'react-native';

import type { VendorOffering } from '@/api/vendorApi';
import { euro } from '@/data/format';
import { Card } from '@/flow2/components/Card';
import { palette } from '@/flow2/constants/theme';
import { useType } from '@/hooks/use-type';

export function OfferingSummaryCard({ item }: { item: VendorOffering }) {
  const type = useType();
  const description = item.description?.trim() ?? '';
  const includesIndex = description.toLocaleLowerCase().indexOf('includes:');
  const serving = includesIndex >= 0 ? description.slice(0, includesIndex).trim().replace(/\.$/, '') : '';
  const descriptionDishes = includesIndex >= 0 ? description.slice(includesIndex + 'includes:'.length).trim() : '';
  const dishes = Array.isArray(item.dishes) ? item.dishes.join(', ') : item.dishes || descriptionDishes;
  const otherDescription = includesIndex < 0 && !item.dishes ? description : '';

  return (
    <Card style={styles.card}>
      <View style={styles.heading}>
        <Text style={[styles.title, { fontSize: type.cardTitle, lineHeight: type.cardTitle + 4 }]} numberOfLines={2}>{item.title || 'Untitled offering'}</Text>
        <Text style={[styles.price, { fontSize: type.body, lineHeight: type.body + 4 }]}>{euro(item.price_cents == null ? null : Number(item.price_cents))}</Text>
      </View>
      {(item.category || serving) ? (
        <Text style={[styles.meta, { fontSize: type.small }]} numberOfLines={2}>{[item.category, serving].filter(Boolean).join(' · ')}</Text>
      ) : null}
      {dishes ? <Text style={[styles.details, { fontSize: type.caption, lineHeight: type.caption + 4 }]} numberOfLines={3}>{dishes}</Text> : null}
      {otherDescription ? <Text style={[styles.details, { fontSize: type.caption, lineHeight: type.caption + 4 }]} numberOfLines={3}>{otherDescription}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 6 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  title: { flex: 1, color: palette.ink, fontWeight: '800' },
  price: { color: palette.accentDark, fontWeight: '800', textAlign: 'right' },
  meta: { color: palette.muted, fontWeight: '600' },
  details: { color: palette.ink },
});
