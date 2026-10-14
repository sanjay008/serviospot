import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Grid } from '@/components/Grid';
import { FilterSheet } from '@/components/FilterSheet';
import { Header } from '@/components/Header';
import { ProviderCard } from '@/components/ProviderCard';
import { Screen } from '@/components/Screen';
import { SearchBar } from '@/components/SearchBar';
import { palette } from '@/constants/theme';
import { emptyFilters } from '@/data/mock';
import { searchProviders } from '@/data/search';
import type { SearchFilters } from '@/data/types';
import { useResponsive } from '@/hooks/use-responsive';
import { useSearchSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string; category?: string }>();
  const { providers, offerings, favorites, toggleFavorite } = useApp();
  const { isTablet } = useResponsive();
  const [query, setQuery] = useState(params.q ?? '');
  const [filters, setFilters] = useState<SearchFilters>({ ...emptyFilters(), category: params.category ?? null });
  const [open, setOpen] = useState(false);
  useSearchSync(query, filters);
  const results = useMemo(() => searchProviders(providers, offerings, query, filters), [providers, offerings, query, filters]);
  const active = Number(Boolean(filters.city || filters.cuisine || filters.category || filters.eventType || filters.guests || filters.maxPrice || filters.dietary.length || filters.fulfillment.length || filters.staff || filters.verifiedOnly || filters.minRating || filters.distanceKm));

  return (
    <Screen refresh header={<Header title="Search" back />}>
      <SearchBar value={query} onChangeText={setQuery} onFilter={() => setOpen(true)} autoFocus />
      <Text style={styles.count}>
        {results.length} provider{results.length === 1 ? '' : 's'}
        {active ? ' · filters on' : ''}
      </Text>
      <Text style={styles.note}>Order follows relevance, distance and reviews. A paid plan does not move a provider up this list.</Text>
      {results.length === 0 ? <EmptyState icon="search" title="No matches" body="Try a cuisine, a city, or clear a filter. Guest count and distance remove providers who cannot cover the event." action="Clear filters" onAction={() => setFilters(emptyFilters())} /> : null}
      {results.length > 0 ? (
        <Grid minItem={300} maxColumns={isTablet ? 2 : 1} gap={12}>
          {results.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} saved={favorites.providers.includes(provider.id)} onPress={() => router.push(`/providers/${provider.id}`)} onSave={() => toggleFavorite('providers', provider.id)} />
          ))}
        </Grid>
      ) : null}
      <FilterSheet visible={open} filters={filters} onChange={setFilters} onClose={() => setOpen(false)} onClear={() => setFilters(emptyFilters())} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  count: { fontSize: 16, fontWeight: '700', color: palette.ink },
  note: { color: palette.muted, fontSize: 13, lineHeight: 18, marginTop: -8 },
});
