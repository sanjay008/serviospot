import { router } from 'expo-router';
import { useState } from 'react';

import { apiActions } from '@/api/actions';
import { AuthScreen, AuthTitle, authButton } from '@/components/AuthScreen';
import { Button } from '@/components/Button';
import { ChipGroup } from '@/components/Chip';
import { LoadingState } from '@/components/LoadingState';
import { Notice } from '@/components/Notice';
import { toggleIn } from '@/data/format';
import { useCategoriesSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

export default function VendorServicesScreen() {
  const { me, categories, categoryName, updateProvider } = useApp();
  const loading = useCategoriesSync();
  const [services, setServices] = useState<string[]>(me.services);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <AuthScreen>
      <AuthTitle title="Your services" subtitle="Pick what customers will see on your page." />
      {error ? <Notice tone="error" body={error} /> : null}
      {loading ? <LoadingState label="Loading services" /> : null}
      <ChipGroup options={categories.map((item) => item.code)} labelOf={categoryName} selected={services} onToggle={(item) => setServices(toggleIn(services, item))} />
      <Button
        label="Go to home"
        style={authButton}
        loading={saving}
        onPress={async () => {
          if (services.length === 0) {
            setError('Pick at least one service.');
            return;
          }
          setSaving(true);
          const result = await apiActions.vendorServices(services);
          setSaving(false);
          if (!result.ok) {
            setError(result.reason);
            return;
          }
          updateProvider({ services });
          router.replace('/business');
        }}
      />
    </AuthScreen>
  );
}
