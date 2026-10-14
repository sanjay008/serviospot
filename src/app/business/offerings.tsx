import { router } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/Button';
import { Grid } from '@/components/Grid';
import { EmptyState } from '@/components/EmptyState';
import { PageTitle } from '@/components/Header';
import { OfferingCard } from '@/components/OfferingCard';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { ME } from '@/data/mock';
import { useResponsive } from '@/hooks/use-responsive';
import { useVendorOfferingsSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

export default function OfferingsScreen() {
  const { offerings, entitlements, setOfferingActive } = useApp();
  useVendorOfferingsSync();
  const { isTablet } = useResponsive();
  const [error, setError] = useState('');
  const mine = offerings.filter((item) => item.providerId === ME);
  const active = mine.filter((item) => item.active).length;
  return (
    <Screen tab refresh footer={<Button label="Add a dish" onPress={() => router.push('/offering-form/new')} />}>
      <PageTitle title="Your menu" subtitle={`${active} of ${entitlements.maxOfferings} dishes are on your page.`} />
      {error ? <Notice tone="error" body={error} /> : null}
      {mine.length === 0 ? <EmptyState icon="food" title="No offerings yet" body="Add a dish, menu, service or mobile unit from the master catalog." /> : null}
      {mine.length > 0 ? (
        <Grid minItem={300} maxColumns={isTablet ? 2 : 1} gap={12}>
          {mine.map((offering) => (
        <OfferingCard
          key={offering.id}
          offering={offering}
          onPress={() => router.push(`/offering-form/${offering.id}`)}
          onSave={async () => {
            const result = await setOfferingActive(offering.id, !offering.active);
            setError(result.ok ? '' : result.reason);
          }}
          actionLabel={offering.active ? 'Hide' : 'Show'}
        />
          ))}
        </Grid>
      ) : null}
    </Screen>
  );
}
