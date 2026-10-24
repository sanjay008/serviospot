import { router } from 'expo-router';

import { Button } from '@/flow2/components/Button';
import { Header } from '@/flow2/components/Header';
import { PackageCard } from '@/flow2/components/PackageCard';
import { Screen } from '@/flow2/components/Screen';
import { useApp } from '@/flow2/state/app';

export default function VendorPackagesTab() {
  const { packages } = useApp();

  return (
    <Screen header={<Header title="Packages" subtitle="Dishes you can offer, by category" />}>
      <Button label="+ Add package" onPress={() => router.push('/vendor/add-package')} />
      {packages.map((item) => <PackageCard key={item.id} item={item} />)}
    </Screen>
  );
}
