import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { palette, shadow } from '@/constants/theme';
import { euro, perPersonCents, proposalTotal } from '@/data/format';
import type { Proposal, Provider } from '@/data/types';

const availabilityLabel = { available: 'Available', partial: 'Partial', maybe: 'Check date' };

export function ProposalCard({ proposal, provider, onPress }: { proposal: Proposal; provider?: Provider; onPress: () => void }) {
  const total = proposalTotal(proposal);
  const each = perPersonCents(total, proposal.guests);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <Avatar name={provider?.name ?? 'Provider'} color={provider?.cover ?? palette.accent} size={46} />
        <View style={styles.meta}>
          <Text style={styles.name} numberOfLines={1}>
            {provider?.name ?? 'Provider'}
          </Text>
          <Text style={styles.muted}>★ {provider?.rating.toFixed(1) ?? '–'} · {provider?.city}</Text>
          <View style={styles.tags}>
            <Badge label={availabilityLabel[proposal.availability]} tone={proposal.availability === 'available' ? 'good' : 'warn'} />
            {proposal.foodCents > 0 ? <Badge label="Food" /> : null}
            {proposal.staffCents > 0 ? <Badge label="Staff" /> : null}
          </View>
        </View>
        <View style={styles.priceCol}>
          <Text style={styles.price}>{euro(total)}</Text>
          <Text style={styles.each}>{each != null ? `${euro(each)} pp` : 'Indicative'}</Text>
          <Text style={styles.view}>View</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.line, padding: 14, ...shadow },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  meta: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontWeight: '700', color: palette.ink },
  muted: { fontSize: 13, color: palette.gold, fontWeight: '600' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  priceCol: { alignItems: 'flex-end', gap: 2 },
  price: { fontSize: 18, fontWeight: '800', color: palette.ink },
  each: { fontSize: 12, color: palette.muted },
  view: { marginTop: 4, color: palette.accent, fontWeight: '700', fontSize: 13 },
});
