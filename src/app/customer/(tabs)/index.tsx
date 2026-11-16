import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { EmptyState } from '@/flow2/components/EmptyState';
import { Button } from '@/flow2/components/Button';
import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { b } from '@/flow2/data/options';
import { API_ENABLED, useGetCategoriesQuery, useGetProvidersQuery, useSearchProvidersQuery } from '@/api';
import { rowsOf, textOf } from '@/api/mappers';
import type { ApiRecord } from '@/api/types';
import { apiMediaUri } from '@/api/media';
import { useType } from '@/hooks/use-type';
import { useApp } from '@/flow2/state/app';

export default function CustomerHomeScreen() {
  const { t } = useApp();
  const type = useType();
  const [query, setQuery] = useState('');
  const [cuisine, setCuisine] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const categoriesQuery = useGetCategoriesQuery(undefined, { skip: !API_ENABLED });
  const filters = { ...(query.trim() ? { q: query.trim() } : {}), ...(cuisine !== 'all' ? { category: cuisine } : {}) };
  const searchQuery = useSearchProvidersQuery(filters, { skip: !API_ENABLED || Object.keys(filters).length === 0 });
  const providersQuery = useGetProvidersQuery(undefined, { skip: !API_ENABLED || Object.keys(filters).length > 0 });
  const providerRows = rowsOf(Object.keys(filters).length ? searchQuery.data : providersQuery.data);
  const isLoading = (Object.keys(filters).length ? searchQuery : providersQuery).isLoading;
  const isFetching = (Object.keys(filters).length ? searchQuery : providersQuery).isFetching;
  const categoryRows = rowsOf(categoriesQuery.data);
  const resultsQuery = Object.keys(filters).length ? searchQuery : providersQuery;

  const toggleFilters = () => {
    if (filtersOpen) {
      setCuisine('all');
      setFiltersOpen(false);
      return;
    }
    setFiltersOpen(true);
  };

  const filtered = useMemo(() => providerRows.map(mapProvider).filter((provider) => provider.id), [providerRows]);

  return (
    <Screen loading={isLoading} refreshing={isFetching && !isLoading} onRefresh={() => { void (Object.keys(filters).length ? searchQuery.refetch() : providersQuery.refetch()); void categoriesQuery.refetch(); }} header={<Header title={t(b('Alle cateraars', 'All caterers'))} subtitle={t(b('Vind catering voor jouw evenement', 'Find catering for your event'))} />}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Icon name="search" color={palette.muted} size={19} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t(b('Zoek cateraar, keuken of stad', 'Search caterer, cuisine or city'))}
            placeholderTextColor={palette.muted}
            style={[styles.searchInput, { fontSize: type.secondary }]}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query ? <Pressable accessibilityRole="button" accessibilityLabel={t(b('Wissen', 'Clear'))} onPress={() => setQuery('')}><Icon name="close" color={palette.muted} size={18} /></Pressable> : null}
        </View>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: filtersOpen }} onPress={toggleFilters} style={[styles.filterButton, filtersOpen && styles.filterButtonActive]}>
          <Icon name="filter" color={filtersOpen ? '#FFFFFF' : palette.accentDark} size={19} />
        </Pressable>
      </View>

      {filtersOpen ? (
        <View style={styles.filterPanel}>
          <View style={styles.filterTitleRow}>
            <Text style={[styles.filterTitle, { fontSize: type.secondary }]}>{t(b('Filter op keuken', 'Filter by cuisine'))}</Text>
            {cuisine !== 'all' ? <Pressable onPress={() => setCuisine('all')}><Text style={[styles.clearText, { fontSize: type.small }]}>{t(b('Wissen', 'Clear'))}</Text></Pressable> : null}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
            <CuisineChip label={t(b('Alles', 'All'))} selected={cuisine === 'all'} onPress={() => setCuisine('all')} />
            {categoryRows.map((item, index) => { const value = String(item.category_id ?? item.id ?? item.slug ?? item.name ?? index); const label = String(item.name ?? item.title ?? item.category_name ?? value); return <CuisineChip key={value} label={label} selected={cuisine === value} onPress={() => setCuisine(value)} />; })}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.resultsHeading}>
        <Text style={[styles.resultsTitle, { fontSize: type.sectionTitle }]}>{t(b('Catering bij jou in de buurt', 'Caterers for your event'))}</Text>
        <Text style={[styles.count, { fontSize: type.small }]}>{filtered.length}</Text>
      </View>

      {!API_ENABLED ? <EmptyState title="API unavailable" body="Enable the backend API to load caterers." /> : resultsQuery.isError ? (
        <View style={styles.loadError}><EmptyState title={t(b('Cateraars laden niet', 'Could not load caterers'))} body={t(b('De server kon de cateraars niet laden. Probeer opnieuw.', 'The server could not load caterers. Please try again.'))} /><Button label={t(b('Opnieuw proberen', 'Try again'))} variant="secondary" onPress={() => { void resultsQuery.refetch(); }} /></View>
      ) : filtered.length === 0 ? (
        <EmptyState title={t(b('Geen cateraars gevonden', 'No caterers found'))} body={t(b('Pas je zoekopdracht of filters aan.', 'Try changing your search or filters.'))} action={t(b('Wis filters', 'Clear filters'))} onAction={() => { setQuery(''); setCuisine('all'); }} />
      ) : (
        filtered.map((provider) => (
          <CatererCard key={provider.id} provider={provider} onPress={() => router.push(`/customer/provider/${provider.id}` as any)} />
        ))
      )}
    </Screen>
  );
}

function CuisineChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const type = useType();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, { fontSize: type.small }, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

type ApiProvider = {
  id: string;
  name?: string;
  photo?: string;
  city?: string;
  rating?: number;
};

function present(value?: string | number | null) {
  if (value === undefined || value === null) return undefined;
  const clean = String(value).trim();
  if (!clean || clean.toLowerCase() === 'null') return undefined;
  return clean;
}

function numberOf(row: ApiRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = Number(row[key]);
    if (Number.isFinite(value) && value >= 0) return value;
  }
  return undefined;
}

function mapProvider(row: ApiRecord): ApiProvider {
  return {
    id: String(row.provider_id ?? row.vendor_id ?? row.id ?? ''),
    name: present(textOf(row, 'name', 'business_name', 'provider_name', 'vendor_name', 'title')),
    photo: apiMediaUri(textOf(row, 'photo', 'logo', 'image', 'profile_photo', 'cover_image', 'image_url', 'photo_url')),
    city: present(textOf(row, 'city')),
    rating: numberOf(row, 'rating', 'average_rating', 'avg_rating'),
  };
}

function CatererCard({ provider, onPress }: { provider: ApiProvider; onPress: () => void }) {
  const type = useType();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.cover}>
        {provider.photo ? (
          <Image source={{ uri: provider.photo }} style={styles.coverImage} contentFit="cover" transition={180} accessibilityLabel={`${provider.name ?? 'Caterer'} catering`} />
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.placeholderIcon}>
              <Icon name="photo" color={palette.accent} size={28} />
            </View>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        {provider.name ? <Text style={[styles.name, { fontSize: type.cardTitle }]} numberOfLines={1}>{provider.name}</Text> : null}
        <View style={styles.metaRow}>
          {provider.city ? (
            <View style={styles.location}>
              <Icon name="pin" color={palette.muted} size={14} />
              <Text style={[styles.metaText, { fontSize: type.small }]}>{provider.city}</Text>
            </View>
          ) : <View />}
          {provider.rating !== undefined ? (
            <View style={styles.ratingRow}>
              <Icon name="star" color={palette.gold} size={14} filled />
              <Text style={[styles.rating, { fontSize: type.small }]}>{provider.rating}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', gap: 9 },
  loadError: { gap: 12 },
  searchBox: { height: 50, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13, borderRadius: 15, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  searchInput: { flex: 1, minWidth: 0, padding: 0, color: palette.ink },
  filterButton: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: palette.accentSoft, borderWidth: 1, borderColor: '#E6DEFF' },
  filterButtonActive: { backgroundColor: palette.accent, borderColor: palette.accent },
  filterPanel: { gap: 11, backgroundColor: palette.surface, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: palette.line },
  filterTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterTitle: { color: palette.ink, fontWeight: '800' },
  clearText: { color: palette.accentDark, fontWeight: '700' },
  filterChips: { gap: 8, paddingRight: 4 },
  chip: { minHeight: 36, paddingHorizontal: 13, borderRadius: 18, justifyContent: 'center', backgroundColor: palette.well, borderWidth: 1, borderColor: palette.line },
  chipSelected: { backgroundColor: palette.accent, borderColor: palette.accent },
  chipText: { color: palette.muted, fontWeight: '700' },
  chipTextSelected: { color: '#FFFFFF' },
  resultsHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  resultsTitle: { color: palette.ink, fontWeight: '800' },
  count: { color: palette.accentDark, fontWeight: '800', backgroundColor: palette.accentSoft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, overflow: 'hidden' },
  card: { overflow: 'hidden', backgroundColor: palette.surface, borderRadius: 18, borderWidth: 1, borderColor: palette.line },
  cardPressed: { opacity: 0.92 },
  cover: { height: 148, backgroundColor: palette.well, overflow: 'hidden' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accentSoft },
  placeholderIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  coverImage: { width: '100%', height: '100%' },
  cardBody: { padding: 14, gap: 8 },
  name: { color: palette.ink, fontWeight: '800' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  location: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: palette.muted },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { color: palette.ink, fontWeight: '800' },
});
