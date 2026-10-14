import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ErrorState } from '@/components/ErrorState';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { OfferingCard } from '@/components/OfferingCard';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { euro } from '@/data/format';
import { useLoginGate } from '@/hooks/use-login-gate';
import { useProviderSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

export default function ProviderProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { providers, offerings, reviews, favorites, toggleFavorite, planById } = useApp();
  const { requireLogin, gate } = useLoginGate();
  useProviderSync(id);
  const provider = providers.find((item) => item.id === id);
  if (!provider) return <Screen header={<Header title="Provider" back />}><ErrorState body="This provider was not found." onRetry={() => router.back()} /></Screen>;
  const menu = offerings.filter((item) => item.providerId === provider.id && item.active);
  const feedback = reviews.filter((item) => item.providerId === provider.id);
  const contactOpen = planById(provider.plan).entitlements.contactVisible;
  const saved = favorites.providers.includes(provider.id);
  return (
    <Screen
      refresh
      header={
        <Header
          title={provider.name}
          back
          right={
            <Pressable accessibilityRole="button" accessibilityLabel={saved ? 'Remove favorite' : 'Save provider'} onPress={() => toggleFavorite('providers', provider.id)} style={styles.iconBtn}>
              <Icon name={saved ? 'heartOn' : 'heart'} color={saved ? palette.danger : palette.ink} />
            </Pressable>
          }
        />
      }
      footer={<Button label="Request proposals" onPress={() => requireLogin('/quote')} />}>
      {gate}
      <View style={[styles.cover, styles.coverEmpty, { backgroundColor: provider.cover }]}>
        {provider.photo ? (
          <Image source={{ uri: provider.photo }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <Icon name="store" color="#fff" size={44} />
        )}
      </View>
      <Text style={styles.intro}>{provider.intro}</Text>
      <View style={styles.tags}>
        {provider.verified ? <Badge label="Verified" tone="good" /> : <Badge label="Not verified" />}
        <Badge label={provider.kvkState === 'verified' ? 'KvK verified' : `KvK ${provider.kvkState}`} tone={provider.kvkState === 'verified' ? 'good' : 'warn'} />
        <Badge label={`${provider.rating.toFixed(1)} (${provider.reviewCount})`} tone="gold" />
      </View>
      <Card>
        <Text style={styles.block}>{provider.description}</Text>
        <Text style={styles.meta}>{provider.type} · {provider.city}, {provider.province}</Text>
        <Text style={styles.meta}>Service area about {provider.radiusKm} km · {provider.minGuests}–{provider.maxGuests} guests</Text>
        <Text style={styles.meta}>Minimum order {euro(provider.minOrderCents)} · From {euro(provider.startingPriceCents)}</Text>
        <Text style={styles.meta}>Languages: {provider.languages.join(', ')}</Text>
        <Text style={styles.meta}>{provider.responseTime}</Text>
      </Card>
      <Card>
        <Text style={styles.heading}>Contact</Text>
        {contactOpen ? (
          <>
            <Text selectable style={styles.block}>{provider.contactPerson}</Text>
            <Text selectable style={styles.block}>{provider.phone}</Text>
            <Text selectable style={styles.block}>{provider.email}</Text>
            <Text style={styles.meta}>Shown because this plan includes profile contact. A quote match still uses “Continue with provider”.</Text>
          </>
        ) : (
          <Text style={styles.block}>
            {provider.plan === 'free'
              ? 'This is a Free listing. The name and basic details are public. Phone, email and price requests are off.'
              : 'This is a Gold listing. You can ask for a price. Phone and email stay hidden until the provider is on Platinum.'}
          </Text>
        )}
        <Text style={styles.meta}>{provider.website}</Text>
      </Card>
      <Text style={styles.heading}>Menu</Text>
      {menu.map((offering) => (
        <OfferingCard key={offering.id} offering={offering} saved={favorites.offerings.includes(offering.id)} onPress={() => router.push(`/offering/${offering.id}`)} onSave={() => toggleFavorite('offerings', offering.id)} />
      ))}
      <Text style={styles.heading}>Reviews</Text>
      {feedback.length === 0 ? <Text style={styles.meta}>No verified reviews yet.</Text> : null}
      {feedback.slice(0, 2).map((review) => (
        <Card key={review.id}>
          <Text style={styles.block}>{review.author} · {review.overall}/5 {review.verified ? '· Verified job' : ''}</Text>
          <Text style={styles.meta}>{review.text}</Text>
        </Card>
      ))}
      <Button label="Report this profile" variant="ghost" onPress={() => router.push(`/report?target=provider:${provider.id}`)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cover: { height: 180, borderRadius: 18, overflow: 'hidden' },
  coverEmpty: { alignItems: 'center', justifyContent: 'center' },
  intro: { fontSize: 16, lineHeight: 22, color: palette.ink },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  heading: { fontSize: 18, fontWeight: '700', color: palette.ink },
  block: { fontSize: 15, lineHeight: 22, color: palette.ink },
  meta: { fontSize: 14, lineHeight: 20, color: palette.muted },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
