import { router } from 'expo-router';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { PageTitle } from '@/components/Header';
import { OfferingCard } from '@/components/OfferingCard';
import { Screen } from '@/components/Screen';
import { ME } from '@/data/mock';
import { useApp } from '@/state/store';

export default function OfferingsScreen() {
  const { offerings, entitlements, setOfferingActive } = useApp();
  const mine = offerings.filter((item) => item.providerId === ME);
  const active = mine.filter((item) => item.active).length;
  return (
    <Screen tab footer={<Button label="Add menu item" onPress={() => router.push('/offering-form/new')} />}>
      <PageTitle title="Menu" subtitle={`${active} of ${entitlements.maxOfferings} items live on this plan.`} />
      {mine.length === 0 ? <EmptyState icon="food" title="No offerings yet" body="Add a dish, menu, service or mobile unit from the master catalog." /> : null}
      {mine.map((offering) => (
        <OfferingCard
          key={offering.id}
          offering={offering}
          onPress={() => router.push(`/offering-form/${offering.id}`)}
          onSave={() => setOfferingActive(offering.id, !offering.active)}
          actionLabel={offering.active ? 'Hide' : 'Show'}
        />
      ))}
    </Screen>
  );
}
