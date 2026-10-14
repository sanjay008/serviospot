import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Grid } from '@/components/Grid';
import { NotificationPrompt } from '@/components/NotificationPrompt';
import { Icon } from '@/components/Icon';
import { LeadCard } from '@/components/LeadCard';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { ME } from '@/data/mock';
import { useResponsive } from '@/hooks/use-responsive';
import { useNotificationsSync, useVendorHomeSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

const JOBS = [
  { key: 'new', label: 'To answer', icon: 'inbox' },
  { key: 'sent', label: 'Price sent', icon: 'send' },
  { key: 'picked', label: 'Picked you', icon: 'done' },
] as const;

export default function DashboardScreen() {
  const { me, leads, session, entitlements, notifications, offerings, planById } = useApp();
  useVendorHomeSync();
  useNotificationsSync('provider');
  const { isTablet } = useResponsive();
  const plan = planById(session.planId);
  const waiting = leads.filter((lead) => lead.status === 'invited' || lead.status === 'viewed');
  const sent = leads.filter((lead) => lead.status === 'proposal_submitted' || lead.status === 'continued').length;
  const picked = leads.filter((lead) => lead.contactReleased).length;
  const counts = { new: waiting.length, sent, picked };
  const unread = notifications.filter((item) => item.audience === 'provider' && !item.read).length;
  const menu = offerings.filter((item) => item.providerId === ME && item.active).slice(0, isTablet ? 7 : 4);

  return (
    <Screen tab refresh>
      <NotificationPrompt />
      <View style={styles.top}>
        <View style={styles.titles}>
          <Text style={styles.title} numberOfLines={2}>{me.name}</Text>
          <Text style={styles.sub}>A customer asks for a price. You answer. They pick one caterer.</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={() => router.push('/notifications')} style={styles.bell}>
          <Icon name="bell" color={palette.ink} size={18} />
          {unread > 0 ? <View style={styles.dot} /> : null}
        </Pressable>
      </View>

      <Pressable accessibilityRole="button" onPress={() => router.push(`/providers/${me.id}`)} style={styles.coverWrap}>
        <View style={[styles.cover, styles.center, { backgroundColor: me.cover }]}>
          {me.photo ? (
            <Image source={{ uri: me.photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          ) : (
            <Icon name="store" color="#fff" size={40} />
          )}
        </View>
        <View style={styles.scrim}>
          <Text style={styles.coverCity}>{me.city} · {me.cuisines.slice(0, 2).join(' · ')}</Text>
          <Text style={styles.coverLink}>{plan.name} plan · This is your public page</Text>
        </View>
      </Pressable>

      {!session.hasProviderProfile ? <Notice tone="warning" title="Finish your page" body="Add your business before customers can ask you for a price." /> : null}
      {!entitlements.quoteLeads ? <Notice tone="warning" title="Requests are off" body="The free plan only shows your page. Upgrade to receive quote requests." /> : null}

      <Grid minItem={88} maxColumns={3} gap={10}>
        {JOBS.map((job) => (
          <Pressable key={job.key} accessibilityRole="button" onPress={() => router.push(`/business/leads?filter=${job.key}`)} style={styles.tile}>
            <View>
              <View style={styles.well}>
                <Icon name={job.icon} color={palette.accent} size={26} />
              </View>
              <View style={styles.count}>
                <Text style={styles.countText}>{counts[job.key]}</Text>
              </View>
            </View>
            <Text style={styles.tileLabel} numberOfLines={2}>{job.label}</Text>
          </Pressable>
        ))}
      </Grid>

      <Text style={styles.section}>New requests</Text>
      {waiting.length === 0 ? <Text style={styles.empty}>No one is waiting. When a customer asks for a price, it shows up here.</Text> : null}
      {waiting.length > 0 ? (
        <Grid minItem={300} maxColumns={isTablet ? 2 : 1} gap={12}>
          {waiting.slice(0, 2).map((lead) => (
            <LeadCard key={lead.id} lead={lead} onPress={() => router.push(`/lead/${lead.id}`)} />
          ))}
        </Grid>
      ) : null}
      {waiting.length > 2 ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/business/leads?filter=new')}>
          <Text style={styles.more}>See all {waiting.length} requests</Text>
        </Pressable>
      ) : null}

      {menu.length > 0 ? <Text style={styles.section}>On your menu</Text> : null}
      {menu.length > 0 ? (
        <Grid minItem={72} maxColumns={isTablet ? 7 : 4} gap={10}>
          {menu.map((item) => (
            <Pressable key={item.id} accessibilityRole="button" onPress={() => router.push(`/offering-form/${item.id}`)} style={styles.tile}>
              <View style={[styles.dish, styles.center]}>
                {item.photo ? (
                  <Image source={{ uri: item.photo }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <Icon name="food" color={palette.accent} size={22} />
                )}
              </View>
              <Text style={styles.tileLabel} numberOfLines={2}>{item.title}</Text>
            </Pressable>
          ))}
        </Grid>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', paddingTop: 8 },
  titles: { flex: 1, gap: 2, minWidth: 0 },
  title: { fontSize: 24, fontWeight: '700', color: palette.ink, lineHeight: 30 },
  sub: { fontSize: 14, color: palette.muted, lineHeight: 20 },
  bell: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: palette.line, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface },
  dot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: palette.danger },
  coverWrap: { height: 180, borderRadius: 20, overflow: 'hidden', backgroundColor: palette.well },
  cover: { width: '100%', height: '100%' },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: 'rgba(30,27,75,0.55)' },
  coverCity: { color: '#fff', fontSize: 16, fontWeight: '700' },
  coverLink: { color: '#E4DEFF', fontSize: 13, marginTop: 2 },
  tile: { alignItems: 'center', gap: 6, width: '100%' },
  center: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  well: { width: 64, height: 64, borderRadius: 20, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
  dish: { width: 56, height: 56, borderRadius: 18, backgroundColor: palette.well },
  count: { position: 'absolute', top: -4, right: -4, minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' },
  countText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  tileLabel: { fontSize: 12, fontWeight: '600', color: palette.ink, textAlign: 'center' },
  section: { fontSize: 18, fontWeight: '700', color: palette.ink, marginTop: 4 },
  empty: { fontSize: 14, lineHeight: 20, color: palette.muted },
  more: { color: palette.accent, fontWeight: '700', fontSize: 14 },
});
