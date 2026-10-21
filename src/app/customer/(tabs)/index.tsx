import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { b, CUISINES } from '@/flow2/data/options';
import type { Provider } from '@/flow2/data/types';
import { useApp } from '@/flow2/state/app';

export default function CustomerHomeScreen() {
  const { t, providers } = useApp();
  const [query, setQuery] = useState('');
  const [cuisine, setCuisine] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const toggleFilters = () => {
    if (filtersOpen) {
      setCuisine('all');
      setFiltersOpen(false);
      return;
    }
    setFiltersOpen(true);
  };

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return providers.filter((provider) => {
      const cuisineText = `${provider.cuisine.en} ${provider.cuisine.nl}`.toLowerCase();
      const matchesText = !search || `${provider.name} ${provider.city} ${cuisineText}`.toLowerCase().includes(search);
      const matchesCuisine = cuisine === 'all' || cuisineText.includes(cuisine);
      return matchesText && matchesCuisine;
    });
  }, [providers, query, cuisine]);

  return (
    <Screen header={<Header title={t(b('Alle cateraars', 'All caterers'))} subtitle={t(b('Vind catering voor jouw evenement', 'Find catering for your event'))} />}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Icon name="search" color={palette.muted} size={19} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t(b('Zoek cateraar, keuken of stad', 'Search caterer, cuisine or city'))}
            placeholderTextColor={palette.muted}
            style={styles.searchInput}
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
            <Text style={styles.filterTitle}>{t(b('Filter op keuken', 'Filter by cuisine'))}</Text>
            {cuisine !== 'all' ? <Pressable onPress={() => setCuisine('all')}><Text style={styles.clearText}>{t(b('Wissen', 'Clear'))}</Text></Pressable> : null}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
            <CuisineChip label={t(b('Alles', 'All'))} selected={cuisine === 'all'} onPress={() => setCuisine('all')} />
            {CUISINES.map((item) => <CuisineChip key={item.value} label={t(item.label)} selected={cuisine === item.value} onPress={() => setCuisine(item.value)} />)}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.resultsHeading}>
        <Text style={styles.resultsTitle}>{t(b('Catering bij jou in de buurt', 'Caterers for your event'))}</Text>
        <Text style={styles.count}>{filtered.length}</Text>
      </View>

      {filtered.length === 0 ? (
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
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function CatererCard({ provider, onPress }: { provider: Provider; onPress: () => void }) {
  const { t } = useApp();
  const coverImage = CATERER_COVER_IMAGES[provider.id] ?? CATERER_COVER_IMAGES.default;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.cover}>
        <Image source={{ uri: coverImage }} style={styles.coverImage} contentFit="cover" transition={180} accessibilityLabel={`${provider.name} catering`} />
        <View style={styles.coverShade} />
        <View style={styles.ratingPill}>
          <Icon name="star" color={palette.gold} size={14} filled />
          <Text style={styles.rating}>{provider.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({provider.reviews})</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.nameRow}>
          <View style={styles.nameWrap}>
            <Text style={styles.name} numberOfLines={1}>{provider.name}</Text>
            <Text style={styles.cuisine} numberOfLines={1}>{t(provider.cuisine)}</Text>
          </View>
          <Icon name="chevron" color={palette.accent} size={18} />
        </View>
        <View style={styles.metaRow}>
          <View style={styles.location}>
            <Icon name="pin" color={palette.muted} size={14} />
            <Text style={styles.metaText}>{provider.city} · {provider.radiusKm} km</Text>
          </View>
          <Text style={styles.price}>{t(b('Vanaf', 'From'))} €{provider.fromPrice} <Text style={styles.perPerson}>{t(b('p.p.', 'p.p.'))}</Text></Text>
        </View>
      </View>
    </Pressable>
  );
}

const CATERER_COVER_IMAGES: Record<string, string> = {
  royal: 'https://images.unsplash.com/photo-1773409258502-a9e77a8d80fe?auto=format&fit=crop&w=1100&q=82',
  tasty: 'https://images.unsplash.com/photo-1773040835762-ace903c83f36?auto=format&fit=crop&w=1100&q=82',
  hospitality: 'https://images.unsplash.com/photo-1773409258502-a9e77a8d80fe?auto=format&fit=crop&w=1100&q=82',
  homekitchen: 'https://images.unsplash.com/photo-1773040835762-ace903c83f36?auto=format&fit=crop&w=1100&q=82',
  default: 'https://images.unsplash.com/photo-1773409258502-a9e77a8d80fe?auto=format&fit=crop&w=1100&q=82',
};

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', gap: 9 },
  searchBox: { height: 50, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13, borderRadius: 15, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  searchInput: { flex: 1, minWidth: 0, padding: 0, color: palette.ink, fontSize: 14 },
  filterButton: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: palette.accentSoft, borderWidth: 1, borderColor: '#E6DEFF' },
  filterButtonActive: { backgroundColor: palette.accent, borderColor: palette.accent },
  filterPanel: { gap: 11, backgroundColor: palette.surface, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: palette.line },
  filterTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterTitle: { color: palette.ink, fontSize: 14, fontWeight: '800' },
  clearText: { color: palette.accentDark, fontSize: 12, fontWeight: '700' },
  filterChips: { gap: 8, paddingRight: 4 },
  chip: { minHeight: 36, paddingHorizontal: 13, borderRadius: 18, justifyContent: 'center', backgroundColor: palette.well, borderWidth: 1, borderColor: palette.line },
  chipSelected: { backgroundColor: palette.accent, borderColor: palette.accent },
  chipText: { color: palette.muted, fontSize: 12, fontWeight: '700' },
  chipTextSelected: { color: '#FFFFFF' },
  resultsHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  resultsTitle: { color: palette.ink, fontSize: 17, fontWeight: '800' },
  count: { color: palette.accentDark, fontSize: 12, fontWeight: '800', backgroundColor: palette.accentSoft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, overflow: 'hidden' },
  card: { overflow: 'hidden', backgroundColor: palette.surface, borderRadius: 18, borderWidth: 1, borderColor: palette.line },
  cardPressed: { opacity: 0.92 },
  cover: { height: 158, backgroundColor: palette.accentSoft },
  coverImage: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  coverShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#17132612' },
  ratingPill: { position: 'absolute', top: 11, right: 11, height: 30, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, borderRadius: 15, backgroundColor: '#FFFFFFF2' },
  rating: { color: palette.ink, fontSize: 12, fontWeight: '800' },
  reviewCount: { color: palette.muted, fontSize: 11 },
  cardBody: { padding: 14, gap: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameWrap: { flex: 1, gap: 3 },
  name: { color: palette.ink, fontSize: 16, fontWeight: '800' },
  cuisine: { color: palette.muted, fontSize: 13 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  location: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: palette.muted, fontSize: 12 },
  price: { color: palette.accentDark, fontSize: 13, fontWeight: '800' },
  perPerson: { color: palette.muted, fontSize: 11, fontWeight: '500' },
});
