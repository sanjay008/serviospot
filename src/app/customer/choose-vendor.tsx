import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { API_ENABLED, useGetProvidersQuery, useSearchProvidersQuery } from '@/api';
import { rowsOf, textOf } from '@/api/mappers';
import { apiMediaUri } from '@/api/media';
import type { ApiRecord } from '@/api/types';
import { Button } from '@/flow2/components/Button';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { b } from '@/flow2/data/options';
import { useApp } from '@/flow2/state/app';
import { useType } from '@/hooks/use-type';

export default function ChooseVendorScreen() {
  const { t, resetDraft } = useApp();
  const type = useType();
  const [query, setQuery] = useState('');
  const filters = query.trim() ? { q: query.trim() } : {};
  const searching = Object.keys(filters).length > 0;
  const searchQuery = useSearchProvidersQuery(filters, { skip: !API_ENABLED || !searching });
  const providersQuery = useGetProvidersQuery(undefined, { skip: !API_ENABLED || searching });
  const activeQuery = searching ? searchQuery : providersQuery;
  const vendors = useMemo(() => rowsOf(activeQuery.data).map(mapVendor).filter((vendor) => vendor.id), [activeQuery.data]);

  const choose = (vendor: Vendor) => {
    resetDraft();
    router.push({ pathname: '/customer/request', params: { providerId: vendor.id, providerName: vendor.name ?? '', fresh: String(Date.now()) } });
  };

  return (
    <Screen
      canvas={palette.bg}
      loading={activeQuery.isLoading}
      refreshing={activeQuery.isFetching && !activeQuery.isLoading}
      onRefresh={() => { void activeQuery.refetch(); }}
      header={<Header title={t(b('Kies een cateraar', 'Choose a caterer'))} subtitle={t(b('De aanvraag gaat naar deze cateraar.', 'This request is for the caterer you select.'))} back />}>
      <View style={styles.searchBox}>
        <Icon name="search" color={palette.muted} size={18} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t(b('Zoek cateraar of stad', 'Search caterer or city'))}
          placeholderTextColor={palette.muted}
          style={[styles.searchInput, { fontSize: type.secondary }]}
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>
      {!API_ENABLED ? <EmptyState title="API unavailable" body="Enable the backend API to load caterers." /> : activeQuery.isError ? (
        <View style={styles.errorBlock}>
          <EmptyState title={t(b('Cateraars laden niet', 'Could not load caterers'))} body={t(b('Probeer opnieuw.', 'Please try again.'))} />
          <Button label={t(b('Opnieuw proberen', 'Try again'))} variant="secondary" onPress={() => { void activeQuery.refetch(); }} />
        </View>
      ) : vendors.length === 0 ? (
        <EmptyState title={t(b('Geen cateraars gevonden', 'No caterers found'))} body={t(b('Pas je zoekopdracht aan.', 'Try a different search.'))} />
      ) : vendors.map((vendor) => (
        <Pressable key={vendor.id} accessibilityRole="button" accessibilityLabel={vendor.name || 'Caterer'} onPress={() => choose(vendor)} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
          <View style={styles.avatar}>
            {vendor.photo ? <Image source={{ uri: vendor.photo }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Icon name="food" color={palette.accent} size={20} />}
          </View>
          <View style={styles.copy}>
            <Text style={[styles.name, { fontSize: type.cardTitle }]} numberOfLines={1}>{vendor.name || 'Caterer'}</Text>
            {vendor.city ? <Text style={[styles.city, { fontSize: type.small }]} numberOfLines={1}>{vendor.city}</Text> : null}
          </View>
          <Icon name="chevron" color={palette.accentDark} size={18} />
        </Pressable>
      ))}
    </Screen>
  );
}

type Vendor = { id: string; name?: string; city?: string; photo?: string };

function present(value?: string) {
  const clean = value?.trim();
  if (!clean || clean.toLowerCase() === 'null') return undefined;
  return clean;
}

function mapVendor(row: ApiRecord): Vendor {
  return {
    id: String(row.provider_id ?? row.vendor_id ?? row.id ?? ''),
    name: present(textOf(row, 'name', 'business_name', 'provider_name', 'vendor_name', 'title')),
    city: present(textOf(row, 'city')),
    photo: apiMediaUri(textOf(row, 'photo', 'logo', 'image', 'profile_photo', 'cover_image', 'image_url', 'photo_url')),
  };
}

const styles = StyleSheet.create({
  searchBox: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  searchInput: { flex: 1, color: palette.ink, paddingVertical: 8 },
  errorBlock: { gap: 12 },
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  rowPressed: { borderColor: palette.accentMid },
  avatar: { width: 48, height: 48, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accentSoft },
  copy: { flex: 1, gap: 2 },
  name: { color: palette.ink, fontWeight: '800' },
  city: { color: palette.muted },
});
