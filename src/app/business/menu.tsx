import { router } from 'expo-router';

import { Card } from '@/components/Card';
import { PageTitle } from '@/components/Header';
import { ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { planById } from '@/data/mock';
import { useApp } from '@/state/store';

export default function BusinessMenu() {
  const { me, session, setMode, entitlements, signOut } = useApp();
  const plan = planById(session.planId);
  return (
    <Screen tab>
      <PageTitle
        title="More"
        subtitle={`${me.name} · ${plan.name}${entitlements.aiCredits ? ` · ${Math.max(entitlements.aiCredits - session.aiUsed, 0)} AI left` : ''}`}
      />
      <Card>
        <ListRow icon="store" title="Public profile" subtitle="What customers see" onPress={() => router.push(`/providers/${me.id}`)} />
        <ListRow icon="edit" title="Edit business profile" onPress={() => router.push('/business-profile')} />
        <ListRow icon="verified" title="Verification" subtitle={me.kvkState} onPress={() => router.push('/verification')} />
        <ListRow icon="card" title="Subscription" subtitle={plan.range} onPress={() => router.push('/subscription')} />
      </Card>
      <Card>
        <ListRow icon="filter" title="Lead preferences" onPress={() => router.push('/preferences')} />
        <ListRow icon="calendar" title="Availability calendar" subtitle={entitlements.calendar ? 'Optional' : 'Professional and Business'} onPress={() => router.push('/calendar')} />
        <ListRow icon="book" title="Proposal templates" onPress={() => router.push('/templates')} />
        <ListRow icon="chart" title="Analytics" onPress={() => router.push('/analytics')} />
        <ListRow icon="star" title="Reviews" onPress={() => router.push('/provider-reviews')} />
        <ListRow icon="bell" title="Notification settings" onPress={() => router.push('/notification-settings')} />
      </Card>
      <Card>
        <ListRow
          icon="person"
          title="Switch to customer"
          onPress={() => {
            setMode('customer');
            router.replace('/customer');
          }}
        />
        <ListRow
          icon="lock"
          title="Sign out"
          onPress={() => {
            signOut();
            router.replace('/login');
          }}
        />
      </Card>
    </Screen>
  );
}
