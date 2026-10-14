import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { LangToggle } from '@/components/LangToggle';
import { ListRow } from '@/components/ListRow';
import { Notice } from '@/components/Notice';
import { Pill, SectionTitle } from '@/components/SectionTitle';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { money } from '@/data/format';
import { b, CAPABILITIES } from '@/data/options';
import { PLAN_LABELS } from '@/data/seed';
import { useApp } from '@/state/app';

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang, providers } = useApp();
  const provider = providers.find((item) => item.id === id);

  if (!provider) {
    return (
      <Screen header={<Header title={t(b('Aanbieder', 'Provider'))} back right={<LangToggle />} />}>
        <EmptyState icon="store" title={t(b('Niet gevonden', 'Not found'))} body={t(b('Deze aanbieder bestaat niet.', 'This provider does not exist.'))} action={t(b('Terug', 'Back'))} onAction={() => router.back()} />
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
      header={<Header title={provider.name} subtitle={t(provider.cuisine)} back right={<LangToggle />} />}
      footer={<Button label={t(b('Vraag deze aanbieder', 'Request this provider'))} onPress={() => router.push({ pathname: '/customer/request', params: { providerId: provider.id } })} />}>
      <Card>
        <View style={styles.head}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>{provider.name.charAt(0)}</Text>
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
                {provider.rating.toFixed(1)} · {provider.reviews} {t(b('reviews', 'reviews'))}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.tags}>
          <Badge label={t(PLAN_LABELS[provider.plan])} tone={provider.plan === 'platinum' ? 'gold' : provider.plan === 'gold' ? 'accent' : 'neutral'} />
          {provider.vegetarian !== 'no' ? <Badge label={t(b('Vegetarisch', 'Vegetarian'))} tone="good" /> : null}
          {provider.halal ? <Badge label={t(b('Halal', 'Halal'))} tone="good" /> : null}
          {provider.vegan ? <Badge label={t(b('Vegan', 'Vegan'))} tone="good" /> : null}
        </View>
        <Text style={styles.description}>{t(provider.description)}</Text>
      </Card>

      <Card>
        <View style={styles.fromRow}>
          <Text style={styles.fromLabel}>{t(b('Vanafprijs', 'Starting price'))}</Text>
          <Text style={styles.fromValue}>
            {money(provider.fromPrice, lang)} <Text style={styles.fromUnit}>{t(b('p.p. incl. btw', 'p.p. incl. VAT'))}</Text>
          </Text>
        </View>
        <View style={styles.pills}>
          {fulfilmentLabels.map((item) => (
            <Pill key={item.value} label={t(item.label)} tone="neutral" />
          ))}
          <Pill label={`${provider.radiusKm} km`} tone="neutral" />
        </View>
      </Card>

      <SectionTitle title={t(b('Mogelijkheden', 'Capabilities'))} />
      <View style={styles.pills}>
        {capabilityLabels.map((item) => (
          <Pill key={item.value} label={t(item.label)} />
        ))}
      </View>

      <SectionTitle title={t(b('Meer', 'More'))} />
      <Card style={styles.listCard}>
        <ListRow icon="doc" title={t(b('Menu-PDF', 'Menu PDF'))} subtitle={t(b('Na moderatie zichtbaar', 'Visible after moderation'))} />
        <ListRow icon="photo" title={t(b('Foto’s', 'Photos'))} subtitle={t(b('12 foto’s op het profiel', '12 photos on the profile'))} />
        <ListRow icon="verified" title={t(b('Admin goedgekeurd', 'Admin approved'))} subtitle={t(b('Goedkeuring is geen kwaliteitsgarantie', 'Approval is not a quality guarantee'))} />
      </Card>

      <Button label={t(b('Aanvraag zonder vaste aanbieder (matching)', 'Request without a fixed provider (matching)'))} variant="secondary" onPress={() => router.push('/customer/request')} />
      <Notice tone="accent" body={t(b('Een aanvraag is geen boeking. Definitieve prijs en voorwaarden spreek je persoonlijk af.', 'A request is not a booking. Final price and terms are agreed personally.'))} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', gap: 12 },
  logo: { width: 56, height: 56, borderRadius: 16, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
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
});
