import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { Screen } from '@/flow2/components/Screen';
import { API_ENABLED, useGetVendorOfferingsQuery, useSetOfferingActiveMutation } from '@/api';
import { useApp as useSession } from '@/state/store';
import { rowsOf, textOf } from '@/api/mappers';
import { Notice } from '@/flow2/components/Notice';
import { palette } from '@/flow2/constants/theme';
import { OfferingSummaryCard } from '@/flow2/components/OfferingSummaryCard';
import { useApp as useFlow } from '@/flow2/state/app';
import { useType } from '@/hooks/use-type';

export default function VendorPackagesTab() {
  const { session, restored } = useSession();
  const { t } = useFlow();
  const tx = (en: string) => t({ en, nl: en });
  const type = useType();
  const enabled = API_ENABLED && restored && session.signedIn && session.mode === 'provider';
  const query = useGetVendorOfferingsQuery(undefined, { skip: !enabled });
  const [setOfferingActive, activeState] = useSetOfferingActiveMutation();
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState('');
  const offerings = rowsOf(query.data).map((row) => ({
    id: String(row.id ?? row.offering_id ?? ''),
    title: textOf(row, 'title', 'name') || 'Untitled offering',
    category: textOf(row, 'category', 'category_name'),
    description: textOf(row, 'description'),
    price: row.price_cents == null ? null : Number(row.price_cents),
    dishes: Array.isArray(row.dishes) ? row.dishes as string[] : undefined,
    isActive: activeFromApi(row.is_active ?? row.active),
  })).filter((row) => row.id);
  const visibleCount = offerings.filter((item) => item.isActive).length;

  const toggleActive = async (id: string, next: boolean) => {
    setError('');
    setPendingId(id);
    try {
      await setOfferingActive({ offering_id: id, is_active: next }).unwrap();
    } catch (cause) {
      setError(cause && typeof cause === 'object' && 'message' in cause && typeof cause.message === 'string' ? cause.message : 'Could not update offering visibility.');
    } finally {
      setPendingId('');
    }
  };

  return (
    <Screen
      loading={enabled && query.isLoading}
      refreshing={enabled && query.isFetching && !query.isLoading}
      onRefresh={enabled ? () => { void query.refetch(); } : undefined}
      style={query.isSuccess && offerings.length === 0 ? styles.emptyContent : undefined}
      header={<Header title={tx('Your packages')} subtitle={tx('Manage the packages customers can request')} right={(
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add package"
          onPress={() => router.push('/vendor/add-package')}
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}>
          <Icon name="plus" color="#FFFFFF" size={21} />
        </Pressable>
      )} />}>
      {query.isError ? <Notice tone="error" title={tx('Offerings unavailable')} body={tx('The server did not return your offerings.')} /> : null}
      {error ? <Notice tone="error" body={error} /> : null}
      {query.isLoading ? <Text style={styles.loadingText}>Loading your packages…</Text> : null}
      {query.isSuccess && offerings.length > 0 ? (
        <View style={styles.summary}>
          <View style={styles.summaryIcon}><Icon name="box" color={palette.accentDark} size={19} /></View>
          <View style={styles.summaryCopy}>
            <Text style={[styles.summaryTitle, { fontSize: type.body }]}>Customer visibility</Text>
            <Text style={[styles.summaryText, { fontSize: type.small }]}>{visibleCount} of {offerings.length} packages are currently shown</Text>
          </View>
          <View style={styles.countBadge}><Text style={[styles.countText, { fontSize: type.caption }]}>{visibleCount}/{offerings.length}</Text></View>
        </View>
      ) : null}
      {query.isSuccess && offerings.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}><Icon name="box" color={palette.accentDark} size={25} /></View>
          <Text style={[styles.emptyTitle, { fontSize: type.cardTitle }]}>No packages yet</Text>
          <Text style={[styles.emptyText, { fontSize: type.secondary }]}>Add your first package to show customers what you can serve.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/vendor/add-package')} style={styles.emptyAction}>
            <Icon name="plus" color="#FFFFFF" size={18} />
            <Text style={[styles.emptyActionText, { fontSize: type.small }]}>Add a package</Text>
          </Pressable>
        </View>
      ) : null}
      {offerings.map((item) => (
        <View key={item.id} style={styles.packageItem}>
          <OfferingSummaryCard
            item={{ id: item.id, title: item.title, category: item.category, description: item.description, dishes: item.dishes, price_cents: item.price, is_active: item.isActive }}
            footer={(
              <View style={styles.visibilityRow}>
                <View style={[styles.visibilityIndicator, item.isActive ? styles.visibilityOn : styles.visibilityOff]}>
                  <View style={[styles.visibilityDot, item.isActive ? styles.visibilityDotOn : styles.visibilityDotOff]} />
                </View>
                <View style={styles.visibilityCopy}>
                  <Text style={[styles.visibilityTitle, { fontSize: type.small }]}>{item.isActive ? 'Visible to customers' : 'Hidden from customers'}</Text>
                  <Text style={[styles.visibilityHint, { fontSize: type.caption }]}>{item.isActive ? 'Customers can view and request this package.' : 'This package is not shown on your profile.'}</Text>
                </View>
                <Switch
                  accessibilityLabel={`${item.isActive ? 'Hide' : 'Show'} ${item.title} ${item.isActive ? 'from' : 'to'} customers`}
                  value={item.isActive}
                  disabled={activeState.isLoading && pendingId === item.id}
                  onValueChange={(value) => { void toggleActive(item.id, value); }}
                  trackColor={{ false: palette.line, true: palette.mint }}
                  thumbColor={item.isActive ? palette.mintDark : '#FFFFFF'}
                />
              </View>
            )}
          />
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyContent: { flexGrow: 1 },
  emptyState: { flex: 1, minHeight: 320, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 10 },
  emptyIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accentSoft, marginBottom: 4 },
  emptyTitle: { color: palette.ink, fontWeight: '800' },
  emptyText: { color: palette.muted, textAlign: 'center', lineHeight: 22 },
  emptyAction: { minHeight: 46, borderRadius: 14, paddingHorizontal: 16, marginTop: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: palette.accentDark },
  emptyActionText: { color: '#FFFFFF', fontWeight: '800' },
  loadingText: { color: palette.muted, paddingVertical: 12 },
  addButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: palette.accentDark, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' },
  addButtonPressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },
  summary: { minHeight: 70, borderRadius: 18, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: palette.accentSoft, borderWidth: 1, borderColor: '#E6DEFF' },
  summaryIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  summaryCopy: { flex: 1, gap: 3 },
  summaryTitle: { color: palette.ink, fontWeight: '800' },
  summaryText: { color: palette.muted },
  countBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#FFFFFF' },
  countText: { color: palette.accentDark, fontWeight: '800' },
  packageItem: { marginBottom: 12 },
  visibilityRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 10 },
  visibilityIndicator: { width: 10, height: 10, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  visibilityOn: { backgroundColor: palette.mint },
  visibilityOff: { backgroundColor: palette.line },
  visibilityDot: { width: 4, height: 4, borderRadius: 2 },
  visibilityDotOn: { backgroundColor: palette.mintDark },
  visibilityDotOff: { backgroundColor: palette.muted },
  visibilityCopy: { flex: 1, gap: 3 },
  visibilityTitle: { color: palette.ink, fontWeight: '800' },
  visibilityHint: { color: palette.muted, lineHeight: 17 },
});

function activeFromApi(value: unknown): boolean {
  if (value === false || value === 0 || value === '0' || value === 'false' || value === 'inactive') return false;
  return true;
}
