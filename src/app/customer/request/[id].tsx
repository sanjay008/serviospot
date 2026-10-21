import { router, useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { RequestSummary } from '@/flow2/components/RequestSummary';
import { Screen } from '@/flow2/components/Screen';
import { useApp } from '@/flow2/state/app';

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { requests } = useApp();
  const request = requests.find((item) => item.id === id);

  if (!request) {
    return (
      <Screen header={<Header title="My requirements" back />}>
        <EmptyState icon="doc" title="Request not found" body="This request does not exist." action="Back" onAction={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen header={<Header title="My requirements" subtitle={request.reference} back />}>
      <RequestSummary request={request} />
    </Screen>
  );
}
