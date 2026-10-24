import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/flow2/components/Badge';
import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { PackageCard } from '@/flow2/components/PackageCard';
import { Pill, SectionTitle } from '@/flow2/components/SectionTitle';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { useType } from '@/hooks/use-type';
import { money } from '@/flow2/data/format';
import { b } from '@/flow2/data/options';
import { PLAN_LABELS } from '@/flow2/data/seed';
import { useApp } from '@/flow2/state/app';

const APP_LOADED_AT = Date.now();

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang, providers, requests, proposalsFor, packages } = useApp();
  const type = useType();
  const provider = providers.find((item) => item.id === id);

  if (!provider) {
    return (
      <Screen header={<Header title='Provider' back />}>
        <EmptyState icon="store" title='Not found' body='This provider does not exist.' action='Back' onAction={() => router.back()} />
      </Screen>
    );
  }

  const fulfilmentLabels: { value: string; label: { nl: string; en: string } }[] = [
    { value: 'delivery', label: b('Bezorgen', 'Delivery') },
    { value: 'pickup', label: b('Ophalen', 'Pickup') },
    { value: 'onsite', label: b('Op locatie', 'On-site') },
  ].filter((item) => provider.fulfilment.includes(item.value as never));
  const hasReviewEligibleRequest = requests.some((request) =>
    new Date(request.date).getTime() < APP_LOADED_AT &&
    proposalsFor(request.id).some((proposal) => proposal.providerId === provider.id && proposal.contactReleased),
  );

  return (
    <Screen
      header={<Header title={provider.name} subtitle={t(provider.cuisine)} back />}
      footer={<Button label="Request a proposal" onPress={() => router.push({ pathname: '/customer/request', params: { providerId: provider.id } })} />}>
      <Card>
        <View style={styles.head}>
          <View style={styles.logo}>
            {provider.photo ? <Image source={{ uri: provider.photo }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Text style={[styles.logoText, { fontSize: type.pageTitle }]}>{provider.name.charAt(0)}</Text>}
          </View>
          <View style={styles.headText}>
            <Text style={[styles.name, { fontSize: type.sectionTitle }]}>{provider.name}</Text>
            <View style={styles.metaRow}>
              <Icon name="pin" color={palette.muted} size={14} />
              <Text style={[styles.metaText, { fontSize: type.caption }]}>
                {provider.city} · {provider.radiusKm} km
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Icon name="star" color={palette.gold} size={14} filled />
              <Text style={[styles.metaText, { fontSize: type.caption }]}>
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
      </Card>

      {hasReviewEligibleRequest ? <Button label="Write a review" variant="secondary" onPress={() => router.push({ pathname: '/customer/review', params: { providerId: provider.id } } as any)} /> : null}

      <SectionTitle title="Packages" />
      {packages.map((item) => <PackageCard key={item.id} item={item} />)}

      <Card>
        <View style={styles.fromRow}>
          <Text style={[styles.fromLabel, { fontSize: type.body }]}>{'Starting price'}</Text>
          <Text style={[styles.fromValue, { fontSize: type.screenTitle }]}>
            {money(provider.fromPrice, lang)} <Text style={[styles.fromUnit, { fontSize: type.caption }]}>per person</Text>
          </Text>
        </View>
        <View style={styles.pills}>
          {fulfilmentLabels.map((item) => (
            <Pill key={item.value} label={t(item.label)} tone="neutral" />
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', gap: 12 },
  logo: { width: 56, height: 56, borderRadius: 16, overflow: 'hidden', backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontWeight: '800', color: palette.accentDark },
  headText: { flex: 1, gap: 4 },
  name: { fontWeight: '800', color: palette.ink },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: palette.muted },
  tags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  fromRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fromLabel: { color: palette.muted },
  fromValue: { fontWeight: '800', color: palette.ink },
  fromUnit: { fontWeight: '500', color: palette.muted },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
