import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ErrorState } from '@/components/ErrorState';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { ALLERGEN_NOTE } from '@/constants/copy';
import { palette } from '@/constants/theme';
import { euro } from '@/data/format';
import { useLoginGate } from '@/hooks/use-login-gate';
import { useOfferingSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

export default function OfferingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { offerings, providers, catalog, favorites, toggleFavorite } = useApp();
  const { requireLogin, gate } = useLoginGate();
  useOfferingSync(id);
  const offering = offerings.find((item) => item.id === id);
  if (!offering) return <Screen header={<Header title="Offering" back />}><ErrorState body="This offering is not available." onRetry={() => router.back()} /></Screen>;
  const provider = providers.find((item) => item.id === offering.providerId);
  const master = catalog.find((item) => item.id === offering.masterItemId);
  const saved = favorites.offerings.includes(offering.id);
  const price = offering.priceCents == null ? 'Price on request' : `From ${euro(offering.priceCents)}`;
  return (
    <Screen
      header={
        <Header
          title={offering.title}
          back
          right={
            <Pressable accessibilityRole="button" accessibilityLabel="Save offering" onPress={() => toggleFavorite('offerings', offering.id)} style={styles.iconBtn}>
              <Icon name={saved ? 'heartOn' : 'heart'} color={saved ? palette.danger : palette.ink} />
            </Pressable>
          }
        />
      }
      footer={<Button label="Request proposals" onPress={() => requireLogin('/quote')} />}>
      {gate}
      {offering.photo ? <Image source={{ uri: offering.photo }} style={styles.hero} contentFit="cover" transition={200} /> : null}
      <View style={styles.tags}>
        <Badge label={offering.category} />
        <Badge label={offering.offerType} />
        {offering.dietary.map((tag) => <Badge key={tag} label={tag} tone="good" />)}
      </View>
      <Text style={styles.price}>{price}</Text>
      <Text style={styles.body}>{offering.description}</Text>
      <Card>
        <Text style={styles.meta}>Catalog item: {master?.name ?? offering.pendingCatalogName ?? 'Pending suggestion'}</Text>
        <Text style={styles.meta}>Minimum {offering.minQuantity} · Lead time {offering.leadTimeDays} days</Text>
        <Text style={styles.meta}>Fulfilment: {offering.fulfillment.join(', ') || 'Ask the provider'}</Text>
        <Text style={styles.meta}>Included: {offering.included.join(', ') || 'See the description'}</Text>
        {offering.allergens.length ? <Text style={styles.meta}>Provider-declared allergens: {offering.allergens.join(', ')}</Text> : null}
        <Text style={styles.note}>{ALLERGEN_NOTE}</Text>
      </Card>
      {provider ? <Button label={`View ${provider.name}`} variant="secondary" onPress={() => router.push(`/providers/${provider.id}`)} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { height: 200, borderRadius: 18, backgroundColor: palette.well },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  price: { fontSize: 28, fontWeight: '700', color: palette.ink },
  body: { fontSize: 16, lineHeight: 23, color: palette.ink },
  meta: { fontSize: 14, lineHeight: 20, color: palette.ink },
  note: { fontSize: 13, lineHeight: 18, color: palette.muted },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
