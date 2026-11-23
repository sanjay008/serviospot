import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { API_ENABLED, type ApiRecord, type VendorOffering, useGetVendorDashboardQuery, useGetVendorOfferingsQuery } from '@/api';
import { rowsOf } from '@/api/mappers';
import { Notice } from '@/components/Notice';
import { useApp as useSession } from '@/state/store';
import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { Screen } from '@/flow2/components/Screen';
import { OfferingSummaryCard } from '@/flow2/components/OfferingSummaryCard';
import { palette } from '@/flow2/constants/theme';
import { b } from '@/flow2/data/options';
import { useApp } from '@/flow2/state/app';
import { useResponsive } from '@/hooks/use-responsive';
import { useType } from '@/hooks/use-type';

type DashboardType = {
  metricValue: number;
  metricLabel: number;
  sectionTitle: number;
  sectionSub: number;
  icon: number;
};

function useDashboardType(): DashboardType {
  const scale = useType();
  const { width } = useResponsive();
  return {
    metricValue: scale.display,
    metricLabel: scale.small,
    sectionTitle: scale.sectionTitle,
    sectionSub: scale.small,
    icon: width < 360 ? 15 : width >= 768 ? 20 : 17,
  };
}

export default function VendorDashboardScreen() {
  const { t, onboarding } = useApp();
  const { session, restored } = useSession();
  const skipHomeQueries = !API_ENABLED || !restored || !session.signedIn || session.mode !== 'provider';
  const dashboardQuery = useGetVendorDashboardQuery(undefined, { skip: skipHomeQueries });
  const offeringsQuery = useGetVendorOfferingsQuery(undefined, { skip: skipHomeQueries });
  const type = useDashboardType();
  const dashboard = dashboardRecord(dashboardQuery.data);
  const dashboardNewLeads = dashboardCount(dashboard, ['to_answer', 'new_leads', 'newLeads', 'new_requests', 'newRequests', 'new_leads_count']);
  const dashboardSentProposals = dashboardCount(dashboard, ['prices_sent', 'sent_proposals', 'sentProposals', 'proposals_sent', 'proposalsSent', 'sent_proposals_count']);
  const newLeads = dashboardNewLeads ?? 0;
  const sentProposals = dashboardSentProposals ?? 0;
  const offerings = rowsOf(offeringsQuery.data) as VendorOffering[];

  return (
    <Screen
      loading={!skipHomeQueries && (dashboardQuery.isLoading || offeringsQuery.isLoading)}
      refreshing={!skipHomeQueries && (dashboardQuery.isFetching || offeringsQuery.isFetching) && !(dashboardQuery.isLoading || offeringsQuery.isLoading)}
      onRefresh={!skipHomeQueries ? () => { void Promise.all([dashboardQuery.refetch(), offeringsQuery.refetch()]); } : undefined}
      header={(
        <Header
          title={onboarding.profileName || t(b('Vendor dashboard', 'Vendor dashboard'))}
          subtitle={t(b('Overview van aanvragen en je pakketten', 'A clear overview of requests and your packages'))}
        />
      )}>
      {dashboardQuery.isError ? <Notice tone="error" title="Dashboard unavailable" body={queryErrorMessage(dashboardQuery.error)} /> : null}
      {offeringsQuery.isError ? <Notice tone="error" title="Offerings unavailable" body={queryErrorMessage(offeringsQuery.error)} /> : null}
      <View style={styles.metrics}>
        <MetricCard label={t(b('Nieuwe aanvragen', 'New requests'))} value={newLeads} icon="inbox" type={type} onPress={() => router.push({ pathname: '/vendor/leads', params: { view: 'requests' } } as any)} />
        <MetricCard label={t(b('Verstuurde voorstellen', 'Proposals sent'))} value={sentProposals} icon="send" type={type} onPress={() => router.push({ pathname: '/vendor/leads', params: { view: 'proposals' } } as any)} />
      </View>

      <View style={styles.sectionHeading}>
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionTitle, { fontSize: type.sectionTitle, lineHeight: type.sectionTitle + 6 }]}>{t(b('Jouw pakketten', 'Your packages'))}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add package"
            onPress={() => router.push('/vendor/add-package')}
            style={({ pressed }) => [styles.addPackageButton, pressed && styles.addPackageButtonPressed]}>
            <Icon name="plus" color="#FFFFFF" size={21} />
          </Pressable>
        </View>
        <Text style={[styles.sectionSub, { fontSize: type.sectionSub, lineHeight: type.sectionSub + 5 }]}>{t(b('Gerechten die je kunt aanbieden, en voor hoeveel mensen.', 'Dishes you can offer, and for how many people.'))}</Text>
      </View>

      {offeringsQuery.isLoading ? <Text style={styles.emptyText}>Loading offerings…</Text> : null}
      {offeringsQuery.isSuccess
        ? offerings?.length
          ? offerings.map((item) => <OfferingSummaryCard key={item.id} item={item} />)
          : <Text style={styles.emptyText}>No offering returned by the server.</Text>
        : null}
    </Screen>
  );
}

function dashboardRecord(data: ApiRecord | undefined): ApiRecord | undefined {
  if (!data) return undefined;
  for (const key of ['dashboard', 'counts', 'summary']) {
    const value = data[key];
    if (isApiRecord(value)) return value;
  }
  return data;
}

function isApiRecord(value: unknown): value is ApiRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function dashboardCount(data: ApiRecord | undefined, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = data?.[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  }
  return undefined;
}

function queryErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'Please try again later.';
}

function MetricCard({ label, value, icon, type, onPress }: { label: string; value: number; icon: 'inbox' | 'send'; type: DashboardType; onPress: () => void }) {
  return (
    <Card style={styles.metric}>
      <View style={styles.metricTop}>
        <View style={styles.metricIcon}><Icon name={icon} color={palette.accentDark} size={type.icon} /></View>
        <Text style={[styles.metricValue, { fontSize: type.metricValue, lineHeight: type.metricValue + 4 }]}>{value}</Text>
      </View>
      <Text style={[styles.metricLabel, { fontSize: type.metricLabel, lineHeight: type.metricLabel + 5 }]} numberOfLines={2}>{label}</Text>
      <Button label="View" variant="ghost" onPress={onPress} style={styles.metricAction} labelStyle={{ fontSize: type.metricLabel, lineHeight: type.metricLabel + 4 }} />
    </Card>
  );
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', gap: 10 },
  metric: { flex: 1, minWidth: 0, padding: 12, gap: 6 },
  metricTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
  metricValue: { color: palette.ink, fontWeight: '800' },
  metricLabel: { color: palette.muted, fontWeight: '600' },
  metricAction: { minHeight: 32, alignSelf: 'flex-start', paddingHorizontal: 0 },
  sectionHeading: { gap: 2 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: palette.ink, fontWeight: '700' },
  sectionSub: { color: palette.muted },
  addPackageButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: palette.accentDark, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' },
  addPackageButtonPressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },
  emptyText: { color: palette.muted, width: '100%', textAlign: 'center', paddingVertical: 24, alignSelf: 'center' },
});
