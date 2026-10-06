import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { ListRow } from '@/components/ListRow';
import { Notice } from '@/components/Notice';
import { PageTitle } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { palette, shadow } from '@/constants/theme';
import { planById } from '@/data/mock';
import { useApp } from '@/state/store';

export default function DashboardScreen() {
  const { me, leads, session, entitlements, notifications } = useApp();
  const plan = planById(session.planId);
  const openLeads = leads.filter((lead) => lead.status === 'invited' || lead.status === 'viewed').length;
  const sent = leads.filter((lead) => lead.status === 'proposal_submitted' || lead.status === 'continued').length;
  const continued = leads.filter((lead) => lead.contactReleased).length;
  const unread = notifications.filter((item) => item.audience === 'provider' && !item.read).length;
  return (
    <Screen tab>
      <PageTitle title="Home" subtitle={`${me.name} · ${plan.name}`} />
      {!session.hasProviderProfile ? <Notice tone="warning" title="Finish your profile" body="Add your business before you can answer leads." /> : null}
      {!entitlements.quoteLeads ? <Notice tone="warning" title="Leads are off" body="The free plan only shows your listing. Upgrade to receive quote requests." /> : null}
      {me.kvkState !== 'verified' ? <Notice tone="info" title="Verification" body={`KvK: ${me.kvkState}. Customers see this on your profile.`} /> : null}
      <View style={styles.grid}>
        <Stat label="New leads" value={String(openLeads)} icon="inbox" color="#7C5CFF" well="#F3EFFF" onPress={() => router.push('/business/leads')} />
        <Stat label="Quotes sent" value={String(sent)} icon="doc" color="#0284C7" well="#E0F2FE" onPress={() => router.push('/business/leads')} />
        <Stat label="Contacts" value={String(continued)} icon="phone" color="#059669" well="#DCFCE7" onPress={() => router.push('/business/leads')} />
        <Stat label="Alerts" value={String(unread)} icon="bell" color="#D97706" well="#FEF3C7" onPress={() => router.push('/notifications')} />
      </View>
      <View style={styles.card}>
        <ListRow icon="inbox" title="Lead inbox" subtitle="People waiting for a quote" onPress={() => router.push('/business/leads')} />
        <ListRow icon="bell" title="Notifications" trailing={unread ? String(unread) : ''} onPress={() => router.push('/notifications')} />
        <ListRow icon="chart" title="Analytics" onPress={() => router.push('/analytics')} />
        <ListRow icon="book" title="Quote templates" onPress={() => router.push('/templates')} />
      </View>
    </Screen>
  );
}

function Stat({ label, value, icon, color, well, onPress }: { label: string; value: string; icon: IconName; color: string; well: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.stat}>
      <View style={[styles.well, { backgroundColor: well }]}>
        <Icon name={icon} color={color} size={16} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '47%', flexGrow: 1, backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.line, padding: 14, gap: 4, ...shadow },
  well: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '700', color: palette.ink },
  statLabel: { color: palette.muted, fontSize: 13 },
  card: { borderRadius: 16, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 14, ...shadow },
});
