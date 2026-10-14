import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Icon } from '@/components/Icon';
import { LanguageDropdown } from '@/components/LanguageDropdown';
import { ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { useSignOut } from '@/hooks/use-sign-out';
import { useVendorProfileSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

export default function BusinessMenu() {
  const { me, session, setMode, entitlements, planById } = useApp();
  const { logOut, loggingOut } = useSignOut();
  useVendorProfileSync();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const plan = planById(session.planId);
  const kvk = me.kvkState === 'verified' ? 'KvK checked' : me.kvkState === 'pending' ? 'KvK still checking' : 'KvK not checked';
  return (
    <Screen tab>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel="Edit account" onPress={() => router.push('/account-edit')} style={styles.edit}>
          <Icon name="edit" color={palette.ink} size={18} />
        </Pressable>
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.push(`/providers/${me.id}`)} style={styles.hero}>
        <View style={[styles.photo, styles.photoEmpty, { backgroundColor: me.cover }]}>
          {me.photo ? <Image source={{ uri: me.photo }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Icon name="store" color="#fff" size={28} />}
        </View>
        <View style={styles.heroText}>
          <Text style={styles.name} numberOfLines={1}>{me.name}</Text>
          <Text style={styles.meta} numberOfLines={1}>{me.city} · {plan.name} plan</Text>
          <Text style={styles.link}>What customers see</Text>
        </View>
      </Pressable>
      <Card>
        <ListRow icon="edit" title="Edit your page" subtitle="Logo, name, city, story" onPress={() => router.push('/business-profile')} />
        <ListRow icon="verified" title="Business check" subtitle={kvk} onPress={() => router.push('/verification')} />
        <ListRow icon="card" title="Your plan" subtitle={plan.range} onPress={() => router.push('/subscription')} />
      </Card>
      <Card>
        <ListRow icon="person" title="Your account" subtitle="Photo, name, email, phone" onPress={() => router.push('/account-edit')} />
        <LanguageDropdown />
        <ListRow icon="filter" title="Jobs you want" subtitle="City, guests, cuisine" onPress={() => router.push('/preferences')} />
        <ListRow icon="calendar" title="Days you can cook" subtitle={entitlements.calendar ? 'Mark the days you are busy' : 'On Gold and Platinum'} onPress={() => router.push('/calendar')} />
        <ListRow icon="book" title="Saved quotes" subtitle="Reuse a price you already wrote" onPress={() => router.push('/templates')} />
        <ListRow icon="chart" title="How requests go" onPress={() => router.push('/analytics')} />
        <ListRow icon="star" title="Reviews" onPress={() => router.push('/provider-reviews')} />
        <ListRow icon="bell" title="Alerts" onPress={() => router.push('/notification-settings')} />
      </Card>
      <Card>
        <ListRow
          icon="person"
          title="Open the customer app"
          onPress={() => {
            setMode('customer');
            router.replace('/customer');
          }}
        />
        <ListRow
          icon="lock"
          title="Sign out"
          onPress={() => setSignOutOpen(true)}
        />
      </Card>
      <ConfirmModal
        visible={signOutOpen}
        title="Sign out?"
        body="You will leave this account. You can log in again later."
        confirmLabel="Sign out"
        danger
        loading={loggingOut}
        onClose={() => setSignOutOpen(false)}
        onConfirm={() => logOut(() => setSignOutOpen(false))}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'flex-end' },
  edit: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    padding: 12,
    borderRadius: 20,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
  },
  photo: { width: 72, height: 72, borderRadius: 18 },
  photoEmpty: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroText: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontSize: 20, fontWeight: '700', color: palette.ink },
  meta: { fontSize: 14, color: palette.muted },
  link: { fontSize: 14, fontWeight: '700', color: palette.accent, marginTop: 2 },
});
