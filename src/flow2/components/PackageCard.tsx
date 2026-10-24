import { StyleSheet, Text } from 'react-native';

import { Card } from '@/flow2/components/Card';
import { palette } from '@/flow2/constants/theme';
import type { VendorPackage } from '@/flow2/data/packages';
import { leading, useType } from '@/hooks/use-type';

export function PackageCard({ item }: { item: VendorPackage }) {
  const type = useType();
  return (
    <Card>
      <Text style={[styles.name, { fontSize: type.cardTitle }]}>{item.name}</Text>
      <Text style={[styles.meta, { fontSize: type.secondary }]}>{item.people} people · {item.category}</Text>
      <Text style={[styles.dishes, { fontSize: type.body, lineHeight: leading(type.body, 6) }]}>{item.dishes.join(', ')}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  name: { color: palette.ink, fontWeight: '800' },
  meta: { color: palette.accentDark, fontWeight: '700' },
  dishes: { color: palette.ink },
});
