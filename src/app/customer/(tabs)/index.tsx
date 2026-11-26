import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { API_ENABLED, useDeleteFavoriteMutation, useGetCategoriesQuery, useGetFavoritesQuery, useGetProvidersQuery, useSaveFavoriteMutation, useSearchProvidersQuery } from '@/api';
import { rowsOf, textOf } from '@/api/mappers';
import { apiMediaUri } from '@/api/media';
import type { ApiRecord } from '@/api/types';
import { CatererCard, type CatererCardModel } from '@/components/CatererCard';
import { euro } from '@/data/format';
import type { Lang } from '@/flow2/data/types';
import { Button } from '@/flow2/components/Button';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
import { palette, spacing } from '@/flow2/constants/theme';
import { b } from '@/flow2/data/options';
import { useApp } from '@/flow2/state/app';
import { useType } from '@/hooks/use-type';
import { useApp as useSession } from '@/state/store';

export default function CustomerHomeScreen() {
  const { t, lang } = useApp();
  const { session, restored } = useSession();
  const signedIn = API_ENABLED && restored && session.signedIn && session.mode === 'customer';
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
  const favoritesQuery = useGetFavoritesQuery(undefined, { skip: !signedIn });
  const [saveFavorite, saveState] = useSaveFavoriteMutation();
  const [deleteFavorite, deleteState] = useDeleteFavoriteMutation();
  const [favoriteError, setFavoriteError] = useState('');
  const favoriteByProvider = useMemo(() => favoriteIds(rowsOf(favoritesQuery.data)), [favoritesQuery.data]);

  const toggleFilters = () => {
    if (filtersOpen) {
      setCuisine('all');
      setFiltersOpen(false);
      return;
    }
    setFiltersOpen(true);
  };

  const filtered = useMemo(() => providerRows.map((row) => mapProvider(row, lang)).filter((provider) => provider.id), [lang, providerRows]);

  const toggleFavorite = async (providerId: string) => {
    if (!signedIn) return;
    if (!favoritesQuery.isSuccess) {
      setFavoriteError(t(b('Favorieten zijn nog niet geladen.', 'Favorites are still loading.')));
      return;
    }
    setFavoriteError('');
    try {
      const favoriteId = favoriteByProvider.get(providerId);
      if (favoriteId) await deleteFavorite(favoriteId).unwrap();
      else await saveFavorite({ type: 'provider', id: providerId }).unwrap();
    } catch (cause) {
      const message = cause && typeof cause === 'object' && 'message' in cause && typeof cause.message === 'string' ? cause.message : t(b('Favoriet kon niet worden opgeslagen.', 'Could not update this favorite.'));
      setFavoriteError(message);
    }
  };

  return (
    <Screen scroll={false} canvas={palette.bg} loading={isLoading} style={styles.screen} header={<Header title={t(b('Alle cateraars', 'All caterers'))} subtitle={t(b('Beschikbare cateraars', 'Available caterers'))} />}>
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

      {favoriteError ? <Notice tone="error" body={favoriteError} /> : null}

      {!API_ENABLED ? <EmptyState title="API unavailable" body="Enable the backend API to load caterers." /> : resultsQuery.isError ? (
        <View style={styles.loadError}><EmptyState title={t(b('Cateraars laden niet', 'Could not load caterers'))} body={t(b('De server kon de cateraars niet laden. Probeer opnieuw.', 'The server could not load caterers. Please try again.'))} /><Button label={t(b('Opnieuw proberen', 'Try again'))} variant="secondary" onPress={() => { void resultsQuery.refetch(); }} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => { void resultsQuery.refetch(); void categoriesQuery.refetch(); if (signedIn) void favoritesQuery.refetch(); }} tintColor={palette.accent} colors={[palette.accent]} />}
          ListHeaderComponent={
            <View style={styles.resultsHeading}>
              <Text style={[styles.resultsTitle, { fontSize: type.sectionTitle }]}>{t(b('Beschikbare cateraars', 'Available caterers'))}</Text>
              <Text style={[styles.count, { fontSize: type.small }]}>{filtered.length}</Text>
            </View>
          }
          ListEmptyComponent={<EmptyState title={t(b('Geen cateraars gevonden', 'No caterers found'))} body={t(b('Pas je zoekopdracht of filters aan.', 'Try changing your search or filters.'))} action={t(b('Wis filters', 'Clear filters'))} onAction={() => { setQuery(''); setCuisine('all'); }} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const favoriteId = favoriteByProvider.get(item.id);
            const model: CatererCardModel = { ...item, favorite: favoritesQuery.isSuccess ? Boolean(favoriteId) : item.favorite, favoriteBusy: saveState.isLoading || deleteState.isLoading };
            return (
              <CatererCard
                caterer={model}
                onPress={() => router.push(`/customer/provider/${item.id}` as never)}
                onFavorite={signedIn ? () => { void toggleFavorite(item.id); } : undefined}
              />
            );
          }}
        />
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

function mapProvider(row: ApiRecord, lang: Lang): CatererCardModel {
  const logo = media(textOf(row, 'logo'));
  const photo = media(textOf(row, 'photo'));
  const cents = centsOf(row, 'from_price_cents') ?? centsOf(row, 'starting_price_cents');
  const count = Number(row.review_count);
  return {
    id: String(row.provider_id ?? row.id ?? ''),
    name: present(textOf(row, 'name', 'business_name')) || (lang === 'nl' ? 'Cateraar' : lang === 'ar' ? 'متعهد طعام' : 'Caterer'),
    city: present(textOf(row, 'city')),
    image: logo || photo,
    imageKind: logo ? 'logo' : photo ? 'photo' : undefined,
    reviewCount: Number.isFinite(count) && count > 0 ? count : 0,
    verified: row.verified === true || row.verified === 1 || row.verified === '1' || row.verified === 'true',
    price: cents == null ? undefined : formatCents(cents, present(textOf(row, 'currency')), lang),
    guests: guestRange(row, lang),
    favorite: row.is_favorite === true || row.is_favorite === 1 || row.is_favorite === '1' || row.is_favorite === 'true',
  };
}

function favoriteIds(rows: ApiRecord[]) {
  const map = new Map<string, string>();
  rows.forEach((row) => {
    const typeName = textOf(row, 'type', 'favorite_type');
    if (typeName && typeName !== 'provider') return;
    const providerId = String(row.target_id ?? row.provider_id ?? (row.provider && typeof row.provider === 'object' ? (row.provider as ApiRecord).id ?? '' : ''));
    const favoriteId = String(row.favorite_id ?? row.id ?? '');
    if (providerId && favoriteId) map.set(providerId, favoriteId);
  });
  return map;
}

function present(value?: string | null) {
  if (!value) return undefined;
  const clean = value.trim();
  if (!clean || clean.toLowerCase() === 'null') return undefined;
  return clean;
}

function media(value?: string) {
  const uri = apiMediaUri(present(value));
  if (!uri || /^https?:\/\/[^/\s]+\/data:/i.test(uri)) return undefined;
  return uri;
}

function centsOf(row: ApiRecord, key: string) {
  if (!(key in row) || row[key] == null || row[key] === '') return null;
  const value = Number(row[key]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function formatCents(cents: number, currency: string | undefined, lang: Lang) {
  const code = (currency || 'EUR').toUpperCase();
  if (!/^[A-Z]{3}$/.test(code) || code === 'EUR') return euro(cents);
  return new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : lang === 'ar' ? 'ar' : 'en-GB', { style: 'currency', currency: code }).format(cents / 100);
}

function guestRange(row: ApiRecord, lang: Lang) {
  const min = positive(row.min_guests);
  const max = positive(row.max_guests);
  const guests = lang === 'nl' ? 'gasten' : lang === 'ar' ? 'ضيوف' : 'guests';
  if (min && max) return `${min}–${max} ${guests}`;
  if (min) return lang === 'nl' ? `Minimaal ${min} ${guests}` : lang === 'ar' ? `${min} ${guests} على الأقل` : `Minimum ${min} ${guests}`;
  if (max) return lang === 'nl' ? `Tot ${max} ${guests}` : lang === 'ar' ? `حتى ${max} ${guests}` : `Up to ${max} ${guests}`;
  return undefined;
}

function positive(value: unknown) {
  if (value == null || value === '') return undefined;
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : undefined;
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: spacing.md, gap: spacing.md },
  list: { flex: 1 },
  listContent: { paddingBottom: spacing.xl },
  separator: { height: 10 },
  searchRow: { flexDirection: 'row', gap: 10 },
  loadError: { gap: 12 },
  searchBox: {
    height: 44,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
  },
  searchInput: { flex: 1, minWidth: 0, padding: 0, color: palette.ink, fontWeight: '500' },
  filterButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
  },
  filterButtonActive: { backgroundColor: palette.accent, borderColor: palette.accent },
  filterPanel: {
    gap: 12,
    backgroundColor: palette.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.line,
  },
  filterTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterTitle: { color: palette.ink, fontWeight: '800' },
  clearText: { color: palette.accentDark, fontWeight: '700' },
  filterChips: { gap: 8, paddingRight: 4 },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    justifyContent: 'center',
    backgroundColor: palette.well,
    borderWidth: 1.5,
    borderColor: palette.line,
  },
  chipSelected: { backgroundColor: palette.accent, borderColor: palette.accent },
  chipText: { color: palette.inkSecondary, fontWeight: '700' },
  chipTextSelected: { color: palette.white },
  resultsHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  resultsTitle: { color: palette.ink, fontWeight: '600', flex: 1, paddingRight: 10 },
  count: { color: palette.muted, fontWeight: '600' },
});
