import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChipSingle } from '@/components/Chip';
import { Disclaimer } from '@/components/Disclaimer';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { euro, formatDate, perPersonCents, proposalTotal } from '@/data/format';
import { useRequestSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

export default function CompareScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { proposals, providers } = useApp();
  useRequestSync(requestId);
  const [sort, setSort] = useState('Match');
  const rows = proposals.filter((item) => item.requestId === requestId && item.status === 'submitted');
  const ordered = [...rows].sort((a, b) => {
    if (sort === 'Price') return proposalTotal(a) - proposalTotal(b);
    if (sort === 'Rating') return (providers.find((item) => item.id === b.providerId)?.rating ?? 0) - (providers.find((item) => item.id === a.providerId)?.rating ?? 0);
    return b.matchScore - a.matchScore;
  });
  return (
    <Screen refresh header={<Header title="Compare" subtitle="Indicative, not ranked by cheapest" back />}>
      <Disclaimer />
      <ChipSingle options={['Match', 'Rating', 'Price']} value={sort} onChange={setSort} />
      {sort === 'Price' ? <Text style={styles.note}>Sorting by price does not mean the lowest indication is the best fit.</Text> : null}
      {ordered.map((proposal) => {
        const provider = providers.find((item) => item.id === proposal.providerId);
        const total = proposalTotal(proposal);
        const each = perPersonCents(total, proposal.guests);
        return (
          <Card key={proposal.id}>
            <Text style={styles.name}>{provider?.name}</Text>
            <Text style={styles.meta}>{provider?.rating.toFixed(1)} · {provider?.verified ? 'Verified' : 'Not verified'} · {proposal.availability}</Text>
            <Text style={styles.price}>{euro(total)}{each != null ? ` · ${euro(each)} / person` : ''}</Text>
            <View style={styles.tags}>
              <Flag on={proposal.foodCents > 0} label="Food" />
              <Flag on={proposal.drinksCents > 0} label="Drinks" />
              <Flag on={proposal.staffCents > 0} label="Staff" />
              <Flag on={proposal.deliveryCents > 0} label="Delivery" />
              <Flag on={proposal.equipmentCents > 0} label="Equipment" />
            </View>
            <Text style={styles.meta}>Excluded: {proposal.excluded.join(', ')}</Text>
            <Text style={styles.meta}>Expires {formatDate(proposal.expiresAt)}</Text>
            <Text style={styles.body}>{proposal.message}</Text>
            <Button label="Open proposal" variant="secondary" onPress={() => router.push(`/proposal/${proposal.id}`)} />
          </Card>
        );
      })}
    </Screen>
  );
}

function Flag({ on, label }: { on: boolean; label: string }) {
  return <Badge label={`${on ? 'Yes' : 'No'} ${label}`} tone={on ? 'good' : 'neutral'} />;
}

const styles = StyleSheet.create({
  note: { color: palette.muted, fontSize: 13, lineHeight: 18 },
  name: { fontSize: 18, fontWeight: '700', color: palette.ink },
  price: { fontSize: 16, fontWeight: '700', color: palette.accent },
  meta: { fontSize: 13, lineHeight: 18, color: palette.muted },
  body: { fontSize: 14, lineHeight: 20, color: palette.ink },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
