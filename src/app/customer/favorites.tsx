import { router } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { PageTitle } from '@/components/Header';
import { OfferingCard } from '@/components/OfferingCard';
import { ProviderCard } from '@/components/ProviderCard';
import { Screen } from '@/components/Screen';
import { useApp } from '@/state/store';

export default function FavoritesScreen() {
  const { favorites, providers, offerings, toggleFavorite, session } = useApp();
  const savedProviders = providers.filter((provider) => favorites.providers.includes(provider.id));
  const savedOfferings = offerings.filter((offering) => favorites.offerings.includes(offering.id));
  const empty = savedProviders.length + savedOfferings.length === 0;
  return (
    <Screen tab>
      <PageTitle title="Saved" subtitle={session.signedIn ? 'Caterers and menus you kept.' : 'Sign in to keep these on your account.'} />
      {empty ? <EmptyState icon="heart" title="Nothing saved yet" body="Save a provider or a menu while you browse. Saved search alerts are not part of this version." /> : null}
      {savedProviders.map((provider) => (
        <ProviderCard key={provider.id} provider={provider} saved onPress={() => router.push(`/providers/${provider.id}`)} onSave={() => toggleFavorite('providers', provider.id)} />
      ))}
      {savedOfferings.map((offering) => (
        <OfferingCard
          key={offering.id}
          offering={offering}
          providerName={providers.find((provider) => provider.id === offering.providerId)?.name}
          saved
          onPress={() => router.push(`/offering/${offering.id}`)}
          onSave={() => toggleFavorite('offerings', offering.id)}
        />
      ))}
    </Screen>
  );
}
