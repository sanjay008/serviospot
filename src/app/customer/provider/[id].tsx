import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/flow2/components/Badge';
import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { ListRow } from '@/flow2/components/ListRow';
import { MenuDishImage } from '@/flow2/components/MenuDishImage';
import { Notice } from '@/flow2/components/Notice';
import { Pill, SectionTitle } from '@/flow2/components/SectionTitle';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { money } from '@/flow2/data/format';
import { b, CAPABILITIES } from '@/flow2/data/options';
import { PLAN_LABELS } from '@/flow2/data/seed';
import { useApp } from '@/flow2/state/app';

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang, providers, menuItems } = useApp();
  const provider = providers.find((item) => item.id === id);

  if (!provider) {
    return (
      <Screen header={<Header title='Provider' back />}>
        <EmptyState icon="store" title='Not found' body='This provider does not exist.' action='Back' onAction={() => router.back()} />
      </Screen>
    );
  }

  const capabilityLabels = CAPABILITIES.filter((item) => provider.capabilities.includes(item.value));
  const fulfilmentLabels: { value: string; label: { nl: string; en: string } }[] = [
    { value: 'delivery', label: b('Bezorgen', 'Delivery') },
    { value: 'pickup', label: b('Ophalen', 'Pickup') },
    { value: 'onsite', label: b('Op locatie', 'On-site') },
  ].filter((item) => provider.fulfilment.includes(item.value as never));

  return (
    <Screen
      header={<Header title={provider.name} subtitle={t(provider.cuisine)} back />}
      footer={<Button label={'Request a proposal from this provider'} onPress={() => router.push({ pathname: '/customer/request', params: { providerId: provider.id } })} />}>
      <Card>
        <View style={styles.head}>
          <View style={styles.logo}>
            {provider.photo ? <Image source={{ uri: provider.photo }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Text style={styles.logoText}>{provider.name.charAt(0)}</Text>}
          </View>
          <View style={styles.headText}>
            <Text style={styles.name}>{provider.name}</Text>
            <View style={styles.metaRow}>
              <Icon name="pin" color={palette.muted} size={14} />
              <Text style={styles.metaText}>
                {provider.city} · {provider.radiusKm} km
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Icon name="star" color={palette.gold} size={14} filled />
              <Text style={styles.metaText}>
                {provider.rating.toFixed(1)} · {provider.reviews} {'reviews'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.tags}>
          <Badge label={t(PLAN_LABELS[provider.plan])} tone={provider.plan === 'platinum' ? 'gold' : provider.plan === 'gold' ? 'accent' : 'neutral'} />
          {provider.vegetarian !== 'no' ? <Badge label={'Vegetarian'} tone="good" /> : null}
          {provider.halal ? <Badge label={'Halal'} tone="good" /> : null}
          {provider.vegan ? <Badge label={'Vegan'} tone="good" /> : null}
        </View>
        <Text style={styles.description}>{t(provider.description)}</Text>
      </Card>

      <SectionTitle title="Menu & packages" subtitle="Starting prices; confirm the final details with the provider." />
      {(provider.id === 'my-vendor' ? menuItems.filter((item) => item.active) : [
        { id: `${provider.id}-menu-a`, name: `${provider.name} signature buffet`, description: `A popular ${t(provider.cuisine)} package for events.`, price: provider.fromPrice, imageUri: undefined },
        { id: `${provider.id}-menu-b`, name: 'Vegetarian event package', description: 'A flexible vegetarian selection with warm sides.', price: provider.fromPrice + 3, imageUri: undefined },
      ]).map((item) => (
        <Card key={item.id} style={styles.menuCard}>
          <MenuDishImage name={item.name} description={item.description} imageUri={item.imageUri} style={styles.menuImage} />
          <View style={styles.menuHead}>
            <View style={styles.menuText}>
              <Text style={styles.menuName}>{item.name}</Text>
              <Text style={styles.menuPrice}>{money(item.price, lang)} <Text style={styles.menuUnit}>per guest · from</Text></Text>
            </View>
          </View>
          <Text style={styles.description}>{item.description}</Text>
        </Card>
      ))}

      <Card>
        <View style={styles.fromRow}>
          <Text style={styles.fromLabel}>{'Starting price'}</Text>
          <Text style={styles.fromValue}>
            {money(provider.fromPrice, lang)} <Text style={styles.fromUnit}>{'per person incl. VAT'}</Text>
          </Text>
        </View>
        <View style={styles.pills}>
          {fulfilmentLabels.map((item) => (
            <Pill key={item.value} label={t(item.label)} tone="neutral" />
          ))}
          <Pill label={`${provider.radiusKm} km`} tone="neutral" />
        </View>
      </Card>

      <SectionTitle title={'Capabilities'} />
      <View style={styles.pills}>
        {capabilityLabels.map((item) => (
          <Pill key={item.value} label={t(item.label)} />
        ))}
      </View>

      <SectionTitle title={'Profile details'} />
      <Card style={styles.listCard}>
        <ListRow icon="verified" title={'Admin approved'} subtitle={'Approval is not a quality guarantee'} />
      </Card>

      <Button label={'Request without a fixed provider (matching)'} variant="secondary" onPress={() => router.push('/customer/request')} />
      <Notice tone="accent" body={'A request is not a booking. Final price and terms are agreed personally.'} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', gap: 12 },
  logo: { width: 56, height: 56, borderRadius: 16, overflow: 'hidden', backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 26, fontWeight: '800', color: palette.accentDark },
  headText: { flex: 1, gap: 4 },
  name: { fontSize: 18, fontWeight: '800', color: palette.ink },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 13, color: palette.muted },
  tags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  description: { fontSize: 14, lineHeight: 21, color: palette.ink },
  fromRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fromLabel: { fontSize: 15, color: palette.muted },
  fromValue: { fontSize: 20, fontWeight: '800', color: palette.ink },
  fromUnit: { fontSize: 13, fontWeight: '500', color: palette.muted },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  listCard: { paddingVertical: 4 },
  menuCard: { gap: 10 },
  menuImage: { height: 150, borderRadius: 14 },
  menuHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuText: { flex: 1, gap: 3 },
  menuName: { fontSize: 15, fontWeight: '800', color: palette.ink },
  menuPrice: { color: palette.accentDark, fontSize: 16, fontWeight: '800' },
  menuUnit: { color: palette.muted, fontSize: 12, fontWeight: '500' },
});
