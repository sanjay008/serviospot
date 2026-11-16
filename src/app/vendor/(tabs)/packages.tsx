import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { Screen } from '@/flow2/components/Screen';
import { API_ENABLED, useGetVendorOfferingsQuery } from '@/api';
import { useApp as useSession } from '@/state/store';
import { rowsOf, textOf } from '@/api/mappers';
import { Notice } from '@/flow2/components/Notice';
import { palette } from '@/flow2/constants/theme';
import { OfferingSummaryCard } from '@/flow2/components/OfferingSummaryCard';

export default function VendorPackagesTab() {
  const { session, restored } = useSession();
  const enabled = API_ENABLED && restored && session.signedIn && session.mode === 'provider';
  const query = useGetVendorOfferingsQuery(undefined, { skip: !enabled });
  const offerings = rowsOf(query.data).map((row) => ({
    id: String(row.id ?? row.offering_id ?? ''),
    title: textOf(row, 'title', 'name') || 'Untitled offering',
    category: textOf(row, 'category', 'category_name'),
    description: textOf(row, 'description'),
    price: row.price_cents == null ? null : Number(row.price_cents),
    dishes: Array.isArray(row.dishes) ? row.dishes as string[] : undefined,
  })).filter((row) => row.id);

  return (
    <Screen
      loading={enabled && query.isLoading}
      refreshing={enabled && query.isFetching && !query.isLoading}
      onRefresh={enabled ? () => { void query.refetch(); } : undefined}
      style={query.isSuccess && offerings.length === 0 ? styles.emptyContent : undefined}
      header={<Header title="Packages" subtitle="Dishes you can offer, by category" right={(
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add package"
        onPress={() => router.push('/vendor/add-package')}
        style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}>
        <Icon name="plus" color="#FFFFFF" size={21} />
      </Pressable>
    )} />}>
      {query.isError ? <Notice tone="error" title="Offerings unavailable" body="The server did not return your offerings." /> : null}
      {query.isLoading ? <Text>Loading offerings…</Text> : null}
      {query.isSuccess && offerings.length === 0 ? <View style={styles.emptyState}><Text style={styles.emptyText}>No offerings returned by the server.</Text></View> : null}
      {offerings.map((item) => (
        <OfferingSummaryCard key={item.id} item={{ id: item.id, title: item.title, category: item.category, description: item.description, dishes: item.dishes, price_cents: item.price }} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyContent: { flexGrow: 1 },
  emptyState: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: palette.muted, textAlign: 'center' },
  addButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: palette.accentDark, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' },
  addButtonPressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },
});
