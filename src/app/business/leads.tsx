import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { PageTitle } from '@/components/Header';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { formatDate, leadLabel } from '@/data/format';
import { useApp } from '@/state/store';

export default function LeadsScreen() {
  const { leads, entitlements } = useApp();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  if (!entitlements.quoteLeads) {
    return (
      <Screen tab>
        <PageTitle title="Leads" subtitle="Quote requests from customers" />
        <EmptyState icon="lock" title="Leads need a paid plan" body="Your listing stays public. Upgrade to receive quote requests." action="View plans" onAction={() => router.push('/subscription')} />
      </Screen>
    );
  }

  return (
    <Screen tab>
      <PageTitle title="Leads" subtitle="Say if you are free, then send a quote." />
      {loading ? <LoadingState label="Loading leads" /> : null}
      {!loading && leads.length === 0 ? <EmptyState icon="inbox" title="No leads" body="When a request matches your area, capacity and services, it will appear here." /> : null}
      {!loading
        ? leads.map((lead) => (
            <Pressable key={lead.id} accessibilityRole="button" onPress={() => router.push(`/lead/${lead.id}`)} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.name}>{lead.request.eventType}</Text>
                <Badge label={leadLabel[lead.status]} tone={lead.status === 'continued' ? 'good' : 'neutral'} />
              </View>
              <Text style={styles.meta}>
                {lead.request.city} · {formatDate(lead.request.date)} · {lead.request.guests} guests
              </Text>
              <Text style={styles.meta}>
                {lead.quality.phoneVerified ? 'Phone verified' : 'Phone not verified'} · Completeness {lead.quality.completeness}
                {lead.quality.budgetProvided ? ' · Budget provided' : ''}
              </Text>
            </Pressable>
          ))
        : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.line, padding: 14, gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { fontSize: 17, fontWeight: '700', color: palette.ink, flex: 1 },
  meta: { color: palette.muted, fontSize: 14 },
});
