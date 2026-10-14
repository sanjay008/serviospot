import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Icon, type IconName } from '@/components/Icon';
import { palette } from '@/constants/theme';
import { formatDate, leadLabel } from '@/data/format';
import type { Lead, LeadStatus } from '@/data/types';

export function eventIcon(eventType: string): IconName {
  const key = eventType.toLowerCase();
  if (key.includes('wedding')) return 'heartOn';
  if (key.includes('corporate') || key.includes('office')) return 'store';
  if (key.includes('family')) return 'people';
  return 'party';
}

function toneFor(status: LeadStatus, released: boolean): 'good' | 'gold' | 'warn' | 'neutral' {
  if (released || status === 'continued') return 'good';
  if (status === 'invited' || status === 'viewed') return 'gold';
  if (status === 'proposal_submitted' || status === 'proposal_draft') return 'warn';
  return 'neutral';
}

export function LeadCard({ lead, onPress }: { lead: Lead; onPress: () => void }) {
  const request = lead.request;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.photo}>
        <Icon name={eventIcon(request.eventType)} color={palette.accent} size={30} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>{request.eventType}</Text>
        <Text style={styles.meta} numberOfLines={2}>
          {request.city} · {formatDate(request.date)} · {request.guests} guests
        </Text>
        <Text style={styles.who} numberOfLines={1}>{lead.customerName}</Text>
        <Badge label={leadLabel[lead.status]} tone={toneFor(lead.status, lead.contactReleased)} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 10,
  },
  photo: { width: 84, height: 84, borderRadius: 14, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 4, minWidth: 0 },
  title: { fontSize: 16, fontWeight: '700', color: palette.ink },
  meta: { fontSize: 13, color: palette.muted },
  who: { fontSize: 13, color: palette.ink },
});
