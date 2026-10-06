import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ErrorState } from '@/components/ErrorState';
import { Header } from '@/components/Header';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { useApp } from '@/state/store';

export default function AnalyticsScreen() {
  const { entitlements, leads, reviews, me, profileViews } = useApp();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    const timer = setTimeout(() => setStatus('ready'), 450);
    return () => clearTimeout(timer);
  }, []);
  if (entitlements.analytics === 'none') {
    return (
      <Screen header={<Header title="Analytics" back />}>
        <ErrorState title="Not on this plan" body="Basic statistics start on Starter. Upgrade to see the lead funnel." onRetry={() => router.push('/subscription')} />
      </Screen>
    );
  }
  const mine = reviews.filter((review) => review.providerId === me.id);
  const stats = [
    ['Profile views', profileViews.profile],
    ['Offering views', profileViews.offerings],
    ['Search appearances', profileViews.search],
    ['Leads received', leads.length],
    ['Leads viewed', leads.filter((lead) => lead.status !== 'invited').length],
    ['Availability replies', leads.filter((lead) => !['invited', 'viewed'].includes(lead.status)).length],
    ['Proposals sent', leads.filter((lead) => lead.proposalId).length],
    ['Contact releases', leads.filter((lead) => lead.contactReleased).length],
    ['Reviews', mine.length],
    ['Typical response', `${profileViews.responseHours} h`],
  ];
  return (
    <Screen header={<Header title="Analytics" subtitle={entitlements.analytics} back />}>
      <Text style={styles.note}>These are marketplace activity counts. They are not verified revenue.</Text>
      {status === 'loading' ? <LoadingState label="Loading funnel" /> : null}
      {status === 'ready' ? (
        <View style={styles.grid}>
          {stats.map(([label, value]) => (
            <View key={String(label)} style={styles.cell}>
              <Text style={styles.value}>{value}</Text>
              <Text style={styles.label}>{label}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {entitlements.analytics === 'basic' ? <Text style={styles.note}>Advanced breakdowns are on the Professional plan.</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { color: palette.muted, fontSize: 14, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: '47%', flexGrow: 1, backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.line, padding: 14, gap: 4 },
  value: { fontSize: 22, fontWeight: '700', color: palette.ink },
  label: { fontSize: 13, color: palette.muted },
});
