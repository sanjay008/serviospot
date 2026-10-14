import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { Grid } from '@/components/Grid';
import { EmptyState } from '@/components/EmptyState';
import { PageTitle } from '@/components/Header';
import { LeadCard } from '@/components/LeadCard';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { useResponsive } from '@/hooks/use-responsive';
import { useLeadsSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

const COPY = {
  new: { title: 'Waiting for you', subtitle: 'These customers asked for a price. Open one and say if you can do the event.' },
  sent: { title: 'Quotes you sent', subtitle: 'You already sent a price. The customer can compare and then choose.' },
  picked: { title: 'They picked you', subtitle: 'These customers chose you, so their phone and email are open.' },
  all: { title: 'Requests', subtitle: 'Every customer who asked you for a price.' },
} as const;

export default function LeadsScreen() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const key = filter === 'new' || filter === 'sent' || filter === 'picked' ? filter : 'all';
  const { leads, entitlements } = useApp();
  useLeadsSync();
  const { isTablet } = useResponsive();
  const visible = leads.filter((lead) => {
    if (key === 'new') return lead.status === 'invited' || lead.status === 'viewed';
    if (key === 'sent') return lead.status === 'proposal_submitted' || lead.status === 'continued';
    if (key === 'picked') return lead.contactReleased;
    return true;
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  if (!entitlements.quoteLeads) {
    return (
      <Screen tab refresh>
        <PageTitle title="Requests" subtitle="Customers who want a price from you" />
        <EmptyState icon="lock" title="Requests need a paid plan" body="Your listing stays public. Upgrade to receive quote requests." action="View plans" onAction={() => router.push('/subscription')} />
      </Screen>
    );
  }

  return (
    <Screen tab refresh>
      <PageTitle title={COPY[key].title} subtitle={COPY[key].subtitle} />
      {loading ? <LoadingState label="Loading requests" /> : null}
      {!loading && visible.length === 0 ? <EmptyState icon="inbox" title="Nothing in this list" body="When a request matches your area and services, it shows up under Waiting for you." /> : null}
      {!loading && visible.length > 0 ? (
        <Grid minItem={300} maxColumns={isTablet ? 2 : 1} gap={12}>
          {visible.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onPress={() => router.push(`/lead/${lead.id}`)} />
          ))}
        </Grid>
      ) : null}
    </Screen>
  );
}
